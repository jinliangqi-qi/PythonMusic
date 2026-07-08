from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.limiter import limiter
from app.db.session import get_db, engine
from app.db.base import Base
from app.core.exceptions import register_exception_handlers, BusinessException
from app.schemas.response import success, fail
from app.api.v1.endpoints import auth, user, common, singers, albums, musics, categories, tags, sys_logs, products, suppliers, customers, purchases, sales, inventory, dashboard
from app.crud.crud_user import crud_user
from app.schemas.user import UserCreate
from app.core.middleware import LogMiddleware
from app.core.cache import cache

# 初始化应用
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# 1. 注册限流器
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# 2. 注册日志中间件
app.add_middleware(LogMiddleware)

# 3. 注册 CORS 中间件
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# 4. 挂载静态文件目录 (用于访问上传的文件)
# 注意：生产环境建议使用 Nginx 代理，而不是由 FastAPI 提供静态文件服务
# 将 /uploads 路径映射到本地 uploads 目录，以便前端可以直接访问图片/音频
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# 注册全局异常处理器
register_exception_handlers(app)

# 注册路由
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(user.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(common.router, prefix=f"{settings.API_V1_STR}/common", tags=["common"])
app.include_router(singers.router, prefix=f"{settings.API_V1_STR}/singers", tags=["singers"])
app.include_router(albums.router, prefix=f"{settings.API_V1_STR}/albums", tags=["albums"])
app.include_router(musics.router, prefix=f"{settings.API_V1_STR}/musics", tags=["musics"])
app.include_router(categories.router, prefix=f"{settings.API_V1_STR}/categories", tags=["categories"])
app.include_router(tags.router, prefix=f"{settings.API_V1_STR}/tags", tags=["tags"])
app.include_router(sys_logs.router, prefix=f"{settings.API_V1_STR}/sys_logs", tags=["sys_logs"])
app.include_router(products.router, prefix=f"{settings.API_V1_STR}/products", tags=["products"])
app.include_router(suppliers.router, prefix=f"{settings.API_V1_STR}/suppliers", tags=["suppliers"])
app.include_router(customers.router, prefix=f"{settings.API_V1_STR}/customers", tags=["customers"])
app.include_router(purchases.router, prefix=f"{settings.API_V1_STR}/purchases", tags=["purchases"])
app.include_router(sales.router, prefix=f"{settings.API_V1_STR}/sales", tags=["sales"])
app.include_router(inventory.router, prefix=f"{settings.API_V1_STR}/inventory", tags=["inventory"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["dashboard"])

@app.on_event("startup")
async def startup_event():
    # 初始化 Redis
    await cache.init_redis()
    
    # 开发环境下，启动时自动创建表
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # 初始化测试用户 (admin/123456)
    from app.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        user = await crud_user.get_by_username(db, "admin")
        if not user:
            await crud_user.create(db, UserCreate(
                username="admin", 
                password="123456", 
                nickname="Admin", 
                email="admin@example.com"
            ))
            print("--- Created default user: admin / 123456 ---")

@app.on_event("shutdown")
async def shutdown_event():
    await cache.close()

@app.get("/")
@limiter.limit("5/minute") # 限制每分钟 5 次请求
async def root(request: Request):
    return success(data={
        "message": "Welcome to Music Management System",
        "env": settings.APP_ENV,
        "docs": "/docs"
    })

@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    健康检查接口，同时验证数据库连接
    """
    try:
        # 执行简单的 SQL 查询验证连接
        result = await db.execute(text("SELECT 1"))
        return success(data={
            "status": "ok",
            "database": "connected",
            "result": result.scalar()
        })
    except Exception as e:
        return fail(code=500, message=f"Database error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
