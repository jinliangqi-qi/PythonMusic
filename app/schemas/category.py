from typing import Optional
from pydantic import BaseModel

class CategoryBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    sort_order: int = 0
    parent_id: Optional[int] = None
    status: str = "active"

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    name: Optional[str] = None
    status: Optional[str] = None

class CategoryInfo(CategoryBase):
    id: int
    created_at: str
    updated_at: str
    
    model_config = {"from_attributes": True}
