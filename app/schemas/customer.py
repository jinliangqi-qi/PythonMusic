from typing import Optional
from pydantic import BaseModel

class CustomerBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    status: str = "active"

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CustomerBase):
    name: Optional[str] = None
    status: Optional[str] = None

class CustomerInfo(CustomerBase):
    id: int
    created_at: str
    updated_at: str
    
    model_config = {"from_attributes": True}