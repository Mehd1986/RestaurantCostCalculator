import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertOperationalCostSchema } from "@shared/schema";
import type { OperationalCost, InsertOperationalCost, CostHistory } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const costTypes = ["staff", "utilities", "rent", "supplies", "maintenance", "marketing"];
const costCategories = ["Labor", "Utilities", "Operations", "Rent", "Marketing", "Other"];

export default function CostTrackingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [editingCost, setEditingCost] = useState<OperationalCost | null>(null);
  const { toast } = useToast();

  const { data: costs = [], isLoading } = useQuery<OperationalCost[]>({
    queryKey: ["/api/costs"],
  });

  const { data: costHistory = [] } = useQuery<CostHistory[]>({
    queryKey: ["/api/cost-history"],
  });

  const form = useForm<InsertOperationalCost>({
    resolver: zodResolver(insertOperationalCostSchema),
    defaultValues: {
      type: "",
      description: "",
      amount: 0,
      date: new Date(),
      category: "",
      isRecurring: false,
      frequency: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertOperationalCost) => apiRequest("POST", "/api/costs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costs"] });
      form.reset();
      toast({ title: "Success", description: "Cost added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add cost", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertOperationalCost> }) =>
      apiRequest("PUT", `/api/costs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costs"] });
      setEditingCost(null);
      form.reset();
      toast({ title: "Success", description: "Cost updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update cost", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/costs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costs"] });
      toast({ title: "Success", description: "Cost deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete cost", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertOperationalCost) => {
    if (editingCost) {
      updateMutation.mutate({ id: editingCost.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (cost: OperationalCost) => {
    setEditingCost(cost);
    form.reset({
      type: cost.type,
      description: cost.description,
      amount: parseFloat(cost.amount),
      date: new Date(cost.date),
      category: cost.category,
      isRecurring: cost.isRecurring || false,
      frequency: cost.frequency,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this cost entry?")) {
      deleteMutation.mutate(id);
    }
  };

  const cancelEdit = () => {
    setEditingCost(null);
    form.reset();
  };

  const filteredCosts = costs.filter((cost) => {
    const matchesSearch = cost.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || cost.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalCosts = costs.reduce((sum, cost) => sum + parseFloat(cost.amount), 0);
  const monthlyCosts = costs
    .filter(cost => new Date(cost.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .reduce((sum, cost) => sum + parseFloat(cost.amount), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading cost data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-neutral-50 dark:bg-neutral-950 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Cost Tracking</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Monitor operational costs and expenses</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Costs</p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-white">${totalCosts.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Monthly Costs</p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-white">${monthlyCosts.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-accent" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Active Entries</p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{costs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Form */}
        <div className="lg:col-span-1">
          <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="text-neutral-900 dark:text-white">
                {editingCost ? "Edit Cost Entry" : "Add New Cost"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="type">Cost Type</Label>
                  <Select onValueChange={(value) => form.setValue("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {costTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={(value) => form.setValue("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {costCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Server wages - Day shift"
                    {...form.register("description")}
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...form.register("amount", { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    {...form.register("date", { 
                      setValueAs: (value) => value ? new Date(value) : new Date() 
                    })}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingCost ? "Update Cost" : "Add Cost"}
                  </Button>
                  {editingCost && (
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Costs List */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-neutral-900 dark:text-white">Cost Entries</CardTitle>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                    <Input
                      placeholder="Search costs..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {costTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredCosts.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
                  {costs.length === 0 ? "No cost entries added yet" : "No costs match your search"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 dark:bg-neutral-800">
                      <tr>
                        <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Description</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Type</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Category</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Amount</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Date</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCosts.map((cost) => (
                        <tr key={cost.id} className="border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="py-4 px-6">
                            <div className="font-medium text-neutral-900 dark:text-white">{cost.description}</div>
                            {cost.isRecurring && (
                              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                Recurring • {cost.frequency}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="secondary" className="capitalize">
                              {cost.type}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{cost.category}</td>
                          <td className="py-4 px-6 font-medium text-neutral-900 dark:text-white">
                            ${parseFloat(cost.amount).toFixed(2)}
                          </td>
                          <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                            {new Date(cost.date).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(cost)}
                                className="p-1.5 text-neutral-400 hover:text-primary"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(cost.id)}
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