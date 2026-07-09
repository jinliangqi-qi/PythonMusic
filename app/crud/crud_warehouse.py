from typing import List, Optional, Union, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.warehouse import Warehouse
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate

class CRUDWarehouse:
    async def get(self, db: AsyncSession, id: int) -> Optional[Warehouse]:
        query = select(Warehouse).where(Warehouse.id == id)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Warehouse]:
        query = select(Warehouse).where(Warehouse.name == name)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_by_code(self, db: AsyncSession, code: str) -> Optional[Warehouse]:
        query = select(Warehouse).where(Warehouse.code == code)
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
    ) -> List[Warehouse]:
        query = select(Warehouse)
        if name:
            query = query.where(Warehouse.name.ilike(f"%{name}%"))
        if status:
            query = query.where(Warehouse.status == status)
            
        query = query.order_by(Warehouse.sort_order.asc(), Warehouse.id.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_count(
        self, 
        db: AsyncSession, 
        *, 
        name: Optional[str] = None,
        status: Optional[str] = None
    ) -> int:
        query = select(func.count(Warehouse.id))
        if name:
            query = query.where(Warehouse.name.ilike(f"%{name}%"))
        if status:
            query = query.where(Warehouse.status == status)
        result = await db.execute(query)
        return result.scalar() or 0

    async def create(self, db: AsyncSession, obj_in: WarehouseCreate) -> Warehouse:
        db_obj = Warehouse(
            name=obj_in.name,
            code=obj_in.code,
            address=obj_in.address,
            contact_name=obj_in.contact_name,
            contact_phone=obj_in.contact_phone,
            sort_order=obj_in.sort_order,
            status=obj_in.status,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: Warehouse, obj_in: Union[WarehouseUpdate, Dict[str, Any]]
    ) -> Warehouse:
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

    async def remove(self, db: AsyncSession, *, id: int) -> Warehouse:
        query = select(Warehouse).where(Warehouse.id == id)
        result = await db.execute(query)
        db_obj = result.scalars().first()
        
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
            return db_obj
        return None

crud_warehouse = CRUDWarehouse()
