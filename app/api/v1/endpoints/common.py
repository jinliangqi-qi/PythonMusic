import os
import uuid
import aiofiles
import filetype
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from fastapi.responses import FileResponse
from app.core.config import settings
from app.schemas.response import success
from app.core.limiter import limiter

router = APIRouter()

@router.post("/upload", summary="通用文件上传")
@limiter.limit("10/minute")
async def upload_files(
    request: Request,
    files: List[UploadFile] = File(...)
):
    uploaded_files = []
    
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    for file in files:
        header = await file.read(2048)
        await file.seek(0)
        
        kind = filetype.guess(header)
        
        if kind is None:
            if file.content_type.startswith('image/'):
                file_type = "image"
                ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
            else:
                raise HTTPException(status_code=400, detail=f"Cannot determine file type for {file.filename}")
        else:
            mime = kind.mime
            ext = kind.extension
            
            file_type = "unknown"
            if mime.startswith("image/"):
                file_type = "image"
            else:
                if file.content_type.startswith('image/'):
                    file_type = "image"
                else:
                    raise HTTPException(status_code=400, detail=f"Unsupported file mime type: {mime}")

        if file_type == "image" and ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
            pass

        unique_filename = f"{uuid.uuid4().hex}.{ext}"
        save_dir = os.path.join(settings.UPLOAD_DIR, file_type)
        os.makedirs(save_dir, exist_ok=True)
        
        save_path = os.path.join(save_dir, unique_filename)
        
        try:
            async with aiofiles.open(save_path, 'wb') as out_file:
                while content := await file.read(1024 * 1024):
                    await out_file.write(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
            
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
):
    if ".." in file_type or ".." in filename:
         raise HTTPException(status_code=400, detail="Invalid path")

    file_path = os.path.join(settings.UPLOAD_DIR, file_type, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(file_path)