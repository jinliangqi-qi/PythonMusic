from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# 基础属性
class UserBase(BaseModel):
    username: str = Field(..., description="用户名")
    email: Optional[EmailStr] = Field(None, description="邮箱")
    nickname: Optional[str] = Field(None, description="昵称")
    is_active: Optional[bool] = Field(True, description="是否激活")
    role: Optional[str] = Field("user", description="角色")

# 创建用户时的属性
class UserCreate(UserBase):
    password: str = Field(..., description="密码", min_length=6)

# 更新用户时的属性
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    nickname: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None

# API 返回的用户信息
class UserInfo(UserBase):
    id: int
    role: str # 添加 role 字段
    is_superuser: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True # Pydantic v2 使用 from_attributes 替代 orm_mode
