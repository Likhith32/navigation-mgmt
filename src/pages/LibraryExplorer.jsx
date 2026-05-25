import React, { useState } from 'react';
import LibraryBuilding3D from '../campus-map/LibraryBuilding3D';

export default function LibraryExplorer() {
  const [theme, setTheme] = useState('dark');

  const handleRoomSelect = (roomName, floorLevel) => {
    console.log(`Deep link select room: ${roomName} on Floor level ${floorLevel}`);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '21px', right: '36px', zIndex: 50 }}>
        <button
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: '#1f2937',
            color: '#fff',
            cursor: 'pointer',
            border: '1px solid #374151',
            transition: 'all 0.2s'
          }}
          title="Toggle UI Theme"
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      <LibraryBuilding3D 
        theme={theme}
        onRoomSelect={handleRoomSelect}
      />
    </div>
  );
}
