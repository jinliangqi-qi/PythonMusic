from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from typing import Union
from fastapi.encoders import jsonable_encoder
import traceback

from app.schemas.response import ResponseBase
from app.db.session import AsyncSessionLocal
from app.crud.crud_sys_log import crud_sys_log
from app.schemas.sys_log import SystemLogCreate

class BusinessException(Exception):
    """自定义业务异常"""
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message

def register_exception_handlers(app: FastAPI):
    """注册全局异常处理器"""

    # 1. 处理自定义业务异常
    @app.exception_handler(BusinessException)
    async def business_exception_handler(request: Request, exc: BusinessException):
        return JSONResponse(
            status_code=200,  # 业务异常通常返回 200，前端根据 code 判断
            content=ResponseBase(code=exc.code, message=exc.message).model_dump()
        )

    # 2. 处理 HTTP 异常 (如 404, 401)
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content=ResponseBase(code=exc.status_code, message=str(exc.detail)).model_dump()
        )

    # 3. 处理请求参数验证异常 (Pydantic)
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # 排除 input 字段，因为它可能包含不可序列化的 bytes
        errors = []
        for error in exc.errors():
            err_copy = error.copy()
            if "input" in err_copy:
                del err_copy["input"]
            errors.append(err_copy)
            
        return JSONResponse(
            status_code=422,
            content=ResponseBase(
                code=422,
                message="请求参数验证失败",
                data={"errors": jsonable_encoder(errors)}
            ).model_dump()
        )

    # 4. 处理其他未知异常
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        # 在这里可以添加日志记录
        print(f"Global Exception: {exc}")
        
        # 记录到数据库
        try:
            async with AsyncSessionLocal() as db:
                error_detail = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
                log_in = SystemLogCreate(
                    path=request.url.path,
                    method=request.method,
                    ip=request.client.host if request.client else "unknown",
                    status_code=500,
                    error_detail=error_detail,
                    user_id=None # 暂时无法获取
                )
                await crud_sys_log.create(db, log_in)
        except Exception as db_exc:
            print(f"Failed to write error log to DB: {db_exc}")

        return JSONResponse(
            status_code=500,
            content=ResponseBase(code=500, message="服务器内部错误").model_dump()
        )
