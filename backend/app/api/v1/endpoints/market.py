from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.market_data.market_service import market_service

router = APIRouter()

@router.get("/{ticker}")
def get_live_price(
    ticker: str,
    current_user: User = Depends(get_current_user)
):
    """Fetch the live price of a stock/ETF ticker."""
    try:
        price_data = market_service.get_price(ticker)
        return price_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
