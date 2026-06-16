from typing import List
from sqlalchemy.orm import Session
from app.models.goal import Goal
from app.schemas.goal import GoalCreate, GoalUpdate
from app.repositories.base import BaseRepository

class GoalRepository(BaseRepository[Goal, GoalCreate, GoalUpdate]):
    def get_by_user(self, db: Session, user_id: int, *, skip: int = 0, limit: int = 100) -> List[Goal]:
        """Fetch all goals owned by a specific user."""
        return db.query(self.model).filter(self.model.user_id == user_id).offset(skip).limit(limit).all()

goal_repository = GoalRepository(Goal)
