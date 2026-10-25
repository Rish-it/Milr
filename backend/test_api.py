from fastapi.testclient import TestClient

from api import app

client = TestClient(app)


def test_day_returns_each_delivery_hour():
    assert len(client.get("/api/day/2026-01-11").json()) == 24


def test_day_outside_january_decisions_is_not_found():
    assert client.get("/api/day/2026-01-01").status_code == 404
