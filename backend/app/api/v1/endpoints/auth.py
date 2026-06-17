from typing import Optional
from fastapi import APIRouter, Depends, Response, Cookie, status, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth import auth_service
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import LoginRequest
from app.api.dependencies import get_current_user
from app.models.user import User
from app.core.config import settings

router = APIRouter()

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """Set access and refresh tokens as HTTP-only secure cookies."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.SECURE_COOKIES,
        samesite="strict",
        max_age=15 * 60, # 15 minutes
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.SECURE_COOKIES,
        samesite="strict",
        max_age=7 * 24 * 60 * 60, # 7 days
        path="/api/v1/auth/refresh"
    )

def clear_auth_cookies(response: Response):
    """Remove access and refresh cookies from client."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/api/v1/auth/refresh")

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    return auth_service.register(db, user_in)

@router.post("/login", response_model=UserResponse)
def login(login_data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Login and set authentication cookies."""
    user = auth_service.authenticate(db, email=login_data.email, password=login_data.password)
    from app.core.security import create_access_token, create_refresh_token
    access = create_access_token(subject=user.id)
    refresh = create_refresh_token(subject=user.id)
    set_auth_cookies(response, access, refresh)
    return user

@router.post("/logout")
def logout(response: Response, current_user: User = Depends(get_current_user)):
    """Logout current user and clear authorization cookies."""
    clear_auth_cookies(response)
    return {"message": "Successfully logged out"}

@router.post("/refresh")
def refresh(
    response: Response,
    refresh_token: Optional[str] = Cookie(None, alias="refresh_token"),
    db: Session = Depends(get_db)
):
    """Validate refresh token and rotate both access and refresh cookies."""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )
    access, new_refresh = auth_service.refresh_tokens(db, refresh_token)
    set_auth_cookies(response, access, new_refresh)
    return {"message": "Token refreshed successfully"}
