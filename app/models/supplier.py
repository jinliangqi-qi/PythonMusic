from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True, nullable=False, comment="供应商名称")
    contact_name = Column(String(100), comment="联系人")
    phone = Column(String(50), comment="联系电话")
    email = Column(String(100), comment="邮箱")
    address = Column(Text, comment="地址")
    tax_id = Column(String(50), comment="税号")
    
    status = Column(String(20), default="active", comment="状态: active/inactive")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")

    purchase_orders = relationship("PurchaseOrder", backref="supplier", lazy="selectin")