from typing import Optional
from pydantic import BaseModel

# 登录请求
class LoginRequest(BaseModel):
    username: str
    password: str
    captcha: Optional[str] = None  # 验证码暂时可选

# Token 响应
class Token(BaseModel):
    access_token: str
    token_type: str
    
# 登录响应包含 Token 和 用户信息
class LoginResponse(BaseModel):
    token: Token
    user_info: dict  # 简单起见，这里先用 dict，也可以引用 UserSchema

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str
