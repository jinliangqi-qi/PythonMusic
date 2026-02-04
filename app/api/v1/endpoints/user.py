from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select

from app.api import deps
from app.crud.crud_user import crud_user
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserInfo
from app.schemas.response import success, page_success, PageResponse, ResponseBase
from app.db.session import get_db

router = APIRouter()

@router.get("/", response_model=PageResponse[UserInfo])
async def read_users(
    db: AsyncSession = Depends(get_db),
    page: int = 1,
    size: int = 10,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    获取用户列表 (分页)
    """
    # 1. 计算跳过数量
    skip = (page - 1) * size
    
    # 2. 查询总数
    # 注意：func.count 应该在 select 中使用，或者使用 scalars().all() 后 len() (不推荐大数据量)
    # 更好的方式是分开查询
    total_query = select(func.count(User.id))
    total_result = await db.execute(total_query)
    total = total_result.scalar()
    
    # 3. 查询当前页数据
    users = await crud_user.get_multi(db, skip=skip, limit=size)
    
    # 4. 返回分页响应
    return page_success(users, total, page, size)

@router.post("/", response_model=ResponseBase[UserInfo])
async def create_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    创建新用户 (仅管理员)
    """
    # 1. 检查用户名是否已存在
    user = await crud_user.get_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    # 2. 创建用户
    user = await crud_user.create(db, obj_in=user_in)
    return success(data=user)

@router.put("/{user_id}", response_model=ResponseBase[UserInfo])
async def update_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    更新用户信息
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    user = await crud_user.update(db, db_obj=user, obj_in=user_in)
    return success(data=user)

@router.get("/{user_id}", response_model=ResponseBase[UserInfo])
async def read_user_by_id(
    user_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    根据 ID 获取用户详情
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return success(data=user)

@router.delete("/{user_id}", response_model=ResponseBase[UserInfo])
async def delete_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    删除用户 (管理员)
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # 防止删除自己
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
    # 普通管理员不能删除超级管理员
    if user.is_superuser and not current_user.is_superuser:
         raise HTTPException(status_code=403, detail="Not enough privileges to delete superuser")

    user = await crud_user.remove(db, id=user_id)
    return success(data=user)
