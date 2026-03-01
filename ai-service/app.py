from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from demand_forecast import predict_demand
from expiry_risk import predict_expiry_risk
from sales_trends import analyze_sales_trends
from customer_segmentation import segment_customers

app = Flask(__name__)
CORS(app)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "Suvidha Pharmacy AI Microservice"})


@app.route("/predict/demand", methods=["POST"])
def demand_forecast():
    try:
        data = request.get_json()
        if not data or "sales_history" not in data:
            return jsonify({"error": "sales_history is required"}), 400

        result = predict_demand(
            sales_history=data["sales_history"],
            product_id=data.get("product_id"),
            forecast_days=data.get("forecast_days", 30),
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict/expiry-risk", methods=["POST"])
def expiry_risk():
    try:
        data = request.get_json()
        if not data or "batches" not in data:
            return jsonify({"error": "batches array is required"}), 400

        result = predict_expiry_risk(batches=data["batches"])
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/analyze/sales-trends", methods=["POST"])
def sales_trends():
    try:
        data = request.get_json()
        if not data or "sales_data" not in data:
            return jsonify({"error": "sales_data is required"}), 400

        result = analyze_sales_trends(
            sales_data=data["sales_data"],
            period=data.get("period", "monthly"),
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/segment/customers", methods=["POST"])
def customer_segmentation():
    try:
        data = request.get_json()
        if not data or "customers" not in data:
            return jsonify({"error": "customers array is required"}), 400

        result = segment_customers(customers=data["customers"])
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
