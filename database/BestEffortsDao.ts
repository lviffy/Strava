import { getDatabase } from './DatabaseClient';

export interface ActivityBestEffort {
  id: string;
  activity_id: string;
  benchmark_name: string;
  distance_meters: number;
  elapsed_time_seconds: number;
  pace_seconds_per_km: number;
  start_index: number;
  end_index: number;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  rank: number; // 1 = PR, 2 = 2nd best, 3 = 3rd best
  is_pr: number; // 1 if PR
  created_at: number;
}

export interface AthletePr {
  id: string;
  athlete_id: string;
  benchmark_name: string;
  distance_meters: number;
  best_time_seconds: number;
  activity_id: string;
  achieved_timestamp: number;
  updated_at: number;
}

export class BestEffortsDao {
  static async saveBestEfforts(efforts: ActivityBestEffort[]): Promise<void> {
    const db = await getDatabase();
    for (const effort of efforts) {
      await db.runAsync(
        `INSERT OR REPLACE INTO activity_best_efforts (
          id, activity_id, benchmark_name, distance_meters, elapsed_time_seconds,
          pace_seconds_per_km, start_index, end_index, start_latitude, start_longitude,
          end_latitude, end_longitude, rank, is_pr, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          effort.id,
          effort.activity_id,
          effort.benchmark_name,
          effort.distance_meters,
          effort.elapsed_time_seconds,
          effort.pace_seconds_per_km,
          effort.start_index,
          effort.end_index,
          effort.start_latitude,
          effort.start_longitude,
          effort.end_latitude,
          effort.end_longitude,
          effort.rank,
          effort.is_pr,
          effort.created_at,
        ]
      );
    }
  }

  static async getBestEffortsForActivity(activityId: string): Promise<ActivityBestEffort[]> {
    const db = await getDatabase();
    return await db.getAllAsync<ActivityBestEffort>(
      'SELECT * FROM activity_best_efforts WHERE activity_id = ? ORDER BY distance_meters DESC;',
      [activityId]
    );
  }

  static async getAllAthletePrs(athleteId: string = 'athlete_self'): Promise<AthletePr[]> {
    const db = await getDatabase();
    return await db.getAllAsync<AthletePr>(
      'SELECT * FROM athlete_prs WHERE athlete_id = ? ORDER BY distance_meters DESC;',
      [athleteId]
    );
  }

  static async getPrForBenchmark(benchmarkName: string, athleteId: string = 'athlete_self'): Promise<AthletePr | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<AthletePr>(
      'SELECT * FROM athlete_prs WHERE athlete_id = ? AND benchmark_name = ? LIMIT 1;',
      [athleteId, benchmarkName]
    );
    return result || null;
  }

  static async recordPr(pr: AthletePr): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO athlete_prs (
        id, athlete_id, benchmark_name, distance_meters, best_time_seconds,
        activity_id, achieved_timestamp, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        pr.id,
        pr.athlete_id,
        pr.benchmark_name,
        pr.distance_meters,
        pr.best_time_seconds,
        pr.activity_id,
        pr.achieved_timestamp,
        pr.updated_at,
      ]
    );
  }
}
