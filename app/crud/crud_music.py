from typing import List, Optional, Union, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
from fastapi.encoders import jsonable_encoder

from app.models.music import Music
from app.schemas.music import MusicCreate, MusicUpdate
from app.core.cache import cache

class CRUDMusic:
    async def get(self, db: AsyncSession, id: int) -> Optional[Music]:
        # 预加载 singer 和 album 和 tags
        query = select(Music).options(
            selectinload(Music.singer),
            selectinload(Music.album),
            selectinload(Music.tags)
        ).where(Music.id == id)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_cached(self, db: AsyncSession, id: int) -> Optional[dict]:
        # Try cache first
        cache_key = f"music:detail:{id}"
        cached_data = await cache.get(cache_key)
        if cached_data:
            return cached_data

        obj = await self.get(db, id)
        if obj:
            data = jsonable_encoder(obj)
            await cache.set(cache_key, data, expire=300)
            return data
        return None

    async def get_multi(
        self, 
        db: AsyncSession, 
        *, 
        skip: int = 0, 
        limit: int = 100, 
        title: Optional[str] = None,
        singer_id: Optional[int] = None,
        album_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> List[Music]:
        # Cache key for hot queries (only status=active, first few pages)
        is_cacheable = (not title and not singer_id and not album_id and status == 'active' and skip < 50)
        cache_key = f"music:list:{skip}:{limit}:{status}"
        
        if is_cacheable:
            cached_data = await cache.get(cache_key)
            if cached_data:
                return cached_data

        query = select(Music).options(
            selectinload(Music.singer),
            selectinload(Music.album),
            selectinload(Music.tags)
        )
        if title:
            query = query.where(Music.title.ilike(f"%{title}%"))
        if singer_id:
            query = query.where(Music.singer_id == singer_id)
        if album_id:
            query = query.where(Music.album_id == album_id)
        if status:
            query = query.where(Music.status == status)
            
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        data = result.scalars().all()
        
        if is_cacheable:
            await cache.set(cache_key, jsonable_encoder(data), expire=60)
            
        return data
        
    async def get_count(
        self, 
        db: AsyncSession, 
        *, 
        title: Optional[str] = None,
        singer_id: Optional[int] = None,
        album_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> int:
        query = select(func.count(Music.id))
        if title:
            query = query.where(Music.title.ilike(f"%{title}%"))
        if singer_id:
            query = query.where(Music.singer_id == singer_id)
        if album_id:
            query = query.where(Music.album_id == album_id)
        if status:
            query = query.where(Music.status == status)
        result = await db.execute(query)
        return result.scalar() or 0

    async def create(self, db: AsyncSession, obj_in: MusicCreate) -> Music:
        db_obj = Music(
            title=obj_in.title,
            singer_id=obj_in.singer_id,
            album_id=obj_in.album_id,
            file_path=obj_in.file_path,
            cover=obj_in.cover,
            duration=obj_in.duration,
            size=obj_in.size,
            status=obj_in.status,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: Music, obj_in: Union[MusicUpdate, Dict[str, Any]]
    ) -> Music:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
            
        for field, value in update_data.items():
            setattr(db_obj, field, value)
            
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        
        # Invalidate cache
        await cache.delete(f"music:detail:{db_obj.id}")
        
        return db_obj

    async def remove(self, db: AsyncSession, *, id: int) -> Music:
        # Re-fetch for delete to ensure attached to session
        query = select(Music).where(Music.id == id)
        result = await db.execute(query)
        db_obj = result.scalars().first()
        
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
            await cache.delete(f"music:detail:{id}")
            return db_obj
        return None

    async def increment_play_count(self, db: AsyncSession, id: int) -> None:
        """增加播放量"""
        stmt = update(Music).where(Music.id == id).values(play_count=Music.play_count + 1)
        await db.execute(stmt)
        await db.commit()

crud_music = CRUDMusic()
