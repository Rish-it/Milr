"""Download the wind data from Elexon BMRS once and cache it in data/.

Scope: purchase decisions made in January 2026. Each decision is for the next
day, so the delivery days are 2 Jan - 1 Feb 2026.
"""
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

API = "https://data.elexon.co.uk/bmrs/api/v1/datasets"
DATA = Path(__file__).parent / "data"
DELIVERY_FROM, DELIVERY_TO = "2026-01-02T00:00:00Z", "2026-02-02T00:00:00Z"


def get(dataset, **params):
    with urlopen(f"{API}/{dataset}/stream?{urlencode(params)}", timeout=120) as response:
        return json.load(response)


def save(name, rows, fields):
    DATA.mkdir(exist_ok=True)
    (DATA / name).write_text(json.dumps([{f: row[f] for f in fields} for row in rows]))
    print(f"{name}: {len(rows)} rows")


if __name__ == "__main__":
    actual = get("FUELHH", fuelType="WIND", settlementDateFrom="2026-01-02", settlementDateTo="2026-02-01")
    save("actual.json", actual, ["startTime", "generation"])

    # Starts on 31 Dec in case a gap leaves the 1 Jan decision relying on an older forecast.
    forecast = get("WINDFOR", publishDateTimeFrom="2025-12-31T00:00:00Z", publishDateTimeTo="2026-01-31T11:00:00Z")
    in_scope = [row for row in forecast if DELIVERY_FROM <= row["startTime"] < DELIVERY_TO]
    save("forecast.json", in_scope, ["startTime", "publishTime", "generation"])
