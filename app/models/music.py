from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Music(Base):
    __tablename__ = "musics"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), index=True, nullable=False, comment="音乐名称")
    
    # 关联字段
    singer_id = Column(Integer, ForeignKey("singers.id", ondelete="SET NULL"), nullable=True, index=True, comment="歌手ID")
    album_id = Column(Integer, ForeignKey("albums.id", ondelete="SET NULL"), nullable=True, index=True, comment="专辑ID (单曲可为空)")
    
    # 资源字段
    file_path = Column(String(500), nullable=False, comment="音乐文件路径或URL")
    cover = Column(String(500), comment="封面路径或URL")
    
    # 元数据
    duration = Column(Integer, default=0, comment="时长 (秒)")
    size = Column(Integer, default=0, comment="文件大小 (字节)")
    
    # 业务字段
    # 状态: pending(待审核), active(已通过), rejected(已驳回)
    status = Column(String(20), default="pending", index=True, comment="状态")
    play_count = Column(Integer, default=0, comment="播放量")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="上传时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")

    # 关联关系 (selectin 预加载)
    singer = relationship("Singer", backref="musics", lazy="selectin")
    album = relationship("Album", backref="musics", lazy="selectin")
