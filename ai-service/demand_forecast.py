import pandas as pd
import numpy as np
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from datetime import datetime, timedelta


def predict_demand(sales_history, product_id=None, forecast_days=30):
    df = pd.DataFrame(sales_history)

    if "date" not in df.columns or "quantity" not in df.columns:
        raise ValueError("sales_history must contain 'date' and 'quantity' fields")

    df["date"] = pd.to_datetime(df["date"], utc=True).dt.tz_localize(None)
    df = df.sort_values("date")
    df = df.groupby("date")["quantity"].sum().reset_index()

    date_range = pd.date_range(start=df["date"].min(), end=df["date"].max(), freq="D")
    df = df.set_index("date").reindex(date_range, fill_value=0).rename_axis("date").reset_index()

    ts = df.set_index("date")["quantity"].astype(float)

    if len(ts) < 4:
        avg = ts.mean()
        forecast_dates = pd.date_range(
            start=ts.index[-1] + timedelta(days=1), periods=forecast_days, freq="D"
        )
        forecasted = [round(avg, 2)] * forecast_days
        return {
            "product_id": product_id,
            "method": "simple_average",
            "forecast": [
                {"date": d.strftime("%Y-%m-%d"), "predicted_quantity": q}
                for d, q in zip(forecast_dates, forecasted)
            ],
            "summary": {
                "avg_daily_demand": round(avg, 2),
                "total_forecast": round(avg * forecast_days, 2),
                "recommended_reorder_qty": int(np.ceil(avg * forecast_days * 1.2)),
            },
        }

    seasonal_periods = min(7, len(ts) // 2)
    use_seasonal = len(ts) >= seasonal_periods * 2

    try:
        if use_seasonal:
            model = ExponentialSmoothing(
                ts,
                trend="add",
                seasonal="add",
                seasonal_periods=seasonal_periods,
                initialization_method="estimated",
            )
        else:
            model = ExponentialSmoothing(
                ts, trend="add", seasonal=None, initialization_method="estimated"
            )

        fitted = model.fit(optimized=True)
        forecast = fitted.forecast(forecast_days)
        forecast = forecast.clip(lower=0)
    except Exception:
        alpha = 0.3
        smoothed = [ts.iloc[0]]
        for val in ts.iloc[1:]:
            smoothed.append(alpha * val + (1 - alpha) * smoothed[-1])
        last_val = smoothed[-1]
        forecast_dates = pd.date_range(
            start=ts.index[-1] + timedelta(days=1), periods=forecast_days, freq="D"
        )
        forecast = pd.Series([max(0, last_val)] * forecast_days, index=forecast_dates)

    forecast_list = [
        {
            "date": idx.strftime("%Y-%m-%d"),
            "predicted_quantity": round(max(0, val), 2),
        }
        for idx, val in forecast.items()
    ]

    avg_demand = float(forecast.mean())
    total = float(forecast.sum())

    trend_direction = "stable"
    if len(forecast) >= 7:
        first_week = forecast[:7].mean()
        last_week = forecast[-7:].mean()
        if last_week > first_week * 1.1:
            trend_direction = "increasing"
        elif last_week < first_week * 0.9:
            trend_direction = "decreasing"

    return {
        "product_id": product_id,
        "method": "holt_winters_exponential_smoothing",
        "forecast": forecast_list,
        "summary": {
            "avg_daily_demand": round(avg_demand, 2),
            "total_forecast": round(total, 2),
            "recommended_reorder_qty": int(np.ceil(total * 1.2)),
            "trend_direction": trend_direction,
            "confidence": "medium" if len(ts) >= 30 else "low",
        },
    }
