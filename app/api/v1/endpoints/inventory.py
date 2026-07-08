from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_inventory import crud_inventory
from app.models.user import User
from app.schemas.inventory import InventoryAdjustCreate, InventoryInfo
from app.schemas.response import page_success, PageResponse, success, ResponseBase
from app.db.session import get_db
from fastapi.encoders import jsonable_encoder

router = APIRouter()

def format_inventory(record):
    data = jsonable_encoder(record)
    if record.product:
        data["product_name"] = record.product.name
        data["product_sku"] = record.product.sku
    else:
        data["product_name"] = ""
        data["product_sku"] = ""
    return data

@router.get("/", response_model=PageResponse[InventoryInfo])
async def read_inventory(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页数量"),
    product_id: Optional[int] = Query(None, description="产品ID筛选"),
    change_type: Optional[str] = Query(None, description="变动类型筛选"),
) -> Any:
    skip = (page - 1) * size
    records = await crud_inventory.get_multi(
        db, skip=skip, limit=size, product_id=product_id, change_type=change_type
    )
    total = await crud_inventory.get_count(
        db, product_id=product_id, change_type=change_type
    )
    formatted_records = [format_inventory(r) for r in records]
    return page_success(formatted_records, total, page, size)

@router.get("/{inventory_id}", response_model=ResponseBase[InventoryInfo])
async def read_inventory_record(
    inventory_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    record = await crud_inventory.get(db, id=inventory_id)
    if not record:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    return success(data=format_inventory(record))

@router.post("/adjust", response_model=ResponseBase[InventoryInfo])
async def adjust_inventory(
    *,
    db: AsyncSession = Depends(get_db),
    adjust_in: InventoryAdjustCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    try:
        record = await crud_inventory.adjust(db, obj_in=adjust_in, operator=current_user.username)
        return success(data=format_inventory(record))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/check")
async def inventory_check(
    *,
    db: AsyncSession = Depends(get_db),
    product_id: int = Query(..., description="产品ID"),
    actual_qty: int = Query(..., description="实际库存数量"),
    remark: Optional[str] = Query(None, description="备注"),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    try:
        record = await crud_inventory.inventory_check(
            db, product_id=product_id, actual_qty=actual_qty, 
            operator=current_user.username, remark=remark
        )
        return success(data=format_inventory(record))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))