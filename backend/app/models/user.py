import enum
from sqlalchemy import Column, Integer, String, Date, Text, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from app.core.database import Base

class RiskProfile(str, enum.Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"

class KYCStatus(str, enum.Enum):
    UNVERIFIED = "unverified"
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    address = Column(Text, nullable=True)
    risk_profile = Column(SQLEnum(RiskProfile, name="riskprofile", values_callable=lambda x: [e.value for e in x]), nullable=False, default=RiskProfile.MODERATE)
    kyc_status = Column(SQLEnum(KYCStatus, name="kycstatus", values_callable=lambda x: [e.value for e in x]), nullable=False, default=KYCStatus.UNVERIFIED)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
