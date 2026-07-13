import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'app.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS meal_options (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('cafe','lancheManha','lancheTarde','jantar')),
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  day_of_week INTEGER,
  time TEXT NOT NULL DEFAULT '07:00',
  cardio_modality TEXT NOT NULL DEFAULT '',
  cardio_duration TEXT NOT NULL DEFAULT '',
  cardio_extra TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS workout_warmup_items (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS workout_stretch_items (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  photo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS workout_core_items (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  photo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets TEXT NOT NULL DEFAULT '',
  reps TEXT NOT NULL DEFAULT '',
  load TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS day_blocks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  time TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('plain','meal','lunch')),
  label TEXT NOT NULL DEFAULT '',
  meal_type TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS day_selections (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  cafe_selected_id TEXT,
  lanche_manha_selected_id TEXT,
  lanche_tarde_selected_id TEXT,
  jantar_selected_id TEXT,
  almoco_checked INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS completions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id TEXT NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('stretches','exercises')),
  item_id TEXT NOT NULL,
  date TEXT NOT NULL,
  PRIMARY KEY (user_id, workout_id, section, item_id, date)
);

CREATE TABLE IF NOT EXISTS goals (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  project TEXT NOT NULL,
  water TEXT NOT NULL,
  protein TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals_timeline (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  foco TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
`);
