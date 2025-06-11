import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertSaleSchema, insertOperationalCostSchema, insertCostHistorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/with-margin", async (req, res) => {
    try {
      const products = await storage.getProductsWithMargin();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products with margin" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, validatedData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Inventory alerts
  app.get("/api/inventory/alerts", async (req, res) => {
    try {
      const alerts = await storage.getInventoryAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory alerts" });
    }
  });

  // Sales routes
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await storage.getSalesWithDetails();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await storage.getSaleWithDetails(id);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const validatedData = insertSaleSchema.parse(req.body);
      const sale = await storage.createSale(validatedData);
      res.status(201).json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  app.put("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSaleSchema.partial().parse(req.body);
      const sale = await storage.updateSale(id, validatedData);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update sale" });
    }
  });

  app.delete("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSale(id);
      if (!deleted) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sale" });
    }
  });

  // Operational costs routes
  app.get("/api/costs", async (req, res) => {
    try {
      const costs = await storage.getOperationalCosts();
      res.json(costs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch operational costs" });
    }
  });

  app.get("/api/costs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cost = await storage.getOperationalCost(id);
      if (!cost) {
        return res.status(404).json({ message: "Operational cost not found" });
      }
      res.json(cost);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch operational cost" });
    }
  });

  app.post("/api/costs", async (req, res) => {
    try {
      const validatedData = insertOperationalCostSchema.parse(req.body);
      const cost = await storage.createOperationalCost(validatedData);
      res.status(201).json(cost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cost data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create operational cost" });
    }
  });

  app.put("/api/costs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertOperationalCostSchema.partial().parse(req.body);
      const cost = await storage.updateOperationalCost(id, validatedData);
      if (!cost) {
        return res.status(404).json({ message: "Operational cost not found" });
      }
      res.json(cost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cost data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update operational cost" });
    }
  });

  app.delete("/api/costs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteOperationalCost(id);
      if (!deleted) {
        return res.status(404).json({ message: "Operational cost not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete operational cost" });
    }
  });

  // Cost history routes
  app.get("/api/cost-history", async (req, res) => {
    try {
      const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
      const history = await storage.getCostHistory(productId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cost history" });
    }
  });

  // Analytics routes
  app.get("/api/analytics", async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const analytics = await storage.getSalesAnalytics(days);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}