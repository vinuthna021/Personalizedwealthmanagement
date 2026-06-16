def test_investments_lifecycle(client):
    # 1. Register and Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "invtest@example.com", "name": "Inv User", "password": "password123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "invtest@example.com", "password": "password123"}
    )
    cookies = login_resp.cookies

    # 2. Create Investment holding
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
        cookies=cookies
    )
    assert create_resp.status_code == 201
    inv_id = create_resp.json()["id"]

    # 3. Read Holdings list
    list_resp = client.get("/api/v1/investments", cookies=cookies)
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert len(data) == 1
    assert data[0]["symbol"] == "RELIANCE.NS"
    assert float(data[0]["cost_basis"]) == 24000.0

    # 4. Get Portfolio Summary
    summary_resp = client.get("/api/v1/investments/summary", cookies=cookies)
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    assert float(summary["total_cost"]) == 24000.0
    assert float(summary["total_value"]) == 24000.0

    # 5. Update Investment
    update_resp = client.put(
        f"/api/v1/investments/{inv_id}",
        json={"last_price": 2500.0000},
        cookies=cookies
    )
    assert update_resp.status_code == 200
    assert float(update_resp.json()["current_value"]) == 25000.0

    # 6. Recheck Summary after update
    summary2 = client.get("/api/v1/investments/summary", cookies=cookies).json()
    assert float(summary2["total_value"]) == 25000.0
    assert float(summary2["net_profit"]) == 1000.0

    # 7. Delete Holding
    client.delete(f"/api/v1/investments/{inv_id}", cookies=cookies)
    assert len(client.get("/api/v1/investments", cookies=cookies).json()) == 0
