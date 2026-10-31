import { calculateHaversineDistance } from './Calculations';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  bearing: number | null;
  timestamp: number;
}

export class GpsPointFilter {
  private lastAcceptedPoint: LocationPoint | null = null;
  private readonly MAX_HORIZONTAL_ACCURACY_METERS = 25.0;
  private readonly MAX_PLAUSIBLE_SPEED_MPS = 45.0; // 162 km/h
  private readonly MIN_DISPLACEMENT_METERS = 1.5;

  public processPoint(point: LocationPoint): {
    accepted: boolean;
    distanceDelta: number;
    elevationDelta: number;
    reason?: string;
  } {
    // 1. Accuracy Check
    if (point.accuracy === null || point.accuracy > this.MAX_HORIZONTAL_ACCURACY_METERS) {
      return { accepted: false, distanceDelta: 0, elevationDelta: 0, reason: 'LOW_ACCURACY' };
    }

    if (!this.lastAcceptedPoint) {
      this.lastAcceptedPoint = point;
      return { accepted: true, distanceDelta: 0, elevationDelta: 0 };
    }

    const deltaDistance = calculateHaversineDistance(
      this.lastAcceptedPoint.latitude,
      this.lastAcceptedPoint.longitude,
      point.latitude,
      point.longitude
    );

    const deltaTimeSeconds = (point.timestamp - this.lastAcceptedPoint.timestamp) / 1000;

    // 2. Anomaly Check
    if (deltaTimeSeconds <= 0) {
      return { accepted: false, distanceDelta: 0, elevationDelta: 0, reason: 'INVALID_TIMESTAMP' };
    }

    // 3. Teleportation / Jump Check
    const calculatedSpeed = deltaDistance / deltaTimeSeconds;
    if (calculatedSpeed > this.MAX_PLAUSIBLE_SPEED_MPS) {
      return { accepted: false, distanceDelta: 0, elevationDelta: 0, reason: 'TELEPORTATION_SPIKE' };
    }

    // 4. Elevation calculation with hysteresis threshold (+3m to avoid noise)
    let deltaElevation = 0;
    if (point.altitude !== null && this.lastAcceptedPoint.altitude !== null) {
      const diff = point.altitude - this.lastAcceptedPoint.altitude;
      if (diff > 1.0) {
        deltaElevation = diff;
      }
    }

    // 5. Stationary Jitter Check
    if (deltaDistance < this.MIN_DISPLACEMENT_METERS && (point.speed ?? 0) < 0.5) {
      return { accepted: true, distanceDelta: 0, elevationDelta: deltaElevation, reason: 'STATIONARY_DRIFT' };
    }

    this.lastAcceptedPoint = point;
    return { accepted: true, distanceDelta: deltaDistance, elevationDelta: deltaElevation };
  }

  public reset(): void {
    this.lastAcceptedPoint = null;
  }
}

export class PaceSmoother {
  private buffer: { distance: number; timeSec: number }[] = [];
  private readonly WINDOW_SIZE = 5;

  public addSample(distanceMeters: number, timeDeltaSeconds: number): void {
    if (distanceMeters > 0 && timeDeltaSeconds > 0) {
      this.buffer.push({ distance: distanceMeters, timeSec: timeDeltaSeconds });
      if (this.buffer.length > this.WINDOW_SIZE) {
        this.buffer.shift();
      }
    }
  }

  public getPaceSecondsPerKilometer(): number | null {
    if (this.buffer.length === 0) return null;
    const totalDist = this.buffer.reduce((acc, s) => acc + s.distance, 0);
    const totalTime = this.buffer.reduce((acc, s) => acc + s.timeSec, 0);

    if (totalDist < 3.0 || totalTime <= 0) return null;

    const speedMps = totalDist / totalTime;
    return 1000 / speedMps;
  }

  public reset(): void {
    this.buffer = [];
  }
}
