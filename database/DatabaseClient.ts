import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync('strava_local.db');

  // Enable WAL (Write-Ahead Logging) mode for concurrent high-speed GPS writes
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Initialize schema
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      athlete_id TEXT NOT NULL,
      name TEXT NOT NULL,
      sport_type TEXT NOT NULL,
      start_timestamp INTEGER NOT NULL,
      end_timestamp INTEGER,
      elapsed_time_seconds INTEGER NOT NULL,
      moving_time_seconds INTEGER NOT NULL,
      distance_meters REAL NOT NULL DEFAULT 0.0,
      elevation_gain_meters REAL DEFAULT 0.0,
      calories INTEGER DEFAULT 0,
      average_speed_mps REAL DEFAULT 0.0,
      max_speed_mps REAL DEFAULT 0.0,
      start_battery_level REAL,
      end_battery_level REAL,
      gear_id TEXT,
      sync_status TEXT NOT NULL DEFAULT 'UNFINISHED',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_coordinates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id TEXT NOT NULL,
      sequence_index INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      altitude REAL,
      horizontal_accuracy REAL,
      speed REAL,
      bearing REAL,
      timestamp INTEGER NOT NULL,
      is_paused INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (activity_id) REFERENCES activities (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_splits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id TEXT NOT NULL,
      split_number INTEGER NOT NULL,
      distance_unit TEXT NOT NULL,
      elapsed_time_seconds INTEGER NOT NULL,
      moving_time_seconds INTEGER NOT NULL,
      elevation_delta_meters REAL DEFAULT 0.0,
      average_pace_sec_per_unit REAL NOT NULL,
      FOREIGN KEY (activity_id) REFERENCES activities (id) ON DELETE CASCADE
    );

    -- Reverse-Engineered Strava Gear Table
    CREATE TABLE IF NOT EXISTS gear (
      id TEXT PRIMARY KEY,
      athlete_id TEXT NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      type TEXT NOT NULL, -- 'Shoes' | 'Bike'
      distance_meters REAL NOT NULL DEFAULT 0.0,
      max_distance_meters REAL NOT NULL DEFAULT 600000.0,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_retired INTEGER NOT NULL DEFAULT 0,
      default_sports TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL
    );

    -- Reverse-Engineered Strava Beacon Contacts Table
    CREATE TABLE IF NOT EXISTS beacon_contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      relation TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    -- Reverse-Engineered Strava Privacy Zones Table
    CREATE TABLE IF NOT EXISTS privacy_zones (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      radius_meters REAL NOT NULL DEFAULT 500.0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    -- Athlete Lifetime Personal Records
    CREATE TABLE IF NOT EXISTS athlete_prs (
      id TEXT PRIMARY KEY,
      athlete_id TEXT NOT NULL,
      benchmark_name TEXT NOT NULL,
      distance_meters REAL NOT NULL,
      best_time_seconds INTEGER NOT NULL,
      activity_id TEXT NOT NULL,
      achieved_timestamp INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Activity Best Efforts (Per-Workout Milestones)
    CREATE TABLE IF NOT EXISTS activity_best_efforts (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL,
      benchmark_name TEXT NOT NULL,
      distance_meters REAL NOT NULL,
      elapsed_time_seconds INTEGER NOT NULL,
      pace_seconds_per_km REAL NOT NULL,
      start_index INTEGER NOT NULL,
      end_index INTEGER NOT NULL,
      start_latitude REAL NOT NULL,
      start_longitude REAL NOT NULL,
      end_latitude REAL NOT NULL,
      end_longitude REAL NOT NULL,
      rank INTEGER NOT NULL DEFAULT 1,
      is_pr INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    -- Performance Predictions (Race Predictor)
    CREATE TABLE IF NOT EXISTS performance_predictions (
      id TEXT PRIMARY KEY,
      athlete_id TEXT NOT NULL,
      distance_key TEXT NOT NULL,
      predicted_time_seconds INTEGER NOT NULL,
      predicted_pace_seconds_km REAL NOT NULL,
      delta_seconds INTEGER DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    -- Activity Athlete Intelligence Summaries
    CREATE TABLE IF NOT EXISTS activity_insights (
      activity_id TEXT PRIMARY KEY,
      summary_headline TEXT NOT NULL,
      full_critique TEXT NOT NULL,
      anaerobic_pct INTEGER DEFAULT 0,
      aerobic_pct INTEGER DEFAULT 0,
      cadence_rating TEXT,
      split_strategy TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_activities_sync ON activities (sync_status);
    CREATE INDEX IF NOT EXISTS idx_activities_date ON activities (start_timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_coords_act_seq ON activity_coordinates (activity_id, sequence_index ASC);
    CREATE INDEX IF NOT EXISTS idx_gear_athlete ON gear (athlete_id, is_retired);
    CREATE INDEX IF NOT EXISTS idx_efforts_act ON activity_best_efforts (activity_id);
    CREATE INDEX IF NOT EXISTS idx_prs_athlete ON athlete_prs (athlete_id, benchmark_name);
  `);

  // Safe migration for existing activities table lacking gear_id
  try {
    await db.execAsync('ALTER TABLE activities ADD COLUMN gear_id TEXT;');
  } catch {
    // Column already exists
  }

  // Seed default athlete gear if table is empty
  const existingGear = await db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM gear;');
  if (!existingGear || existingGear.count === 0) {
    const now = Date.now();
    await db.runAsync(
      `INSERT INTO gear (id, athlete_id, name, brand, model, type, distance_meters, max_distance_meters, is_default, is_retired, default_sports, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      ['gear_shoe_1', 'athlete_self', 'Nike Pegasus 41', 'Nike', 'Pegasus 41', 'Shoes', 142500.0, 600000.0, 1, 0, 'Run,Walk', now]
    );
    await db.runAsync(
      `INSERT INTO gear (id, athlete_id, name, brand, model, type, distance_meters, max_distance_meters, is_default, is_retired, default_sports, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      ['gear_bike_1', 'athlete_self', 'Specialized Tarmac SL8', 'Specialized', 'Tarmac SL8', 'Bike', 428000.0, 5000000.0, 1, 0, 'Ride', now]
    );
  }

  // Seed default privacy zone (e.g. Home location)
  const existingPrivacy = await db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM privacy_zones;');
  if (!existingPrivacy || existingPrivacy.count === 0) {
    await db.runAsync(
      `INSERT INTO privacy_zones (id, name, address, latitude, longitude, radius_meters, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      ['pz_home', 'Home', 'Presidio Park, San Francisco, CA', 37.798, -122.466, 500.0, 1, Date.now()]
    );
  }

  // Seed default safety beacon contact
  const existingBeacon = await db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM beacon_contacts;');
  if (!existingBeacon || existingBeacon.count === 0) {
    await db.runAsync(
      `INSERT INTO beacon_contacts (id, name, phone_number, relation, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?);`,
      ['bc_1', 'Sarah (Emergency Contact)', '+1 (555) 382-9104', 'Partner', 1, Date.now()]
    );
  }

  // Seed default performance predictions (matches Strava Screenshot 2: 5K 28:26, 10K 1:00:04)
  const existingPredictions = await db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM performance_predictions;');
  if (!existingPredictions || existingPredictions.count === 0) {
    const now = Date.now();
    await db.runAsync(
      `INSERT INTO performance_predictions (id, athlete_id, distance_key, predicted_time_seconds, predicted_pace_seconds_km, delta_seconds, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      ['pred_5k', 'athlete_self', '5K', 1706, 341.2, -100, now]
    );
    await db.runAsync(
      `INSERT INTO performance_predictions (id, athlete_id, distance_key, predicted_time_seconds, predicted_pace_seconds_km, delta_seconds, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      ['pred_10k', 'athlete_self', '10K', 3604, 360.4, -70, now]
    );
    await db.runAsync(
      `INSERT INTO performance_predictions (id, athlete_id, distance_key, predicted_time_seconds, predicted_pace_seconds_km, delta_seconds, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      ['pred_half', 'athlete_self', 'Half', 8040, 381.1, -120, now]
    );
  }

  dbInstance = db;
  return dbInstance;
}
