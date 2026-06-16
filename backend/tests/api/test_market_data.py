from unittest.mock import patch
from datetime import datetime, timezone
import pytest

@pytest.fixture
def logged_in_cookies(client):
    # Register and Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "markettest@example.com", "name": "Market User", "password": "password123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "markettest@example.com", "password": "password123"}
    )
    return login_resp.cookies

def test_market_price_endpoint(client, logged_in_cookies):
    mock_price_data = {
        "symbol": "AAPL",
        "price": 175.50,
        "currency": "USD",
        "timestamp": datetime.now(timezone.utc),
        "provider": "Yahoo Finance"
    }
    
    with patch("app.services.market_data.market_service.market_service.yahoo_provider.get_price", return_value=mock_price_data):
        resp = client.get("/api/v1/market/AAPL", cookies=logged_in_cookies)
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "AAPL"
        assert data["price"] == 175.50
        assert data["provider"] == "Yahoo Finance"

def test_portfolio_refresh_endpoint(client, logged_in_cookies):
    # 1. Create an investment holding
    create_resp = client.post(
        "/api/v1/investments",
        json={
            "asset_type": "stock",
            "symbol": "RELIANCE.NS",
            "asset_name": "Reliance Industries",
            "units": 10.000000,
            "avg_buy_price": 2400.0000,
            "risk_level": "moderate"
        },
        cookies=logged_in_cookies
    )
    assert create_resp.status_code == 201
    
    mock_price_data = {
        "symbol": "RELIANCE.NS",
        "price": 2600.00,
        "currency": "INR",
        "timestamp": datetime.now(timezone.utc),
        "provider": "Yahoo Finance"
    }
    
    with patch("app.services.market_data.market_service.market_service.yahoo_provider.get_price", return_value=mock_price_data):
        refresh_resp = client.post("/api/v1/portfolio/refresh", cookies=logged_in_cookies)
        assert refresh_resp.status_code == 200
        
        # 2. Check holdings list has updated values
        list_resp = client.get("/api/v1/investments", cookies=logged_in_cookies)
        assert list_resp.status_code == 200
        data = list_resp.json()
        
        reliance = next(x for x in data if x["symbol"] == "RELIANCE.NS")
        assert float(reliance["last_price"]) == 2600.00
        assert float(reliance["current_value"]) == 26000.00
