"""Pick the forecast a buyer could see at the day-ahead deadline and score it against actuals."""
import json
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

DATA = Path(__file__).parent / "data"
UK = "Europe/London"
# Forecast MW; the error grows with wind. Edges were chosen after viewing all of January, so the
# backtest is not fully out of sample. Fit them on a training window once more months are in scope.
BANDS = [0, 8000, 12000, 16000, float("inf")]
BAND_LABELS = ["<8 GW", "8-12 GW", "12-16 GW", "16+ GW"]
MIN_HISTORY_DAYS = 7
# Nord Pool N2EX GB day-ahead gate closure, UK time; EPEX's GB auction closes earlier, at 09:20.
DEADLINE = pd.Timedelta(hours=9, minutes=50)


def load(name):
    df = pd.DataFrame(json.loads((DATA / name).read_text()))
    for col in ("startTime", "publishTime"):
        if col in df:
            df[col] = pd.to_datetime(df[col], utc=True)
    return df


def latest_forecast(forecast, deadline=DEADLINE):
    """Per target hour, the newest forecast published before the deadline (UK time) on the day before delivery."""
    # Wall-clock arithmetic in UK time, so the deadline keeps its UK time across clock changes.
    delivery_day = forecast.startTime.dt.tz_convert(UK).dt.tz_localize(None).dt.normalize()
    cutoff = (delivery_day - pd.Timedelta(days=1) + deadline).dt.tz_localize(UK)
    visible = forecast[forecast.publishTime < cutoff.dt.tz_convert("UTC")]
    return visible.sort_values("publishTime").groupby("startTime").tail(1).sort_values("startTime")


def compare(forecast, actual):
    """Forecast next to actual per hour. Forecasts are hourly, so the merge keeps only on-the-hour actuals."""
    df = forecast.rename(columns={"generation": "forecast"}).merge(
        actual.rename(columns={"generation": "actual"}), on="startTime"
    )
    df["error"] = df.actual - df.forecast  # negative = wind came in below forecast
    local = df.startTime.dt.tz_convert(UK)
    df["day"] = local.dt.strftime("%Y-%m-%d")
    df["hour"] = local.dt.hour
    df["band"] = pd.cut(df.forecast, BANDS, right=False, labels=BAND_LABELS)
    return df


def accuracy(compared):
    error = compared.error
    return {
        "hours": len(error),
        "mae": round(error.abs().mean()),
        "rmse": round((error**2).mean() ** 0.5),
        "bias": round(error.mean()),
    }


def accuracy_by(compared, column):
    return [{column: key, **accuracy(group)} for key, group in compared.groupby(column, observed=True)]


def plan(compared, day, confidence):
    """The day's hours plus a `plan`: forecast adjusted by the error quantile of past hours at a similar wind level.

    Each wind band's quantile sits at the band's typical forecast, and the margin is interpolated between them,
    so the plan moves smoothly instead of jumping when the forecast crosses a band edge.

    Only days fully delivered by the decision (09:50 the day before) count as history,
    so the margin never learns from the outcome it is planning for.
    """
    today = compared[compared.day == day].copy()
    history = compared[compared.day <= str(date.fromisoformat(day) - timedelta(days=2))]
    if history.day.nunique() < MIN_HISTORY_DAYS:
        today["plan"] = None
        return today
    bands = history.groupby("band", observed=True).agg(
        level=("forecast", "median"), margin=("error", lambda error: error.quantile(1 - confidence))
    )
    today["plan"] = (today.forecast + np.interp(today.forecast, bands.level, bands.margin)).round()
    return today


def plan_month(compared, confidence):
    """Every day's hours with its plan, each day planned as it would have been at its own decision time."""
    return pd.concat(plan(compared, day, confidence) for day in compared.day.unique())


def backtest(compared, confidence):
    """Walk forward through the month: how often planning on the raw forecast vs the plan left wind short."""
    planned = plan_month(compared, confidence).dropna(subset=["plan"])
    result = {"hours": len(planned), "avg_margin_mw": round((planned.forecast - planned.plan).mean())}
    for basis in ("forecast", "plan"):
        result[basis] = {
            "covered": round((planned.actual >= planned[basis]).mean(), 2),
            "avg_shortfall_mw": round((planned[basis] - planned.actual).clip(lower=0).mean()),
        }
    return result
