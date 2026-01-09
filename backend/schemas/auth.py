"""
Authentication schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class UserRegister(BaseModel):
    """User registration request."""
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    """User login request (OAuth2 compatible)."""
    username: str
    password: str


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    """User data response."""
    id: int
    username: str
    email: str
    is_active: bool
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserMe(BaseModel):
    """Current user info response."""
    id: int
    username: str
    email: str
    is_admin: bool
    
    class Config:
        from_attributes = True
