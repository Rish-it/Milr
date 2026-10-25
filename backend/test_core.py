import pandas as pd

from core import backtest, latest_forecast, plan


def forecasts_for(target, *published):
    return pd.DataFrame({
        "startTime": pd.Timestamp(target),
        "publishTime": pd.to_datetime(list(published)),
        "generation": range(len(published)),
    })


def test_never_uses_a_forecast_published_after_the_cutoff():
    # Delivery 11 Jan 10:00; cutoff is 10 Jan 11:00 UK, so the 11:30 batch is off limits.
    f = forecasts_for("2026-01-11T10:00Z", "2026-01-10T07:30Z", "2026-01-10T09:30Z", "2026-01-10T11:30Z")
    assert latest_forecast(f).publishTime.tolist() == [pd.Timestamp("2026-01-10T09:30Z")]


def test_cutoff_follows_uk_clock_in_summer():
    # In BST the 11:00 cutoff is 10:00 UTC, so a 10:30 UTC batch is too late.
    f = forecasts_for("2026-07-11T09:00Z", "2026-07-10T09:30Z", "2026-07-10T10:30Z")
    assert latest_forecast(f).publishTime.tolist() == [pd.Timestamp("2026-07-10T09:30Z")]


def one_hour_per_day(errors, forecast=10_000):
    return pd.DataFrame({
        "day": [f"2026-01-{d:02}" for d in range(1, len(errors) + 1)],
        "band": "16+ GW",
        "forecast": forecast,
        "actual": [forecast + e for e in errors],
        "error": errors,
    })


def test_plan_margin_ignores_days_not_finished_by_decision_time():
    # Decision for 10 Jan is made at 11:00 on 9 Jan, so 9 and 10 Jan outcomes are unknown.
    compared = one_hour_per_day([-100] * 8 + [-9_999, -9_999])
    assert plan(compared, "2026-01-10", confidence=0.9).plan.tolist() == [9_900]


def test_backtest_scores_only_days_with_enough_history():
    # Wind always lands 100 MW under forecast; only 9 and 10 Jan have 7 finished days behind them.
    assert backtest(one_hour_per_day([-100] * 10), confidence=0.9) == {
        "hours": 2,
        "avg_margin_mw": 100,
        "forecast": {"covered": 0.0, "avg_shortfall_mw": 100},
        "plan": {"covered": 1.0, "avg_shortfall_mw": 0},
    }
