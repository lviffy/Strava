import * as Location from 'expo-location';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useRecordingStore } from '../../store/useRecordingStore';
import { GpsPointFilter, PaceSmoother, LocationPoint } from './GpsPointFilter';
import { ActivityDao } from '../../database/ActivityDao';
import { formatPace, formatDistance } from './Calculations';
import { AudioCues } from './AudioCues';
import { BeaconService } from '../beacon/BeaconService';

class GpsEngineService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private filter = new GpsPointFilter();
  private paceSmoother = new PaceSmoother();
  private sequenceCounter = 0;
  private lastSplitDistance = 0; // In meters
  private consecutiveLowSpeedCount = 0; // For auto-pause detection

  public async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  public async startRecording(activityId: string, athleteId = 'athlete_self'): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Foreground location permission is required for activity recording.');
    }

    // 1. Keep screen awake during workout in Expo Go
    try {
      await activateKeepAwakeAsync('active_workout_session');
    } catch {
      // Ignored if not supported on platform
    }

    // 2. Trigger Haptic Pulse
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    // 3. Reset internal counters
    this.filter.reset();
    this.paceSmoother.reset();
    this.sequenceCounter = 0;
    this.lastSplitDistance = 0;
    this.consecutiveLowSpeedCount = 0;

    // 4. Initialize SQLite Record
    await ActivityDao.startNewActivity({
      id: activityId,
      athlete_id: athleteId,
      name: 'Morning Activity',
      sport_type: useRecordingStore.getState().sportType,
      start_timestamp: Date.now(),
    });

    // 5. Update Zustand Store
    useRecordingStore.getState().startSession(activityId);

    // 6. Start Live Beacon Safety Session
    await BeaconService.startSession(activityId);

    // 7. Start 1-second interval timer for elapsed & moving duration
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      useRecordingStore.getState().incrementTimers();
    }, 1000);

    // 8. Subscribe to high-accuracy GPS fixes
    await this.startLocationWatch();
  }

  private async startLocationWatch(): Promise<void> {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,   // 1 Hz
        distanceInterval: 1,  // 1 meter minimum movement
      },
      (loc) => this.handleLocationSample(loc)
    );
  }

  private async handleLocationSample(loc: Location.LocationObject): Promise<void> {
    const store = useRecordingStore.getState();
    const { status, activityId, distanceMeters } = store;

    // Always update satellite accuracy indicator
    store.setSatelliteAccuracy(loc.coords.accuracy);

    const point: LocationPoint = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      altitude: loc.coords.altitude,
      accuracy: loc.coords.accuracy,
      speed: loc.coords.speed,
      bearing: loc.coords.heading,
      timestamp: loc.timestamp,
    };

    store.setCurrentLocation(point);

    if (status !== 'RECORDING' && status !== 'AUTOPAUSED') {
      return;
    }

    // Process through mathematical GPS filter
    const filterResult = this.filter.processPoint(point);
    if (!filterResult.accepted) {
      return;
    }

    // Handle Auto-Pause / Auto-Resume heuristics
    const speed = loc.coords.speed ?? 0;
    if (status === 'RECORDING' && speed < 0.6 && filterResult.distanceDelta < 1.0) {
      this.consecutiveLowSpeedCount++;
      if (this.consecutiveLowSpeedCount >= 4) {
        store.autoPause();
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {}
      }
    } else if (status === 'AUTOPAUSED' && speed >= 1.0 && filterResult.distanceDelta >= 2.0) {
      this.consecutiveLowSpeedCount = 0;
      store.autoResume();
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    } else if (speed >= 0.8) {
      this.consecutiveLowSpeedCount = 0;
    }

    // Only accumulate stats when actively RECORDING
    if (store.status === 'RECORDING') {
      const timeDeltaSec = 1.0;
      this.paceSmoother.addSample(filterResult.distanceDelta, timeDeltaSec);
      const currentPace = this.paceSmoother.getPaceSecondsPerKilometer();

      store.updateStats(
        filterResult.distanceDelta,
        filterResult.elevationDelta,
        currentPace,
        loc.coords.speed
      );

      // Add to polyline coordinates
      store.addCoordinate({
        latitude: point.latitude,
        longitude: point.longitude,
      });

      // Write immediately to SQLite
      if (activityId) {
        this.sequenceCounter++;
        await ActivityDao.appendCoordinate({
          activity_id: activityId,
          sequence_index: this.sequenceCounter,
          latitude: point.latitude,
          longitude: point.longitude,
          altitude: point.altitude,
          horizontal_accuracy: point.accuracy,
          speed: point.speed,
          bearing: point.bearing,
          timestamp: point.timestamp,
          is_paused: 0,
        });

        // Periodic periodic progress checkpoint in SQLite (every 10 seconds)
        if (this.sequenceCounter % 10 === 0) {
          await ActivityDao.updateActivityProgress(
            activityId,
            store.elapsedTime,
            store.movingTime,
            store.distanceMeters,
            store.elevationGainMeters,
            store.distanceMeters > 0 && store.movingTime > 0 ? store.distanceMeters / store.movingTime : 0,
            0
          );
        }

        // Check 1 km milestone split
        this.checkSplitMilestone(store.distanceMeters, store.movingTime);
      }
    }
  }

  private async checkSplitMilestone(currentDistanceMeters: number, movingTimeSeconds: number): Promise<void> {
    const nextSplitTarget = (Math.floor(this.lastSplitDistance / 1000) + 1) * 1000;
    if (currentDistanceMeters >= nextSplitTarget) {
      const splitNumber = Math.floor(nextSplitTarget / 1000);
      this.lastSplitDistance = currentDistanceMeters;

      // Audio Announcement via AudioCues Voice Engine
      await AudioCues.announceSplit(
        splitNumber,
        useRecordingStore.getState().currentPaceSecKm ?? 0,
        movingTimeSeconds
      );
    }
  }

  public async pauseRecording(): Promise<void> {
    useRecordingStore.getState().pauseSession();
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  }

  public async resumeRecording(): Promise<void> {
    useRecordingStore.getState().resumeSession();
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  }

  public async stopRecording(): Promise<void> {
    // 1. Release Keep-Awake lock
    try {
      await deactivateKeepAwake('active_workout_session');
    } catch {}

    // 2. Stop Beacon live safety session
    BeaconService.stopSession();

    // 3. Clear timers and listeners
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    useRecordingStore.getState().stopSession();
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
  }

  public async discardRecording(activityId: string): Promise<void> {
    await this.stopRecording();
    await ActivityDao.discardActivity(activityId);
    useRecordingStore.getState().resetSession();
  }
}

export const GpsEngine = new GpsEngineService();
