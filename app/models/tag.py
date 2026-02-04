from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship, backref
from app.db.base import Base

# 音乐-标签 多对多关联表
music_tag_association = Table(
    "music_tag_association",
    Base.metadata,
    Column("music_id", Integer, ForeignKey("musics.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False, comment="标签名称")

    # 多对多关联
    # 使用 backref 配置反向关系 (Music.tags) 也为 selectin 加载，防止异步 IO 错误
    musics = relationship(
        "Music", 
        secondary=music_tag_association, 
        backref=backref("tags", lazy="selectin"), 
        lazy="selectin"
    )
