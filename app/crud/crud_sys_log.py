from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models.sys_log import SystemLog
from app.schemas.sys_log import SystemLogCreate

class CRUDSystemLog:
    async def get(self, db: AsyncSession, id: int) -> Optional[SystemLog]:
        result = await db.execute(select(SystemLog).where(SystemLog.id == id))
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[SystemLog]:
        result = await db.execute(
            select(SystemLog)
            .order_by(desc(SystemLog.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_count(self, db: AsyncSession) -> int:
        result = await db.scalar(select(func.count(SystemLog.id)))
        return result or 0

    async def create(self, db: AsyncSession, obj_in: SystemLogCreate) -> SystemLog:
        db_obj = SystemLog(
            path=obj_in.path,
            method=obj_in.method,
            ip=obj_in.ip,
            status_code=obj_in.status_code,
            error_detail=obj_in.error_detail,
            user_id=obj_in.user_id
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, *, id: int) -> SystemLog:
        obj = await self.get(db, id)
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj

crud_sys_log = CRUDSystemLog()
