import enum
from sqlalchemy import Column, Integer, String, Numeric, Date, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class GoalType(str, enum.Enum):
    RETIREMENT = "retirement"
    HOME = "home"
    EDUCATION = "education"
    TRAVEL = "travel"
    EMERGENCY = "emergency"
    CUSTOM = "custom"

class GoalStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    goal_name = Column(String(150), nullable=False)
    goal_type = Column(SQLEnum(GoalType, name="goaltype", values_callable=lambda x: [e.value for e in x]), nullable=False)
    target_amount = Column(Numeric(15, 4), nullable=False)
    current_amount = Column(Numeric(15, 4), nullable=False, default=0.0000)
    monthly_contribution = Column(Numeric(15, 4), nullable=False, default=0.0000)
    target_date = Column(Date, nullable=False)
    status = Column(SQLEnum(GoalStatus, name="goalstatus", values_callable=lambda x: [e.value for e in x]), nullable=False, default=GoalStatus.ACTIVE)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="goals")
