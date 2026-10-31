import { LocalActivity, LocalCoordinate } from '../database/ActivityDao';

/**
 * Generates an official W3C GPX 1.1 XML string from an activity and its GPS track points.
 * Compatible with Garmin, Wahoo, COROS, Suunto, and Strava cloud import.
 */
export function generateGpx(activity: LocalActivity, coordinates: LocalCoordinate[]): string {
  const startTimeIso = new Date(activity.start_timestamp).toISOString();
  const title = escapeXml(activity.name || 'Strava Workout');
  const sportType = escapeXml(activity.sport_type || 'Run');

  let trkptsXml = '';
  for (const c of coordinates) {
    const lat = c.latitude.toFixed(6);
    const lon = c.longitude.toFixed(6);
    const timeIso = new Date(c.timestamp).toISOString();
    const eleXml = c.altitude != null ? `\n        <ele>${c.altitude.toFixed(1)}</ele>` : '';
    const speedXml = c.speed != null ? `\n        <speed>${c.speed.toFixed(2)}</speed>` : '';

    trkptsXml += `      <trkpt lat="${lat}" lon="${lon}">${eleXml}${speedXml}
        <time>${timeIso}</time>
      </trkpt>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="Strava Mobile App" version="1.1"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${title}</name>
    <time>${startTimeIso}</time>
  </metadata>
  <trk>
    <name>${title}</name>
    <type>${sportType}</type>
    <trkseg>
${trkptsXml}    </trkseg>
  </trk>
</gpx>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
