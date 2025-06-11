import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertIngredientSchema } from "@shared/schema";
import type { Ingredient, InsertIngredient } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const categories = [
  "Vegetables",
  "Fruits", 
  "Meat & Poultry",
  "Seafood",
  "Dairy",
  "Grains & Cereals",
  "Spices & Herbs",
  "Condiments"
];

const units = [
  "Kilogram (kg)",
  "Gram (g)",
  "Liter (L)",
  "Milliliter (mL)",
  "Piece (pc)",
  "Cup",
  "Tablespoon",
  "Teaspoon"
];

const categoryColors: Record<string, string> = {
  "Vegetables": "bg-secondary/10 text-secondary",
  "Fruits": "bg-orange-100 text-orange-700",
  "Meat & Poultry": "bg-accent/10 text-accent",
  "Seafood": "bg-blue-100 text-blue-700",
  "Dairy": "bg-yellow-100 text-yellow-700",
  "Grains & Cereals": "bg-amber-100 text-amber-700",
  "Spices & Herbs": "bg-primary/10 text-primary",
  "Condiments": "bg-purple-100 text-purple-700"
};

export default function IngredientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const { toast } = useToast();

  const { data: ingredients = [], isLoading } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const form = useForm<InsertIngredient>({
    resolver: zodResolver(insertIngredientSchema),
    defaultValues: {
      name: "",
      unit: "",
      costPerUnit: 0,
      category: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertIngredient) => apiRequest("POST", "/api/ingredients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      form.reset();
      toast({ title: "Success", description: "Ingredient added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add ingredient", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertIngredient> }) =>
      apiRequest("PUT", `/api/ingredients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      setEditingIngredient(null);
      form.reset();
      toast({ title: "Success", description: "Ingredient updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update ingredient", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/ingredients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({ title: "Success", description: "Ingredient deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete ingredient", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertIngredient) => {
    if (editingIngredient) {
      updateMutation.mutate({ id: editingIngredient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    form.reset({
      name: ingredient.name,
      unit: ingredient.unit,
      costPerUnit: parseFloat(ingredient.costPerUnit),
      category: ingredient.category,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this ingredient?")) {
      deleteMutation.mutate(id);
    }
  };

  const cancelEdit = () => {
    setEditingIngredient(null);
    form.reset();
  };

  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || ingredient.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading ingredients...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">Ingredients</h2>
            <p className="text-neutral-600 mt-1">Manage your ingredient inventory and costs</p>
          </div>
          <Button 
            onClick={() => form.reset()}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Ingredient
          </Button>
        </div>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingIngredient ? "Edit Ingredient" : "Add New Ingredient"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Ingredient Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Organic Tomatoes"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="unit">Unit of Measurement</Label>
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
                    {form.formState.errors.unit && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.unit.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="costPerUnit">Cost per Unit ($)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-neutral-500">$</span>
                      <Input
                        id="costPerUnit"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-8"
                        {...form.register("costPerUnit", { valueAsNumber: true })}
                      />
                    </div>
                    {form.formState.errors.costPerUnit && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.costPerUnit.message}
                      </p>
                    )}
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
                    {form.formState.errors.category && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.category.message}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      className="flex-1 bg-primary text-white hover:bg-primary/90"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingIngredient ? "Update Ingredient" : "Add Ingredient"}
                    </Button>
                    {editingIngredient && (
                      <Button type="button" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Ingredient Inventory</CardTitle>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                      <Input
                        placeholder="Search ingredients..."
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
                {filteredIngredients.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">
                    {ingredients.length === 0 ? "No ingredients added yet" : "No ingredients match your search"}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700">Name</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700">Category</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700">Unit</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700">Cost/Unit</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-neutral-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredIngredients.map((ingredient) => (
                          <tr key={ingredient.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                            <td className="py-4 px-6">
                              <div className="font-medium text-neutral-900">{ingredient.name}</div>
                            </td>
                            <td className="py-4 px-6">
                              <Badge 
                                className={categoryColors[ingredient.category] || "bg-gray-100 text-gray-700"}
                              >
                                {ingredient.category}
                              </Badge>
                            </td>
                            <td className="py-4 px-6 text-neutral-600">{ingredient.unit}</td>
                            <td className="py-4 px-6 font-medium text-neutral-900">
                              ${parseFloat(ingredient.costPerUnit).toFixed(2)}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(ingredient)}
                                  className="p-1.5 text-neutral-400 hover:text-primary"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(ingredient.id)}
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
    </div>
  );
}
