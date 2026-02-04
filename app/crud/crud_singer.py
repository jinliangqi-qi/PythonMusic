from typing import List, Optional, Union, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.singer import Singer
from app.schemas.singer import SingerCreate, SingerUpdate

class CRUDSinger:
    async def get(self, db: AsyncSession, id: int) -> Optional[Singer]:
        result = await db.execute(select(Singer).where(Singer.id == id))
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100, name: Optional[str] = None
    ) -> List[Singer]:
        query = select(Singer)
        if name:
            query = query.where(Singer.name.ilike(f"%{name}%"))
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
        
    async def get_count(self, db: AsyncSession, *, name: Optional[str] = None) -> int:
        query = select(func.count(Singer.id))
        if name:
            query = query.where(Singer.name.ilike(f"%{name}%"))
        result = await db.execute(query)
        return result.scalar() or 0

    async def create(self, db: AsyncSession, obj_in: SingerCreate) -> Singer:
        db_obj = Singer(
            name=obj_in.name,
            gender=obj_in.gender,
            region=obj_in.region,
            bio=obj_in.bio,
            avatar=obj_in.avatar,
            debut_date=obj_in.debut_date,
            is_active=obj_in.is_active,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: Singer, obj_in: Union[SingerUpdate, Dict[str, Any]]
    ) -> Singer:
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

    async def remove(self, db: AsyncSession, *, id: int) -> Singer:
        obj = await self.get(db, id)
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj

crud_singer = CRUDSinger()
