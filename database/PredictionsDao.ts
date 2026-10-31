import { getDatabase } from './DatabaseClient';

export interface PerformancePrediction {
  id: string;
  athlete_id: string;
  distance_key: string;
  predicted_time_seconds: number;
  predicted_pace_seconds_km: number;
  delta_seconds: number;
  updated_at: number;
}

export class PredictionsDao {
  static async getPredictions(athleteId: string = 'athlete_self'): Promise<PerformancePrediction[]> {
    const db = await getDatabase();
    return await db.getAllAsync<PerformancePrediction>(
      'SELECT * FROM performance_predictions WHERE athlete_id = ? ORDER BY predicted_time_seconds ASC;',
      [athleteId]
    );
  }

  static async savePrediction(prediction: PerformancePrediction): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO performance_predictions (
        id, athlete_id, distance_key, predicted_time_seconds, predicted_pace_seconds_km,
        delta_seconds, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        prediction.id,
        prediction.athlete_id,
        prediction.distance_key,
        prediction.predicted_time_seconds,
        prediction.predicted_pace_seconds_km,
        prediction.delta_seconds,
        prediction.updated_at,
      ]
    );
  }
}
