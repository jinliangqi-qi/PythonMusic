from typing import List, Optional, Union, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate

class CRUDCategory:
    async def get(self, db: AsyncSession, id: int) -> Optional[Category]:
        query = select(Category).where(Category.id == id)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Category]:
        query = select(Category).where(Category.name == name)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_by_code(self, db: AsyncSession, code: str) -> Optional[Category]:
        query = select(Category).where(Category.code == code)
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
    ) -> List[Category]:
        query = select(Category)
        if name:
            query = query.where(Category.name.ilike(f"%{name}%"))
        if status:
            query = query.where(Category.status == status)
            
        query = query.order_by(Category.sort_order.asc(), Category.id.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_count(
        self, 
        db: AsyncSession, 
        *, 
        name: Optional[str] = None,
        status: Optional[str] = None
    ) -> int:
        query = select(func.count(Category.id))
        if name:
            query = query.where(Category.name.ilike(f"%{name}%"))
        if status:
            query = query.where(Category.status == status)
        result = await db.execute(query)
        return result.scalar() or 0

    async def create(self, db: AsyncSession, obj_in: CategoryCreate) -> Category:
        db_obj = Category(
            name=obj_in.name,
            code=obj_in.code,
            description=obj_in.description,
            sort_order=obj_in.sort_order,
            parent_id=obj_in.parent_id,
            status=obj_in.status,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: Category, obj_in: Union[CategoryUpdate, Dict[str, Any]]
    ) -> Category:
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

    async def remove(self, db: AsyncSession, *, id: int) -> Category:
        query = select(Category).where(Category.id == id)
        result = await db.execute(query)
        db_obj = result.scalars().first()
        
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
            return db_obj
        return None

crud_category = CRUDCategory()
