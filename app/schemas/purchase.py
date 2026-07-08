from typing import Optional, List
from pydantic import BaseModel

class PurchaseOrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float
    remark: Optional[str] = None

class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    delivery_date: Optional[str] = None
    items: List[PurchaseOrderItemCreate]
    remark: Optional[str] = None

class PurchaseOrderUpdate(BaseModel):
    status: Optional[str] = None
    paid_amount: Optional[float] = None
    remark: Optional[str] = None

class PurchaseOrderItemInfo(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    quantity: int
    unit_price: float
    amount: float
    received_qty: int
    remark: Optional[str] = None
    
    model_config = {"from_attributes": True}

class PurchaseOrderInfo(BaseModel):
    id: int
    order_no: str
    supplier_id: int
    supplier_name: str
    order_date: str
    delivery_date: Optional[str] = None
    total_amount: float
    paid_amount: float
    status: str
    remark: Optional[str] = None
    items: List[PurchaseOrderItemInfo]
    created_at: str
    updated_at: str
    
    model_config = {"from_attributes": True}