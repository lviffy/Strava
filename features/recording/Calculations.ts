export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_METERS = 6371000;
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function formatDistance(meters: number): string {
  const km = meters / 1000;
  return km.toFixed(2);
}

export function formatPace(paceSecPerKm: number | null): string {
  if (paceSecPerKm === null || !isFinite(paceSecPerKm) || paceSecPerKm <= 0 || paceSecPerKm > 3600) {
    return '--:--';
  }
  const mins = Math.floor(paceSecPerKm / 60);
  const secs = Math.floor(paceSecPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatSpeedKmh(speedMps: number | null): string {
  if (speedMps === null || !isFinite(speedMps) || speedMps < 0) {
    return '0.0';
  }
  return (speedMps * 3.6).toFixed(1);
}
