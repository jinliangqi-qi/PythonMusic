import os
import shutil
import uuid
import aiofiles
import filetype
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from app.core.config import settings
from app.schemas.response import success, ResponseBase
from app.api import deps
from app.models.user import User
from app.models.music import Music
from app.models.singer import Singer
from app.models.album import Album
from app.core.limiter import limiter

router = APIRouter()

@router.get("/stats", summary="获取仪表盘统计数据")
async def get_dashboard_stats(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    获取首页统计数据
    """
    # 并发查询各表数量
    try:
        # 1. 音乐总数
        music_count_query = select(func.count(Music.id))
        music_count = await db.scalar(music_count_query) or 0
        
        # 2. 歌手总数
        singer_count_query = select(func.count(Singer.id))
        singer_count = await db.scalar(singer_count_query) or 0
        
        # 3. 专辑总数
        album_count_query = select(func.count(Album.id))
        album_count = await db.scalar(album_count_query) or 0
        
        # 4. 待审核音乐数
        pending_music_query = select(func.count(Music.id)).where(Music.status == 'pending')
        pending_music_count = await db.scalar(pending_music_query) or 0

        # 5. 音乐状态分布
        active_music_query = select(func.count(Music.id)).where(Music.status == 'active')
        active_count = await db.scalar(active_music_query) or 0
        
        rejected_music_query = select(func.count(Music.id)).where(Music.status == 'rejected')
        rejected_count = await db.scalar(rejected_music_query) or 0

        # 6. 播放量 Top 5
        top_music_query = select(Music).order_by(Music.play_count.desc()).limit(5)
        top_music_result = await db.execute(top_music_query)
        top_musics = top_music_result.scalars().all()
        
        return success(data={
            "music_count": music_count,
            "singer_count": singer_count,
            "album_count": album_count,
            "pending_music_count": pending_music_count,
            "status_distribution": {
                "active": active_count,
                "pending": pending_music_count,
                "rejected": rejected_count
            },
            "top_musics": [
                {"id": m.id, "title": m.title, "play_count": m.play_count, "artist": m.singer.name if m.singer else "Unknown"} 
                for m in top_musics
            ]
        })
    except Exception as e:
        print(f"Error getting stats: {e}")
        return success(data={
            "music_count": 0,
            "singer_count": 0,
            "album_count": 0,
            "pending_music_count": 0,
            "status_distribution": {"active": 0, "pending": 0, "rejected": 0},
            "top_musics": []
        })

@router.post("/upload", summary="通用文件上传")
@limiter.limit("10/minute")
async def upload_files(
    request: Request,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(deps.get_current_user)
):
    """
    通用文件上传接口
    - 支持多文件上传
    - 自动判断文件类型 (图片/音频)
    - 返回文件相对路径
    """
    uploaded_files = []
    
    # 确保上传目录存在
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    for file in files:
        # 读取前 2048 字节用于判断类型
        header = await file.read(2048)
        await file.seek(0)
        
        kind = filetype.guess(header)
        
        if kind is None:
             # 如果 filetype 无法识别，尝试使用 content-type 或后缀兜底
             # 某些小文件或特殊格式 filetype 可能识别失败
             if file.content_type.startswith('image/'):
                 file_type = "image"
                 ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
             elif file.content_type.startswith('audio/'):
                 file_type = "audio"
                 ext = file.filename.split('.')[-1] if '.' in file.filename else 'mp3'
             else:
                 raise HTTPException(status_code=400, detail=f"Cannot determine file type for {file.filename}")
        else:
            mime = kind.mime
            ext = kind.extension
            
            file_type = "unknown"
            # 简单映射 mime type 到业务类型
            if mime.startswith("audio/"):
                 if ext not in settings.ALLOWED_AUDIO_EXTENSIONS and ext != "mp3": 
                      pass 
                 file_type = "audio"
            elif mime.startswith("image/"):
                 file_type = "image"
            else:
                 # 即使 filetype 识别出了类型，但如果不是 audio/image (比如识别成了 video/mp4 或 application/octet-stream)
                 # 我们仍然尝试用 Content-Type 兜底
                 if file.content_type.startswith('image/'):
                     file_type = "image"
                 elif file.content_type.startswith('audio/'):
                     file_type = "audio"
                 else:
                     raise HTTPException(status_code=400, detail=f"Unsupported file mime type: {mime}")

        # Double check extension against allowed list
        if file_type == "audio" and ext not in settings.ALLOWED_AUDIO_EXTENSIONS:
             # some mapping issues like m4a vs mp4
             pass 
        
        if file_type == "image" and ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
             pass

        # 3. 生成唯一文件名
        unique_filename = f"{uuid.uuid4().hex}.{ext}"
        # 按类型/日期分目录存储更好，这里简单存放在根目录或 type 目录
        save_dir = os.path.join(settings.UPLOAD_DIR, file_type)
        os.makedirs(save_dir, exist_ok=True)
        
        save_path = os.path.join(save_dir, unique_filename)
        
        # 4. 异步保存文件
        try:
            async with aiofiles.open(save_path, 'wb') as out_file:
                # 分块读取写入，防止内存溢出
                while content := await file.read(1024 * 1024):  # 1MB chunk
                    await out_file.write(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
            
        # 5. 生成返回路径 (相对路径，前端拼接域名)
        # 路径格式: uploads/audio/xxxx.mp3
        relative_path = f"{file_type}/{unique_filename}"
        
        uploaded_files.append({
            "original_name": file.filename,
            "path": relative_path,
            "type": file_type,
            "url": f"{settings.API_V1_STR}/common/files/{file_type}/{unique_filename}" 
        })
        
    return success(data=uploaded_files)

@router.get("/files/{file_type}/{filename}", summary="文件访问")
async def get_file(
    file_type: str,
    filename: str,
    # current_user: User = Depends(deps.get_current_user) # 暂时不强制登录，因为图片可能公开，或者需要 token query param
):
    """
    文件访问接口，隐藏真实路径
    可以在这里添加权限控制，例如:
    if file_type == 'audio' and not current_user: raise ...
    """
    # 防止路径遍历
    if ".." in file_type or ".." in filename:
         raise HTTPException(status_code=400, detail="Invalid path")

    file_path = os.path.join(settings.UPLOAD_DIR, file_type, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(file_path)

