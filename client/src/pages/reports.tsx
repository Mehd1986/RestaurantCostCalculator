import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown, Download, Calendar, Filter, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { SaleWithDetails, SalesAnalytics, OperationalCost } from "@shared/schema";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState("7");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: sales = [] } = useQuery<SaleWithDetails[]>({
    queryKey: ["/api/sales"],
  });

  const { data: analytics } = useQuery<SalesAnalytics>({
    queryKey: ["/api/analytics", { days: parseInt(dateRange) }],
  });

  const { data: costs = [] } = useQuery<OperationalCost[]>({
    queryKey: ["/api/costs"],
  });

  const handleExportPDF = () => {
    // In a real app, this would generate and download a PDF
    alert("PDF export functionality would be implemented here with a library like jsPDF or Puppeteer");
  };

  const handleExportExcel = () => {
    if (reportType === "sales" && sales.length > 0) {
      const csvContent = [
        ["Date", "Sale ID", "Items", "Payment Method", "Subtotal", "Tax", "Total"],
        ...sales.map(sale => [
          new Date(sale.createdAt || "").toLocaleDateString(),
          sale.id.toString(),
          sale.itemDetails.map(item => `${item.product.name} (${item.quantity})`).join("; "),
          sale.paymentMethod,
          (parseFloat(sale.totalAmount) - parseFloat(sale.taxAmount || "0")).toFixed(2),
          sale.taxAmount || "0",
          sale.totalAmount
        ])
      ].map(row => row.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (reportType === "costs" && costs.length > 0) {
      const csvContent = [
        ["Date", "Type", "Category", "Description", "Amount"],
        ...costs.map(cost => [
          new Date(cost.date).toLocaleDateString(),
          cost.type,
          cost.category,
          cost.description,
          cost.amount
        ])
      ].map(row => row.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `costs-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.createdAt || "");
    const cutoffDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
    return saleDate >= cutoffDate;
  });

  const filteredCosts = costs.filter(cost => {
    const costDate = new Date(cost.date);
    const cutoffDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
    return costDate >= cutoffDate;
  });

  const totalSales = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
  const totalCosts = filteredCosts.reduce((sum, cost) => sum + parseFloat(cost.amount), 0);
  const profit = totalSales - totalCosts;

  return (
    <div className="p-6 bg-neutral-50 dark:bg-neutral-950 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Reports & Analytics</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Generate detailed business reports and export data</p>
      </div>

      {/* Controls */}
      <Card className="mb-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-white">Report Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="costs">Cost Report</SelectItem>
                  <SelectItem value="profit">Profit & Loss</SelectItem>
                  <SelectItem value="summary">Executive Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end space-x-2">
              <Button onClick={handleExportPDF} className="flex-1">
                <FileDown className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>

            <div className="flex items-end space-x-2">
              <Button onClick={handleExportExcel} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Revenue</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">${totalSales.toFixed(2)}</p>
                <p className="text-xs text-primary font-medium">Last {dateRange} days</p>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Costs</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">${totalCosts.toFixed(2)}</p>
                <p className="text-xs text-red-600 font-medium">Operational expenses</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <Filter className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${profit >= 0 ? 'from-secondary/10 to-secondary/5 border-secondary/20' : 'from-red-500/10 to-red-500/5 border-red-500/20'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Net Profit</p>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-secondary' : 'text-red-600'}`}>
                  ${Math.abs(profit).toFixed(2)}
                </p>
                <p className={`text-xs font-medium ${profit >= 0 ? 'text-secondary' : 'text-red-600'}`}>
                  {profit >= 0 ? 'Profit' : 'Loss'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${profit >= 0 ? 'bg-secondary/20' : 'bg-red-500/20'}`}>
                <Printer className={`w-6 h-6 ${profit >= 0 ? 'text-secondary' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      {reportType === "sales" && (
        <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-white">Sales Report</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredSales.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
                No sales data available for the selected period
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Date</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Sale ID</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Items</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Payment</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="border-t border-neutral-100 dark:border-neutral-800">
                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                          {new Date(sale.createdAt || "").toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 font-medium text-neutral-900 dark:text-white">
                          #{sale.id}
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            {sale.itemDetails.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="text-sm text-neutral-600 dark:text-neutral-400">
                                {item.product.name} × {item.quantity}
                              </div>
                            ))}
                            {sale.itemDetails.length > 2 && (
                              <div className="text-xs text-neutral-500">
                                +{sale.itemDetails.length - 2} more items
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant="secondary" className="capitalize">
                            {sale.paymentMethod}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 font-medium text-neutral-900 dark:text-white">
                          ${parseFloat(sale.totalAmount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {reportType === "costs" && (
        <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-white">Cost Report</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredCosts.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
                No cost data available for the selected period
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Date</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Type</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Category</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Description</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCosts.map((cost) => (
                      <tr key={cost.id} className="border-t border-neutral-100 dark:border-neutral-800">
                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                          {new Date(cost.date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant="secondary" className="capitalize">
                            {cost.type}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{cost.category}</td>
                        <td className="py-4 px-6 text-neutral-900 dark:text-white">{cost.description}</td>
                        <td className="py-4 px-6 font-medium text-neutral-900 dark:text-white">
                          ${parseFloat(cost.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {reportType === "profit" && (
        <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-white">Profit & Loss Statement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4">
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Revenue</h3>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Total Sales</span>
                  <span className="font-medium text-neutral-900 dark:text-white">${totalSales.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4">
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Expenses</h3>
                <div className="space-y-2">
                  {Object.entries(
                    filteredCosts.reduce((acc, cost) => {
                      acc[cost.category] = (acc[cost.category] || 0) + parseFloat(cost.amount);
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([category, amount]) => (
                    <div key={category} className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">{category}</span>
                      <span className="font-medium text-neutral-900 dark:text-white">${amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-neutral-600 dark:text-neutral-400">Total Expenses</span>
                    <span className="font-medium text-neutral-900 dark:text-white">${totalCosts.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-neutral-900 dark:text-white">Net Profit</span>
                  <span className={profit >= 0 ? 'text-secondary' : 'text-red-600'}>
                    ${Math.abs(profit).toFixed(2)} {profit < 0 ? '(Loss)' : ''}
                  </span>
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Profit Margin: {totalSales > 0 ? ((profit / totalSales) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === "summary" && analytics && (
        <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-white">Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Key Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Total Revenue</span>
                    <span className="font-medium">${analytics.totalSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Total Profit</span>
                    <span className="font-medium">${analytics.totalProfit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Average Order Value</span>
                    <span className="font-medium">${analytics.averageOrderValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Profit Margin</span>
                    <span className="font-medium">
                      {((analytics.totalProfit / analytics.totalSales) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Top Products</h3>
                <div className="space-y-2">
                  {analytics.topSellingProducts.slice(0, 5).map((item, index) => (
                    <div key={item.product.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          {item.product.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{item.totalSold} sold</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}