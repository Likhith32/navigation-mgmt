// useCampusLayers.js — v16: Enhanced label visibility at low zoom, no circles, professional look
import { useMemo } from 'react';
import { PolygonLayer, LineLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { ScenegraphLayer } from '@deck.gl/mesh-layers';
import { GLTFLoader } from '@loaders.gl/gltf';

export const FLOOR_HEIGHT = 3.5;
export const WALL_DEPTH   = 0.025;

// ── Updated Real Campus Perimeter (JNTU-GV from geojson.io) ──
const CAMPUS_FENCE_LOOP = [
  [83.3721705, 18.1536731],
  [83.3719011, 18.1534598],
  [83.3713175, 18.1533531],
  [83.3708686, 18.1532891],
  [83.3701503, 18.1531825],
  [83.3690953, 18.1529905],
  [83.3681525, 18.1526066],
  [83.3674117, 18.15218],
  [83.3666037, 18.1514548],
  [83.3665588, 18.1504096],
  [83.3671424, 18.1505163],
  [83.3676811, 18.1510708],
  [83.3684667, 18.1510282],
  [83.3695217, 18.1513908],
  [83.3713848, 18.1509855],
  [83.3708461, 18.1496631],
  [83.3682647, 18.1494284],
  [83.3682423, 18.1490445],
  [83.368983, 18.1489592],
  [83.3686912, 18.1479567],
  [83.3709134, 18.1465489],
  [83.3719236, 18.1470181],
  [83.3722378, 18.1462929],
  [83.373652, 18.1461009],
  [83.3749763, 18.1453543],
  [83.3751559, 18.1453543],
  [83.3763905, 18.1468475],
  [83.3768619, 18.1475727],
  [83.3762558, 18.1477647],
  [83.3777373, 18.147722],
  [83.3789719, 18.1488312],
  [83.3783433, 18.1493644],
  [83.379331, 18.1500043],
  [83.3802064, 18.150239],
  [83.3802513, 18.1509002],
  [83.3796901, 18.1510708],
  [83.3800717, 18.1510708],
  [83.380386, 18.1516467],
  [83.3801166, 18.1519454],
  [83.3787474, 18.1517747],
  [83.3781862, 18.1510282],
  [83.3778271, 18.1509002],
  [83.3775353, 18.1509642],
  [83.3771986, 18.1510708],
  [83.3769516, 18.1513481],
  [83.375762, 18.151796],
  [83.3756946, 18.1522013],
  [83.3744376, 18.1532465],
  [83.3736295, 18.1534598],
  [83.3721705, 18.1536731],
];

// Precompute fence segments for border effects
const FENCE_SEGMENTS = CAMPUS_FENCE_LOOP.slice(0, -1).map((coord, i) => ({
  from: coord,
  to: CAMPUS_FENCE_LOOP[i + 1],
}));

// Generate curved segments for smoother border visualization
function generateCurvedSegments(segments, curvature = 0.12) {
  const curved = [];
  segments.forEach(segment => {
    const [fromLng, fromLat] = segment.from;
    const [toLng, toLat] = segment.to;
    const dx = toLng - fromLng;
    const dy = toLat - fromLat;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0.00001) {
      const midLng = (fromLng + toLng) / 2;
      const midLat = (fromLat + toLat) / 2;
      const perpX = -dy / len;
      const perpY = dx / len;
      const curveOffset = curvature * len * 0.5;
      const controlLng = midLng + perpX * curveOffset;
      const controlLat = midLat + perpY * curveOffset;
      const steps = 20;
      let prevLng = fromLng;
      let prevLat = fromLat;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const t2 = t * t;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const curveLng = mt2 * fromLng + 2 * mt * t * controlLng + t2 * toLng;
        const curveLat = mt2 * fromLat + 2 * mt * t * controlLat + t2 * toLat;
        curved.push({ from: [prevLng, prevLat], to: [curveLng, curveLat] });
        prevLng = curveLng;
        prevLat = curveLat;
      }
    } else {
      curved.push(segment);
    }
  });
  return curved;
}

// Generate decorative dashed border pattern
function generateDashedBorder(segments, dashLength = 0.00012) {
  const dashed = [];
  segments.forEach(segment => {
    const [fromLng, fromLat] = segment.from;
    const [toLng, toLat] = segment.to;
    const dx = toLng - fromLng;
    const dy = toLat - fromLat;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      const numDashes = Math.max(3, Math.floor(len / dashLength));
      let prevLng = fromLng;
      let prevLat = fromLat;
      for (let i = 1; i <= numDashes; i++) {
        const t = i / numDashes;
        const dashLng = fromLng + dx * t;
        const dashLat = fromLat + dy * t;
        dashed.push({ from: [prevLng, prevLat], to: [dashLng, dashLat] });
        prevLng = dashLng;
        prevLat = dashLat;
      }
    }
  });
  return dashed;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILDINGS — each has a `labelAnchor` to deterministically place its label
// so clusters never fight each other.
//   labelAnchor: { dx, dy }  — pixel offsets from the centroid
//   labelLine:   { tx, ty }  — end-point of the thin connector tick (metres)
// ─────────────────────────────────────────────────────────────────────────────
export const BUILDINGS = {
  HOSTEL_BOYS: {
    id: 'HOSTEL_BOYS',
    name: 'Boys Hostel I',
    shortName: 'BH-1',
    footprint: [
      [83.372375, 18.148956],
      [83.373239, 18.148864],
      [83.373211, 18.148486],
      [83.372328, 18.148589],
    ],
    centroid: [83.372788, 18.148724],
    bbox: { minLng:83.37230, maxLng:83.37330, minLat:18.14845, maxLat:18.14900 },
    type: 'boys_hostel',
    floors: 3,
    // label placed below-left
    labelAnchor: { dx: -38, dy: 22 },
    wallColors: {
      0: { wallRgb:[212,201,184], windowRgb:[45,58,82], accentHex:'#0E9F6E', accentRgb:[14,159,110] },
      1: { wallRgb:[184,204,175], windowRgb:[45,58,82], accentHex:'#1A56DB', accentRgb:[26,86,219] },
      2: { wallRgb:[176,196,216], windowRgb:[45,58,82], accentHex:'#7E3AF2', accentRgb:[126,58,242] },
    },
  },
  HOSTEL_BOYS_II: {
    id: 'HOSTEL_BOYS_II',
    name: 'Boys Hostel II',
    shortName: 'BH-2',
    footprint: [
      [83.371000, 18.148933],
      [83.371136, 18.149300],
      [83.371972, 18.149000],
      [83.371831, 18.148619],
    ],
    centroid: [83.371485, 18.148963],
    bbox: { minLng: 83.370900, maxLng: 83.372100, minLat: 18.148500, maxLat: 18.149400 },
    type: 'boys_hostel',
    floors: 3,
    // label placed above-left
    labelAnchor: { dx: -50, dy: -22 },
    wallColors: {
      0: { wallRgb:[212,201,184], windowRgb:[45,58,82], accentHex:'#0E9F6E', accentRgb:[14,159,110] },
      1: { wallRgb:[184,204,175], windowRgb:[45,58,82], accentHex:'#059669', accentRgb:[5,150,105] },
      2: { wallRgb:[176,196,216], windowRgb:[45,58,82], accentHex:'#047857', accentRgb:[4,120,87] },
    },
  },
  HOSTEL_GIRLS_I: {
    id: 'HOSTEL_GIRLS_I',
    name: 'Girls Hostel I',
    shortName: 'GH-1',
    footprint: [
      [83.378128, 18.149250],
      [83.377233, 18.149289],
      [83.377211, 18.148961],
      [83.378094, 18.148858],
    ],
    centroid: [83.377667, 18.149089],
    bbox: { minLng:83.37715, maxLng:83.37820, minLat:18.14885, maxLat:18.14933 },
    type: 'girls_hostel',
    floors: 3,
    // label placed above-right
    labelAnchor: { dx: 46, dy: -22 },
    wallColors: {
      0: { wallRgb:[230,210,218], windowRgb:[50,35,45], accentHex:'#EC4899', accentRgb:[236,72,153] },
      1: { wallRgb:[220,200,210], windowRgb:[50,35,45], accentHex:'#DB2777', accentRgb:[219,39,119] },
      2: { wallRgb:[210,195,205], windowRgb:[50,35,45], accentHex:'#BE185D', accentRgb:[190,24,93] },
    },
  },
  HOSTEL_GIRLS_II: {
    id: 'HOSTEL_GIRLS_II',
    name: 'Girls Hostel II',
    shortName: 'GH-2',
    footprint: [
      [83.377219, 18.148769],
      [83.378094, 18.148717],
      [83.378075, 18.148333],
      [83.377178, 18.148364],
    ],
    centroid: [83.377642, 18.148546],
    bbox: { minLng: 83.377078, maxLng: 83.378194, minLat: 18.148233, maxLat: 18.148869 },
    type: 'girls_hostel',
    floors: 3,
    // label placed below-right
    labelAnchor: { dx: 46, dy: 22 },
    wallColors: {
      0: { wallRgb:[230,215,200], windowRgb:[55,40,30], accentHex:'#F97316', accentRgb:[249,115,22] },
      1: { wallRgb:[220,205,190], windowRgb:[55,40,30], accentHex:'#EA580C', accentRgb:[234,88,12] },
      2: { wallRgb:[210,195,180], windowRgb:[55,40,30], accentHex:'#C2410C', accentRgb:[194,65,12] },
    },
  },
  BS_HSS: {
    id: 'BS_HSS',
    name: 'BS & HSS Dept.',
    shortName: 'BS/HSS',
    footprint: [
      [83.374292, 18.151553],
      [83.374286, 18.151769],
      [83.374631, 18.151764],
      [83.374628, 18.151558],
      [83.374525, 18.151556],
      [83.374517, 18.151528],
      [83.374431, 18.151533],
      [83.374428, 18.151558],
    ],
    centroid: [83.374467, 18.151602],
    bbox: { minLng:83.374186, maxLng:83.374731, minLat:18.151428, maxLat:18.151869 },
    type: 'academic',
    floors: 2,
    floorHeight: 3.5,
    // label above
    labelAnchor: { dx: -52, dy: -18 },
    wallColors: {
      0: { wallRgb:[109,185,122], windowRgb:[30,60,35], accentHex:'#6DB97A', accentRgb:[109,185,122] },
      1: { wallRgb:[95,168,108], windowRgb:[30,60,35],  accentHex:'#5DAA6C', accentRgb:[93,170,108] },
    },
  },
  MECH_WORKSHOP_1: {
    id: 'MECH_WORKSHOP_1',
    name: 'Mech Workshop 1',
    shortName: 'MW-1',
    footprint: [
      [83.374711, 18.151344],
      [83.374708, 18.151703],
      [83.374833, 18.151706],
      [83.374828, 18.151342],
    ],
    centroid: [83.374770, 18.151524],
    bbox: { minLng:83.374608, maxLng:83.374933, minLat:18.151242, maxLat:18.151806 },
    type: 'workshop',
    floors: 1,
    floorHeight: 6.0,
    // label right
    labelAnchor: { dx: 44, dy: -14 },
    wallColors: {
      0: { wallRgb:[74,144,217], windowRgb:[20,40,80], accentHex:'#4A90D9', accentRgb:[74,144,217] },
    },
  },
  MECH_WORKSHOP_2: {
    id: 'MECH_WORKSHOP_2',
    name: 'Mech Workshop 2',
    shortName: 'MW-2',
    footprint: [
      [83.374936, 18.151342],
      [83.374931, 18.151703],
      [83.375056, 18.151711],
      [83.375047, 18.151331],
    ],
    centroid: [83.374992, 18.151522],
    bbox: { minLng:83.374831, maxLng:83.375156, minLat:18.151231, maxLat:18.151811 },
    type: 'workshop',
    floors: 1,
    floorHeight: 6.0,
    // label right, staggered below MW-1
    labelAnchor: { dx: 44, dy: 10 },
    wallColors: {
      0: { wallRgb:[74,144,217], windowRgb:[20,40,80], accentHex:'#4A90D9', accentRgb:[74,144,217] },
    },
  },
  EXAM_CENTER: {
    id: 'EXAM_CENTER',
    name: 'Exam Center',
    shortName: 'Exam Ctr',
    footprint: [
      [83.376219, 18.151461],
      [83.376275, 18.151564],
      [83.376564, 18.151381],
      [83.376508, 18.151289],
    ],
    centroid: [83.376392, 18.151424],
    bbox: { minLng:83.376119, maxLng:83.376664, minLat:18.151189, maxLat:18.151664 },
    type: 'admin',
    floors: 1,
    floorHeight: 3.5,
    // label above
    labelAnchor: { dx: 0, dy: -20 },
    wallColors: {
      0: { wallRgb:[212,168,67], windowRgb:[60,40,10], accentHex:'#D4A843', accentRgb:[212,168,67] },
    },
  },
  ESTATE_OFFICE: {
    id: 'ESTATE_OFFICE',
    name: 'Estate Office',
    shortName: 'Estate',
    footprint: [
      [83.376231, 18.151356],
      [83.376167, 18.151250],
      [83.376225, 18.151219],
      [83.376219, 18.151194],
      [83.376272, 18.151167],
      [83.376283, 18.151183],
      [83.376322, 18.151164],
      [83.376386, 18.151253],
    ],
    centroid: [83.376263, 18.151223],
    bbox: { minLng:83.376067, maxLng:83.376486, minLat:18.151064, maxLat:18.151456 },
    type: 'admin',
    floors: 1,
    floorHeight: 3.5,
    // label below
    labelAnchor: { dx: 0, dy: 20 },
    wallColors: {
      0: { wallRgb:[192,139,92], windowRgb:[50,30,10], accentHex:'#C08B5C', accentRgb:[192,139,92] },
    },
  },
  CANTEEN: {
    id: 'CANTEEN',
    name: 'Canteen',
    shortName: 'Canteen',
    footprint: [
      [83.376072, 18.151317],
      [83.376061, 18.151319],
      [83.376053, 18.151308],
      [83.376022, 18.151322],
      [83.376028, 18.151339],
      [83.375958, 18.151378],
      [83.375997, 18.151442],
      [83.376108, 18.151378],
    ],
    centroid: [83.376037, 18.151350],
    bbox: { minLng:83.375858, maxLng:83.376208, minLat:18.151208, maxLat:18.151542 },
    type: 'canteen',
    floors: 1,
    floorHeight: 3.5,
    // label left
    labelAnchor: { dx: -44, dy: 0 },
    wallColors: {
      0: { wallRgb:[109,185,122], windowRgb:[30,60,35], accentHex:'#6DB97A', accentRgb:[109,185,122] },
    },
  },
  METALLURGICAL_WORKSHOP: {
    id: 'METALLURGICAL_WORKSHOP',
    name: 'Metall. Workshop',
    shortName: 'Met W/S',
    footprint: [
      [83.375717, 18.151339],
      [83.375839, 18.151339],
      [83.375833, 18.151667],
      [83.375722, 18.151667],
    ],
    centroid: [83.375778, 18.151503],
    bbox: { minLng:83.375617, maxLng:83.375939, minLat:18.151239, maxLat:18.151767 },
    type: 'workshop',
    floors: 1,
    floorHeight: 5.0,
    // label above
    labelAnchor: { dx: 0, dy: -20 },
    wallColors: {
      0: { wallRgb:[139,115,85], windowRgb:[40,30,15], accentHex:'#8B7355', accentRgb:[139,115,85] },
    },
  },
  YSR_LIBRARY: {
    id: 'YSR_LIBRARY',
    name: 'YSR Central Library',
    shortName: 'Library',
    footprint: [
      [83.37585, 18.14990],
      [83.37631, 18.14990],
      [83.37631, 18.14954],
      [83.37585, 18.14954],
    ],
    centroid: [83.376083, 18.149725],
    bbox: { minLng:83.37575, maxLng:83.37640, minLat:18.14945, maxLat:18.15000 },
    type: 'academic',
    floors: 3,
    floorHeight: 3.5,
    // label below
    labelAnchor: { dx: 0, dy: 26 },
    wallColors: {
      0: { wallRgb:[235,235,235], windowRgb:[30,50,90], accentHex:'#1565C0', accentRgb:[21,101,192] },
      1: { wallRgb:[230,230,230], windowRgb:[30,50,90], accentHex:'#1565C0', accentRgb:[21,101,192] },
      2: { wallRgb:[225,225,225], windowRgb:[30,50,90], accentHex:'#1565C0', accentRgb:[21,101,192] },
    },
  },
};

export const FLOOR_CONFIG = {
  0: { label:'Ground', key:'G',  hex:'#D4C9B8', rgb:[212,201,184], wallRgb:[212,201,184], windowRgb:[45,58,82],  accentHex:'#0E9F6E', accentRgb:[14,159,110] },
  1: { label:'First',  key:'F1', hex:'#B8CCAF', rgb:[184,204,175], wallRgb:[184,204,175], windowRgb:[45,58,82],  accentHex:'#1A56DB', accentRgb:[26,86,219]  },
  2: { label:'Second', key:'F2', hex:'#B0C4D8', rgb:[176,196,216], wallRgb:[176,196,216], windowRgb:[45,58,82],  accentHex:'#7E3AF2', accentRgb:[126,58,242] },
};

// ── Helpers ───────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function bilerp2D(nw, ne, se, sw, u, v) {
  return [
    lerp(lerp(nw[0],ne[0],u), lerp(sw[0],se[0],u), v),
    lerp(lerp(nw[1],ne[1],u), lerp(sw[1],se[1],u), v),
  ];
}
function polyZ(polygon, z) { return polygon.map(pt => [pt[0], pt[1], z]); }

// ── Wall panels ────────────────────────────────────────────────────────────
function buildWallPanels(footprint, floorIndex) {
  const [NW, NE, SE, SW] = footprint;
  const D = WALL_DEPTH;
  const b = (u,v) => bilerp2D(NW,NE,SE,SW,u,v);
  return [
    { polygon:[NW, NE, b(1,D), b(0,D), NW], face:'north', floorIndex },
    { polygon:[NE, SE, b(1-D,1), b(1-D,0), NE], face:'east',  floorIndex },
    { polygon:[SE, SW, b(0,1-D), b(1,1-D), SE], face:'south', floorIndex },
    { polygon:[SW, NW, b(D,0), b(D,1), SW], face:'west',  floorIndex },
  ];
}

function buildWindowPanels(footprint, floorIndex) {
  const [NW, NE, SE, SW] = footprint;
  const D = WALL_DEPTH;
  const b = (u,v) => bilerp2D(NW,NE,SE,SW,u,v);
  const panels = [];
  const N_LONG = 10, N_SHORT = 3, WW = 0.06;
  const GAP = (1.0 - N_LONG * WW) / (N_LONG + 1);
  for (let i = 0; i < N_LONG; i++) {
    const u0 = GAP + i * (WW + GAP), u1 = u0 + WW;
    panels.push({ polygon:[b(u0,0),b(u1,0),b(u1,D),b(u0,D),b(u0,0)], face:'north', floorIndex });
    panels.push({ polygon:[b(1,1),b(0,1),b(0,1-D),b(1,1-D),b(1,1)], face:'south', floorIndex });
  }
  const GAP_S = (1.0 - N_SHORT * WW * 1.3) / (N_SHORT + 1);
  for (let i = 0; i < N_SHORT; i++) {
    const v0 = GAP_S + i * (WW * 1.3 + GAP_S), v1 = v0 + WW * 1.3;
    panels.push({ polygon:[b(1,v0),b(1,v1),b(1-D,v1),b(1-D,v0),b(1,v0)], face:'east', floorIndex });
    panels.push({ polygon:[b(0,v1),b(0,v0),b(D,v0),b(D,v1),b(0,v1)], face:'west', floorIndex });
  }
  return panels;
}

// ── Layer builders ─────────────────────────────────────────────────────────
function buildBlockLayers(building, onClick, hoveredBuildingId, onBuildingHover) {
  const layers = [];
  const { footprint, id, wallColors, floors = 3, floorHeight = FLOOR_HEIGHT } = building;
  const isHovered = id === hoveredBuildingId;

  Array.from({ length: floors }).forEach((_, f) => {
    const colorCfg = wallColors?.[f] || FLOOR_CONFIG[f];
    const [r, g, b] = colorCfg.wallRgb;
    const zBase = f * (building.floorHeight || FLOOR_HEIGHT);

    // Hover brightening: +35 on all channels, stronger alpha
    const hoverBoost = isHovered ? 35 : 0;
    const wallAlpha = isHovered ? 255 : 245;

    layers.push(new PolygonLayer({
      id: `walls-${id}-${f}`,
      data: buildWallPanels(footprint, f).map(p => ({ ...p, polygon: polyZ(p.polygon, zBase) })),
      extruded: true,
      getPolygon: d => d.polygon,
      getElevation: () => floorHeight - 0.2,
      getFillColor: d => {
        const shade = d.face === 'north' ? 0
          : d.face === 'south' ? -18
          : d.face === 'east'  ? -28
          : -10;
        return [
          Math.min(255, Math.max(0, r + shade + hoverBoost)),
          Math.min(255, Math.max(0, g + shade + hoverBoost)),
          Math.min(255, Math.max(0, b + shade + hoverBoost)),
          wallAlpha,
        ];
      },
      // Brighter edge lines on hover
      getLineColor: isHovered ? [255, 255, 255, 120] : [255, 255, 255, 25],
      lineWidthMinPixels: isHovered ? 1.2 : 0.5,
      pickable: true,
      onClick: () => onClick(id),
      onHover: ({ object }) => {
        document.body.style.cursor = object ? 'pointer' : '';
        onBuildingHover?.(object ? id : null);
      },
      updateTriggers: {
        getFillColor: [isHovered],
        getLineColor: [isHovered],
      },
    }));

    // Roof — brighter + slightly elevated on hover for a "lift" effect
    const roofBoost = isHovered ? 45 : 25;
    layers.push(new PolygonLayer({
      id: `roof-${id}-${f}`,
      data: [{ polygon: polyZ([...building.footprint, building.footprint[0]], zBase + (building.floorHeight || FLOOR_HEIGHT) - 0.2) }],
      extruded: true,
      getPolygon: d => d.polygon,
      getElevation: () => isHovered ? 0.5 : 0.2,   // slight lift on hover
      getFillColor: [
        Math.min(255, r + roofBoost),
        Math.min(255, g + roofBoost),
        Math.min(255, b + roofBoost),
        255,
      ],
      pickable: true,
      onClick: () => onClick(id),
      onHover: ({ object }) => {
        document.body.style.cursor = object ? 'pointer' : '';
        onBuildingHover?.(object ? id : null);
      },
      updateTriggers: {
        getFillColor: [isHovered],
        getElevation: [isHovered],
      },
    }));

    const winSill = zBase + 0.45, winHeight = FLOOR_HEIGHT * 0.60;
    // Window tint — goes lighter/more visible on hover
    const winColor = isHovered
      ? [Math.min(255, colorCfg.windowRgb[0] + 40), Math.min(255, colorCfg.windowRgb[1] + 40), Math.min(255, colorCfg.windowRgb[2] + 60), 255]
      : [...colorCfg.windowRgb, 235];

    layers.push(new PolygonLayer({
      id: `wins-${id}-${f}`,
      data: buildWindowPanels(footprint, f).map(w => ({ ...w, polygon: polyZ(w.polygon, winSill) })),
      extruded: true,
      getPolygon: d => d.polygon,
      getElevation: () => winHeight,
      getFillColor: winColor,
      pickable: false,
      updateTriggers: { getFillColor: [isHovered] },
    }));
  });

  // Floor band lines
  const ring = [...footprint, footprint[0]];
  const bandPts = [];
  Array.from({ length: floors }).forEach((_, f) => {
    const z = (f + 1) * (building.floorHeight || FLOOR_HEIGHT);
    ring.slice(0, -1).forEach((pt, i) => {
      bandPts.push({ from: [pt[0], pt[1], z], to: [ring[i + 1][0], ring[i + 1][1], z] });
    });
  });
  layers.push(new LineLayer({
    id: `bands-${id}`,
    data: bandPts,
    getSourcePosition: d => d.from,
    getTargetPosition: d => d.to,
    getColor: isHovered ? [255, 255, 255, 255] : [255, 255, 248, 180],
    getWidth: isHovered ? 3 : 2,
    updateTriggers: { getColor: [isHovered], getWidth: [isHovered] },
  }));

  // Parapet
  const roofZ = floors * (building.floorHeight || FLOOR_HEIGHT);
  layers.push(new PolygonLayer({
    id: `parapet-${id}`,
    data: [{ polygon: polyZ([...building.footprint, building.footprint[0]], roofZ) }],
    extruded: true,
    getPolygon: d => d.polygon,
    getElevation: () => isHovered ? 1.0 : 0.6,
    getFillColor: isHovered ? [235, 230, 222, 255] : [205, 200, 192, 230],
    pickable: false,
    updateTriggers: {
      getFillColor: [isHovered],
      getElevation: [isHovered],
    },
  }));

  // ── HOVER RIM GLOW — outline ring rendered just above roof level ──────
  // Only rendered when hovered; creates the Google Maps "selected building" effect
  if (isHovered) {
    const accentRgb = building.wallColors?.[0]?.accentRgb || [56, 189, 248];
    const rimZ = roofZ + 1.1;
    const rimPts = ring.slice(0, -1).map((pt, i) => ({
      from: [pt[0], pt[1], rimZ],
      to:   [ring[i + 1][0], ring[i + 1][1], rimZ],
    }));

    // Outer glow (wide + transparent)
    layers.push(new LineLayer({
      id: `hover-rim-outer-${id}`,
      data: rimPts,
      getSourcePosition: d => d.from,
      getTargetPosition: d => d.to,
      getColor: [...accentRgb, 80],
      getWidth: 10,
      widthUnits: 'pixels',
    }));

    // Inner bright line
    layers.push(new LineLayer({
      id: `hover-rim-inner-${id}`,
      data: rimPts,
      getSourcePosition: d => d.from,
      getTargetPosition: d => d.to,
      getColor: [...accentRgb, 220],
      getWidth: 2.5,
      widthUnits: 'pixels',
    }));

    // Accent dot at centroid top
    layers.push(new ScatterplotLayer({
      id: `hover-beacon-${id}`,
      data: [{ position: [...building.centroid, rimZ + 0.5] }],
      getPosition: d => d.position,
      getRadius: 5,
      radiusUnits: 'pixels',
      getFillColor: [...accentRgb, 255],
      getLineColor: [255, 255, 255, 200],
      lineWidthMinPixels: 1.5,
    }));
  }

  // Workshop shed roof lines (unchanged)
  if (building.type === 'workshop') {
    const [NW, NE, SE, SW] = building.footprint;
    const roofZLayer = floors * floorHeight;
    const ridgeMid_N = [(NW[0] + NE[0]) / 2, (NW[1] + NE[1]) / 2];
    const ridgeMid_S = [(SW[0] + SE[0]) / 2, (SW[1] + SE[1]) / 2];

    layers.push(new LineLayer({
      id: `shed-ridge-${building.id}`,
      data: [{ from: [...ridgeMid_N, roofZLayer + 0.8], to: [...ridgeMid_S, roofZLayer + 0.8] }],
      getSourcePosition: d => d.from,
      getTargetPosition: d => d.to,
      getColor: [255, 255, 255, 120],
      getWidth: 3,
      widthUnits: 'pixels',
    }));

    layers.push(new LineLayer({
      id: `shed-slope-${building.id}`,
      data: [
        { from: [...NW, roofZLayer], to: [...ridgeMid_N, roofZLayer + 0.8] },
        { from: [...NE, roofZLayer], to: [...ridgeMid_N, roofZLayer + 0.8] },
        { from: [...SW, roofZLayer], to: [...ridgeMid_S, roofZLayer + 0.8] },
        { from: [...SE, roofZLayer], to: [...ridgeMid_S, roofZLayer + 0.8] },
      ],
      getSourcePosition: d => d.from,
      getTargetPosition: d => d.to,
      getColor: [255, 255, 255, 60],
      getWidth: 1.5,
      widthUnits: 'pixels',
    }));
  }

  return layers;
}

function buildFloorLayers(building, roomsData, activeFloor, selectedRoom, hoveredRoom, onRoomClick, onRoomHover) {
  const layers = [];
  const { footprint, id, wallColors, floors = 3, floorHeight = FLOOR_HEIGHT } = building;
  const [nw, ne, se, sw] = footprint;
  const lerpC = (u,v) => bilerp2D(nw,ne,se,sw,u,v);

  Array.from({ length: floors }).forEach((_, f) => {
    const colorCfg = wallColors?.[f] || FLOOR_CONFIG[f];
    const [r, g, b] = colorCfg.accentRgb || FLOOR_CONFIG[f].accentRgb;
    const isActive = f === activeFloor;
    const alpha = isActive ? 215 : 65;
    const zBase = f * floorHeight;

    layers.push(new PolygonLayer({
      id: `walls-fm-${id}-${f}`,
      data: buildWallPanels(footprint, f).map(p => ({ ...p, polygon: polyZ(p.polygon, zBase) })),
      extruded: true, getPolygon: d => d.polygon, getElevation: () => floorHeight - 0.2,
      getFillColor: d => {
        const [wr, wg, wb] = colorCfg.wallRgb;
        const shade = d.face==='north' ? 0 : d.face==='south' ? -18 : d.face==='east' ? -28 : -10;
        return [
          Math.min(255, Math.max(0, wr + shade)),
          Math.min(255, Math.max(0, wg + shade)),
          Math.min(255, Math.max(0, wb + shade)),
          isActive ? 160 : 40,
        ];
      },
      pickable: false,
    }));

    const floorRooms = roomsData.filter(rm => rm.floor === f && rm.building_id === id);
    const cells = [];
    const makeC = (u0,u1,v0,v1) => [lerpC(u0,v0),lerpC(u1,v0),lerpC(u1,v1),lerpC(u0,v1),lerpC(u0,v0)];
    let idx = 0;
    const COLS = 5, colW = 0.8/COLS;
    for(let c=0; c<COLS; c++) {
      const room = floorRooms[idx++] || { id:`${id}_${f}_${idx}`, name:`R-${idx}`, type:'hostel_room' };
      cells.push({ polygon: makeC(0.1+c*colW, 0.1+(c+0.9)*colW, 0.05, 0.45), room });
    }
    for(let c=0; c<COLS; c++) {
      const room = floorRooms[idx++] || { id:`${id}_${f}_${idx}`, name:`R-${idx+COLS}`, type:'hostel_room' };
      cells.push({ polygon: makeC(0.1+c*colW, 0.1+(c+0.9)*colW, 0.55, 0.95), room });
    }

    layers.push(new PolygonLayer({
      id: `cells-${id}-${f}`,
      data: cells.map(c => ({ ...c, polygon: polyZ(c.polygon, zBase + 0.1) })),
      extruded: true, getPolygon: c => c.polygon, getElevation: () => floorHeight * 0.9,
      getFillColor: c => {
        if (!isActive) return [r,g,b,40];
        if (selectedRoom?.id === c.room.id) return [Math.min(255,r+60), Math.min(255,g+60), Math.min(255,b+60), 255];
        if (hoveredRoom?.id === c.room.id)  return [Math.min(255,r+30), Math.min(255,g+30), Math.min(255,b+30), 240];
        return [r,g,b,alpha];
      },
      getLineColor: isActive ? [255,255,255,100] : [255,255,255,10],
      lineWidthMinPixels: 0.5, pickable: true,
      onClick: ({object}) => isActive ? onRoomClick(object.room, f) : onRoomClick(null, f),
      onHover: ({object}) => isActive && onRoomHover(object?.room || null),
    }));
  });

  return layers;
}


// ─────────────────────────────────────────────────────────────────────────────
// LABEL SYSTEM v7 — HIGH VISIBILITY with dark background plates
// Clean rectangular plates behind text for perfect readability
// No circles - just professional pill-shaped backgrounds
// ─────────────────────────────────────────────────────────────────────────────
function buildLabelLayer(buildings, activeBuildingId, viewState, mode) {
  if (mode !== 'block') return [];

  const zoom = viewState?.zoom || 18;

  const showFullName = zoom >= 15;
  const isLowZoom = zoom < 15;

  // Text sizes
  let shortSize, fullSize;
  if (isLowZoom) {
    shortSize = 16;
    fullSize = 12;
  } else {
    shortSize = 13;
    fullSize = 10;
  }

  // HIGHLY VISIBLE COLORS
  // Text: Pure White with slight glow
  // Background plate: Dark semi-transparent (for contrast)
  
  const LAT_M = 110574;
  const cosLat = Math.cos(18.15 * Math.PI / 180);
  const LNG_M = 111320 * cosLat;

  const layers = [];

  buildings.forEach(b => {
    const isActive = b.id === activeBuildingId;
    const accentRgb = b.accentRgb || (isActive ? [56, 189, 248] : [100, 150, 200]);
    const labelHeight = (b.floors * (b.floorHeight || 3.5)) + 4;

    const anchor = b.labelAnchor || { dx: 0, dy: -20 };

    let pxToM;
    if (isLowZoom) {
      pxToM = Math.max(0.4, 0.8 / Math.pow(2, zoom - 14));
    } else {
      pxToM = Math.max(0.2, 1.2 / Math.pow(2, zoom - 16));
    }
    const dLng = (anchor.dx * pxToM) / LNG_M;
    const dLat = (anchor.dy * pxToM) / LAT_M;

    const [cLng, cLat] = b.centroid;
    const chipPos = [cLng + dLng, cLat - dLat, labelHeight];
    const dotPos = [cLng, cLat, labelHeight * 0.55];

    // Calculate text dimensions for background plate
    const textStr = b.shortName;
    const textWidth = textStr.length * (shortSize * 0.55); // Approximate width in pixels
    const plateWidth = textWidth + 20;
    
    
    // For low zoom, make plate more opaque
    const plateOpacity = isLowZoom ? 200 : 180;
    
    // ── 1. Centroid dot ──────────────────────────────────────────────
    layers.push(new ScatterplotLayer({
      id: `lbl-dot-${b.id}`,
      data: [{ position: dotPos }],
      getPosition: d => d.position,
      getRadius: isActive ? 4 : 3,
      radiusUnits: 'pixels',
      getFillColor: isActive ? [...accentRgb, 255] : [100, 150, 200, 220],
      getLineColor: [255, 255, 255, 200],
      lineWidthMinPixels: isActive ? 1.2 : 0.8,
      pickable: false,
    }));

    // ── 2. Connector line ─────────────────────────────────────────────
    const offsetPx = Math.sqrt(anchor.dx * anchor.dx + anchor.dy * anchor.dy);
    if (offsetPx > 8) {
      layers.push(new LineLayer({
        id: `lbl-line-${b.id}`,
        data: [{ from: dotPos, to: chipPos }],
        getSourcePosition: d => d.from,
        getTargetPosition: d => d.to,
        getColor: isActive ? [...accentRgb, 180] : [150, 170, 190, 120],
        getWidth: 1.2,
        widthUnits: 'pixels',
        pickable: false,
      }));
    }

    // ── 3. DARK BACKGROUND PLATE (makes text readable) ─────────────────
    // Create a dark rectangle behind the text
    const plateOffsetX = 0;
    const plateOffsetY = showFullName ? -(fullSize * 0.4) : 0;
    const plateHeightTotal = showFullName ? (shortSize + fullSize + 12) : (shortSize + 8);
    
    // Calculate plate corner positions in world coordinates
    const plateWidthM = (plateWidth * pxToM) / LNG_M;
    const plateHeightM = (plateHeightTotal * pxToM) / LAT_M;
    
    const platePolygon = [
      [chipPos[0] - plateWidthM / 2 + (plateOffsetX * pxToM / LNG_M), chipPos[1] + (plateOffsetY * pxToM / LAT_M) - plateHeightM / 2, chipPos[2] - 0.1],
      [chipPos[0] + plateWidthM / 2 + (plateOffsetX * pxToM / LNG_M), chipPos[1] + (plateOffsetY * pxToM / LAT_M) - plateHeightM / 2, chipPos[2] - 0.1],
      [chipPos[0] + plateWidthM / 2 + (plateOffsetX * pxToM / LNG_M), chipPos[1] + (plateOffsetY * pxToM / LAT_M) + plateHeightM / 2, chipPos[2] - 0.1],
      [chipPos[0] - plateWidthM / 2 + (plateOffsetX * pxToM / LNG_M), chipPos[1] + (plateOffsetY * pxToM / LAT_M) + plateHeightM / 2, chipPos[2] - 0.1],
    ];
    
    layers.push(new PolygonLayer({
      id: `lbl-plate-${b.id}`,
      data: [{ polygon: platePolygon }],
      getPolygon: d => d.polygon,
      extruded: false,
      getFillColor: [20, 25, 35, plateOpacity], // Dark slate background
      getLineColor: isActive ? [...accentRgb, 180] : [80, 90, 110, 150],
      getLineWidth: 1,
      lineWidthUnits: 'pixels',
      pickable: false,
    }));

    // ── 4. SHORT NAME - PURE WHITE ─────────────────────────────────────
    layers.push(new TextLayer({
      id: `lbl-short-${b.id}`,
      data: [{ position: chipPos }],
      getPosition: d => d.position,
      getText: () => b.shortName,
      getSize: shortSize,
      getColor: [255, 255, 255, 255], // PURE WHITE
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
      fontWeight: isActive ? 'bold' : '600',
      billboard: true,
      sizeUnits: 'pixels',
      getPixelOffset: showFullName ? [0, -(fullSize * 0.6)] : [0, 0],
      pickable: true,
      onClick: () => {
        if (typeof window !== 'undefined' && window._onBuildingLabelClick) {
          window._onBuildingLabelClick(b.id);
        }
      },
    }));

    // ── 5. FULL NAME (high zoom) ────────────────────────────────────────
    if (showFullName) {
      layers.push(new TextLayer({
        id: `lbl-full-${b.id}`,
        data: [{ position: chipPos }],
        getPosition: d => d.position,
        getText: () => b.name.length > 22 ? b.name.substring(0, 20) + '…' : b.name,
        getSize: fullSize,
        getColor: [220, 230, 255, 230], // Light blue-white
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center',
        fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
        fontWeight: 'normal',
        billboard: true,
        sizeUnits: 'pixels',
        getPixelOffset: [0, shortSize * 0.65],
        pickable: false,
      }));
    }
  });

  return layers;
}

// ── Professional Campus Border ─────────────────────────────────────────────
function buildCampusBorderWithLabels(viewState) {
  const layers = [];
  const zoom = viewState?.zoom || 18;

  const curvedSegments = generateCurvedSegments(FENCE_SEGMENTS, 0.12);
  const dashedBorder   = generateDashedBorder(FENCE_SEGMENTS, 0.00012);

  layers.push(new LineLayer({
    id: 'campus-perimeter-glow-outer',
    data: curvedSegments,
    getSourcePosition: d => [...d.from, 0.05],
    getTargetPosition: d => [...d.to, 0.05],
    getColor: [6, 182, 212, 35],
    getWidth: Math.max(12, Math.min(28, 20 * (zoom / 18))),
    widthUnits: 'pixels', pickable: false,
  }));

  layers.push(new LineLayer({
    id: 'campus-perimeter-glow-mid',
    data: curvedSegments,
    getSourcePosition: d => [...d.from, 0.05],
    getTargetPosition: d => [...d.to, 0.05],
    getColor: [20, 184, 166, 110],
    getWidth: Math.max(5, Math.min(10, 7 * (zoom / 18))),
    widthUnits: 'pixels', pickable: false,
  }));

  layers.push(new LineLayer({
    id: 'campus-perimeter-glow-core',
    data: curvedSegments,
    getSourcePosition: d => [...d.from, 0.05],
    getTargetPosition: d => [...d.to, 0.05],
    getColor: [207, 250, 254, 255],
    getWidth: 2.5,
    widthUnits: 'pixels', pickable: false,
  }));

  layers.push(new LineLayer({
    id: 'campus-perimeter-dashed',
    data: dashedBorder,
    getSourcePosition: d => [...d.from, 0.07],
    getTargetPosition: d => [...d.to, 0.07],
    getColor: [255, 255, 255, 120],
    getWidth: 1.5,
    widthUnits: 'pixels', pickable: false,
  }));

  layers.push(new LineLayer({
    id: 'campus-perimeter-inner-line',
    data: curvedSegments,
    getSourcePosition: d => [...d.from, 0.06],
    getTargetPosition: d => [...d.to, 0.06],
    getColor: [255, 255, 255, 70],
    getWidth: 1.2,
    widthUnits: 'pixels', pickable: false,
  }));

  if (zoom >= 14) {
    const gateDefs = [
      { index: 0,  name: "Main Gate",     isPrimary: true,  offset: [0, 0.00008] },
      { index: 8,  name: "East Gate",     isPrimary: true,  offset: [0.00005, 0] },
      { index: 16, name: "South Gate",    isPrimary: true,  offset: [0, -0.00008] },
      { index: 25, name: "West Gate",     isPrimary: true,  offset: [-0.00005, 0] },
      { index: 33, name: "North Gate",    isPrimary: true,  offset: [0, 0.00008] },
      { index: 40, name: "Staff Entrance",isPrimary: false, offset: [0.00003, 0.00005] },
      { index: 48, name: "Service Gate",  isPrimary: false, offset: [-0.00003, -0.00005] },
    ];

    const labelPoints = gateDefs
      .filter(g => g.index < CAMPUS_FENCE_LOOP.length)
      .map(g => {
        const c = CAMPUS_FENCE_LOOP[g.index];
        return { position: [c[0] + g.offset[0], c[1] + g.offset[1], 0.25], name: g.name, isPrimary: g.isPrimary };
      });

    layers.push(new ScatterplotLayer({
      id: 'border-label-dots',
      data: labelPoints,
      getPosition: d => d.position,
      getRadius: d => d.isPrimary ? 4 : 2.8,
      radiusUnits: 'pixels',
      getFillColor: d => d.isPrimary ? [6,182,212,230] : [20,184,166,180],
      getLineColor: [255,255,255,200],
      lineWidthMinPixels: 0.8,
      pickable: false,
    }));

    const tSize = Math.max(8, Math.min(12, 10 * (zoom / 18)));
    layers.push(new TextLayer({
      id: 'border-labels',
      data: labelPoints,
      getPosition: d => d.position,
      getText: d => d.name,
      getSize: d => d.isPrimary ? tSize + 1 : tSize,
      getColor: d => d.isPrimary ? [255,255,255,245] : [204,251,241,210],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      fontFamily: '"DM Sans", system-ui, sans-serif',
      fontWeight: d => d.isPrimary ? 'bold' : 'normal',
      billboard: true,
      sizeUnits: 'pixels',
      pickable: false,
      getPixelOffset: [0, -12],
    }));
  }

  return layers;
}

// ── MAIN HOOK ──────────────────────────────────────────────────────────────
export function useCampusLayers({
  roomsData, mode, activeBuildingId, activeFloor,
  selectedRoom, hoveredRoom,
  hoveredBuildingId,
  onBuildingClick, onBuildingHover, onRoomClick, onRoomHover,
  onFirstYear3DClick,
  routeGeoJson,
  viewState,
  onLibrary3DClick,
  eventsData = [],
}) {
  if (typeof window !== 'undefined') {
    window._onBuildingLabelClick = onBuildingClick;
  }

  return useMemo(() => {
    const layers = [];

    // LAYER 1: GRASS BASE
    layers.push(new PolygonLayer({
      id: 'campus-grass-sandbox-floor',
      data: [{ polygon: CAMPUS_FENCE_LOOP }],
      getPolygon: d => d.polygon,
      extruded: true,
      getElevation: () => 0.15,
      getFillColor: [34, 97, 38, 145],
      getLineColor: [30, 80, 40, 255],
      getLineWidth: 1.5,
      lineWidthUnits: 'pixels',
      pickable: false,
    }));

    layers.push(new PolygonLayer({
      id: 'campus-grass-overlay',
      data: [{ polygon: CAMPUS_FENCE_LOOP }],
      getPolygon: d => d.polygon,
      extruded: false,
      getFillColor: [76, 155, 70, 40],
      pickable: false,
    }));

    // LAYER 2: CAMPUS BORDER
    layers.push(...buildCampusBorderWithLabels(viewState));

    // LAYER 3: 3D BUILDINGS
    Object.values(BUILDINGS).forEach(bldg => {
      // Hide procedural block for library since we have a 3D model
      if (bldg.id === 'YSR_LIBRARY' || bldg.id === 'BS_HSS') return;

      const isActiveBldg = bldg.id === activeBuildingId;
      const bldgMode = isActiveBldg ? mode : 'block';

      if (bldgMode === 'block') {
        layers.push(...buildBlockLayers(bldg, onBuildingClick, hoveredBuildingId, onBuildingHover));
      } else {
        layers.push(...buildFloorLayers(bldg, roomsData, activeFloor, selectedRoom, hoveredRoom, onRoomClick, onRoomHover));
      }
    });

    // LAYER 4: BUILDING LABELS — enhanced for visibility at all zoom levels
    const labelData = Object.values(BUILDINGS).map(b => ({
      id:           b.id,
      centroid:     b.centroid,
      name:         b.name,
      shortName:    b.shortName,
      floors:       b.floors,
      floorHeight:  b.floorHeight || FLOOR_HEIGHT,
      type:         b.type,
      labelAnchor:  b.labelAnchor,
      accentRgb:    b.wallColors?.[0]?.accentRgb,
    }));
    layers.push(...buildLabelLayer(labelData, activeBuildingId, viewState, mode));

    // LAYER 5: NAVIGATION ROUTE
    if (routeGeoJson) {
      const building = BUILDINGS[activeBuildingId];
      const z = (activeFloor || 0) * (building?.floorHeight || FLOOR_HEIGHT) + 0.3;
      layers.push(new LineLayer({
        id: 'route',
        data: routeGeoJson.geometry.coordinates.slice(0,-1).map((c,i) => ({
          from: [...c, z],
          to:   [...routeGeoJson.geometry.coordinates[i+1], z],
        })),
        getSourcePosition: d => d.from,
        getTargetPosition: d => d.to,
        getColor: [251,191,36,230],
        getWidth: 4,
        widthUnits: 'pixels',
      }));
    }

    // LAYER 6: SELECTED ROOM BEACON
    // Dynamic Events Scatterplot Layer (Orange pulsing beacons for all events on the campus map)
    if (eventsData && eventsData.length > 0) {
      layers.push(new ScatterplotLayer({
        id: 'all-events-beacons',
        data: eventsData,
        getPosition: d => [d.longitude, d.latitude, (d.floor_number || 0) * FLOOR_HEIGHT + 0.5],
        getRadius: 8,
        radiusUnits: 'meters',
        getFillColor: [245, 158, 11, 150], // Pulsing orange glow
        getLineColor: [255, 255, 255, 230],
        lineWidthMinPixels: 1.5,
        pickable: true,
        onClick: ({ object }) => {
          if (!object) return;
          const mappedObject = {
            id: object.id.toString(),
            building_id: '',
            building_name: object.location || 'Campus Center',
            floor: object.floor_number || 0,
            name: object.name,
            type: 'event',
            category: 'Event',
            entrance_lat: object.latitude,
            entrance_lng: object.longitude,
            description: object.description,
            is_contextual_entity: true,
            is_event: true,
            allowed_roles: object.allowed_roles || ['student', 'faculty', 'admin', 'visitor'],
            open_time: object.open_time || null,
            close_time: object.close_time || null,
            event_date: object.event_date || ''
          };
          onRoomClick(mappedObject, object.floor_number || 0);
        },
        onHover: ({ object }) => {
          if (object) {
            onRoomHover({
              name: object.name,
              type: 'event',
              floor: object.floor_number || 0
            });
            document.body.style.cursor = 'pointer';
          } else {
            onRoomHover(null);
            document.body.style.cursor = '';
          }
        }
      }));
    }

    // Selected spatial coordinates marker / glowing beacon
    if (selectedRoom && selectedRoom.entrance_lng && selectedRoom.entrance_lat) {
      const building = BUILDINGS[activeBuildingId];
      const z = selectedRoom.is_contextual_entity
        ? 0.5
        : (activeFloor || 0) * (building?.floorHeight || FLOOR_HEIGHT) + 0.5;

      layers.push(new ScatterplotLayer({
        id: 'selected-beacon-glow',
        data: [{ position: [selectedRoom.entrance_lng, selectedRoom.entrance_lat, z] }],
        getPosition: d => d.position,
        getRadius: 15,
        radiusUnits: 'meters',
        getFillColor: [56, 189, 248, 85],
        pickable: false,
      }));

      layers.push(new ScatterplotLayer({
        id: 'selected-beacon-core',
        data: [{ position: [selectedRoom.entrance_lng, selectedRoom.entrance_lat, z] }],
        getPosition: d => d.position,
        getRadius: 3.5,
        radiusUnits: 'meters',
        getFillColor: [14, 165, 233, 255],
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 1.5,
        pickable: false,
      }));
    }

    // Library 3D GLB Model Layer
    layers.push(new ScenegraphLayer({
      id: 'library-3d-model',
      data: [{ position: [83.3760449, 18.1496610] }],
      scenegraph: '/Models/Library.glb',
      loaders: [GLTFLoader],
      _lighting: 'pbr',
      getPosition: d => d.position,
      getOrientation: [0, 0, 80], // Rotated by 10 degrees south
      getScale: [1, 1, 1],
      getTranslation: [0, 0, 0],
      pickable: true,
      onClick: () => {
        if (onLibrary3DClick) onLibrary3DClick();
      },
      onHover: ({ object }) => {
        if (object) document.body.style.cursor = 'pointer';
      }
    }));

    // First Year Block 3D GLB Model Layer
    layers.push(new ScenegraphLayer({
      id: 'first-year-block-3d-model',
      data: [{ position: [83.3744137, 18.1516870] }],
      scenegraph: '/Models/First Year Block.glb',
      loaders: [GLTFLoader],
      _lighting: 'pbr',
      getPosition: d => d.position,
      getOrientation: [90, 0, 90], // Pitched up, facing East
      getScale: [1, 1, 1],
      getTranslation: [0, 0, 0],
      pickable: true,
      onClick: () => {
        if (onFirstYear3DClick) onFirstYear3DClick();
      },
      onHover: ({ object }) => {
        if (object) document.body.style.cursor = 'pointer';
      }
    }));

    // Guest House 3D GLB Model Layer
    layers.push(new ScenegraphLayer({
      id: 'guest-house-3d-model',
      data: [{ position: [83.3779896, 18.1510952] }],
      scenegraph: '/Models/Guest House.glb',
      loaders: [GLTFLoader],
      _lighting: 'pbr',
      getPosition: d => d.position,
      getOrientation: [0, 0, 0], 
      getScale: [1, 1, 1],
      getTranslation: [0, 0, 0],
      pickable: false,
    }));

    // Main Gate 3D GLB Model Layer
    layers.push(new ScenegraphLayer({
      id: 'maingate-3d-model',
      data: [{ position: [83.3801354, 18.1519123] }],
      scenegraph: '/Models/MainGate.glb',
      loaders: [GLTFLoader],
      _lighting: 'pbr',
      getPosition: d => d.position,
      getOrientation: [0, 0, 90], // Reversed orientation
      getScale: [1, 1, 1],
      getTranslation: [0, 0, 0],
      pickable: false,
    }));

    return layers.filter(Boolean);
  }, [roomsData, mode, activeBuildingId, activeFloor, selectedRoom, hoveredRoom, hoveredBuildingId, onBuildingClick, onBuildingHover, onRoomClick, onRoomHover, routeGeoJson, viewState, onLibrary3DClick, onFirstYear3DClick, eventsData]);
}