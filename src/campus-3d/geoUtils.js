// geoUtils.js — Convert real WGS-84 lat/lng to Three.js world coordinates
// Campus center = JNTU Vizianagaram centroid derived from buildings.json

// ── CAMPUS ANCHOR (centroid of all building polygons) ─────────────────────
export const CAMPUS_ORIGIN = {
  lat: 18.150300,
  lng: 83.375500,
};

// Scale factor: 1 degree lat ≈ 111,139 m → we use 1 unit = 1 metre
const LAT_TO_M  = 111139;
const LNG_TO_M  = 111139 * Math.cos(CAMPUS_ORIGIN.lat * Math.PI / 180);

/**
 * Convert a [lng, lat] coordinate pair to Three.js [x, z] world units.
 * Y axis is up (handled separately by floor heights).
 */
export function lngLatToWorld(lng, lat) {
  const x =  (lng - CAMPUS_ORIGIN.lng) * LNG_TO_M;
  const z = -(lat - CAMPUS_ORIGIN.lat) * LAT_TO_M; // negate: north = -z in Three.js
  return { x, z };
}

/**
 * Convert a GeoJSON Polygon ring [[lng,lat],...] into flat world {x,z} array.
 */
export function ringToWorld(ring) {
  return ring.map(([lng, lat]) => lngLatToWorld(lng, lat));
}

/**
 * Compute centroid of a world-space polygon [{x,z},...].
 */
export function polygonCentroid(pts) {
  const n = pts.length;
  let sx = 0, sz = 0;
  pts.forEach(p => { sx += p.x; sz += p.z; });
  return { x: sx / n, z: sz / n };
}

/**
 * Compute axis-aligned bounding box of world-space polygon.
 */
export function polygonBBox(pts) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  pts.forEach(({ x, z }) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  });
  return { minX, maxX, minZ, maxZ, w: maxX - minX, d: maxZ - minZ };
}

/**
 * Convert a GeoJSON LineString [[lng,lat],...] to {x,z} array.
 */
export function lineToWorld(coords) {
  return coords.map(([lng, lat]) => lngLatToWorld(lng, lat));
}