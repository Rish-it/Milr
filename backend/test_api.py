from fastapi.testclient import TestClient

from api import app

client = TestClient(app)


def test_day_returns_each_delivery_hour():
    assert len(client.get("/api/day/2026-01-11").json()) == 24


def test_day_outside_january_decisions_is_not_found():
    assert client.get("/api/day/2026-01-01").status_code == 404


def test_hours_list_every_delivery_hour_once():
    hours = client.get("/api/hours").json()
    assert len({(h["day"], h["hour"]) for h in hours}) == len(hours) == 31 * 24


def test_days_average_each_delivery_day_with_no_plan_in_the_first_week():
    days = client.get("/api/days?confidence=0.9").json()
    assert len(days) == 31
    assert days[0]["plan"] is None and days[-1]["plan"] < days[-1]["forecast"]
