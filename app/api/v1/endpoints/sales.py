from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_sales import crud_sales
from app.crud.crud_customer import crud_customer
from app.models.user import User
from app.schemas.sales import SalesOrderCreate, SalesOrderUpdate, SalesOrderInfo
from app.schemas.response import page_success, PageResponse, success, ResponseBase
from app.db.session import get_db
from fastapi.encoders import jsonable_encoder

router = APIRouter()

def format_sales_order(order):
    data = jsonable_encoder(order)
    data["customer_name"] = order.customer.name if order.customer else ""
    for item in data["items"]:
        item_obj = next((i for i in order.items if i.id == item["id"]), None)
        if item_obj and item_obj.product:
            item["product_name"] = item_obj.product.name
            item["product_sku"] = item_obj.product.sku
        else:
            item["product_name"] = ""
            item["product_sku"] = ""
    return data

@router.get("/", response_model=PageResponse[SalesOrderInfo])
async def read_sales(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页数量"),
    customer_id: Optional[int] = Query(None, description="客户ID筛选"),
    status: Optional[str] = Query(None, description="状态筛选"),
    order_no: Optional[str] = Query(None, description="销售单号搜索"),
) -> Any:
    skip = (page - 1) * size
    orders = await crud_sales.get_multi(
        db, skip=skip, limit=size, customer_id=customer_id, status=status, order_no=order_no
    )
    total = await crud_sales.get_count(
        db, customer_id=customer_id, status=status, order_no=order_no
    )
    formatted_orders = [format_sales_order(o) for o in orders]
    return page_success(formatted_orders, total, page, size)

@router.get("/{sales_id}", response_model=ResponseBase[SalesOrderInfo])
async def read_sales_order(
    sales_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    order = await crud_sales.get(db, id=sales_id)
    if not order:
        raise HTTPException(status_code=404, detail="Sales order not found")
    return success(data=format_sales_order(order))

@router.post("/", response_model=ResponseBase[SalesOrderInfo])
async def create_sales(
    *,
    db: AsyncSession = Depends(get_db),
    sales_in: SalesOrderCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    customer = await crud_customer.get(db, id=sales_in.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    try:
        order = await crud_sales.create(db, obj_in=sales_in, operator=current_user.username)
        return success(data=format_sales_order(order))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{sales_id}", response_model=ResponseBase[SalesOrderInfo])
async def update_sales(
    *,
    db: AsyncSession = Depends(get_db),
    sales_id: int,
    sales_in: SalesOrderUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    order = await crud_sales.get(db, id=sales_id)
    if not order:
        raise HTTPException(status_code=404, detail="Sales order not found")
        
    order = await crud_sales.update(db, db_obj=order, obj_in=sales_in)
    return success(data=format_sales_order(order))

@router.post("/{sales_id}/approve")
async def approve_sales(
    *,
    db: AsyncSession = Depends(get_db),
    sales_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    order = await crud_sales.get(db, id=sales_id)
    if not order:
        raise HTTPException(status_code=404, detail="Sales order not found")
        
    order = await crud_sales.update(db, db_obj=order, obj_in={"status": "approved"})
    return success(data=format_sales_order(order))

@router.post("/{sales_id}/ship")
async def ship_sales(
    *,
    db: AsyncSession = Depends(get_db),
    sales_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    try:
        order = await crud_sales.ship(db, id=sales_id, operator=current_user.username)
        return success(data=format_sales_order(order))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{sales_id}/complete")
async def complete_sales(
    *,
    db: AsyncSession = Depends(get_db),
    sales_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    try:
        order = await crud_sales.complete(db, id=sales_id)
        return success(data=format_sales_order(order))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{sales_id}/cancel")
async def cancel_sales(
    *,
    db: AsyncSession = Depends(get_db),
    sales_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    try:
        order = await crud_sales.cancel(db, id=sales_id, operator=current_user.username)
        return success(data=format_sales_order(order))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{sales_id}/receive-payment")
async def receive_sales_payment(
    *,
    db: AsyncSession = Depends(get_db),
    sales_id: int,
    amount: float = Query(..., gt=0, description="收款金额"),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    try:
        order = await crud_sales.receive_payment(db, id=sales_id, amount=amount, operator=current_user.username)
        return success(data=format_sales_order(order))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{sales_id}", response_model=ResponseBase[SalesOrderInfo])
async def delete_sales(
    *,
    db: AsyncSession = Depends(get_db),
    sales_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    order = await crud_sales.get(db, id=sales_id)
    if not order:
        raise HTTPException(status_code=404, detail="Sales order not found")
    order = await crud_sales.remove(db, id=sales_id)
    return success(data=format_sales_order(order))