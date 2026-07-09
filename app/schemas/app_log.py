from typing import Optional, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime


class AppLogCreate(BaseModel):
    """前端上报日志的Schema"""
    level: str = Field(..., pattern="^(debug|info|warn|error|fatal)$")
    message: str
    source: str = Field(default="frontend", pattern="^(frontend|backend)$")
    logger_name: Optional[str] = None
    
    # 错误详情
    error_type: Optional[str] = None
    error_stack: Optional[str] = None
    
    # 环境信息
    environment: Optional[str] = None
    app_version: Optional[str] = None
    
    # 前端特有
    browser: Optional[str] = None
    os: Optional[str] = None
    device: Optional[str] = None
    url: Optional[str] = None
    
    # 额外数据
    extra_data: Optional[Dict[str, Any]] = None
    
    # 用户信息（可选，如果有登录）
    user_id: Optional[int] = None


class AppLogBatchCreate(BaseModel):
    """批量上报日志"""
    logs: list[AppLogCreate]
    environment: Optional[str] = None
    app_version: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    device: Optional[str] = None


class AppLogInfo(BaseModel):
    """日志信息返回"""
    id: int
    level: str
    message: str
    source: str
    logger_name: Optional[str] = None
    error_type: Optional[str] = None
    error_stack: Optional[str] = None
    environment: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    url: Optional[str] = None
    user_id: Optional[int] = None
    extra_data: Optional[Dict[str, Any]] = None
    client_ip: Optional[str] = None
    created_at: datetime
    
    model_config = {"from_attributes": True}