import os
from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from models import database

# Use an in-memory SQLite database for testing
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
database.engine = test_engine
database.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
database.Base.metadata.create_all(bind=test_engine)

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

def test_get_metrics_no_data():
    response = client.get("/api/dashboard/metrics")
    assert response.status_code == 404

def test_get_metrics():
    # Insert a sample metric
    session = database.SessionLocal()
    session.add(
        database.PerformanceMetric(
            date=datetime.now(timezone.utc),
            total_pnl=1000.0,
            win_rate=75.0,
            sharpe_ratio=1.5,
            max_drawdown=5.0,
            total_trades=10,
            winning_trades=7,
        )
    )
    session.commit()
    session.close()

    response = client.get("/api/dashboard/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["total_pnl"] == 1000.0
    assert data["win_rate"] == 75.0
    assert "sharpe_ratio" in data

def test_get_positions():
    response = client.get("/api/positions/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_quote():
    response = client.get("/api/market/quote/SPX")
    assert response.status_code == 200
    data = response.json()
    assert "price" in data
