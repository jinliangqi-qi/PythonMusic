from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_purchase import crud_purchase
from app.crud.crud_supplier import crud_supplier
from app.models.user import User
from app.schemas.purchase import PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderInfo
from app.schemas.response import page_success, PageResponse, success, ResponseBase
from app.db.session import get_db
from fastapi.encoders import jsonable_encoder

router = APIRouter()

def format_purchase_order(order):
    data = jsonable_encoder(order)
    data["supplier_name"] = order.supplier.name if order.supplier else ""
    for item in data["items"]:
        item_obj = next((i for i in order.items if i.id == item["id"]), None)
        if item_obj and item_obj.product:
            item["product_name"] = item_obj.product.name
            item["product_sku"] = item_obj.product.sku
        else:
            item["product_name"] = ""
            item["product_sku"] = ""
    return data

@router.get("/", response_model=PageResponse[PurchaseOrderInfo])
async def read_purchases(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页数量"),
    supplier_id: Optional[int] = Query(None, description="供应商ID筛选"),
    status: Optional[str] = Query(None, description="状态筛选"),
    order_no: Optional[str] = Query(None, description="采购单号搜索"),
) -> Any:
    skip = (page - 1) * size
    orders = await crud_purchase.get_multi(
        db, skip=skip, limit=size, supplier_id=supplier_id, status=status, order_no=order_no
    )
    total = await crud_purchase.get_count(
        db, supplier_id=supplier_id, status=status, order_no=order_no
    )
    formatted_orders = [format_purchase_order(o) for o in orders]
    return page_success(formatted_orders, total, page, size)

@router.get("/{purchase_id}", response_model=ResponseBase[PurchaseOrderInfo])
async def read_purchase(
    purchase_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    order = await crud_purchase.get(db, id=purchase_id)
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return success(data=format_purchase_order(order))

@router.post("/", response_model=ResponseBase[PurchaseOrderInfo])
async def create_purchase(
    *,
    db: AsyncSession = Depends(get_db),
    purchase_in: PurchaseOrderCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    supplier = await crud_supplier.get(db, id=purchase_in.supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    order = await crud_purchase.create(db, obj_in=purchase_in, operator=current_user.username)
    return success(data=format_purchase_order(order))

@router.put("/{purchase_id}", response_model=ResponseBase[PurchaseOrderInfo])
async def update_purchase(
    *,
    db: AsyncSession = Depends(get_db),
    purchase_id: int,
    purchase_in: PurchaseOrderUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    order = await crud_purchase.get(db, id=purchase_id)
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
        
    order = await crud_purchase.update(db, db_obj=order, obj_in=purchase_in)
    return success(data=format_purchase_order(order))

@router.post("/{purchase_id}/approve")
async def approve_purchase(
    *,
    db: AsyncSession = Depends(get_db),
    purchase_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    order = await crud_purchase.get(db, id=purchase_id)
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
        
    order = await crud_purchase.update(db, db_obj=order, obj_in={"status": "approved"})
    return success(data=format_purchase_order(order))

@router.post("/{purchase_id}/receive")
async def receive_purchase(
    *,
    db: AsyncSession = Depends(get_db),
    purchase_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    try:
        order = await crud_purchase.receive(db, id=purchase_id, operator=current_user.username)
        return success(data=format_purchase_order(order))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{purchase_id}/cancel")
async def cancel_purchase(
    *,
    db: AsyncSession = Depends(get_db),
    purchase_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    try:
        order = await crud_purchase.cancel(db, id=purchase_id, operator=current_user.username)
        return success(data=format_purchase_order(order))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{purchase_id}/pay")
async def pay_purchase(
    *,
    db: AsyncSession = Depends(get_db),
    purchase_id: int,
    amount: float = Query(..., gt=0, description="付款金额"),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    try:
        order = await crud_purchase.pay(db, id=purchase_id, amount=amount, operator=current_user.username)
        return success(data=format_purchase_order(order))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{purchase_id}", response_model=ResponseBase[PurchaseOrderInfo])
async def delete_purchase(
    *,
    db: AsyncSession = Depends(get_db),
    purchase_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    order = await crud_purchase.get(db, id=purchase_id)
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    order = await crud_purchase.remove(db, id=purchase_id)
    return success(data=format_purchase_order(order))