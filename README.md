# 🏥 Suvidha City Chemist - Pharmacy Management System

  A **production-grade** full-stack pharmacy management system with enterprise features including multi-branch support, GST-compliant billing, inventory management, WhatsApp automation, loyalty programs, and AI-powered analytics.

  ## ✨ Key Features

  ### 🏢 Multi-Branch Management
  - Centralized control across multiple pharmacy locations
  - Branch-specific inventory and sales tracking
  - Transfer stock between branches
  - Branch performance analytics

  ### 💰 GST-Compliant Billing
  - Automatic CGST/SGST/IGST calculation
  - Professional invoice generation
  - Digital and print bill formats
  - Complete tax compliance

  ### 📦 Advanced Inventory Management
  - Batch-level tracking with expiry dates
  - Automated reorder alerts
  - Low stock notifications
  - Location-based storage mapping
  - Stock transfer management

  ### 👥 Customer Loyalty Engine
  - **4-tier system**: Bronze, Silver, Gold, Platinum
  - Automatic points calculation
  - Tier-based discounts (2% - 12%)
  - Points multiplier system
  - Customer purchase history tracking

  ### 🛒 Online Order Portal
  - **Customer-facing web portal** for browsing products
  - Place orders online with delivery address
  - Order tracking and status updates
  - Admin dashboard to confirm and dispatch orders
  - Prescription upload support

  ### 📋 Purchase Order Management
  - Create and manage supplier purchase orders
  - Track order status (Draft, Sent, Received, Partial)
  - Automatic inventory update on receiving
  - Supplier payment tracking

  ### 📱 WhatsApp Automation
  - Bill receipt sharing via WhatsApp
  - Expiry date reminders
  - Promotional offers
  - Welcome messages for new customers
  - Template-based messaging system

  ### 🤖 AI-Powered Analytics
  - Demand forecasting using machine learning
  - Sales trend analysis
  - Inventory optimization recommendations
  - Customer behavior insights

  ### 🔐 Role-Based Access Control
  - **Admin**: Full system access
  - **Manager**: Branch management and reports
  - **Cashier**: Point of sale operations
  - Granular permission system

  ### 📊 Comprehensive Reporting
  - Daily/weekly/monthly sales reports
  - Inventory valuation
  - GST reports for compliance
  - Customer analytics
  - Top-selling products
  - Excel and PDF export

  ### 🔔 Real-Time Alerts
  - Expiring medicines (30/60/90 day alerts)
  - Low stock warnings
  - Out of stock notifications
  - Schedule H/H1 drug tracking

  ### 📝 Audit Trail
  - Complete activity logging
  - User action tracking
  - Data change history
  - IP address and timestamp logging

  ## 🛠 Technology Stack

  ### Frontend
  - **React 18** with TypeScript
  - **Tailwind CSS** for styling
  - **Shadcn UI** component library
  - **Wouter** for routing
  - **TanStack Query** for data fetching
  - **Recharts** for analytics visualization

  ### Backend
  - **Express.js** with TypeScript
  - **PostgreSQL** database
  - **Drizzle ORM** for type-safe queries
  - **JWT** authentication
  - **Bcrypt** for password hashing

  ### AI Microservice
  - **Python Flask** API
  - **Scikit-learn** for ML models
  - **Pandas** for data processing
  - **Statsmodels** for time series analysis

  ### Additional Services
  - **Twilio** for WhatsApp messaging
  - **PDFKit** for invoice generation
  - **ExcelJS** for report exports
  - **Node-cron** for scheduled tasks

  ## 🚀 Getting Started

  ### Prerequisites
  - Node.js 18+ installed
  - PostgreSQL database (provided by Replit)
  - Environment variables configured

  ### Installation

  1. **Install dependencies**:
  ```bash
  npm install
  ```

  2. **Setup database**:
  ```bash
  npm run db:setup
  ```

  This will:
  - Push the schema to PostgreSQL
  - Seed the database with sample data

  3. **Start the application**:
  ```bash
  npm run dev
  ```

  The application will be available at `http://localhost:5000`

  ### Demo Login Credentials

  **Admin Account**:
  - Username: `admin`
  - Password: `password123`

  **Manager Account**:
  - Username: `manager1`
  - Password: `password123`

  **Cashier Account**:
  - Username: `cashier1`
  - Password: `password123`

  ## 📊 Database Schema

  The system includes **25+ interconnected tables**:

  ### Core Tables
  - `branches` - Multi-branch locations
  - `users` - System users with roles
  - `roles` - Role-based permissions

  ### Inventory Management
  - `products` - Product master data
  - `inventory` - Stock with batch tracking
  - `categories` - Product categorization
  - `manufacturers` - Pharma companies
  - `suppliers` - Supplier information
  - `stock_movements` - Inventory transaction log

  ### Sales & Billing
  - `sales` - Bill/invoice records
  - `sale_items` - Line items with GST
  - `sales_returns` - Return management
  - `sales_return_items` - Return line items

  ### Customer Management
  - `customers` - Customer profiles
  - `customer_medical_history` - Health records
  - `loyalty_transactions` - Points activity
  - `loyalty_tiers` - Tier configuration

  ### Online Orders
  - `online_orders` - Customer web orders
  - `online_order_items` - Order line items

  ### Purchase Management
  - `purchase_orders` - PO from suppliers
  - `purchase_order_items` - PO line items

  ### Automation & Alerts
  - `whatsapp_templates` - Message templates
  - `whatsapp_messages` - Sent message log
  - `expiry_alerts` - Medicine expiry warnings
  - `stock_alerts` - Low stock notifications

  ### Analytics & Audit
  - `daily_summary` - Aggregated sales data
  - `audit_logs` - Complete audit trail

  ## 🏗 Project Structure

  ```
  ├── client/                 # React frontend
  │   ├── src/
  │   │   ├── components/    # Reusable UI components
  │   │   ├── pages/         # Page components
  │   │   ├── lib/           # Utilities and helpers
  │   │   └── App.tsx        # Main app component
  │   └── index.html
  │
  ├── server/                # Express backend
  │   ├── db.ts             # Database connection
  │   ├── routes.ts         # API endpoints
  │   ├── index.ts          # Server entry point
  │   └── vite.ts           # Vite dev server
  │
  ├── shared/               # Shared code
  │   └── schema.ts         # Database schema (Drizzle)
  │
  ├── seed.ts              # Database seeding script
  └── package.json
  ```

  ## 🔌 API Endpoints

  ### Authentication
  - `POST /api/auth/login` - User login
  - `POST /api/auth/register` - Create new user

  ### Dashboard
  - `GET /api/dashboard/stats` - Key metrics

  ### Products & Inventory
  - `GET /api/products` - List products
  - `POST /api/products` - Create product
  - `GET /api/inventory` - View inventory
  - `POST /api/inventory` - Add stock

  ### Sales
  - `GET /api/sales` - List sales
  - `POST /api/sales` - Create new sale
  - `GET /api/sales/:id` - Sale details

  ### Customers
  - `GET /api/customers` - List customers
  - `POST /api/customers` - Register customer
  - `GET /api/customers/:id` - Customer profile

  ### Online Orders
  - `GET /api/online-orders` - List orders
  - `POST /api/online-orders/:id/confirm` - Confirm order
  - `POST /api/online-orders/:id/dispatch` - Dispatch order

  ### Alerts
  - `GET /api/alerts/expiry` - Expiry alerts
  - `GET /api/alerts/stock` - Stock alerts

  ## 📱 Online Order Portal

  The system includes a **customer-facing online order module**:

  ### Features:
  - Browse products with search and filters
  - View product details and pricing
  - Add items to cart
  - Place orders with delivery address
  - Upload prescriptions for scheduled drugs
  - Track order status in real-time

  ### Admin Workflow:
  1. Customer places order → Status: **PENDING**
  2. Admin reviews and confirms → Status: **CONFIRMED**
  3. Staff prepares the order → Status: **READY**
  4. Admin dispatches → Status: **DISPATCHED**
  5. Delivery completed → Status: **DELIVERED**

  ## 🔧 Configuration

  ### Environment Variables

  Create a `.env` file with:

  ```env
  DATABASE_URL=postgresql://...
  SESSION_SECRET=your-secret-key
  TWILIO_ACCOUNT_SID=your-twilio-sid
  TWILIO_AUTH_TOKEN=your-twilio-token
  TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
  ```

  ### WhatsApp Setup (Optional)

  To enable WhatsApp automation:
  1. Create a Twilio account
  2. Enable WhatsApp messaging
  3. Add Twilio credentials to environment variables
  4. Configure message templates in the system

  ## 📈 Future Enhancements

  - Mobile app for customers (React Native)
  - Barcode scanning for products
  - Prescription image OCR
  - Integration with medical insurance
  - Video consultation with pharmacist
  - Home delivery tracking with GPS
  - Multi-currency support
  - Advanced analytics dashboard

  ## 🤝 Support

  For any issues or questions:
  - Email: support@suvidhachemist.com
  - Phone: +91-22-12345678

  ## 📄 License

  This is a proprietary pharmacy management system built for Suvidha City Chemist.

  ---

  **Built with ❤️ for better healthcare management**
  