from typing import List
import json
import logging
import redis
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.recommendation import (
    RecommendationOut,
    RecommendationListOut,
    RecommendationCreateResponse
)
from app.repositories.recommendation import recommendation_repository
from app.services.allocation_engine import allocation_engine
from app.services.rebalance_service import rebalance_service

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Redis client with graceful error handling
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception as e:
    logger.error(f"Failed to connect to Redis inside recommendations API: {e}")
    redis_client = None

@router.post("/generate", response_model=RecommendationCreateResponse, status_code=status.HTTP_201_CREATED)
def generate_recommendation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate or retrieve a fresh asset allocation recommendation for the current user.
    """
    rec = allocation_engine.compute_recommendation(db, current_user)
    return RecommendationCreateResponse(
        message="Recommendation compiled successfully.",
        recommendation=RecommendationOut.model_validate(rec)
    )

@router.get("", response_model=RecommendationListOut)
def list_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """
    Retrieve historical recommendations for the current user.
    """
    recs = recommendation_repository.get_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return RecommendationListOut(
        recommendations=[RecommendationOut.model_validate(r) for r in recs]
    )

@router.patch("/{id}/read", response_model=RecommendationOut)
def mark_as_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a specific recommendation as read.
    """
    rec = recommendation_repository.mark_as_read(db, recommendation_id=id, user_id=current_user.id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return RecommendationOut.model_validate(rec)

@router.get("/rebalance")
def get_rebalance_suggestions(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compute step-by-step portfolio rebalancing advice. Caches in Redis for 30 minutes.
    """
    cache_key = f"rebalance:user:{current_user.id}"
    cached_data = None
    
    if redis_client:
        try:
            cached_data = redis_client.get(cache_key)
        except Exception as e:
            logger.warning(f"Error reading rebalance from Redis cache: {e}")
            
    if cached_data:
        response.headers["X-Cache"] = "HIT"
        try:
            return json.loads(cached_data)
        except Exception:
            pass # fallback to query if json decode fails
            
    response.headers["X-Cache"] = "MISS"
    data = rebalance_service.compute_rebalance(db, current_user)
    
    if redis_client:
        try:
            redis_client.setex(cache_key, 1800, json.dumps(data))
        except Exception as e:
            logger.warning(f"Error saving rebalance to Redis cache: {e}")
            
    return data
