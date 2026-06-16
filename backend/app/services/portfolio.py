from datetime import datetime, timezone
from decimal import Decimal
import logging
from sqlalchemy.orm import Session
from app.models.transaction import Transaction, TransactionType
from app.models.investment import Investment, AssetType
from app.models.user import RiskProfile
from app.repositories.investment import investment_repository
from app.repositories.transaction import transaction_repository
from app.schemas.transaction import TransactionCreate
from app.core.exceptions import AppException
from app.services.market_data.market_service import market_service

logger = logging.getLogger(__name__)

class PortfolioService:
    def post_transaction(self, db: Session, user_id: int, tx_in: TransactionCreate) -> Transaction:
        """Post a transaction, updating/creating user holdings and adjusting cash ledger."""
        qty = Decimal(str(tx_in.quantity))
        price = Decimal(str(tx_in.price))
        fees = Decimal(str(tx_in.fees))
        
        # Calculate cash impacts
        if tx_in.type == TransactionType.BUY:
            total_amount = qty * price + fees
        elif tx_in.type == TransactionType.SELL:
            total_amount = qty * price - fees
        elif tx_in.type in (TransactionType.CONTRIBUTION, TransactionType.DIVIDEND, TransactionType.WITHDRAWAL):
            total_amount = qty  # For cash actions, quantity represents cash amount
        else:
            total_amount = Decimal("0.0000")

        # Reconcile Cash balance
        cash_holding = investment_repository.get_by_symbol(db, user_id, "CASH")
        if not cash_holding:
            cash_holding = Investment(
                user_id=user_id,
                asset_type=AssetType.CASH,
                symbol="CASH",
                asset_name="Cash Balance",
                units=Decimal("0.000000"),
                avg_buy_price=Decimal("1.0000"),
                cost_basis=Decimal("0.0000"),
                current_value=Decimal("0.0000"),
                last_price=Decimal("1.0000"),
                allocation_percent=Decimal("0.00")
            )
            db.add(cash_holding)
            db.flush()

        # Enforce account sufficiency checks
        if tx_in.type == TransactionType.BUY and cash_holding.units < total_amount:
            raise AppException("Insufficient cash balance to execute stock BUY.", code="INSUFFICIENT_FUNDS", status_code=400)
        elif tx_in.type == TransactionType.WITHDRAWAL and cash_holding.units < total_amount:
            raise AppException("Insufficient cash balance to complete WITHDRAWAL.", code="INSUFFICIENT_FUNDS", status_code=400)

        # Update cash asset ledger
        if tx_in.type == TransactionType.BUY:
            cash_holding.units -= total_amount
        elif tx_in.type == TransactionType.SELL:
            cash_holding.units += total_amount
        elif tx_in.type in (TransactionType.CONTRIBUTION, TransactionType.DIVIDEND):
            cash_holding.units += total_amount
        elif tx_in.type == TransactionType.WITHDRAWAL:
            cash_holding.units -= total_amount

        cash_holding.cost_basis = cash_holding.units
        cash_holding.current_value = cash_holding.units
        db.add(cash_holding)

        # Process investment holding adjustments
        target_inv = None
        if tx_in.type in (TransactionType.BUY, TransactionType.SELL):
            target_inv = investment_repository.get_by_symbol(db, user_id, tx_in.symbol)
            if not target_inv:
                if tx_in.type == TransactionType.SELL:
                    raise AppException(f"Cannot execute sell order. No active holdings for {tx_in.symbol}.", code="HOLDING_NOT_FOUND", status_code=400)
                
                # Create default active holding record
                asset_type = AssetType.STOCK
                if ".NS" in tx_in.symbol:
                    asset_type = AssetType.STOCK
                target_inv = Investment(
                    user_id=user_id,
                    asset_type=asset_type,
                    symbol=tx_in.symbol,
                    asset_name=f"{tx_in.symbol} Asset",
                    units=Decimal("0.000000"),
                    avg_buy_price=Decimal("0.0000"),
                    cost_basis=Decimal("0.0000"),
                    current_value=Decimal("0.0000"),
                    last_price=Decimal("0.0000"),
                    risk_level=RiskProfile.MODERATE
                )
                db.add(target_inv)
                db.flush()

            # Compute buy/sell unit re-balancing
            if tx_in.type == TransactionType.BUY:
                new_units = target_inv.units + qty
                new_cost = target_inv.cost_basis + total_amount
                target_inv.units = new_units
                target_inv.cost_basis = new_cost
                target_inv.avg_buy_price = new_cost / new_units if new_units > 0 else Decimal("0.0000")
                target_inv.last_price = price
                target_inv.current_value = new_units * price
                target_inv.last_price_at = datetime.now(timezone.utc)
            elif tx_in.type == TransactionType.SELL:
                if target_inv.units < qty:
                    raise AppException(f"Insufficient units held to execute SELL order. Available: {target_inv.units}, Requested: {qty}", code="INSUFFICIENT_UNITS", status_code=400)
                
                new_units = target_inv.units - qty
                proportional_cost_basis = target_inv.cost_basis - (qty * target_inv.avg_buy_price)
                target_inv.units = new_units
                target_inv.cost_basis = max(Decimal("0.0000"), proportional_cost_basis)
                target_inv.last_price = price
                target_inv.current_value = new_units * price
                target_inv.last_price_at = datetime.now(timezone.utc)
                if new_units == 0:
                    target_inv.avg_buy_price = Decimal("0.0000")

            db.add(target_inv)

        # Log transaction ledger
        db_tx = Transaction(
            user_id=user_id,
            investment_id=target_inv.id if target_inv else None,
            symbol=tx_in.symbol,
            type=tx_in.type,
            quantity=qty,
            price=price,
            fees=fees,
            total_amount=total_amount,
            notes=tx_in.notes,
            executed_at=tx_in.executed_at if tx_in.executed_at else datetime.now(timezone.utc)
        )
        db.add(db_tx)
        db.commit()
        db.refresh(db_tx)

        # Recalculate allocation splits
        self.recalculate_allocations(db, user_id)
        return db_tx

    def delete_transaction(self, db: Session, user_id: int, transaction_id: int):
        """Delete a transaction log and reverse its impact on holdings."""
        tx = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == user_id).first()
        if not tx:
            raise AppException("Transaction record not found.", code="NOT_FOUND", status_code=404)
        
        cash_holding = investment_repository.get_by_symbol(db, user_id, "CASH")
        
        # Reverse cash impact
        if tx.type == TransactionType.BUY:
            if cash_holding:
                cash_holding.units += tx.total_amount
        elif tx.type == TransactionType.SELL:
            if cash_holding:
                if cash_holding.units < tx.total_amount:
                    raise AppException("Reversing this sell transaction would result in negative cash balance.", code="INSUFFICIENT_FUNDS", status_code=400)
                cash_holding.units -= tx.total_amount
        elif tx.type in (TransactionType.CONTRIBUTION, TransactionType.DIVIDEND):
            if cash_holding:
                if cash_holding.units < tx.total_amount:
                    raise AppException("Reversing this cash injection would result in negative cash balance.", code="INSUFFICIENT_FUNDS", status_code=400)
                cash_holding.units -= tx.total_amount
        elif tx.type == TransactionType.WITHDRAWAL:
            if cash_holding:
                cash_holding.units += tx.total_amount

        if cash_holding:
            cash_holding.cost_basis = cash_holding.units
            cash_holding.current_value = cash_holding.units
            db.add(cash_holding)

        # Reverse asset holdings impact
        if tx.type in (TransactionType.BUY, TransactionType.SELL) and tx.investment_id:
            inv = investment_repository.get(db, id=tx.investment_id)
            if inv:
                if tx.type == TransactionType.BUY:
                    if inv.units < tx.quantity:
                        raise AppException("Cannot delete transaction: assets already sold downstream.", code="INSUFFICIENT_UNITS", status_code=400)
                    new_units = inv.units - tx.quantity
                    new_cost = inv.cost_basis - tx.total_amount
                    inv.units = new_units
                    inv.cost_basis = max(Decimal("0.0000"), new_cost)
                    inv.avg_buy_price = new_cost / new_units if new_units > 0 else Decimal("0.0000")
                    inv.current_value = new_units * inv.last_price
                elif tx.type == TransactionType.SELL:
                    new_units = inv.units + tx.quantity
                    # Estimate original purchase price back from active avg cost
                    original_cost_added = tx.quantity * inv.avg_buy_price
                    new_cost = inv.cost_basis + original_cost_added
                    inv.units = new_units
                    inv.cost_basis = new_cost
                    inv.current_value = new_units * inv.last_price

                db.add(inv)

        db.delete(tx)
        db.commit()
        
        # Re-balance allocation splits
        self.recalculate_allocations(db, user_id)

    def recalculate_allocations(self, db: Session, user_id: int):
        """Recalculate allocation weights for active holdings."""
        investments = investment_repository.get_by_user(db, user_id)
        total_val = sum(inv.current_value for inv in investments)
        for inv in investments:
            if total_val > 0:
                inv.allocation_percent = (inv.current_value / total_val) * Decimal("100.00")
            else:
                inv.allocation_percent = Decimal("0.00")
            db.add(inv)
        db.commit()

    def get_portfolio_summary(self, db: Session, user_id: int) -> dict:
        """Compile cost basis, current evaluations, net P&L splits, and cash summaries."""
        investments = investment_repository.get_by_user(db, user_id)
        
        # Exclude CASH from holding P&L metrics so they only represent stock/fund gains
        non_cash_investments = [inv for inv in investments if inv.symbol != "CASH"]
        
        total_value = sum(inv.current_value for inv in investments)
        total_cost = sum(inv.cost_basis for inv in investments)
        
        stock_value = sum(inv.current_value for inv in non_cash_investments)
        stock_cost = sum(inv.cost_basis for inv in non_cash_investments)
        
        net_profit = stock_value - stock_cost
        percentage_profit = (net_profit / stock_cost) * Decimal("100.00") if stock_cost > 0 else Decimal("0.00")

        cash_balance = Decimal("0.00")
        cash_holding = investment_repository.get_by_symbol(db, user_id, "CASH")
        if cash_holding:
            cash_balance = cash_holding.units

        return {
            "total_value": total_value,
            "total_cost": total_cost,
            "stock_value": stock_value,
            "stock_cost": stock_cost,
            "net_profit": net_profit,
            "percentage_profit": percentage_profit,
            "cash_balance": cash_balance
        }

    def calculate_position_value(self, db: Session, investment: Investment, price: Decimal) -> Decimal:
        """Update last_price, current_value, and last_price_at on an investment."""
        investment.last_price = price
        investment.current_value = investment.quantity * price
        investment.last_price_at = datetime.now(timezone.utc)
        db.add(investment)
        db.commit()
        db.refresh(investment)
        return investment.current_value

    def calculate_portfolio_value(self, db: Session, user_id: int) -> Decimal:
        """Get total portfolio value (sum of all current values including cash)."""
        investments = investment_repository.get_by_user(db, user_id)
        return sum(inv.current_value for inv in investments)

    def calculate_unrealized_gain(self, db: Session, user_id: int) -> dict:
        """Get net unrealized profit/loss and percentage for non-CASH holdings."""
        investments = investment_repository.get_by_user(db, user_id)
        non_cash = [inv for inv in investments if inv.symbol != "CASH"]
        
        total_cost = sum(inv.cost_basis for inv in non_cash)
        current_value = sum(inv.current_value for inv in non_cash)
        
        gain = current_value - total_cost
        gain_percent = (gain / total_cost) * Decimal("100.00") if total_cost > 0 else Decimal("0.00")
        
        return {
            "unrealized_gain": gain,
            "unrealized_gain_percent": gain_percent,
            "total_cost": total_cost,
            "current_value": current_value
        }

    def calculate_allocation(self, db: Session, user_id: int) -> None:
        """Recalculate allocation weights for active holdings."""
        self.recalculate_allocations(db, user_id)

    def refresh_user_prices(self, db: Session, user_id: int) -> dict:
        """Fetch latest prices from market data service and update user holdings."""
        investments = investment_repository.get_by_user(db, user_id)
        refreshed = []
        for inv in investments:
            if inv.symbol == "CASH":
                continue
            try:
                price_data = market_service.get_price(inv.ticker_symbol, skip_cache=True)
                inv.last_price = Decimal(str(price_data["price"]))
                inv.current_value = inv.quantity * inv.last_price
                inv.last_price_at = price_data["timestamp"]
                inv.data_provider = price_data.get("provider", "Yahoo Finance")
                db.add(inv)
                refreshed.append({
                    "symbol": inv.ticker_symbol,
                    "price": price_data["price"],
                    "provider": inv.data_provider
                })
            except Exception as e:
                logger.error(f"Error refreshing ticker {inv.ticker_symbol} for user {user_id}: {e}")
                
        db.commit()
        self.recalculate_allocations(db, user_id)
        return {"refreshed": refreshed}

portfolio_service = PortfolioService()
