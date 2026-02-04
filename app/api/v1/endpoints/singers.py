from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_singer import crud_singer
from app.models.user import User
from app.schemas.singer import SingerCreate, SingerUpdate, SingerInfo
from app.schemas.response import page_success, PageResponse, success, ResponseBase
from app.db.session import get_db

router = APIRouter()

@router.get("/", response_model=PageResponse[SingerInfo])
async def read_singers(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页数量"),
    name: Optional[str] = Query(None, description="歌手姓名搜索"),
) -> Any:
    """
    获取歌手列表 (分页)
    """
    skip = (page - 1) * size
    singers = await crud_singer.get_multi(db, skip=skip, limit=size, name=name)
    total = await crud_singer.get_count(db, name=name)
    return page_success(singers, total, page, size)

@router.get("/{singer_id}", response_model=ResponseBase[SingerInfo])
async def read_singer(
    singer_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    获取歌手详情
    """
    singer = await crud_singer.get(db, id=singer_id)
    if not singer:
        raise HTTPException(status_code=404, detail="Singer not found")
    return success(data=singer)

@router.post("/", response_model=ResponseBase[SingerInfo])
async def create_singer(
    *,
    db: AsyncSession = Depends(get_db),
    singer_in: SingerCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    创建歌手 (管理员及以上)
    """
    # 这里不需要额外处理头像，因为 singer_in.avatar 已经是上传后返回的相对路径
    singer = await crud_singer.create(db, obj_in=singer_in)
    return success(data=singer)

@router.put("/{singer_id}", response_model=ResponseBase[SingerInfo])
async def update_singer(
    *,
    db: AsyncSession = Depends(get_db),
    singer_id: int,
    singer_in: SingerUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    更新歌手信息 (管理员及以上)
    """
    singer = await crud_singer.get(db, id=singer_id)
    if not singer:
        raise HTTPException(status_code=404, detail="Singer not found")
    singer = await crud_singer.update(db, db_obj=singer, obj_in=singer_in)
    return success(data=singer)

@router.delete("/{singer_id}", response_model=ResponseBase[SingerInfo])
async def delete_singer(
    *,
    db: AsyncSession = Depends(get_db),
    singer_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    删除歌手 (管理员及以上)
    """
    singer = await crud_singer.get(db, id=singer_id)
    if not singer:
        raise HTTPException(status_code=404, detail="Singer not found")
    singer = await crud_singer.remove(db, id=singer_id)
    return success(data=singer)

@router.patch("/{singer_id}/status", response_model=ResponseBase[SingerInfo])
async def update_singer_status(
    *,
    db: AsyncSession = Depends(get_db),
    singer_id: int,
    is_active: bool = Query(..., description="是否启用"),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    修改歌手状态 (启用/禁用 - 管理员及以上)
    """
    singer = await crud_singer.get(db, id=singer_id)
    if not singer:
        raise HTTPException(status_code=404, detail="Singer not found")
        
    status = "active" if is_active else "disabled"
    singer = await crud_singer.update(db, db_obj=singer, obj_in={"status": status})
    return success(data=singer)
