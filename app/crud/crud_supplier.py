from typing import List, Optional, Union, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate

class CRUDSupplier:
    async def get(self, db: AsyncSession, id: int) -> Optional[Supplier]:
        query = select(Supplier).where(Supplier.id == id)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_multi(
        self, 
        db: AsyncSession, 
        *, 
        skip: int = 0, 
        limit: int = 100, 
        name: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Supplier]:
        query = select(Supplier)
        if name:
            query = query.where(Supplier.name.ilike(f"%{name}%"))
        if status:
            query = query.where(Supplier.status == status)
            
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_count(
        self, 
        db: AsyncSession, 
        *, 
        name: Optional[str] = None,
        status: Optional[str] = None
    ) -> int:
        query = select(func.count(Supplier.id))
        if name:
            query = query.where(Supplier.name.ilike(f"%{name}%"))
        if status:
            query = query.where(Supplier.status == status)
        result = await db.execute(query)
        return result.scalar() or 0

    async def create(self, db: AsyncSession, obj_in: SupplierCreate) -> Supplier:
        db_obj = Supplier(
            name=obj_in.name,
            contact_name=obj_in.contact_name,
            phone=obj_in.phone,
            email=obj_in.email,
            address=obj_in.address,
            tax_id=obj_in.tax_id,
            status=obj_in.status,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: Supplier, obj_in: Union[SupplierUpdate, Dict[str, Any]]
    ) -> Supplier:
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

    async def remove(self, db: AsyncSession, *, id: int) -> Supplier:
        query = select(Supplier).where(Supplier.id == id)
        result = await db.execute(query)
        db_obj = result.scalars().first()
        
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
            return db_obj
        return None

crud_supplier = CRUDSupplier()