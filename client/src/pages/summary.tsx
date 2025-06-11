import { useQuery } from "@tanstack/react-query";
import { FileDown, Download, Package, BookOpen, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface SummaryData {
  totalIngredients: number;
  totalRecipes: number;
  averageCost: string;
  totalInvestment: string;
  categoryBreakdown: Record<string, number>;
  recipes: Array<{
    id: number;
    name: string;
    category: string;
    servings: number;
    totalCost: string;
    costPerServing: string;
    suggestedPrice: string;
  }>;
}

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const categoryColors: Record<string, string> = {
  "Appetizers": "bg-accent/10 text-accent",
  "Main Course": "bg-primary/10 text-primary",
  "Desserts": "bg-purple-100 text-purple-700",
  "Beverages": "bg-blue-100 text-blue-700",
  "Salads": "bg-secondary/10 text-secondary",
  "Soups": "bg-orange-100 text-orange-700"
};

export default function SummaryPage() {
  const { data: summaryData, isLoading } = useQuery<SummaryData>({
    queryKey: ["/api/summary"],
  });

  const handleExportPDF = () => {
    // In a real app, this would generate and download a PDF
    alert("PDF export would be implemented here");
  };

  const handleExportCSV = () => {
    if (!summaryData) return;
    
    const csvContent = [
      ["Recipe Name", "Category", "Servings", "Total Cost", "Cost per Serving", "Suggested Price"],
      ...summaryData.recipes.map(recipe => [
        recipe.name,
        recipe.category,
        recipe.servings.toString(),
        recipe.totalCost,
        recipe.costPerServing,
        recipe.suggestedPrice
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recipe-cost-summary.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading summary...</div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-neutral-500">No data available</div>
      </div>
    );
  }

  const chartData = summaryData.recipes.map(recipe => ({
    name: recipe.name,
    cost: parseFloat(recipe.totalCost)
  })).slice(0, 10); // Show top 10 recipes

  const pieData = Object.entries(summaryData.categoryBreakdown).map(([category, cost], index) => ({
    name: category,
    value: cost,
    color: COLORS[index % COLORS.length]
  }));

  const totalCategoryValue = Object.values(summaryData.categoryBreakdown).reduce((sum, value) => sum + value, 0);

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">Cost Summary</h2>
            <p className="text-neutral-600 mt-1">Analyze your menu costs and profitability</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleExportPDF}
              className="bg-secondary text-white hover:bg-secondary/90"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button 
              onClick={handleExportCSV}
              className="bg-accent text-white hover:bg-accent/90"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">Total Ingredients</p>
                  <p className="text-2xl font-semibold text-neutral-900">{summaryData.totalIngredients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-secondary" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">Active Recipes</p>
                  <p className="text-2xl font-semibold text-neutral-900">{summaryData.totalRecipes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-accent" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">Average Cost</p>
                  <p className="text-2xl font-semibold text-neutral-900">${summaryData.averageCost}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">Total Investment</p>
                  <p className="text-2xl font-semibold text-neutral-900">${summaryData.totalInvestment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Cost Analysis Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Recipe Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, "Cost"]} />
                    <Bar dataKey="cost" fill="#6366F1" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-neutral-500">
                  No recipe data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Cost by Category</CardTitle>
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
                      <Tooltip formatter={(value) => [`$${value}`, "Cost"]} />
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
                          <span className="text-sm text-neutral-600">{entry.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-neutral-900">
                            ${entry.value.toFixed(2)}
                          </span>
                          <span className="text-xs text-neutral-500 block">
                            {totalCategoryValue > 0 ? Math.round((entry.value / totalCategoryValue) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-neutral-500">
                  No category data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Cost Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {summaryData.recipes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700">Recipe Name</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700">Category</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700">Servings</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700">Total Cost</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700">Cost/Serving</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700">Margin (30%)</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700">Suggested Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.recipes.map((recipe) => {
                      const margin = (parseFloat(recipe.costPerServing) * 0.3).toFixed(2);
                      
                      return (
                        <tr key={recipe.id} className="border-t border-neutral-100">
                          <td className="py-4 px-6 font-medium text-neutral-900">{recipe.name}</td>
                          <td className="py-4 px-6">
                            <Badge className={categoryColors[recipe.category] || "bg-gray-100 text-gray-700"}>
                              {recipe.category}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-neutral-600">{recipe.servings}</td>
                          <td className="py-4 px-6 font-medium text-neutral-900">${recipe.totalCost}</td>
                          <td className="py-4 px-6 text-neutral-600">${recipe.costPerServing}</td>
                          <td className="py-4 px-6 text-neutral-600">${margin}</td>
                          <td className="py-4 px-6 font-medium text-secondary">${recipe.suggestedPrice}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-neutral-500">
                No recipes available for analysis
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
