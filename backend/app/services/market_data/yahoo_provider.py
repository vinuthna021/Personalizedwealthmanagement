import yfinance as yf
from datetime import datetime, timezone
from app.services.market_data.base_provider import BaseMarketDataProvider

class YahooMarketDataProvider(BaseMarketDataProvider):
    def get_price(self, ticker: str) -> dict:
        symbol = ticker.upper()
        try:
            yf_ticker = yf.Ticker(symbol)
            # Fetch last 5 days to cover weekends/holidays
            hist = yf_ticker.history(period="5d")
            if hist.empty:
                raise ValueError(f"No historical price data found for ticker {symbol} via Yahoo Finance")
            
            last_row = hist.iloc[-1]
            price = float(last_row["Close"])
            timestamp = hist.index[-1].to_pydatetime()
            
            # Ensure timezone-aware datetime in UTC
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)
            else:
                timestamp = timestamp.astimezone(timezone.utc)
            
            # Detect currency
            currency = "INR" if symbol.endswith((".NS", ".BO")) else "USD"
            
            return {
                "symbol": symbol,
                "price": price,
                "currency": currency,
                "timestamp": timestamp,
                "provider": "Yahoo Finance"
            }
        except Exception as e:
            raise RuntimeError(f"Yahoo Finance provider failed for symbol {symbol}: {str(e)}") from e
