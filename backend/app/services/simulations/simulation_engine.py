from typing import Dict, Any, List
from decimal import Decimal

class SimulationEngine:
    def calculate_future_value(
        self,
        current_amount: float,
        monthly_contribution: float,
        annual_return: float,
        years: int
    ) -> Dict[str, Any]:
        """
        Calculate future value of investments compounding monthly.
        Formula: FV = PV * (1 + r_m)^n_m + PMT * [((1 + r_m)^n_m - 1) / r_m]
        """
        PV = float(current_amount)
        PMT = float(monthly_contribution)
        r = float(annual_return)
        
        # Compounding monthly
        r_m = (r / 100.0) / 12.0
        n_m = int(years) * 12
        
        if r_m > 0:
            fv = PV * ((1 + r_m) ** n_m) + PMT * (((1 + r_m) ** n_m - 1) / r_m)
        else:
            fv = PV + PMT * n_m
            
        total_invested = PV + PMT * n_m
        earnings = max(0.0, fv - total_invested)
        
        timeline = []
        for y in range(1, int(years) + 1):
            n_y = y * 12
            if r_m > 0:
                fv_y = PV * ((1 + r_m) ** n_y) + PMT * (((1 + r_m) ** n_y - 1) / r_m)
            else:
                fv_y = PV + PMT * n_y
                
            invested_y = PV + PMT * n_y
            earnings_y = max(0.0, fv_y - invested_y)
            
            timeline.append({
                "year": y,
                "invested": round(invested_y, 2),
                "earnings": round(earnings_y, 2),
                "future_value": round(fv_y, 2)
            })
            
        return {
            "summary": {
                "total_invested": round(total_invested, 2),
                "estimated_earnings": round(earnings, 2),
                "future_value": round(fv, 2),
                "years": years,
                "annual_return": annual_return
            },
            "timeline": timeline
        }

    def run_what_if(
        self,
        baseline: Dict[str, Any],
        scenarios: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Run multiple scenario simulations and generate comparison timeline data.
        scenarios: list of dicts: [
            {"name": "Scenario A", "monthly_contribution": X, "annual_return": Y, "years": Z},
            ...
        ]
        """
        # 1. Run baseline
        baseline_res = self.calculate_future_value(
            current_amount=baseline.get("current_amount", 0.0),
            monthly_contribution=baseline.get("monthly_contribution", 0.0),
            annual_return=baseline.get("annual_return", 0.0),
            years=baseline.get("years", 10)
        )
        
        # 2. Run scenarios
        scenario_results = []
        max_years = baseline.get("years", 10)
        
        for sc in scenarios:
            years = sc.get("years", max_years)
            if years > max_years:
                max_years = years
                
            res = self.calculate_future_value(
                current_amount=sc.get("current_amount", baseline.get("current_amount", 0.0)),
                monthly_contribution=sc.get("monthly_contribution", baseline.get("monthly_contribution", 0.0)),
                annual_return=sc.get("annual_return", baseline.get("annual_return", 0.0)),
                years=years
            )
            scenario_results.append({
                "name": sc.get("name", "Unnamed Scenario"),
                "result": res
            })
            
        # 3. Create comparison timeline
        comparison_timeline = []
        for y in range(1, max_years + 1):
            row = {"year": y}
            
            # Fetch baseline FV if available for this year
            if y <= len(baseline_res["timeline"]):
                row["baseline"] = baseline_res["timeline"][y - 1]["future_value"]
            else:
                row["baseline"] = None
                
            # Fetch scenario FVs
            for sc_res in scenario_results:
                name = sc_res["name"]
                t_list = sc_res["result"]["timeline"]
                if y <= len(t_list):
                    row[name] = t_list[y - 1]["future_value"]
                else:
                    row[name] = None
                    
            comparison_timeline.append(row)
            
        return {
            "baseline": baseline_res,
            "scenarios": {sc["name"]: sc["result"] for sc in scenario_results},
            "comparison_timeline": comparison_timeline
        }

simulation_engine = SimulationEngine()
