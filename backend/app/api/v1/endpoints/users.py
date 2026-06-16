from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, KYCStatus
from app.schemas.user import UserResponse, UserUpdate, UserUpdateRisk, KYCStatusResponse
from app.repositories.user import user_repository

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve the logged-in user profile details."""
    return current_user

@router.put("/me", response_model=UserResponse)
def update_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update profile configuration details."""
    return user_repository.update(db, db_obj=current_user, obj_in=user_in)

@router.put("/me/risk", response_model=UserResponse)
def update_risk(
    risk_in: UserUpdateRisk,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update investment risk profiling preference."""
    return user_repository.update(db, db_obj=current_user, obj_in=risk_in)

@router.get("/me/kyc", response_model=KYCStatusResponse)
def get_kyc(current_user: User = Depends(get_current_user)):
    """Fetch compliance KYC status."""
    return {"kyc_status": current_user.kyc_status}

@router.post("/me/kyc/verify", response_model=UserResponse)
def verify_kyc_mock(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mock verification of KYC for developer convenience."""
    return user_repository.update(db, db_obj=current_user, obj_in={"kyc_status": KYCStatus.VERIFIED})
