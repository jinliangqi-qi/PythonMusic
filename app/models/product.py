from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True, nullable=False, comment="产品名称")
    sku = Column(String(100), unique=True, nullable=False, comment="产品SKU")
    barcode = Column(String(100), comment="条形码")
    category = Column(String(100), comment="产品分类")
    unit = Column(String(50), default="件", comment="计量单位")
    
    purchase_price = Column(Float, default=0.0, comment="采购价")
    sale_price = Column(Float, default=0.0, comment="销售价")
    cost_price = Column(Float, default=0.0, comment="成本价")
    
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True, comment="供应商ID")
    
    stock_qty = Column(Integer, default=0, comment="当前库存")
    min_stock = Column(Integer, default=10, comment="最低库存")
    max_stock = Column(Integer, default=1000, comment="最高库存")
    
    description = Column(Text, comment="产品描述")
    image = Column(String(500), comment="产品图片")
    
    status = Column(String(20), default="active", comment="状态: active/inactive")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")

    supplier = relationship("Supplier", backref="products", lazy="selectin")
    inventory_records = relationship("Inventory", backref="product", lazy="selectin")
    purchase_items = relationship("PurchaseOrderItem", backref="product", lazy="selectin")
    sales_items = relationship("SalesOrderItem", backref="product", lazy="selectin")