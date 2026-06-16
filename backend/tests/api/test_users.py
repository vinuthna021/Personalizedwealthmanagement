def test_get_me(client):
    # Register & Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "profile@example.com", "name": "Profile User", "password": "password123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "profile@example.com", "password": "password123"}
    )
    
    # Get profile
    response = client.get("/api/v1/users/me", cookies=login_resp.cookies)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "profile@example.com"
    assert data["risk_profile"] == "moderate"
    assert data["kyc_status"] == "unverified"

def test_update_profile(client):
    # Register & Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "update@example.com", "name": "Update User", "password": "password123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "update@example.com", "password": "password123"}
    )
    
    # Update profile
    response = client.put(
        "/api/v1/users/me",
        json={
            "name": "New Name",
            "phone": "+911234567890",
            "address": "Delhi, India"
        },
        cookies=login_resp.cookies
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert data["phone"] == "+911234567890"
    assert data["address"] == "Delhi, India"

def test_update_risk_profile(client):
    # Register & Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "risk@example.com", "name": "Risk User", "password": "password123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "risk@example.com", "password": "password123"}
    )
    
    # Update risk
    response = client.put(
        "/api/v1/users/me/risk",
        json={"risk_profile": "aggressive"},
        cookies=login_resp.cookies
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_profile"] == "aggressive"

def test_kyc_flow(client):
    # Register & Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "kyc@example.com", "name": "KYC User", "password": "password123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "kyc@example.com", "password": "password123"}
    )
    
    # Get initial KYC
    response = client.get("/api/v1/users/me/kyc", cookies=login_resp.cookies)
    assert response.status_code == 200
    assert response.json()["kyc_status"] == "unverified"
    
    # Trigger KYC mock verification
    verify_resp = client.post("/api/v1/users/me/kyc/verify", cookies=login_resp.cookies)
    assert verify_resp.status_code == 200
    assert verify_resp.json()["kyc_status"] == "verified"
