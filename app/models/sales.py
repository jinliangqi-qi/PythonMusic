from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, nullable=False, comment="销售单号")
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, comment="客户ID")
    order_date = Column(DateTime(timezone=True), server_default=func.now(), comment="下单日期")
    delivery_date = Column(DateTime(timezone=True), comment="预计发货日期")
    
    total_amount = Column(Float, default=0.0, comment="总金额")
    paid_amount = Column(Float, default=0.0, comment="已收金额")
    
    status = Column(String(20), default="pending", comment="状态: pending/approved/shipped/paid/completed/cancelled")
    
    remark = Column(Text, comment="备注")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")

    items = relationship("SalesOrderItem", backref="sales_order", lazy="selectin", cascade="all, delete-orphan")

class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"

    id = Column(Integer, primary_key=True, index=True)
    sales_order_id = Column(Integer, ForeignKey("sales_orders.id", ondelete="CASCADE"), nullable=False, comment="销售单ID")
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, comment="产品ID")
    
    quantity = Column(Integer, nullable=False, comment="销售数量")
    unit_price = Column(Float, nullable=False, comment="单价")
    amount = Column(Float, comment="金额")
    
    shipped_qty = Column(Integer, default=0, comment="已发货数量")
    
    remark = Column(Text, comment="备注")