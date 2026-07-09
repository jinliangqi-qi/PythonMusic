from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select

from app.api import deps
from app.crud.crud_user import crud_user
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserInfo
from app.schemas.response import success, page_success, PageResponse, ResponseBase
from app.db.session import get_db

router = APIRouter()

# 注意：静态路由必须放在动态路由（/{user_id}）之前

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
    skip = (page - 1) * size
    
    total_query = select(func.count(User.id))
    total_result = await db.execute(total_query)
    total = total_result.scalar()
    
    users = await crud_user.get_multi(db, skip=skip, limit=size)
    
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
    user = await crud_user.get_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = await crud_user.create(db, obj_in=user_in)
    return success(data=user)

# 动态路由放在最后
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