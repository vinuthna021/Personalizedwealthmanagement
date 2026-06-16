from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.investment import Investment
from app.schemas.investment import InvestmentCreate, InvestmentUpdate
from app.repositories.base import BaseRepository

class InvestmentRepository(BaseRepository[Investment, InvestmentCreate, InvestmentUpdate]):
    def get_by_user(self, db: Session, user_id: int) -> List[Investment]:
        """Retrieve portfolio assets held by a specific user."""
        return db.query(self.model).filter(self.model.user_id == user_id).all()

    def get_by_symbol(self, db: Session, user_id: int, symbol: str) -> Optional[Investment]:
        """Fetch investment holding matching user_id and symbol identifier."""
        return db.query(self.model).filter(
            self.model.user_id == user_id,
            self.model.symbol == symbol
        ).first()

investment_repository = InvestmentRepository(Investment)
