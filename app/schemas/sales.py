from typing import Optional, List
from pydantic import BaseModel

class SalesOrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float
    remark: Optional[str] = None

class SalesOrderCreate(BaseModel):
    customer_id: int
    delivery_date: Optional[str] = None
    items: List[SalesOrderItemCreate]
    remark: Optional[str] = None

class SalesOrderUpdate(BaseModel):
    status: Optional[str] = None
    paid_amount: Optional[float] = None
    remark: Optional[str] = None

class SalesOrderItemInfo(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    quantity: int
    unit_price: float
    amount: float
    shipped_qty: int
    remark: Optional[str] = None
    
    class Config:
        orm_mode = True

class SalesOrderInfo(BaseModel):
    id: int
    order_no: str
    customer_id: int
    customer_name: str
    order_date: str
    delivery_date: Optional[str] = None
    total_amount: float
    paid_amount: float
    status: str
    remark: Optional[str] = None
    items: List[SalesOrderItemInfo]
    created_at: str
    updated_at: str
    
    class Config:
        orm_mode = True