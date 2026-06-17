from datetime import datetime, timezone, timedelta
from typing import Dict, Optional
from sqlalchemy.orm import Session

from app.models.user import User, RiskProfile
from app.models.recommendation import Recommendation
from app.models.transaction import Transaction
from app.repositories.investment import investment_repository
from app.repositories.recommendation import recommendation_repository

TARGET_ALLOCATIONS = {
    "conservative": {
        "stocks": 20.0,
        "etfs": 10.0,
        "mutual_funds": 10.0,
        "bonds": 50.0,
        "cash": 10.0
    },
    "moderate": {
        "stocks": 40.0,
        "etfs": 15.0,
        "mutual_funds": 15.0,
        "bonds": 20.0,
        "cash": 10.0
    },
    "aggressive": {
        "stocks": 60.0,
        "etfs": 20.0,
        "mutual_funds": 10.0,
        "bonds": 5.0,
        "cash": 5.0
    }
}

PLURAL_MAP = {
    "stock": "stocks",
    "etf": "etfs",
    "mutual_fund": "mutual_funds",
    "bond": "bonds",
    "cash": "cash"
}

def get_target_allocation(risk_profile: str) -> Dict[str, float]:
    profile = str(risk_profile).lower()
    return TARGET_ALLOCATIONS.get(profile, TARGET_ALLOCATIONS["moderate"])

class AllocationEngine:
    def compute_recommendation(self, db: Session, user: User) -> Recommendation:
        """
        Compute a asset allocation recommendation for a user.
        If a recommendation was created in the last 24 hours and no transactions have occurred since,
        returns the existing latest recommendation.
        """
        latest = recommendation_repository.get_latest_by_user(db, user_id=user.id)
        if latest:
            # Check if any new transaction has been executed since latest recommendation creation
            new_tx_count = db.query(Transaction).filter(
                Transaction.user_id == user.id,
                Transaction.executed_at > latest.created_at
            ).count()
            
            # Also check if it's less than 24 hours old
            time_difference = datetime.now(timezone.utc) - latest.created_at.replace(tzinfo=timezone.utc)
            if new_tx_count == 0 and time_difference < timedelta(hours=24):
                return latest

        # No suitable cached recommendation, generate a new one
        investments = investment_repository.get_by_user(db, user.id)
        total_val = sum(inv.current_value for inv in investments)
        
        current_values = {
            "stocks": 0.0,
            "etfs": 0.0,
            "mutual_funds": 0.0,
            "bonds": 0.0,
            "cash": 0.0
        }
        
        for inv in investments:
            asset_class_str = str(inv.asset_class.value if hasattr(inv.asset_class, "value") else inv.asset_class).lower()
            key = PLURAL_MAP.get(asset_class_str, "cash")
            current_values[key] += float(inv.current_value)

        current_allocations = {}
        for key, val in current_values.items():
            if total_val > 0:
                current_allocations[key] = round((val / float(total_val)) * 100.0, 2)
            else:
                current_allocations[key] = 0.0

        risk_profile_str = user.risk_profile.value if hasattr(user.risk_profile, "value") else str(user.risk_profile)
        targets = get_target_allocation(risk_profile_str)
        
        # Build recommendations text
        title = f"Asset Allocation Advice ({risk_profile_str.capitalize()} Profile)"
        
        lines = [
            f"Your current risk profile is set to **{risk_profile_str.upper()}**.",
            "Based on your target model, here is the suggested asset allocation vs your current allocation:",
            ""
        ]
        
        drifts = {}
        for key in ["stocks", "etfs", "mutual_funds", "bonds", "cash"]:
            curr = current_allocations.get(key, 0.0)
            targ = targets.get(key, 0.0)
            drift = curr - targ
            drifts[key] = drift
            
            lines.append(f"- **{key.replace('_', ' ').capitalize()}**: Target {targ}% (Current {curr}%, Drift {drift:+.2f}%)")
        
        lines.append("")
        significant_drift = False
        drift_warnings = []
        for key, drift in drifts.items():
            if abs(drift) > 5.0:
                significant_drift = True
                action = "overweight (reduce holdings)" if drift > 0 else "underweight (increase holdings)"
                drift_warnings.append(f"- **{key.replace('_', ' ').capitalize()}** is {action} by {abs(drift):.2f}%.")

        if significant_drift:
            lines.append("### Action Required: Rebalancing Alert")
            lines.append("Your portfolio has experienced significant allocation drift (>5%):")
            lines.extend(drift_warnings)
            lines.append("")
            lines.append("We recommend executing a portfolio rebalance to realign your investments with your target risk profile. You can view step-by-step BUY/SELL instructions on the Rebalancing dashboard.")
        else:
            lines.append("### Portfolio Health: Balanced")
            lines.append("Your portfolio is well-aligned with your target asset allocation model. No immediate rebalancing actions are required.")

        recommendation_text = "\n".join(lines)
        
        # Create DB record
        from app.schemas.recommendation import RecommendationBase
        obj_in = RecommendationBase(
            title=title,
            recommendation_text=recommendation_text,
            suggested_allocation=targets
        )
        
        # Create recommendation
        db_obj = Recommendation(
            user_id=user.id,
            title=obj_in.title,
            recommendation_text=obj_in.recommendation_text,
            suggested_allocation=obj_in.suggested_allocation
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        return db_obj

allocation_engine = AllocationEngine()
