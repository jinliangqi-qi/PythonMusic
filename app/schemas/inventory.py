from typing import Optional
from pydantic import BaseModel

class InventoryAdjustCreate(BaseModel):
    product_id: int
    change_qty: int
    warehouse: Optional[str] = "默认仓库"
    related_order_no: Optional[str] = None
    remark: Optional[str] = None

class InventoryInfo(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    warehouse: str
    change_type: str
    change_qty: int
    before_qty: int
    after_qty: int
    related_order_no: Optional[str] = None
    operator: Optional[str] = None
    remark: Optional[str] = None
    created_at: str
    
    class Config:
        orm_mode = True