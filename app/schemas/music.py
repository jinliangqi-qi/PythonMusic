from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from app.schemas.singer import SingerInfo
from app.schemas.album import AlbumInfo
from app.schemas.tag import TagInfo

class MusicBase(BaseModel):
    title: str = Field(..., description="音乐名称", min_length=1, max_length=100)
    singer_id: Optional[int] = Field(None, description="歌手ID")
    album_id: Optional[int] = Field(None, description="专辑ID")
    file_path: str = Field(..., description="音乐文件路径或URL")
    cover: Optional[str] = Field(None, description="封面路径或URL")
    duration: Optional[int] = Field(0, description="时长 (秒)")
    size: Optional[int] = Field(0, description="文件大小 (字节)")
    status: Optional[str] = Field("pending", description="状态: pending, active, rejected")

class MusicCreate(MusicBase):
    tag_ids: List[int] = Field([], description="标签ID列表")

class MusicUpdate(BaseModel):
    title: Optional[str] = None
    singer_id: Optional[int] = None
    album_id: Optional[int] = None
    file_path: Optional[str] = None
    cover: Optional[str] = None
    duration: Optional[int] = None
    status: Optional[str] = None
    tag_ids: Optional[List[int]] = Field(None, description="标签ID列表")

class MusicInfo(MusicBase):
    id: int
    play_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # 嵌套信息
    singer: Optional[SingerInfo] = None
    album: Optional[AlbumInfo] = None
    tags: List[TagInfo] = []
    
    # URL 字段
    file_url: Optional[str] = Field(None, description="音乐文件完整 URL")
    cover_url: Optional[str] = Field(None, description="封面完整 URL")

    class Config:
        from_attributes = True

    @field_validator("file_url", mode="before")
    def generate_file_url(cls, v, info):
        # 如果 file_path 已经是 URL，直接返回
        if info.data.get("file_path", "").startswith("http"):
            return info.data.get("file_path")
        return None

    @field_validator("cover_url", mode="before")
    def generate_cover_url(cls, v, info):
        if info.data.get("cover") and info.data.get("cover", "").startswith("http"):
             return info.data.get("cover")
        return None
