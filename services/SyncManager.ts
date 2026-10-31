import { ActivityDao, LocalActivity } from '../database/ActivityDao';
import { ApiClient } from './ApiClient';

export class SyncManager {
  private static isSyncing = false;

  static async syncPendingActivities(): Promise<{ syncedCount: number; errors: any[] }> {
    if (this.isSyncing) {
      return { syncedCount: 0, errors: [] };
    }

    this.isSyncing = true;
    let syncedCount = 0;
    const errors: any[] = [];

    try {
      const pendingActivities = await ActivityDao.getPendingActivities();

      for (const act of pendingActivities) {
        try {
          const coords = await ActivityDao.getCoordinatesForActivity(act.id);
          const splits = await ActivityDao.getSplitsForActivity(act.id);

          const startCoord = coords.length > 0 ? coords[0] : null;
          const endCoord = coords.length > 0 ? coords[coords.length - 1] : null;

          const payload = {
            id: act.id,
            name: act.name,
            sportType: act.sport_type,
            startTime: new Date(act.start_timestamp).toISOString(),
            elapsedTimeSeconds: act.elapsed_time_seconds,
            movingTimeSeconds: act.moving_time_seconds,
            distanceMeters: act.distance_meters,
            elevationGainMeters: act.elevation_gain_meters,
            calories: act.calories,
            startLatitude: startCoord ? startCoord.latitude : null,
            startLongitude: startCoord ? startCoord.longitude : null,
            endLatitude: endCoord ? endCoord.latitude : null,
            endLongitude: endCoord ? endCoord.longitude : null,
            deviceInfo: 'Expo Go (Android)',
            coordinates: coords.map((c) => ({
              seq: c.sequence_index,
              latitude: c.latitude,
              longitude: c.longitude,
              altitude: c.altitude,
              accuracy: c.horizontal_accuracy,
              speed: c.speed,
              timestamp: new Date(c.timestamp).toISOString(),
            })),
            splits: splits.map((s) => ({
              splitNumber: s.split_number,
              distanceUnit: s.distance_unit.toLowerCase(),
              movingTimeSeconds: s.moving_time_seconds,
              elevationDeltaMeters: s.elevation_delta_meters,
            })),
          };

          await ApiClient.uploadActivity(payload);
          await ActivityDao.markActivitySynced(act.id);
          syncedCount++;
        } catch (err) {
          console.warn(`Failed to sync activity ${act.id}:`, err);
          errors.push({ id: act.id, error: err });
          await ActivityDao.markActivityFailed(act.id);
        }
      }
    } catch (globalErr) {
      console.error('Error during synchronization pass:', globalErr);
      errors.push({ id: 'global', error: globalErr });
    } finally {
      this.isSyncing = false;
    }

    return { syncedCount, errors };
  }
}
