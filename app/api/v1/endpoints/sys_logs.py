from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_sys_log import crud_sys_log
from app.schemas.sys_log import SystemLog
from app.schemas.response import page_success, PageResponse, success, ResponseBase
from app.models.user import User
from app.db.session import get_db

router = APIRouter()

@router.get("/", response_model=PageResponse[SystemLog])
async def read_sys_logs(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页数量"),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    获取系统日志列表 (仅管理员)
    """
    skip = (page - 1) * size
    logs = await crud_sys_log.get_multi(db, skip=skip, limit=size)
    total = await crud_sys_log.get_count(db)
    return page_success(logs, total, page, size)

@router.delete("/{log_id}", response_model=ResponseBase[SystemLog])
async def delete_sys_log(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    删除系统日志 (仅管理员)
    """
    log = await crud_sys_log.get(db, id=log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    log = await crud_sys_log.remove(db, id=log_id)
    return success(data=log)
