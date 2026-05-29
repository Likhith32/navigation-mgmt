// buildingFactory.js — Creates Three.js building meshes from real GeoJSON polygon data
// Uses actual lat/lng coordinates converted to world space via geoUtils

import * as THREE from 'three';
import { ringToWorld, polygonCentroid, polygonBBox } from './geoUtils';

// ── BUILDING TYPE VISUAL CONFIG ──────────────────────────────────────────────
export const BUILDING_VISUALS = {
  hostel: {
    dayWall:    0xd4cfc8, nightWall:  0x1a2a4a,
    dayRoof:    0xb0aca5, nightRoof:  0x0d1828,
    dayAccent:  0x7E3AF2, nightAccent:0x4c1d95,
    windowDay:  0x9bc4e8, windowNight:0xffd080,
    label: 'Hostel', icon: '🏠',
  },
  girls_hostel: {
    dayWall:    0xe8d0cc, nightWall:  0x2a1530,
    dayRoof:    0xc8b0ac, nightRoof:  0x180c1e,
    dayAccent:  0xEC4899, nightAccent:0x9d174d,
    windowDay:  0xf9a8d4, windowNight:0xfda4af,
    label: 'Girls Hostel', icon: '🏠',
  },
  academic: {
    dayWall:    0xc8c4bc, nightWall:  0x10182e,
    dayRoof:    0xa8a49c, nightRoof:  0x080e1a,
    dayAccent:  0x3b82f6, nightAccent:0x1d4ed8,
    windowDay:  0x93c5fd, windowNight:0x7dd3fc,
    label: 'Academic', icon: '🏫',
  },
  workshop: {
    dayWall:    0xa8a49c, nightWall:  0x0e1420,
    dayRoof:    0x6b7280, nightRoof:  0x060a10,
    dayAccent:  0xf59e0b, nightAccent:0x92400e,
    windowDay:  0xfde68a, windowNight:0xfcd34d,
    label: 'Workshop', icon: '⚙️',
  },
  admin: {
    dayWall:    0xd8d0c0, nightWall:  0x141c2c,
    dayRoof:    0xb8b0a0, nightRoof:  0x0c1018,
    dayAccent:  0x6366f1, nightAccent:0x4338ca,
    windowDay:  0xa5b4fc, windowNight:0x818cf8,
    label: 'Admin', icon: '🏛️',
  },
  canteen: {
    dayWall:    0xd4a870, nightWall:  0x1c1208,
    dayRoof:    0xb48850, nightRoof:  0x100a04,
    dayAccent:  0x10b981, nightAccent:0x065f46,
    windowDay:  0x6ee7b7, windowNight:0x34d399,
    label: 'Canteen', icon: '🍔',
  },
  library: {
    dayWall:    0xc8b898, nightWall:  0x121e32,
    dayRoof:    0xa89878, nightRoof:  0x0a1220,
    dayAccent:  0x0ea5e9, nightAccent:0x0369a1,
    windowDay:  0x7dd3fc, windowNight:0x38bdf8,
    label: 'Library', icon: '📚',
  },
};

// ── SHAPE FACTORY: polygon → THREE.Shape ────────────────────────────────────
function makeShapeFromRing(worldPts) {
  const shape = new THREE.Shape();
  if (worldPts.length === 0) return shape;
  shape.moveTo(worldPts[0].x, worldPts[0].z);
  for (let i = 1; i < worldPts.length; i++) {
    shape.lineTo(worldPts[i].x, worldPts[i].z);
  }
  shape.closePath();
  return shape;
}

// ── WINDOW GRID ──────────────────────────────────────────────────────────────
function addWindows(group, w, h, d, floors, vis, isNight) {
  const winColor = isNight ? vis.windowNight : vis.windowDay;
  const winMat = new THREE.MeshBasicMaterial({
    color: winColor,
    transparent: true,
    opacity: isNight ? 0.95 : 0.65,
  });

  const floorH = h / Math.max(floors, 1);
  const colsW  = Math.max(1, Math.floor(w / 2.5));
  const colsD  = Math.max(1, Math.floor(d / 2.5));
  const winW   = Math.min(0.8, (w / colsW) * 0.55);
  const winH   = Math.min(1.1, floorH * 0.45);

  const addFace = (count, faceW, offsetX, offsetZ, rotY) => {
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < count; c++) {
        const geo = new THREE.PlaneGeometry(winW, winH);
        const mesh = new THREE.Mesh(geo, winMat.clone());
        const xPos = -((count - 1) * (faceW / count)) / 2 + c * (faceW / count);
        const yPos = floorH * 0.35 + f * floorH;
        mesh.position.set(xPos + offsetX, yPos, offsetZ);
        if (rotY) mesh.rotation.y = rotY;
        mesh.userData = { isWindow: true };
        group.add(mesh);

        // Night glow point light (only a few)
        if (isNight && f === 0 && c === 0) {
          const pt = new THREE.PointLight(0xffd080, 0.15, 8);
          pt.position.set(xPos + offsetX, yPos, offsetZ * 0.8);
          group.add(pt);
        }
      }
    }
  };

  // Front face
  addFace(colsW, w, 0, d / 2 + 0.02, 0);
  // Back face
  addFace(colsW, w, 0, -(d / 2 + 0.02), Math.PI);
  // Left face
  addFace(colsD, d, -(w / 2 + 0.02), 0, -Math.PI / 2);
  // Right face
  addFace(colsD, d,  (w / 2 + 0.02), 0,  Math.PI / 2);
}

// ── FLOATING LABEL ───────────────────────────────────────────────────────────
function makeLabel(name, shortName, type, isNight) {
  const canvas  = document.createElement('canvas');
  canvas.width  = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  // Background pill
  ctx.clearRect(0, 0, 512, 160);
  ctx.fillStyle = isNight ? 'rgba(10,15,40,0.85)' : 'rgba(255,255,255,0.88)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 144, 18);
  ctx.fill();

  // Accent bar top
  ctx.fillStyle = isNight ? '#38bdf8' : '#1d4ed8';
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 8, [18, 18, 0, 0]);
  ctx.fill();

  // Short name
  ctx.font = 'bold 52px system-ui, Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = isNight ? '#e0f2fe' : '#1e293b';
  ctx.fillText(shortName || name, 256, 82);

  // Type subtitle
  ctx.font = '26px system-ui, Arial';
  ctx.fillStyle = isNight ? 'rgba(148,210,250,0.75)' : 'rgba(71,85,105,0.75)';
  ctx.fillText(type, 256, 122);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.userData = { isLabel: true };
  return sprite;
}

// ── MAIN FACTORY ─────────────────────────────────────────────────────────────
export function createBuilding(feature, isNight) {
  const props = feature.properties;
  const type  = props.type || 'academic';
  const vis   = BUILDING_VISUALS[type] || BUILDING_VISUALS.academic;
  const floors = props.floors || 1;
  const floorH = props.floor_height || 3.5;
  const totalH = floors * floorH;

  // Convert GeoJSON polygon to world coords
  const ring      = feature.geometry.coordinates[0];
  const worldPts  = ringToWorld(ring);
  const centroid  = polygonCentroid(worldPts);
  const bbox      = polygonBBox(worldPts);
  const w = Math.max(bbox.w, 4);
  const d = Math.max(bbox.d, 4);

  const group = new THREE.Group();
  group.userData = {
    id:        props.id,
    name:      props.name,
    shortName: props.short_name,
    type,
    floors,
    floorH,
    totalH,
    centroid,
    bbox,
    w, d,
    props,                   // full properties for info panel
    worldPts,
  };

  // ── BODY (extruded polygon shape) ─────────────────────────────────────────
  // Use BoxGeometry sized to bbox for simplicity & raycasting reliability
  const bodyGeo = new THREE.BoxGeometry(w, totalH, d);
  const bodyMat = new THREE.MeshLambertMaterial({
    color: isNight ? vis.nightWall : vis.dayWall,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = totalH / 2;
  body.castShadow  = true;
  body.receiveShadow = true;
  body.userData = { isBuilding: true, buildingId: props.id };
  group.add(body);

  // ── FLOOR DIVIDERS (horizontal lines between floors) ──────────────────────
  for (let f = 1; f < floors; f++) {
    const divGeo = new THREE.BoxGeometry(w + 0.1, 0.18, d + 0.1);
    const divMat = new THREE.MeshLambertMaterial({
      color: isNight ? 0x1e3050 : 0xb0aca5,
    });
    const div = new THREE.Mesh(divGeo, divMat);
    div.position.y = f * floorH;
    group.add(div);
  }

  // ── ROOF ──────────────────────────────────────────────────────────────────
  const roofGeo = new THREE.BoxGeometry(w + 0.4, 0.35, d + 0.4);
  const roofMat = new THREE.MeshLambertMaterial({
    color: isNight ? vis.nightRoof : vis.dayRoof,
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = totalH + 0.175;
  group.add(roof);

  // Parapet walls on roof
  [[w/2+0.2, 0, 0, Math.PI/2], [-w/2-0.2, 0, 0, Math.PI/2],
   [0, 0, d/2+0.2, 0],        [0, 0, -d/2-0.2, 0]].forEach(([px, py, pz, ry]) => {
    const pgeo = new THREE.BoxGeometry(ry === 0 ? w : d, 0.8, 0.3);
    const pmat = new THREE.MeshLambertMaterial({ color: isNight ? 0x0d1828 : 0x9ca3af });
    const pm = new THREE.Mesh(pgeo, pmat);
    pm.position.set(px, totalH + 0.7, pz);
    pm.rotation.y = ry;
    group.add(pm);
  });

  // ── ACCENT COLUMN (corner pillar style) ───────────────────────────────────
  const accentMat = new THREE.MeshLambertMaterial({
    color: isNight ? vis.nightAccent : vis.dayAccent,
  });
  [[-w/2, d/2], [w/2, d/2], [-w/2, -d/2], [w/2, -d/2]].forEach(([px, pz]) => {
    const cGeo = new THREE.BoxGeometry(0.4, totalH + 0.35, 0.4);
    const c = new THREE.Mesh(cGeo, accentMat);
    c.position.set(px, totalH / 2, pz);
    group.add(c);
  });

  // ── ENTRANCE CANOPY ───────────────────────────────────────────────────────
  const canopyGeo = new THREE.BoxGeometry(Math.min(w * 0.4, 4), 0.2, 1.5);
  const canopyMat = new THREE.MeshLambertMaterial({
    color: isNight ? vis.nightAccent : vis.dayAccent,
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 2.8, d / 2 + 0.75);
  group.add(canopy);

  // Entrance door
  const doorGeo = new THREE.BoxGeometry(Math.min(w * 0.25, 2.4), 2.4, 0.15);
  const doorMat = new THREE.MeshLambertMaterial({
    color: isNight ? 0x1e3a5f : 0x64748b,
  });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 1.2, d / 2 + 0.08);
  group.add(door);

  // ── WINDOWS ───────────────────────────────────────────────────────────────
  if (props.windows !== false) {
    addWindows(group, w, totalH, d, floors, vis, isNight);
  }

  // ── LABEL ─────────────────────────────────────────────────────────────────
  const label = makeLabel(props.name, props.short_name, vis.label, isNight);
  label.scale.set(Math.max(w * 0.55, 8), 2.5, 1);
  label.position.y = totalH + 3.5;
  group.add(label);

  // Position group at world centroid
  group.position.set(centroid.x, 0, centroid.z);
  return group;
}

// ── FLOOR HIGHLIGHT OVERLAY ──────────────────────────────────────────────────
export function createFloorHighlight(buildingGroup, floorIndex, color = 0x38bdf8) {
  const { w, d, floorH } = buildingGroup.userData;
  const geo = new THREE.BoxGeometry(w + 0.05, floorH - 0.1, d + 0.05);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.22,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = floorIndex * floorH + floorH / 2;
  mesh.userData = { isFloorHighlight: true };
  return mesh;
}