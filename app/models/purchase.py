from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, nullable=False, comment="采购单号")
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, comment="供应商ID")
    order_date = Column(DateTime(timezone=True), server_default=func.now(), comment="下单日期")
    delivery_date = Column(DateTime(timezone=True), comment="预计交货日期")
    
    total_amount = Column(Float, default=0.0, comment="总金额")
    paid_amount = Column(Float, default=0.0, comment="已付金额")
    
    status = Column(String(20), default="pending", comment="状态: pending/approved/delivered/paid/completed/cancelled")
    
    remark = Column(Text, comment="备注")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")

    items = relationship("PurchaseOrderItem", backref="purchase_order", lazy="selectin", cascade="all, delete-orphan")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False, comment="采购单ID")
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, comment="产品ID")
    
    quantity = Column(Integer, nullable=False, comment="采购数量")
    unit_price = Column(Float, nullable=False, comment="单价")
    amount = Column(Float, comment="金额")
    
    received_qty = Column(Integer, default=0, comment="已收货数量")
    
    remark = Column(Text, comment="备注")