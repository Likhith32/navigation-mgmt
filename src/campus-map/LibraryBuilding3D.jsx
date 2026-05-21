import React, { useState, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// cn helper utility
const cn = (...classes) => classes.filter(Boolean).join(' ');

// Default Floors and Rooms dataset according to specifications
const defaultBuildingData = {
  name: "YSR Central Library",
  floors: [
    {
      level: 0,
      name: "Ground Floor",
      badge: "G",
      rooms: [
        { name: "Reception", icon: "🏢", dimensions: "8m × 6m", purpose: "Front-desk assistance, general registration, and catalog inquiry hub.", accessible: true },
        { name: "Reference Room", icon: "📖", dimensions: "10m × 8m", purpose: "Quick lookup tables, encyclopedia database, and physical journals.", accessible: true },
        { name: "Bag Keeping", icon: "🎒", dimensions: "4m × 4m", purpose: "Safe baggage deposit locker grids for student personal items.", accessible: true },
        { name: "Pharmacy", icon: "💊", dimensions: "4m × 4m", purpose: "First-aid supplies, pharmacy store, and basic medical help.", accessible: true }
      ]
    },
    {
      level: 1,
      name: "First Floor",
      badge: "F1",
      rooms: [
        { name: "Archive", icon: "🗄️", dimensions: "12m × 10m", purpose: "Historical newspapers, ancient manuscripts, and doctoral thesis archiving.", accessible: true },
        { name: "Journals Section", icon: "📰", dimensions: "12m × 10m", purpose: "Latest scientific papers, peer-reviewed journals, and periodicals.", accessible: true },
        { name: "Study Room", icon: "✍️", dimensions: "8m × 8m", purpose: "Quiet individual study cubicles and shared reading tables.", accessible: true },
        { name: "Girls Washroom", icon: "🚺", dimensions: "4m × 4m", purpose: "Sanitized female restrooms with automatic hygiene systems.", accessible: true },
        { name: "Conference Room", icon: "👥", dimensions: "10m × 8m", purpose: "Seminar room with projector for faculty group discussions.", accessible: true }
      ]
    },
    {
      level: 2,
      name: "Second Floor",
      badge: "F2",
      rooms: [
        { name: "Digital Library", icon: "💻", dimensions: "20m × 15m", purpose: "High-speed computer grid for searching IEEE databases and web journals.", accessible: true },
        { name: "Faculty Reading Room", icon: "👨‍🏫", dimensions: "10m × 8m", purpose: "Quiet lounge area exclusively reserved for professors and researchers.", accessible: true },
        { name: "Store Room", icon: "📦", dimensions: "6m × 6m", purpose: "Archived records, stationary stocks, and spare computing equipment.", accessible: false },
        { name: "Gents Toilet", icon: "🚹", dimensions: "4m × 4m", purpose: "Male restroom facilities with water conservation systems.", accessible: true }
      ]
    }
  ]
};

// ── THREE.JS PROCEDURAL BUILDING MESHES ─────────────────────────────────────

// Component to render individual floor blocks with glass curtain walls, louvers, and steps
function FloorBlock({ level, hoveredFloor, setHoveredFloor, onFloorClick }) {
  const yOffset = level * 4; // Height offset for each floor
  const isHovered = hoveredFloor === level;

  // Materials config
  const wallMaterial = new THREE.MeshStandardMaterial({ color: '#ECEFF1', roughness: 0.65, metalness: 0.1 });
  const blueMaterial = new THREE.MeshStandardMaterial({ color: '#1565C0', roughness: 0.45, metalness: 0.25 });
  const glassMaterial = new THREE.MeshStandardMaterial({ color: '#1A237E', transparent: true, opacity: 0.65, roughness: 0.1, metalness: 0.9 });
  
  // Glowing selected/hovered material
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: '#FF6D00',
    emissive: '#FF6D00',
    emissiveIntensity: isHovered ? 0.35 : 0.05,
    roughness: 0.4,
    transparent: true,
    opacity: 0.8
  });

  return (
    <group 
      position={[0, yOffset, 0]}
      onPointerOver={(e) => { e.stopPropagation(); setHoveredFloor(level); }}
      onPointerOut={(e) => { e.stopPropagation(); setHoveredFloor(null); }}
      onClick={(e) => { e.stopPropagation(); onFloorClick(level); }}
    >
      {/* 1. MAIN RECTANGULAR CONCRETE BODY (50m wide x 40m deep x 4m high) */}
      <mesh castShadow receiveShadow material={isHovered ? glowMaterial : wallMaterial}>
        <boxGeometry args={[50, 4, 40]} />
      </mesh>

      {/* 2. CURVED ROTUNDA FACADE (Semicircle protruding 8m forward at front center) */}
      {/* Centered at z=20, cylinder radius 12, thetaStart=-PI/2, thetaLength=PI */}
      <mesh position={[0, 0, 20]} rotation={[0, 0, 0]} castShadow receiveShadow material={isHovered ? glowMaterial : blueMaterial}>
        <cylinderGeometry args={[12, 12, 4, 32, 1, false, -Math.PI / 2, Math.PI]} />
      </mesh>

      {/* 3. GLASS CURTAIN WALL PANELS ON ROTUNDA */}
      <mesh position={[0, 0, 20.25]} material={glassMaterial}>
        <cylinderGeometry args={[11.8, 11.8, 3.6, 16, 1, false, -Math.PI / 3, (Math.PI * 2) / 3]} />
      </mesh>

      {/* 4. DECORATIVE SIDE WINGS (Ground floor only) */}
      {level === 0 && (
        <>
          {/* Left Wing (10m wide x 6m deep x 4m high) */}
          <mesh position={[-30, 0, 10]} castShadow receiveShadow material={wallMaterial}>
            <boxGeometry args={[10, 4, 20]} />
          </mesh>
          <mesh position={[-35.05, 0, 10]} material={glassMaterial}>
            <boxGeometry args={[0.1, 2.5, 12]} />
          </mesh>

          {/* Right Wing (10m wide x 6m deep x 4m high) */}
          <mesh position={[30, 0, 10]} castShadow receiveShadow material={wallMaterial}>
            <boxGeometry args={[10, 4, 20]} />
          </mesh>
          <mesh position={[35.05, 0, 10]} material={glassMaterial}>
            <boxGeometry args={[0.1, 2.5, 12]} />
          </mesh>

          {/* Entrance Stairs leading to the double glass doors */}
          <group position={[0, -1.6, 32.2]}>
            <mesh position={[0, 0, 0]} castShadow material={wallMaterial}>
              <boxGeometry args={[10, 0.4, 3]} />
            </mesh>
            <mesh position={[0, -0.4, 0.5]} castShadow material={wallMaterial}>
              <boxGeometry args={[10, 0.4, 4]} />
            </mesh>
            <mesh position={[0, -0.8, 1]} castShadow material={wallMaterial}>
              <boxGeometry args={[10, 0.4, 5]} />
            </mesh>
          </group>
        </>
      )}

      {/* 5. TALL RECTANGULAR WINDOW PANEL LOUVER GRID (Right Side Decorative Panels) */}
      <group position={[25.1, 0, 0]}>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} position={[0, 0, -15 + i * 5]} castShadow material={wallMaterial}>
            <boxGeometry args={[0.5, 3.2, 0.8]} />
          </mesh>
        ))}
      </group>

      {/* 6. WINDOWS ON MAIN RECTANGULAR BLOCK (Front and Back side windows) */}
      {/* Front windows (Left side of rotunda) */}
      <mesh position={[-16, 0.4, 20.05]} material={glassMaterial}>
        <planeGeometry args={[14, 2.5]} />
      </mesh>
      {/* Front windows (Right side of rotunda) */}
      <mesh position={[16, 0.4, 20.05]} material={glassMaterial}>
        <planeGeometry args={[14, 2.5]} />
      </mesh>
      {/* Back windows */}
      <mesh position={[0, 0.4, -20.05]} rotation={[0, Math.PI, 0]} material={glassMaterial}>
        <planeGeometry args={[40, 2.5]} />
      </mesh>

      {/* 7. WIREFRAME EDGES HIGHLIGHTS (Futuristic cyan grid glow) */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(50, 4, 40)]} />
        <lineBasicMaterial color={isHovered ? '#FF6D00' : '#80DEEA'} linewidth={1.5} />
      </lineSegments>
    </group>
  );
}

// Domes and Skylights placed on the roof
function RoofDomes() {
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: '#00E5FF',
    transparent: true,
    opacity: 0.6,
    roughness: 0.1,
    metalness: 0.9,
    emissive: '#00E5FF',
    emissiveIntensity: 0.2
  });

  return (
    <group position={[0, 12, 8]}>
      {/* Dome 1 (Left Roof Skylight) */}
      <mesh position={[-7, 0, 0]} castShadow>
        <sphereGeometry args={[5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial {...glassMaterial} />
      </mesh>

      {/* Dome 2 (Right Roof Skylight) */}
      <mesh position={[7, 0, 0]} castShadow>
        <sphereGeometry args={[5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial {...glassMaterial} />
      </mesh>

      {/* Skylight Ring Bases */}
      <mesh position={[-7, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[5.2, 5.2, 0.3, 32]} />
        <meshStandardMaterial color="#374151" roughness={0.5} />
      </mesh>
      <mesh position={[7, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[5.2, 5.2, 0.3, 32]} />
        <meshStandardMaterial color="#374151" roughness={0.5} />
      </mesh>
    </group>
  );
}

// ── MAIN LIBRARY COMPONENT ──────────────────────────────────────────────────

export default function LibraryBuilding3D({ buildingData = defaultBuildingData, onRoomSelect, theme = 'dark' }) {
  const [hoveredFloor, setHoveredFloor] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleFloorClick = (level) => {
    setSelectedFloor(level);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedFloor(null);
  };

  const activeFloorData = useMemo(() => {
    if (selectedFloor === null) return null;
    return buildingData.floors.find(f => f.level === selectedFloor);
  }, [selectedFloor, buildingData]);

  return (
    <div className={cn(
      "w-full h-full min-h-[100vh] flex flex-col font-sans transition-colors duration-300",
      theme === 'dark' ? 'bg-[#0B0F19] text-white' : 'bg-[#F9FAFB] text-gray-900'
    )}>
      {/* HEADER SECTION */}
      <header className={cn(
        "px-6 py-4 flex justify-between items-center border-b backdrop-blur-md sticky top-0 z-40 shadow-sm",
        theme === 'dark' ? 'bg-[#0F172A]/85 border-[#232D42]' : 'bg-white/85 border-gray-200'
      )}>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-[#38bdf8] text-2xl">🏛️</span> {buildingData.name}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Interactive 3D Digital Twin Viewer · Smart Campus Coordinate Node</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/map"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-all"
          >
            ← Back to Map
          </a>
        </div>
      </header>

      {/* VIEWPORT CONTROLS HINT */}
      <div className="absolute top-24 left-6 z-10 pointer-events-none hidden md:block">
        <div className="bg-black/65 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl">
          <h3 className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider mb-2">🎮 Viewport Controls</h3>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>🖱️ <strong>Left Click + Drag:</strong> Rotate Building</li>
            <li>wheel <strong>Scroll:</strong> Zoom In / Out</li>
            <li>🖱️ <strong>Right Click + Drag:</strong> Pan Scene</li>
            <li>👆 <strong>Hover Floor:</strong> Focus floor block</li>
            <li>🖱️ <strong>Click Floor:</strong> Open floor records</li>
          </ul>
        </div>
      </div>

      {/* 3D CANVAS WRAPPER */}
      <div className="flex-1 relative flex items-center justify-center min-h-[550px]">
        <Canvas shadows className="w-full h-full cursor-grab active:cursor-grabbing">
          <PerspectiveCamera makeDefault position={[50, 40, 75]} fov={45} />
          
          {/* Lighting rig */}
          <ambientLight intensity={theme === 'dark' ? 0.55 : 0.8} />
          <directionalLight 
            position={[40, 60, 30]} 
            intensity={1.5} 
            castShadow 
            shadow-mapSize={[2048, 2048]} 
          />
          <directionalLight position={[-40, 30, -30]} intensity={0.4} />

          {/* Neon PointLight inside the center Glass Rotunda */}
          <pointLight position={[0, 6, 22]} intensity={2.5} distance={35} color="#00E5FF" />

          {/* Sparkles / Ambient particles */}
          <Sparkles count={50} scale={[60, 20, 60]} size={1.5} speed={0.4} color="#38bdf8" />

          {/* Procedural 3D Library Model */}
          <group position={[0, -4, 0]}>
            {/* Ground Floor */}
            <FloorBlock 
              level={0} 
              hoveredFloor={hoveredFloor} 
              setHoveredFloor={setHoveredFloor} 
              onFloorClick={handleFloorClick} 
            />

            {/* First Floor */}
            <FloorBlock 
              level={1} 
              hoveredFloor={hoveredFloor} 
              setHoveredFloor={setHoveredFloor} 
              onFloorClick={handleFloorClick} 
            />

            {/* Second Floor */}
            <FloorBlock 
              level={2} 
              hoveredFloor={hoveredFloor} 
              setHoveredFloor={setHoveredFloor} 
              onFloorClick={handleFloorClick} 
            />

            {/* Skylight Domes on Roof */}
            <RoofDomes />

            {/* Ground Grid Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.01, 0]} receiveShadow>
              <planeGeometry args={[140, 120]} />
              <meshStandardMaterial color={theme === 'dark' ? '#111827' : '#E5E7EB'} roughness={0.9} />
            </mesh>
            
            <gridHelper args={[140, 28, '#38bdf8', theme === 'dark' ? '#1F2937' : '#D1D5DB']} position={[0, -2, 0]} />
          </group>

          <OrbitControls 
            enablePan 
            enableZoom 
            enableRotate 
            minPolarAngle={Math.PI / 18} // 10 degrees
            maxPolarAngle={(Math.PI * 17) / 36} // 85 degrees
            minDistance={35}
            maxDistance={120}
          />
        </Canvas>

        {/* BOTTOM FLOOR SELECTOR TABS BAR */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 flex gap-3 p-1.5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md shadow-2xl">
          {buildingData.floors.map((fl) => (
            <button
              key={fl.level}
              onClick={() => handleFloorClick(fl.level)}
              onPointerOver={() => setHoveredFloor(fl.level)}
              onPointerOut={() => setHoveredFloor(null)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all",
                hoveredFloor === fl.level 
                  ? "bg-[#38bdf8] text-black shadow-lg shadow-[#38bdf8]/35 scale-105" 
                  : "text-white/80 hover:text-white hover:bg-white/10"
              )}
            >
              {fl.name}
            </button>
          ))}
        </div>
      </div>

      {/* FULL-SCREEN GLASSMORPHIC OVERLAY MODAL */}
      {modalOpen && activeFloorData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in transition-all duration-300">
          <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl bg-[#0F172A]/90 border border-cyan-500/30 p-6 md:p-8 text-white shadow-[0_0_50px_rgba(56,189,248,0.25)] animate-scale-up">
            
            {/* CLOSE BUTTON */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-all text-xl cursor-pointer"
            >
              ×
            </button>

            {/* MODAL HEADER */}
            <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
              <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/20 text-2xl border border-cyan-500/30">
                🏫
              </span>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  {activeFloorData.name}
                  <span className="text-xs px-3 py-1 font-semibold rounded-full bg-cyan-500/20 text-[#38bdf8] border border-cyan-500/30">
                    Badge: {activeFloorData.badge}
                  </span>
                </h2>
                <p className="text-sm text-gray-400">Total rooms listed: {activeFloorData.rooms.length}</p>
              </div>
            </div>

            {/* ROOM CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              {activeFloorData.rooms.map((room) => (
                <div
                  key={room.name}
                  onClick={() => {
                    if (onRoomSelect) onRoomSelect(room.name, selectedFloor);
                  }}
                  className={cn(
                    "group p-5 rounded-2xl bg-[#1E1E2E] border border-cyan-900/40 hover:border-cyan-500/50 hover:bg-[#28283E] transition-all cursor-pointer shadow-md hover:shadow-cyan-500/10 flex flex-col justify-between"
                  )}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{room.icon}</span>
                        <h4 className="font-bold text-lg group-hover:text-cyan-400 transition-colors">
                          {room.name}
                        </h4>
                      </div>
                      <span className="font-mono text-xs text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/40">
                        {room.dimensions}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                      {room.purpose}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                    <span className={cn(
                      "text-xs px-2.5 py-1 rounded-full font-medium tracking-wide border",
                      room.accessible
                        ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50"
                        : "bg-amber-950/40 text-amber-400 border-amber-900/50"
                    )}>
                      {room.accessible ? "♿ Accessible" : "⚠️ Restricted Access"}
                    </span>
                    <span className="text-xs text-[#38bdf8] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Select Room →
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* FOOTER BAR */}
            <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-gray-400">
              <span>🏛️ YSR Central Library Architectural Digital Twin Core</span>
              <span>Tap any card to select specific rooms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
