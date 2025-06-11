import { pgTable, text, serial, integer, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  servings: integer("servings").notNull(),
  ingredients: jsonb("ingredients").notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  totalCost: true,
}).extend({
  ingredients: z.array(z.object({
    ingredientId: z.number(),
    quantity: z.number().positive(),
  })),
});

export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Ingredient = typeof ingredients.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

export interface RecipeIngredient {
  ingredientId: number;
  quantity: number;
}

export interface RecipeWithDetails extends Recipe {
  ingredientDetails: Array<{
    ingredient: Ingredient;
    quantity: number;
    cost: number;
  }>;
  costPerServing: number;
}
