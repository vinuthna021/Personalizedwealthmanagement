from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.simulation import Simulation
from app.schemas.simulation import SimulationCreate, SimulationResponse, SimulationRunInput
from app.services.simulations.simulation_engine import simulation_engine

router = APIRouter()

@router.post("/run")
def run_simulation(
    sim_in: SimulationRunInput,
    current_user: User = Depends(get_current_user)
):
    """Run simulated future growth calculations and return projection timelines."""
    # If scenarios are provided, run what-if simulation comparison
    if sim_in.scenarios:
        baseline = {
            "current_amount": sim_in.current_amount,
            "monthly_contribution": sim_in.monthly_contribution,
            "annual_return": sim_in.annual_return,
            "years": sim_in.years
        }
        res = simulation_engine.run_what_if(baseline, sim_in.scenarios)
        return res
    else:
        # Otherwise, run single baseline projection
        res = simulation_engine.calculate_future_value(
            current_amount=sim_in.current_amount,
            monthly_contribution=sim_in.monthly_contribution,
            annual_return=sim_in.annual_return,
            years=sim_in.years
        )
        return res

@router.post("/save", response_model=SimulationResponse, status_code=status.HTTP_201_CREATED)
def save_simulation(
    sim_in: SimulationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save simulation projection and parameter logs to database."""
    db_obj = Simulation(
        user_id=current_user.id,
        goal_id=sim_in.goal_id,
        scenario_name=sim_in.scenario_name,
        simulation_type=sim_in.simulation_type,
        input_parameters=sim_in.input_parameters,
        result_json=sim_in.result_json
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("", response_model=List[SimulationResponse])
def get_simulations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch all saved simulations for the current user."""
    return db.query(Simulation).filter(Simulation.user_id == current_user.id).order_by(Simulation.created_at.desc()).all()

@router.get("/{id}", response_model=SimulationResponse)
def get_simulation(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve details of a saved simulation."""
    sim = db.query(Simulation).filter(Simulation.id == id).first()
    if not sim or sim.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return sim

@router.delete("/{id}", response_model=SimulationResponse)
def delete_simulation(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a saved simulation registry."""
    sim = db.query(Simulation).filter(Simulation.id == id).first()
    if not sim or sim.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Simulation not found")
    db.delete(sim)
    db.commit()
    return sim
