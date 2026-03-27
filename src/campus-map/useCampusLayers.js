// useCampusLayers.js — v8: Multi-building support
import { useMemo } from 'react';
import { PolygonLayer, LineLayer } from '@deck.gl/layers';

export const FLOOR_HEIGHT = 3.5;
export const WALL_DEPTH   = 0.025;

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
      [83.371000, 18.148933],  // NW
      [83.371136, 18.149300],  // NE
      [83.371972, 18.149000],  // SE
      [83.371831, 18.148619],  // SW
    ],
    centroid: [83.371485, 18.148963],
    bbox: {
      minLng: 83.370900,
      maxLng: 83.372100,
      minLat: 18.148500,
      maxLat: 18.149400,
    },
    type: 'boys_hostel',
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
      [83.377219, 18.148769],  // NW
      [83.378094, 18.148717],  // NE
      [83.378075, 18.148333],  // SE
      [83.377178, 18.148364],  // SW
    ],
    centroid: [83.377642, 18.148546],
    bbox: { minLng: 83.377078, maxLng: 83.378194, minLat: 18.148233, maxLat: 18.148869 },
    type: 'girls_hostel',
    floors: 3,
    wallColors: {
      0: { wallRgb:[230,215,200], windowRgb:[55,40,30], accentHex:'#F97316', accentRgb:[249,115,22] },
      1: { wallRgb:[220,205,190], windowRgb:[55,40,30], accentHex:'#EA580C', accentRgb:[234,88,12] },
      2: { wallRgb:[210,195,180], windowRgb:[55,40,30], accentHex:'#C2410C', accentRgb:[194,65,12] },
    },
  },
  BS_HSS: {
    id: 'BS_HSS',
    name: 'BS & HSS Department',
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
    wallColors: {
      0: { wallRgb:[109,185,122], windowRgb:[30,60,35], accentHex:'#6DB97A', accentRgb:[109,185,122] },
      1: { wallRgb:[95,168,108], windowRgb:[30,60,35],  accentHex:'#5DAA6C', accentRgb:[93,170,108] },
    },
  },
  MECH_WORKSHOP_1: {
    id: 'MECH_WORKSHOP_1',
    name: 'Mechanical Workshop 1',
    shortName: 'Mech W/S 1',
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
    wallColors: {
      0: { wallRgb:[74,144,217], windowRgb:[20,40,80], accentHex:'#4A90D9', accentRgb:[74,144,217] },
    },
  },
  MECH_WORKSHOP_2: {
    id: 'MECH_WORKSHOP_2',
    name: 'Mechanical Workshop 2',
    shortName: 'Mech W/S 2',
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
    wallColors: {
      0: { wallRgb:[74,144,217], windowRgb:[20,40,80], accentHex:'#4A90D9', accentRgb:[74,144,217] },
    },
  },
  EXAM_CENTER: {
    id: 'EXAM_CENTER',
    name: 'Exam Evaluation Center',
    shortName: 'Exam Center',
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
    wallColors: {
      0: { wallRgb:[109,185,122], windowRgb:[30,60,35], accentHex:'#6DB97A', accentRgb:[109,185,122] },
    },
  },
  METALLURGICAL_WORKSHOP: {
    id: 'METALLURGICAL_WORKSHOP',
    name: 'Metallurgical Workshop',
    shortName: 'Metall W/S',
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
    wallColors: {
      0: { wallRgb:[139,115,85], windowRgb:[40,30,15], accentHex:'#8B7355', accentRgb:[139,115,85] },
    },
  },
};

export const FLOOR_CONFIG = {
  0: { label: 'Ground', key: 'G', hex: '#D4C9B8', rgb: [212, 201, 184], wallRgb: [212, 201, 184], windowRgb: [45, 58, 82], accentHex: '#0E9F6E', accentRgb: [14, 159, 110] },
  1: { label: 'First',  key: 'F1', hex: '#B8CCAF', rgb: [184, 204, 175], wallRgb: [184, 204, 175], windowRgb: [45, 58, 82], accentHex: '#1A56DB', accentRgb: [26, 86, 219] },
  2: { label: 'Second', key: 'F2', hex: '#B0C4D8', rgb: [176, 196, 216], wallRgb: [176, 196, 216], windowRgb: [45, 58, 82], accentHex: '#7E3AF2', accentRgb: [126, 58, 242] },
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
    panels.push({ polygon:[b(u1,1),b(u0,1),b(u0,1-D),b(u1,1-D),b(u1,1)], face:'south', floorIndex });
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

function buildBlockLayers(building, onClick) {
  const layers = [];
  const { footprint, id, wallColors, floors = 3, floorHeight = FLOOR_HEIGHT } = building;

  Array.from({ length: floors }).forEach((_, f) => {
    const colorCfg = wallColors?.[f] || FLOOR_CONFIG[f];
    const [r, g, b] = colorCfg.wallRgb;
    const zBase = f * (building.floorHeight || FLOOR_HEIGHT);

    layers.push(new PolygonLayer({
      id: `walls-${id}-${f}`,
      data: buildWallPanels(footprint, f).map(p => ({ ...p, polygon: polyZ(p.polygon, zBase) })),
      extruded: true, getPolygon: d => d.polygon, getElevation: () => floorHeight - 0.2,
      getFillColor: d => {
        const shade = d.face==='north' ? 0 : d.face==='south' ? -18 : d.face==='east' ? -28 : -10;
        return [
          Math.min(255, Math.max(0, r + shade)),
          Math.min(255, Math.max(0, g + shade)),
          Math.min(255, Math.max(0, b + shade)),
          245
        ];
      },
      getLineColor: [255, 255, 255, 25], pickable: true, onClick: () => onClick(id),
      onHover: ({ object }) => { document.body.style.cursor = object ? 'pointer' : ''; },
    }));

    layers.push(new PolygonLayer({
      id: `roof-${id}-${f}`,
      data: [{ polygon: polyZ([...building.footprint, building.footprint[0]], zBase + (building.floorHeight || FLOOR_HEIGHT) - 0.2) }],
      extruded: true, getPolygon: d => d.polygon, getElevation: () => 0.2,
      getFillColor: [Math.min(255, r + 25), Math.min(255, g + 25), Math.min(255, b + 25), 255],
      pickable: true, onClick: () => onClick(id),
    }));

    const winSill = zBase + 0.45, winHeight = FLOOR_HEIGHT * 0.60;
    layers.push(new PolygonLayer({
      id: `wins-${id}-${f}`,
      data: buildWindowPanels(footprint, f).map(w => ({ ...w, polygon: polyZ(w.polygon, winSill) })),
      extruded: true, getPolygon: d => d.polygon, getElevation: () => winHeight,
      getFillColor: [...colorCfg.windowRgb, 235], pickable: false,
    }));
  });

  const ring = [...footprint, footprint[0]];
  const bandPts = [];
  Array.from({ length: floors }).forEach((_, f) => {
    const z = (f + 1) * (building.floorHeight || FLOOR_HEIGHT);
    ring.slice(0, -1).forEach((pt, i) => {
      bandPts.push({ from: [pt[0], pt[1], z], to: [ring[i + 1][0], ring[i + 1][1], z] });
    });
  });
  layers.push(new LineLayer({
    id: `bands-${id}`, data: bandPts, getSourcePosition: d => d.from, getTargetPosition: d => d.to,
    getColor: [255, 255, 248, 180], getWidth: 2,
  }));

  const roofZ = floors * (building.floorHeight || FLOOR_HEIGHT);
  layers.push(new PolygonLayer({
    id: `parapet-${id}`, data: [{ polygon: polyZ([...building.footprint, building.footprint[0]], roofZ) }],
    extruded: true, getPolygon: d => d.polygon, getElevation: () => 0.6,
    getFillColor: [205, 200, 192, 230], pickable: false,
  }));

  // Workshop shed roof logic
  if (building.type === 'workshop') {
    const [NW, NE, SE, SW] = building.footprint;
    const roofZLayer = floors * floorHeight;

    // Ridge line down the center of the roof
    const ridgeMid_N = [(NW[0]+NE[0])/2, (NW[1]+NE[1])/2];
    const ridgeMid_S = [(SW[0]+SE[0])/2, (SW[1]+SE[1])/2];

    layers.push(new LineLayer({
      id: `shed-ridge-${building.id}`,
      data: [{
        from: [...ridgeMid_N, roofZLayer + 0.8],
        to:   [...ridgeMid_S, roofZLayer + 0.8],
      }],
      getSourcePosition: d => d.from,
      getTargetPosition: d => d.to,
      getColor: [255, 255, 255, 120],
      getWidth: 3,
      widthUnits: 'pixels',
    }));

    layers.push(new LineLayer({
      id: `shed-slope-${building.id}`,
      data: [
        { from:[...NW, roofZLayer], to:[...ridgeMid_N, roofZLayer+0.8] },
        { from:[...NE, roofZLayer], to:[...ridgeMid_N, roofZLayer+0.8] },
        { from:[...SW, roofZLayer], to:[...ridgeMid_S, roofZLayer+0.8] },
        { from:[...SE, roofZLayer], to:[...ridgeMid_S, roofZLayer+0.8] },
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

    // Walls (dimmed)
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

    // Cells
    const floorRooms = roomsData.filter(rm => rm.floor === f && rm.building_id === id);
    const cells = [];
    const makeC = (u0,u1,v0,v1) => [lerpC(u0,v0),lerpC(u1,v0),lerpC(u1,v1),lerpC(u0,v1),lerpC(u0,v0)];
    
    // Simple grid for demo (matches building shape)
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

// ── MAIN HOOK ──────────────────────────────────────────────────────────────
export function useCampusLayers({
  roomsData, mode, activeBuildingId, activeFloor,
  selectedRoom, hoveredRoom,
  onBuildingClick, onRoomClick, onRoomHover,
  routeGeoJson,
}) {
  return useMemo(() => {
    const layers = [];

    Object.values(BUILDINGS).forEach(bldg => {
      const isActiveBldg = bldg.id === activeBuildingId;
      const bldgMode = isActiveBldg ? mode : 'block';

      if (bldgMode === 'block') {
        layers.push(...buildBlockLayers(bldg, onBuildingClick));
      } else {
        layers.push(...buildFloorLayers(bldg, roomsData, activeFloor, selectedRoom, hoveredRoom, onRoomClick, onRoomHover));
      }
    });

    if (routeGeoJson) {
      const z = (activeFloor || 0) * (BUILDINGS[activeBuildingId]?.floorHeight || FLOOR_HEIGHT) + 0.3;
      layers.push(new LineLayer({
        id: 'route',
        data: routeGeoJson.geometry.coordinates.slice(0,-1).map((c,i) => ({
          from:[...c,z], to:[...routeGeoJson.geometry.coordinates[i+1],z],
        })),
        getSourcePosition: d=>d.from, getTargetPosition: d=>d.to,
        getColor: [251,191,36,230], getWidth: 4, widthUnits: 'pixels',
      }));
    }

    return layers.filter(Boolean);
  }, [roomsData, mode, activeBuildingId, activeFloor, selectedRoom, hoveredRoom, onBuildingClick, onRoomClick, onRoomHover, routeGeoJson]);
}

