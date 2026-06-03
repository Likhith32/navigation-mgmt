// src/CampusMap3DRoute.jsx
import React from 'react';
import CampusMap3D from './components/CampusMap3D';

export function CampusMap3DRoute() {

  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      
      
      {/* The 3D Map Component */}
      <CampusMap3D />
    </div>
  );
}