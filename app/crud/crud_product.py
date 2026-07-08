from typing import List, Optional, Union, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
from fastapi.encoders import jsonable_encoder

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.core.cache import cache

class CRUDProduct:
    async def get(self, db: AsyncSession, id: int) -> Optional[Product]:
        query = select(Product).options(
            selectinload(Product.supplier)
        ).where(Product.id == id)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_by_sku(self, db: AsyncSession, sku: str) -> Optional[Product]:
        query = select(Product).where(Product.sku == sku)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_multi(
        self, 
        db: AsyncSession, 
        *, 
        skip: int = 0, 
        limit: int = 100, 
        name: Optional[str] = None,
        sku: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        supplier_id: Optional[int] = None
    ) -> List[Product]:
        query = select(Product).options(
            selectinload(Product.supplier)
        )
        if name:
            query = query.where(Product.name.ilike(f"%{name}%"))
        if sku:
            query = query.where(Product.sku.ilike(f"%{sku}%"))
        if category:
            query = query.where(Product.category == category)
        if status:
            query = query.where(Product.status == status)
        if supplier_id:
            query = query.where(Product.supplier_id == supplier_id)
            
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_count(
        self, 
        db: AsyncSession, 
        *, 
        name: Optional[str] = None,
        sku: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        supplier_id: Optional[int] = None
    ) -> int:
        query = select(func.count(Product.id))
        if name:
            query = query.where(Product.name.ilike(f"%{name}%"))
        if sku:
            query = query.where(Product.sku.ilike(f"%{sku}%"))
        if category:
            query = query.where(Product.category == category)
        if status:
            query = query.where(Product.status == status)
        if supplier_id:
            query = query.where(Product.supplier_id == supplier_id)
        result = await db.execute(query)
        return result.scalar() or 0

    async def create(self, db: AsyncSession, obj_in: ProductCreate) -> Product:
        db_obj = Product(
            name=obj_in.name,
            sku=obj_in.sku,
            barcode=obj_in.barcode,
            category=obj_in.category,
            unit=obj_in.unit,
            purchase_price=obj_in.purchase_price,
            sale_price=obj_in.sale_price,
            cost_price=obj_in.cost_price,
            supplier_id=obj_in.supplier_id,
            stock_qty=obj_in.stock_qty,
            min_stock=obj_in.min_stock,
            max_stock=obj_in.max_stock,
            description=obj_in.description,
            image=obj_in.image,
            status=obj_in.status,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: Product, obj_in: Union[ProductUpdate, Dict[str, Any]]
    ) -> Product:
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

    async def remove(self, db: AsyncSession, *, id: int) -> Product:
        query = select(Product).where(Product.id == id)
        result = await db.execute(query)
        db_obj = result.scalars().first()
        
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
            return db_obj
        return None

    async def update_stock(self, db: AsyncSession, id: int, delta: int) -> None:
        stmt = update(Product).where(Product.id == id).values(stock_qty=Product.stock_qty + delta)
        await db.execute(stmt)
        await db.commit()

    async def get_low_stock_products(self, db: AsyncSession) -> List[Product]:
        query = select(Product).where(Product.stock_qty <= Product.min_stock)
        result = await db.execute(query)
        return result.scalars().all()

crud_product = CRUDProduct()