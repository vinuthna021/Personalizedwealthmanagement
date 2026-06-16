import httpx
from datetime import datetime, timezone
from app.services.market_data.base_provider import BaseMarketDataProvider

class AlphaVantageDataProvider(BaseMarketDataProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key

    def get_price(self, ticker: str) -> dict:
        symbol = ticker.upper()
        if not self.api_key:
            raise ValueError("Alpha Vantage API key is not configured")
        
        url = "https://www.alphavantage.co/query"
        params = {
            "function": "GLOBAL_QUOTE",
            "symbol": symbol,
            "apikey": self.api_key
        }
        
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
                
                # Check for API rate limiting note
                if "Note" in data:
                    raise RuntimeError(f"Alpha Vantage rate limit reached: {data['Note']}")
                    
                if "Global Quote" not in data or not data["Global Quote"]:
                    raise ValueError(f"No Alpha Vantage data found for symbol {symbol}")
                    
                quote = data["Global Quote"]
                price_str = quote.get("05. price")
                if not price_str:
                    raise ValueError(f"No price found in Alpha Vantage global quote for symbol {symbol}")
                    
                price = float(price_str)
                currency = "INR" if symbol.endswith((".NS", ".BO")) else "USD"
                
                return {
                    "symbol": symbol,
                    "price": price,
                    "currency": currency,
                    "timestamp": datetime.now(timezone.utc),
                    "provider": "Alpha Vantage"
                }
        except Exception as e:
            raise RuntimeError(f"Alpha Vantage provider failed for symbol {symbol}: {str(e)}") from e
