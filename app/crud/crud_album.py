from typing import List, Optional, Union, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.album import Album
from app.schemas.album import AlbumCreate, AlbumUpdate

class CRUDAlbum:
    async def get(self, db: AsyncSession, id: int) -> Optional[Album]:
        # 使用 selectinload 预加载关联的 singer 信息
        query = select(Album).options(selectinload(Album.singer)).where(Album.id == id)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_multi(
        self, 
        db: AsyncSession, 
        *, 
        skip: int = 0, 
        limit: int = 100, 
        title: Optional[str] = None,
        singer_id: Optional[int] = None
    ) -> List[Album]:
        query = select(Album).options(selectinload(Album.singer))
        if title:
            query = query.where(Album.title.ilike(f"%{title}%"))
        if singer_id:
            query = query.where(Album.singer_id == singer_id)
            
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
        
    async def get_count(
        self, 
        db: AsyncSession, 
        *, 
        title: Optional[str] = None,
        singer_id: Optional[int] = None
    ) -> int:
        query = select(func.count(Album.id))
        if title:
            query = query.where(Album.title.ilike(f"%{title}%"))
        if singer_id:
            query = query.where(Album.singer_id == singer_id)
        result = await db.execute(query)
        return result.scalar() or 0

    async def create(self, db: AsyncSession, obj_in: AlbumCreate) -> Album:
        db_obj = Album(
            title=obj_in.title,
            singer_id=obj_in.singer_id,
            cover=obj_in.cover,
            release_date=obj_in.release_date,
            description=obj_in.description,
            is_active=obj_in.is_active,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: Album, obj_in: Union[AlbumUpdate, Dict[str, Any]]
    ) -> Album:
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

    async def remove(self, db: AsyncSession, *, id: int) -> Album:
        obj = await self.get(db, id)
        await db.delete(obj)
        await db.commit()
        return obj

crud_album = CRUDAlbum()
