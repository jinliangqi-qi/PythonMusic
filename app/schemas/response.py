from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel, Field

T = TypeVar("T")

class ResponseBase(BaseModel, Generic[T]):
    code: int = Field(default=200, description="业务状态码")
    message: str = Field(default="success", description="提示信息")
    data: Optional[T] = Field(default=None, description="业务数据")

class PageData(BaseModel, Generic[T]):
    list: List[T] = Field(description="列表数据")
    total: int = Field(description="总记录数")
    page: int = Field(description="当前页码")
    size: int = Field(description="每页数量")

class PageResponse(ResponseBase[PageData[T]], Generic[T]):
    pass

# 工具函数
def success(data: T = None, message: str = "success") -> ResponseBase[T]:
    return ResponseBase(code=200, message=message, data=data)

def fail(code: int = 400, message: str = "fail") -> ResponseBase:
    return ResponseBase(code=code, message=message, data=None)

def page_success(list_data: List[T], total: int, page: int, size: int) -> PageResponse[T]:
    return PageResponse(
        data=PageData(
            list=list_data,
            total=total,
            page=page,
            size=size
        )
    )
