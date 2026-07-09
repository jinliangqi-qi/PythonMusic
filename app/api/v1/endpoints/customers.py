from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_customer import crud_customer
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerInfo
from app.schemas.response import page_success, PageResponse, success, ResponseBase
from app.db.session import get_db

router = APIRouter()

# 注意：静态路由必须放在动态路由（/{customer_id}）之前

@router.get("/", response_model=PageResponse[CustomerInfo])
async def read_customers(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页数量"),
    name: Optional[str] = Query(None, description="客户名称搜索"),
    status: Optional[str] = Query(None, description="状态筛选"),
) -> Any:
    skip = (page - 1) * size
    customers = await crud_customer.get_multi(
        db, skip=skip, limit=size, name=name, status=status
    )
    total = await crud_customer.get_count(
        db, name=name, status=status
    )
    return page_success(customers, total, page, size)

# 静态路由放在 {customer_id} 之前
@router.get("/all", response_model=ResponseBase[List[CustomerInfo]])
async def read_all_customers(
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = Query("active", description="状态筛选"),
) -> Any:
    customers = await crud_customer.get_multi(
        db, skip=0, limit=1000, status=status
    )
    return success(data=customers)

# 动态路由放在最后
@router.get("/{customer_id}", response_model=ResponseBase[CustomerInfo])
async def read_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    customer = await crud_customer.get(db, id=customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return success(data=customer)

@router.post("/", response_model=ResponseBase[CustomerInfo])
async def create_customer(
    *,
    db: AsyncSession = Depends(get_db),
    customer_in: CustomerCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    customer = await crud_customer.create(db, obj_in=customer_in)
    return success(data=customer)

@router.put("/{customer_id}", response_model=ResponseBase[CustomerInfo])
async def update_customer(
    *,
    db: AsyncSession = Depends(get_db),
    customer_id: int,
    customer_in: CustomerUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    customer = await crud_customer.get(db, id=customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    customer = await crud_customer.update(db, db_obj=customer, obj_in=customer_in)
    return success(data=customer)

@router.delete("/{customer_id}", response_model=ResponseBase[CustomerInfo])
async def delete_customer(
    *,
    db: AsyncSession = Depends(get_db),
    customer_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    customer = await crud_customer.get(db, id=customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer = await crud_customer.remove(db, id=customer_id)
    return success(data=customer)