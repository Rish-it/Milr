# Day-ahead wind

A decision-support dashboard for a UK utility's day-ahead power buyers. It shows the national wind forecast they could actually see before the day-ahead deadline, and how far that forecast can be trusted.

**Live app:** https://milr-sigma.vercel.app

## What it answers

Buyers order tomorrow's power by about 11:00 UK today, so they rely on the wind forecast available at that moment. For every delivery hour of the period:

1. **Which forecast did they see?** The newest Elexon `WINDFOR` forecast published before 11:00 UK on the day before delivery. Anything published later is excluded.
2. **How good was it?** That forecast is compared with Elexon `FUELHH` wind actuals and scored with MAE, RMSE and bias, overall, by wind level and by hour (hour of day doubles as forecast horizon, 14.5 to 37.5 hours ahead).
3. **How much wind should they plan on?** A plan equal to the forecast minus a safety margin, learned from past errors at a similar wind level, for a confidence the buyer picks.

Scope follows the brief: purchase decisions made in January 2026, so delivery days 2 January to 1 February 2026 (744 hours), Elexon wind data only.

## Findings (January 2026)

- Typical miss (MAE) 1,996 MW; RMSE 2,499 MW.
- The forecast ran high: wind came in on average 1,728 MW below it, and below it in 84% of hours.
- The gap grows with wind: 335 MW below forecast when the forecast was under 8 GW, 2,890 MW above 16 GW. It persists even for forecasts made 1 to 2 hours ahead, so it looks like a difference in what the two datasets measure rather than poor forecasting. Curtailment of wind farms on windy days is the likely cause; the brief's data cannot prove it.
- Replayed day by day, a plan at 90% confidence was met by the wind in 85% of hours, against 16% for the raw forecast. The average shortfall below the plan was 249 MW, against 1,980 MW below the raw forecast.

## Run it

**Docker (whole app, one container):**

```sh
docker build -t milr .
docker run --rm -p 8000:8000 milr
# open http://localhost:8000
```

**Development:**

```sh
# API on :8000
cd backend
python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn api:app --reload

# UI on :5173, proxying /api to :8000
cd frontend
npm ci
npm run dev
```

**Tests:**

```sh
cd backend && .venv/bin/python -m pytest -q    # selection rule, clock changes, walk-forward plan, API
cd frontend && npm test && npm run lint && npm run build
```

**Refresh the data** (already cached in `backend/data/`, so the app never calls Elexon at runtime):

```sh
cd backend && .venv/bin/python fetch.py
```

## Repository layout

```
backend/
  fetch.py           Downloads FUELHH (wind) and WINDFOR once from the Elexon BMRS API into data/
  data/              Cached January 2026 actuals and forecasts (JSON)
  core.py            All analysis: forecast selection, comparison, accuracy, plan, backtest
  api.py             FastAPI endpoints over core.py; serves the built UI from static/ when present
  index.py           Vercel entry point (re-exports api.app)
  vercel.json        Vercel build: compiles the frontend into backend/static
  requirements.txt   Pinned Python dependencies
  test_core.py       Tests for selection, the UK-clock cutoff, the walk-forward plan and the backtest
  test_api.py        API tests
frontend/
  src/App.jsx        Layout, delivery-day picker, confidence slider, view switcher
  src/DayChart.jsx   Hourly forecast, actual and plan for one delivery day
  src/Kpis.jsx       Month accuracy and plan coverage
  src/PlanBars.jsx   Daily plan vs safety margin vs actual
  src/Heatmap.jsx    Forecast error for every delivery hour of the month
  src/api.js         Data fetching (one shared request per path) and error messages
  src/theme.js       Borderless grey theme for light and dark, chart colours
  src/format.js      Number and wording helpers
Dockerfile           Builds the frontend, then runs it with the API in one image
.vercelignore        Keeps local environments and build output out of deploy uploads
```

## API

| Endpoint | Returns |
|---|---|
| `GET /api/summary` | Delivery days, overall accuracy, accuracy by wind band and by hour |
| `GET /api/day/{YYYY-MM-DD}?confidence=0.9` | 24 hours of forecast, publish time, actual, error and plan |
| `GET /api/days?confidence=0.9` | Each day's average forecast, plan and actual |
| `GET /api/hours` | Forecast, actual and error for every delivery hour |
| `GET /api/backtest?confidence=0.9` | Walk-forward coverage and shortfall: raw forecast vs plan |

`confidence` must be between 0.5 and 0.99.

## Method and assumptions

- **Deadline:** 11:00 UK time on the day before delivery, computed on the UK wall clock so it stays right across clock changes (tested for summer time). It is a parameter in `core.latest_forecast`.
- **Time resolution:** forecasts are hourly and actuals half-hourly, so forecasts are matched to the on-the-hour actual. Averaging the two half-hours instead changes MAE by under 2%.
- **Error sign:** `error = actual - forecast`; negative means wind came in below forecast.
- **Plan:** for each wind band (under 8, 8 to 12, 12 to 16, over 16 GW of forecast), the margin is the error quantile matching the chosen confidence, placed at the band's typical forecast and interpolated between bands so it changes smoothly with wind.
- **No look-ahead:** the plan for a delivery day learns only from days fully delivered by its decision time (two days earlier or more), and needs 7 such days, so the first week has no plan.
- **Limitations:** the band edges were chosen after viewing the whole month, so the backtest is not fully out of sample. One month of data is a small sample for margins, especially early in the month.

## Deployment

The live app runs on Vercel as one FastAPI function, with the built frontend served from Vercel's CDN. The Vercel project's root directory is `backend/`; deploy from the repository root with `npx vercel deploy --prod`. The same app runs anywhere containers run via the `Dockerfile`.

## Use of AI tools

AI coding assistants were used throughout: Claude Code for implementation, data checks, testing and review, and ChatGPT for explanations of the domain and the analysis. Every result in this README was checked against the data, and all code is covered by the tests above.
