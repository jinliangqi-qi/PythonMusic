from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class SystemLog(Base):
    __tablename__ = "sys_logs"

    id = Column(Integer, primary_key=True, index=True)
    path = Column(String(255), index=True, comment="请求路径")
    method = Column(String(10), comment="请求方法")
    ip = Column(String(50), comment="客户端IP")
    status_code = Column(Integer, comment="状态码")
    error_detail = Column(Text, nullable=True, comment="异常详情")
    user_id = Column(Integer, nullable=True, index=True, comment="用户ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True, comment="创建时间")
