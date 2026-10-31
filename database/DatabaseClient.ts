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

    CREATE INDEX IF NOT EXISTS idx_activities_sync ON activities (sync_status);
    CREATE INDEX IF NOT EXISTS idx_activities_date ON activities (start_timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_coords_act_seq ON activity_coordinates (activity_id, sequence_index ASC);
  `);

  dbInstance = db;
  return dbInstance;
}
