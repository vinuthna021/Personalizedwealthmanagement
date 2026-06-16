from datetime import timedelta
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.core.exceptions import (
    AuthenticationFailedException,
    UserAlreadyExistsException,
    EntityNotFoundException
)
from app.repositories.user import user_repository
from app.models.user import User
from app.schemas.user import UserCreate
from app.schemas.auth import Token

class AuthService:
    def register(self, db: Session, user_in: UserCreate) -> User:
        """Register a new user, hashing their password."""
        existing_user = user_repository.get_by_email(db, email=user_in.email)
        if existing_user:
            raise UserAlreadyExistsException()
        
        # Create new user dictionary with hashed password
        user_data = user_in.model_dump() if hasattr(user_in, "model_dump") else user_in.dict()
        plain_password = user_data.pop("password")
        user_data["password_hash"] = get_password_hash(plain_password)
        
        # Create new user in DB
        db_obj = User(**user_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def authenticate(self, db: Session, email: str, password: str) -> User:
        """Authenticate user credentials and return the user."""
        user = user_repository.get_by_email(db, email=email)
        if not user:
            raise AuthenticationFailedException("Invalid email or password")
        if not verify_password(password, user.password_hash):
            raise AuthenticationFailedException("Invalid email or password")
        if not user.is_active:
            raise AuthenticationFailedException("Inactive user account")
        return user

    def refresh_tokens(self, db: Session, refresh_token: str) -> tuple[str, str]:
        """Validate refresh token and return a new access + refresh token pair."""
        try:
            payload = decode_token(refresh_token, is_refresh=True)
            user_id_str: str = payload.get("sub")
            token_type: str = payload.get("type")
            if not user_id_str or token_type != "refresh":
                raise AuthenticationFailedException("Invalid token format")
            user_id = int(user_id_str)
        except (JWTError, ValueError):
            raise AuthenticationFailedException("Expired or invalid refresh token")

        user = user_repository.get(db, id=user_id)
        if not user or not user.is_active:
            raise AuthenticationFailedException("User not found or inactive")

        # Generate a new pair
        access_token = create_access_token(subject=user.id)
        new_refresh_token = create_refresh_token(subject=user.id)
        return access_token, new_refresh_token

auth_service = AuthService()
