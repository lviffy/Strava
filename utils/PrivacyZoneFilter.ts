import { PrivacyZone } from '../database/PrivacyZoneDao';

export interface GeoPoint {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

/**
 * Calculates Haversine distance between two coordinates in meters.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
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

export interface PrivacyFilterResult<T extends GeoPoint> {
  sanitizedCoordinates: T[];
  redactedCount: number;
  zonesApplied: string[];
}

/**
 * Filters and redacts GPS coordinates that fall within any active Privacy Zone.
 * Strava reverse-engineered privacy logic: Conceals start and finish points within
 * user-defined privacy boundaries (e.g. Home, Office).
 */
export function applyPrivacyZones<T extends GeoPoint>(
  coordinates: T[],
  zones: PrivacyZone[]
): PrivacyFilterResult<T> {
  if (!coordinates || coordinates.length === 0 || !zones || zones.length === 0) {
    return {
      sanitizedCoordinates: coordinates || [],
      redactedCount: 0,
      zonesApplied: [],
    };
  }

  const activeZones = zones.filter((z) => z.is_active);
  if (activeZones.length === 0) {
    return {
      sanitizedCoordinates: coordinates,
      redactedCount: 0,
      zonesApplied: [],
    };
  }

  const zonesTriggered = new Set<string>();
  let redacted = 0;

  const filtered = coordinates.filter((point) => {
    for (const zone of activeZones) {
      const distance = calculateDistanceMeters(
        point.latitude,
        point.longitude,
        zone.latitude,
        zone.longitude
      );
      if (distance <= zone.radius_meters) {
        zonesTriggered.add(zone.name);
        redacted++;
        return false; // Point is hidden inside privacy zone
      }
    }
    return true;
  });

  return {
    sanitizedCoordinates: filtered.length > 0 ? filtered : coordinates, // Fallback if entire track was inside zone
    redactedCount: filtered.length > 0 ? redacted : 0,
    zonesApplied: Array.from(zonesTriggered),
  };
}
