from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.recommendation import Recommendation
from app.schemas.recommendation import RecommendationBase
from app.repositories.base import BaseRepository

class RecommendationRepository(BaseRepository[Recommendation, RecommendationBase, RecommendationBase]):
    def get_by_user(self, db: Session, user_id: int, *, skip: int = 0, limit: int = 100) -> List[Recommendation]:
        """Fetch all recommendations for a specific user, sorted by created_at descending."""
        return (
            db.query(self.model)
            .filter(self.model.user_id == user_id)
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_latest_by_user(self, db: Session, user_id: int) -> Optional[Recommendation]:
        """Get the latest recommendation for a user."""
        return (
            db.query(self.model)
            .filter(self.model.user_id == user_id)
            .order_by(self.model.created_at.desc())
            .first()
        )

    def mark_as_read(self, db: Session, recommendation_id: int, user_id: int) -> Optional[Recommendation]:
        """Mark a recommendation as read."""
        db_obj = (
            db.query(self.model)
            .filter(self.model.id == recommendation_id, self.model.user_id == user_id)
            .first()
        )
        if db_obj:
            db_obj.is_read = True
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
        return db_obj

recommendation_repository = RecommendationRepository(Recommendation)
