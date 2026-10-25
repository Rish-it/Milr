"""Pick the forecast a buyer could see at the day-ahead deadline and score it against actuals."""
import json
from pathlib import Path

import pandas as pd

DATA = Path(__file__).parent / "data"
UK = "Europe/London"


def load(name):
    df = pd.DataFrame(json.loads((DATA / name).read_text()))
    for col in ("startTime", "publishTime"):
        if col in df:
            df[col] = pd.to_datetime(df[col], utc=True)
    return df


def latest_forecast(forecast, cutoff_hour=11):
    """Per target hour, the newest forecast published before cutoff_hour (UK time) on the day before delivery."""
    # Wall-clock arithmetic in UK time, so the cutoff stays at 11:00 across clock changes.
    delivery_day = forecast.startTime.dt.tz_convert(UK).dt.tz_localize(None).dt.normalize()
    cutoff = (delivery_day - pd.Timedelta(days=1) + pd.Timedelta(hours=cutoff_hour)).dt.tz_localize(UK)
    visible = forecast[forecast.publishTime < cutoff.dt.tz_convert("UTC")]
    return visible.sort_values("publishTime").groupby("startTime").tail(1).sort_values("startTime")


def compare(forecast, actual):
    """Forecast next to actual per hour. Forecasts are hourly, so the merge keeps only on-the-hour actuals."""
    df = forecast.rename(columns={"generation": "forecast"}).merge(
        actual.rename(columns={"generation": "actual"}), on="startTime"
    )
    df["error"] = df.actual - df.forecast  # negative = forecast too high, buyer under-bought
    return df


def accuracy(compared):
    error = compared.error
    return {
        "hours": len(error),
        "mae": error.abs().mean(),
        "rmse": (error**2).mean() ** 0.5,
        "bias": error.mean(),
    }
