import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime


def analyze_sales_trends(sales_data, period="monthly"):
    df = pd.DataFrame(sales_data)

    if "date" not in df.columns or "amount" not in df.columns:
        raise ValueError("sales_data must contain 'date' and 'amount' fields")

    df["date"] = pd.to_datetime(df["date"], utc=True).dt.tz_localize(None)
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)
    df = df.sort_values("date")

    if "quantity" in df.columns:
        df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(0)

    freq_map = {"daily": "D", "weekly": "W", "monthly": "M", "quarterly": "Q"}
    freq = freq_map.get(period, "M")

    grouped = df.set_index("date").resample(freq).agg(
        total_amount=("amount", "sum"),
        transaction_count=("amount", "count"),
        avg_transaction=("amount", "mean"),
    ).reset_index()

    if "quantity" in df.columns:
        qty_grouped = df.set_index("date").resample(freq)["quantity"].sum().reset_index()
        grouped = grouped.merge(qty_grouped, on="date", how="left")

    periods_data = []
    for _, row in grouped.iterrows():
        entry = {
            "period": row["date"].strftime("%Y-%m-%d"),
            "total_amount": round(float(row["total_amount"]), 2),
            "transaction_count": int(row["transaction_count"]),
            "avg_transaction": round(float(row["avg_transaction"]), 2),
        }
        if "quantity" in grouped.columns:
            entry["total_quantity"] = int(row["quantity"])
        periods_data.append(entry)

    X = np.arange(len(grouped)).reshape(-1, 1)
    y = grouped["total_amount"].values

    trend_direction = "stable"
    trend_slope = 0.0
    growth_rate = 0.0

    if len(X) >= 2:
        reg = LinearRegression().fit(X, y)
        trend_slope = float(reg.coef_[0])

        if y[0] > 0:
            growth_rate = ((y[-1] - y[0]) / y[0]) * 100
        
        threshold = np.mean(y) * 0.05
        if trend_slope > threshold:
            trend_direction = "increasing"
        elif trend_slope < -threshold:
            trend_direction = "decreasing"

    seasonal_pattern = None
    if period == "monthly" and len(grouped) >= 12:
        grouped["month"] = grouped["date"].dt.month
        monthly_avg = grouped.groupby("month")["total_amount"].mean()
        overall_avg = monthly_avg.mean()

        if overall_avg > 0:
            seasonal_indices = (monthly_avg / overall_avg).to_dict()
            peak_month = int(monthly_avg.idxmax())
            low_month = int(monthly_avg.idxmin())

            month_names = {
                1: "January", 2: "February", 3: "March", 4: "April",
                5: "May", 6: "June", 7: "July", 8: "August",
                9: "September", 10: "October", 11: "November", 12: "December",
            }

            seasonal_pattern = {
                "seasonal_indices": {month_names.get(k, str(k)): round(v, 3) for k, v in seasonal_indices.items()},
                "peak_month": month_names.get(peak_month, str(peak_month)),
                "low_month": month_names.get(low_month, str(low_month)),
                "seasonality_strength": round(float(monthly_avg.std() / overall_avg), 3),
            }

    if "category" in df.columns:
        category_perf = (
            df.groupby("category")
            .agg(total_amount=("amount", "sum"), count=("amount", "count"))
            .sort_values("total_amount", ascending=False)
            .head(10)
        )
        top_categories = [
            {
                "category": cat,
                "total_amount": round(float(row["total_amount"]), 2),
                "transaction_count": int(row["count"]),
            }
            for cat, row in category_perf.iterrows()
        ]
    else:
        top_categories = None

    if "product_name" in df.columns:
        product_perf = (
            df.groupby("product_name")
            .agg(total_amount=("amount", "sum"), count=("amount", "count"))
            .sort_values("total_amount", ascending=False)
            .head(10)
        )
        top_products = [
            {
                "product_name": name,
                "total_amount": round(float(row["total_amount"]), 2),
                "transaction_count": int(row["count"]),
            }
            for name, row in product_perf.iterrows()
        ]
    else:
        top_products = None

    amounts = grouped["total_amount"]
    result = {
        "period_type": period,
        "periods": periods_data,
        "trend": {
            "direction": trend_direction,
            "slope": round(trend_slope, 2),
            "growth_rate_pct": round(growth_rate, 2),
        },
        "summary": {
            "total_revenue": round(float(amounts.sum()), 2),
            "avg_per_period": round(float(amounts.mean()), 2),
            "max_period_revenue": round(float(amounts.max()), 2),
            "min_period_revenue": round(float(amounts.min()), 2),
            "std_deviation": round(float(amounts.std()), 2) if len(amounts) > 1 else 0,
            "total_transactions": int(grouped["transaction_count"].sum()),
        },
    }

    if seasonal_pattern:
        result["seasonal_pattern"] = seasonal_pattern
    if top_categories:
        result["top_categories"] = top_categories
    if top_products:
        result["top_products"] = top_products

    return result
