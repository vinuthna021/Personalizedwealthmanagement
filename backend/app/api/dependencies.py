from typing import Optional
from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.repositories.user import user_repository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)

def get_current_user(
    db: Session = Depends(get_db),
    access_token_cookie: Optional[str] = Cookie(None, alias="access_token"),
    access_token_header: Optional[str] = Depends(oauth2_scheme)
) -> User:
    """Extract and validate the access token from cookies or Authorization header."""
    token = access_token_cookie or access_token_header
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    try:
        payload = decode_token(token, is_refresh=False)
        user_id_str: str = payload.get("sub")
        token_type: str = payload.get("type")
        if not user_id_str or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = user_repository.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    return user
