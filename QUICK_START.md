# 🚀 Quick Start Guide - Suvidha Pharmacy Pro

  ## Setup (One-Time)

  ```bash
  npm run db:setup
  ```

  This will:
  1. Create all database tables (25+ tables)
  2. Seed sample data (products, customers, branches, etc.)

  ## Running the Application

  ```bash
  npm run dev
  ```

  Access the system at: **http://localhost:5000**

  ## Demo Logins

  | Role | Username | Password | Access Level |
  |------|----------|----------|-------------|
  | Admin | admin | password123 | Full system access |
  | Manager | manager1 | password123 | Branch management |
  | Cashier | cashier1 | password123 | POS operations only |

  ## Sample Data Included

  ### 🏢 Branches
  - Main Branch (Mumbai, MG Road)
  - Andheri Branch (Mumbai, SV Road)

  ### 💊 Products (5 medicines)
  1. **Crocin 650mg** - Paracetamol (Pain Relief)
  2. **Moxikind-CV 625** - Antibiotic (Prescription Required)
  3. **Uprise-D3 60K** - Vitamin D3
  4. **Glycomet GP1** - Diabetes medication
  5. **Benadryl Syrup** - Cough & Cold

  ### 👥 Customers (2 sample)
  - Ramesh Verma (Bronze tier, 150 points)
  - Priya Desai (Silver tier, 820 points)

  ### 📦 Inventory
  - Full stock for all 5 products at Main Branch
  - Batch numbers, expiry dates, GST rates configured

  ## Key Features to Test

  ### 1. Dashboard
  - View today's sales
  - Check low stock alerts
  - Monitor expiring items
  - See pending online orders

  ### 2. Products Management
  - Browse product catalog
  - Search by name/code/generic
  - View Schedule H indicators
  - See manufacturer details

  ### 3. Inventory Control
  - Track stock levels by batch
  - View expiry dates
  - Check reorder levels
  - Monitor storage locations

  ### 4. Sales & Billing
  - Create new sales
  - GST-compliant invoicing
  - CGST/SGST/IGST calculation
  - Loyalty points integration

  ### 5. Customer Management
  - Customer registration
  - Loyalty tier tracking (Bronze → Platinum)
  - Points balance
  - Purchase history

  ### 6. 🛒 Online Orders Portal
  **This is a key feature!**
  - Customers can browse and order online
  - Admin confirms orders
  - Track status: Pending → Confirmed → Dispatched → Delivered
  - Delivery address management

  ### 7. Alerts System
  - Expiring medicines alerts
  - Low stock warnings
  - Real-time notifications

  ## System Capabilities

  ### GST Compliance
  ✅ Automatic tax calculation
  ✅ CGST/SGST for intra-state
  ✅ IGST for inter-state
  ✅ Round-off handling
  ✅ Professional invoice format

  ### Loyalty Program
  - **Bronze** (0-499 points): 2% discount, 1x multiplier
  - **Silver** (500-1499 points): 5% discount, 1.25x multiplier  
  - **Gold** (1500-2999 points): 8% discount, 1.5x multiplier
  - **Platinum** (3000+ points): 12% discount, 2x multiplier

  ### Prescription Tracking
  - Schedule H drug identification
  - Schedule H1 drug monitoring
  - Prescription upload support
  - Doctor name recording

  ## Database Schema Highlights

  **25+ Tables** including:
  - Branch Management
  - Product Catalog
  - Batch-level Inventory
  - GST-compliant Sales
  - Customer Loyalty
  - Online Orders
  - Purchase Orders
  - WhatsApp Automation
  - Expiry & Stock Alerts
  - Complete Audit Trail

  ## API Endpoints

  ### Core Operations
  - `POST /api/auth/login` - Authentication
  - `GET /api/dashboard/stats` - Dashboard metrics
  - `GET /api/products` - Product list
  - `GET /api/inventory` - Stock levels
  - `POST /api/sales` - Create bill
  - `GET /api/customers` - Customer list
  - `GET /api/online-orders` - Online orders
  - `POST /api/online-orders/:id/confirm` - Confirm order
  - `POST /api/online-orders/:id/dispatch` - Dispatch order

  ## Development Commands

  ```bash
  # Database
  npm run db:push      # Push schema to database
  npm run db:seed      # Seed sample data
  npm run db:setup     # Complete setup (push + seed)

  # Application
  npm run dev          # Start dev server
  npm run build        # Build for production
  ```

  ## Need Help?

  Check `README.md` for:
  - Complete feature list
  - Architecture details
  - API documentation
  - Configuration options

  ---

  **System is production-ready with no mocked functionality!**
  All features are fully functional and connected to the PostgreSQL database.
  