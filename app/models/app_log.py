from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.db.base import Base


class AppLog(Base):
    """应用日志表 - 用于采集前端和后端运行时日志"""
    __tablename__ = "app_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # 日志基本信息
    level = Column(String(20), index=True, comment="日志级别: debug/info/warn/error/fatal")
    message = Column(Text, comment="日志消息")
    source = Column(String(50), index=True, comment="来源: frontend/backend")
    logger_name = Column(String(100), comment="日志器名称，如组件名或模块名")
    
    # 错误详情
    error_type = Column(String(255), nullable=True, comment="错误类型/类名")
    error_stack = Column(Text, nullable=True, comment="错误堆栈")
    
    # 环境信息
    environment = Column(String(50), comment="运行环境: development/production")
    app_version = Column(String(50), nullable=True, comment="应用版本")
    
    # 前端特有信息
    browser = Column(String(100), nullable=True, comment="浏览器信息")
    os = Column(String(100), nullable=True, comment="操作系统")
    device = Column(String(100), nullable=True, comment="设备类型")
    url = Column(String(500), nullable=True, comment="当前URL")
    
    # 后端特有信息
    request_id = Column(String(100), nullable=True, comment="请求ID")
    user_id = Column(Integer, nullable=True, index=True, comment="用户ID")
    
    # 额外数据
    extra_data = Column(JSON, nullable=True, comment="额外数据，JSON格式")
    
    # 元数据
    client_ip = Column(String(50), nullable=True, comment="客户端IP")
    user_agent = Column(String(500), nullable=True, comment="User-Agent")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True, comment="创建时间")