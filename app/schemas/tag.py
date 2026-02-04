from typing import List, Optional
from pydantic import BaseModel, Field

class TagBase(BaseModel):
    name: str = Field(..., description="标签名称", min_length=1, max_length=50)

class TagCreate(TagBase):
    pass

class TagUpdate(TagBase):
    pass

class TagInfo(TagBase):
    id: int
    
    class Config:
        from_attributes = True

class TagMusicLink(BaseModel):
    music_id: int
    tag_ids: List[int]
