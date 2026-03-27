// useFloorControl.js
import { useState, useCallback } from 'react';

export function useFloorControl(buildings) {
  const [activeBuilding, setActiveBuilding] = useState(null);
  const [activeFloor, setActiveFloor]       = useState(0);

  const selectBuilding = useCallback((buildingId) => {
    const b = buildings.find(f => f.properties.id === buildingId);
    setActiveBuilding(buildingId);
    setActiveFloor(0);
    return b;
  }, [buildings]);

  return { activeBuilding, activeFloor, setActiveFloor, selectBuilding };
}
