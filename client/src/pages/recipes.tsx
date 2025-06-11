import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Edit, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertRecipeSchema } from "@shared/schema";
import type { Ingredient, InsertRecipe, RecipeWithDetails } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const recipeCategories = [
  "Appetizers",
  "Main Course", 
  "Desserts",
  "Beverages",
  "Salads",
  "Soups"
];

const categoryColors: Record<string, string> = {
  "Appetizers": "bg-accent/10 text-accent",
  "Main Course": "bg-primary/10 text-primary",
  "Desserts": "bg-purple-100 text-purple-700",
  "Beverages": "bg-blue-100 text-blue-700",
  "Salads": "bg-secondary/10 text-secondary",
  "Soups": "bg-orange-100 text-orange-700"
};

export default function RecipesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRecipe, setEditingRecipe] = useState<RecipeWithDetails | null>(null);
  const { toast } = useToast();

  const { data: ingredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const { data: recipes = [], isLoading } = useQuery<RecipeWithDetails[]>({
    queryKey: ["/api/recipes"],
  });

  const form = useForm<InsertRecipe>({
    resolver: zodResolver(insertRecipeSchema),
    defaultValues: {
      name: "",
      category: "",
      servings: 1,
      ingredients: [{ ingredientId: 0, quantity: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertRecipe) => apiRequest("POST", "/api/recipes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      form.reset({ name: "", category: "", servings: 1, ingredients: [{ ingredientId: 0, quantity: 0 }] });
      toast({ title: "Success", description: "Recipe saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save recipe", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: InsertRecipe }) =>
      apiRequest("PUT", `/api/recipes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setEditingRecipe(null);
      form.reset({ name: "", category: "", servings: 1, ingredients: [{ ingredientId: 0, quantity: 0 }] });
      toast({ title: "Success", description: "Recipe updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update recipe", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/recipes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({ title: "Success", description: "Recipe deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete recipe", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertRecipe) => {
    // Filter out empty ingredient entries
    const validIngredients = data.ingredients.filter(ing => ing.ingredientId > 0 && ing.quantity > 0);
    
    if (validIngredients.length === 0) {
      toast({ title: "Error", description: "Please add at least one ingredient", variant: "destructive" });
      return;
    }

    const recipeData = { ...data, ingredients: validIngredients };
    
    if (editingRecipe) {
      updateMutation.mutate({ id: editingRecipe.id, data: recipeData });
    } else {
      createMutation.mutate(recipeData);
    }
  };

  const handleEdit = (recipe: RecipeWithDetails) => {
    setEditingRecipe(recipe);
    const recipeIngredients = recipe.ingredientDetails.map(detail => ({
      ingredientId: detail.ingredient.id,
      quantity: detail.quantity
    }));
    
    form.reset({
      name: recipe.name,
      category: recipe.category,
      servings: recipe.servings,
      ingredients: recipeIngredients.length > 0 ? recipeIngredients : [{ ingredientId: 0, quantity: 0 }],
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this recipe?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicate = (recipe: RecipeWithDetails) => {
    const recipeIngredients = recipe.ingredientDetails.map(detail => ({
      ingredientId: detail.ingredient.id,
      quantity: detail.quantity
    }));
    
    form.reset({
      name: `${recipe.name} (Copy)`,
      category: recipe.category,
      servings: recipe.servings,
      ingredients: recipeIngredients,
    });
    setEditingRecipe(null);
  };

  const cancelEdit = () => {
    setEditingRecipe(null);
    form.reset({ name: "", category: "", servings: 1, ingredients: [{ ingredientId: 0, quantity: 0 }] });
  };

  const calculateTotalCost = () => {
    const formIngredients = form.watch("ingredients") || [];
    return formIngredients.reduce((total, recipeIngredient) => {
      const ingredient = ingredients.find(ing => ing.id === recipeIngredient.ingredientId);
      if (ingredient && recipeIngredient.quantity > 0) {
        return total + (parseFloat(ingredient.costPerUnit) * recipeIngredient.quantity);
      }
      return total;
    }, 0);
  };

  const totalCost = calculateTotalCost();
  const servings = form.watch("servings") || 1;
  const costPerServing = servings > 0 ? totalCost / servings : 0;

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading recipes...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">Recipes</h2>
            <p className="text-neutral-600 mt-1">Create and manage your dish recipes with automatic cost calculation</p>
          </div>
          <Button onClick={() => form.reset({ name: "", category: "", servings: 1, ingredients: [{ ingredientId: 0, quantity: 0 }] })}>
            <Plus className="w-4 h-4 mr-2" />
            New Recipe
          </Button>
        </div>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingRecipe ? "Edit Recipe" : "Create New Recipe"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Dish Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Margherita Pizza"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.name.message}
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
                        {recipeCategories.map((category) => (
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

                  <div>
                    <Label htmlFor="servings">Servings</Label>
                    <Input
                      id="servings"
                      type="number"
                      min="1"
                      placeholder="4"
                      {...form.register("servings", { valueAsNumber: true })}
                    />
                    {form.formState.errors.servings && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.servings.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Recipe Ingredients</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ ingredientId: 0, quantity: 0 })}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Ingredient
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {fields.map((field, index) => {
                        const selectedIngredient = ingredients.find(
                          ing => ing.id === form.watch(`ingredients.${index}.ingredientId`)
                        );
                        const quantity = form.watch(`ingredients.${index}.quantity`) || 0;
                        const cost = selectedIngredient ? parseFloat(selectedIngredient.costPerUnit) * quantity : 0;

                        return (
                          <div key={field.id} className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg">
                            <Select
                              onValueChange={(value) => 
                                form.setValue(`ingredients.${index}.ingredientId`, parseInt(value))
                              }
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select ingredient..." />
                              </SelectTrigger>
                              <SelectContent>
                                {ingredients.map((ingredient) => (
                                  <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                                    {ingredient.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Qty"
                              className="w-20"
                              {...form.register(`ingredients.${index}.quantity`, { valueAsNumber: true })}
                            />

                            <span className="text-sm text-neutral-500 w-12">
                              {selectedIngredient?.unit.split(' ')[0] || ''}
                            </span>

                            <span className="text-sm font-medium text-neutral-700 w-16">
                              ${cost.toFixed(2)}
                            </span>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              className="p-1.5 text-neutral-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-neutral-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Total Recipe Cost</span>
                      <span className="text-lg font-semibold text-primary">${totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-neutral-600">Cost per Serving</span>
                      <span className="text-sm font-medium text-neutral-700">${costPerServing.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      className="flex-1 bg-primary text-white hover:bg-primary/90"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingRecipe ? "Update Recipe" : "Save Recipe"}
                    </Button>
                    {editingRecipe && (
                      <Button type="button" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Recipes List */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Saved Recipes</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                    <Input
                      placeholder="Search recipes..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredRecipes.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">
                    {recipes.length === 0 ? "No recipes created yet" : "No recipes match your search"}
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {filteredRecipes.map((recipe) => (
                      <div key={recipe.id} className="p-6 hover:bg-neutral-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-neutral-900">{recipe.name}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={categoryColors[recipe.category] || "bg-gray-100 text-gray-700"}>
                                {recipe.category}
                              </Badge>
                              <span className="text-sm text-neutral-600">• {recipe.servings} servings</span>
                            </div>
                            <div className="flex items-center space-x-4 mt-3">
                              <span className="text-sm text-neutral-600">
                                Total Cost: <span className="font-medium text-neutral-900">${recipe.totalCost}</span>
                              </span>
                              <span className="text-sm text-neutral-600">
                                Per Serving: <span className="font-medium text-neutral-900">${recipe.costPerServing.toFixed(2)}</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(recipe)}
                              className="p-2 text-neutral-400 hover:text-primary"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDuplicate(recipe)}
                              className="p-2 text-neutral-400 hover:text-secondary"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(recipe.id)}
                              className="p-2 text-neutral-400 hover:text-red-500"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
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
