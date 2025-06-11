import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { insertProductSchema } from "@shared/schema";
import type { Product, InsertProduct, ProductWithMargin, InventoryAlert } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const categories = ["Beverages", "Food", "Pastries", "Snacks", "Desserts"];
const units = ["piece", "cup", "plate", "bottle", "kg", "g", "L", "mL"];

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery<ProductWithMargin[]>({
    queryKey: ["/api/products/with-margin"],
  });

  const { data: alerts = [] } = useQuery<InventoryAlert[]>({
    queryKey: ["/api/inventory/alerts"],
  });

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      category: "",
      price: 0,
      cost: 0,
      stock: 0,
      unit: "",
      supplier: "",
      minStock: 5,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertProduct) => apiRequest("POST", "/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/with-margin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/alerts"] });
      form.reset();
      toast({ title: "Success", description: "Product added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add product", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertProduct> }) =>
      apiRequest("PUT", `/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/with-margin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/alerts"] });
      setEditingProduct(null);
      form.reset();
      toast({ title: "Success", description: "Product updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update product", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/with-margin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/alerts"] });
      toast({ title: "Success", description: "Product deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertProduct) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      category: product.category,
      price: parseFloat(product.price),
      cost: parseFloat(product.cost),
      stock: product.stock,
      unit: product.unit,
      supplier: product.supplier || "",
      minStock: product.minStock || 5,
      isActive: product.isActive || true,
      barcode: product.barcode || "",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    form.reset();
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-neutral-50 dark:bg-neutral-950 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Inventory Management</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Manage your product inventory and stock levels</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            {alerts.length} product(s) are running low on stock and need restocking.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Form */}
        <div className="lg:col-span-1">
          <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="text-neutral-900 dark:text-white">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Cappuccino"
                    {...form.register("name")}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={(value) => form.setValue("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="price">Sale Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register("price", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">Cost ($)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register("cost", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="stock">Current Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      placeholder="0"
                      {...form.register("stock", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minStock">Min Stock</Label>
                    <Input
                      id="minStock"
                      type="number"
                      placeholder="5"
                      {...form.register("minStock", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select onValueChange={(value) => form.setValue("unit", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit..." />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    placeholder="e.g., Coffee Co"
                    {...form.register("supplier")}
                  />
                </div>

                <div>
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    placeholder="e.g., 123456789"
                    {...form.register("barcode")}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingProduct ? "Update Product" : "Add Product"}
                  </Button>
                  {editingProduct && (
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Products List */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-neutral-900 dark:text-white">Product Inventory</CardTitle>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                    <Input
                      placeholder="Search products..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
                  {products.length === 0 ? "No products added yet" : "No products match your search"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 dark:bg-neutral-800">
                      <tr>
                        <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Product</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Category</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Stock</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Price</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Margin</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-medium text-neutral-900 dark:text-white">{product.name}</div>
                              <div className="text-sm text-neutral-500 dark:text-neutral-400">{product.supplier}</div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              {product.category}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <span className={`font-medium ${product.isLowStock ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-white'}`}>
                                {product.stock}
                              </span>
                              {product.isLowStock && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 font-medium text-neutral-900 dark:text-white">
                            ${parseFloat(product.price).toFixed(2)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm">
                              <div className="font-medium text-neutral-900 dark:text-white">${product.margin.toFixed(2)}</div>
                              <div className={`text-xs ${product.marginPercentage > 50 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {product.marginPercentage.toFixed(1)}%
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                                className="p-1.5 text-neutral-400 hover:text-primary"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                                className="p-1.5 text-neutral-400 hover:text-red-500"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}