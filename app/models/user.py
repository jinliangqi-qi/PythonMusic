from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False, comment="用户名")
    hashed_password = Column(String(100), nullable=False, comment="密码哈希")
    nickname = Column(String(50), comment="昵称")
    email = Column(String(100), unique=True, index=True, comment="邮箱")
    
    # 角色: super_admin(超级管理员), auditor(内容审核员), admin(普通管理员)
    role = Column(String(20), default="admin", nullable=False, comment="角色")
    
    is_active = Column(Boolean, default=True, comment="是否激活")
    is_superuser = Column(Boolean, default=False, comment="是否超级管理员")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")
