def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "name": "Test User",
            "password": "strongpassword123",
            "phone": "+919999999999",
            "date_of_birth": "1990-01-01",
            "address": "Mumbai, India"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert "id" in data
    assert "password_hash" not in data

def test_register_duplicate_email(client):
    user_data = {
        "email": "duplicate@example.com",
        "name": "First User",
        "password": "password123"
    }
    # First registration
    client.post("/api/v1/auth/register", json=user_data)
    # Second registration
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "USER_EXISTS"

def test_login_success(client):
    # Register user
    client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "name": "Login User", "password": "password123"}
    )
    
    # Attempt login
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies
    assert response.json()["email"] == "login@example.com"

def test_login_invalid_credentials(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "wrong@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTH_FAILED"

def test_logout(client):
    # Register & Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "logout@example.com", "name": "Logout User", "password": "password123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "logout@example.com", "password": "password123"}
    )
    
    # Call logout
    response = client.post("/api/v1/auth/logout", cookies=login_resp.cookies)
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"

def test_refresh_token(client):
    # Register & Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "refresh@example.com", "name": "Refresh User", "password": "password123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "refresh@example.com", "password": "password123"}
    )
    
    # Call refresh
    response = client.post("/api/v1/auth/refresh", cookies=login_resp.cookies)
    assert response.status_code == 200
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies
