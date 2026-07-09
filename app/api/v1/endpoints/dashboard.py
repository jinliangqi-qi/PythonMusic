from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api import deps
from app.db.session import get_db
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.customer import Customer
from app.models.purchase import PurchaseOrder
from app.models.sales import SalesOrder
from app.models.inventory import Inventory
from app.models.user import User
from app.schemas.response import success

router = APIRouter()

@router.get("/")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    product_count = await db.execute(select(func.count(Product.id)))
    supplier_count = await db.execute(select(func.count(Supplier.id)))
    customer_count = await db.execute(select(func.count(Customer.id)))
    
    purchase_total = await db.execute(select(func.sum(PurchaseOrder.total_amount)))
    sales_total = await db.execute(select(func.sum(SalesOrder.total_amount)))
    
    pending_purchases = await db.execute(select(func.count(PurchaseOrder.id)).where(PurchaseOrder.status == "pending"))
    pending_sales = await db.execute(select(func.count(SalesOrder.id)).where(SalesOrder.status == "pending"))
    
    low_stock_count = await db.execute(select(func.count(Product.id)).where(Product.stock_qty <= Product.min_stock))
    
    total_stock = await db.execute(select(func.sum(Product.stock_qty)))
    
    inventory_changes = await db.execute(
        select(Inventory.change_type, func.sum(Inventory.change_qty).label('total'))
        .group_by(Inventory.change_type)
    )
    
    change_stats = {}
    for row in inventory_changes.all():
        change_stats[row.change_type] = row.total or 0
    
    return success(data={
        "product_count": product_count.scalar() or 0,
        "supplier_count": supplier_count.scalar() or 0,
        "customer_count": customer_count.scalar() or 0,
        "total_stock": total_stock.scalar() or 0,
        "purchase_total": purchase_total.scalar() or 0,
        "sales_total": sales_total.scalar() or 0,
        "pending_purchases": pending_purchases.scalar() or 0,
        "pending_sales": pending_sales.scalar() or 0,
        "low_stock_count": low_stock_count.scalar() or 0,
        "inventory_changes": {
            "purchase": change_stats.get("purchase", 0),
            "sale": change_stats.get("sale", 0),
            "adjust": change_stats.get("adjust", 0),
            "inventory": change_stats.get("inventory", 0),
        }
    })