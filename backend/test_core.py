import pandas as pd

from core import latest_forecast


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
