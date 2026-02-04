from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_album import crud_album
from app.crud.crud_singer import crud_singer
from app.models.user import User
from app.schemas.album import AlbumCreate, AlbumUpdate, AlbumInfo
from app.schemas.response import page_success, PageResponse, success, ResponseBase
from app.db.session import get_db

router = APIRouter()

@router.get("/", response_model=PageResponse[AlbumInfo])
async def read_albums(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页数量"),
    title: Optional[str] = Query(None, description="专辑名称搜索"),
    singer_id: Optional[int] = Query(None, description="歌手ID筛选"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    获取专辑列表 (分页 + 筛选)
    """
    skip = (page - 1) * size
    albums = await crud_album.get_multi(db, skip=skip, limit=size, title=title, singer_id=singer_id)
    total = await crud_album.get_count(db, title=title, singer_id=singer_id)
    return page_success(albums, total, page, size)

@router.get("/{album_id}", response_model=ResponseBase[AlbumInfo])
async def read_album(
    album_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    获取专辑详情
    """
    album = await crud_album.get(db, id=album_id)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return success(data=album)

@router.post("/", response_model=ResponseBase[AlbumInfo])
async def create_album(
    *,
    db: AsyncSession = Depends(get_db),
    album_in: AlbumCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    创建专辑 (管理员及以上)
    """
    # 验证歌手是否存在
    singer = await crud_singer.get(db, id=album_in.singer_id)
    if not singer:
        raise HTTPException(status_code=404, detail="Singer not found")
        
    album = await crud_album.create(db, obj_in=album_in)
    # 重新获取以加载关联的 singer 信息
    return success(data=await crud_album.get(db, id=album.id))

@router.put("/{album_id}", response_model=ResponseBase[AlbumInfo])
async def update_album(
    *,
    db: AsyncSession = Depends(get_db),
    album_id: int,
    album_in: AlbumUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    更新专辑信息 (管理员及以上)
    """
    album = await crud_album.get(db, id=album_id)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    # 如果更新了歌手ID，验证新歌手是否存在
    if album_in.singer_id:
        singer = await crud_singer.get(db, id=album_in.singer_id)
        if not singer:
            raise HTTPException(status_code=404, detail="Singer not found")
            
    album = await crud_album.update(db, db_obj=album, obj_in=album_in)
    return success(data=album)

@router.delete("/{album_id}", response_model=ResponseBase[AlbumInfo])
async def delete_album(
    *,
    db: AsyncSession = Depends(get_db),
    album_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    删除专辑 (管理员及以上)
    """
    album = await crud_album.get(db, id=album_id)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    album = await crud_album.remove(db, id=album_id)
    return success(data=album)
