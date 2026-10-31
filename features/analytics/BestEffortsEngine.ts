import { ActivityDao, LocalCoordinate } from '../../database/ActivityDao';
import { BestEffortsDao, ActivityBestEffort, AthletePr } from '../../database/BestEffortsDao';

export interface BenchmarkSpec {
  name: string;
  distanceMeters: number;
}

export const STANDARD_BENCHMARKS: BenchmarkSpec[] = [
  { name: '10K', distanceMeters: 10000 },
  { name: '5K', distanceMeters: 5000 },
  { name: '2 mile', distanceMeters: 3218.69 },
  { name: '1 mile', distanceMeters: 1609.34 },
  { name: '1k', distanceMeters: 1000 },
  { name: '1/2 mile', distanceMeters: 804.67 },
  { name: '400m', distanceMeters: 400 },
];

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class BestEffortsEngine {
  /**
   * Evaluates all benchmark distances across the activity's GPS coordinates
   * using a two-pointer sliding window to find the fastest time for each benchmark.
   */
  static async computeBestEffortsForActivity(
    activityId: string,
    athleteId: string = 'athlete_self'
  ): Promise<ActivityBestEffort[]> {
    const coords = await ActivityDao.getCoordinatesForActivity(activityId);
    if (!coords || coords.length < 5) return [];

    // Precalculate cumulative distances along coordinate track
    const cumulativeDistances: number[] = new Array(coords.length).fill(0);
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const d = haversineMeters(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
      cumulativeDistances[i] = cumulativeDistances[i - 1] + d;
    }

    const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];
    const results: ActivityBestEffort[] = [];
    const now = Date.now();

    for (const benchmark of STANDARD_BENCHMARKS) {
      if (totalDistance < benchmark.distanceMeters) {
        continue; // Activity was not long enough for this benchmark
      }

      let bestTimeSeconds = Infinity;
      let bestStartIdx = 0;
      let bestEndIdx = 0;

      let left = 0;
      let right = 0;

      while (right < coords.length) {
        const windowDist = cumulativeDistances[right] - cumulativeDistances[left];

        if (windowDist >= benchmark.distanceMeters) {
          const tStart = coords[left].timestamp;
          const tEnd = coords[right].timestamp;
          const elapsedSec = Math.max(1, Math.round((tEnd - tStart) / 1000));

          if (elapsedSec < bestTimeSeconds) {
            bestTimeSeconds = elapsedSec;
            bestStartIdx = left;
            bestEndIdx = right;
          }

          left++;
        } else {
          right++;
        }
      }

      if (bestTimeSeconds !== Infinity) {
        const paceSecKm = (bestTimeSeconds / (benchmark.distanceMeters / 1000));
        const historicalPr = await BestEffortsDao.getPrForBenchmark(benchmark.name, athleteId);

        let isPr = 0;
        let rank = 2;

        if (!historicalPr || bestTimeSeconds < historicalPr.best_time_seconds) {
          isPr = 1;
          rank = 1;

          // Record new lifetime PR
          await BestEffortsDao.recordPr({
            id: `pr_${benchmark.name.replace(/[^a-zA-Z0-9]/g, '_')}_${now}`,
            athlete_id: athleteId,
            benchmark_name: benchmark.name,
            distance_meters: benchmark.distanceMeters,
            best_time_seconds: bestTimeSeconds,
            activity_id: activityId,
            achieved_timestamp: now,
            updated_at: now,
          });
        }

        const effort: ActivityBestEffort = {
          id: `effort_${activityId}_${benchmark.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
          activity_id: activityId,
          benchmark_name: benchmark.name,
          distance_meters: benchmark.distanceMeters,
          elapsed_time_seconds: bestTimeSeconds,
          pace_seconds_per_km: paceSecKm,
          start_index: bestStartIdx,
          end_index: bestEndIdx,
          start_latitude: coords[bestStartIdx].latitude,
          start_longitude: coords[bestStartIdx].longitude,
          end_latitude: coords[bestEndIdx].latitude,
          end_longitude: coords[bestEndIdx].longitude,
          rank: rank,
          is_pr: isPr,
          created_at: now,
        };

        results.push(effort);
      }
    }

    if (results.length > 0) {
      await BestEffortsDao.saveBestEfforts(results);
    }

    return results;
  }
}
