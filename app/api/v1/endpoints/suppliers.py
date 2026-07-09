from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_supplier import crud_supplier
from app.models.user import User
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierInfo
from app.schemas.response import page_success, PageResponse, success, ResponseBase
from app.db.session import get_db

router = APIRouter()

# 注意：静态路由必须放在动态路由（/{supplier_id}）之前

@router.get("/", response_model=PageResponse[SupplierInfo])
async def read_suppliers(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页数量"),
    name: Optional[str] = Query(None, description="供应商名称搜索"),
    status: Optional[str] = Query(None, description="状态筛选"),
) -> Any:
    skip = (page - 1) * size
    suppliers = await crud_supplier.get_multi(
        db, skip=skip, limit=size, name=name, status=status
    )
    total = await crud_supplier.get_count(
        db, name=name, status=status
    )
    return page_success(suppliers, total, page, size)

# 静态路由放在 {supplier_id} 之前
@router.get("/all", response_model=ResponseBase[List[SupplierInfo]])
async def read_all_suppliers(
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = Query("active", description="状态筛选"),
) -> Any:
    suppliers = await crud_supplier.get_multi(
        db, skip=0, limit=1000, status=status
    )
    return success(data=suppliers)

# 动态路由放在最后
@router.get("/{supplier_id}", response_model=ResponseBase[SupplierInfo])
async def read_supplier(
    supplier_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    supplier = await crud_supplier.get(db, id=supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return success(data=supplier)

@router.post("/", response_model=ResponseBase[SupplierInfo])
async def create_supplier(
    *,
    db: AsyncSession = Depends(get_db),
    supplier_in: SupplierCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    supplier = await crud_supplier.create(db, obj_in=supplier_in)
    return success(data=supplier)

@router.put("/{supplier_id}", response_model=ResponseBase[SupplierInfo])
async def update_supplier(
    *,
    db: AsyncSession = Depends(get_db),
    supplier_id: int,
    supplier_in: SupplierUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    supplier = await crud_supplier.get(db, id=supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    supplier = await crud_supplier.update(db, db_obj=supplier, obj_in=supplier_in)
    return success(data=supplier)

@router.delete("/{supplier_id}", response_model=ResponseBase[SupplierInfo])
async def delete_supplier(
    *,
    db: AsyncSession = Depends(get_db),
    supplier_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    supplier = await crud_supplier.get(db, id=supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    supplier = await crud_supplier.remove(db, id=supplier_id)
    return success(data=supplier)