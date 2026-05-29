// CampusMap3D.jsx — PRIMARY 3D Campus Map
// Features:
//   • Real georeferenced buildings from buildings.json
//   • Real road network from campus_paths.json
//   • Campus fence boundary
//   • Georeferenced trees & street lights
//   • Full 360° orbit + pan + zoom
//   • Cinematic flythrough (F key)
//   • Day/Night toggle (N key)
//   • Building raycasting → floor explorer → room panel
//   • Role-based access display

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { CameraSystem } from './cameraSystem';
import { createBuilding, createFloorHighlight, BUILDING_VISUALS } from './buildingFactory';
import {
  createGround, createFence, createRoads, createTrees,
  createStreetLights, createNightSky, createSun, createNameBoard,
} from './environmentFactory';
import InfoPanel from './InfoPanel';
import './CampusMap3D.css';

// ── DATA IMPORTS ─────────────────────────────────────────────────────────────
import buildingsGeoJson from './data/buildings.json';
import pathsGeoJson     from './data/campus_paths.json';
import roomsData        from './data/rooms.json';

// ─────────────────────────────────────────────────────────────────────────────
//  SCENE BUILDER
// ─────────────────────────────────────────────────────────────────────────────
function buildScene(scene, pathsData, isNight) {
  // Clear everything
  while (scene.children.length > 0) scene.remove(scene.children[0]);

  // ── Sky ───────────────────────────────────────────────────────────────────
  scene.background = new THREE.Color(isNight ? 0x040810 : 0x7ec8e3);
  scene.fog = new THREE.FogExp2(isNight ? 0x060c18 : 0x8dd4e8, 0.0025);

  // ── Lighting ──────────────────────────────────────────────────────────────
  const ambient = new THREE.AmbientLight(
    isNight ? 0x0a1530 : 0xffffff,
    isNight ? 0.30 : 0.55,
  );
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(
    isNight ? 0x0a1530 : 0xfff4e0,
    isNight ? 0 : 1.1,
  );
  sun.position.set(80, 130, 60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near   = 1;
  sun.shadow.camera.far    = 400;
  sun.shadow.camera.left   = -150;
  sun.shadow.camera.right  =  150;
  sun.shadow.camera.top    =  150;
  sun.shadow.camera.bottom = -150;
  scene.add(sun);

  // Hemisphere light for soft sky bounce
  const hemi = new THREE.HemisphereLight(
    isNight ? 0x0a1040 : 0x87ceeb,
    isNight ? 0x050a10 : 0x3a6b35,
    isNight ? 0.2 : 0.45,
  );
  scene.add(hemi);

  // ── Ground ────────────────────────────────────────────────────────────────
  scene.add(createGround(isNight));

  // ── Roads ─────────────────────────────────────────────────────────────────
  scene.add(createRoads(pathsData, isNight));

  // ── Fence ─────────────────────────────────────────────────────────────────
  scene.add(createFence(isNight));

  // ── Trees ─────────────────────────────────────────────────────────────────
  scene.add(createTrees(isNight));

  // ── Street lights ─────────────────────────────────────────────────────────
  scene.add(createStreetLights(isNight));

  // ── Sky elements ──────────────────────────────────────────────────────────
  if (isNight) {
    scene.add(createNightSky());
  } else {
    scene.add(createSun());
  }

  // ── Name board ────────────────────────────────────────────────────────────
  scene.add(createNameBoard(isNight));
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CampusMap3D() {
  const mountRef      = useRef(null);
  const rendererRef   = useRef(null);
  const sceneRef      = useRef(null);
  const cameraRef     = useRef(null);
  const camSysRef     = useRef(null);
  const clockRef      = useRef(new THREE.Clock());
  const rafRef        = useRef(null);
  const buildingMeshesRef = useRef([]);  // [{group, id}]
  const floorOverlayRef   = useRef(null);
  const highlightedRef    = useRef(null);
  const raycasterRef      = useRef(new THREE.Raycaster());
  const isDragging        = useRef(false);
  const mouseDownPos      = useRef({ x: 0, y: 0 });

  // ── UI State ────────────────────────────────────────────────────────────────
  const [isNight,          setIsNight]          = useState(false);
  const [isCinematic,      setIsCinematic]      = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);   // THREE.Group
  const [activeFloor,      setActiveFloor]      = useState(null);
  const [tooltip,          setTooltip]          = useState(null);
  const [userRole,         setUserRole]         = useState('student');
  const [fps,              setFps]              = useState(0);

  const rooms = useMemo(() => roomsData?.rooms || [], []);

  // ── CLEAR HIGHLIGHT ──────────────────────────────────────────────────────────
  const clearHighlight = useCallback(() => {
    if (highlightedRef.current) {
      highlightedRef.current.traverse(child => {
        if (child.isMesh && child.userData.isBuilding && child.material.emissive) {
          child.material.emissive.set(0x000000);
          child.material.emissiveIntensity = 0;
        }
      });
      highlightedRef.current = null;
    }
    if (floorOverlayRef.current) {
      floorOverlayRef.current.parent?.remove(floorOverlayRef.current);
      floorOverlayRef.current = null;
    }
  }, []);

  // ── HIGHLIGHT BUILDING ───────────────────────────────────────────────────────
  const highlightBuilding = useCallback((group) => {
    clearHighlight();
    group.traverse(child => {
      if (child.isMesh && child.userData.isBuilding) {
        child.material.emissive = new THREE.Color(0x1d4ed8);
        child.material.emissiveIntensity = 0.25;
      }
    });
    highlightedRef.current = group;
  }, [clearHighlight]);

  // ── HIGHLIGHT FLOOR ──────────────────────────────────────────────────────────
  const highlightFloor = useCallback((group, floorIndex) => {
    if (floorOverlayRef.current) {
      floorOverlayRef.current.parent?.remove(floorOverlayRef.current);
    }
    const overlay = createFloorHighlight(group, floorIndex, 0x38bdf8);
    group.add(overlay);
    floorOverlayRef.current = overlay;
  }, []);

  // ── CLOSE PANEL ───────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setSelectedBuilding(null);
    setActiveFloor(null);
    clearHighlight();
    camSysRef.current?.reset();
  }, [clearHighlight]);

  // ── FLOOR SELECT ──────────────────────────────────────────────────────────────
  const handleFloorSelect = useCallback((f) => {
    setActiveFloor(f);
    if (selectedBuilding) highlightFloor(selectedBuilding, f);
  }, [selectedBuilding, highlightFloor]);

  // ── SCENE INIT ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(52, mount.clientWidth / mount.clientHeight, 0.5, 800);
    camera.position.set(-60, 55, 90);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Camera system
    const camSys = new CameraSystem(camera);
    camSysRef.current = camSys;

    // Build static scene (environment)
    buildScene(scene, pathsGeoJson, false);

    // Build buildings
    const bldgMeshes = [];
    buildingsGeoJson.features.forEach(feature => {
      const group = createBuilding(feature, false);
      scene.add(group);
      bldgMeshes.push(group);
    });
    buildingMeshesRef.current = bldgMeshes;

    // FPS counter
    let fCount = 0, lastFpsT = performance.now();

    // Animate
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      fCount++;
      const now = performance.now();
      if (now - lastFpsT >= 1000) {
        setFps(fCount); fCount = 0; lastFpsT = now;
      }

      // Update camera
      camSys.update(delta);

      // Labels always face camera
      bldgMeshes.forEach(group => {
        group.children.forEach(child => {
          if (child.userData.isLabel) child.quaternion.copy(camera.quaternion);
        });
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  // ── NIGHT TOGGLE ───────────────────────────────────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Rebuild environment
    // Remove all non-building objects
    const toRemove = scene.children.filter(c => !c.userData.id);
    toRemove.forEach(c => scene.remove(c));
    buildScene(scene, pathsGeoJson, isNight);

    // Rebuild buildings
    const existing = buildingMeshesRef.current;
    existing.forEach(g => scene.remove(g));
    const newBldgs = buildingsGeoJson.features.map(f => {
      const g = createBuilding(f, isNight);
      scene.add(g);
      return g;
    });
    buildingMeshesRef.current = newBldgs;

    // Re-highlight if something was selected
    if (selectedBuilding) {
      const newGroup = newBldgs.find(g => g.userData.id === selectedBuilding.userData.id);
      if (newGroup) {
        highlightBuilding(newGroup);
        setSelectedBuilding(newGroup);
        if (activeFloor !== null) highlightFloor(newGroup, activeFloor);
      }
    }
  }, [isNight]); // eslint-disable-line

  // ── MOUSE / CAMERA EVENTS ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;
    const cs = camSysRef.current;

    const onDown  = (e) => {
      cs.onMouseDown(e);
      isDragging.current   = false;
      mouseDownPos.current = { x: e.clientX, y: e.clientY };
    };
    const onMove  = (e) => {
      cs.onMouseMove(e);
      const dx = e.clientX - mouseDownPos.current.x;
      const dy = e.clientY - mouseDownPos.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) isDragging.current = true;

      // Hover tooltip raycasting
      const rect = canvas.getBoundingClientRect();
      const ndx  = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
      const ndy  = ((e.clientY - rect.top)  / rect.height) * -2 + 1;
      raycasterRef.current.setFromCamera(new THREE.Vector2(ndx, ndy), cameraRef.current);
      const targets = [];
      buildingMeshesRef.current.forEach(g => g.traverse(c => { if (c.isMesh && c.userData.isBuilding) targets.push(c); }));
      const hits = raycasterRef.current.intersectObjects(targets, false);
      if (hits.length > 0) {
        const bId  = hits[0].object.userData.buildingId;
        const bldg = buildingsGeoJson.features.find(f => f.properties.id === bId);
        if (bldg) {
          canvas.style.cursor = 'pointer';
          setTooltip({ name: bldg.properties.name, type: bldg.properties.type, x: e.clientX, y: e.clientY });
        }
      } else {
        canvas.style.cursor = 'grab';
        setTooltip(null);
      }
    };
    const onUp    = () => cs.onMouseUp();
    const onWheel = (e) => { e.preventDefault(); cs.onWheel(e); };
    const onCtx   = (e) => e.preventDefault();

    const onClick = (e) => {
      if (isDragging.current) return;
      const rect = canvas.getBoundingClientRect();
      const ndx  = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
      const ndy  = ((e.clientY - rect.top)  / rect.height) * -2 + 1;
      raycasterRef.current.setFromCamera(new THREE.Vector2(ndx, ndy), cameraRef.current);
      const targets = [];
      buildingMeshesRef.current.forEach(g => g.traverse(c => { if (c.isMesh && c.userData.isBuilding) targets.push(c); }));
      const hits = raycasterRef.current.intersectObjects(targets, false);
      if (hits.length > 0) {
        const bId    = hits[0].object.userData.buildingId;
        const group  = buildingMeshesRef.current.find(g => g.userData.id === bId);
        if (group) {
          highlightBuilding(group);
          setSelectedBuilding(group);
          setActiveFloor(0);
          highlightFloor(group, 0);
          camSysRef.current.flyToBuilding(group);
        }
      } else {
        // Click on empty → deselect
        clearHighlight();
        setSelectedBuilding(null);
        setActiveFloor(null);
      }
    };

    canvas.addEventListener('mousedown',   onDown);
    canvas.addEventListener('mousemove',   onMove);
    canvas.addEventListener('mouseup',     onUp);
    canvas.addEventListener('click',       onClick);
    canvas.addEventListener('wheel',       onWheel, { passive: false });
    canvas.addEventListener('contextmenu', onCtx);

    // Touch
    canvas.addEventListener('touchstart', (e) => camSysRef.current.onTouchStart(e), { passive: true });
    canvas.addEventListener('touchmove',  (e) => camSysRef.current.onTouchMove(e),  { passive: true });
    canvas.addEventListener('touchend',   ()  => camSysRef.current.onTouchEnd());

    return () => {
      canvas.removeEventListener('mousedown',   onDown);
      canvas.removeEventListener('mousemove',   onMove);
      canvas.removeEventListener('mouseup',     onUp);
      canvas.removeEventListener('click',       onClick);
      canvas.removeEventListener('wheel',       onWheel);
      canvas.removeEventListener('contextmenu', onCtx);
    };
  }, [clearHighlight, highlightBuilding, highlightFloor]);

  // ── KEYBOARD ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        const next = camSysRef.current.toggleCinematic();
        setIsCinematic(next);
        if (next) { setSelectedBuilding(null); clearHighlight(); }
      }
      if (e.key === 'n' || e.key === 'N') setIsNight(v => !v);
      if (e.key === 'Escape') {
        camSysRef.current.cinematic = false;
        setIsCinematic(false);
        handleClose();
      }
      if (e.key === 'r' || e.key === 'R') {
        camSysRef.current.reset();
        setIsCinematic(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearHighlight, handleClose]);

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="campus-3d-root">
      <div ref={mountRef} className="campus-3d-canvas" />

      {/* ── ROLE SELECTOR ── */}
      <div className="c3d-role-bar">
        <span className="c3d-role-label">ROLE</span>
        <select
          value={userRole}
          onChange={e => setUserRole(e.target.value)}
          className="c3d-role-select"
        >
          <option value="student">🧑‍🎓 Student</option>
          <option value="faculty">👨‍🏫 Faculty</option>
          <option value="admin">🛠 Admin</option>
          <option value="visitor">🧭 Visitor</option>
        </select>
      </div>

      {/* ── TITLE BADGE ── */}
      <div className="c3d-badge">
        <div className="c3d-badge-title">JNTU Vizianagaram</div>
        <div className="c3d-badge-sub">3D Interactive Campus</div>
      </div>

      {/* ── TOP RIGHT BUTTONS ── */}
      <div className="c3d-btn-group">
        <button
          className={`c3d-btn ${isNight ? 'c3d-btn-active-blue' : ''}`}
          onClick={() => setIsNight(v => !v)}
          title="Toggle Day/Night (N)"
        >
          {isNight ? '☀️' : '🌙'}
          <span className="c3d-btn-label">{isNight ? 'Day' : 'Night'}</span>
        </button>

        <button
          className={`c3d-btn ${isCinematic ? 'c3d-btn-active-red' : ''}`}
          onClick={() => {
            const next = camSysRef.current.toggleCinematic();
            setIsCinematic(next);
            if (next) { setSelectedBuilding(null); clearHighlight(); }
          }}
          title="Cinematic flythrough (F)"
        >
          {isCinematic ? '⏹' : '🎬'}
          <span className="c3d-btn-label">{isCinematic ? 'Stop' : 'Fly'}</span>
        </button>

        <button
          className="c3d-btn"
          onClick={() => {
            camSysRef.current.reset();
            setIsCinematic(false);
            handleClose();
          }}
          title="Reset view (R)"
        >
          ⟲
          <span className="c3d-btn-label">Reset</span>
        </button>
      </div>

      {/* ── CINEMATIC OVERLAY ── */}
      {isCinematic && (
        <div className="c3d-cinematic-overlay">
          <div className="c3d-cin-letterbox top" />
          <div className="c3d-cin-letterbox bottom" />
          <div className="c3d-cin-label">
            <span className="c3d-cin-dot" />
            CINEMATIC FLYTHROUGH
          </div>
          <div className="c3d-cin-title">JNTU Vizianagaram Campus</div>
          <div className="c3d-cin-esc">Press <kbd>Esc</kbd> or <kbd>F</kbd> to exit · <kbd>N</kbd> toggle night</div>
        </div>
      )}

      {/* ── INFO PANEL ── */}
      {selectedBuilding && (
        <InfoPanel
          building={selectedBuilding}
          rooms={rooms}
          onClose={handleClose}
          onFloorSelect={handleFloorSelect}
          activeFloor={activeFloor}
          userRole={userRole}
        />
      )}

      {/* ── HOVER TOOLTIP ── */}
      {tooltip && !selectedBuilding && (
        <div className="c3d-tooltip" style={{ left: tooltip.x + 14, top: tooltip.y - 36 }}>
          {tooltip.name}
          <span className="c3d-tooltip-sub">{tooltip.type}</span>
        </div>
      )}

      {/* ── CONTROLS HINT ── */}
      <div className="c3d-controls-bar">
        <div className="c3d-hint">
          <span>🖱 Drag orbit</span><span className="sep">·</span>
          <span>Scroll zoom</span><span className="sep">·</span>
          <span>Right-drag pan</span><span className="sep">·</span>
          <kbd>F</kbd><span> Cinematic</span><span className="sep">·</span>
          <kbd>N</kbd><span> Night</span><span className="sep">·</span>
          <kbd>R</kbd><span> Reset</span>
        </div>
      </div>

      {/* ── DAY/NIGHT INDICATOR ── */}
      <div className={`c3d-time-indicator ${isNight ? 'night' : 'day'}`}>
        {isNight ? '🌙 Night' : '☀️ Day'}
      </div>

      {/* ── FPS ── */}
      <div className="c3d-fps">{fps} FPS</div>
    </div>
  );
}