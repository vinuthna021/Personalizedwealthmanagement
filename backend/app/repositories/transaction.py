from typing import List
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate
from app.repositories.base import BaseRepository

class TransactionRepository(BaseRepository[Transaction, TransactionCreate, None]):
    def get_by_user(self, db: Session, user_id: int, *, skip: int = 0, limit: int = 100) -> List[Transaction]:
        """Fetch transaction ledger rows matching user_id."""
        return db.query(self.model).filter(self.model.user_id == user_id).order_by(self.model.executed_at.desc()).offset(skip).limit(limit).all()

    def get_by_investment(self, db: Session, investment_id: int) -> List[Transaction]:
        """Fetch transaction ledger records corresponding to an investment ID."""
        return db.query(self.model).filter(self.model.investment_id == investment_id).order_by(self.model.executed_at.desc()).all()

transaction_repository = TransactionRepository(Transaction)
