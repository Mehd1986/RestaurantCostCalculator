import { 
  products, sales, operationalCosts, costHistory,
  type Product, type InsertProduct, type Sale, type InsertSale, 
  type OperationalCost, type InsertOperationalCost, type CostHistory, type InsertCostHistory,
  type SaleWithDetails, type ProductWithMargin, type SalesAnalytics, type InventoryAlert, type SaleItem
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductsWithMargin(): Promise<ProductWithMargin[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getInventoryAlerts(): Promise<InventoryAlert[]>;
  
  // Sales
  getSales(): Promise<Sale[]>;
  getSale(id: number): Promise<Sale | undefined>;
  getSaleWithDetails(id: number): Promise<SaleWithDetails | undefined>;
  getSalesWithDetails(): Promise<SaleWithDetails[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  updateSale(id: number, sale: Partial<InsertSale>): Promise<Sale | undefined>;
  deleteSale(id: number): Promise<boolean>;
  
  // Operational Costs
  getOperationalCosts(): Promise<OperationalCost[]>;
  getOperationalCost(id: number): Promise<OperationalCost | undefined>;
  createOperationalCost(cost: InsertOperationalCost): Promise<OperationalCost>;
  updateOperationalCost(id: number, cost: Partial<InsertOperationalCost>): Promise<OperationalCost | undefined>;
  deleteOperationalCost(id: number): Promise<boolean>;
  
  // Cost History
  getCostHistory(productId?: number): Promise<CostHistory[]>;
  createCostHistory(history: InsertCostHistory): Promise<CostHistory>;
  
  // Analytics
  getSalesAnalytics(days?: number): Promise<SalesAnalytics>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    try {
      // Check if data already exists
      const existingProducts = await db.select().from(products).limit(1);
      if (existingProducts.length > 0) return;

      // Sample products
      const sampleProducts = [
        { name: "Espresso", category: "Beverages", price: "3.50", cost: "0.75", stock: 50, unit: "cup", supplier: "Coffee Co", minStock: 10, barcode: "123456789" },
        { name: "Cappuccino", category: "Beverages", price: "4.25", cost: "1.20", stock: 40, unit: "cup", supplier: "Coffee Co", minStock: 8, barcode: "123456790" },
        { name: "Croissant", category: "Pastries", price: "2.75", cost: "1.10", stock: 25, unit: "piece", supplier: "Bakery Plus", minStock: 5, barcode: "234567891" },
        { name: "Caesar Salad", category: "Food", price: "8.50", cost: "3.25", stock: 15, unit: "plate", supplier: "Fresh Foods", minStock: 3, barcode: "345678912" },
        { name: "Sandwich", category: "Food", price: "6.95", cost: "2.80", stock: 20, unit: "piece", supplier: "Deli Max", minStock: 5, barcode: "456789123" },
      ];

      await db.insert(products).values(sampleProducts);

      // Sample operational costs
      const sampleCosts = [
        { type: "staff", description: "Server wages - Day shift", amount: "120.00", date: new Date(), category: "Labor", isRecurring: true, frequency: "daily" },
        { type: "utilities", description: "Electricity bill", amount: "85.50", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), category: "Utilities", isRecurring: false, frequency: null },
        { type: "supplies", description: "Cleaning supplies", amount: "45.75", date: new Date(Date.now() - 24 * 60 * 60 * 1000), category: "Operations", isRecurring: false, frequency: null },
      ];

      await db.insert(operationalCosts).values(sampleCosts);
    } catch (error) {
      console.log("Sample data initialization skipped - tables may not exist yet");
    }
  }

  // Products methods
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async getProductsWithMargin(): Promise<ProductWithMargin[]> {
    const productsArray = await db.select().from(products);
    return productsArray.map(product => {
      const price = parseFloat(product.price);
      const cost = parseFloat(product.cost);
      const margin = price - cost;
      const marginPercentage = cost > 0 ? (margin / cost) * 100 : 0;
      const isLowStock = product.stock <= (product.minStock || 0);

      return {
        ...product,
        margin,
        marginPercentage,
        isLowStock
      };
    });
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(insertProduct).returning();
    return result[0];
  }

  async updateProduct(id: number, update: Partial<InsertProduct>): Promise<Product | undefined> {
    // Get existing product to track cost changes
    const existing = await this.getProduct(id);
    if (!existing) return undefined;

    // Track cost changes
    if (update.cost && update.cost !== existing.cost) {
      await this.createCostHistory({
        productId: id,
        oldCost: existing.cost,
        newCost: update.cost,
        reason: "Manual update"
      });
    }

    const result = await db.update(products).set(update).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount > 0;
  }

  async getInventoryAlerts(): Promise<InventoryAlert[]> {
    const productsArray = await db.select().from(products);
    return productsArray
      .filter(product => product.minStock !== null && product.stock <= product.minStock)
      .map(product => ({
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        minStock: product.minStock!,
        severity: product.stock <= (product.minStock! / 2) ? 'critical' as const : 'low' as const
      }));
  }

  // Sales methods
  async getSales(): Promise<Sale[]> {
    return Array.from(this.sales.values());
  }

  async getSale(id: number): Promise<Sale | undefined> {
    return this.sales.get(id);
  }

  async getSaleWithDetails(id: number): Promise<SaleWithDetails | undefined> {
    const sale = this.sales.get(id);
    if (!sale) return undefined;

    const saleItems = sale.items as SaleItem[];
    const itemDetails = [];

    for (const item of saleItems) {
      const product = this.products.get(item.productId);
      if (product) {
        itemDetails.push({
          product,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        });
      }
    }

    return {
      ...sale,
      itemDetails
    };
  }

  async getSalesWithDetails(): Promise<SaleWithDetails[]> {
    const sales = await this.getSales();
    const salesWithDetails = [];

    for (const sale of sales) {
      const saleWithDetails = await this.getSaleWithDetails(sale.id);
      if (saleWithDetails) {
        salesWithDetails.push(saleWithDetails);
      }
    }

    return salesWithDetails;
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = this.currentSaleId++;
    const sale: Sale = {
      ...insertSale,
      id,
      totalAmount: insertSale.totalAmount.toString(),
      taxAmount: insertSale.taxAmount?.toString() || "0",
      items: insertSale.items as any,
      createdAt: new Date(),
    };

    // Update stock for sold items
    for (const item of insertSale.items) {
      const product = this.products.get(item.productId);
      if (product) {
        const updatedProduct = {
          ...product,
          stock: product.stock - item.quantity
        };
        this.products.set(item.productId, updatedProduct);
      }
    }

    this.sales.set(id, sale);
    return sale;
  }

  async updateSale(id: number, update: Partial<InsertSale>): Promise<Sale | undefined> {
    const existing = this.sales.get(id);
    if (!existing) return undefined;

    const updated: Sale = {
      ...existing,
      ...update,
      totalAmount: update.totalAmount ? update.totalAmount.toString() : existing.totalAmount,
      taxAmount: update.taxAmount ? update.taxAmount.toString() : existing.taxAmount,
      items: update.items ? update.items as any : existing.items,
    };
    this.sales.set(id, updated);
    return updated;
  }

  async deleteSale(id: number): Promise<boolean> {
    return this.sales.delete(id);
  }

  // Operational Costs methods
  async getOperationalCosts(): Promise<OperationalCost[]> {
    return Array.from(this.operationalCosts.values());
  }

  async getOperationalCost(id: number): Promise<OperationalCost | undefined> {
    return this.operationalCosts.get(id);
  }

  async createOperationalCost(insertCost: InsertOperationalCost): Promise<OperationalCost> {
    const id = this.currentCostId++;
    const cost: OperationalCost = {
      ...insertCost,
      id,
      amount: insertCost.amount.toString(),
    };
    this.operationalCosts.set(id, cost);
    return cost;
  }

  async updateOperationalCost(id: number, update: Partial<InsertOperationalCost>): Promise<OperationalCost | undefined> {
    const existing = this.operationalCosts.get(id);
    if (!existing) return undefined;

    const updated: OperationalCost = {
      ...existing,
      ...update,
      amount: update.amount ? update.amount.toString() : existing.amount,
    };
    this.operationalCosts.set(id, updated);
    return updated;
  }

  async deleteOperationalCost(id: number): Promise<boolean> {
    return this.operationalCosts.delete(id);
  }

  // Cost History methods
  async getCostHistory(productId?: number): Promise<CostHistory[]> {
    const history = Array.from(this.costHistory.values());
    if (productId) {
      return history.filter(h => h.productId === productId);
    }
    return history;
  }

  async createCostHistory(insertHistory: InsertCostHistory): Promise<CostHistory> {
    const id = this.currentHistoryId++;
    const history: CostHistory = {
      ...insertHistory,
      id,
      oldCost: insertHistory.oldCost.toString(),
      newCost: insertHistory.newCost.toString(),
      updatedAt: new Date(),
    };
    this.costHistory.set(id, history);
    return history;
  }

  // Analytics methods
  async getSalesAnalytics(days: number = 30): Promise<SalesAnalytics> {
    const sales = await this.getSalesWithDetails();
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentSales = sales.filter(sale => sale.createdAt >= cutoffDate);

    const totalSales = recentSales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
    const totalProfit = recentSales.reduce((sum, sale) => {
      const saleProfit = sale.itemDetails.reduce((itemSum, item) => {
        const itemCost = parseFloat(item.product.cost) * item.quantity;
        const itemRevenue = item.total;
        return itemSum + (itemRevenue - itemCost);
      }, 0);
      return sum + saleProfit;
    }, 0);

    const averageOrderValue = recentSales.length > 0 ? totalSales / recentSales.length : 0;

    // Top selling products
    const productSales = new Map<number, { product: Product; totalSold: number; revenue: number }>();
    recentSales.forEach(sale => {
      sale.itemDetails.forEach(item => {
        const existing = productSales.get(item.product.id);
        if (existing) {
          existing.totalSold += item.quantity;
          existing.revenue += item.total;
        } else {
          productSales.set(item.product.id, {
            product: item.product,
            totalSold: item.quantity,
            revenue: item.total
          });
        }
      });
    });

    const topSellingProducts = Array.from(productSales.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    // Sales by category
    const salesByCategory: Record<string, number> = {};
    recentSales.forEach(sale => {
      sale.itemDetails.forEach(item => {
        const category = item.product.category;
        salesByCategory[category] = (salesByCategory[category] || 0) + item.total;
      });
    });

    // Sales trend (last 7 days)
    const salesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const daySales = recentSales.filter(sale => 
        sale.createdAt >= dayStart && sale.createdAt < dayEnd
      );
      
      const dayRevenue = daySales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
      const dayProfit = daySales.reduce((sum, sale) => {
        const saleProfit = sale.itemDetails.reduce((itemSum, item) => {
          const itemCost = parseFloat(item.product.cost) * item.quantity;
          const itemRevenue = item.total;
          return itemSum + (itemRevenue - itemCost);
        }, 0);
        return sum + saleProfit;
      }, 0);

      salesTrend.push({
        date: dayStart.toISOString().split('T')[0],
        sales: dayRevenue,
        profit: dayProfit
      });
    }

    return {
      totalSales,
      totalProfit,
      averageOrderValue,
      topSellingProducts,
      salesByCategory,
      salesTrend
    };
  }
}

export const storage = new DatabaseStorage();