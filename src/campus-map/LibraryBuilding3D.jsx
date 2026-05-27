import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sparkles, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Default Floors and Rooms dataset according to specifications (with pos & size)
const defaultBuildingData = {
  name: "YSR Central Library",
  floors: [
    {
      level: 0,
      name: "Ground Floor",
      badge: "G",
      rooms: [
        { name: "Reception", icon: "🏢", dimensions: "8m × 6m", purpose: "Front-desk assistance, general registration, and catalog inquiry hub.", accessible: true, pos: [0, 0, 10], size: [8, 4.2, 6] },
        { name: "Reference Room", icon: "📖", dimensions: "10m × 8m", purpose: "Quick lookup tables, encyclopedia database, and physical journals.", accessible: true, pos: [-15, 0, 0], size: [10, 4.2, 8] },
        { name: "Bag Keeping", icon: "🎒", dimensions: "4m × 4m", purpose: "Safe baggage deposit locker grids for student personal items.", accessible: true, pos: [15, 0, -10], size: [4, 4.2, 4] },
        { name: "Pharmacy", icon: "💊", dimensions: "4m × 4m", purpose: "First-aid supplies, pharmacy store, and basic medical help.", accessible: true, pos: [15, 0, 5], size: [4, 4.2, 4] }
      ]
    },
    {
      level: 1,
      name: "First Floor",
      badge: "F1",
      rooms: [
        { name: "Archive", icon: "🗄️", dimensions: "12m × 10m", purpose: "Historical newspapers, ancient manuscripts, and doctoral thesis archiving.", accessible: true, pos: [-10, 0, -5], size: [12, 4.2, 10] },
        { name: "Journals Section", icon: "📰", dimensions: "12m × 10m", purpose: "Latest scientific papers, peer-reviewed journals, and periodicals.", accessible: true, pos: [10, 0, -5], size: [12, 4.2, 10] },
        { name: "Study Room", icon: "✍️", dimensions: "8m × 8m", purpose: "Quiet individual study cubicles and shared reading tables.", accessible: true, pos: [-15, 0, 10], size: [8, 4.2, 8] },
        { name: "Girls Washroom", icon: "🚺", dimensions: "4m × 4m", purpose: "Sanitized female restrooms with automatic hygiene systems.", accessible: true, pos: [18, 0, 15], size: [4, 4.2, 4] },
        { name: "Conference Room", icon: "👥", dimensions: "10m × 8m", purpose: "Seminar room with projector for faculty group discussions.", accessible: true, pos: [0, 0, 10], size: [10, 4.2, 8] }
      ]
    },
    {
      level: 2,
      name: "Second Floor",
      badge: "F2",
      rooms: [
        { name: "Digital Library", icon: "💻", dimensions: "20m × 15m", purpose: "High-speed computer grid for searching IEEE databases and web journals.", accessible: true, pos: [0, 0, 0], size: [20, 4.2, 15] },
        { name: "Faculty Reading Room", icon: "👨‍🏫", dimensions: "10m × 8m", purpose: "Quiet lounge area exclusively reserved for professors and researchers.", accessible: true, pos: [-15, 0, -10], size: [10, 4.2, 8] },
        { name: "Store Room", icon: "📦", dimensions: "6m × 6m", purpose: "Archived records, stationary stocks, and spare computing equipment.", accessible: false, pos: [15, 0, -12], size: [6, 4.2, 6] },
        { name: "Gents Toilet", icon: "🚹", dimensions: "4m × 4m", purpose: "Male restroom facilities with water conservation systems.", accessible: true, pos: [18, 0, 15], size: [4, 4.2, 4] }
      ]
    }
  ]
};

// ── THREE.JS PROCEDURAL BUILDING MESHES ─────────────────────────────────────

function FloorBlock({ level, floorData, hoveredFloor, setHoveredFloor, onFloorClick, selectedRoom, setSelectedRoom }) {
  const yOffset = level * 4;
  const isHovered = hoveredFloor === level;
  
  const [hoveredRoomName, setHoveredRoomName] = useState(null);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: '#ECEFF1', roughness: 0.65, metalness: 0.1 });
  const blueMaterial = new THREE.MeshStandardMaterial({ color: '#1565C0', roughness: 0.45, metalness: 0.25 });
  const glassMaterial = new THREE.MeshStandardMaterial({ color: '#1A237E', transparent: true, opacity: 0.65, roughness: 0.1, metalness: 0.9 });
  
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: '#FF6D00',
    emissive: '#FF6D00',
    emissiveIntensity: isHovered ? 0.35 : 0.05,
    roughness: 0.4,
    transparent: true,
    opacity: 0.8
  });

  const roomBaseMaterial = new THREE.MeshStandardMaterial({ color: '#0ea5e9', transparent: true, opacity: 0.1, roughness: 0.1 });
  const roomHoverMaterial = new THREE.MeshStandardMaterial({ color: '#38bdf8', transparent: true, opacity: 0.8, emissive: '#38bdf8', emissiveIntensity: 0.5 });
  const roomSelectedMaterial = new THREE.MeshStandardMaterial({ color: '#f59e0b', transparent: true, opacity: 0.95, emissive: '#f59e0b', emissiveIntensity: 0.7 });

  return (
    <group 
      position={[0, yOffset, 0]}
      onPointerOver={(e) => { e.stopPropagation(); setHoveredFloor(level); }}
      onPointerOut={(e) => { e.stopPropagation(); setHoveredFloor(null); }}
      onClick={(e) => { e.stopPropagation(); onFloorClick(level); }}
    >
      <mesh castShadow receiveShadow material={isHovered ? glowMaterial : wallMaterial}>
        <boxGeometry args={[50, 4, 40]} />
      </mesh>
      <mesh position={[0, 0, 20]} rotation={[0, 0, 0]} castShadow receiveShadow material={isHovered ? glowMaterial : blueMaterial}>
        <cylinderGeometry args={[12, 12, 4, 32, 1, false, -Math.PI / 2, Math.PI]} />
      </mesh>
      <mesh position={[0, 0, 20.25]} material={glassMaterial}>
        <cylinderGeometry args={[11.8, 11.8, 3.6, 16, 1, false, -Math.PI / 3, (Math.PI * 2) / 3]} />
      </mesh>
      {level === 0 && (
        <>
          <mesh position={[-30, 0, 10]} castShadow receiveShadow material={wallMaterial}>
            <boxGeometry args={[10, 4, 20]} />
          </mesh>
          <mesh position={[-35.05, 0, 10]} material={glassMaterial}>
            <boxGeometry args={[0.1, 2.5, 12]} />
          </mesh>
          <mesh position={[30, 0, 10]} castShadow receiveShadow material={wallMaterial}>
            <boxGeometry args={[10, 4, 20]} />
          </mesh>
          <mesh position={[35.05, 0, 10]} material={glassMaterial}>
            <boxGeometry args={[0.1, 2.5, 12]} />
          </mesh>
          <group position={[0, -1.6, 32.2]}>
            <mesh position={[0, 0, 0]} castShadow material={wallMaterial}><boxGeometry args={[10, 0.4, 3]} /></mesh>
            <mesh position={[0, -0.4, 0.5]} castShadow material={wallMaterial}><boxGeometry args={[10, 0.4, 4]} /></mesh>
            <mesh position={[0, -0.8, 1]} castShadow material={wallMaterial}><boxGeometry args={[10, 0.4, 5]} /></mesh>
          </group>
        </>
      )}
      <group position={[25.1, 0, 0]}>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} position={[0, 0, -15 + i * 5]} castShadow material={wallMaterial}>
            <boxGeometry args={[0.5, 3.2, 0.8]} />
          </mesh>
        ))}
      </group>
      <mesh position={[-16, 0.4, 20.05]} material={glassMaterial}><planeGeometry args={[14, 2.5]} /></mesh>
      <mesh position={[16, 0.4, 20.05]} material={glassMaterial}><planeGeometry args={[14, 2.5]} /></mesh>
      <mesh position={[0, 0.4, -20.05]} rotation={[0, Math.PI, 0]} material={glassMaterial}><planeGeometry args={[40, 2.5]} /></mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(50, 4, 40)]} />
        <lineBasicMaterial color={isHovered ? '#FF6D00' : '#80DEEA'} linewidth={1.5} />
      </lineSegments>

      {/* RENDER INTERNAL ROOMS */}
      {floorData.rooms.map(room => {
        const isRoomHovered = hoveredRoomName === room.name;
        const isRoomSelected = selectedRoom?.name === room.name;
        const mat = isRoomSelected ? roomSelectedMaterial : (isRoomHovered ? roomHoverMaterial : roomBaseMaterial);

        return (
          <mesh 
            key={room.name}
            position={room.pos}
            material={mat}
            onPointerOver={(e) => { 
              e.stopPropagation(); 
              setHoveredRoomName(room.name); 
              setHoveredFloor(level); 
              document.body.style.cursor = 'pointer'; 
            }}
            onPointerOut={(e) => { 
              e.stopPropagation(); 
              setHoveredRoomName(null); 
              document.body.style.cursor = ''; 
            }}
            onClick={(e) => { 
              e.stopPropagation(); 
              setSelectedRoom(room); 
              onFloorClick(level); 
            }}
          >
            <boxGeometry args={room.size} />
          </mesh>
        );
      })}

    </group>
  );
}

function RoofDomes() {
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: '#00E5FF', transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0.9,
    emissive: '#00E5FF', emissiveIntensity: 0.2
  });

  return (
    <group position={[0, 12, 8]}>
      <mesh position={[-7, 0, 0]} castShadow>
        <sphereGeometry args={[5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial {...glassMaterial} />
      </mesh>
      <mesh position={[7, 0, 0]} castShadow>
        <sphereGeometry args={[5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial {...glassMaterial} />
      </mesh>
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

function CameraController({ selectedRoom, selectedFloor }) {
  const { camera } = useThree();
  const controlsRef = useRef(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  const camPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;
    
    if (selectedRoom && selectedFloor !== null) {
      const yOffset = selectedFloor * 4;
      target.set(selectedRoom.pos[0], yOffset + selectedRoom.pos[1], selectedRoom.pos[2]);
      camPos.set(selectedRoom.pos[0] + 20, yOffset + 15, selectedRoom.pos[2] + 20);
    } else {
      target.set(0, 0, 0);
      camPos.set(50, 40, 75);
    }
    
    // Smooth damp
    controlsRef.current.target.lerp(target, Math.min(5 * delta, 1));
    camera.position.lerp(camPos, Math.min(4 * delta, 1));
    controlsRef.current.update();
  });

  return (
    <OrbitControls 
      ref={controlsRef}
      enableDamping={false}
      enablePan enableZoom enableRotate 
      minPolarAngle={Math.PI / 18} maxPolarAngle={(Math.PI * 17) / 36}
      minDistance={10} maxDistance={150}
    />
  );
}

// ── MAIN LIBRARY COMPONENT ──────────────────────────────────────────────────

export default function LibraryBuilding3D({ buildingData = defaultBuildingData, onRoomSelect, theme = 'dark' }) {
  const [hoveredFloor, setHoveredFloor] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0B0F19' : '#F9FAFB';
  const textColor = isDark ? '#FFF' : '#111';
  const sidebarBg = isDark ? '#0F172A' : '#FFF';
  const borderColor = isDark ? '#232D42' : '#E5E7EB';
  const accentColor = '#38bdf8';

  const handleFloorClick = (level) => {
    setSelectedFloor(level === selectedFloor ? null : level);
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', minHeight: '100vh', backgroundColor: bgColor, color: textColor, fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR FOR ROOM-WISE STRUCTURE */}
      <div style={{
        width: '340px',
        borderRight: `1px solid ${borderColor}`,
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        zIndex: 10,
        position: 'relative',
        transition: 'all 0.3s ease'
      }}>
        {/* Decorative Top Gradient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #38bdf8, #818cf8)' }} />
        
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: `1px solid ${borderColor}` }}>
           <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.02em' }}>
             <span style={{ fontSize: '28px', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🏛️</span>
             {buildingData.name}
           </h1>
           <p style={{ fontSize: '13px', color: isDark ? '#94A3B8' : '#64748B', margin: 0, fontWeight: '500' }}>Interactive Digital Twin Viewer</p>
        </div>

        {/* Room Hierarchy List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {buildingData.floors.map(floor => (
            <div key={floor.level} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div 
                style={{ 
                  fontSize: '14px', 
                  fontWeight: '700', 
                  color: isDark ? '#E2E8F0' : '#1E293B', 
                  letterSpacing: '0.5px', 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = accentColor; setHoveredFloor(floor.level); }}
                onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? '#E2E8F0' : '#1E293B'; setHoveredFloor(null); }}
                onClick={() => handleFloorClick(floor.level)}
              >
                <span style={{ background: 'linear-gradient(135deg, #38bdf8, #818cf8)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', color: '#fff', fontWeight: 'bold', boxShadow: '0 2px 10px rgba(56, 189, 248, 0.3)' }}>{floor.badge}</span>
                {floor.name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '16px', borderLeft: isDark ? '2px solid rgba(255,255,255,0.05)' : '2px solid rgba(0,0,0,0.05)' }}>
                {floor.rooms.map(room => {
                   const isSelected = selectedRoom?.name === room.name;
                   return (
                     <div 
                       key={room.name}
                       onClick={() => {
                         setSelectedRoom(room);
                         setSelectedFloor(floor.level);
                         if(onRoomSelect) onRoomSelect(room.name, floor.level);
                       }}
                       style={{
                         padding: '12px 14px',
                         borderRadius: '10px',
                         cursor: 'pointer',
                         backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                         border: isSelected ? `1px solid rgba(56, 189, 248, 0.5)` : '1px solid transparent',
                         boxShadow: isSelected ? '0 4px 12px rgba(56, 189, 248, 0.1)' : 'none',
                         transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                         display: 'flex',
                         alignItems: 'center',
                         gap: '12px'
                       }}
                       onMouseEnter={(e) => { 
                         if(!isSelected) {
                           e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; 
                           e.currentTarget.style.transform = 'translateX(4px)';
                         }
                       }}
                       onMouseLeave={(e) => { 
                         if(!isSelected) {
                           e.currentTarget.style.backgroundColor = 'transparent'; 
                           e.currentTarget.style.transform = 'translateX(0)';
                         }
                       }}
                     >
                        <span style={{ fontSize: '18px', filter: isSelected ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))' : 'none' }}>{room.icon}</span>
                        <span style={{ fontWeight: isSelected ? '600' : '500', color: isSelected ? accentColor : (isDark ? '#CBD5E1' : '#334155'), fontSize: '14px' }}>{room.name}</span>
                     </div>
                   );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3D CANVAS & DETAILS */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Viewport Info Overlay */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          color: '#E5E7EB'
        }}>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: accentColor, textTransform: 'uppercase', marginBottom: '8px', margin: 0 }}>🎮 Viewport Controls</h3>
          <ul style={{ fontSize: '12px', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>🖱️ <strong>Left Click + Drag:</strong> Rotate</li>
            <li>↕️ <strong>Scroll:</strong> Zoom</li>
            <li>🖱️ <strong>Right Click + Drag:</strong> Pan</li>
            <li>👆 <strong>Hover Block:</strong> Select Room</li>
          </ul>
        </div>

        {/* 3D Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Canvas shadows style={{ width: '100%', height: '100%', cursor: 'grab' }}>
            <PerspectiveCamera makeDefault position={[50, 40, 75]} fov={45} />
            <ambientLight intensity={isDark ? 0.55 : 0.8} />
            <directionalLight position={[40, 60, 30]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
            <directionalLight position={[-40, 30, -30]} intensity={0.4} />
            <pointLight position={[0, 6, 22]} intensity={2.5} distance={35} color="#00E5FF" />
            <Sparkles count={50} scale={[60, 20, 60]} size={1.5} speed={0.4} color="#38bdf8" />

            <group position={[0, -4, 0]}>
              <FloorBlock level={0} floorData={buildingData.floors[0]} hoveredFloor={hoveredFloor} setHoveredFloor={setHoveredFloor} onFloorClick={handleFloorClick} selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom} />
              <FloorBlock level={1} floorData={buildingData.floors[1]} hoveredFloor={hoveredFloor} setHoveredFloor={setHoveredFloor} onFloorClick={handleFloorClick} selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom} />
              <FloorBlock level={2} floorData={buildingData.floors[2]} hoveredFloor={hoveredFloor} setHoveredFloor={setHoveredFloor} onFloorClick={handleFloorClick} selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom} />
              <RoofDomes />
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.01, 0]} receiveShadow>
                <planeGeometry args={[140, 120]} />
                <meshStandardMaterial color={isDark ? '#111827' : '#E5E7EB'} roughness={0.9} />
              </mesh>
              <gridHelper args={[140, 28, '#38bdf8', isDark ? '#1F2937' : '#D1D5DB']} position={[0, -2, 0]} />
            </group>

            <CameraController selectedRoom={selectedRoom} selectedFloor={selectedFloor} />
          </Canvas>
        </div>

        {/* Room Details Overlay (Shows when a room is clicked) */}
        {selectedRoom && (
          <div style={{
            position: 'absolute',
            bottom: '30px',
            right: '30px',
            width: '380px',
            background: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(24px)',
            border: isDark ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
            animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            transformOrigin: 'bottom right'
          }}>
             <style dangerouslySetInnerHTML={{__html: `
              @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
             `}} />
             
             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', borderRadius: '20px 20px 0 0' }} />
             
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ 
                    width: '48px', height: '48px', 
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(129, 140, 248, 0.2))',
                    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}>
                    <span style={{ fontSize: '28px', filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.5))' }}>{selectedRoom.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: accentColor, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{buildingData.floors[selectedFloor]?.name}</div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: isDark ? '#F1F5F9' : '#0F172A', letterSpacing: '-0.02em' }}>{selectedRoom.name}</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRoom(null)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: isDark ? '#9CA3AF' : '#64748B', cursor: 'pointer', fontSize: '18px', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#EF4444'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = isDark ? '#9CA3AF' : '#64748B'; }}
                >✕</button>
             </div>
             <p style={{ fontSize: '14px', color: isDark ? '#CBD5E1' : '#475569', lineHeight: '1.6', marginBottom: '20px', fontWeight: '400' }}>{selectedRoom.purpose}</p>
             <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: 'rgba(56, 189, 248, 0.1)', color: accentColor, padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)', fontWeight: '600' }}>
                  📐 {selectedRoom.dimensions}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: selectedRoom.accessible ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: selectedRoom.accessible ? '#10B981' : '#F59E0B', padding: '6px 12px', borderRadius: '8px', border: selectedRoom.accessible ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)', fontWeight: '600' }}>
                  {selectedRoom.accessible ? '♿ Accessible' : '⚠️ Restricted'}
                </span>
             </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
