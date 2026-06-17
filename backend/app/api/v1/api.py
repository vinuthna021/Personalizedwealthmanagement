from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, goals, investments, transactions, market, portfolio, simulations, recommendations, reports

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(investments.router, prefix="/investments", tags=["investments"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(market.router, prefix="/market", tags=["market"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
api_router.include_router(simulations.router, prefix="/simulations", tags=["simulations"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
