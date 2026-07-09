from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_warehouse import crud_warehouse
from app.models.user import User
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate, WarehouseInfo
from app.schemas.response import page_success, PageResponse, success, ResponseBase
from app.db.session import get_db

router = APIRouter()

@router.get("/", response_model=PageResponse[WarehouseInfo])
async def read_warehouses(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页数量"),
    name: Optional[str] = Query(None, description="仓库名称搜索"),
    status: Optional[str] = Query(None, description="状态筛选"),
) -> Any:
    skip = (page - 1) * size
    warehouses = await crud_warehouse.get_multi(
        db, skip=skip, limit=size, name=name, status=status
    )
    total = await crud_warehouse.get_count(
        db, name=name, status=status
    )
    return page_success(warehouses, total, page, size)

@router.get("/all", response_model=ResponseBase[List[WarehouseInfo]])
async def read_all_warehouses(
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = Query("active", description="状态筛选"),
) -> Any:
    warehouses = await crud_warehouse.get_multi(
        db, skip=0, limit=1000, status=status
    )
    return success(data=warehouses)

@router.get("/{warehouse_id}", response_model=ResponseBase[WarehouseInfo])
async def read_warehouse(
    warehouse_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    warehouse = await crud_warehouse.get(db, id=warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return success(data=warehouse)

@router.post("/", response_model=ResponseBase[WarehouseInfo])
async def create_warehouse(
    *,
    db: AsyncSession = Depends(get_db),
    warehouse_in: WarehouseCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    existing = await crud_warehouse.get_by_name(db, name=warehouse_in.name)
    if existing:
        raise HTTPException(status_code=400, detail="Warehouse name already exists")
    if warehouse_in.code:
        existing_code = await crud_warehouse.get_by_code(db, code=warehouse_in.code)
        if existing_code:
            raise HTTPException(status_code=400, detail="Warehouse code already exists")
    
    warehouse = await crud_warehouse.create(db, obj_in=warehouse_in)
    return success(data=warehouse)

@router.put("/{warehouse_id}", response_model=ResponseBase[WarehouseInfo])
async def update_warehouse(
    *,
    db: AsyncSession = Depends(get_db),
    warehouse_id: int,
    warehouse_in: WarehouseUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    warehouse = await crud_warehouse.get(db, id=warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    if warehouse_in.name and warehouse_in.name != warehouse.name:
        existing = await crud_warehouse.get_by_name(db, name=warehouse_in.name)
        if existing:
            raise HTTPException(status_code=400, detail="Warehouse name already exists")
    if warehouse_in.code and warehouse_in.code != warehouse.code:
        existing_code = await crud_warehouse.get_by_code(db, code=warehouse_in.code)
        if existing_code:
            raise HTTPException(status_code=400, detail="Warehouse code already exists")
        
    warehouse = await crud_warehouse.update(db, db_obj=warehouse, obj_in=warehouse_in)
    return success(data=warehouse)

@router.delete("/{warehouse_id}", response_model=ResponseBase[WarehouseInfo])
async def delete_warehouse(
    *,
    db: AsyncSession = Depends(get_db),
    warehouse_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    warehouse = await crud_warehouse.get(db, id=warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    warehouse = await crud_warehouse.remove(db, id=warehouse_id)
    return success(data=warehouse)
