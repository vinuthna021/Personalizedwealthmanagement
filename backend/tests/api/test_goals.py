def test_goals_lifecycle(client):
    # 1. Register and Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "goaltest@example.com", "name": "Goal User", "password": "password123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "goaltest@example.com", "password": "password123"}
    )
    cookies = login_resp.cookies

    # 2. Create Goal
    create_resp = client.post(
        "/api/v1/goals",
        json={
            "goal_name": "Buy a House",
            "goal_type": "home",
            "target_amount": 5000000.00,
            "current_amount": 1000000.00,
            "monthly_contribution": 50000.00,
            "target_date": "2030-12-31",
            "status": "active",
            "notes": "Dream house in Pune"
        },
        cookies=cookies
    )
    assert create_resp.status_code == 201
    goal_id = create_resp.json()["id"]

    # 3. Read Goals with calculations
    list_resp = client.get("/api/v1/goals", cookies=cookies)
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert len(data) == 1
    assert data[0]["goal_name"] == "Buy a House"
    assert "calculations" in data[0]
    assert data[0]["calculations"]["progress_percent"] == 20.0
    assert data[0]["calculations"]["months_remaining"] > 0

    # 4. Read single Goal
    read_resp = client.get(f"/api/v1/goals/{goal_id}", cookies=cookies)
    assert read_resp.status_code == 200
    assert read_resp.json()["goal_name"] == "Buy a House"

    # 5. Update Goal
    update_resp = client.put(
        f"/api/v1/goals/{goal_id}",
        json={"current_amount": 1500000.00},
        cookies=cookies
    )
    assert update_resp.status_code == 200
    assert float(update_resp.json()["current_amount"]) == 1500000.00

    # 6. Delete Goal
    delete_resp = client.delete(f"/api/v1/goals/{goal_id}", cookies=cookies)
    assert delete_resp.status_code == 200

    # 7. Check empty list
    empty_resp = client.get("/api/v1/goals", cookies=cookies)
    assert len(empty_resp.json()) == 0
