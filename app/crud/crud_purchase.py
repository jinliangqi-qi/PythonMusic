from typing import List, Optional, Union, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime
import uuid

from app.models.purchase import PurchaseOrder, PurchaseOrderItem
from app.models.product import Product
from app.models.inventory import Inventory
from app.schemas.purchase import PurchaseOrderCreate, PurchaseOrderUpdate
from app.crud.crud_product import crud_product

class CRUDPurchaseOrder:
    async def generate_order_no(self) -> str:
        return f"PO{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"

    async def get(self, db: AsyncSession, id: int) -> Optional[PurchaseOrder]:
        query = select(PurchaseOrder).options(
            selectinload(PurchaseOrder.supplier),
            selectinload(PurchaseOrder.items).selectinload(PurchaseOrderItem.product)
        ).where(PurchaseOrder.id == id)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_by_order_no(self, db: AsyncSession, order_no: str) -> Optional[PurchaseOrder]:
        query = select(PurchaseOrder).where(PurchaseOrder.order_no == order_no)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_multi(
        self, 
        db: AsyncSession, 
        *, 
        skip: int = 0, 
        limit: int = 100, 
        supplier_id: Optional[int] = None,
        status: Optional[str] = None,
        order_no: Optional[str] = None
    ) -> List[PurchaseOrder]:
        query = select(PurchaseOrder).options(
            selectinload(PurchaseOrder.supplier),
            selectinload(PurchaseOrder.items).selectinload(PurchaseOrderItem.product)
        )
        if supplier_id:
            query = query.where(PurchaseOrder.supplier_id == supplier_id)
        if status:
            query = query.where(PurchaseOrder.status == status)
        if order_no:
            query = query.where(PurchaseOrder.order_no.ilike(f"%{order_no}%"))
            
        query = query.order_by(PurchaseOrder.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_count(
        self, 
        db: AsyncSession, 
        *, 
        supplier_id: Optional[int] = None,
        status: Optional[str] = None,
        order_no: Optional[str] = None
    ) -> int:
        query = select(func.count(PurchaseOrder.id))
        if supplier_id:
            query = query.where(PurchaseOrder.supplier_id == supplier_id)
        if status:
            query = query.where(PurchaseOrder.status == status)
        if order_no:
            query = query.where(PurchaseOrder.order_no.ilike(f"%{order_no}%"))
        result = await db.execute(query)
        return result.scalar() or 0

    async def create(self, db: AsyncSession, obj_in: PurchaseOrderCreate, operator: str = "") -> PurchaseOrder:
        order_no = await self.generate_order_no()
        total_amount = sum(item.quantity * item.unit_price for item in obj_in.items)
        
        db_obj = PurchaseOrder(
            order_no=order_no,
            supplier_id=obj_in.supplier_id,
            delivery_date=obj_in.delivery_date,
            total_amount=total_amount,
            remark=obj_in.remark,
        )
        db.add(db_obj)
        await db.flush()
        
        for item in obj_in.items:
            product = await crud_product.get(db, id=item.product_id)
            if not product:
                raise ValueError(f"Product with id {item.product_id} not found")
                
            item_obj = PurchaseOrderItem(
                purchase_order_id=db_obj.id,
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
        self, db: AsyncSession, *, db_obj: PurchaseOrder, obj_in: Union[PurchaseOrderUpdate, Dict[str, Any]]
    ) -> PurchaseOrder:
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

    async def receive(self, db: AsyncSession, id: int, operator: str = "") -> PurchaseOrder:
        order = await self.get(db, id=id)
        if not order:
            raise ValueError("Purchase order not found")
            
        if order.status not in ["approved", "delivered"]:
            raise ValueError("Order must be approved or delivered to receive")
            
        for item in order.items:
            product = await crud_product.get(db, id=item.product_id)
            if product:
                actual_qty = item.quantity - item.received_qty
                if actual_qty > 0:
                    before_qty = product.stock_qty
                    await crud_product.update_stock(db, product.id, actual_qty)
                    item.received_qty = item.quantity
                    
                    inventory = Inventory(
                        product_id=product.id,
                        change_type="purchase",
                        change_qty=actual_qty,
                        before_qty=before_qty,
                        after_qty=before_qty + actual_qty,
                        related_order_no=order.order_no,
                        operator=operator,
                        remark=f"采购入库: {order.order_no}"
                    )
                    db.add(inventory)
        
        order.status = "completed"
        await db.commit()
        await db.refresh(order)
        return order

    async def cancel(self, db: AsyncSession, id: int, operator: str = "") -> PurchaseOrder:
        order = await self.get(db, id=id)
        if not order:
            raise ValueError("Purchase order not found")
            
        if order.status in ["completed", "cancelled"]:
            raise ValueError(f"Cannot cancel order with status {order.status}")
        
        if order.status in ["delivered", "completed"]:
            for item in order.items:
                product = await crud_product.get(db, id=item.product_id)
                if product and item.received_qty > 0:
                    before_qty = product.stock_qty
                    await crud_product.update_stock(db, product.id, -item.received_qty)
                    
                    inventory = Inventory(
                        product_id=product.id,
                        change_type="adjust",
                        change_qty=-item.received_qty,
                        before_qty=before_qty,
                        after_qty=before_qty - item.received_qty,
                        related_order_no=order.order_no,
                        operator=operator,
                        remark=f"取消采购单: {order.order_no}"
                    )
                    db.add(inventory)
        
        order.status = "cancelled"
        await db.commit()
        await db.refresh(order)
        return order

    async def pay(self, db: AsyncSession, id: int, amount: float, operator: str = "") -> PurchaseOrder:
        order = await self.get(db, id=id)
        if not order:
            raise ValueError("Purchase order not found")
            
        if order.status == "cancelled":
            raise ValueError("Cannot pay cancelled order")
        
        if amount <= 0:
            raise ValueError("Payment amount must be greater than 0")
        
        new_paid = order.paid_amount + amount
        if new_paid > order.total_amount:
            raise ValueError("Payment amount exceeds total amount")
        
        order.paid_amount = new_paid
        
        if new_paid >= order.total_amount:
            if order.status in ["pending", "approved", "delivered"]:
                order.status = "paid"
        
        await db.commit()
        await db.refresh(order)
        return order

    async def remove(self, db: AsyncSession, *, id: int) -> PurchaseOrder:
        query = select(PurchaseOrder).where(PurchaseOrder.id == id)
        result = await db.execute(query)
        db_obj = result.scalars().first()
        
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
            return db_obj
        return None

crud_purchase = CRUDPurchaseOrder()