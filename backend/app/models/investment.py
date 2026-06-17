import enum
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, synonym
from app.core.database import Base
from app.models.user import RiskProfile

class AssetType(str, enum.Enum):
    STOCK = "stock"
    ETF = "etf"
    MUTUAL_FUND = "mutual_fund"
    BOND = "bond"
    CASH = "cash"

class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    asset_class = Column("asset_class", SQLEnum(AssetType, name="assettype", values_callable=lambda x: [e.value for e in x]), nullable=False)
    ticker_symbol = Column("ticker_symbol", String(20), nullable=False, index=True)
    exchange = Column(String(50), nullable=True)
    data_provider = Column(String(50), nullable=True)
    
    asset_name = Column(String(150), nullable=False)
    quantity = Column("quantity", Numeric(15, 6), nullable=False, default=0.000000)
    average_cost = Column("average_cost", Numeric(15, 4), nullable=False, default=0.0000)
    
    cost_basis = Column(Numeric(15, 4), nullable=False, default=0.0000)
    current_value = Column(Numeric(15, 4), nullable=False, default=0.0000)
    last_price = Column(Numeric(15, 4), nullable=False, default=0.0000)
    allocation_percent = Column(Numeric(5, 2), nullable=False, default=0.00)
    risk_level = Column(SQLEnum(RiskProfile, name="riskprofile", values_callable=lambda x: [e.value for e in x]), nullable=False, default=RiskProfile.MODERATE)
    last_price_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Synonyms for backward compatibility
    symbol = synonym("ticker_symbol")
    asset_type = synonym("asset_class")
    units = synonym("quantity")
    avg_buy_price = synonym("average_cost")

    # Unique constraint on user_id and ticker_symbol
    __table_args__ = (
        UniqueConstraint('user_id', 'ticker_symbol', name='uq_user_ticker_symbol'),
    )

    # Relationships
    user = relationship("User", backref="investments")
