from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.investment import Investment
from app.schemas.investment import InvestmentCreate, InvestmentUpdate, InvestmentResponse
from app.repositories.investment import investment_repository
from app.services.portfolio import portfolio_service

router = APIRouter()

@router.get("", response_model=List[InvestmentResponse])
def read_investments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all active investments/holdings in user's portfolio."""
    return investment_repository.get_by_user(db, user_id=current_user.id)

@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve summarized portfolio valuations, cost basis, and stock P&L splits."""
    return portfolio_service.get_portfolio_summary(db, user_id=current_user.id)

@router.get("/{id}", response_model=InvestmentResponse)
def read_investment(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch details of a specific holding."""
    investment = investment_repository.get(db, id=id)
    if not investment or investment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Holding not found")
    return investment

@router.post("", response_model=InvestmentResponse, status_code=status.HTTP_201_CREATED)
def create_investment(
    inv_in: InvestmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Post manual investment holding registry."""
    existing = investment_repository.get_by_symbol(db, user_id=current_user.id, symbol=inv_in.symbol)
    if existing:
        raise HTTPException(status_code=400, detail="An investment holding with this symbol already exists")
    
    inv_data = inv_in.model_dump()
    db_obj = Investment(user_id=current_user.id, **inv_data)
    # Compute cost basis
    db_obj.cost_basis = db_obj.units * db_obj.avg_buy_price
    db_obj.current_value = db_obj.units * db_obj.avg_buy_price
    db_obj.last_price = db_obj.avg_buy_price
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Recalculate allocations
    portfolio_service.recalculate_allocations(db, user_id=current_user.id)
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=InvestmentResponse)
def update_investment(
    id: int,
    inv_in: InvestmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Modify details of an investment asset."""
    investment = investment_repository.get(db, id=id)
    if not investment or investment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    updated = investment_repository.update(db, db_obj=investment, obj_in=inv_in)
    
    # Adjust cost/current calculations
    updated.cost_basis = updated.units * updated.avg_buy_price
    updated.current_value = updated.units * updated.last_price
    db.add(updated)
    db.commit()
    
    # Recalculate allocations
    portfolio_service.recalculate_allocations(db, user_id=current_user.id)
    db.refresh(updated)
    return updated

@router.delete("/{id}", response_model=InvestmentResponse)
def delete_investment(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a holding registry (references on transactions are set to NULL)."""
    investment = investment_repository.get(db, id=id)
    if not investment or investment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    removed = investment_repository.remove(db, id=id)
    portfolio_service.recalculate_allocations(db, user_id=current_user.id)
    return removed
