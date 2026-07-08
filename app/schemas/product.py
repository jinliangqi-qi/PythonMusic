from typing import Optional
from pydantic import BaseModel

class ProductBase(BaseModel):
    name: str
    sku: str
    barcode: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = "件"
    
    purchase_price: float = 0.0
    sale_price: float = 0.0
    cost_price: float = 0.0
    
    supplier_id: Optional[int] = None
    
    stock_qty: int = 0
    min_stock: int = 10
    max_stock: int = 1000
    
    description: Optional[str] = None
    image: Optional[str] = None
    
    status: str = "active"

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    name: Optional[str] = None
    sku: Optional[str] = None
    status: Optional[str] = None

class ProductInfo(ProductBase):
    id: int
    created_at: str
    updated_at: str
    
    class Config:
        orm_mode = True