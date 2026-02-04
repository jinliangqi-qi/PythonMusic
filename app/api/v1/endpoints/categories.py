from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_category import crud_category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryInfo
from app.schemas.response import success, ResponseBase
from app.db.session import get_db

router = APIRouter()

@router.get("/", response_model=ResponseBase[List[CategoryInfo]])
async def read_categories(
    db: AsyncSession = Depends(get_db),
    parent_id: Optional[int] = Query(None, description="父分类ID (不传则返回顶级分类树)"),
) -> Any:
    """
    获取分类列表 (树形结构)
    如果不传 parent_id，则返回顶级分类，并递归包含 children
    """
    categories = await crud_category.get_multi(db, parent_id=parent_id)
    return success(data=categories)

@router.post("/", response_model=ResponseBase[CategoryInfo])
async def create_category(
    *,
    db: AsyncSession = Depends(get_db),
    category_in: CategoryCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    创建分类 (管理员及以上)
    """
    if category_in.parent_id:
        parent = await crud_category.get(db, id=category_in.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent category not found")
            
    category = await crud_category.create(db, obj_in=category_in)
    return success(data=category)

@router.put("/{category_id}", response_model=ResponseBase[CategoryInfo])
async def update_category(
    *,
    db: AsyncSession = Depends(get_db),
    category_id: int,
    category_in: CategoryUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    更新分类 (管理员及以上)
    """
    category = await crud_category.get(db, id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    category = await crud_category.update(db, db_obj=category, obj_in=category_in)
    return success(data=category)

@router.delete("/{category_id}", response_model=ResponseBase[CategoryInfo])
async def delete_category(
    *,
    db: AsyncSession = Depends(get_db),
    category_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    删除分类 (管理员及以上)
    """
    category = await crud_category.get(db, id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    category = await crud_category.remove(db, id=category_id)
    return success(data=category)
