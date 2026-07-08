from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.inventory import Inventory
from app.models.product import Product
from app.schemas.inventory import InventoryAdjustCreate
from app.crud.crud_product import crud_product

class CRUDInventory:
    async def get(self, db: AsyncSession, id: int) -> Optional[Inventory]:
        query = select(Inventory).options(
            selectinload(Inventory.product)
        ).where(Inventory.id == id)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_multi(
        self, 
        db: AsyncSession, 
        *, 
        skip: int = 0, 
        limit: int = 100, 
        product_id: Optional[int] = None,
        change_type: Optional[str] = None
    ) -> List[Inventory]:
        query = select(Inventory).options(
            selectinload(Inventory.product)
        )
        if product_id:
            query = query.where(Inventory.product_id == product_id)
        if change_type:
            query = query.where(Inventory.change_type == change_type)
            
        query = query.order_by(Inventory.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_count(
        self, 
        db: AsyncSession, 
        *, 
        product_id: Optional[int] = None,
        change_type: Optional[str] = None
    ) -> int:
        query = select(func.count(Inventory.id))
        if product_id:
            query = query.where(Inventory.product_id == product_id)
        if change_type:
            query = query.where(Inventory.change_type == change_type)
        result = await db.execute(query)
        return result.scalar() or 0

    async def adjust(self, db: AsyncSession, obj_in: InventoryAdjustCreate, operator: str = "") -> Inventory:
        product = await crud_product.get(db, id=obj_in.product_id)
        if not product:
            raise ValueError("Product not found")
            
        before_qty = product.stock_qty
        after_qty = before_qty + obj_in.change_qty
        
        if after_qty < 0:
            raise ValueError("Stock cannot be negative")
            
        await crud_product.update_stock(db, product.id, obj_in.change_qty)
        
        db_obj = Inventory(
            product_id=obj_in.product_id,
            warehouse=obj_in.warehouse,
            change_type="adjust",
            change_qty=obj_in.change_qty,
            before_qty=before_qty,
            after_qty=after_qty,
            related_order_no=obj_in.related_order_no,
            operator=operator,
            remark=obj_in.remark,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def inventory_check(self, db: AsyncSession, product_id: int, actual_qty: int, operator: str = "", remark: str = "") -> Inventory:
        product = await crud_product.get(db, id=product_id)
        if not product:
            raise ValueError("Product not found")
            
        before_qty = product.stock_qty
        change_qty = actual_qty - before_qty
        after_qty = actual_qty
        
        await crud_product.update_stock(db, product.id, change_qty)
        
        db_obj = Inventory(
            product_id=product_id,
            change_type="inventory",
            change_qty=change_qty,
            before_qty=before_qty,
            after_qty=after_qty,
            operator=operator,
            remark=remark or f"盘点调整: {before_qty} -> {actual_qty}",
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

crud_inventory = CRUDInventory()