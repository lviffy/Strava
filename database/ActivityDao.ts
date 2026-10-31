import { getDatabase } from './DatabaseClient';

export interface LocalActivity {
  id: string;
  athlete_id: string;
  name: string;
  sport_type: string;
  start_timestamp: number;
  end_timestamp: number | null;
  elapsed_time_seconds: number;
  moving_time_seconds: number;
  distance_meters: number;
  elevation_gain_meters: number;
  calories: number;
  average_speed_mps: number;
  max_speed_mps: number;
  start_battery_level: number | null;
  end_battery_level: number | null;
  sync_status: 'UNFINISHED' | 'PENDING' | 'SYNCED' | 'FAILED';
  created_at: number;
}

export interface LocalCoordinate {
  id?: number;
  activity_id: string;
  sequence_index: number;
  latitude: number;
  longitude: number;
  altitude: number | null;
  horizontal_accuracy: number | null;
  speed: number | null;
  bearing: number | null;
  timestamp: number;
  is_paused: number;
}

export interface LocalSplit {
  id?: number;
  activity_id: string;
  split_number: number;
  distance_unit: 'KM' | 'MILE';
  elapsed_time_seconds: number;
  moving_time_seconds: number;
  elevation_delta_meters: number;
  average_pace_sec_per_unit: number;
}

export class ActivityDao {
  static async startNewActivity(activity: Partial<LocalActivity> & { id: string; athlete_id: string }): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO activities (
        id, athlete_id, name, sport_type, start_timestamp, elapsed_time_seconds, 
        moving_time_seconds, distance_meters, elevation_gain_meters, sync_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activity.id,
        activity.athlete_id,
        activity.name || 'Activity',
        activity.sport_type || 'Run',
        activity.start_timestamp || Date.now(),
        0,
        0,
        0.0,
        0.0,
        'UNFINISHED',
        Date.now(),
      ]
    );
  }

  static async appendCoordinate(coord: LocalCoordinate): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO activity_coordinates (
        activity_id, sequence_index, latitude, longitude, altitude, 
        horizontal_accuracy, speed, bearing, timestamp, is_paused
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        coord.activity_id,
        coord.sequence_index,
        coord.latitude,
        coord.longitude,
        coord.altitude,
        coord.horizontal_accuracy,
        coord.speed,
        coord.bearing,
        coord.timestamp,
        coord.is_paused ? 1 : 0,
      ]
    );
  }

  static async updateActivityProgress(
    id: string,
    elapsedSec: number,
    movingSec: number,
    distanceMeters: number,
    elevationGain: number,
    avgSpeed: number,
    maxSpeed: number
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE activities SET 
        elapsed_time_seconds = ?, 
        moving_time_seconds = ?, 
        distance_meters = ?, 
        elevation_gain_meters = ?,
        average_speed_mps = ?,
        max_speed_mps = ?
      WHERE id = ?`,
      [elapsedSec, movingSec, distanceMeters, elevationGain, avgSpeed, maxSpeed, id]
    );
  }

  static async finalizeActivity(
    id: string,
    name: string,
    sportType: string,
    endTimestamp: number,
    calories: number
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE activities SET 
        name = ?,
        sport_type = ?,
        end_timestamp = ?,
        calories = ?,
        sync_status = 'PENDING'
      WHERE id = ?`,
      [name, sportType, endTimestamp, calories, id]
    );
  }

  static async saveSplits(splits: LocalSplit[]): Promise<void> {
    const db = await getDatabase();
    for (const split of splits) {
      await db.runAsync(
        `INSERT INTO activity_splits (
          activity_id, split_number, distance_unit, elapsed_time_seconds, 
          moving_time_seconds, elevation_delta_meters, average_pace_sec_per_unit
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          split.activity_id,
          split.split_number,
          split.distance_unit,
          split.elapsed_time_seconds,
          split.moving_time_seconds,
          split.elevation_delta_meters,
          split.average_pace_sec_per_unit,
        ]
      );
    }
  }

  static async getUnfinishedActivity(): Promise<LocalActivity | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<LocalActivity>(
      `SELECT * FROM activities WHERE sync_status = 'UNFINISHED' ORDER BY start_timestamp DESC LIMIT 1;`
    );
    return result || null;
  }

  static async getAllSavedActivities(): Promise<LocalActivity[]> {
    const db = await getDatabase();
    const results = await db.getAllAsync<LocalActivity>(
      `SELECT * FROM activities WHERE sync_status != 'UNFINISHED' ORDER BY start_timestamp DESC;`
    );
    return results;
  }

  static async getActivityById(id: string): Promise<LocalActivity | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<LocalActivity>(
      `SELECT * FROM activities WHERE id = ?;`,
      [id]
    );
    return result || null;
  }

  static async getCoordinatesForActivity(activityId: string): Promise<LocalCoordinate[]> {
    const db = await getDatabase();
    const results = await db.getAllAsync<LocalCoordinate>(
      `SELECT * FROM activity_coordinates WHERE activity_id = ? ORDER BY sequence_index ASC;`,
      [activityId]
    );
    return results;
  }

  static async getSplitsForActivity(activityId: string): Promise<LocalSplit[]> {
    const db = await getDatabase();
    const results = await db.getAllAsync<LocalSplit>(
      `SELECT * FROM activity_splits WHERE activity_id = ? ORDER BY split_number ASC;`,
      [activityId]
    );
    return results;
  }

  static async discardActivity(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM activities WHERE id = ?;`, [id]);
  }

  static async getPendingActivities(): Promise<LocalActivity[]> {
    const db = await getDatabase();
    const results = await db.getAllAsync<LocalActivity>(
      `SELECT * FROM activities WHERE sync_status = 'PENDING' ORDER BY start_timestamp ASC;`
    );
    return results;
  }

  static async markActivitySynced(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`UPDATE activities SET sync_status = 'SYNCED' WHERE id = ?;`, [id]);
  }

  static async markActivityFailed(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`UPDATE activities SET sync_status = 'FAILED' WHERE id = ?;`, [id]);
  }
}
