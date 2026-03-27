// buildingCameras.js
// Computes per-building camera presets from footprint geometry

const FLOOR_HEIGHT = 3.5;
const TOTAL_HEIGHT = 10.5; // 3 floors

// Haversine distance in metres
function distM(a, b) {
  const R = 6371000;
  const dLat = (b[1]-a[1]) * Math.PI/180;
  const dLng = (b[0]-a[0]) * Math.PI/180;
  const x = Math.sin(dLat/2)**2 +
    Math.cos(a[1]*Math.PI/180)*Math.cos(b[1]*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

// Move a [lng,lat] point by dx metres east and dy metres north
function offsetPoint(pt, dx, dy) {
  const R = 6371000;
  const dLat = (dy / R) * (180 / Math.PI);
  const dLng = (dx / R) * (180 / Math.PI) / Math.cos(pt[1] * Math.PI/180);
  return [+(pt[0] + dLng).toFixed(6), +(pt[1] + dLat).toFixed(6)];
}

// Compute building bearing (angle of long axis from north)
// from NW and NE corners
function buildingBearing(nw, ne) {
  const dLng = ne[0] - nw[0];
  const dLat = ne[1] - nw[1];
  return Math.atan2(dLng, dLat) * 180 / Math.PI;
}

export function getBuildingCameras(building) {
  const { footprint, centroid } = building;
  const [NW, NE, SE, SW] = footprint;

  // Building dimensions
  const width  = distM(NW, NE); // long axis (east-west approx)
  const depth  = distM(NW, SW); // short axis (north-south approx)

  // Long axis bearing of the building
  const longBearing = buildingBearing(NW, NE);

  // Camera standoff distances based on building size
  const frontDist = depth  * 2.2 + 20;  // how far to stand from front face
  const sideDist  = width  * 1.4 + 20;  // how far to stand from side face
  const topZoom   = 19.2;

  // Front = looking at south face (bearing 0 = camera looks north)
  const frontCamPos = offsetPoint(centroid, 0, -frontDist);

  // Back = looking at north face (camera sits north of building looking south)
  const backCamPos = offsetPoint(centroid, 0, +frontDist);

  // Left = looking at west face (camera sits west looking east)
  const leftCamPos = offsetPoint(centroid, -sideDist, 0);

  // Right = looking at east face (camera sits east looking west)
  const rightCamPos = offsetPoint(centroid, +sideDist, 0);

  return [
    {
      id:    'bldg-iso',
      label: 'Iso',
      icon:  '⬡',
      config: {
        center:  centroid,
        zoom:    19.0,
        pitch:   54,
        bearing: -20,
        duration: 800,
      },
    },
    {
      id:    'bldg-top',
      label: 'Top',
      icon:  '⬆',
      config: {
        center:  centroid,
        zoom:    topZoom,
        pitch:   0,
        bearing: 0,
        duration: 800,
      },
    },
    {
      id:    'bldg-front',
      label: 'Front',
      icon:  '▣',
      config: {
        center:  frontCamPos,
        zoom:    19.4,
        pitch:   72,
        bearing: (longBearing - 90 + 360) % 360,
        duration: 800,
      },
    },
    {
      id:    'bldg-back',
      label: 'Back',
      icon:  '▤',
      config: {
        center:  backCamPos,
        zoom:    19.4,
        pitch:   72,
        bearing: (longBearing + 90) % 360,
        duration: 800,
      },
    },
    {
      id:    'bldg-left',
      label: 'Left',
      icon:  '◁',
      config: {
        center:  leftCamPos,
        zoom:    19.2,
        pitch:   70,
        bearing: longBearing % 360,
        duration: 800,
      },
    },
    {
      id:    'bldg-right',
      label: 'Right',
      icon:  '▷',
      config: {
        center:  rightCamPos,
        zoom:    19.2,
        pitch:   70,
        bearing: (longBearing + 180) % 360,
        duration: 800,
      },
    },
  ];
}
