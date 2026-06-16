from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.portfolio import portfolio_service

router = APIRouter()

@router.post("/refresh")
def refresh_portfolio(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger portfolio live price refresh and allocations recalculation."""
    res = portfolio_service.refresh_user_prices(db, user_id=current_user.id)
    return res
