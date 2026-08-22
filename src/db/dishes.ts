import { getDb } from './database';
import { Dish } from '../types';

export async function getAllDishes(): Promise<Dish[]> {
  const db = await getDb();
  return db.getAllAsync<Dish>('SELECT * FROM dishes ORDER BY name ASC');
}

export async function searchDishes(query: string): Promise<Dish[]> {
  const db = await getDb();
  if (!query.trim()) return getAllDishes();
  return db.getAllAsync<Dish>(
    'SELECT * FROM dishes WHERE name LIKE ? ORDER BY name ASC',
    [`%${query}%`]
  );
}

export interface NewDishInput {
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: string;
  ingredients?: string;
}

export async function addDish(input: NewDishInput): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO dishes (name, servingSize, calories, protein, carbs, fat, category, source, ingredients)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'custom', ?)`,
    [
      input.name.trim(),
      input.servingSize.trim(),
      input.calories,
      input.protein,
      input.carbs,
      input.fat,
      input.category.trim() || 'other',
      input.ingredients?.trim() || null,
    ]
  );
  return result.lastInsertRowId;
}

export async function deleteDish(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM dishes WHERE id = ?', [id]);
}

export async function updateDish(id: number, input: NewDishInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE dishes SET name = ?, servingSize = ?, calories = ?, protein = ?, carbs = ?, fat = ?, category = ?, ingredients = ?
     WHERE id = ?`,
    [
      input.name.trim(),
      input.servingSize.trim(),
      input.calories,
      input.protein,
      input.carbs,
      input.fat,
      input.category.trim() || 'other',
      input.ingredients?.trim() || null,
      id,
    ]
  );
  await db.runAsync(
    `UPDATE logs SET
       dishName = ?,
       calories = ? * servingMultiplier,
       protein = ? * servingMultiplier,
       carbs = ? * servingMultiplier,
       fat = ? * servingMultiplier
     WHERE dishId = ?`,
    [
      input.name.trim(),
      input.calories,
      input.protein,
      input.carbs,
      input.fat,
      id,
    ]
  );
}

export async function getDishById(id: number): Promise<Dish | null> {
  const db = await getDb();
  return db.getFirstAsync<Dish>('SELECT * FROM dishes WHERE id = ?', [id]);
}
