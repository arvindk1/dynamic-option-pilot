import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_get_metrics():
    response = client.get("/api/dashboard/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "account_balance" in data
    assert "total_pnl" in data
    assert "win_rate" in data

def test_get_positions():
    response = client.get("/api/positions/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
