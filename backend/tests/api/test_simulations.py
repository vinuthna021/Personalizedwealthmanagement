import pytest

@pytest.fixture
def logged_in_cookies(client):
    # Register and Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "simtest@example.com", "name": "Sim User", "password": "password123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "simtest@example.com", "password": "password123"}
    )
    return login_resp.cookies

def test_simulations_lifecycle(client, logged_in_cookies):
    # 1. Run Baseline Simulation Projection
    run_resp = client.post(
        "/api/v1/simulations/run",
        json={
            "current_amount": 10000,
            "monthly_contribution": 1000,
            "annual_return": 8.0,
            "years": 10
        },
        cookies=logged_in_cookies
    )
    assert run_resp.status_code == 200
    res_data = run_resp.json()
    assert "summary" in res_data
    assert "timeline" in res_data
    assert len(res_data["timeline"]) == 10
    assert res_data["summary"]["years"] == 10

    # 2. Run What-If Scenario Projection
    what_if_resp = client.post(
        "/api/v1/simulations/run",
        json={
            "current_amount": 10000,
            "monthly_contribution": 1000,
            "annual_return": 8.0,
            "years": 10,
            "scenarios": [
                {
                    "name": "Scenario A",
                    "monthly_contribution": 1500,
                    "annual_return": 8.0,
                    "years": 10
                }
            ]
        },
        cookies=logged_in_cookies
    )
    assert what_if_resp.status_code == 200
    what_if_data = what_if_resp.json()
    assert "baseline" in what_if_data
    assert "scenarios" in what_if_data
    assert "comparison_timeline" in what_if_data
    assert "Scenario A" in what_if_data["scenarios"]

    # 3. Save Simulation Run Log
    save_resp = client.post(
        "/api/v1/simulations/save",
        json={
            "scenario_name": "My Baseline Growth Model",
            "simulation_type": "wealth_accumulation",
            "input_parameters": {"current_amount": 10000, "years": 10},
            "result_json": res_data
        },
        cookies=logged_in_cookies
    )
    assert save_resp.status_code == 201
    sim_id = save_resp.json()["id"]

    # 4. List Saved Simulations
    list_resp = client.get("/api/v1/simulations", cookies=logged_in_cookies)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1
    assert list_resp.json()[0]["scenario_name"] == "My Baseline Growth Model"

    # 5. Fetch Specific Saved Simulation
    get_resp = client.get(f"/api/v1/simulations/{sim_id}", cookies=logged_in_cookies)
    assert get_resp.status_code == 200
    assert get_resp.json()["scenario_name"] == "My Baseline Growth Model"

    # 6. Delete Saved Simulation
    del_resp = client.delete(f"/api/v1/simulations/{sim_id}", cookies=logged_in_cookies)
    assert del_resp.status_code == 200

    # 7. Verify Deleted
    list_resp_after = client.get("/api/v1/simulations", cookies=logged_in_cookies)
    assert len(list_resp_after.json()) == 0
