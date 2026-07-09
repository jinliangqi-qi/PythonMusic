from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, comment="仓库名称")
    code = Column(String(50), unique=True, comment="仓库编码")
    address = Column(Text, comment="仓库地址")
    contact_name = Column(String(100), comment="联系人")
    contact_phone = Column(String(50), comment="联系电话")
    sort_order = Column(Integer, default=0, comment="排序")
    status = Column(String(20), default="active", comment="状态: active/inactive")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")
