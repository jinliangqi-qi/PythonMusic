from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.crud.crud_user import crud_user

# OAuth2 方案
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    根据 Token 获取当前登录用户
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = await crud_user.get_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

async def get_current_user_optional(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False))
) -> Optional[User]:
    """
    尝试获取当前用户，如果未登录则返回 None，不抛出异常
    """
    if not token:
        return None
        
    try:
        payload = decode_access_token(token)
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
        
    user = await crud_user.get_by_username(db, username=username)
    if user and user.is_active:
        return user
    return None

async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    验证当前用户是否为超级管理员
    """
    if not current_user.is_superuser and current_user.role != "super_admin":
        print(f"DEBUG: Permission denied. User: {current_user.username}, Role: {current_user.role}, IsSuper: {current_user.is_superuser}")
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user

async def get_current_active_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    验证当前用户是否为管理员 (admin 或 super_admin)
    """
    allowed_roles = ["super_admin", "admin"]
    if current_user.role not in allowed_roles and not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges (Admin required)"
        )
    return current_user

async def get_current_auditor(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    验证当前用户是否为审核员或更高权限
    """
    allowed_roles = ["super_admin", "admin", "auditor"]
    if current_user.role not in allowed_roles and not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges (Auditor required)"
        )
    return current_user
