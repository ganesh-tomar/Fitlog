import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('fitlog.db');
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      servingSize TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      source TEXT NOT NULL DEFAULT 'custom',
      ingredients TEXT
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dishId INTEGER NOT NULL,
      dishName TEXT NOT NULL,
      date TEXT NOT NULL,
      servingMultiplier REAL NOT NULL DEFAULT 1,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      loggedAt TEXT NOT NULL,
      FOREIGN KEY (dishId) REFERENCES dishes (id)
    );

    CREATE TABLE IF NOT EXISTS targets (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      calories REAL NOT NULL DEFAULT 2000,
      protein REAL NOT NULL DEFAULT 120,
      carbs REAL NOT NULL DEFAULT 250,
      fat REAL NOT NULL DEFAULT 65
    );

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      age INTEGER NOT NULL,
      height REAL NOT NULL,
      weight REAL NOT NULL,
      activityLevel TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      themeColor TEXT NOT NULL DEFAULT '#2E86AB'
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      routineName TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workoutId INTEGER NOT NULL,
      name TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (workoutId) REFERENCES workouts (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exerciseId INTEGER NOT NULL,
      setNumber INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (exerciseId) REFERENCES exercises (id) ON DELETE CASCADE
    );
  `);

  // Run SQLite migration to append themeColor if the profile table already exists
  try {
    await db.execAsync("ALTER TABLE profile ADD COLUMN themeColor TEXT NOT NULL DEFAULT '#2E86AB'");
  } catch (e) {
    // Column already exists, safe to ignore
  }

  // Run SQLite migration to append ingredients if the dishes table already exists
  try {
    await db.execAsync("ALTER TABLE dishes ADD COLUMN ingredients TEXT");
  } catch (e) {
    // Column already exists, safe to ignore
  }

  // Ensure a single targets row always exists
  const targetsRow = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM targets WHERE id = 1'
  );
  if (!targetsRow) {
    await db.runAsync(
      'INSERT INTO targets (id, calories, protein, carbs, fat) VALUES (1, 2000, 120, 250, 65)'
    );
  }

  // Refresh curated dishes list with new veg-only meals and ingredients field
  await db.runAsync("DELETE FROM dishes WHERE source = 'curated'");
  await seedCuratedDishes(db);
}

async function seedCuratedDishes(db: SQLite.SQLiteDatabase) {
  const starterDishes = [
    ['Roti (Whole Wheat)', '1 piece (30g)', 85, 3, 15, 1, 'roti', 'Whole wheat flour, water'],
    ['Dal Tadka', '1 bowl (150g)', 180, 9, 22, 6, 'curry', 'Yellow lentils, onion, tomato, spices, ghee'],
    ['Paneer Butter Masala', '1 bowl (150g)', 320, 12, 18, 22, 'curry', 'Paneer, butter, cream, tomato gravy, spices'],
    ['Steamed Rice', '1 cup (150g)', 200, 4, 44, 0.5, 'rice', 'Rice, water'],
    ['Curd (Plain)', '1 bowl (150g)', 100, 6, 8, 4, 'dairy', 'Milk, curd culture'],
    ['Chapati with Sabzi', '1 plate', 250, 7, 35, 9, 'meal', 'Wheat chapati, mixed vegetable sabzi'],
    ['Protein powder', '1 scoop (30g)', 120, 25, 3, 1.5, 'protein', 'Protein powder'],
    ['Oats+ milk+cashew', '1 bowl', 450, 10, 60, 12, 'meal', 'Oats, milk, cashew'],
    ['Soya chunks curry', '1 plate', 380, 27, 25, 10, 'curry', 'Soya chunks, 1 onion, 1 tomato, 1 spoon ghee'],
    ['Cooked Rice', '1 bowl', 280, 5, 60, 1, 'rice', '1 bowl cooked rice'],
    ['Roti (4 pieces)', '4 pieces', 480, 12, 90, 4, 'roti', '4 Roti'],
    ['Dahi (Curd)', '1 katori', 100, 6, 8, 4, 'dairy', '1 Katori Dahi']
  ];

  for (const d of starterDishes) {
    await db.runAsync(
      `INSERT INTO dishes (name, servingSize, calories, protein, carbs, fat, category, source, ingredients)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'curated', ?)`,
      d
    );
  }
}
