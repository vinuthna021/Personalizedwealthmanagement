from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.user import RiskProfile, KYCStatus

class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    address: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    address: Optional[str] = None

class UserUpdateRisk(BaseModel):
    risk_profile: RiskProfile

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    risk_profile: RiskProfile
    kyc_status: KYCStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }
class KYCStatusResponse(BaseModel):
    kyc_status: KYCStatus
