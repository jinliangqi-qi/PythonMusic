from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, comment="产品ID")
    warehouse = Column(String(100), default="默认仓库", comment="仓库名称")
    
    change_type = Column(String(20), nullable=False, comment="变动类型: purchase/sale/adjust/inventory")
    change_qty = Column(Integer, nullable=False, comment="变动数量")
    before_qty = Column(Integer, nullable=False, comment="变动前数量")
    after_qty = Column(Integer, nullable=False, comment="变动后数量")
    
    related_order_no = Column(String(50), comment="关联单号")
    
    operator = Column(String(100), comment="操作人")
    remark = Column(Text, comment="备注")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")