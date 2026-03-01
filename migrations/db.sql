-- ============================================
  -- SUVIDHA PHARMACY MANAGEMENT SYSTEM
  -- Database Migration Script
  -- Generated: 2026-03-01T06:05:14.931Z
  -- ============================================

  -- Enable UUID extension (if needed)
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- ============================================
  -- 1. BRANCH MANAGEMENT
  -- ============================================

  CREATE TABLE IF NOT EXISTS branches (
      id SERIAL PRIMARY KEY,
      branch_code VARCHAR(20) UNIQUE NOT NULL,
      branch_name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode VARCHAR(10) NOT NULL,
      phone VARCHAR(15) NOT NULL,
      email VARCHAR(100),
      gst_number VARCHAR(15) NOT NULL,
      drug_license VARCHAR(50) NOT NULL,
      drug_license_expiry TIMESTAMP NOT NULL,
      is_active BOOLEAN DEFAULT true NOT NULL,
      manager_name TEXT,
      opening_time VARCHAR(10),
      closing_time VARCHAR(10),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE INDEX IF NOT EXISTS branch_code_idx ON branches(branch_code);

  -- ============================================
  -- 2. USER & ROLE MANAGEMENT
  -- ============================================

  CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      role_name VARCHAR(50) UNIQUE NOT NULL,
      permissions JSONB NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone VARCHAR(15),
      role_id INTEGER REFERENCES roles(id) NOT NULL,
      branch_id INTEGER REFERENCES branches(id),
      is_active BOOLEAN DEFAULT true NOT NULL,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE INDEX IF NOT EXISTS username_idx ON users(username);
  CREATE INDEX IF NOT EXISTS email_idx ON users(email);

  -- ============================================
  -- 3. PRODUCT MANAGEMENT
  -- ============================================

  CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      category_name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      parent_category_id INTEGER REFERENCES categories(id),
      is_active BOOLEAN DEFAULT true NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS manufacturers (
      id SERIAL PRIMARY KEY,
      manufacturer_name TEXT UNIQUE NOT NULL,
      contact_person TEXT,
      phone VARCHAR(15),
      email VARCHAR(100),
      address TEXT,
      gst_number VARCHAR(15),
      is_active BOOLEAN DEFAULT true NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      supplier_code VARCHAR(50) UNIQUE NOT NULL,
      supplier_name TEXT NOT NULL,
      contact_person TEXT,
      phone VARCHAR(15) NOT NULL,
      email VARCHAR(100),
      address TEXT NOT NULL,
      city TEXT,
      state TEXT,
      pincode VARCHAR(10),
      gst_number VARCHAR(15),
      drug_license VARCHAR(50),
      payment_terms TEXT,
      credit_limit DECIMAL(12, 2),
      outstanding_balance DECIMAL(12, 2) DEFAULT 0,
      is_active BOOLEAN DEFAULT true NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE INDEX IF NOT EXISTS supplier_code_idx ON suppliers(supplier_code);

  CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      product_code VARCHAR(50) UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
      generic_name TEXT,
      category_id INTEGER REFERENCES categories(id) NOT NULL,
      manufacturer_id INTEGER REFERENCES manufacturers(id) NOT NULL,
      composition TEXT,
      description TEXT,
      dosage_form VARCHAR(50),
      strength VARCHAR(50),
      pack_size VARCHAR(50),
      unit VARCHAR(20) NOT NULL,
      hsn_code VARCHAR(20) NOT NULL,
      requires_prescription BOOLEAN DEFAULT false NOT NULL,
      is_schedule_h BOOLEAN DEFAULT false NOT NULL,
      is_schedule_h1 BOOLEAN DEFAULT false NOT NULL,
      storage_conditions TEXT,
      side_effects TEXT,
      image_url TEXT,
      is_active BOOLEAN DEFAULT true NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE INDEX IF NOT EXISTS product_code_idx ON products(product_code);
  CREATE INDEX IF NOT EXISTS product_name_idx ON products(product_name);

  -- ============================================
  -- 4. INVENTORY MANAGEMENT
  -- ============================================

  CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) NOT NULL,
      branch_id INTEGER REFERENCES branches(id) NOT NULL,
      batch_number VARCHAR(50) NOT NULL,
      expiry_date TIMESTAMP NOT NULL,
      purchase_price DECIMAL(10, 2) NOT NULL,
      selling_price DECIMAL(10, 2) NOT NULL,
      mrp DECIMAL(10, 2) NOT NULL,
      gst_percentage DECIMAL(5, 2) NOT NULL,
      quantity_in_stock INTEGER NOT NULL,
      reorder_level INTEGER NOT NULL,
      location VARCHAR(50),
      manufacture_date TIMESTAMP,
      supplier_id INTEGER REFERENCES suppliers(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE INDEX IF NOT EXISTS product_branch_idx ON inventory(product_id, branch_id);
  CREATE INDEX IF NOT EXISTS expiry_date_idx ON inventory(expiry_date);
  CREATE INDEX IF NOT EXISTS batch_number_idx ON inventory(batch_number);

  CREATE TABLE IF NOT EXISTS stock_movements (
      id SERIAL PRIMARY KEY,
      inventory_id INTEGER REFERENCES inventory(id) NOT NULL,
      movement_type VARCHAR(20) NOT NULL,
      quantity INTEGER NOT NULL,
      from_branch_id INTEGER REFERENCES branches(id),
      to_branch_id INTEGER REFERENCES branches(id),
      reference_type VARCHAR(50),
      reference_id INTEGER,
      notes TEXT,
      performed_by INTEGER REFERENCES users(id) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE INDEX IF NOT EXISTS inventory_movement_idx ON stock_movements(inventory_id);
  CREATE INDEX IF NOT EXISTS movement_created_at_idx ON stock_movements(created_at);

  -- ============================================
  -- 5. CUSTOMER MANAGEMENT
  -- ============================================

  CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      customer_code VARCHAR(50) UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      phone VARCHAR(15) UNIQUE NOT NULL,
      email VARCHAR(100),
      date_of_birth TIMESTAMP,
      gender VARCHAR(10),
      address TEXT,
      city TEXT,
      pincode VARCHAR(10),
      loyalty_points INTEGER DEFAULT 0 NOT NULL,
      loyalty_tier VARCHAR(20) DEFAULT 'BRONZE' NOT NULL,
      total_purchases DECIMAL(12, 2) DEFAULT 0,
      registration_branch INTEGER REFERENCES branches(id),
      whatsapp_opt_in BOOLEAN DEFAULT false NOT NULL,
      is_active BOOLEAN DEFAULT true NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE INDEX IF NOT EXISTS customer_phone_idx ON customers(phone);
  CREATE INDEX IF NOT EXISTS customer_code_idx ON customers(customer_code);

  CREATE TABLE IF NOT EXISTS customer_medical_history (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id) NOT NULL,
      condition TEXT NOT NULL,
      diagnosis_date TIMESTAMP,
      medications TEXT,
      allergies TEXT,
      notes TEXT,
      created_by INTEGER REFERENCES users(id) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  -- ============================================
  -- 6. SALES & BILLING
  -- ============================================

  CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      branch_id INTEGER REFERENCES branches(id) NOT NULL,
      customer_id INTEGER REFERENCES customers(id),
      sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      payment_method VARCHAR(20) NOT NULL,
      subtotal DECIMAL(12, 2) NOT NULL,
      discount_amount DECIMAL(12, 2) DEFAULT 0,
      gst_amount DECIMAL(12, 2) NOT NULL,
      cgst DECIMAL(12, 2) NOT NULL,
      sgst DECIMAL(12, 2) NOT NULL,
      igst DECIMAL(12, 2) DEFAULT 0,
      round_off DECIMAL(5, 2) DEFAULT 0,
      total_amount DECIMAL(12, 2) NOT NULL,
      amount_paid DECIMAL(12, 2) NOT NULL,
      change_given DECIMAL(12, 2) DEFAULT 0,
      loyalty_points_earned INTEGER DEFAULT 0,
      loyalty_points_redeemed INTEGER DEFAULT 0,
      prescription_required BOOLEAN DEFAULT false,
      prescription_image_url TEXT,
      doctor_name TEXT,
      status VARCHAR(20) DEFAULT 'COMPLETED' NOT NULL,
      created_by INTEGER REFERENCES users(id) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE INDEX IF NOT EXISTS invoice_number_idx ON sales(invoice_number);
  CREATE INDEX IF NOT EXISTS sale_date_idx ON sales(sale_date);
  CREATE INDEX IF NOT EXISTS sale_customer_idx ON sales(customer_id);

  CREATE TABLE IF NOT EXISTS sale_items (
      id SERIAL PRIMARY KEY,
      sale_id INTEGER REFERENCES sales(id) NOT NULL,
      inventory_id INTEGER REFERENCES inventory(id) NOT NULL,
      product_id INTEGER REFERENCES products(id) NOT NULL,
      batch_number VARCHAR(50) NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      mrp DECIMAL(10, 2) NOT NULL,
      discount_percentage DECIMAL(5, 2) DEFAULT 0,
      gst_percentage DECIMAL(5, 2) NOT NULL,
      gst_amount DECIMAL(10, 2) NOT NULL,
      total_amount DECIMAL(12, 2) NOT NULL,
      expiry_date TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sales_returns (
      id SERIAL PRIMARY KEY,
      return_number VARCHAR(50) UNIQUE NOT NULL,
      original_sale_id INTEGER REFERENCES sales(id) NOT NULL,
      branch_id INTEGER REFERENCES branches(id) NOT NULL,
      return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      return_reason TEXT NOT NULL,
      refund_amount DECIMAL(12, 2) NOT NULL,
      refund_method VARCHAR(20) NOT NULL,
      status VARCHAR(20) DEFAULT 'COMPLETED' NOT NULL,
      processed_by INTEGER REFERENCES users(id) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sales_return_items (
      id SERIAL PRIMARY KEY,
      sales_return_id INTEGER REFERENCES sales_returns(id) NOT NULL,
      sale_item_id INTEGER REFERENCES sale_items(id) NOT NULL,
      product_id INTEGER REFERENCES products(id) NOT NULL,
      quantity INTEGER NOT NULL,
      refund_amount DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  -- ============================================
  -- 7. ONLINE ORDERS
  -- ============================================

  CREATE TABLE IF NOT EXISTS online_orders (
      id SERIAL PRIMARY KEY,
      order_number VARCHAR(50) UNIQUE NOT NULL,
      customer_id INTEGER REFERENCES customers(id) NOT NULL,
      branch_id INTEGER REFERENCES branches(id) NOT NULL,
      order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      status VARCHAR(20) NOT NULL,
      subtotal DECIMAL(12, 2) NOT NULL,
      delivery_charge DECIMAL(10, 2) DEFAULT 0,
      discount_amount DECIMAL(12, 2) DEFAULT 0,
      gst_amount DECIMAL(12, 2) NOT NULL,
      total_amount DECIMAL(12, 2) NOT NULL,
      delivery_address TEXT NOT NULL,
      delivery_city TEXT NOT NULL,
      delivery_pincode VARCHAR(10) NOT NULL,
      contact_phone VARCHAR(15) NOT NULL,
      prescription_image_url TEXT,
      notes TEXT,
      confirmed_by INTEGER REFERENCES users(id),
      confirmed_at TIMESTAMP,
      dispatched_by INTEGER REFERENCES users(id),
      dispatched_at TIMESTAMP,
      delivered_at TIMESTAMP,
      cancelled_at TIMESTAMP,
      cancellation_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE INDEX IF NOT EXISTS order_number_idx ON online_orders(order_number);
  CREATE INDEX IF NOT EXISTS order_status_idx ON online_orders(status);
  CREATE INDEX IF NOT EXISTS order_customer_idx ON online_orders(customer_id);

  CREATE TABLE IF NOT EXISTS online_order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES online_orders(id) NOT NULL,
      product_id INTEGER REFERENCES products(id) NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      gst_percentage DECIMAL(5, 2) NOT NULL,
      total_amount DECIMAL(12, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  -- ============================================
  -- 8. PURCHASE ORDERS
  -- ============================================

  CREATE TABLE IF NOT EXISTS purchase_orders (
      id SERIAL PRIMARY KEY,
      po_number VARCHAR(50) UNIQUE NOT NULL,
      supplier_id INTEGER REFERENCES suppliers(id) NOT NULL,
      branch_id INTEGER REFERENCES branches(id) NOT NULL,
      order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      expected_delivery_date TIMESTAMP,
      status VARCHAR(20) NOT NULL,
      subtotal DECIMAL(12, 2) NOT NULL,
      gst_amount DECIMAL(12, 2) NOT NULL,
      discount_amount DECIMAL(12, 2) DEFAULT 0,
      total_amount DECIMAL(12, 2) NOT NULL,
      notes TEXT,
      created_by INTEGER REFERENCES users(id) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE INDEX IF NOT EXISTS po_number_idx ON purchase_orders(po_number);
  CREATE INDEX IF NOT EXISTS po_status_idx ON purchase_orders(status);

  CREATE TABLE IF NOT EXISTS purchase_order_items (
      id SERIAL PRIMARY KEY,
      purchase_order_id INTEGER REFERENCES purchase_orders(id) NOT NULL,
      product_id INTEGER REFERENCES products(id) NOT NULL,
      quantity INTEGER NOT NULL,
      received_quantity INTEGER DEFAULT 0 NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      gst_percentage DECIMAL(5, 2) NOT NULL,
      discount_percentage DECIMAL(5, 2) DEFAULT 0,
      total_amount DECIMAL(12, 2) NOT NULL,
      batch_number VARCHAR(50),
      expiry_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  -- ============================================
  -- 9. LOYALTY PROGRAM
  -- ============================================

  CREATE TABLE IF NOT EXISTS loyalty_tiers (
      id SERIAL PRIMARY KEY,
      tier_name VARCHAR(20) UNIQUE NOT NULL,
      min_points INTEGER NOT NULL,
      max_points INTEGER,
      discount_percentage DECIMAL(5, 2) DEFAULT 0,
      points_multiplier DECIMAL(3, 2) DEFAULT 1.0,
      benefits JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS loyalty_transactions (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id) NOT NULL,
      transaction_type VARCHAR(20) NOT NULL,
      points INTEGER NOT NULL,
      sale_id INTEGER REFERENCES sales(id),
      description TEXT,
      expiry_date TIMESTAMP,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE INDEX IF NOT EXISTS loyalty_customer_idx ON loyalty_transactions(customer_id);

  -- ============================================
  -- 10. WHATSAPP AUTOMATION
  -- ============================================

  CREATE TABLE IF NOT EXISTS whatsapp_templates (
      id SERIAL PRIMARY KEY,
      template_name VARCHAR(100) UNIQUE NOT NULL,
      template_type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      variables JSONB,
      is_active BOOLEAN DEFAULT true NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id),
      phone_number VARCHAR(15) NOT NULL,
      template_id INTEGER REFERENCES whatsapp_templates(id),
      message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL,
      message_id TEXT,
      error_message TEXT,
      sent_at TIMESTAMP,
      delivered_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE INDEX IF NOT EXISTS whatsapp_status_idx ON whatsapp_messages(status);
  CREATE INDEX IF NOT EXISTS whatsapp_created_at_idx ON whatsapp_messages(created_at);

  -- ============================================
  -- 11. ALERTS SYSTEM
  -- ============================================

  CREATE TABLE IF NOT EXISTS expiry_alerts (
      id SERIAL PRIMARY KEY,
      inventory_id INTEGER REFERENCES inventory(id) NOT NULL,
      branch_id INTEGER REFERENCES branches(id) NOT NULL,
      product_id INTEGER REFERENCES products(id) NOT NULL,
      batch_number VARCHAR(50) NOT NULL,
      expiry_date TIMESTAMP NOT NULL,
      quantity_in_stock INTEGER NOT NULL,
      alert_level VARCHAR(20) NOT NULL,
      is_resolved BOOLEAN DEFAULT false NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE INDEX IF NOT EXISTS alert_level_idx ON expiry_alerts(alert_level, is_resolved);

  CREATE TABLE IF NOT EXISTS stock_alerts (
      id SERIAL PRIMARY KEY,
      inventory_id INTEGER REFERENCES inventory(id) NOT NULL,
      branch_id INTEGER REFERENCES branches(id) NOT NULL,
      product_id INTEGER REFERENCES products(id) NOT NULL,
      current_stock INTEGER NOT NULL,
      reorder_level INTEGER NOT NULL,
      alert_type VARCHAR(20) NOT NULL,
      is_resolved BOOLEAN DEFAULT false NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE INDEX IF NOT EXISTS stock_alert_type_idx ON stock_alerts(alert_type, is_resolved);

  -- ============================================
  -- 12. ANALYTICS & REPORTING
  -- ============================================

  CREATE TABLE IF NOT EXISTS daily_summary (
      id SERIAL PRIMARY KEY,
      branch_id INTEGER REFERENCES branches(id) NOT NULL,
      summary_date TIMESTAMP NOT NULL,
      total_sales DECIMAL(12, 2) NOT NULL,
      total_transactions INTEGER NOT NULL,
      total_customers INTEGER NOT NULL,
      cash_sales DECIMAL(12, 2) DEFAULT 0,
      card_sales DECIMAL(12, 2) DEFAULT 0,
      upi_sales DECIMAL(12, 2) DEFAULT 0,
      total_returns DECIMAL(12, 2) DEFAULT 0,
      top_selling_product INTEGER REFERENCES products(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE INDEX IF NOT EXISTS branch_date_idx ON daily_summary(branch_id, summary_date);

  -- ============================================
  -- 13. AUDIT TRAIL
  -- ============================================

  CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) NOT NULL,
      action VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INTEGER,
      old_values JSONB,
      new_values JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE INDEX IF NOT EXISTS audit_user_idx ON audit_logs(user_id);
  CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_logs(entity_type, entity_id);
  CREATE INDEX IF NOT EXISTS audit_created_at_idx ON audit_logs(created_at);

  -- ============================================
  -- TRIGGERS FOR UPDATED_AT TIMESTAMPS
  -- ============================================

  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- Apply triggers to all tables with updated_at
  CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_online_orders_updated_at BEFORE UPDATE ON online_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- ============================================
  -- COMMENTS FOR DOCUMENTATION
  -- ============================================

  COMMENT ON TABLE branches IS 'Multi-branch pharmacy locations';
  COMMENT ON TABLE users IS 'System users with role-based access';
  COMMENT ON TABLE products IS 'Product master catalog';
  COMMENT ON TABLE inventory IS 'Batch-level inventory tracking';
  COMMENT ON TABLE customers IS 'Customer profiles with loyalty program';
  COMMENT ON TABLE sales IS 'GST-compliant sales transactions';
  COMMENT ON TABLE online_orders IS 'Customer online orders from portal';
  COMMENT ON TABLE loyalty_transactions IS 'Customer loyalty points history';
  COMMENT ON TABLE whatsapp_messages IS 'WhatsApp automation message log';
  COMMENT ON TABLE expiry_alerts IS 'Medicine expiry date alerts';
  COMMENT ON TABLE stock_alerts IS 'Low stock level alerts';
  COMMENT ON TABLE audit_logs IS 'Complete system audit trail';

  -- ============================================
  -- MIGRATION COMPLETE
  -- ============================================

  SELECT 'Database migration completed successfully!' AS status;
  