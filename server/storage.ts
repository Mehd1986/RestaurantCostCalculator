import { 
  products, sales, operationalCosts, costHistory,
  type Product, type InsertProduct, type Sale, type InsertSale, 
  type OperationalCost, type InsertOperationalCost, type CostHistory, type InsertCostHistory,
  type SaleWithDetails, type ProductWithMargin, type SalesAnalytics, type InventoryAlert, type SaleItem
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private sales: Map<number, Sale>;
  private operationalCosts: Map<number, OperationalCost>;
  private costHistory: Map<number, CostHistory>;
  private currentProductId: number;
  private currentSaleId: number;
  private currentCostId: number;
  private currentHistoryId: number;

  constructor() {
    this.products = new Map();
    this.sales = new Map();
    this.operationalCosts = new Map();
    this.costHistory = new Map();
    this.currentProductId = 1;
    this.currentSaleId = 1;
    this.currentCostId = 1;
    this.currentHistoryId = 1;

    // Add sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample products
    const sampleProducts = [
      { name: "Espresso", category: "Beverages", price: 3.50, cost: 0.75, stock: 50, unit: "cup", supplier: "Coffee Co", minStock: 10, barcode: "123456789" },
      { name: "Cappuccino", category: "Beverages", price: 4.25, cost: 1.20, stock: 40, unit: "cup", supplier: "Coffee Co", minStock: 8, barcode: "123456790" },
      { name: "Croissant", category: "Pastries", price: 2.75, cost: 1.10, stock: 25, unit: "piece", supplier: "Bakery Plus", minStock: 5, barcode: "234567891" },
      { name: "Caesar Salad", category: "Food", price: 8.50, cost: 3.25, stock: 15, unit: "plate", supplier: "Fresh Foods", minStock: 3, barcode: "345678912" },
      { name: "Sandwich", category: "Food", price: 6.95, cost: 2.80, stock: 20, unit: "piece", supplier: "Deli Max", minStock: 5, barcode: "456789123" },
    ];

    sampleProducts.forEach(product => {
      const productData: Product = {
        ...product,
        id: this.currentProductId++,
        price: product.price.toString(),
        cost: product.cost.toString(),
        isActive: true,
        createdAt: new Date(),
      };
      this.products.set(productData.id, productData);
    });

    // Sample sales
    const sampleSales = [
      {
        totalAmount: 12.75,
        taxAmount: 1.02,
        paymentMethod: "card",
        items: [
          { productId: 1, quantity: 2, price: 3.50, total: 7.00 },
          { productId: 3, quantity: 2, price: 2.75, total: 5.50 }
        ],
        cashierId: "cashier01"
      },
      {
        totalAmount: 15.20,
        taxAmount: 1.22,
        paymentMethod: "cash",
        items: [
          { productId: 4, quantity: 1, price: 8.50, total: 8.50 },
          { productId: 2, quantity: 1, price: 4.25, total: 4.25 }
        ],
        cashierId: "cashier01"
      }
    ];

    sampleSales.forEach(sale => {
      const saleData: Sale = {
        ...sale,
        id: this.currentSaleId++,
        totalAmount: sale.totalAmount.toString(),
        taxAmount: sale.taxAmount.toString(),
        items: sale.items as any,
        customerId: null,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last 7 days
      };
      this.sales.set(saleData.id, saleData);
    });

    // Sample operational costs
    const sampleCosts = [
      { type: "staff", description: "Server wages - Day shift", amount: 120.00, date: new Date(), category: "Labor", isRecurring: true, frequency: "daily" },
      { type: "utilities", description: "Electricity bill", amount: 85.50, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), category: "Utilities", isRecurring: false, frequency: null },
      { type: "supplies", description: "Cleaning supplies", amount: 45.75, date: new Date(Date.now() - 24 * 60 * 60 * 1000), category: "Operations", isRecurring: false, frequency: null },
    ];

    sampleCosts.forEach(cost => {
      const costData: OperationalCost = {
        ...cost,
        id: this.currentCostId++,
        amount: cost.amount.toString(),
      };
      this.operationalCosts.set(costData.id, costData);
    });
  }

  // Products methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsWithMargin(): Promise<ProductWithMargin[]> {
    const products = await this.getProducts();
    return products.map(product => {
      const price = parseFloat(product.price);
      const cost = parseFloat(product.cost);
      const margin = price - cost;
      const marginPercentage = cost > 0 ? (margin / cost) * 100 : 0;
      const isLowStock = product.stock <= product.minStock;

      return {
        ...product,
        margin,
        marginPercentage,
        isLowStock
      };
    });
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = {
      ...insertProduct,
      id,
      price: insertProduct.price.toString(),
      cost: insertProduct.cost.toString(),
      createdAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, update: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;

    // Track cost changes
    if (update.cost && update.cost.toString() !== existing.cost) {
      await this.createCostHistory({
        productId: id,
        oldCost: existing.cost,
        newCost: update.cost.toString(),
        reason: "Manual update"
      });
    }

    const updated: Product = {
      ...existing,
      ...update,
      price: update.price ? update.price.toString() : existing.price,
      cost: update.cost ? update.cost.toString() : existing.cost,
    };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async getInventoryAlerts(): Promise<InventoryAlert[]> {
    const products = await this.getProducts();
    return products
      .filter(product => product.stock <= product.minStock)
      .map(product => ({
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        minStock: product.minStock,
        severity: product.stock <= product.minStock / 2 ? 'critical' as const : 'low' as const
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

export const storage = new MemStorage();