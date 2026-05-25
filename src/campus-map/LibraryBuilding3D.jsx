import React, { useState, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

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

function FloorBlock({ level, hoveredFloor, setHoveredFloor, onFloorClick }) {
  const yOffset = level * 4;
  const isHovered = hoveredFloor === level;

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
        width: '320px',
        borderRight: `1px solid ${borderColor}`,
        backgroundColor: sidebarBg,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        zIndex: 10
      }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: `1px solid ${borderColor}` }}>
           <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <span style={{ color: accentColor, fontSize: '24px' }}>🏛️</span>
             {buildingData.name}
           </h1>
           <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>Interactive Digital Twin Viewer</p>
        </div>

        {/* Room Hierarchy List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
          {buildingData.floors.map(floor => (
            <div key={floor.level} style={{ marginBottom: '20px' }}>
              <div 
                style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: accentColor, 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px', 
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredFloor(floor.level)}
                onMouseLeave={() => setHoveredFloor(null)}
                onClick={() => handleFloorClick(floor.level)}
              >
                <span style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: accentColor }}>{floor.badge}</span>
                {floor.name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '10px', borderLeft: isDark ? '2px solid #1E293B' : '2px solid #E5E7EB' }}>
                {floor.rooms.map(room => {
                   const isSelected = selectedRoom?.name === room.name;
                   return (
                     <div 
                       key={room.name}
                       onClick={() => {
                         setSelectedRoom(room);
                         if(onRoomSelect) onRoomSelect(room.name, floor.level);
                       }}
                       style={{
                         padding: '10px',
                         borderRadius: '8px',
                         cursor: 'pointer',
                         backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                         border: isSelected ? `1px solid ${accentColor}` : '1px solid transparent',
                         transition: 'all 0.2s',
                       }}
                       onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.backgroundColor = isDark ? '#1E293B' : '#F3F4F6'; }}
                       onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                     >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: isSelected ? 'bold' : 'normal' }}>
                          <span style={{ fontSize: '16px' }}>{room.icon}</span>
                          <span>{room.name}</span>
                        </div>
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
            <li>👆 <strong>Hover Sidebar:</strong> Highlight Floor</li>
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
              <FloorBlock level={0} hoveredFloor={hoveredFloor} setHoveredFloor={setHoveredFloor} onFloorClick={handleFloorClick} />
              <FloorBlock level={1} hoveredFloor={hoveredFloor} setHoveredFloor={setHoveredFloor} onFloorClick={handleFloorClick} />
              <FloorBlock level={2} hoveredFloor={hoveredFloor} setHoveredFloor={setHoveredFloor} onFloorClick={handleFloorClick} />
              <RoofDomes />
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.01, 0]} receiveShadow>
                <planeGeometry args={[140, 120]} />
                <meshStandardMaterial color={isDark ? '#111827' : '#E5E7EB'} roughness={0.9} />
              </mesh>
              <gridHelper args={[140, 28, '#38bdf8', isDark ? '#1F2937' : '#D1D5DB']} position={[0, -2, 0]} />
            </group>

            <OrbitControls 
              enablePan enableZoom enableRotate 
              minPolarAngle={Math.PI / 18} maxPolarAngle={(Math.PI * 17) / 36}
              minDistance={35} maxDistance={120}
            />
          </Canvas>
        </div>

        {/* Room Details Overlay (Shows when a room is clicked) */}
        {selectedRoom && (
          <div style={{
            position: 'absolute',
            bottom: '30px',
            right: '30px',
            width: '350px',
            background: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            border: isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.3s ease-out'
          }}>
             <style dangerouslySetInnerHTML={{__html: `
              @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
             `}} />
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>{selectedRoom.icon}</span>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{selectedRoom.name}</h2>
                </div>
                <button 
                  onClick={() => setSelectedRoom(null)}
                  style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '18px' }}
                >✕</button>
             </div>
             <p style={{ fontSize: '13px', color: isDark ? '#9CA3AF' : '#4B5563', lineHeight: '1.5', marginBottom: '16px' }}>{selectedRoom.purpose}</p>
             <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', background: 'rgba(56, 189, 248, 0.15)', color: accentColor, padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>{selectedRoom.dimensions}</span>
                <span style={{ fontSize: '12px', background: selectedRoom.accessible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: selectedRoom.accessible ? '#10B981' : '#F59E0B', padding: '4px 8px', borderRadius: '4px' }}>
                  {selectedRoom.accessible ? '♿ Accessible' : '⚠️ Restricted'}
                </span>
             </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
