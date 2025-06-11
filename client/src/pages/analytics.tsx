import { useQuery } from "@tanstack/react-query";
import { Brain, TrendingUp, DollarSign, Target, AlertCircle, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import type { SalesAnalytics, ProductWithMargin, InventoryAlert } from "@shared/schema";

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function AnalyticsPage() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery<SalesAnalytics>({
    queryKey: ["/api/analytics"],
  });

  const { data: products = [] } = useQuery<ProductWithMargin[]>({
    queryKey: ["/api/products/with-margin"],
  });

  const { data: alerts = [] } = useQuery<InventoryAlert[]>({
    queryKey: ["/api/inventory/alerts"],
  });

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading AI insights...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-neutral-500">No analytics data available</div>
      </div>
    );
  }

  // AI Insights calculations
  const lowMarginProducts = products.filter(p => p.marginPercentage < 30);
  const highMarginProducts = products.filter(p => p.marginPercentage > 70);
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');

  const pieData = Object.entries(analytics.salesByCategory).map(([category, value], index) => ({
    name: category,
    value,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="p-6 bg-neutral-50 dark:bg-neutral-950 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">AI Insights Dashboard</h1>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400">Automated analytics and business recommendations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Revenue</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">${analytics.totalSales.toFixed(2)}</p>
                <p className="text-xs text-primary font-medium">Last 30 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Profit</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">${analytics.totalProfit.toFixed(2)}</p>
                <p className="text-xs text-secondary font-medium">
                  {((analytics.totalProfit / analytics.totalSales) * 100).toFixed(1)}% margin
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-accent" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Avg Order Value</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">${analytics.averageOrderValue.toFixed(2)}</p>
                <p className="text-xs text-accent font-medium">Per transaction</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Critical Alerts</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{criticalAlerts.length}</p>
                <p className="text-xs text-purple-600 font-medium">Need attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span className="text-neutral-900 dark:text-white">AI Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lowMarginProducts.length > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Optimize Pricing</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                  {lowMarginProducts.length} products have margins below 30%. Consider increasing prices:
                </p>
                <div className="space-y-1">
                  {lowMarginProducts.slice(0, 3).map(product => (
                    <div key={product.id} className="text-xs text-amber-600 dark:text-amber-400">
                      • {product.name} ({product.marginPercentage.toFixed(1)}% margin)
                    </div>
                  ))}
                </div>
              </div>
            )}

            {criticalAlerts.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Stock Alert</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                  {criticalAlerts.length} products are critically low. Reorder immediately:
                </p>
                <div className="space-y-1">
                  {criticalAlerts.slice(0, 3).map(alert => (
                    <div key={alert.productId} className="text-xs text-red-600 dark:text-red-400">
                      • {alert.productName} ({alert.currentStock} left)
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analytics.topSellingProducts.length > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Promote Bestsellers</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                  Focus marketing on top performers:
                </p>
                <div className="space-y-1">
                  {analytics.topSellingProducts.slice(0, 3).map(item => (
                    <div key={item.product.id} className="text-xs text-green-600 dark:text-green-400">
                      • {item.product.name} ({item.totalSold} sold)
                    </div>
                  ))}
                </div>
              </div>
            )}

            {highMarginProducts.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">High Margin Opportunities</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Promote these profitable items:
                </p>
                <div className="space-y-1">
                  {highMarginProducts.slice(0, 3).map(product => (
                    <div key={product.id} className="text-xs text-blue-600 dark:text-blue-400">
                      • {product.name} ({product.marginPercentage.toFixed(1)}% margin)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-white">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">{entry.name}</span>
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        ${entry.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-neutral-500">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-white">7-Day Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => [`$${value}`, name === 'sales' ? 'Revenue' : 'Profit']}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#6366F1" strokeWidth={2} name="sales" />
                  <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} name="profit" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-neutral-500">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-white">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topSellingProducts.length > 0 ? (
              <div className="space-y-4">
                {analytics.topSellingProducts.map((item, index) => (
                  <div key={item.product.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-white">{item.product.name}</div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">{item.product.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-neutral-900 dark:text-white">{item.totalSold} sold</div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">${item.revenue.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-neutral-500">
                No product data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}