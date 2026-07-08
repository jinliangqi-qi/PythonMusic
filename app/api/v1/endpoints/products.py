from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_product import crud_product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductInfo
from app.schemas.response import page_success, PageResponse, success, ResponseBase
from app.db.session import get_db

router = APIRouter()

@router.get("/", response_model=PageResponse[ProductInfo])
async def read_products(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页数量"),
    name: Optional[str] = Query(None, description="产品名称搜索"),
    sku: Optional[str] = Query(None, description="SKU搜索"),
    category: Optional[str] = Query(None, description="分类筛选"),
    status: Optional[str] = Query(None, description="状态筛选"),
) -> Any:
    skip = (page - 1) * size
    products = await crud_product.get_multi(
        db, skip=skip, limit=size, name=name, sku=sku, category=category, status=status
    )
    total = await crud_product.get_count(
        db, name=name, sku=sku, category=category, status=status
    )
    return page_success(products, total, page, size)

@router.get("/{product_id}", response_model=ResponseBase[ProductInfo])
async def read_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    product = await crud_product.get(db, id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return success(data=product)

@router.post("/", response_model=ResponseBase[ProductInfo])
async def create_product(
    *,
    db: AsyncSession = Depends(get_db),
    product_in: ProductCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    existing = await crud_product.get_by_sku(db, sku=product_in.sku)
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
        
    product = await crud_product.create(db, obj_in=product_in)
    return success(data=product)

@router.put("/{product_id}", response_model=ResponseBase[ProductInfo])
async def update_product(
    *,
    db: AsyncSession = Depends(get_db),
    product_id: int,
    product_in: ProductUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    product = await crud_product.get(db, id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    if product_in.sku and product_in.sku != product.sku:
        existing = await crud_product.get_by_sku(db, sku=product_in.sku)
        if existing:
            raise HTTPException(status_code=400, detail="SKU already exists")
            
    product = await crud_product.update(db, db_obj=product, obj_in=product_in)
    return success(data=product)

@router.delete("/{product_id}", response_model=ResponseBase[ProductInfo])
async def delete_product(
    *,
    db: AsyncSession = Depends(get_db),
    product_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    product = await crud_product.get(db, id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product = await crud_product.remove(db, id=product_id)
    return success(data=product)

@router.get("/low-stock/", response_model=ResponseBase[List[ProductInfo]])
async def get_low_stock_products(
    db: AsyncSession = Depends(get_db),
) -> Any:
    products = await crud_product.get_low_stock_products(db)
    return success(data=products)