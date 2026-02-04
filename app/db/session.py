from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# 1. 创建异步引擎
# echo=True 会打印 SQL 语句，方便调试
engine = create_async_engine(
    settings.DATABASE_URL, 
    echo=settings.DEBUG,
    future=True
)

# 2. 创建 Session 工厂
# expire_on_commit=False 防止提交后属性过期，这对异步操作很重要
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# 3. 获取数据库会话的依赖函数
async def get_db() -> AsyncSession:
    """
    依赖注入使用的数据库会话生成器。
    每个请求创建一个 session，请求结束自动关闭。
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
