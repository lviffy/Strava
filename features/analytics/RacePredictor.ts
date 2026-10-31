import { PredictionsDao, PerformancePrediction } from '../../database/PredictionsDao';
import { BestEffortsDao } from '../../database/BestEffortsDao';

export class RacePredictor {
  /**
   * Predicts race completion times for 5K, 10K, Half Marathon, Marathon
   * using Pete Riegel's power model based on the athlete's best recent effort:
   * T2 = T1 * (D2 / D1)^1.06
   */
  static async updatePredictions(athleteId: string = 'athlete_self'): Promise<PerformancePrediction[]> {
    const prs = await BestEffortsDao.getAllAthletePrs(athleteId);
    if (!prs || prs.length === 0) {
      return await PredictionsDao.getPredictions(athleteId);
    }

    // Pick best reference effort (prefer 5K or 10K if available, otherwise longest effort)
    const refPr = prs.find((p) => p.benchmark_name === '5K') || prs[0];
    const d1 = refPr.distance_meters;
    const t1 = refPr.best_time_seconds;

    const targets = [
      { key: '5K', distance: 5000 },
      { key: '10K', distance: 10000 },
      { key: 'Half', distance: 21097.5 },
      { key: 'Marathon', distance: 42195 },
    ];

    const currentPredictions = await PredictionsDao.getPredictions(athleteId);
    const existingMap = new Map(currentPredictions.map((p) => [p.distance_key, p]));
    const updatedPredictions: PerformancePrediction[] = [];
    const now = Date.now();

    for (const target of targets) {
      // Riegel's formula: T2 = T1 * (D2 / D1)^1.06
      const ratio = target.distance / d1;
      const predictedSeconds = Math.round(t1 * Math.pow(ratio, 1.06));
      const predictedPaceKm = predictedSeconds / (target.distance / 1000);

      const existing = existingMap.get(target.key);
      const deltaSeconds = existing
        ? predictedSeconds - existing.predicted_time_seconds
        : 0;

      const prediction: PerformancePrediction = {
        id: `pred_${target.key.toLowerCase()}`,
        athlete_id: athleteId,
        distance_key: target.key,
        predicted_time_seconds: predictedSeconds,
        predicted_pace_seconds_km: predictedPaceKm,
        delta_seconds: deltaSeconds,
        updated_at: now,
      };

      await PredictionsDao.savePrediction(prediction);
      updatedPredictions.push(prediction);
    }

    return updatedPredictions;
  }
}
