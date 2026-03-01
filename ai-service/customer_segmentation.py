import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from datetime import datetime


def segment_customers(customers):
    if not customers:
        return {"segments": [], "summary": {}}

    df = pd.DataFrame(customers)

    required = ["customer_id", "customer_name"]
    missing = [f for f in required if f not in df.columns]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    now = datetime.now()

    if "last_purchase_date" in df.columns:
        df["last_purchase_date"] = pd.to_datetime(df["last_purchase_date"], utc=True, errors="coerce").dt.tz_localize(None)
        df["recency_days"] = (now - df["last_purchase_date"]).dt.days.fillna(365)
    else:
        df["recency_days"] = 180

    df["frequency"] = pd.to_numeric(df.get("purchase_count", pd.Series([1] * len(df))), errors="coerce").fillna(1)
    df["monetary"] = pd.to_numeric(df.get("total_purchases", pd.Series([0] * len(df))), errors="coerce").fillna(0)

    if len(df) < 4:
        results = []
        for _, row in df.iterrows():
            r = row["recency_days"]
            f = row["frequency"]
            m = row["monetary"]

            if r <= 30 and f >= 5 and m >= 5000:
                segment = "Champions"
            elif r <= 60 and f >= 3:
                segment = "Loyal"
            elif r <= 90:
                segment = "Potential"
            elif r <= 180:
                segment = "At Risk"
            else:
                segment = "Lost"

            results.append({
                "customer_id": row["customer_id"],
                "customer_name": row["customer_name"],
                "rfm_scores": {
                    "recency_days": int(r),
                    "frequency": int(f),
                    "monetary": round(float(m), 2),
                },
                "segment": segment,
                "recommendations": _get_recommendations(segment),
            })

        segment_counts = {}
        for r in results:
            seg = r["segment"]
            segment_counts[seg] = segment_counts.get(seg, 0) + 1

        return {
            "method": "rule_based",
            "customers": results,
            "summary": {
                "total_customers": len(results),
                "segments": segment_counts,
            },
        }

    rfm = df[["recency_days", "frequency", "monetary"]].copy()
    rfm["recency_days"] = rfm["recency_days"].clip(lower=0)

    scaler = StandardScaler()
    rfm_scaled = scaler.fit_transform(rfm)
    rfm_scaled[:, 0] = -rfm_scaled[:, 0]

    n_clusters = min(5, len(df))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    df["cluster"] = kmeans.fit_predict(rfm_scaled)

    cluster_profiles = df.groupby("cluster").agg(
        avg_recency=("recency_days", "mean"),
        avg_frequency=("frequency", "mean"),
        avg_monetary=("monetary", "mean"),
        count=("customer_id", "count"),
    )

    cluster_labels = {}
    for cluster_id, profile in cluster_profiles.iterrows():
        r = profile["avg_recency"]
        f = profile["avg_frequency"]
        m = profile["avg_monetary"]

        if r <= 30 and f >= cluster_profiles["avg_frequency"].quantile(0.75):
            label = "Champions"
        elif r <= 60 and f >= cluster_profiles["avg_frequency"].median():
            label = "Loyal"
        elif r <= 90:
            label = "Potential"
        elif r <= 180:
            label = "At Risk"
        else:
            label = "Lost"

        cluster_labels[cluster_id] = label

    used_labels = set()
    for cid in sorted(cluster_labels, key=lambda x: cluster_profiles.loc[x, "avg_monetary"], reverse=True):
        label = cluster_labels[cid]
        if label in used_labels:
            alternatives = ["Champions", "Loyal", "Potential", "At Risk", "Lost"]
            for alt in alternatives:
                if alt not in used_labels:
                    cluster_labels[cid] = alt
                    break
        used_labels.add(cluster_labels[cid])

    results = []
    for _, row in df.iterrows():
        cluster = row["cluster"]
        segment = cluster_labels.get(cluster, "Unknown")

        results.append({
            "customer_id": row["customer_id"],
            "customer_name": row["customer_name"],
            "rfm_scores": {
                "recency_days": int(row["recency_days"]),
                "frequency": int(row["frequency"]),
                "monetary": round(float(row["monetary"]), 2),
            },
            "segment": segment,
            "cluster": int(cluster),
            "recommendations": _get_recommendations(segment),
        })

    segment_counts = {}
    for r in results:
        seg = r["segment"]
        segment_counts[seg] = segment_counts.get(seg, 0) + 1

    return {
        "method": "kmeans_rfm",
        "customers": results,
        "summary": {
            "total_customers": len(results),
            "n_clusters": n_clusters,
            "segments": segment_counts,
            "cluster_profiles": [
                {
                    "cluster": int(cid),
                    "label": cluster_labels.get(cid, "Unknown"),
                    "avg_recency_days": round(float(p["avg_recency"]), 1),
                    "avg_frequency": round(float(p["avg_frequency"]), 1),
                    "avg_monetary": round(float(p["avg_monetary"]), 2),
                    "customer_count": int(p["count"]),
                }
                for cid, p in cluster_profiles.iterrows()
            ],
        },
    }


def _get_recommendations(segment):
    recs = {
        "Champions": [
            "Offer exclusive Platinum-tier benefits",
            "Early access to new products",
            "Personalized health tips via WhatsApp",
            "Referral program with bonus points",
        ],
        "Loyal": [
            "Upgrade loyalty tier with bonus points",
            "Send monthly health newsletters",
            "Offer bundled product discounts",
            "Invite to health check-up camps",
        ],
        "Potential": [
            "Send welcome-back offer (10% discount)",
            "Share popular product recommendations",
            "Offer free delivery on next order",
            "WhatsApp reminder for medicine refills",
        ],
        "At Risk": [
            "Send re-engagement campaign with 15% discount",
            "WhatsApp message about new services",
            "Offer loyalty points bonus for next purchase",
            "Survey to understand why they stopped visiting",
        ],
        "Lost": [
            "Win-back campaign with 20% discount",
            "Share seasonal health awareness content",
            "Offer free health consultation",
            "Remove from active campaigns if no response in 30 days",
        ],
    }
    return recs.get(segment, ["Continue monitoring customer activity"])
