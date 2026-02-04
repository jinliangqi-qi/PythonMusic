from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_tag import crud_tag
from app.crud.crud_music import crud_music
from app.models.user import User
from app.schemas.tag import TagCreate, TagInfo, TagMusicLink, TagUpdate
from app.schemas.response import success, ResponseBase
from app.db.session import get_db

router = APIRouter()

@router.get("/", response_model=ResponseBase[List[TagInfo]])
async def read_tags(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    获取标签列表
    """
    tags = await crud_tag.get_multi(db, skip=skip, limit=limit)
    return success(data=tags)

@router.post("/", response_model=ResponseBase[TagInfo])
async def create_tag(
    *,
    db: AsyncSession = Depends(get_db),
    tag_in: TagCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    创建标签 (管理员及以上)
    """
    # 检查同名标签是否存在
    existing_tags = await crud_tag.get_multi(db, limit=1000)
    for t in existing_tags:
        if t.name == tag_in.name:
            raise HTTPException(status_code=400, detail="Tag with this name already exists")
            
    tag = await crud_tag.create(db, obj_in=tag_in)
    return success(data=tag)

@router.put("/{tag_id}", response_model=ResponseBase[TagInfo])
async def update_tag(
    *,
    db: AsyncSession = Depends(get_db),
    tag_id: int,
    tag_in: TagUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    更新标签 (管理员及以上)
    """
    tag = await crud_tag.get(db, id=tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
        
    tag = await crud_tag.update(db, db_obj=tag, obj_in=tag_in)
    return success(data=tag)

@router.delete("/{tag_id}", response_model=ResponseBase[TagInfo])
async def delete_tag(
    *,
    db: AsyncSession = Depends(get_db),
    tag_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    删除标签 (管理员及以上)
    """
    tag = await crud_tag.get(db, id=tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    tag = await crud_tag.remove(db, id=tag_id)
    return success(data=tag)

@router.post("/link", response_model=ResponseBase[Any])
async def link_tags_to_music(
    *,
    db: AsyncSession = Depends(get_db),
    link_in: TagMusicLink,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    给音乐添加标签 (管理员及以上)
    """
    # 验证音乐是否存在
    music = await crud_music.get(db, id=link_in.music_id)
    if not music:
        raise HTTPException(status_code=404, detail="Music not found")
        
    updated_music = await crud_tag.add_tags_to_music(
        db, music_id=link_in.music_id, tag_ids=link_in.tag_ids
    )
    return success(message="Tags updated successfully")
