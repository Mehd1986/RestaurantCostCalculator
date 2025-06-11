import { pgTable, text, serial, integer, decimal, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Products/Items for sale
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  unit: text("unit").notNull(),
  barcode: text("barcode"),
  supplier: text("supplier"),
  minStock: integer("min_stock").default(5),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales transactions
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  paymentMethod: text("payment_method").notNull(),
  items: jsonb("items").notNull(),
  customerId: text("customer_id"),
  cashierId: text("cashier_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Operational costs
export const operationalCosts = pgTable("operational_costs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // staff, utilities, rent, supplies, etc.
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  category: text("category").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  frequency: text("frequency"), // daily, weekly, monthly
});

// Cost tracking history
export const costHistory = pgTable("cost_history", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  oldCost: decimal("old_cost", { precision: 10, scale: 2 }).notNull(),
  newCost: decimal("new_cost", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema definitions
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
}).extend({
  price: z.number().positive(),
  cost: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(5),
  isActive: z.boolean().default(true),
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
}).extend({
  totalAmount: z.number().positive(),
  taxAmount: z.number().min(0).optional(),
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().positive(),
    price: z.number(),
    total: z.number(),
  })),
});

export const insertOperationalCostSchema = createInsertSchema(operationalCosts).omit({
  id: true,
}).extend({
  amount: z.number().positive(),
  date: z.date(),
  isRecurring: z.boolean().default(false),
});

export const insertCostHistorySchema = createInsertSchema(costHistory).omit({
  id: true,
  updatedAt: true,
}).extend({
  oldCost: z.number(),
  newCost: z.number(),
  productId: z.number().optional(),
});

// Types
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof sales.$inferSelect;
export type InsertOperationalCost = z.infer<typeof insertOperationalCostSchema>;
export type OperationalCost = typeof operationalCosts.$inferSelect;
export type InsertCostHistory = z.infer<typeof insertCostHistorySchema>;
export type CostHistory = typeof costHistory.$inferSelect;

// Sale item interface
export interface SaleItem {
  productId: number;
  quantity: number;
  price: number;
  total: number;
}

// Enhanced sale with product details
export interface SaleWithDetails extends Sale {
  itemDetails: Array<{
    product: Product;
    quantity: number;
    price: number;
    total: number;
  }>;
}

// Product with margin calculations
export interface ProductWithMargin extends Product {
  margin: number;
  marginPercentage: number;
  isLowStock: boolean;
}

// Analytics interfaces
export interface SalesAnalytics {
  totalSales: number;
  totalProfit: number;
  averageOrderValue: number;
  topSellingProducts: Array<{
    product: Product;
    totalSold: number;
    revenue: number;
  }>;
  salesByCategory: Record<string, number>;
  salesTrend: Array<{
    date: string;
    sales: number;
    profit: number;
  }>;
}

export interface InventoryAlert {
  productId: number;
  productName: string;
  currentStock: number;
  minStock: number;
  severity: 'low' | 'critical';
}
