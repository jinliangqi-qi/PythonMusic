from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator

class SingerBase(BaseModel):
    name: str = Field(..., description="歌手姓名", min_length=1, max_length=100)
    gender: Optional[str] = Field("unknown", description="性别: male, female, band, unknown")
    region: Optional[str] = Field("Other", description="地区: China, HongKong, Taiwan, Japan, Korea, Europe_America, Other")
    bio: Optional[str] = Field(None, description="歌手简介")
    avatar: Optional[str] = Field(None, description="头像路径 (相对路径)")
    debut_date: Optional[date] = Field(None, description="出道时间")
    is_active: Optional[bool] = Field(True, description="是否启用")

    @field_validator("gender")
    def validate_gender(cls, v):
        allowed = ["male", "female", "band", "unknown"]
        if v not in allowed:
            raise ValueError(f"Gender must be one of {allowed}")
        return v

class SingerCreate(SingerBase):
    pass

class SingerUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    region: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    debut_date: Optional[date] = None
    is_active: Optional[bool] = None

class SingerInfo(SingerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    avatar_url: Optional[str] = Field(None, description="头像完整 URL")

    class Config:
        from_attributes = True

    @field_validator("avatar_url", mode="before")
    def generate_avatar_url(cls, v, info):
        # 如果 avatar_url 已经存在则直接返回
        if v: return v
        # 获取 avatar 字段的值
        # 注意：在 Pydantic v2 中，info.data 可能还没包含所有字段，
        # 或者这是从 ORM 转换来的，所以我们要访问原始对象
        # 这里为了简化，我们假设前端拼接，或者后端在 CRUD/API 层处理
        # 更好的方式是使用 computed_field (Pydantic v2)
        # 但为了兼容性，我们暂时让 API 层处理，或者简单的字符串拼接
        return None
