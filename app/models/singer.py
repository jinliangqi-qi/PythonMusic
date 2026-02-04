from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text
from sqlalchemy.sql import func
from app.db.base import Base

class Singer(Base):
    __tablename__ = "singers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False, comment="歌手姓名")
    gender = Column(String(10), default="unknown", comment="性别: male, female, band, unknown")
    bio = Column(Text, comment="歌手简介")
    avatar = Column(String(255), comment="头像路径 (相对路径)")
    region = Column(String(50), default="Other", comment="地区: China, HongKong, Taiwan, Japan, Korea, Europe_America, Other")
    debut_date = Column(Date, comment="出道时间")
    
    # 状态控制
    is_active = Column(Boolean, default=True, comment="是否启用")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")
