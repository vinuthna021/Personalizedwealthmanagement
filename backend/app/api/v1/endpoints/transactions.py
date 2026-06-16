from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.repositories.transaction import transaction_repository
from app.services.portfolio import portfolio_service

router = APIRouter()

@router.get("", response_model=List[TransactionResponse])
def read_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Retrieve chronological transaction logs of active user."""
    return transaction_repository.get_by_user(db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/{id}", response_model=TransactionResponse)
def read_transaction(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch detail log of a specific transaction ID."""
    tx = transaction_repository.get(db, id=id)
    if not tx or tx.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Post stock trade (BUY/SELL) or cash action (CONTRIBUTION/WITHDRAWAL/DIVIDEND)."""
    return portfolio_service.post_transaction(db, user_id=current_user.id, tx_in=tx_in)

@router.delete("/{id}")
def delete_transaction(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete transaction, reversing unit balances and cash impacts."""
    portfolio_service.delete_transaction(db, user_id=current_user.id, transaction_id=id)
    return {"message": "Transaction successfully reversed and deleted"}
