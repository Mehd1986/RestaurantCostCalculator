import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Minus, X, CreditCard, Banknote, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product, InsertSale } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

const categoryColors: Record<string, string> = {
  "Beverages": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Food": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "Pastries": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("card");
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createSaleMutation = useMutation({
    mutationFn: (data: InsertSale) => apiRequest("POST", "/api/sales", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setCart([]);
      toast({ title: "Success", description: "Sale completed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to complete sale", variant: "destructive" });
    },
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * parseFloat(product.price) }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1, total: parseFloat(product.price) }];
      }
    });
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity, total: newQuantity * parseFloat(item.product.price) }
          : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "Error", description: "Cart is empty", variant: "destructive" });
      return;
    }

    const saleData: InsertSale = {
      totalAmount: total,
      taxAmount: tax,
      paymentMethod,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: parseFloat(item.product.price),
        total: item.total
      })),
      cashierId: "cashier01"
    };

    createSaleMutation.mutate(saleData);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.isActive;
  });

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-neutral-50 dark:bg-neutral-950">
      {/* Products Grid */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Point of Sale</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Select items to add to cart</p>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
              onClick={() => addToCart(product)}
            >
              <CardContent className="p-4">
                <div className="aspect-square bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-2xl">{product.name.charAt(0)}</span>
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 truncate">{product.name}</h3>
                <Badge className={categoryColors[product.category] || "bg-gray-100 text-gray-700"} variant="secondary">
                  {product.category}
                </Badge>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-primary">${parseFloat(product.price).toFixed(2)}</span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Stock: {product.stock}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-96 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Current Order</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{cart.length} items</p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-neutral-500 dark:text-neutral-400 mt-8">
              Cart is empty
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-neutral-900 dark:text-white text-sm">{item.product.name}</h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">${parseFloat(item.product.price).toFixed(2)} each</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0"
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="w-16 text-right">
                  <p className="font-medium text-sm">${item.total.toFixed(2)}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-8 h-8 p-0 text-neutral-400 hover:text-red-500"
                  onClick={() => removeFromCart(item.product.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
                <span className="text-neutral-900 dark:text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Tax (8%)</span>
                <span className="text-neutral-900 dark:text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span className="text-neutral-900 dark:text-white">Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-900 dark:text-white">Payment Method</p>
              <div className="flex space-x-2">
                <Button
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setPaymentMethod("card")}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Card
                </Button>
                <Button
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setPaymentMethod("cash")}
                >
                  <Banknote className="w-4 h-4 mr-2" />
                  Cash
                </Button>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              onClick={handleCheckout}
              disabled={createSaleMutation.isPending}
            >
              {createSaleMutation.isPending ? "Processing..." : "Complete Sale"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}