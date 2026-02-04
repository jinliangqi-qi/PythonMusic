from typing import List, Optional
from pydantic import BaseModel, Field

class CategoryBase(BaseModel):
    name: str = Field(..., description="分类名称", min_length=1, max_length=50)
    parent_id: Optional[int] = Field(None, description="父分类ID")
    sort_order: Optional[int] = Field(0, description="排序")

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None
    sort_order: Optional[int] = None

class CategoryInfo(CategoryBase):
    id: int
    children: List["CategoryInfo"] = [] # 递归定义

    class Config:
        from_attributes = True

# 解决递归引用
CategoryInfo.model_rebuild()
