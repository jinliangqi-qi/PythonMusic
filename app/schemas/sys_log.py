from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class SystemLogBase(BaseModel):
    path: Optional[str] = None
    method: Optional[str] = None
    ip: Optional[str] = None
    status_code: Optional[int] = None
    error_detail: Optional[str] = None
    user_id: Optional[int] = None

class SystemLogCreate(SystemLogBase):
    path: str
    method: str
    ip: str
    status_code: int

class SystemLogUpdate(SystemLogBase):
    pass

class SystemLog(SystemLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
