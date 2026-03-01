import type { Express } from "express";
  import { db } from "./db";
  import { 
    branches, users, roles, products, categories, manufacturers, suppliers,
    inventory, customers, sales, saleItems, onlineOrders, onlineOrderItems,
    purchaseOrders, purchaseOrderItems, loyaltyTiers, loyaltyTransactions,
    whatsappTemplates, whatsappMessages, expiryAlerts, stockAlerts, auditLogs
  } from "../shared/schema";
  import { eq, and, desc, sql, like, or, gte, lte, between } from "drizzle-orm";
  import bcrypt from "bcrypt";
  import jwt from "jsonwebtoken";
  import { whatsappService } from "./whatsapp";

  const JWT_SECRET = process.env.SESSION_SECRET || "pharmacy-secret-key";

  // ============================================
  // MIDDLEWARE: Authentication
  // ============================================
  function authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified;
      next();
    } catch (error) {
      res.status(403).json({ error: "Invalid token" });
    }
  }

  // ============================================
  // ROUTES SETUP
  // ============================================
  export function registerRoutes(app: Express) {
    
    // ========== AUTHENTICATION ==========
    app.post("/api/auth/login", async (req, res) => {
      try {
        const { username, password } = req.body;
        
        const user = await db.query.users.findFirst({
          where: eq(users.username, username),
          with: { role: true, branch: true }
        });

        if (!user || !user.isActive) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Update last login
        await db.update(users)
          .set({ lastLogin: new Date() })
          .where(eq(users.id, user.id));

        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username, 
            roleId: user.roleId,
            branchId: user.branchId 
          },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            branch: user.branch
          }
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/auth/register", async (req, res) => {
      try {
        const { username, email, password, fullName, phone, roleId, branchId } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const [newUser] = await db.insert(users).values({
          username,
          email,
          passwordHash: hashedPassword,
          fullName,
          phone,
          roleId,
          branchId,
          isActive: true
        }).returning();

        res.status(201).json({ message: "User created successfully", userId: newUser.id });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // ========== DASHBOARD STATS ==========
    app.get("/api/dashboard/stats", authenticateToken, async (req: any, res) => {
      try {
        const branchId = req.user.branchId;

        // Today's sales
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todaySales = await db
          .select({ total: sql`SUM(${sales.totalAmount})`, count: sql`COUNT(*)` })
          .from(sales)
          .where(and(
            eq(sales.branchId, branchId),
            gte(sales.saleDate, todayStart),
            eq(sales.status, "COMPLETED")
          ));

        // Low stock items
        const lowStockCount = await db
          .select({ count: sql`COUNT(*)` })
          .from(inventory)
          .where(and(
            eq(inventory.branchId, branchId),
            sql`${inventory.quantityInStock} <= ${inventory.reorderLevel}`
          ));

        // Expiring soon (within 30 days)
        const expiryThreshold = new Date();
        expiryThreshold.setDate(expiryThreshold.getDate() + 30);
        
        const expiringCount = await db
          .select({ count: sql`COUNT(*)` })
          .from(inventory)
          .where(and(
            eq(inventory.branchId, branchId),
            lte(inventory.expiryDate, expiryThreshold),
            gte(inventory.expiryDate, new Date())
          ));

        // Pending online orders
        const pendingOrdersCount = await db
          .select({ count: sql`COUNT(*)` })
          .from(onlineOrders)
          .where(and(
            eq(onlineOrders.branchId, branchId),
            or(
              eq(onlineOrders.status, "PENDING"),
              eq(onlineOrders.status, "CONFIRMED")
            )
          ));

        res.json({
          todaySales: {
            total: todaySales[0]?.total || 0,
            count: todaySales[0]?.count || 0
          },
          lowStockItems: lowStockCount[0]?.count || 0,
          expiringItems: expiringCount[0]?.count || 0,
          pendingOrders: pendingOrdersCount[0]?.count || 0
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // ========== BRANCHES ==========
    app.get("/api/branches", authenticateToken, async (req, res) => {
      try {
        const allBranches = await db.query.branches.findMany({
          where: eq(branches.isActive, true),
          orderBy: [branches.branchName]
        });
        res.json(allBranches);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/branches", authenticateToken, async (req, res) => {
      try {
        const [newBranch] = await db.insert(branches).values(req.body).returning();
        res.status(201).json(newBranch);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // ========== PRODUCTS ==========
    app.get("/api/products", authenticateToken, async (req, res) => {
      try {
        const { search, categoryId } = req.query;
        let query = db.query.products.findMany({
          with: {
            category: true,
            manufacturer: true
          },
          where: eq(products.isActive, true),
          orderBy: [products.productName]
        });

        let allProducts = await query;

        // Apply filters
        if (search) {
          const searchTerm = search.toString().toLowerCase();
          allProducts = allProducts.filter(p => 
            p.productName.toLowerCase().includes(searchTerm) ||
            p.productCode.toLowerCase().includes(searchTerm) ||
            p.genericName?.toLowerCase().includes(searchTerm)
          );
        }

        if (categoryId) {
          allProducts = allProducts.filter(p => p.categoryId === parseInt(categoryId.toString()));
        }

        res.json(allProducts);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/products/:id", authenticateToken, async (req, res) => {
      try {
        const product = await db.query.products.findFirst({
          where: eq(products.id, parseInt(req.params.id)),
          with: {
            category: true,
            manufacturer: true,
            inventory: {
              with: { branch: true, supplier: true }
            }
          }
        });

        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }

        res.json(product);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/products", authenticateToken, async (req, res) => {
      try {
        const [newProduct] = await db.insert(products).values(req.body).returning();
        res.status(201).json(newProduct);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.put("/api/products/:id", authenticateToken, async (req, res) => {
      try {
        const [updated] = await db
          .update(products)
          .set({ ...req.body, updatedAt: new Date() })
          .where(eq(products.id, parseInt(req.params.id)))
          .returning();
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // ========== INVENTORY ==========
    app.get("/api/inventory", authenticateToken, async (req: any, res) => {
      try {
        const branchId = req.query.branchId || req.user.branchId;
        
        const inventoryItems = await db.query.inventory.findMany({
          where: eq(inventory.branchId, parseInt(branchId)),
          with: {
            product: {
              with: {
                category: true,
                manufacturer: true
              }
            },
            branch: true,
            supplier: true
          },
          orderBy: [desc(inventory.createdAt)]
        });

        res.json(inventoryItems);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/inventory", authenticateToken, async (req, res) => {
      try {
        const [newInventory] = await db.insert(inventory).values(req.body).returning();
        res.status(201).json(newInventory);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.put("/api/inventory/:id", authenticateToken, async (req, res) => {
      try {
        const [updated] = await db
          .update(inventory)
          .set({ ...req.body, updatedAt: new Date() })
          .where(eq(inventory.id, parseInt(req.params.id)))
          .returning();
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // ========== CUSTOMERS ==========
    app.get("/api/customers", authenticateToken, async (req, res) => {
      try {
        const { search } = req.query;
        let allCustomers = await db.query.customers.findMany({
          where: eq(customers.isActive, true),
          orderBy: [desc(customers.createdAt)]
        });

        if (search) {
          const searchTerm = search.toString().toLowerCase();
          allCustomers = allCustomers.filter(c =>
            c.customerName.toLowerCase().includes(searchTerm) ||
            c.phone.includes(searchTerm) ||
            c.customerCode.toLowerCase().includes(searchTerm)
          );
        }

        res.json(allCustomers);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/customers/:id", authenticateToken, async (req, res) => {
      try {
        const customer = await db.query.customers.findFirst({
          where: eq(customers.id, parseInt(req.params.id)),
          with: {
            sales: { orderBy: [desc(sales.createdAt)], limit: 10 },
            onlineOrders: { orderBy: [desc(onlineOrders.createdAt)], limit: 10 },
            loyaltyTransactions: { orderBy: [desc(loyaltyTransactions.createdAt)], limit: 20 }
          }
        });

        if (!customer) {
          return res.status(404).json({ error: "Customer not found" });
        }

        res.json(customer);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/customers", authenticateToken, async (req: any, res) => {
      try {
        // Generate customer code
        const lastCustomer = await db.query.customers.findFirst({
          orderBy: [desc(customers.id)]
        });
        
        const nextId = (lastCustomer?.id || 0) + 1;
        const customerCode = `CUST${nextId.toString().padStart(6, '0')}`;

        const [newCustomer] = await db.insert(customers).values({
          ...req.body,
          customerCode,
          registrationBranch: req.user.branchId
        }).returning();

        res.status(201).json(newCustomer);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.put("/api/customers/:id", authenticateToken, async (req, res) => {
      try {
        const [updated] = await db
          .update(customers)
          .set({ ...req.body, updatedAt: new Date() })
          .where(eq(customers.id, parseInt(req.params.id)))
          .returning();
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // ========== SALES ==========
    app.get("/api/sales", authenticateToken, async (req: any, res) => {
      try {
        const branchId = req.query.branchId || req.user.branchId;
        const { startDate, endDate } = req.query;

        let whereConditions: any = eq(sales.branchId, parseInt(branchId));

        if (startDate && endDate) {
          whereConditions = and(
            whereConditions,
            between(sales.saleDate, new Date(startDate as string), new Date(endDate as string))
          );
        }

        const allSales = await db.query.sales.findMany({
          where: whereConditions,
          with: {
            customer: true,
            saleItems: {
              with: {
                product: true
              }
            }
          },
          orderBy: [desc(sales.saleDate)],
          limit: 100
        });

        res.json(allSales);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/sales/:id", authenticateToken, async (req, res) => {
      try {
        const sale = await db.query.sales.findFirst({
          where: eq(sales.id, parseInt(req.params.id)),
          with: {
            customer: true,
            branch: true,
            saleItems: {
              with: {
                product: {
                  with: {
                    manufacturer: true
                  }
                }
              }
            }
          }
        });

        if (!sale) {
          return res.status(404).json({ error: "Sale not found" });
        }

        res.json(sale);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/sales", authenticateToken, async (req: any, res) => {
      try {
        const { items, customerId, paymentMethod, ...saleData } = req.body;

        // Generate invoice number
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const lastSale = await db.query.sales.findFirst({
          orderBy: [desc(sales.id)]
        });
        const nextId = (lastSale?.id || 0) + 1;
        const invoiceNumber = `INV-${dateStr}-${nextId.toString().padStart(5, '0')}`;

        // Create sale
        const [newSale] = await db.insert(sales).values({
          ...saleData,
          invoiceNumber,
          customerId: customerId || null,
          paymentMethod,
          branchId: req.user.branchId,
          createdBy: req.user.id,
          status: "COMPLETED"
        }).returning();

        // Create sale items and update inventory
        for (const item of items) {
          await db.insert(saleItems).values({
            saleId: newSale.id,
            ...item
          });

          // Reduce inventory
          await db
            .update(inventory)
            .set({
              quantityInStock: sql`${inventory.quantityInStock} - ${item.quantity}`,
              updatedAt: new Date()
            })
            .where(eq(inventory.id, item.inventoryId));
        }

        // Update customer loyalty points if applicable
        if (customerId && newSale.loyaltyPointsEarned && newSale.loyaltyPointsEarned > 0) {
          await db
            .update(customers)
            .set({
              loyaltyPoints: sql`${customers.loyaltyPoints} + ${newSale.loyaltyPointsEarned}`,
              totalPurchases: sql`${customers.totalPurchases} + ${newSale.totalAmount}`
            })
            .where(eq(customers.id, customerId));

          // Record loyalty transaction
          await db.insert(loyaltyTransactions).values({
            customerId,
            transactionType: "EARN",
            points: newSale.loyaltyPointsEarned,
            saleId: newSale.id,
            description: `Points earned from sale ${invoiceNumber}`,
            createdBy: req.user.id
          });
        }

        res.status(201).json({ saleId: newSale.id, invoiceNumber });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // ========== ONLINE ORDERS ==========
    app.get("/api/online-orders", authenticateToken, async (req: any, res) => {
      try {
        const branchId = req.query.branchId || req.user.branchId;
        const { status } = req.query;

        let whereConditions: any = eq(onlineOrders.branchId, parseInt(branchId));

        if (status) {
          whereConditions = and(whereConditions, eq(onlineOrders.status, status as string));
        }

        const orders = await db.query.onlineOrders.findMany({
          where: whereConditions,
          with: {
            customer: true,
            orderItems: {
              with: {
                product: true
              }
            }
          },
          orderBy: [desc(onlineOrders.createdAt)],
          limit: 100
        });

        res.json(orders);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/online-orders/:id", authenticateToken, async (req, res) => {
      try {
        const order = await db.query.onlineOrders.findFirst({
          where: eq(onlineOrders.id, parseInt(req.params.id)),
          with: {
            customer: true,
            branch: true,
            orderItems: {
              with: {
                product: {
                  with: {
                    manufacturer: true
                  }
                }
              }
            }
          }
        });

        if (!order) {
          return res.status(404).json({ error: "Order not found" });
        }

        res.json(order);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/online-orders/:id/confirm", authenticateToken, async (req: any, res) => {
      try {
        const [updated] = await db
          .update(onlineOrders)
          .set({
            status: "CONFIRMED",
            confirmedBy: req.user.id,
            confirmedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(onlineOrders.id, parseInt(req.params.id)))
          .returning();

        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.post("/api/online-orders/:id/dispatch", authenticateToken, async (req: any, res) => {
      try {
        const [updated] = await db
          .update(onlineOrders)
          .set({
            status: "DISPATCHED",
            dispatchedBy: req.user.id,
            dispatchedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(onlineOrders.id, parseInt(req.params.id)))
          .returning();

        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // ========== CATEGORIES ==========
    app.get("/api/categories", authenticateToken, async (req, res) => {
      try {
        const allCategories = await db.query.categories.findMany({
          where: eq(categories.isActive, true),
          orderBy: [categories.categoryName]
        });
        res.json(allCategories);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/categories", authenticateToken, async (req, res) => {
      try {
        const [newCategory] = await db.insert(categories).values(req.body).returning();
        res.status(201).json(newCategory);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // ========== MANUFACTURERS ==========
    app.get("/api/manufacturers", authenticateToken, async (req, res) => {
      try {
        const allManufacturers = await db.query.manufacturers.findMany({
          where: eq(manufacturers.isActive, true),
          orderBy: [manufacturers.manufacturerName]
        });
        res.json(allManufacturers);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/manufacturers", authenticateToken, async (req, res) => {
      try {
        const [newManufacturer] = await db.insert(manufacturers).values(req.body).returning();
        res.status(201).json(newManufacturer);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // ========== SUPPLIERS ==========
    app.get("/api/suppliers", authenticateToken, async (req, res) => {
      try {
        const allSuppliers = await db.query.suppliers.findMany({
          where: eq(suppliers.isActive, true),
          orderBy: [suppliers.supplierName]
        });
        res.json(allSuppliers);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/suppliers", authenticateToken, async (req, res) => {
      try {
        // Generate supplier code
        const lastSupplier = await db.query.suppliers.findFirst({
          orderBy: [desc(suppliers.id)]
        });
        const nextId = (lastSupplier?.id || 0) + 1;
        const supplierCode = `SUPP${nextId.toString().padStart(5, '0')}`;

        const [newSupplier] = await db.insert(suppliers).values({
          ...req.body,
          supplierCode
        }).returning();

        res.status(201).json(newSupplier);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // ========== ALERTS ==========
    app.get("/api/alerts/expiry", authenticateToken, async (req: any, res) => {
      try {
        const branchId = req.query.branchId || req.user.branchId;

        const alerts = await db.query.expiryAlerts.findMany({
          where: and(
            eq(expiryAlerts.branchId, parseInt(branchId)),
            eq(expiryAlerts.isResolved, false)
          ),
          with: {
            product: true
          },
          orderBy: [expiryAlerts.expiryDate]
        });

        res.json(alerts);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/alerts/stock", authenticateToken, async (req: any, res) => {
      try {
        const branchId = req.query.branchId || req.user.branchId;

        const alerts = await db.query.stockAlerts.findMany({
          where: and(
            eq(stockAlerts.branchId, parseInt(branchId)),
            eq(stockAlerts.isResolved, false)
          ),
          with: {
            product: true
          },
          orderBy: [desc(stockAlerts.createdAt)]
        });

        res.json(alerts);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // ========== WHATSAPP (Meta Cloud API) ==========
    app.get("/api/whatsapp/status", authenticateToken, async (req, res) => {
      try {
        const profile = await whatsappService.getBusinessProfile();
        res.json(profile);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/whatsapp/templates", authenticateToken, async (req, res) => {
      try {
        const templates = await db.query.whatsappTemplates.findMany({
          where: eq(whatsappTemplates.isActive, true),
          orderBy: [whatsappTemplates.templateName],
        });
        res.json(templates);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/whatsapp/templates", authenticateToken, async (req, res) => {
      try {
        const [newTemplate] = await db
          .insert(whatsappTemplates)
          .values(req.body)
          .returning();
        res.status(201).json(newTemplate);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.get("/api/whatsapp/messages", authenticateToken, async (req, res) => {
      try {
        const messages = await db.query.whatsappMessages.findMany({
          orderBy: [desc(whatsappMessages.createdAt)],
          limit: 100,
        });
        res.json(messages);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/whatsapp/send", authenticateToken, async (req, res) => {
      try {
        const { phoneNumber, message, customerId } = req.body;
        if (!phoneNumber || !message) {
          return res.status(400).json({ error: "phoneNumber and message are required" });
        }
        const result = await whatsappService.sendTextMessage(
          phoneNumber,
          message,
          customerId
        );
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/whatsapp/send-template", authenticateToken, async (req, res) => {
      try {
        const { phoneNumber, templateName, languageCode, components, customerId } = req.body;
        if (!phoneNumber || !templateName) {
          return res.status(400).json({ error: "phoneNumber and templateName are required" });
        }
        const result = await whatsappService.sendTemplateMessage(
          phoneNumber,
          templateName,
          languageCode || "en",
          components || [],
          customerId
        );
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/whatsapp/send-invoice", authenticateToken, async (req, res) => {
      try {
        const { phoneNumber, invoiceNumber, totalAmount, pdfUrl, customerId } = req.body;
        if (!phoneNumber || !invoiceNumber || !pdfUrl) {
          return res.status(400).json({ error: "phoneNumber, invoiceNumber, and pdfUrl are required" });
        }
        const result = await whatsappService.sendInvoice(
          phoneNumber,
          invoiceNumber,
          totalAmount,
          pdfUrl,
          customerId
        );
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/whatsapp/send-order-update", authenticateToken, async (req, res) => {
      try {
        const { phoneNumber, orderNumber, status, customerId } = req.body;
        if (!phoneNumber || !orderNumber || !status) {
          return res.status(400).json({ error: "phoneNumber, orderNumber, and status are required" });
        }
        const result = await whatsappService.sendOrderUpdate(
          phoneNumber,
          orderNumber,
          status,
          customerId
        );
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/whatsapp/send-loyalty", authenticateToken, async (req, res) => {
      try {
        const { phoneNumber, customerName, pointsEarned, totalPoints, tier, customerId } = req.body;
        if (!phoneNumber || !customerName) {
          return res.status(400).json({ error: "phoneNumber and customerName are required" });
        }
        const result = await whatsappService.sendLoyaltyNotification(
          phoneNumber,
          customerName,
          pointsEarned || 0,
          totalPoints || 0,
          tier || "BRONZE",
          customerId
        );
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/whatsapp/send-reminder", authenticateToken, async (req, res) => {
      try {
        const { phoneNumber, customerName, medicineName, refillDate, customerId } = req.body;
        if (!phoneNumber || !customerName || !medicineName) {
          return res.status(400).json({ error: "phoneNumber, customerName, and medicineName are required" });
        }
        const result = await whatsappService.sendExpiryReminder(
          phoneNumber,
          customerName,
          medicineName,
          refillDate || "soon",
          customerId
        );
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/whatsapp/campaign", authenticateToken, async (req, res) => {
      try {
        const { phoneNumbers, message } = req.body;
        if (!phoneNumbers?.length || !message) {
          return res.status(400).json({ error: "phoneNumbers array and message are required" });
        }
        const results = await whatsappService.sendCampaignMessage(phoneNumbers, message);
        res.json({
          total: results.length,
          sent: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          details: results,
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/whatsapp/webhook", async (req, res) => {
      try {
        await whatsappService.handleWebhook(req.body);
        res.sendStatus(200);
      } catch (error: any) {
        res.sendStatus(200);
      }
    });

    app.get("/api/whatsapp/webhook", (req, res) => {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "suvidha-pharmacy-verify";

      if (mode === "subscribe" && token === verifyToken) {
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    });

    console.log("✅ All API routes registered successfully (including Meta WhatsApp Cloud API)");
  }
  