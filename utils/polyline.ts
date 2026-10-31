/**
 * Google Polyline Algorithm implementation (lossy compression of coordinates).
 * Encodes an array of { latitude, longitude } into an ASCII string.
 */

export function encodePolyline(points: { latitude: number; longitude: number }[]): string {
  let result = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const point of points) {
    const lat = Math.round(point.latitude * 1e5);
    const lng = Math.round(point.longitude * 1e5);

    const dLat = lat - prevLat;
    const dLng = lng - prevLng;

    prevLat = lat;
    prevLng = lng;

    result += encodeSignedNumber(dLat);
    result += encodeSignedNumber(dLng);
  }

  return result;
}

function encodeSignedNumber(num: number): string {
  let sgn_num = num << 1;
  if (num < 0) {
    sgn_num = ~sgn_num;
  }
  return encodeNumber(sgn_num);
}

function encodeNumber(num: number): string {
  let s = '';
  while (num >= 0x20) {
    s += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }
  s += String.fromCharCode(num + 63);
  return s;
}

export function decodePolyline(str: string): { latitude: number; longitude: number }[] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: { latitude: number; longitude: number }[] = [];
  const len = str.length;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5,
    });
  }

  return coordinates;
}
