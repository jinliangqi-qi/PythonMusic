from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, backref
from app.db.base import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False, comment="分类名称")
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True, comment="父分类ID")
    sort_order = Column(Integer, default=0, comment="排序 (值越小越靠前)")

    # 邻接表关系 (Adjacency List)
    # lazy="selectin" 是异步加载的最佳实践，避免 N+1 问题
    # join_depth=2 限制递归深度，避免无限递归导致的 MissingGreenlet 问题
    children = relationship(
        "Category", 
        backref=backref("parent", remote_side=[id]),
        lazy="selectin",
        join_depth=2
    )
