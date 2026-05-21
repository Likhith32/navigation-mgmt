import React, { useState } from 'react';
import LibraryBuilding3D from '../campus-map/LibraryBuilding3D';

export default function LibraryExplorer() {
  const [theme, setTheme] = useState('dark');

  const handleRoomSelect = (roomName, floorLevel) => {
    console.log(`Deep link select room: ${roomName} on Floor level ${floorLevel}`);
    alert(`📍 Deep Linking selected: "${roomName}" (Floor Level: ${floorLevel})\nNavigating from structural nodes to campus index database!`);
  };

  return (
    <div className="w-full h-full relative">
      {/* Floating Theme Switcher */}
      <div className="absolute top-[21px] right-36 z-50">
        <button
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-white cursor-pointer transition-all border border-gray-700"
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
