import redis
import json
import logging
from datetime import datetime, timezone
from typing import Optional
from dateutil import parser as date_parser

from app.core.config import settings
from app.services.market_data.yahoo_provider import YahooMarketDataProvider
from app.services.market_data.alpha_vantage_provider import AlphaVantageDataProvider

logger = logging.getLogger(__name__)

# Initialize Redis client with graceful error handling
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception as e:
    logger.error(f"Failed to connect to Redis: {e}")
    redis_client = None

class MarketService:
    def __init__(self):
        self.yahoo_provider = YahooMarketDataProvider()
        self.alpha_vantage_provider = AlphaVantageDataProvider(api_key=settings.ALPHA_VANTAGE_API_KEY)
        
    def get_price(self, ticker: str, skip_cache: bool = False) -> dict:
        symbol = ticker.upper()
        
        # Immediate short circuit for CASH
        if symbol == "CASH":
            return {
                "symbol": "CASH",
                "price": 1.0,
                "currency": "INR",
                "timestamp": datetime.now(timezone.utc),
                "provider": "Local"
            }
            
        # 1. Check Redis Cache
        cache_key = f"price:{symbol}"
        if not skip_cache and redis_client:
            try:
                cached_data = redis_client.get(cache_key)
                if cached_data:
                    data = json.loads(cached_data)
                    # Parse timestamp back to datetime object
                    if "timestamp" in data and isinstance(data["timestamp"], str):
                        data["timestamp"] = date_parser.parse(data["timestamp"])
                    logger.info(f"Cache hit for ticker: {symbol}")
                    return data
            except Exception as e:
                logger.warning(f"Failed to read from Redis cache: {e}")

        # 2. Cache Miss - Fetch from providers
        price_data = None
        errors = []
        
        # Try Yahoo Finance first (if enabled)
        if settings.YAHOO_ENABLED:
            try:
                logger.info(f"Attempting to fetch {symbol} from Yahoo Finance")
                price_data = self.yahoo_provider.get_price(symbol)
                logger.info(f"Successfully fetched {symbol} from Yahoo Finance")
            except Exception as e:
                err_msg = f"Yahoo Finance failed: {e}"
                logger.warning(err_msg)
                errors.append(err_msg)

        # Try Alpha Vantage fallback if Yahoo failed or was disabled
        if not price_data and settings.ALPHA_VANTAGE_API_KEY:
            try:
                logger.info(f"Attempting to fetch {symbol} from Alpha Vantage fallback")
                price_data = self.alpha_vantage_provider.get_price(symbol)
                logger.info(f"Successfully fetched {symbol} from Alpha Vantage fallback")
            except Exception as e:
                err_msg = f"Alpha Vantage failed: {e}"
                logger.warning(err_msg)
                errors.append(err_msg)
                
        if not price_data:
            raise RuntimeError(f"Failed to fetch market data for {symbol}. Errors: {'; '.join(errors)}")

        # 3. Cache the result in Redis for 15 minutes
        if redis_client:
            try:
                serialized_data = {
                    "symbol": price_data["symbol"],
                    "price": price_data["price"],
                    "currency": price_data["currency"],
                    "timestamp": price_data["timestamp"].isoformat(),
                    "provider": price_data.get("provider", "Yahoo Finance")
                }
                redis_client.setex(cache_key, 900, json.dumps(serialized_data))
                logger.info(f"Cached price for {symbol} in Redis (TTL: 15m)")
            except Exception as e:
                logger.warning(f"Failed to cache price in Redis: {e}")

        return price_data

market_service = MarketService()
