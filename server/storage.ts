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
    const productData = {
      ...insertProduct,
      price: insertProduct.price.toString(),
      cost: insertProduct.cost.toString()
    };
    const result = await db.insert(products).values(productData).returning();
    return result[0];
  }

  async updateProduct(id: number, update: Partial<InsertProduct>): Promise<Product | undefined> {
    // Get existing product to track cost changes
    const existing = await this.getProduct(id);
    if (!existing) return undefined;

    // Track cost changes
    if (update.cost && update.cost.toString() !== existing.cost) {
      await this.createCostHistory({
        productId: id,
        oldCost: parseFloat(existing.cost),
        newCost: update.cost,
        reason: "Manual update"
      });
    }

    const updateData: any = {};
    Object.keys(update).forEach(key => {
      if (key === 'price' || key === 'cost') {
        updateData[key] = (update as any)[key]?.toString();
      } else {
        updateData[key] = (update as any)[key];
      }
    });

    const result = await db.update(products).set(updateData).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount ?? 0) > 0;
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
    return await db.select().from(sales).orderBy(desc(sales.createdAt));
  }

  async getSale(id: number): Promise<Sale | undefined> {
    const result = await db.select().from(sales).where(eq(sales.id, id));
    return result[0];
  }

  async getSaleWithDetails(id: number): Promise<SaleWithDetails | undefined> {
    const sale = await this.getSale(id);
    if (!sale) return undefined;

    const saleItems = sale.items as SaleItem[];
    const itemDetails = [];

    for (const item of saleItems) {
      const product = await this.getProduct(item.productId);
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
    const salesArray = await this.getSales();
    const salesWithDetails = [];

    for (const sale of salesArray) {
      const saleWithDetails = await this.getSaleWithDetails(sale.id);
      if (saleWithDetails) {
        salesWithDetails.push(saleWithDetails);
      }
    }

    return salesWithDetails;
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const saleData = {
      ...insertSale,
      totalAmount: insertSale.totalAmount.toString(),
      taxAmount: insertSale.taxAmount?.toString() || "0"
    };
    const result = await db.insert(sales).values(saleData).returning();
    const sale = result[0];

    // Update stock for sold items
    for (const item of insertSale.items) {
      const product = await this.getProduct(item.productId);
      if (product) {
        await db.update(products)
          .set({ stock: product.stock - item.quantity })
          .where(eq(products.id, item.productId));
      }
    }

    return sale;
  }

  async updateSale(id: number, update: Partial<InsertSale>): Promise<Sale | undefined> {
    const updateData: any = {};
    Object.keys(update).forEach(key => {
      if (key === 'totalAmount' || key === 'taxAmount') {
        updateData[key] = (update as any)[key]?.toString();
      } else {
        updateData[key] = (update as any)[key];
      }
    });
    
    const result = await db.update(sales).set(updateData).where(eq(sales.id, id)).returning();
    return result[0];
  }

  async deleteSale(id: number): Promise<boolean> {
    const result = await db.delete(sales).where(eq(sales.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Operational Costs methods
  async getOperationalCosts(): Promise<OperationalCost[]> {
    return await db.select().from(operationalCosts).orderBy(desc(operationalCosts.date));
  }

  async getOperationalCost(id: number): Promise<OperationalCost | undefined> {
    const result = await db.select().from(operationalCosts).where(eq(operationalCosts.id, id));
    return result[0];
  }

  async createOperationalCost(insertCost: InsertOperationalCost): Promise<OperationalCost> {
    const costData = {
      ...insertCost,
      amount: insertCost.amount.toString()
    };
    const result = await db.insert(operationalCosts).values(costData).returning();
    return result[0];
  }

  async updateOperationalCost(id: number, update: Partial<InsertOperationalCost>): Promise<OperationalCost | undefined> {
    const updateData: any = {};
    Object.keys(update).forEach(key => {
      if (key === 'amount') {
        updateData[key] = (update as any)[key]?.toString();
      } else {
        updateData[key] = (update as any)[key];
      }
    });
    
    const result = await db.update(operationalCosts).set(updateData).where(eq(operationalCosts.id, id)).returning();
    return result[0];
  }

  async deleteOperationalCost(id: number): Promise<boolean> {
    const result = await db.delete(operationalCosts).where(eq(operationalCosts.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Cost History methods
  async getCostHistory(productId?: number): Promise<CostHistory[]> {
    if (productId) {
      return await db.select().from(costHistory)
        .where(eq(costHistory.productId, productId))
        .orderBy(desc(costHistory.updatedAt));
    }
    return await db.select().from(costHistory).orderBy(desc(costHistory.updatedAt));
  }

  async createCostHistory(insertHistory: InsertCostHistory): Promise<CostHistory> {
    const historyData = {
      ...insertHistory,
      oldCost: insertHistory.oldCost.toString(),
      newCost: insertHistory.newCost.toString()
    };
    const result = await db.insert(costHistory).values(historyData).returning();
    return result[0];
  }

  // Analytics methods
  async getSalesAnalytics(days: number = 30): Promise<SalesAnalytics> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const salesArray = await db.select().from(sales)
      .where(gte(sales.createdAt, cutoffDate))
      .orderBy(desc(sales.createdAt));

    const salesWithDetails = [];
    for (const sale of salesArray) {
      const saleWithDetails = await this.getSaleWithDetails(sale.id);
      if (saleWithDetails) {
        salesWithDetails.push(saleWithDetails);
      }
    }

    const totalSales = salesWithDetails.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
    const totalProfit = salesWithDetails.reduce((sum, sale) => {
      const saleProfit = sale.itemDetails.reduce((itemSum, item) => {
        const itemCost = parseFloat(item.product.cost) * item.quantity;
        const itemRevenue = item.total;
        return itemSum + (itemRevenue - itemCost);
      }, 0);
      return sum + saleProfit;
    }, 0);

    const averageOrderValue = salesWithDetails.length > 0 ? totalSales / salesWithDetails.length : 0;

    // Top selling products
    const productSales = new Map<number, { product: Product; totalSold: number; revenue: number }>();
    salesWithDetails.forEach(sale => {
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
    salesWithDetails.forEach(sale => {
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
      
      const daySales = salesWithDetails.filter(sale => {
        const saleDate = sale.createdAt ? new Date(sale.createdAt) : new Date();
        return saleDate >= dayStart && saleDate < dayEnd;
      });
      
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