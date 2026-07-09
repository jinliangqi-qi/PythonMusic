from typing import Optional
from pydantic import BaseModel

class WarehouseBase(BaseModel):
    name: str
    code: Optional[str] = None
    address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    sort_order: int = 0
    status: str = "active"

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(WarehouseBase):
    name: Optional[str] = None
    status: Optional[str] = None

class WarehouseInfo(WarehouseBase):
    id: int
    created_at: str
    updated_at: str
    
    model_config = {"from_attributes": True}
