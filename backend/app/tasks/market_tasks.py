from app.celery_app import celery_app
from app.core.database import SessionLocal
from app.services.market_data.market_service import market_service
from app.services.portfolio import portfolio_service
from app.models.investment import Investment
import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def refresh_market_prices(self):
    """
    Background worker task to load investments, fetch latest prices,
    update the database, and recalculate portfolio values.
    """
    db = SessionLocal()
    try:
        logger.info("Starting refresh_market_prices Celery task")
        # Get all investments excluding CASH
        investments = db.query(Investment).filter(Investment.ticker_symbol != "CASH").all()
        
        updated_users = set()
        for inv in investments:
            try:
                logger.info(f"Refreshing price for symbol: {inv.ticker_symbol} (User {inv.user_id})")
                price_data = market_service.get_price(inv.ticker_symbol, skip_cache=True)
                
                inv.last_price = Decimal(str(price_data["price"]))
                inv.current_value = inv.quantity * inv.last_price
                inv.last_price_at = price_data["timestamp"]
                inv.data_provider = price_data.get("provider", "Yahoo Finance")
                
                db.add(inv)
                updated_users.add(inv.user_id)
                logger.info(f"Successfully refreshed price for {inv.ticker_symbol} to {inv.last_price}")
            except Exception as e:
                logger.error(f"Failed to refresh price for {inv.ticker_symbol} (User {inv.user_id}): {e}")
                # Continue refreshing other positions
                continue
                
        db.commit()
        
        # For each affected user, recalculate allocations and cash values
        for user_id in updated_users:
            try:
                logger.info(f"Recalculating allocations for User {user_id}")
                portfolio_service.recalculate_allocations(db, user_id)
            except Exception as e:
                logger.error(f"Failed to recalculate allocations for User {user_id}: {e}")
                
        logger.info("Finished refresh_market_prices Celery task successfully")
    except Exception as exc:
        logger.error(f"Fatal error in refresh_market_prices task: {exc}")
        db.rollback()
        raise self.retry(exc=exc)
    finally:
        db.close()
