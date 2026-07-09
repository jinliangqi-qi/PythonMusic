from typing import List, Optional, Union, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime
import uuid

from app.models.sales import SalesOrder, SalesOrderItem
from app.models.product import Product
from app.models.inventory import Inventory
from app.schemas.sales import SalesOrderCreate, SalesOrderUpdate
from app.crud.crud_product import crud_product

class CRUDSalesOrder:
    async def generate_order_no(self) -> str:
        return f"SO{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"

    async def get(self, db: AsyncSession, id: int) -> Optional[SalesOrder]:
        query = select(SalesOrder).options(
            selectinload(SalesOrder.customer),
            selectinload(SalesOrder.items).selectinload(SalesOrderItem.product)
        ).where(SalesOrder.id == id)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_by_order_no(self, db: AsyncSession, order_no: str) -> Optional[SalesOrder]:
        query = select(SalesOrder).where(SalesOrder.order_no == order_no)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_multi(
        self, 
        db: AsyncSession, 
        *, 
        skip: int = 0, 
        limit: int = 100, 
        customer_id: Optional[int] = None,
        status: Optional[str] = None,
        order_no: Optional[str] = None
    ) -> List[SalesOrder]:
        query = select(SalesOrder).options(
            selectinload(SalesOrder.customer),
            selectinload(SalesOrder.items).selectinload(SalesOrderItem.product)
        )
        if customer_id:
            query = query.where(SalesOrder.customer_id == customer_id)
        if status:
            query = query.where(SalesOrder.status == status)
        if order_no:
            query = query.where(SalesOrder.order_no.ilike(f"%{order_no}%"))
            
        query = query.order_by(SalesOrder.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_count(
        self, 
        db: AsyncSession, 
        *, 
        customer_id: Optional[int] = None,
        status: Optional[str] = None,
        order_no: Optional[str] = None
    ) -> int:
        query = select(func.count(SalesOrder.id))
        if customer_id:
            query = query.where(SalesOrder.customer_id == customer_id)
        if status:
            query = query.where(SalesOrder.status == status)
        if order_no:
            query = query.where(SalesOrder.order_no.ilike(f"%{order_no}%"))
        result = await db.execute(query)
        return result.scalar() or 0

    async def create(self, db: AsyncSession, obj_in: SalesOrderCreate, operator: str = "") -> SalesOrder:
        order_no = await self.generate_order_no()
        total_amount = sum(item.quantity * item.unit_price for item in obj_in.items)
        
        db_obj = SalesOrder(
            order_no=order_no,
            customer_id=obj_in.customer_id,
            delivery_date=obj_in.delivery_date,
            total_amount=total_amount,
            remark=obj_in.remark,
        )
        db.add(db_obj)
        await db.flush()
        
        for item in obj_in.items:
            item_obj = SalesOrderItem(
                sales_order_id=db_obj.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                amount=item.quantity * item.unit_price,
                remark=item.remark,
            )
            db.add(item_obj)
        
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: SalesOrder, obj_in: Union[SalesOrderUpdate, Dict[str, Any]]
    ) -> SalesOrder:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
            
        for field, value in update_data.items():
            setattr(db_obj, field, value)
            
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def ship(self, db: AsyncSession, id: int, operator: str = "") -> SalesOrder:
        order = await self.get(db, id=id)
        if not order:
            raise ValueError("Sales order not found")
            
        if order.status != "approved":
            raise ValueError("Order must be approved to ship")
            
        for item in order.items:
            product = await crud_product.get(db, id=item.product_id)
            if not product or product.stock_qty < item.quantity - item.shipped_qty:
                raise ValueError(f"Insufficient stock for product {item.product_id}")
            
            before_qty = product.stock_qty
            await crud_product.update_stock(db, product.id, -(item.quantity - item.shipped_qty))
            item.shipped_qty = item.quantity
            
            inventory = Inventory(
                product_id=product.id,
                change_type="sale",
                change_qty=-(item.quantity),
                before_qty=before_qty,
                after_qty=before_qty - item.quantity,
                related_order_no=order.order_no,
                operator=operator,
                remark=f"销售出库: {order.order_no}"
            )
            db.add(inventory)
        
        order.status = "shipped"
        await db.commit()
        await db.refresh(order)
        return order

    async def complete(self, db: AsyncSession, id: int) -> SalesOrder:
        order = await self.get(db, id=id)
        if not order:
            raise ValueError("Sales order not found")
            
        order.status = "completed"
        await db.commit()
        await db.refresh(order)
        return order

    async def cancel(self, db: AsyncSession, id: int, operator: str = "") -> SalesOrder:
        order = await self.get(db, id=id)
        if not order:
            raise ValueError("Sales order not found")
            
        if order.status in ["completed", "cancelled"]:
            raise ValueError(f"Cannot cancel order with status {order.status}")
        
        if order.status in ["shipped", "completed"]:
            for item in order.items:
                product = await crud_product.get(db, id=item.product_id)
                if product and item.shipped_qty > 0:
                    before_qty = product.stock_qty
                    await crud_product.update_stock(db, product.id, item.shipped_qty)
                    
                    inventory = Inventory(
                        product_id=product.id,
                        change_type="adjust",
                        change_qty=item.shipped_qty,
                        before_qty=before_qty,
                        after_qty=before_qty + item.shipped_qty,
                        related_order_no=order.order_no,
                        operator=operator,
                        remark=f"取消销售单: {order.order_no}"
                    )
                    db.add(inventory)
        
        order.status = "cancelled"
        await db.commit()
        await db.refresh(order)
        return order

    async def receive_payment(self, db: AsyncSession, id: int, amount: float, operator: str = "") -> SalesOrder:
        order = await self.get(db, id=id)
        if not order:
            raise ValueError("Sales order not found")
            
        if order.status == "cancelled":
            raise ValueError("Cannot receive payment for cancelled order")
        
        if amount <= 0:
            raise ValueError("Payment amount must be greater than 0")
        
        new_paid = order.paid_amount + amount
        if new_paid > order.total_amount:
            raise ValueError("Payment amount exceeds total amount")
        
        order.paid_amount = new_paid
        
        if new_paid >= order.total_amount:
            if order.status in ["pending", "approved", "shipped"]:
                order.status = "paid"
        
        await db.commit()
        await db.refresh(order)
        return order

    async def remove(self, db: AsyncSession, *, id: int) -> SalesOrder:
        query = select(SalesOrder).where(SalesOrder.id == id)
        result = await db.execute(query)
        db_obj = result.scalars().first()
        
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
            return db_obj
        return None

crud_sales = CRUDSalesOrder()