from datetime import datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from app.models.transaction import TransactionType

class TransactionBase(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    type: TransactionType
    quantity: Decimal = Field(..., gt=0)
    price: Decimal = Field(..., gt=0)
    fees: Decimal = Field(default=Decimal("0.0000"), ge=0)
    notes: Optional[str] = None
    executed_at: Optional[datetime] = None

class TransactionCreate(TransactionBase):
    investment_id: Optional[int] = None

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    investment_id: Optional[int] = None
    symbol: str
    type: TransactionType
    quantity: Decimal
    price: Decimal
    fees: Decimal
    total_amount: Decimal
    notes: Optional[str] = None
    executed_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
