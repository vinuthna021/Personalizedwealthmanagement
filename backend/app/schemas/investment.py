from datetime import datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from app.models.investment import AssetType
from app.models.user import RiskProfile

class InvestmentBase(BaseModel):
    asset_type: AssetType
    symbol: str = Field(..., min_length=1, max_length=20)
    asset_name: str = Field(..., min_length=1, max_length=150)
    units: Decimal = Field(default=Decimal("0.000000"), ge=0)
    avg_buy_price: Decimal = Field(default=Decimal("0.0000"), ge=0)
    cost_basis: Decimal = Field(default=Decimal("0.0000"), ge=0)
    current_value: Decimal = Field(default=Decimal("0.0000"), ge=0)
    last_price: Decimal = Field(default=Decimal("0.0000"), ge=0)
    allocation_percent: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    risk_level: RiskProfile = RiskProfile.MODERATE
    last_price_at: Optional[datetime] = None

class InvestmentCreate(BaseModel):
    asset_type: AssetType
    symbol: str = Field(..., min_length=1, max_length=20)
    asset_name: str = Field(..., min_length=1, max_length=150)
    units: Optional[Decimal] = Field(default=Decimal("0.000000"), ge=0)
    avg_buy_price: Optional[Decimal] = Field(default=Decimal("0.0000"), ge=0)
    risk_level: Optional[RiskProfile] = RiskProfile.MODERATE

class InvestmentUpdate(BaseModel):
    asset_name: Optional[str] = Field(None, min_length=1, max_length=150)
    units: Optional[Decimal] = Field(None, ge=0)
    avg_buy_price: Optional[Decimal] = Field(None, ge=0)
    last_price: Optional[Decimal] = Field(None, ge=0)
    risk_level: Optional[RiskProfile] = None

class InvestmentResponse(InvestmentBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
