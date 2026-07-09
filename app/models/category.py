from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, comment="分类名称")
    code = Column(String(50), unique=True, comment="分类编码")
    description = Column(Text, comment="分类描述")
    sort_order = Column(Integer, default=0, comment="排序")
    parent_id = Column(Integer, comment="父分类ID")
    status = Column(String(20), default="active", comment="状态: active/inactive")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")
