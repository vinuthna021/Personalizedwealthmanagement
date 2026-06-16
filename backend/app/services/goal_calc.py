from datetime import date
from decimal import Decimal
from app.models.goal import Goal

class GoalCalcService:
    def calculate_progress(self, goal: Goal) -> dict:
        """Calculate progress percentage, months remaining, and cash projections."""
        today = date.today()
        
        # Calculate months remaining
        months_remaining = (goal.target_date.year - today.year) * 12 + (goal.target_date.month - today.month)
        if months_remaining < 0:
            months_remaining = 0

        # Calculate progress percentage
        target = Decimal(str(goal.target_amount))
        current = Decimal(str(goal.current_amount))
        progress_pct = (current / target) * Decimal("100.00") if target > 0 else Decimal("0.00")
        
        # Proportional capping for visual ease
        progress_pct = min(Decimal("100.00"), max(Decimal("0.00"), progress_pct))

        # Calculate shortfall and required monthly contributions
        shortfall = target - current
        if shortfall <= 0:
            shortfall = Decimal("0.0000")
            required_monthly = Decimal("0.0000")
        else:
            required_monthly = shortfall / Decimal(str(months_remaining)) if months_remaining > 0 else shortfall

        # Project balance at target date based on current monthly contribution setting
        monthly_contrib = Decimal(str(goal.monthly_contribution))
        projected_final = current + (monthly_contrib * Decimal(str(months_remaining)))
        
        is_on_track = projected_final >= target

        return {
            "progress_percent": float(progress_pct),
            "months_remaining": months_remaining,
            "shortfall": float(shortfall),
            "required_monthly_contribution": float(required_monthly),
            "projected_final_amount": float(projected_final),
            "is_on_track": is_on_track
        }

goal_calc_service = GoalCalcService()
