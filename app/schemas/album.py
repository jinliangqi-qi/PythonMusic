from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator
from app.schemas.singer import SingerInfo

class AlbumBase(BaseModel):
    title: str = Field(..., description="专辑名称", min_length=1, max_length=100)
    singer_id: Optional[int] = Field(None, description="歌手ID")
    cover: Optional[str] = Field(None, description="专辑封面 (相对路径)")
    release_date: Optional[date] = Field(None, description="发行时间")
    description: Optional[str] = Field(None, description="专辑简介")
    is_active: Optional[bool] = Field(True, description="是否上架")

class AlbumCreate(AlbumBase):
    pass

class AlbumUpdate(BaseModel):
    title: Optional[str] = None
    singer_id: Optional[int] = None
    cover: Optional[str] = None
    release_date: Optional[date] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class AlbumInfo(AlbumBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    singer: Optional[SingerInfo] = None # 嵌套歌手信息
    cover_url: Optional[str] = Field(None, description="封面完整 URL")

    class Config:
        from_attributes = True

    @field_validator("cover_url", mode="before")
    def generate_cover_url(cls, v, info):
        # 同样，这里可以通过 computed_field 或后端处理
        return None
