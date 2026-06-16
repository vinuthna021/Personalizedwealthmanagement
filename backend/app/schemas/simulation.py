from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime

class SimulationCreate(BaseModel):
    goal_id: Optional[int] = None
    scenario_name: str = Field(..., max_length=150)
    simulation_type: str = Field(..., max_length=50)
    input_parameters: Dict[str, Any]
    result_json: Dict[str, Any]

class SimulationResponse(BaseModel):
    id: int
    user_id: int
    goal_id: Optional[int] = None
    scenario_name: str
    simulation_type: str
    input_parameters: Dict[str, Any]
    result_json: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class SimulationRunInput(BaseModel):
    current_amount: float = Field(..., ge=0)
    monthly_contribution: float = Field(..., ge=0)
    annual_return: float = Field(..., ge=0, le=100)
    years: int = Field(..., ge=1, le=50)
    simulation_type: Optional[str] = "wealth_accumulation"
    goal_id: Optional[int] = None
    scenarios: Optional[List[Dict[str, Any]]] = None
