from typing import Dict, List, Any
from sqlalchemy.orm import Session
from decimal import Decimal

from app.models.user import User
from app.repositories.investment import investment_repository
from app.services.allocation_engine import get_target_allocation, PLURAL_MAP

class RebalanceService:
    def compute_rebalance(self, db: Session, user: User) -> Dict[str, Any]:
        """
        Calculate current allocations, target allocations, and generate step-by-step BUY/SELL recommendations
        to minimize drift relative to the user's target risk profile.
        """
        investments = investment_repository.get_by_user(db, user.id)
        total_val = float(sum(inv.current_value for inv in investments))
        
        # Calculate current values by asset class
        current_values = {
            "stocks": 0.0,
            "etfs": 0.0,
            "mutual_funds": 0.0,
            "bonds": 0.0,
            "cash": 0.0
        }
        
        # Group holdings by asset class to give specific ticker context in instructions if available
        holdings_by_class = {
            "stocks": [],
            "etfs": [],
            "mutual_funds": [],
            "bonds": [],
            "cash": []
        }
        
        for inv in investments:
            asset_class_str = str(inv.asset_class.value if hasattr(inv.asset_class, "value") else inv.asset_class).lower()
            key = PLURAL_MAP.get(asset_class_str, "cash")
            current_values[key] += float(inv.current_value)
            holdings_by_class[key].append(inv)

        # Calculate current allocations
        current_allocations = {}
        for key, val in current_values.items():
            if total_val > 0:
                current_allocations[key] = round((val / total_val) * 100.0, 2)
            else:
                current_allocations[key] = 0.0

        risk_profile_str = user.risk_profile.value if hasattr(user.risk_profile, "value") else str(user.risk_profile)
        targets = get_target_allocation(risk_profile_str)
        
        drift = {}
        suggestions = []
        
        if total_val == 0:
            # Portfolio is completely empty, suggest initial funding and buys
            for key, target_pct in targets.items():
                if target_pct > 0:
                    suggestions.append({
                        "asset_class": key,
                        "action": "BUY",
                        "amount": 0.0,
                        "percentage": target_pct,
                        "message": f"Portfolio is empty. Fund account and allocate {target_pct}% to {key.replace('_', ' ').capitalize()}."
                    })
            return {
                "total_value": 0.0,
                "current_allocations": {k: 0.0 for k in targets},
                "target_allocations": targets,
                "drift": {k: 0.0 for k in targets},
                "suggestions": suggestions
            }

        # Calculate absolute value target and value drift for each class
        for key in ["stocks", "etfs", "mutual_funds", "bonds", "cash"]:
            curr_pct = current_allocations.get(key, 0.0)
            targ_pct = targets.get(key, 0.0)
            drift_pct = round(curr_pct - targ_pct, 2)
            drift[key] = drift_pct
            
            target_val = total_val * (targ_pct / 100.0)
            diff_val = current_values[key] - target_val
            
            # If absolute drift is more than 0.5% or value difference is substantial
            if abs(drift_pct) > 0.5:
                action = "SELL" if diff_val > 0 else "BUY"
                abs_diff = abs(diff_val)
                
                # Check for existing holdings to construct detailed messages
                class_holdings = holdings_by_class.get(key, [])
                tickers_str = ", ".join([h.ticker_symbol for h in class_holdings if h.ticker_symbol != "CASH"])
                
                if action == "SELL":
                    msg = f"Your {key.replace('_', ' ')} allocation is overweight by {drift_pct:+.2f}% (${abs_diff:.2f})."
                    if tickers_str:
                        msg += f" Sell a portion of your holdings ({tickers_str}) to reduce exposure."
                    else:
                        msg += " Sell assets in this class to realign."
                else:
                    msg = f"Your {key.replace('_', ' ')} allocation is underweight by {drift_pct:+.2f}% (${abs_diff:.2f})."
                    if tickers_str:
                        msg += f" Buy more of your existing holdings ({tickers_str}) or new assets in this class."
                    else:
                        msg += " Purchase assets in this class to increase exposure."
                
                suggestions.append({
                    "asset_class": key,
                    "action": action,
                    "amount": round(abs_diff, 2),
                    "percentage": abs(drift_pct),
                    "message": msg
                })

        return {
            "total_value": round(total_val, 2),
            "current_allocations": current_allocations,
            "target_allocations": targets,
            "drift": drift,
            "suggestions": suggestions
        }

rebalance_service = RebalanceService()
