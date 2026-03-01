import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

async function callAI(endpoint: string, data: any) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}${endpoint}`, data, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.code === "ECONNREFUSED") {
      return { success: false, error: "AI service is not running. Start it with: python ai-service/app.py" };
    }
    return {
      success: false,
      error: error.response?.data?.error || error.message || "AI service error",
    };
  }
}

export async function predictDemand(salesHistory: any[], productId?: number, forecastDays?: number) {
  return callAI("/predict/demand", {
    sales_history: salesHistory,
    product_id: productId,
    forecast_days: forecastDays || 30,
  });
}

export async function predictExpiryRisk(batches: any[]) {
  return callAI("/predict/expiry-risk", { batches });
}

export async function analyzeSalesTrends(salesData: any[], period?: string) {
  return callAI("/analyze/sales-trends", {
    sales_data: salesData,
    period: period || "monthly",
  });
}

export async function segmentCustomers(customers: any[]) {
  return callAI("/segment/customers", { customers });
}

export async function checkAIHealth() {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
    return { available: true, ...response.data };
  } catch {
    return { available: false, error: "AI service is not reachable" };
  }
}

export const aiClient = {
  predictDemand,
  predictExpiryRisk,
  analyzeSalesTrends,
  segmentCustomers,
  checkAIHealth,
};
