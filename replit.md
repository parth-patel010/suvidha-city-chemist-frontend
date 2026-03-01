# Suvidha Pharmacy Pro

## Overview
Production-grade full-stack pharmacy management system with multi-branch support, GST-compliant billing, batch-level inventory tracking, customer loyalty engine, online order portal, AI analytics microservice, and WhatsApp automation.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + Shadcn UI (port 5000)
- **Backend**: Express.js + TypeScript + Drizzle ORM (port 5000, same process via Vite middleware)
- **AI Service**: Python Flask microservice (port 8000) — scikit-learn, pandas, statsmodels
- **Database**: PostgreSQL via Drizzle ORM
- **WhatsApp**: Meta WhatsApp Cloud API via axios

## Workflows
- `Start application` — `npm run dev` (port 5000, webview)
- `AI Service` — `cd ai-service && python app.py` (port 8000, console)

## Key Files
- `shared/schema.ts` — 25+ Drizzle tables with full relations
- `server/routes.ts` — All API routes (auth, CRUD, WhatsApp, AI proxy)
- `server/index.ts` — Express server entry point
- `server/whatsapp.ts` — Meta WhatsApp Cloud API service
- `server/ai-client.ts` — HTTP client for Flask AI microservice
- `client/src/App.tsx` — React app with wouter routing and auth
- `client/src/components/Layout.tsx` — Sidebar + header layout
- `client/src/pages/` — 10+ pages (Dashboard, Products, Inventory, Sales, etc.)
- `ai-service/app.py` — Flask entry point with 4 AI endpoints
- `ai-service/demand_forecast.py` — Exponential smoothing demand forecasting
- `ai-service/expiry_risk.py` — Batch expiry risk scoring
- `ai-service/sales_trends.py` — Seasonal trend analysis with linear regression
- `ai-service/customer_segmentation.py` — RFM customer segmentation with K-Means
- `seed.ts` — Database seed script with demo data
- `migrations/db.sql` — Raw SQL migration

## Database
- PostgreSQL via `DATABASE_URL`
- Schema push: `npx drizzle-kit push`
- Seed: `npx tsx seed.ts`

## Auth
- JWT-based (stored in localStorage as `pharmacy_token`)
- Demo: admin/password123, manager1/password123, cashier1/password123

## AI Endpoints (Flask, port 8000)
- `POST /predict/demand` — demand forecasting
- `POST /predict/expiry-risk` — batch expiry risk scoring
- `POST /analyze/sales-trends` — seasonal trend analysis
- `POST /segment/customers` — RFM customer segmentation

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection
- `SESSION_SECRET` — JWT signing key
- `WHATSAPP_ACCESS_TOKEN` — Meta API bearer token
- `WHATSAPP_PHONE_NUMBER_ID` — Meta phone number ID
- `WHATSAPP_BUSINESS_ACCOUNT_ID` — Meta business account ID
