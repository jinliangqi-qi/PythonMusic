from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_music import crud_music
from app.crud.crud_singer import crud_singer
from app.crud.crud_album import crud_album
from app.crud.crud_tag import crud_tag
from app.models.user import User
from app.schemas.music import MusicCreate, MusicUpdate, MusicInfo
from app.schemas.response import page_success, PageResponse, success, ResponseBase
from app.db.session import get_db

router = APIRouter()

@router.get("/", response_model=PageResponse[MusicInfo])
async def read_musics(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页数量"),
    title: Optional[str] = Query(None, description="音乐名称搜索"),
    singer_id: Optional[int] = Query(None, description="歌手ID筛选"),
    album_id: Optional[int] = Query(None, description="专辑ID筛选"),
    status: Optional[str] = Query(None, description="状态筛选: pending, active, rejected"),
    current_user: Optional[User] = Depends(deps.get_current_user_optional),
) -> Any:
    """
    获取音乐列表 (分页 + 筛选)
    """
    # 如果未登录，只能查看 active 状态
    if not current_user:
        status = "active"
    
    # 普通用户只能看到 active 的音乐，除非是管理员/审核员
    # 为了简化，我们假设前端通过 status 参数控制，后端校验权限
    # 实际场景可能需要根据角色自动过滤
    if status and status != "active":
         # 如果想看非 active 的，需要更高权限
         if not current_user:
             status = "active"
         else:
            allowed_roles = ["super_admin", "auditor", "admin"]
            if current_user.role not in allowed_roles and not current_user.is_superuser:
                status = "active"
    
    skip = (page - 1) * size
    musics = await crud_music.get_multi(
        db, skip=skip, limit=size, title=title, 
        singer_id=singer_id, album_id=album_id, status=status
    )
    total = await crud_music.get_count(
        db, title=title, singer_id=singer_id, 
        album_id=album_id, status=status
    )
    return page_success(musics, total, page, size)

@router.get("/{music_id}", response_model=ResponseBase[MusicInfo])
async def read_music(
    music_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    获取音乐详情
    """
    # Use cached get
    music = await crud_music.get_cached(db, id=music_id)
    if not music:
        raise HTTPException(status_code=404, detail="Music not found")
    
    # 增加播放量 (This operation is write-heavy, might want to buffer it in Redis too in real world)
    await crud_music.increment_play_count(db, id=music_id)
    
    return success(data=music)

@router.post("/", response_model=ResponseBase[MusicInfo])
async def create_music(
    *,
    db: AsyncSession = Depends(get_db),
    music_in: MusicCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    上传/创建音乐 (管理员及以上)
    注意：实际文件上传应先调用 /common/upload 获取路径，再调用此接口保存元数据
    """
    # 验证歌手
    singer = await crud_singer.get(db, id=music_in.singer_id)
    if not singer:
        raise HTTPException(status_code=404, detail="Singer not found")
        
    # 验证专辑
    if music_in.album_id:
        album = await crud_album.get(db, id=music_in.album_id)
        if not album:
            raise HTTPException(status_code=404, detail="Album not found")
            
    music = await crud_music.create(db, obj_in=music_in)
    
    # 如果有标签，处理标签关联
    if music_in.tag_ids:
        await crud_tag.add_tags_to_music(db, music_id=music.id, tag_ids=music_in.tag_ids)
    
    return success(data=await crud_music.get(db, id=music.id))

@router.put("/{music_id}", response_model=ResponseBase[MusicInfo])
async def update_music(
    *,
    db: AsyncSession = Depends(get_db),
    music_id: int,
    music_in: MusicUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    更新音乐信息
    """
    music = await crud_music.get(db, id=music_id)
    if not music:
        raise HTTPException(status_code=404, detail="Music not found")
        
    music = await crud_music.update(db, db_obj=music, obj_in=music_in)
    
    # 更新标签
    if music_in.tag_ids is not None:
        await crud_tag.add_tags_to_music(db, music_id=music.id, tag_ids=music_in.tag_ids)
        # 刷新对象以获取最新标签
        music = await crud_music.get(db, id=music_id)
        
    return success(data=music)

@router.delete("/batch", response_model=ResponseBase[Any])
async def delete_musics_batch(
    *,
    db: AsyncSession = Depends(get_db),
    ids: List[int] = Query(..., description="音乐ID列表"),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    批量删除音乐
    """
    # 循环删除 (为了简单起见，实际生产中可以使用 SQL IN 操作优化)
    deleted_count = 0
    for music_id in ids:
        music = await crud_music.get(db, id=music_id)
        if music:
            await crud_music.remove(db, id=music_id)
            deleted_count += 1
            
    return success(message=f"成功删除 {deleted_count} 首音乐")

@router.delete("/{music_id}", response_model=ResponseBase[MusicInfo])
async def delete_music(
    *,
    db: AsyncSession = Depends(get_db),
    music_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    删除音乐
    """
    music = await crud_music.get(db, id=music_id)
    if not music:
        raise HTTPException(status_code=404, detail="Music not found")
    music = await crud_music.remove(db, id=music_id)
    return success(data=music)

@router.patch("/{music_id}/audit", response_model=ResponseBase[MusicInfo])
async def audit_music(
    *,
    db: AsyncSession = Depends(get_db),
    music_id: int,
    status: str = Query(..., description="审核状态: active(通过), rejected(驳回)"),
    current_user: User = Depends(deps.get_current_auditor),
) -> Any:
    """
    审核音乐 (审核员/管理员)
    """
    if status not in ["active", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    music = await crud_music.get(db, id=music_id)
    if not music:
        raise HTTPException(status_code=404, detail="Music not found")
        
    music = await crud_music.update(db, db_obj=music, obj_in={"status": status})
    return success(data=music)
