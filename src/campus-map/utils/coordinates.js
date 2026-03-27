// utils/coordinates.js

// Convert DMS string like "18°08'56.24\"N" to decimal degrees
export function dmsToDecimal(dms) {
  const parts = dms.match(/(\d+)°(\d+)'([\d.]+)"([NSEW])/);
  if (!parts) return null;
  const [, deg, min, sec, dir] = parts;
  let decimal = parseFloat(deg) + parseFloat(min)/60 + parseFloat(sec)/3600;
  if (dir === 'S' || dir === 'W') decimal = -decimal;
  return decimal;
}

// Compute centroid of a GeoJSON polygon ring [[lng,lat], ...]
export function centroidOf(ring) {
  const n = ring.length - 1; // exclude closing point
  let lngSum = 0, latSum = 0;
  for (let i = 0; i < n; i++) {
    lngSum += ring[i][0];
    latSum += ring[i][1];
  }
  return [lngSum / n, latSum / n];
}

// Haversine distance in metres between two [lat, lng] points
export function haversineM([lat1, lng1], [lat2, lng2]) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
