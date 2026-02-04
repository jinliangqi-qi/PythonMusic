from typing import List, Optional, Union, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate

class CRUDCategory:
    async def get(self, db: AsyncSession, id: int) -> Optional[Category]:
        # 预加载 children
        query = select(Category).options(selectinload(Category.children)).where(Category.id == id)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100, parent_id: Optional[int] = None
    ) -> List[Category]:
        # 默认只查询顶级分类 (parent_id is None)，然后通过 selectinload 递归加载子分类
        # 但如果指定了 parent_id，则查询该分类的子分类
        
        # 使用 selectinload 加载 children 时，对于无限层级，可能需要配置递归深度或者改用其他策略
        # 但对于简单的二级分类，selectinload(Category.children) 足够
        # 如果是多级，且需要一次性全部加载，selectinload 可能只会加载一层
        # 更好的方式是只加载当前层，前端按需加载，或者后端使用 CTE 递归查询（复杂）
        # 这里为了解决 MissingGreenlet 错误，确保 selectinload 正确使用
        
        query = select(Category).options(selectinload(Category.children))
        
        if parent_id is not None:
            query = query.where(Category.parent_id == parent_id)
        else:
            # 默认查顶级
            query = query.where(Category.parent_id.is_(None))
            
        query = query.order_by(Category.sort_order).offset(skip).limit(limit)
        result = await db.execute(query)
        # 关键：unique() 确保结果去重（虽然这里可能不需要，但对多对多或特定关联是好习惯）
        # 最重要的是，返回的对象仍然绑定在 session 上，访问 children 会触发 lazy load
        # 由于我们用了 selectinload，children 应该已经被填充了
        return result.scalars().all()

    async def create(self, db: AsyncSession, obj_in: CategoryCreate) -> Category:
        db_obj = Category(
            name=obj_in.name,
            parent_id=obj_in.parent_id,
            sort_order=obj_in.sort_order,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: Category, obj_in: Union[CategoryUpdate, Dict[str, Any]]
    ) -> Category:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
            
        for field, value in update_data.items():
            setattr(db_obj, field, value)
            
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, *, id: int) -> Category:
        obj = await self.get(db, id)
        await db.delete(obj)
        await db.commit()
        return obj

crud_category = CRUDCategory()
