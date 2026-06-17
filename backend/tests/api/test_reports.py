def test_reports_generation(client):
    # 1. Register and Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "reporttest@example.com", "name": "Report User", "password": "password123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "reporttest@example.com", "password": "password123"}
    )
    cookies = login_resp.cookies

    # 2. Add an advice card to avoid empty pdf warning or similar if generated
    client.post("/api/v1/recommendations/generate", cookies=cookies)

    # 3. Retrieve PDF Report
    pdf_resp = client.get("/api/v1/reports/pdf", cookies=cookies)
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert "attachment" in pdf_resp.headers["content-disposition"]
    assert len(pdf_resp.content) > 0

    # 4. Retrieve CSV Report
    csv_resp = client.get("/api/v1/reports/csv", cookies=cookies)
    assert csv_resp.status_code == 200
    assert csv_resp.headers["content-type"] == "text/csv; charset=utf-8"
    assert "attachment" in csv_resp.headers["content-disposition"]
    assert len(csv_resp.content) > 0
