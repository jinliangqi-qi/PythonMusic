from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_category import crud_category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryInfo
from app.schemas.response import page_success, PageResponse, success, ResponseBase
from app.db.session import get_db

router = APIRouter()

@router.get("/", response_model=PageResponse[CategoryInfo])
async def read_categories(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页数量"),
    name: Optional[str] = Query(None, description="分类名称搜索"),
    status: Optional[str] = Query(None, description="状态筛选"),
) -> Any:
    skip = (page - 1) * size
    categories = await crud_category.get_multi(
        db, skip=skip, limit=size, name=name, status=status
    )
    total = await crud_category.get_count(
        db, name=name, status=status
    )
    return page_success(categories, total, page, size)

@router.get("/all", response_model=ResponseBase[List[CategoryInfo]])
async def read_all_categories(
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = Query("active", description="状态筛选"),
) -> Any:
    categories = await crud_category.get_multi(
        db, skip=0, limit=1000, status=status
    )
    return success(data=categories)

@router.get("/{category_id}", response_model=ResponseBase[CategoryInfo])
async def read_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    category = await crud_category.get(db, id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return success(data=category)

@router.post("/", response_model=ResponseBase[CategoryInfo])
async def create_category(
    *,
    db: AsyncSession = Depends(get_db),
    category_in: CategoryCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    existing = await crud_category.get_by_name(db, name=category_in.name)
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")
    if category_in.code:
        existing_code = await crud_category.get_by_code(db, code=category_in.code)
        if existing_code:
            raise HTTPException(status_code=400, detail="Category code already exists")
    
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
    category = await crud_category.get(db, id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if category_in.name and category_in.name != category.name:
        existing = await crud_category.get_by_name(db, name=category_in.name)
        if existing:
            raise HTTPException(status_code=400, detail="Category name already exists")
    if category_in.code and category_in.code != category.code:
        existing_code = await crud_category.get_by_code(db, code=category_in.code)
        if existing_code:
            raise HTTPException(status_code=400, detail="Category code already exists")
        
    category = await crud_category.update(db, db_obj=category, obj_in=category_in)
    return success(data=category)

@router.delete("/{category_id}", response_model=ResponseBase[CategoryInfo])
async def delete_category(
    *,
    db: AsyncSession = Depends(get_db),
    category_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    category = await crud_category.get(db, id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    category = await crud_category.remove(db, id=category_id)
    return success(data=category)
