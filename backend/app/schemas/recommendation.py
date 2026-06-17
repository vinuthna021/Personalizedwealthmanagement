from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict

class RecommendationBase(BaseModel):
    title: str
    recommendation_text: str
    suggested_allocation: Dict[str, float]

class RecommendationOut(RecommendationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RecommendationListOut(BaseModel):
    recommendations: List[RecommendationOut]

class RecommendationCreateResponse(BaseModel):
    message: str
    recommendation: RecommendationOut
