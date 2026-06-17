def test_recommendations_lifecycle(client):
    # 1. Register and Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "rectest@example.com", "name": "Recommendation User", "password": "password123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "rectest@example.com", "password": "password123"}
    )
    cookies = login_resp.cookies

    # 2. Generate initial recommendation
    gen_resp = client.post("/api/v1/recommendations/generate", cookies=cookies)
    assert gen_resp.status_code == 201
    gen_json = gen_resp.json()
    assert "recommendation" in gen_json
    rec_id = gen_json["recommendation"]["id"]
    assert gen_json["recommendation"]["is_read"] is False
    assert gen_json["recommendation"]["title"] is not None

    # 3. Retrieve historical list
    list_resp = client.get("/api/v1/recommendations", cookies=cookies)
    assert list_resp.status_code == 200
    list_json = list_resp.json()
    assert "recommendations" in list_json
    assert len(list_json["recommendations"]) == 1
    assert list_json["recommendations"][0]["id"] == rec_id

    # 4. Mark recommendation as read
    read_resp = client.patch(f"/api/v1/recommendations/{rec_id}/read", cookies=cookies)
    assert read_resp.status_code == 200
    assert read_resp.json()["is_read"] is True

    # 5. Mark non-existent recommendation as read (should return 404)
    bad_read_resp = client.patch("/api/v1/recommendations/99999/read", cookies=cookies)
    assert bad_read_resp.status_code == 404

    # 6. Retrieve rebalancing advice
    rebal_resp = client.get("/api/v1/recommendations/rebalance", cookies=cookies)
    assert rebal_resp.status_code == 200
    rebal_json = rebal_resp.json()
    assert "total_value" in rebal_json
    assert "current_allocations" in rebal_json
    assert "target_allocations" in rebal_json
    assert "drift" in rebal_json
    assert "suggestions" in rebal_json
    assert len(rebal_json["suggestions"]) > 0  # portfolio is empty, should suggest initial buys
