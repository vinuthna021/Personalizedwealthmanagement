import enum
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class TransactionType(str, enum.Enum):
    BUY = "buy"
    SELL = "sell"
    DIVIDEND = "dividend"
    CONTRIBUTION = "contribution"
    WITHDRAWAL = "withdrawal"

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    investment_id = Column(Integer, ForeignKey("investments.id", ondelete="SET NULL"), nullable=True, index=True)
    symbol = Column(String(20), nullable=False)
    type = Column(SQLEnum(TransactionType, name="transactiontype", values_callable=lambda x: [e.value for e in x]), nullable=False)
    quantity = Column(Numeric(15, 6), nullable=False)
    price = Column(Numeric(15, 4), nullable=False)
    fees = Column(Numeric(15, 4), nullable=False, default=0.0000)
    total_amount = Column(Numeric(15, 4), nullable=False) # Cash impact: e.g. quantity * price + fees (for BUY) or quantity * price - fees (for SELL)
    notes = Column(Text, nullable=True) # Text needs to be imported or use Text from sqlalchemy
    executed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    user = relationship("User", backref="transactions")
    investment = relationship("Investment", backref="transactions")
