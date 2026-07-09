from typing import Any, Optional
from fastapi import APIRouter, Depends, Request, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.crud.crud_app_log import crud_app_log
from app.schemas.app_log import AppLogCreate, AppLogBatchCreate, AppLogInfo
from app.schemas.response import page_success, PageResponse, success, ResponseBase
from app.db.session import get_db

router = APIRouter()


def get_client_info(request: Request) -> tuple:
    """获取客户端信息"""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", None)
    return client_ip, user_agent


@router.post("/", response_model=ResponseBase[AppLogInfo])
async def create_log(
    request: Request,
    db: AsyncSession = Depends(get_db),
    log_in: AppLogCreate = None,
) -> Any:
    """上报单条日志（公开接口，无需认证）"""
    client_ip, user_agent = get_client_info(request)
    log = await crud_app_log.create(db, obj_in=log_in, client_ip=client_ip, user_agent=user_agent)
    return success(data=log)


@router.post("/batch", response_model=ResponseBase[dict])
async def create_logs_batch(
    request: Request,
    db: AsyncSession = Depends(get_db),
    batch_in: AppLogBatchCreate = None,
) -> Any:
    """批量上报日志（公开接口，无需认证）"""
    client_ip, user_agent = get_client_info(request)
    
    logs = await crud_app_log.create_batch(
        db,
        logs=batch_in.logs,
        client_ip=client_ip,
        user_agent=user_agent,
        environment=batch_in.environment,
        app_version=batch_in.app_version,
        browser=batch_in.browser,
        os=batch_in.os,
        device=batch_in.device,
    )
    
    return success(data={
        "count": len(logs),
        "message": f"成功上报 {len(logs)} 条日志"
    })


@router.get("/", response_model=PageResponse[AppLogInfo])
async def read_logs(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    level: Optional[str] = Query(None, description="日志级别筛选"),
    source: Optional[str] = Query(None, description="来源筛选"),
    user_id: Optional[int] = Query(None, description="用户ID筛选"),
    environment: Optional[str] = Query(None, description="环境筛选"),
    keyword: Optional[str] = Query(None, description="关键词搜索"),
    days: Optional[int] = Query(7, description="查询最近N天的日志"),
) -> Any:
    """查询日志列表（需要管理员权限）"""
    skip = (page - 1) * size
    
    start_date = datetime.utcnow() - timedelta(days=days) if days else None
    
    logs = await crud_app_log.get_multi(
        db, 
        skip=skip, 
        limit=size,
        level=level,
        source=source,
        user_id=user_id,
        environment=environment,
        start_date=start_date,
        keyword=keyword,
    )
    
    total = await crud_app_log.get_count(
        db,
        level=level,
        source=source,
        user_id=user_id,
        environment=environment,
        start_date=start_date,
        keyword=keyword,
    )
    
    return page_success(logs, total, page, size)


@router.get("/stats", response_model=ResponseBase[dict])
async def get_log_stats(
    db: AsyncSession = Depends(get_db),
    hours: int = Query(24, ge=1, le=168, description="统计最近N小时"),
) -> Any:
    """获取日志统计（需要管理员权限）"""
    stats = await crud_app_log.get_stats(db, hours=hours)
    return success(data=stats)


@router.get("/{log_id}", response_model=ResponseBase[AppLogInfo])
async def read_log(
    log_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取日志详情"""
    log = await crud_app_log.get(db, id=log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return success(data=log)


@router.delete("/{log_id}", response_model=ResponseBase[AppLogInfo])
async def delete_log(
    log_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """删除日志"""
    log = await crud_app_log.get(db, id=log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    log = await crud_app_log.remove(db, id=log_id)
    return success(data=log)


@router.delete("/cleanup", response_model=ResponseBase[dict])
async def cleanup_old_logs(
    db: AsyncSession = Depends(get_db),
    days: int = Query(30, ge=1, description="删除N天前的日志"),
) -> Any:
    """清理旧日志"""
    count = await crud_app_log.remove_old_logs(db, days=days)
    return success(data={
        "deleted_count": count,
        "message": f"已删除 {count} 条 {days} 天前的日志"
    })