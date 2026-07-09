from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta

from app.models.app_log import AppLog
from app.schemas.app_log import AppLogCreate


class CRUDAppLog:
    async def create(self, db: AsyncSession, obj_in: AppLogCreate, client_ip: str = None, user_agent: str = None) -> AppLog:
        """创建单条日志"""
        db_obj = AppLog(
            level=obj_in.level,
            message=obj_in.message,
            source=obj_in.source,
            logger_name=obj_in.logger_name,
            error_type=obj_in.error_type,
            error_stack=obj_in.error_stack,
            environment=obj_in.environment,
            app_version=obj_in.app_version,
            browser=obj_in.browser,
            os=obj_in.os,
            device=obj_in.device,
            url=obj_in.url,
            user_id=obj_in.user_id,
            extra_data=obj_in.extra_data,
            client_ip=client_ip,
            user_agent=user_agent,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def create_batch(self, db: AsyncSession, logs: List[AppLogCreate], 
                          client_ip: str = None, user_agent: str = None,
                          environment: str = None, app_version: str = None,
                          browser: str = None, os: str = None, device: str = None) -> List[AppLog]:
        """批量创建日志"""
        db_objs = []
        for log in logs:
            db_obj = AppLog(
                level=log.level,
                message=log.message,
                source=log.source,
                logger_name=log.logger_name,
                error_type=log.error_type,
                error_stack=log.error_stack,
                environment=log.environment or environment,
                app_version=log.app_version or app_version,
                browser=log.browser or browser,
                os=log.os or os,
                device=log.device or device,
                url=log.url,
                user_id=log.user_id,
                extra_data=log.extra_data,
                client_ip=client_ip,
                user_agent=user_agent,
            )
            db_objs.append(db_obj)
            db.add(db_obj)
        
        await db.commit()
        for obj in db_objs:
            await db.refresh(obj)
        return db_objs

    async def get(self, db: AsyncSession, id: int) -> Optional[AppLog]:
        query = select(AppLog).where(AppLog.id == id)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_multi(
        self, 
        db: AsyncSession, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        level: Optional[str] = None,
        source: Optional[str] = None,
        user_id: Optional[int] = None,
        environment: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        keyword: Optional[str] = None,
    ) -> List[AppLog]:
        """多条件查询日志"""
        query = select(AppLog)
        
        conditions = []
        if level:
            conditions.append(AppLog.level == level)
        if source:
            conditions.append(AppLog.source == source)
        if user_id:
            conditions.append(AppLog.user_id == user_id)
        if environment:
            conditions.append(AppLog.environment == environment)
        if start_date:
            conditions.append(AppLog.created_at >= start_date)
        if end_date:
            conditions.append(AppLog.created_at <= end_date)
        if keyword:
            conditions.append(AppLog.message.ilike(f"%{keyword}%"))
        
        if conditions:
            query = query.where(and_(*conditions))
        
        query = query.order_by(AppLog.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_count(
        self, 
        db: AsyncSession,
        *,
        level: Optional[str] = None,
        source: Optional[str] = None,
        user_id: Optional[int] = None,
        environment: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        keyword: Optional[str] = None,
    ) -> int:
        """统计日志数量"""
        query = select(func.count(AppLog.id))
        
        conditions = []
        if level:
            conditions.append(AppLog.level == level)
        if source:
            conditions.append(AppLog.source == source)
        if user_id:
            conditions.append(AppLog.user_id == user_id)
        if environment:
            conditions.append(AppLog.environment == environment)
        if start_date:
            conditions.append(AppLog.created_at >= start_date)
        if end_date:
            conditions.append(AppLog.created_at <= end_date)
        if keyword:
            conditions.append(AppLog.message.ilike(f"%{keyword}%"))
        
        if conditions:
            query = query.where(and_(*conditions))
        
        result = await db.execute(query)
        return result.scalar() or 0

    async def get_stats(self, db: AsyncSession, hours: int = 24) -> dict:
        """获取日志统计"""
        since = datetime.utcnow() - timedelta(hours=hours)
        
        # 按级别统计
        level_query = select(AppLog.level, func.count(AppLog.id)).where(
            AppLog.created_at >= since
        ).group_by(AppLog.level)
        level_result = await db.execute(level_query)
        level_stats = {row[0]: row[1] for row in level_result}
        
        # 按来源统计
        source_query = select(AppLog.source, func.count(AppLog.id)).where(
            AppLog.created_at >= since
        ).group_by(AppLog.source)
        source_result = await db.execute(source_query)
        source_stats = {row[0]: row[1] for row in source_result}
        
        # 总数
        total = await self.get_count(db, start_date=since)
        
        # 错误数
        error_count = await self.get_count(db, level="error", start_date=since)
        fatal_count = await self.get_count(db, level="fatal", start_date=since)
        
        return {
            "total": total,
            "error_count": error_count,
            "fatal_count": fatal_count,
            "by_level": level_stats,
            "by_source": source_stats,
        }

    async def remove(self, db: AsyncSession, *, id: int) -> AppLog:
        query = select(AppLog).where(AppLog.id == id)
        result = await db.execute(query)
        db_obj = result.scalars().first()
        
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
            return db_obj
        return None

    async def remove_old_logs(self, db: AsyncSession, days: int = 30) -> int:
        """清理旧日志"""
        cutoff = datetime.utcnow() - timedelta(days=days)
        query = select(AppLog).where(AppLog.created_at < cutoff)
        result = await db.execute(query)
        logs_to_delete = result.scalars().all()
        
        count = len(logs_to_delete)
        for log in logs_to_delete:
            await db.delete(log)
        
        await db.commit()
        return count


crud_app_log = CRUDAppLog()