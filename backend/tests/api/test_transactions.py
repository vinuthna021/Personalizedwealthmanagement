def test_transactions_and_portfolio_math(client):
    # 1. Register and Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "txtest@example.com", "name": "Tx User", "password": "password123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "txtest@example.com", "password": "password123"}
    )
    cookies = login_resp.cookies

    # 2. Assert CASH holding is created automatically or initially 0
    summary = client.get("/api/v1/investments/summary", cookies=cookies).json()
    assert float(summary["cash_balance"]) == 0.0

    # 3. Post a CONTRIBUTION transaction (to inject cash)
    contrib_resp = client.post(
        "/api/v1/transactions",
        json={
            "symbol": "CASH",
            "type": "contribution",
            "quantity": 100000.000000,
            "price": 1.0000,
            "fees": 0.0000,
            "notes": "Initial cash deposit"
        },
        cookies=cookies
    )
    assert contrib_resp.status_code == 201
    
    summary = client.get("/api/v1/investments/summary", cookies=cookies).json()
    assert float(summary["cash_balance"]) == 100000.0

    # 4. Post a BUY transaction for a stock (TCS.NS)
    buy_resp = client.post(
        "/api/v1/transactions",
        json={
            "symbol": "TCS.NS",
            "type": "buy",
            "quantity": 10.000000,
            "price": 3000.0000,
            "fees": 150.0000,  # 30000 + 150 = 30150 total cost
            "notes": "Buy TCS stocks"
        },
        cookies=cookies
    )
    assert buy_resp.status_code == 201
    tx_id = buy_resp.json()["id"]

    # Assert cash is reduced
    summary = client.get("/api/v1/investments/summary", cookies=cookies).json()
    assert float(summary["cash_balance"]) == 100000.0 - 30150.0 # 69850.0
    
    # Assert TCS investment is created
    inv_list = client.get("/api/v1/investments", cookies=cookies).json()
    tcs_holding = next(i for i in inv_list if i["symbol"] == "TCS.NS")
    assert float(tcs_holding["units"]) == 10.0
    assert float(tcs_holding["cost_basis"]) == 30150.0
    assert float(tcs_holding["avg_buy_price"]) == 3015.0

    # 5. Attempt a BUY transaction exceeding cash balance
    fail_buy = client.post(
        "/api/v1/transactions",
        json={
            "symbol": "INFY.NS",
            "type": "buy",
            "quantity": 100.000000,
            "price": 1500.0000,  # 150000 total cost
            "fees": 0.0000
        },
        cookies=cookies
    )
    assert fail_buy.status_code == 400
    assert fail_buy.json()["error"]["code"] == "INSUFFICIENT_FUNDS"

    # 6. Post a SELL transaction
    sell_resp = client.post(
        "/api/v1/transactions",
        json={
            "symbol": "TCS.NS",
            "type": "sell",
            "quantity": 5.000000,
            "price": 3200.0000,  # 16000 - 50 fees = 15950 cash generated
            "fees": 50.0000,
            "notes": "Sell half TCS holdings"
        },
        cookies=cookies
    )
    assert sell_resp.status_code == 201
    sell_tx_id = sell_resp.json()["id"]

    # Recheck cash and holdings
    summary = client.get("/api/v1/investments/summary", cookies=cookies).json()
    assert float(summary["cash_balance"]) == 69850.0 + 15950.0 # 85800.0

    inv_list = client.get("/api/v1/investments", cookies=cookies).json()
    tcs_holding = next(i for i in inv_list if i["symbol"] == "TCS.NS")
    assert float(tcs_holding["units"]) == 5.0
    # Proportional cost basis decrease: 30150 - (5 * 3015) = 15075.0
    assert float(tcs_holding["cost_basis"]) == 15075.0

    # 7. Delete the SELL transaction first
    del_sell_resp = client.delete(f"/api/v1/transactions/{sell_tx_id}", cookies=cookies)
    assert del_sell_resp.status_code == 200

    # Now we can safely delete/reverse the BUY transaction!
    del_resp = client.delete(f"/api/v1/transactions/{tx_id}", cookies=cookies)
    assert del_resp.status_code == 200
