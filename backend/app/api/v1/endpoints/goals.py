from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.goal import Goal
from app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse
from app.repositories.goal import goal_repository
from app.services.goal_calc import goal_calc_service

router = APIRouter()

class GoalResponseWithCalculations(GoalResponse):
    calculations: Dict[str, Any]

@router.get("", response_model=List[GoalResponseWithCalculations])
def read_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Retrieve all goals for current user, appending projection calculations."""
    goals = goal_repository.get_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    response_list = []
    for g in goals:
        calc = goal_calc_service.calculate_progress(g)
        # Convert SQLAlchemy object to dictionary and add calculations
        g_dict = GoalResponse.model_validate(g).__dict__
        g_dict["calculations"] = calc
        response_list.append(g_dict)
    return response_list

@router.get("/{id}", response_model=GoalResponseWithCalculations)
def read_goal(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch single goal with projections."""
    goal = goal_repository.get(db, id=id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    calc = goal_calc_service.calculate_progress(goal)
    g_dict = GoalResponse.model_validate(goal).__dict__
    g_dict["calculations"] = calc
    return g_dict

@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_in: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new financial goal."""
    # Build complete Goal data inserting user_id
    goal_data = goal_in.model_dump()
    db_obj = Goal(user_id=current_user.id, **goal_data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=GoalResponse)
def update_goal(
    id: int,
    goal_in: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update goal configuration details."""
    goal = goal_repository.get(db, id=id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal_repository.update(db, db_obj=goal, obj_in=goal_in)

@router.delete("/{id}", response_model=GoalResponse)
def delete_goal(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete goal, cascading to remove calculations."""
    goal = goal_repository.get(db, id=id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal_repository.remove(db, id=id)
