import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# 配置 logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("api_logger")

class LogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # 提取请求信息
        path = request.url.path
        method = request.method
        query_params = dict(request.query_params)
        client_host = request.client.host if request.client else "unknown"
        
        # 针对敏感操作记录详细日志
        is_sensitive = any(k in path for k in ["/upload", "/auth/login"])
        
        log_msg = f"Request: {method} {path} | Client: {client_host} | Params: {query_params}"
        if is_sensitive:
            logger.info(f"AUDIT >>> {log_msg}")
        else:
            logger.info(log_msg)
        
        try:
            response = await call_next(request)
            
            # 记录处理时间
            process_time = time.time() - start_time
            status_code = response.status_code
            
            logger.info(
                f"Response: {status_code} | "
                f"Method: {method} | Path: {path} | "
                f"Time: {process_time:.4f}s"
            )
            
            return response
        except Exception as e:
            # 记录异常
            logger.error(f"Request failed: {method} {path} - Error: {str(e)}", exc_info=True)
            raise
