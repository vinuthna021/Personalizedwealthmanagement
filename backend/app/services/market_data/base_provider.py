from abc import ABC, abstractmethod

class BaseMarketDataProvider(ABC):
    @abstractmethod
    def get_price(self, ticker: str) -> dict:
        """
        Fetch the current price of a ticker.
        
        Returns:
            dict: {
                "symbol": str,
                "price": float,
                "currency": str,
                "timestamp": datetime
            }
        """
        pass
