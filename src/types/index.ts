export type DishSource = 'curated' | 'custom';

export interface Dish {
  id: number;
  name: string;
  servingSize: string; // e.g. "1 bowl (150g)"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: string; // e.g. "curry", "roti", "rice", "snack", "dessert"
  source: DishSource;
  ingredients?: string;
}

export interface LogEntry {
  id: number;
  dishId: number;
  dishName: string;
  date: string; // "YYYY-MM-DD"
  servingMultiplier: number; // 1 = one full serving
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string; // ISO timestamp
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Targets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserProfile {
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  height: number;
  weight: number;
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  completed: boolean;
  themeColor: string;
}

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  AddDish: { editDishId?: number } | undefined;
  LogDish: { dish: Dish };
};

export type TabParamList = {
  Today: undefined;
  Dishes: undefined;
  Workout: undefined;
  History: undefined;
  Targets: undefined;
  Profile: undefined;
};
