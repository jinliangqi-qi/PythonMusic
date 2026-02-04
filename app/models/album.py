from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Album(Base):
    __tablename__ = "albums"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), index=True, nullable=False, comment="专辑名称")
    singer_id = Column(Integer, ForeignKey("singers.id", ondelete="SET NULL"), nullable=True, comment="歌手ID")
    cover = Column(String(255), comment="专辑封面 (相对路径)")
    release_date = Column(Date, comment="发行时间")
    description = Column(Text, comment="专辑简介")
    
    # 状态控制
    is_active = Column(Boolean, default=True, comment="是否上架")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")

    # 关联关系
    # lazy="selectin" 是异步加载的最佳实践，避免 N+1 问题
    singer = relationship("Singer", backref="albums", lazy="selectin")
