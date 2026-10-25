"""HTTP API over core: what the buyer saw for each delivery day, and how far to trust it."""
import json

from fastapi import FastAPI, HTTPException, Query

import core

app = FastAPI(title="Wind forecast decision support")
COMPARED = core.compare(core.latest_forecast(core.load("forecast.json")), core.load("actual.json"))
DAYS = sorted(COMPARED.day.unique())
Confidence = Query(0.9, ge=0.5, le=0.99)


@app.get("/api/summary")
def summary():
    return {
        "days": DAYS,
        "accuracy": core.accuracy(COMPARED),
        "by_wind_band": core.accuracy_by(COMPARED, "band"),
        "by_hour": core.accuracy_by(COMPARED, "hour"),
    }


@app.get("/api/day/{day}")
def day(day: str, confidence: float = Confidence):
    if day not in DAYS:
        raise HTTPException(404, f"No data for {day}; available {DAYS[0]} to {DAYS[-1]}")
    hours = core.plan(COMPARED, day, confidence)
    columns = ["startTime", "publishTime", "forecast", "actual", "error", "plan"]
    return json.loads(hours[columns].to_json(orient="records", date_format="iso"))


@app.get("/api/backtest")
def backtest(confidence: float = Confidence):
    return core.backtest(COMPARED, confidence)
