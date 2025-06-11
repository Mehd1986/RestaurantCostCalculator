import { ingredients, recipes, type Ingredient, type InsertIngredient, type Recipe, type InsertRecipe, type RecipeWithDetails, type RecipeIngredient } from "@shared/schema";

export interface IStorage {
  // Ingredients
  getIngredients(): Promise<Ingredient[]>;
  getIngredient(id: number): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  updateIngredient(id: number, ingredient: Partial<InsertIngredient>): Promise<Ingredient | undefined>;
  deleteIngredient(id: number): Promise<boolean>;
  
  // Recipes
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  getRecipeWithDetails(id: number): Promise<RecipeWithDetails | undefined>;
  getRecipesWithDetails(): Promise<RecipeWithDetails[]>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private ingredients: Map<number, Ingredient>;
  private recipes: Map<number, Recipe>;
  private currentIngredientId: number;
  private currentRecipeId: number;

  constructor() {
    this.ingredients = new Map();
    this.recipes = new Map();
    this.currentIngredientId = 1;
    this.currentRecipeId = 1;
  }

  // Ingredients methods
  async getIngredients(): Promise<Ingredient[]> {
    return Array.from(this.ingredients.values());
  }

  async getIngredient(id: number): Promise<Ingredient | undefined> {
    return this.ingredients.get(id);
  }

  async createIngredient(insertIngredient: InsertIngredient): Promise<Ingredient> {
    const id = this.currentIngredientId++;
    const ingredient: Ingredient = { 
      ...insertIngredient, 
      id,
      costPerUnit: insertIngredient.costPerUnit.toString()
    };
    this.ingredients.set(id, ingredient);
    return ingredient;
  }

  async updateIngredient(id: number, update: Partial<InsertIngredient>): Promise<Ingredient | undefined> {
    const existing = this.ingredients.get(id);
    if (!existing) return undefined;
    
    const updated: Ingredient = { 
      ...existing, 
      ...update,
      costPerUnit: update.costPerUnit ? update.costPerUnit.toString() : existing.costPerUnit
    };
    this.ingredients.set(id, updated);
    return updated;
  }

  async deleteIngredient(id: number): Promise<boolean> {
    return this.ingredients.delete(id);
  }

  // Recipes methods
  async getRecipes(): Promise<Recipe[]> {
    return Array.from(this.recipes.values());
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    return this.recipes.get(id);
  }

  async getRecipeWithDetails(id: number): Promise<RecipeWithDetails | undefined> {
    const recipe = this.recipes.get(id);
    if (!recipe) return undefined;

    const recipeIngredients = recipe.ingredients as RecipeIngredient[];
    const ingredientDetails = [];
    
    for (const ri of recipeIngredients) {
      const ingredient = this.ingredients.get(ri.ingredientId);
      if (ingredient) {
        const cost = parseFloat(ingredient.costPerUnit) * ri.quantity;
        ingredientDetails.push({
          ingredient,
          quantity: ri.quantity,
          cost
        });
      }
    }

    const totalCost = parseFloat(recipe.totalCost);
    const costPerServing = totalCost / recipe.servings;

    return {
      ...recipe,
      ingredientDetails,
      costPerServing
    };
  }

  async getRecipesWithDetails(): Promise<RecipeWithDetails[]> {
    const recipes = await this.getRecipes();
    const recipesWithDetails = [];
    
    for (const recipe of recipes) {
      const recipeWithDetails = await this.getRecipeWithDetails(recipe.id);
      if (recipeWithDetails) {
        recipesWithDetails.push(recipeWithDetails);
      }
    }
    
    return recipesWithDetails;
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const id = this.currentRecipeId++;
    
    // Calculate total cost
    let totalCost = 0;
    for (const ri of insertRecipe.ingredients) {
      const ingredient = this.ingredients.get(ri.ingredientId);
      if (ingredient) {
        totalCost += parseFloat(ingredient.costPerUnit) * ri.quantity;
      }
    }

    const recipe: Recipe = { 
      ...insertRecipe, 
      id,
      totalCost: totalCost.toFixed(2),
      ingredients: insertRecipe.ingredients as any
    };
    this.recipes.set(id, recipe);
    return recipe;
  }

  async updateRecipe(id: number, update: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const existing = this.recipes.get(id);
    if (!existing) return undefined;
    
    // Recalculate total cost if ingredients changed
    let totalCost = parseFloat(existing.totalCost);
    if (update.ingredients) {
      totalCost = 0;
      for (const ri of update.ingredients) {
        const ingredient = this.ingredients.get(ri.ingredientId);
        if (ingredient) {
          totalCost += parseFloat(ingredient.costPerUnit) * ri.quantity;
        }
      }
    }

    const updated: Recipe = { 
      ...existing, 
      ...update,
      totalCost: totalCost.toFixed(2),
      ingredients: update.ingredients ? update.ingredients as any : existing.ingredients
    };
    this.recipes.set(id, updated);
    return updated;
  }

  async deleteRecipe(id: number): Promise<boolean> {
    return this.recipes.delete(id);
  }
}

export const storage = new MemStorage();
