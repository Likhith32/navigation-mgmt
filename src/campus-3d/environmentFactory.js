// environmentFactory.js — Ground, Roads, Campus Fence, Trees, Street Lights
// All positioned using real GeoJSON coordinates via geoUtils

import * as THREE from 'three';
import { lineToWorld, lngLatToWorld } from './geoUtils';

// ─────────────────────────────────────────────────────────────────────────────
//  GROUND PLANE
// ─────────────────────────────────────────────────────────────────────────────
export function createGround(isNight) {
  const geo = new THREE.PlaneGeometry(600, 600, 1, 1);
  const mat = new THREE.MeshLambertMaterial({
    color: isNight ? 0x0e1a10 : 0x2d5a27,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.position.y = -0.01;
  return mesh;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CAMPUS BOUNDARY FENCE
//  Uses the outer convex hull from buildings.json polygon coordinates
// ─────────────────────────────────────────────────────────────────────────────

// Manually defined campus perimeter from the real boundary visible in the 2D map
// (These approximate the teal boundary line in the screenshot)
const CAMPUS_FENCE_LNG_LAT = [
  [83.3697, 18.1465], [83.3703, 18.1470], [83.3708, 18.1478],
  [83.3712, 18.1486], [83.3710, 18.1495], [83.3712, 18.1503],
  [83.3715, 18.1510], [83.3720, 18.1515], [83.3727, 18.1520],
  [83.3735, 18.1524], [83.3740, 18.1528], [83.3745, 18.1533],
  [83.3749, 18.1537], [83.3756, 18.1538], [83.3764, 18.1538],
  [83.3771, 18.1537], [83.3779, 18.1536], [83.3784, 18.1534],
  [83.3790, 18.1530], [83.3794, 18.1524], [83.3796, 18.1518],
  [83.3795, 18.1510], [83.3793, 18.1502], [83.3790, 18.1496],
  [83.3788, 18.1490], [83.3787, 18.1482], [83.3785, 18.1476],
  [83.3781, 18.1468], [83.3775, 18.1462], [83.3768, 18.1459],
  [83.3760, 18.1458], [83.3752, 18.1459], [83.3744, 18.1461],
  [83.3736, 18.1462], [83.3728, 18.1462], [83.3720, 18.1462],
  [83.3712, 18.1463], [83.3706, 18.1464], [83.3697, 18.1465],
];

export function createFence(isNight) {
  const group = new THREE.Group();
  const worldPts = CAMPUS_FENCE_LNG_LAT.map(([lng, lat]) => lngLatToWorld(lng, lat));

  const fenceMat = new THREE.MeshLambertMaterial({
    color: isNight ? 0x1a3050 : 0x6b8e6b,
  });
  const glowMat = new THREE.MeshBasicMaterial({
    color: isNight ? 0x38bdf8 : 0x4ade80,
    transparent: true,
    opacity: isNight ? 0.8 : 0.5,
  });

  for (let i = 0; i < worldPts.length - 1; i++) {
    const a = worldPts[i];
    const b = worldPts[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    // Fence panel
    const panelGeo = new THREE.BoxGeometry(len, 1.2, 0.15);
    const panel = new THREE.Mesh(panelGeo, fenceMat);
    panel.position.set((a.x + b.x) / 2, 0.6, (a.z + b.z) / 2);
    panel.rotation.y = angle;
    group.add(panel);

    // Glowing top rail
    const railGeo = new THREE.BoxGeometry(len, 0.12, 0.12);
    const rail = new THREE.Mesh(railGeo, glowMat);
    rail.position.set((a.x + b.x) / 2, 1.26, (a.z + b.z) / 2);
    rail.rotation.y = angle;
    group.add(rail);

    // Fence posts every ~10 units
    const postCount = Math.max(1, Math.floor(len / 10));
    for (let p = 0; p <= postCount; p++) {
      const t = p / postCount;
      const px = a.x + dx * t;
      const pz = a.z + dz * t;
      const postGeo = new THREE.BoxGeometry(0.2, 1.4, 0.2);
      const post = new THREE.Mesh(postGeo, fenceMat);
      post.position.set(px, 0.7, pz);
      group.add(post);
    }
  }

  return group;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ROADS from campus_paths.json features
// ─────────────────────────────────────────────────────────────────────────────
const ROAD_CONFIG = {
  primary:   { width: 5.5, color: 0x555555, nightColor: 0x1a1a1a, lineColor: 0xffffff },
  secondary: { width: 3.5, color: 0x686868, nightColor: 0x222222, lineColor: 0xffffff },
  tertiary:  { width: 2.2, color: 0x787878, nightColor: 0x2a2a2a, lineColor: 0xffffff },
};

function buildRoadSegment(a, b, width, color) {
  const dx   = b.x - a.x;
  const dz   = b.z - a.z;
  const len  = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);
  const geo  = new THREE.PlaneGeometry(len + 0.1, width);
  const mat  = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = -angle;
  mesh.position.set((a.x + b.x) / 2, 0.005, (a.z + b.z) / 2);
  mesh.receiveShadow = true;
  return mesh;
}

function buildCenterLine(a, b, color) {
  const pts = [
    new THREE.Vector3(a.x, 0.015, a.z),
    new THREE.Vector3(b.x, 0.015, b.z),
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 });
  return new THREE.Line(geo, mat);
}

export function createRoads(pathsGeoJson, isNight) {
  const group = new THREE.Group();
  if (!pathsGeoJson?.features) return group;

  pathsGeoJson.features.forEach(feature => {
    const type   = feature.properties.type || 'secondary';
    const cfg    = ROAD_CONFIG[type] || ROAD_CONFIG.secondary;
    const color  = isNight ? cfg.nightColor : cfg.color;
    const coords = feature.geometry.coordinates;
    const world  = lineToWorld(coords);

    for (let i = 0; i < world.length - 1; i++) {
      const seg = buildRoadSegment(world[i], world[i + 1], cfg.width, color);
      seg.userData = {
        isRoad: true,
        name: feature.properties.name,
        type,
      };
      group.add(seg);

      // Dashed center line
      const line = buildCenterLine(world[i], world[i + 1], cfg.lineColor);
      group.add(line);
    }
  });

  return group;
}

// ─────────────────────────────────────────────────────────────────────────────
//  TREES  — placed alongside roads and in open campus areas
// ─────────────────────────────────────────────────────────────────────────────

// Tree positions derived from visual analysis of the campus map
// Placed along fence line, between buildings, and open green areas
const TREE_POSITIONS_LNG_LAT = [
  // Along north fence
  [83.3720, 18.1513], [83.3728, 18.1516], [83.3736, 18.1519],
  [83.3744, 18.1521], [83.3752, 18.1522], [83.3760, 18.1522],
  [83.3768, 18.1521], [83.3776, 18.1519],
  // Along south fence
  [83.3720, 18.1468], [83.3728, 18.1465], [83.3736, 18.1463],
  [83.3744, 18.1463], [83.3752, 18.1463], [83.3760, 18.1463],
  // West side
  [83.3704, 18.1478], [83.3704, 18.1488], [83.3704, 18.1498],
  [83.3704, 18.1508],
  // East side
  [83.3788, 18.1476], [83.3788, 18.1486], [83.3788, 18.1496],
  [83.3788, 18.1506],
  // Central green island
  [83.3742, 18.1490], [83.3748, 18.1492], [83.3754, 18.1494],
  [83.3760, 18.1492], [83.3742, 18.1500], [83.3748, 18.1502],
  // Between hostels and academic
  [83.3732, 18.1495], [83.3734, 18.1502], [83.3736, 18.1508],
  // Near library
  [83.3758, 18.1498], [83.3762, 18.1498], [83.3760, 18.1502],
  // Scattered
  [83.3718, 18.1490], [83.3722, 18.1498], [83.3770, 18.1490],
  [83.3774, 18.1498],
];

function createTree(x, z, isNight, seed) {
  const g = new THREE.Group();
  const rng = Math.sin(seed * 127.1 + 311.7) * 0.5 + 0.5;
  const scale = 0.75 + rng * 0.5;

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.18 * scale, 0.26 * scale, 2.2 * scale, 7);
  const trunkMat = new THREE.MeshLambertMaterial({ color: isNight ? 0x1a0e05 : 0x4a2e10 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.1 * scale;
  trunk.castShadow = true;
  g.add(trunk);

  // Canopy — 3 stacked cones for a fuller look
  const leafColor = isNight ? 0x0a1a0c : (rng > 0.5 ? 0x2d6a4f : 0x1b4332);
  const leafMat   = new THREE.MeshLambertMaterial({ color: leafColor });
  [
    { r: 1.6 * scale, h: 2.2 * scale, y: 3.2 * scale },
    { r: 1.2 * scale, h: 1.8 * scale, y: 4.5 * scale },
    { r: 0.7 * scale, h: 1.4 * scale, y: 5.5 * scale },
  ].forEach(({ r, h, y }) => {
    const coneGeo = new THREE.ConeGeometry(r, h, 8);
    const cone    = new THREE.Mesh(coneGeo, leafMat);
    cone.position.y = y;
    cone.castShadow = true;
    g.add(cone);
  });

  g.position.set(x, 0, z);
  return g;
}

export function createTrees(isNight) {
  const group = new THREE.Group();
  TREE_POSITIONS_LNG_LAT.forEach(([lng, lat], i) => {
    const { x, z } = lngLatToWorld(lng, lat);
    const tree = createTree(x, z, isNight, i);
    group.add(tree);
  });
  return group;
}

// ─────────────────────────────────────────────────────────────────────────────
//  STREET LIGHTS — placed along major roads
// ─────────────────────────────────────────────────────────────────────────────
const LAMP_POSITIONS_LNG_LAT = [
  // Main Campus Road
  [83.3720, 18.1490], [83.3730, 18.1489], [83.3740, 18.1487],
  [83.3750, 18.1488], [83.3760, 18.1492],
  // North Loop Road
  [83.3762, 18.1493], [83.3768, 18.1488], [83.3769, 18.1483],
  [83.3779, 18.1482], [83.3781, 18.1485],
  // East Academic Road
  [83.3783, 18.1490], [83.3784, 18.1495],
  // Internal Road West
  [83.3780, 18.1505], [83.3770, 18.1505], [83.3760, 18.1505],
  [83.3750, 18.1509], [83.3748, 18.1512],
  // Gate Road
  [83.3795, 18.1517], [83.3793, 18.1524], [83.3787, 18.1531],
  [83.3779, 18.1534], [83.3768, 18.1536], [83.3756, 18.1536],
  [83.3749, 18.1534],
];

export function createStreetLights(isNight) {
  const group = new THREE.Group();

  const postMat  = new THREE.MeshLambertMaterial({ color: isNight ? 0x2a2a2a : 0x374151 });
  const armMat   = new THREE.MeshLambertMaterial({ color: isNight ? 0x333333 : 0x4b5563 });
  const bulbMat  = new THREE.MeshBasicMaterial({ color: isNight ? 0xfff8e0 : 0xd1d5db });

  // Glow canvas for night
  let glowTex = null;
  if (isNight) {
    const gc = document.createElement('canvas');
    gc.width = 64; gc.height = 64;
    const gctx = gc.getContext('2d');
    const grad = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0,   'rgba(255,240,160,0.9)');
    grad.addColorStop(0.4, 'rgba(255,220,100,0.4)');
    grad.addColorStop(1,   'rgba(255,200,80,0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 64, 64);
    glowTex = new THREE.CanvasTexture(gc);
  }

  LAMP_POSITIONS_LNG_LAT.forEach(([lng, lat], i) => {
    const { x, z } = lngLatToWorld(lng, lat);
    const lampGroup = new THREE.Group();

    // Post
    const postGeo = new THREE.CylinderGeometry(0.08, 0.12, 6, 6);
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 3;
    post.castShadow = true;
    lampGroup.add(post);

    // Arm
    const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 5);
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(0.75, 6.1, 0);
    arm.rotation.z = Math.PI / 2;
    lampGroup.add(arm);

    // Bulb housing
    const bulbGeo = new THREE.SphereGeometry(0.22, 8, 8);
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(1.5, 6.1, 0);
    lampGroup.add(bulb);

    // Night-only: point light + glow sprite
    if (isNight) {
      const pt = new THREE.PointLight(0xffd080, 0.9, 20, 1.8);
      pt.position.set(1.5, 6.1, 0);
      lampGroup.add(pt);

      const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthTest: false });
      const glow = new THREE.Sprite(glowMat);
      glow.scale.set(8, 8, 1);
      glow.position.set(1.5, 6.4, 0);
      lampGroup.add(glow);
    }

    lampGroup.position.set(x, 0, z);
    // Alternate arm direction for opposing sides of road
    if (i % 2 === 1) lampGroup.rotation.y = Math.PI;
    group.add(lampGroup);
  });

  return group;
}

// ─────────────────────────────────────────────────────────────────────────────
//  STARS & MOON (night only)
// ─────────────────────────────────────────────────────────────────────────────
export function createNightSky() {
  const group = new THREE.Group();

  // Stars
  const starVerts = [];
  for (let i = 0; i < 1200; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 280 + Math.random() * 50;
    starVerts.push(
      r * Math.sin(phi) * Math.cos(theta),
      Math.abs(r * Math.cos(phi)) + 15,
      r * Math.sin(phi) * Math.sin(theta)
    );
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, transparent: true, opacity: 0.85 });
  group.add(new THREE.Points(starGeo, starMat));

  // Moon
  const moonGeo = new THREE.SphereGeometry(5, 20, 20);
  const moonMat = new THREE.MeshBasicMaterial({ color: 0xe8e8d0 });
  const moon = new THREE.Mesh(moonGeo, moonMat);
  moon.position.set(-100, 160, -150);
  group.add(moon);

  // Moon halo glow
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 128; haloCanvas.height = 128;
  const hctx = haloCanvas.getContext('2d');
  const hgrad = hctx.createRadialGradient(64, 64, 10, 64, 64, 64);
  hgrad.addColorStop(0, 'rgba(220,220,200,0.25)');
  hgrad.addColorStop(1, 'rgba(220,220,200,0)');
  hctx.fillStyle = hgrad;
  hctx.fillRect(0, 0, 128, 128);
  const haloTex = new THREE.CanvasTexture(haloCanvas);
  const haloMat = new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthTest: false });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(30, 30, 1);
  halo.position.set(-100, 160, -150);
  group.add(halo);

  return group;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SUN (day only)
// ─────────────────────────────────────────────────────────────────────────────
export function createSun() {
  const geo = new THREE.SphereGeometry(4, 16, 16);
  const mat = new THREE.MeshBasicMaterial({ color: 0xfff7c0 });
  const sun = new THREE.Mesh(geo, mat);
  sun.position.set(80, 130, -100);
  return sun;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CAMPUS NAME BOARD
// ─────────────────────────────────────────────────────────────────────────────
export function createNameBoard(isNight) {
  const canvas = document.createElement('canvas');
  canvas.width  = 1024;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = isNight ? '#0a1628' : '#1e3a5f';
  ctx.beginPath();
  ctx.roundRect(8, 8, 1008, 176, 18);
  ctx.fill();

  ctx.fillStyle = isNight ? '#38bdf8' : '#f0e6c8';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = isNight ? '#38bdf8' : 'transparent';
  ctx.shadowBlur  = isNight ? 18 : 0;
  ctx.fillText('JNTU Vizianagaram', 512, 100);

  ctx.font = '28px system-ui, Arial';
  ctx.fillStyle = isNight ? 'rgba(148,210,250,0.7)' : 'rgba(240,230,200,0.75)';
  ctx.shadowBlur = 0;
  ctx.fillText('Jawaharlal Nehru Technological University', 512, 148);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(42, 8, 1);

  // Position at south campus entrance area
  const pos = lngLatToWorld(83.375200, 18.1480);
  sprite.position.set(pos.x, 22, pos.z);
  return sprite;
}