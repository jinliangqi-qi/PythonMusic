from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.security import create_access_token
from app.db.session import get_db
from app.crud.crud_user import crud_user
from app.schemas.auth import LoginRequest, LoginResponse, Token, ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.user import UserInfo, UserCreate
from app.schemas.response import success, fail
from app.models.user import User
from app.core.limiter import limiter
from app.core.cache import cache
import random
import string
import time

router = APIRouter()

# 简单的内存验证码存储 (仅用于演示，生产环境请使用 Redis)
MEMORY_CODE_CACHE = {}

@router.post("/forgot-password", response_model=Any)
async def forgot_password(
    *,
    db: AsyncSession = Depends(get_db),
    request: ForgotPasswordRequest,
) -> Any:
    """
    忘记密码 - 发送验证码
    """
    user = await crud_user.get_by_email(db, email=request.email)
    if not user:
        # 为了安全，通常不提示邮箱不存在，但为了演示方便，这里提示
        raise HTTPException(status_code=404, detail="该邮箱未注册")
    
    # 生成验证码
    code = ''.join(random.choices(string.digits, k=6))
    
    # 存入缓存 (5分钟有效)
    MEMORY_CODE_CACHE[request.email] = {
        "code": code,
        "expire": time.time() + 300
    }
    
    # 实际场景应调用邮件发送服务
    # send_email(to=request.email, code=code)
    print(f"DEBUG: Email: {request.email}, Code: {code}")
    
    return success(message="验证码已发送 (测试环境: 请查看控制台或响应)", data={"debug_code": code})

@router.post("/reset-password", response_model=Any)
async def reset_password(
    *,
    db: AsyncSession = Depends(get_db),
    request: ResetPasswordRequest,
) -> Any:
    """
    重置密码
    """
    # 验证验证码
    cached = MEMORY_CODE_CACHE.get(request.email)
    if not cached:
        raise HTTPException(status_code=400, detail="验证码无效或已过期")
        
    if time.time() > cached["expire"]:
        del MEMORY_CODE_CACHE[request.email]
        raise HTTPException(status_code=400, detail="验证码已过期")
        
    if cached["code"] != request.code:
        raise HTTPException(status_code=400, detail="验证码错误")
        
    # 获取用户
    user = await crud_user.get_by_email(db, email=request.email)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
        
    # 更新密码
    await crud_user.update(db, db_obj=user, obj_in={"password": request.new_password})
    
    # 清除验证码
    del MEMORY_CODE_CACHE[request.email]
    
    return success(message="密码重置成功")

@router.post("/register", response_model=UserInfo)
async def register(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    用户注册
    """
    user = await crud_user.get_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=400,
            detail="用户名已存在",
        )
    if user_in.email:
        user_by_email = await crud_user.get_by_email(db, email=user_in.email)
        if user_by_email:
            raise HTTPException(
                status_code=400,
                detail="邮箱已注册",
            )
            
    user = await crud_user.create(db, obj_in=user_in)
    return user

@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    用户登录
    """
    user = await crud_user.authenticate(
        db, username=login_data.username, password=login_data.password
    )
    if not user:
        # 这里返回业务异常或HTTP异常均可，视前端约定
        raise HTTPException(status_code=400, detail="用户名或密码错误")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="用户未激活")
    
    access_token = create_access_token(subject=user.username)
    
    return {
        "token": {
            "access_token": access_token,
            "token_type": "bearer"
        },
        "user_info": {
            "username": user.username,
            "nickname": user.nickname,
            "id": user.id,
            "role": user.role,
            "is_superuser": user.is_superuser
        }
    }

@router.get("/me", response_model=UserInfo)
async def read_users_me(
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    获取当前登录用户信息
    """
    return current_user
