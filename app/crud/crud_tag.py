from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.tag import Tag
from app.models.music import Music
from app.schemas.tag import TagCreate, TagUpdate

class CRUDTag:
    async def get(self, db: AsyncSession, id: int) -> Optional[Tag]:
        result = await db.execute(select(Tag).where(Tag.id == id))
        return result.scalars().first()

    async def get_multi(self, db: AsyncSession, *, skip: int = 0, limit: int = 100) -> List[Tag]:
        result = await db.execute(select(Tag).offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, db: AsyncSession, obj_in: TagCreate) -> Tag:
        db_obj = Tag(name=obj_in.name)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, *, db_obj: Tag, obj_in: TagUpdate) -> Tag:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
            
        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])
                
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, *, id: int) -> Tag:
        result = await db.execute(select(Tag).where(Tag.id == id))
        obj = result.scalars().first()
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj

    async def add_tags_to_music(self, db: AsyncSession, music_id: int, tag_ids: List[int]):
        """关联音乐与标签"""
        # 1. 获取音乐
        # 注意：这里需要确保 tags 关系已加载，否则直接赋值可能会有问题，或者直接用 append/remove
        # 但对于 set 关系，直接赋值 music.tags = [...] 是最方便的，前提是 music 关联在 session 中
        music_query = select(Music).options(selectinload(Music.tags)).where(Music.id == music_id)
        result = await db.execute(music_query)
        music = result.scalars().first()
        if not music:
            return None
            
        # 2. 获取标签
        if not tag_ids:
            music.tags = []
        else:
            tags_result = await db.execute(select(Tag).where(Tag.id.in_(tag_ids)))
            tags = tags_result.scalars().all()
            music.tags = tags
        
        await db.commit()
        return music

crud_tag = CRUDTag()
