import json
from typing import Any, Optional
import redis.asyncio as redis
from app.core.config import settings

class RedisCache:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None

    async def init_redis(self):
        """初始化 Redis 连接池"""
        try:
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2,  # 设置连接超时
                socket_timeout=2  # 设置操作超时
            )
            # 尝试连接一次，确认是否可用
            await self.redis_client.ping()
        except Exception as e:
            print(f"Redis connection failed: {e}")
            self.redis_client = None  # 连接失败则置空，后续操作会降级

    async def close(self):
        """关闭 Redis 连接"""
        if self.redis_client:
            await self.redis_client.close()

    async def get(self, key: str) -> Any:
        """获取缓存"""
        if not self.redis_client:
            return None
        try:
            val = await self.redis_client.get(key)
            if val:
                try:
                    return json.loads(val)
                except json.JSONDecodeError:
                    return val
        except Exception as e:
            # 简单记录日志或者忽略错误，降级处理
            print(f"Redis get error: {e}")
            return None
        return None

    async def set(self, key: str, value: Any, expire: int = 3600):
        """设置缓存"""
        if not self.redis_client:
            return
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            await self.redis_client.set(key, value, ex=expire)
        except Exception as e:
            print(f"Redis set error: {e}")

    async def delete(self, key: str):
        """删除缓存"""
        if not self.redis_client:
            return
        try:
            await self.redis_client.delete(key)
        except Exception as e:
            print(f"Redis delete error: {e}")

# 全局 Redis 实例
cache = RedisCache()
