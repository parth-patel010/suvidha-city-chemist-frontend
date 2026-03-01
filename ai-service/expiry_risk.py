import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.preprocessing import MinMaxScaler


def predict_expiry_risk(batches):
    if not batches:
        return {"batches": [], "summary": {"high_risk": 0, "medium_risk": 0, "low_risk": 0}}

    df = pd.DataFrame(batches)

    required = ["batch_number", "expiry_date", "quantity_in_stock"]
    missing = [f for f in required if f not in df.columns]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    df["expiry_date"] = pd.to_datetime(df["expiry_date"], utc=True).dt.tz_localize(None)
    now = datetime.now()

    df["days_until_expiry"] = (df["expiry_date"] - now).dt.days
    df["quantity_in_stock"] = pd.to_numeric(df["quantity_in_stock"], errors="coerce").fillna(0)

    avg_daily_sales = pd.to_numeric(df.get("avg_daily_sales", pd.Series([0] * len(df))), errors="coerce").fillna(0)
    df["avg_daily_sales"] = avg_daily_sales

    df["days_of_stock"] = np.where(
        df["avg_daily_sales"] > 0,
        df["quantity_in_stock"] / df["avg_daily_sales"],
        9999,
    )

    df["stock_excess_ratio"] = np.where(
        df["days_until_expiry"] > 0,
        df["days_of_stock"] / df["days_until_expiry"],
        9999,
    )

    features = pd.DataFrame()
    features["expiry_urgency"] = np.where(df["days_until_expiry"] <= 0, 1.0,
        np.where(df["days_until_expiry"] <= 30, 0.9,
        np.where(df["days_until_expiry"] <= 60, 0.7,
        np.where(df["days_until_expiry"] <= 90, 0.5,
        np.where(df["days_until_expiry"] <= 180, 0.3, 0.1)))))

    features["stock_pressure"] = np.clip(df["stock_excess_ratio"] / 3.0, 0, 1)

    max_qty = df["quantity_in_stock"].max()
    features["quantity_factor"] = df["quantity_in_stock"] / max_qty if max_qty > 0 else 0

    features["turnover_risk"] = np.where(
        df["avg_daily_sales"] > 0,
        1 - np.clip(df["avg_daily_sales"] / df["quantity_in_stock"].clip(lower=1), 0, 1),
        0.8,
    )

    w_expiry = 0.45
    w_stock = 0.25
    w_qty = 0.15
    w_turnover = 0.15

    risk_score = (
        features["expiry_urgency"] * w_expiry
        + features["stock_pressure"] * w_stock
        + features["quantity_factor"] * w_qty
        + features["turnover_risk"] * w_turnover
    )

    risk_score = np.clip(risk_score, 0, 1)

    results = []
    high = medium = low = 0

    for i, row in df.iterrows():
        score = round(float(risk_score.iloc[i]), 3)

        if score >= 0.7:
            level = "HIGH"
            high += 1
        elif score >= 0.4:
            level = "MEDIUM"
            medium += 1
        else:
            level = "LOW"
            low += 1

        recommendations = []
        days_left = int(row["days_until_expiry"])

        if days_left <= 0:
            recommendations.append("EXPIRED — remove from shelves immediately")
        elif days_left <= 30:
            recommendations.append("Run clearance sale with maximum discount")
            recommendations.append("Contact nearby pharmacies for stock transfer")
        elif days_left <= 60:
            recommendations.append("Apply promotional discount (15-25%)")
            recommendations.append("Prioritize this batch in billing (FEFO)")
        elif days_left <= 90:
            recommendations.append("Monitor closely, place at front of shelf")

        if row["stock_excess_ratio"] > 2 and days_left > 0:
            recommendations.append("Stock is excessive relative to expiry — reduce reorder quantity")

        if not recommendations:
            recommendations.append("No immediate action required")

        results.append({
            "batch_number": row["batch_number"],
            "product_id": row.get("product_id"),
            "product_name": row.get("product_name", ""),
            "expiry_date": row["expiry_date"].strftime("%Y-%m-%d"),
            "days_until_expiry": days_left,
            "quantity_in_stock": int(row["quantity_in_stock"]),
            "risk_score": score,
            "risk_level": level,
            "recommendations": recommendations,
        })

    results.sort(key=lambda x: x["risk_score"], reverse=True)

    return {
        "batches": results,
        "summary": {
            "total_batches": len(results),
            "high_risk": high,
            "medium_risk": medium,
            "low_risk": low,
            "immediate_attention": [b for b in results if b["risk_level"] == "HIGH"],
        },
    }
