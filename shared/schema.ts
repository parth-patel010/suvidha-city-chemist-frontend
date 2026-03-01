import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, index, varchar } from "drizzle-orm/pg-core";
  import { createInsertSchema, createSelectSchema } from "drizzle-zod";
  import { relations } from "drizzle-orm";
  import { z } from "zod";

  // BRANCHES
  export const branches = pgTable("branches", {
    id: serial("id").primaryKey(),
    branchCode: varchar("branch_code", { length: 20 }).notNull().unique(),
    branchName: text("branch_name").notNull(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    pincode: varchar("pincode", { length: 10 }).notNull(),
    phone: varchar("phone", { length: 15 }).notNull(),
    email: varchar("email", { length: 100 }),
    gstNumber: varchar("gst_number", { length: 15 }).notNull(),
    drugLicense: varchar("drug_license", { length: 50 }).notNull(),
    drugLicenseExpiry: timestamp("drug_license_expiry").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    managerName: text("manager_name"),
    openingTime: varchar("opening_time", { length: 10 }),
    closingTime: varchar("closing_time", { length: 10 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }, (table) => ({ branchCodeIdx: index("branch_code_idx").on(table.branchCode) }));

  // ROLES & USERS
  export const roles = pgTable("roles", {
    id: serial("id").primaryKey(),
    roleName: varchar("role_name", { length: 50 }).notNull().unique(),
    permissions: jsonb("permissions").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });

  export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    email: varchar("email", { length: 100 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull(),
    phone: varchar("phone", { length: 15 }),
    roleId: integer("role_id").references(() => roles.id).notNull(),
    branchId: integer("branch_id").references(() => branches.id),
    isActive: boolean("is_active").default(true).notNull(),
    lastLogin: timestamp("last_login"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }, (table) => ({ usernameIdx: index("username_idx").on(table.username), emailIdx: index("email_idx").on(table.email) }));

  // CATEGORIES, MANUFACTURERS, SUPPLIERS
  export const categories = pgTable("categories", {
    id: serial("id").primaryKey(),
    categoryName: varchar("category_name", { length: 100 }).notNull().unique(),
    description: text("description"),
    parentCategoryId: integer("parent_category_id"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });

  export const manufacturers = pgTable("manufacturers", {
    id: serial("id").primaryKey(),
    manufacturerName: text("manufacturer_name").notNull().unique(),
    contactPerson: text("contact_person"),
    phone: varchar("phone", { length: 15 }),
    email: varchar("email", { length: 100 }),
    address: text("address"),
    gstNumber: varchar("gst_number", { length: 15 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });

  export const suppliers = pgTable("suppliers", {
    id: serial("id").primaryKey(),
    supplierCode: varchar("supplier_code", { length: 50 }).notNull().unique(),
    supplierName: text("supplier_name").notNull(),
    contactPerson: text("contact_person"),
    phone: varchar("phone", { length: 15 }).notNull(),
    email: varchar("email", { length: 100 }),
    address: text("address").notNull(),
    city: text("city"),
    state: text("state"),
    pincode: varchar("pincode", { length: 10 }),
    gstNumber: varchar("gst_number", { length: 15 }),
    drugLicense: varchar("drug_license", { length: 50 }),
    paymentTerms: text("payment_terms"),
    creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }),
    outstandingBalance: decimal("outstanding_balance", { precision: 12, scale: 2 }).default("0"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }, (table) => ({ supplierCodeIdx: index("supplier_code_idx").on(table.supplierCode) }));

  // PRODUCTS
  export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    productCode: varchar("product_code", { length: 50 }).notNull().unique(),
    productName: text("product_name").notNull(),
    genericName: text("generic_name"),
    categoryId: integer("category_id").references(() => categories.id).notNull(),
    manufacturerId: integer("manufacturer_id").references(() => manufacturers.id).notNull(),
    composition: text("composition"),
    description: text("description"),
    dosageForm: varchar("dosage_form", { length: 50 }),
    strength: varchar("strength", { length: 50 }),
    packSize: varchar("pack_size", { length: 50 }),
    unit: varchar("unit", { length: 20 }).notNull(),
    hsnCode: varchar("hsn_code", { length: 20 }).notNull(),
    requiresPrescription: boolean("requires_prescription").default(false).notNull(),
    isScheduleH: boolean("is_schedule_h").default(false).notNull(),
    isScheduleH1: boolean("is_schedule_h1").default(false).notNull(),
    storageConditions: text("storage_conditions"),
    sideEffects: text("side_effects"),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }, (table) => ({ productCodeIdx: index("product_code_idx").on(table.productCode), productNameIdx: index("product_name_idx").on(table.productName) }));

  // INVENTORY
  export const inventory = pgTable("inventory", {
    id: serial("id").primaryKey(),
    productId: integer("product_id").references(() => products.id).notNull(),
    branchId: integer("branch_id").references(() => branches.id).notNull(),
    batchNumber: varchar("batch_number", { length: 50 }).notNull(),
    expiryDate: timestamp("expiry_date").notNull(),
    purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
    sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
    mrp: decimal("mrp", { precision: 10, scale: 2 }).notNull(),
    gstPercentage: decimal("gst_percentage", { precision: 5, scale: 2 }).notNull(),
    quantityInStock: integer("quantity_in_stock").notNull(),
    reorderLevel: integer("reorder_level").notNull(),
    location: varchar("location", { length: 50 }),
    manufactureDate: timestamp("manufacture_date"),
    supplierId: integer("supplier_id").references(() => suppliers.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }, (table) => ({ 
    productBranchIdx: index("product_branch_idx").on(table.productId, table.branchId),
    expiryDateIdx: index("expiry_date_idx").on(table.expiryDate),
    batchNumberIdx: index("batch_number_idx").on(table.batchNumber)
  }));

  // CUSTOMERS
  export const customers = pgTable("customers", {
    id: serial("id").primaryKey(),
    customerCode: varchar("customer_code", { length: 50 }).notNull().unique(),
    customerName: text("customer_name").notNull(),
    phone: varchar("phone", { length: 15 }).notNull().unique(),
    email: varchar("email", { length: 100 }),
    dateOfBirth: timestamp("date_of_birth"),
    gender: varchar("gender", { length: 10 }),
    address: text("address"),
    city: text("city"),
    pincode: varchar("pincode", { length: 10 }),
    loyaltyPoints: integer("loyalty_points").default(0).notNull(),
    loyaltyTier: varchar("loyalty_tier", { length: 20 }).default("BRONZE").notNull(),
    totalPurchases: decimal("total_purchases", { precision: 12, scale: 2 }).default("0"),
    registrationBranch: integer("registration_branch").references(() => branches.id),
    whatsappOptIn: boolean("whatsapp_opt_in").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }, (table) => ({ 
    phoneIdx: index("customer_phone_idx").on(table.phone),
    customerCodeIdx: index("customer_code_idx").on(table.customerCode)
  }));

  // SALES
  export const sales = pgTable("sales", {
    id: serial("id").primaryKey(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
    branchId: integer("branch_id").references(() => branches.id).notNull(),
    customerId: integer("customer_id").references(() => customers.id),
    saleDate: timestamp("sale_date").defaultNow().notNull(),
    paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
    gstAmount: decimal("gst_amount", { precision: 12, scale: 2 }).notNull(),
    cgst: decimal("cgst", { precision: 12, scale: 2 }).notNull(),
    sgst: decimal("sgst", { precision: 12, scale: 2 }).notNull(),
    igst: decimal("igst", { precision: 12, scale: 2 }).default("0"),
    roundOff: decimal("round_off", { precision: 5, scale: 2 }).default("0"),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull(),
    changeGiven: decimal("change_given", { precision: 12, scale: 2 }).default("0"),
    loyaltyPointsEarned: integer("loyalty_points_earned").default(0),
    loyaltyPointsRedeemed: integer("loyalty_points_redeemed").default(0),
    prescriptionRequired: boolean("prescription_required").default(false),
    prescriptionImageUrl: text("prescription_image_url"),
    doctorName: text("doctor_name"),
    status: varchar("status", { length: 20 }).default("COMPLETED").notNull(),
    createdBy: integer("created_by").references(() => users.id).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }, (table) => ({
    invoiceNumberIdx: index("invoice_number_idx").on(table.invoiceNumber),
    saleDateIdx: index("sale_date_idx").on(table.saleDate),
    customerIdx: index("sale_customer_idx").on(table.customerId)
  }));

  export const saleItems = pgTable("sale_items", {
    id: serial("id").primaryKey(),
    saleId: integer("sale_id").references(() => sales.id).notNull(),
    inventoryId: integer("inventory_id").references(() => inventory.id).notNull(),
    productId: integer("product_id").references(() => products.id).notNull(),
    batchNumber: varchar("batch_number", { length: 50 }).notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    mrp: decimal("mrp", { precision: 10, scale: 2 }).notNull(),
    discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
    gstPercentage: decimal("gst_percentage", { precision: 5, scale: 2 }).notNull(),
    gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).notNull(),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    expiryDate: timestamp("expiry_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });

  // ONLINE ORDERS
  export const onlineOrders = pgTable("online_orders", {
    id: serial("id").primaryKey(),
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
    customerId: integer("customer_id").references(() => customers.id).notNull(),
    branchId: integer("branch_id").references(() => branches.id).notNull(),
    orderDate: timestamp("order_date").defaultNow().notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    deliveryCharge: decimal("delivery_charge", { precision: 10, scale: 2 }).default("0"),
    discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
    gstAmount: decimal("gst_amount", { precision: 12, scale: 2 }).notNull(),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    deliveryAddress: text("delivery_address").notNull(),
    deliveryCity: text("delivery_city").notNull(),
    deliveryPincode: varchar("delivery_pincode", { length: 10 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 15 }).notNull(),
    prescriptionImageUrl: text("prescription_image_url"),
    notes: text("notes"),
    confirmedBy: integer("confirmed_by").references(() => users.id),
    confirmedAt: timestamp("confirmed_at"),
    dispatchedBy: integer("dispatched_by").references(() => users.id),
    dispatchedAt: timestamp("dispatched_at"),
    deliveredAt: timestamp("delivered_at"),
    cancelledAt: timestamp("cancelled_at"),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }, (table) => ({
    orderNumberIdx: index("order_number_idx").on(table.orderNumber),
    statusIdx: index("order_status_idx").on(table.status),
    customerIdx: index("order_customer_idx").on(table.customerId)
  }));

  export const onlineOrderItems = pgTable("online_order_items", {
    id: serial("id").primaryKey(),
    orderId: integer("order_id").references(() => onlineOrders.id).notNull(),
    productId: integer("product_id").references(() => products.id).notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    gstPercentage: decimal("gst_percentage", { precision: 5, scale: 2 }).notNull(),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });

  // PURCHASE ORDERS
  export const purchaseOrders = pgTable("purchase_orders", {
    id: serial("id").primaryKey(),
    poNumber: varchar("po_number", { length: 50 }).notNull().unique(),
    supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
    branchId: integer("branch_id").references(() => branches.id).notNull(),
    orderDate: timestamp("order_date").defaultNow().notNull(),
    expectedDeliveryDate: timestamp("expected_delivery_date"),
    status: varchar("status", { length: 20 }).notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    gstAmount: decimal("gst_amount", { precision: 12, scale: 2 }).notNull(),
    discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    notes: text("notes"),
    createdBy: integer("created_by").references(() => users.id).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }, (table) => ({ poNumberIdx: index("po_number_idx").on(table.poNumber), statusIdx: index("po_status_idx").on(table.status) }));

  export const purchaseOrderItems = pgTable("purchase_order_items", {
    id: serial("id").primaryKey(),
    purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id).notNull(),
    productId: integer("product_id").references(() => products.id).notNull(),
    quantity: integer("quantity").notNull(),
    receivedQuantity: integer("received_quantity").default(0).notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    gstPercentage: decimal("gst_percentage", { precision: 5, scale: 2 }).notNull(),
    discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    batchNumber: varchar("batch_number", { length: 50 }),
    expiryDate: timestamp("expiry_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });

  // LOYALTY
  export const loyaltyTiers = pgTable("loyalty_tiers", {
    id: serial("id").primaryKey(),
    tierName: varchar("tier_name", { length: 20 }).notNull().unique(),
    minPoints: integer("min_points").notNull(),
    maxPoints: integer("max_points"),
    discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
    pointsMultiplier: decimal("points_multiplier", { precision: 3, scale: 2 }).default("1.0"),
    benefits: jsonb("benefits"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });

  export const loyaltyTransactions = pgTable("loyalty_transactions", {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id").references(() => customers.id).notNull(),
    transactionType: varchar("transaction_type", { length: 20 }).notNull(),
    points: integer("points").notNull(),
    saleId: integer("sale_id").references(() => sales.id),
    description: text("description"),
    expiryDate: timestamp("expiry_date"),
    createdBy: integer("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }, (table) => ({ customerIdx: index("loyalty_customer_idx").on(table.customerId) }));

  // WHATSAPP
  export const whatsappTemplates = pgTable("whatsapp_templates", {
    id: serial("id").primaryKey(),
    templateName: varchar("template_name", { length: 100 }).notNull().unique(),
    templateType: varchar("template_type", { length: 50 }).notNull(),
    message: text("message").notNull(),
    variables: jsonb("variables"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  });

  export const whatsappMessages = pgTable("whatsapp_messages", {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id").references(() => customers.id),
    phoneNumber: varchar("phone_number", { length: 15 }).notNull(),
    templateId: integer("template_id").references(() => whatsappTemplates.id),
    message: text("message").notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    messageId: text("message_id"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }, (table) => ({ statusIdx: index("whatsapp_status_idx").on(table.status), createdAtIdx: index("whatsapp_created_at_idx").on(table.createdAt) }));

  // ALERTS
  export const expiryAlerts = pgTable("expiry_alerts", {
    id: serial("id").primaryKey(),
    inventoryId: integer("inventory_id").references(() => inventory.id).notNull(),
    branchId: integer("branch_id").references(() => branches.id).notNull(),
    productId: integer("product_id").references(() => products.id).notNull(),
    batchNumber: varchar("batch_number", { length: 50 }).notNull(),
    expiryDate: timestamp("expiry_date").notNull(),
    quantityInStock: integer("quantity_in_stock").notNull(),
    alertLevel: varchar("alert_level", { length: 20 }).notNull(),
    isResolved: boolean("is_resolved").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }, (table) => ({ alertLevelIdx: index("alert_level_idx").on(table.alertLevel, table.isResolved) }));

  export const stockAlerts = pgTable("stock_alerts", {
    id: serial("id").primaryKey(),
    inventoryId: integer("inventory_id").references(() => inventory.id).notNull(),
    branchId: integer("branch_id").references(() => branches.id).notNull(),
    productId: integer("product_id").references(() => products.id).notNull(),
    currentStock: integer("current_stock").notNull(),
    reorderLevel: integer("reorder_level").notNull(),
    alertType: varchar("alert_type", { length: 20 }).notNull(),
    isResolved: boolean("is_resolved").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }, (table) => ({ alertTypeIdx: index("stock_alert_type_idx").on(table.alertType, table.isResolved) }));

  // AUDIT LOGS
  export const auditLogs = pgTable("audit_logs", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    action: varchar("action", { length: 50 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: integer("entity_id"),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }, (table) => ({
    userIdx: index("audit_user_idx").on(table.userId),
    entityIdx: index("audit_entity_idx").on(table.entityType, table.entityId),
    createdAtIdx: index("audit_created_at_idx").on(table.createdAt)
  }));

  // RELATIONS
  export const branchesRelations = relations(branches, ({ many }) => ({
    users: many(users),
    inventory: many(inventory),
    sales: many(sales),
    onlineOrders: many(onlineOrders),
    purchaseOrders: many(purchaseOrders),
    expiryAlerts: many(expiryAlerts),
    stockAlerts: many(stockAlerts),
  }));

  export const rolesRelations = relations(roles, ({ many }) => ({
    users: many(users),
  }));

  export const usersRelations = relations(users, ({ one }) => ({
    role: one(roles, { fields: [users.roleId], references: [roles.id] }),
    branch: one(branches, { fields: [users.branchId], references: [branches.id] }),
  }));

  export const categoriesRelations = relations(categories, ({ many }) => ({
    products: many(products),
  }));

  export const manufacturersRelations = relations(manufacturers, ({ many }) => ({
    products: many(products),
  }));

  export const suppliersRelations = relations(suppliers, ({ many }) => ({
    inventory: many(inventory),
    purchaseOrders: many(purchaseOrders),
  }));

  export const productsRelations = relations(products, ({ one, many }) => ({
    category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
    manufacturer: one(manufacturers, { fields: [products.manufacturerId], references: [manufacturers.id] }),
    inventory: many(inventory),
    saleItems: many(saleItems),
    onlineOrderItems: many(onlineOrderItems),
    expiryAlerts: many(expiryAlerts),
    stockAlerts: many(stockAlerts),
  }));

  export const inventoryRelations = relations(inventory, ({ one }) => ({
    product: one(products, { fields: [inventory.productId], references: [products.id] }),
    branch: one(branches, { fields: [inventory.branchId], references: [branches.id] }),
    supplier: one(suppliers, { fields: [inventory.supplierId], references: [suppliers.id] }),
  }));

  export const customersRelations = relations(customers, ({ one, many }) => ({
    registrationBranchRef: one(branches, { fields: [customers.registrationBranch], references: [branches.id] }),
    sales: many(sales),
    onlineOrders: many(onlineOrders),
    loyaltyTransactions: many(loyaltyTransactions),
    whatsappMessages: many(whatsappMessages),
  }));

  export const salesRelations = relations(sales, ({ one, many }) => ({
    branch: one(branches, { fields: [sales.branchId], references: [branches.id] }),
    customer: one(customers, { fields: [sales.customerId], references: [customers.id] }),
    createdByUser: one(users, { fields: [sales.createdBy], references: [users.id] }),
    saleItems: many(saleItems),
  }));

  export const saleItemsRelations = relations(saleItems, ({ one }) => ({
    sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
    inventory: one(inventory, { fields: [saleItems.inventoryId], references: [inventory.id] }),
    product: one(products, { fields: [saleItems.productId], references: [products.id] }),
  }));

  export const onlineOrdersRelations = relations(onlineOrders, ({ one, many }) => ({
    customer: one(customers, { fields: [onlineOrders.customerId], references: [customers.id] }),
    branch: one(branches, { fields: [onlineOrders.branchId], references: [branches.id] }),
    orderItems: many(onlineOrderItems),
  }));

  export const onlineOrderItemsRelations = relations(onlineOrderItems, ({ one }) => ({
    order: one(onlineOrders, { fields: [onlineOrderItems.orderId], references: [onlineOrders.id] }),
    product: one(products, { fields: [onlineOrderItems.productId], references: [products.id] }),
  }));

  export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
    supplier: one(suppliers, { fields: [purchaseOrders.supplierId], references: [suppliers.id] }),
    branch: one(branches, { fields: [purchaseOrders.branchId], references: [branches.id] }),
    createdByUser: one(users, { fields: [purchaseOrders.createdBy], references: [users.id] }),
    items: many(purchaseOrderItems),
  }));

  export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
    purchaseOrder: one(purchaseOrders, { fields: [purchaseOrderItems.purchaseOrderId], references: [purchaseOrders.id] }),
    product: one(products, { fields: [purchaseOrderItems.productId], references: [products.id] }),
  }));

  export const loyaltyTransactionsRelations = relations(loyaltyTransactions, ({ one }) => ({
    customer: one(customers, { fields: [loyaltyTransactions.customerId], references: [customers.id] }),
    sale: one(sales, { fields: [loyaltyTransactions.saleId], references: [sales.id] }),
  }));

  export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
    customer: one(customers, { fields: [whatsappMessages.customerId], references: [customers.id] }),
    template: one(whatsappTemplates, { fields: [whatsappMessages.templateId], references: [whatsappTemplates.id] }),
  }));

  export const expiryAlertsRelations = relations(expiryAlerts, ({ one }) => ({
    inventory: one(inventory, { fields: [expiryAlerts.inventoryId], references: [inventory.id] }),
    branch: one(branches, { fields: [expiryAlerts.branchId], references: [branches.id] }),
    product: one(products, { fields: [expiryAlerts.productId], references: [products.id] }),
  }));

  export const stockAlertsRelations = relations(stockAlerts, ({ one }) => ({
    inventory: one(inventory, { fields: [stockAlerts.inventoryId], references: [inventory.id] }),
    branch: one(branches, { fields: [stockAlerts.branchId], references: [branches.id] }),
    product: one(products, { fields: [stockAlerts.productId], references: [products.id] }),
  }));

  // Export types
  export type Branch = typeof branches.$inferSelect;
  export type User = typeof users.$inferSelect;
  export type Role = typeof roles.$inferSelect;
  export type Product = typeof products.$inferSelect;
  export type Inventory = typeof inventory.$inferSelect;
  export type Customer = typeof customers.$inferSelect;
  export type Sale = typeof sales.$inferSelect;
  export type SaleItem = typeof saleItems.$inferSelect;
  export type OnlineOrder = typeof onlineOrders.$inferSelect;
  export type OnlineOrderItem = typeof onlineOrderItems.$inferSelect;
  export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
  export type Supplier = typeof suppliers.$inferSelect;
  export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
  export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
  