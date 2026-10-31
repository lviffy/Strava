import { create } from 'zustand';
import { LocationPoint } from '../features/recording/GpsPointFilter';
import { LocalSplit } from '../database/ActivityDao';

export type RecordingStatus = 'IDLE' | 'PREPARING' | 'RECORDING' | 'PAUSED' | 'AUTOPAUSED' | 'SAVED';
export type SportType = 'Run' | 'Ride' | 'Walk' | 'Hike';

interface RecordingStore {
  status: RecordingStatus;
  activityId: string | null;
  sportType: SportType;
  elapsedTime: number;          // Total wall-clock duration in seconds
  movingTime: number;           // Active moving duration in seconds
  distanceMeters: number;       // Cumulative meters
  elevationGainMeters: number;  // Cumulative climb in meters
  currentPaceSecKm: number | null;
  averagePaceSecKm: number | null;
  currentSpeedMps: number | null;
  calories: number;
  satelliteAccuracy: number | null;
  currentLocation: LocationPoint | null;
  coordinates: { latitude: number; longitude: number }[];
  splits: LocalSplit[];
  selectedRoute: {
    id: string;
    name: string;
    sportType: SportType;
    coordinates: { latitude: number; longitude: number }[];
  } | null;

  // Actions
  setSelectedRoute: (
    route: {
      id: string;
      name: string;
      sportType: SportType;
      coordinates: { latitude: number; longitude: number }[];
    } | null
  ) => void;
  setStatus: (status: RecordingStatus) => void;
  setSportType: (sport: SportType) => void;
  startSession: (id: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  autoPause: () => void;
  autoResume: () => void;
  stopSession: () => void;
  resetSession: () => void;
  setSatelliteAccuracy: (accuracy: number | null) => void;
  setCurrentLocation: (location: LocationPoint) => void;
  addCoordinate: (coord: { latitude: number; longitude: number }) => void;
  incrementTimers: () => void;
  updateStats: (
    distanceDelta: number,
    elevationDelta: number,
    currentPace: number | null,
    currentSpeed: number | null
  ) => void;
  setSplits: (splits: LocalSplit[]) => void;
  restoreSession: (data: Partial<RecordingStore>) => void;
}

export const useRecordingStore = create<RecordingStore>((set, get) => ({
  status: 'IDLE',
  activityId: null,
  sportType: 'Run',
  elapsedTime: 0,
  movingTime: 0,
  distanceMeters: 0,
  elevationGainMeters: 0,
  currentPaceSecKm: null,
  averagePaceSecKm: null,
  currentSpeedMps: null,
  calories: 0,
  satelliteAccuracy: null,
  currentLocation: null,
  coordinates: [],
  splits: [],
  selectedRoute: null,

  setSelectedRoute: (selectedRoute) => set({ selectedRoute }),
  setStatus: (status) => set({ status }),
  setSportType: (sportType) => set({ sportType }),

  startSession: (id) =>
    set({
      activityId: id,
      status: 'RECORDING',
      elapsedTime: 0,
      movingTime: 0,
      distanceMeters: 0,
      elevationGainMeters: 0,
      currentPaceSecKm: null,
      averagePaceSecKm: null,
      currentSpeedMps: 0,
      calories: 0,
      coordinates: [],
      splits: [],
    }),

  pauseSession: () => set({ status: 'PAUSED', currentPaceSecKm: null, currentSpeedMps: 0 }),
  resumeSession: () => set({ status: 'RECORDING' }),
  autoPause: () => set({ status: 'AUTOPAUSED', currentPaceSecKm: null, currentSpeedMps: 0 }),
  autoResume: () => set({ status: 'RECORDING' }),
  stopSession: () => set({ status: 'SAVED', currentPaceSecKm: null, currentSpeedMps: 0 }),

  resetSession: () =>
    set({
      status: 'IDLE',
      activityId: null,
      elapsedTime: 0,
      movingTime: 0,
      distanceMeters: 0,
      elevationGainMeters: 0,
      currentPaceSecKm: null,
      averagePaceSecKm: null,
      currentSpeedMps: null,
      calories: 0,
      coordinates: [],
      splits: [],
    }),

  setSatelliteAccuracy: (satelliteAccuracy) => set({ satelliteAccuracy }),
  setCurrentLocation: (currentLocation) => set({ currentLocation }),
  addCoordinate: (coord) =>
    set((state) => ({
      coordinates: [...state.coordinates, coord],
    })),

  incrementTimers: () => {
    const { status, elapsedTime, movingTime } = get();
    if (status === 'RECORDING') {
      set({
        elapsedTime: elapsedTime + 1,
        movingTime: movingTime + 1,
      });
    } else if (status === 'PAUSED' || status === 'AUTOPAUSED') {
      set({
        elapsedTime: elapsedTime + 1,
      });
    }
  },

  updateStats: (distanceDelta, elevationDelta, currentPace, currentSpeed) => {
    const { distanceMeters, elevationGainMeters, movingTime, sportType } = get();
    const newDistance = distanceMeters + distanceDelta;
    const newElevation = elevationGainMeters + elevationDelta;

    const avgPace =
      newDistance > 50 && movingTime > 0 ? (movingTime / (newDistance / 1000)) : null;

    // Approximate calories burned (MET based)
    // Run: ~1 kcal/kg/km, Ride: ~0.4 kcal/kg/km. Assumed 70kg weight.
    const factor = sportType === 'Ride' ? 0.4 : 1.0;
    const estimatedCalories = Math.floor((newDistance / 1000) * 70 * factor);

    set({
      distanceMeters: newDistance,
      elevationGainMeters: newElevation,
      currentPaceSecKm: currentPace,
      averagePaceSecKm: avgPace,
      currentSpeedMps: currentSpeed,
      calories: estimatedCalories,
    });
  },

  setSplits: (splits) => set({ splits }),

  restoreSession: (data) => set((state) => ({ ...state, ...data })),
}));
