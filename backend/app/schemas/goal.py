from datetime import date, datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from app.models.goal import GoalType, GoalStatus

class GoalBase(BaseModel):
    goal_name: str = Field(..., min_length=2, max_length=150)
    goal_type: GoalType
    target_amount: Decimal = Field(..., gt=0)
    current_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    monthly_contribution: Decimal = Field(default=Decimal("0.00"), ge=0)
    target_date: date
    status: GoalStatus = GoalStatus.ACTIVE
    notes: Optional[str] = None

class GoalCreate(BaseModel):
    goal_name: str = Field(..., min_length=2, max_length=150)
    goal_type: GoalType
    target_amount: Decimal = Field(..., gt=0)
    current_amount: Optional[Decimal] = Field(default=Decimal("0.00"), ge=0)
    monthly_contribution: Optional[Decimal] = Field(default=Decimal("0.00"), ge=0)
    target_date: date
    status: Optional[GoalStatus] = GoalStatus.ACTIVE
    notes: Optional[str] = None

class GoalUpdate(BaseModel):
    goal_name: Optional[str] = Field(None, min_length=2, max_length=150)
    goal_type: Optional[GoalType] = None
    target_amount: Optional[Decimal] = Field(None, gt=0)
    current_amount: Optional[Decimal] = Field(None, ge=0)
    monthly_contribution: Optional[Decimal] = Field(None, ge=0)
    target_date: Optional[date] = None
    status: Optional[GoalStatus] = None
    notes: Optional[str] = None

class GoalResponse(GoalBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
