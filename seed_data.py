import asyncio
from datetime import datetime, date

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.customer import Customer
from app.models.purchase import PurchaseOrder, PurchaseOrderItem
from app.models.sales import SalesOrder, SalesOrderItem
from app.models.inventory import Inventory

async def seed_data():
    async with AsyncSessionLocal() as db:
        print("--- Start seeding inventory system data ---")
        
        # 1. Create Suppliers
        print("Creating suppliers...")
        suppliers_data = [
            {"name": "深圳市华强电子有限公司", "contact_name": "张经理", "phone": "13800138001", "email": "zhang@huaqiang.com", "address": "深圳市福田区华强北路100号", "tax_id": "91440300MA5XXXXXX1"},
            {"name": "广州建材批发中心", "contact_name": "李总", "phone": "13900139002", "email": "li@gzjc.com", "address": "广州市天河区建材市场A区", "tax_id": "91440100MA5XXXXXX2"},
            {"name": "上海办公用品供应商", "contact_name": "王女士", "phone": "13700137003", "email": "wang@shbg.com", "address": "上海市浦东新区办公大厦", "tax_id": "91310000MA5XXXXXX3"},
            {"name": "北京食品饮料公司", "contact_name": "赵先生", "phone": "13600136004", "email": "zhao@bjsp.com", "address": "北京市朝阳区食品工业园", "tax_id": "91110000MA5XXXXXX4"},
        ]
        
        suppliers = []
        for s in suppliers_data:
            stmt = select(Supplier).where(Supplier.name == s["name"])
            existing = await db.scalar(stmt)
            if not existing:
                supplier = Supplier(**s)
                db.add(supplier)
                suppliers.append(supplier)
            else:
                suppliers.append(existing)
        await db.commit()
        for s in suppliers:
            await db.refresh(s)

        # 2. Create Customers
        print("Creating customers...")
        customers_data = [
            {"name": "北京贸易有限公司", "contact_name": "刘经理", "phone": "13500135001", "email": "liu@bjmy.com", "address": "北京市海淀区贸易大厦", "tax_id": "91110000MA5YYYYYY1"},
            {"name": "上海零售连锁集团", "contact_name": "陈总", "phone": "13400134002", "email": "chen@shls.com", "address": "上海市静安区商业街", "tax_id": "91310000MA5YYYYYY2"},
            {"name": "广州电商公司", "contact_name": "黄女士", "phone": "13300133003", "email": "huang@gzds.com", "address": "广州市番禺区电商园", "tax_id": "91440100MA5YYYYYY3"},
            {"name": "深圳科技公司", "contact_name": "吴先生", "phone": "13200132004", "email": "wu@szkj.com", "address": "深圳市南山区科技园", "tax_id": "91440300MA5YYYYYY4"},
        ]
        
        customers = []
        for c in customers_data:
            stmt = select(Customer).where(Customer.name == c["name"])
            existing = await db.scalar(stmt)
            if not existing:
                customer = Customer(**c)
                db.add(customer)
                customers.append(customer)
            else:
                customers.append(existing)
        await db.commit()
        for c in customers:
            await db.refresh(c)

        # 3. Create Products
        print("Creating products...")
        products_data = [
            {"name": "无线蓝牙耳机", "sku": "SKU001", "category": "电子产品", "unit": "个", "purchase_price": 80.0, "sale_price": 159.0, "cost_price": 85.0, "supplier_id": suppliers[0].id, "stock_qty": 200, "min_stock": 50, "max_stock": 500, "description": "高音质无线蓝牙耳机，续航24小时"},
            {"name": "机械键盘", "sku": "SKU002", "category": "电子产品", "unit": "个", "purchase_price": 120.0, "sale_price": 299.0, "cost_price": 125.0, "supplier_id": suppliers[0].id, "stock_qty": 100, "min_stock": 30, "max_stock": 300, "description": "青轴机械键盘，RGB背光"},
            {"name": "A4打印纸（500张）", "sku": "SKU003", "category": "办公用品", "unit": "包", "purchase_price": 15.0, "sale_price": 25.0, "cost_price": 16.0, "supplier_id": suppliers[2].id, "stock_qty": 500, "min_stock": 100, "max_stock": 1000, "description": "80g A4复印纸，500张/包"},
            {"name": "中性笔（黑色）", "sku": "SKU004", "category": "办公用品", "unit": "支", "purchase_price": 1.5, "sale_price": 3.0, "cost_price": 1.8, "supplier_id": suppliers[2].id, "stock_qty": 1000, "min_stock": 200, "max_stock": 2000, "description": "0.5mm黑色中性笔"},
            {"name": "矿泉水（550ml）", "sku": "SKU005", "category": "食品饮料", "unit": "瓶", "purchase_price": 1.0, "sale_price": 2.5, "cost_price": 1.2, "supplier_id": suppliers[3].id, "stock_qty": 2000, "min_stock": 500, "max_stock": 5000, "description": "550ml瓶装矿泉水"},
            {"name": "办公椅", "sku": "SKU006", "category": "办公家具", "unit": "把", "purchase_price": 200.0, "sale_price": 399.0, "cost_price": 210.0, "supplier_id": suppliers[1].id, "stock_qty": 50, "min_stock": 10, "max_stock": 100, "description": "人体工学办公椅，可升降"},
            {"name": "笔记本电脑支架", "sku": "SKU007", "category": "电子产品", "unit": "个", "purchase_price": 45.0, "sale_price": 89.0, "cost_price": 48.0, "supplier_id": suppliers[0].id, "stock_qty": 150, "min_stock": 30, "max_stock": 300, "description": "铝合金笔记本电脑支架，散热设计"},
            {"name": "文件收纳盒", "sku": "SKU008", "category": "办公用品", "unit": "个", "purchase_price": 8.0, "sale_price": 19.9, "cost_price": 9.0, "supplier_id": suppliers[2].id, "stock_qty": 300, "min_stock": 50, "max_stock": 500, "description": "桌面文件收纳盒，多层设计"},
        ]
        
        products = []
        for p in products_data:
            stmt = select(Product).where(Product.sku == p["sku"])
            existing = await db.scalar(stmt)
            if not existing:
                product = Product(**p)
                db.add(product)
                products.append(product)
            else:
                products.append(existing)
        await db.commit()
        for p in products:
            await db.refresh(p)

        # 4. Create a sample purchase order
        print("Creating sample purchase order...")
        stmt = select(PurchaseOrder).where(PurchaseOrder.order_no == "PO20250101SAMPLE")
        existing = await db.scalar(stmt)
        if not existing:
            purchase_order = PurchaseOrder(
                order_no="PO20250101SAMPLE",
                supplier_id=suppliers[0].id,
                total_amount=products[0].purchase_price * 50 + products[1].purchase_price * 30,
                status="completed",
                remark="示例采购单",
            )
            db.add(purchase_order)
            await db.flush()
            
            items = [
                {"product_id": products[0].id, "quantity": 50, "unit_price": products[0].purchase_price, "amount": products[0].purchase_price * 50, "received_qty": 50},
                {"product_id": products[1].id, "quantity": 30, "unit_price": products[1].purchase_price, "amount": products[1].purchase_price * 30, "received_qty": 30},
            ]
            for item in items:
                po_item = PurchaseOrderItem(
                    purchase_order_id=purchase_order.id,
                    **item
                )
                db.add(po_item)
                
                inventory = Inventory(
                    product_id=item["product_id"],
                    change_type="purchase",
                    change_qty=item["quantity"],
                    before_qty=0,
                    after_qty=item["quantity"],
                    related_order_no=purchase_order.order_no,
                    operator="admin",
                    remark=f"初始库存: {purchase_order.order_no}"
                )
                db.add(inventory)
            
            await db.commit()

        # 5. Create a sample sales order
        print("Creating sample sales order...")
        stmt = select(SalesOrder).where(SalesOrder.order_no == "SO20250101SAMPLE")
        existing = await db.scalar(stmt)
        if not existing:
            sales_order = SalesOrder(
                order_no="SO20250101SAMPLE",
                customer_id=customers[0].id,
                total_amount=products[0].sale_price * 20 + products[2].sale_price * 50,
                status="completed",
                remark="示例销售单",
            )
            db.add(sales_order)
            await db.flush()
            
            items = [
                {"product_id": products[0].id, "quantity": 20, "unit_price": products[0].sale_price, "amount": products[0].sale_price * 20, "shipped_qty": 20},
                {"product_id": products[2].id, "quantity": 50, "unit_price": products[2].sale_price, "amount": products[2].sale_price * 50, "shipped_qty": 50},
            ]
            for item in items:
                so_item = SalesOrderItem(
                    sales_order_id=sales_order.id,
                    **item
                )
                db.add(so_item)
                
                product = await db.get(Product, item["product_id"])
                if product:
                    before_qty = product.stock_qty
                    product.stock_qty -= item["quantity"]
                    
                    inventory = Inventory(
                        product_id=item["product_id"],
                        change_type="sale",
                        change_qty=-item["quantity"],
                        before_qty=before_qty,
                        after_qty=before_qty - item["quantity"],
                        related_order_no=sales_order.order_no,
                        operator="admin",
                        remark=f"销售出库: {sales_order.order_no}"
                    )
                    db.add(inventory)
            
            await db.commit()
        
        print("--- Data seeding completed ---")

if __name__ == "__main__":
    asyncio.run(seed_data())