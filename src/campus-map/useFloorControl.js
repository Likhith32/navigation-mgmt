// src/campus-map/useFloorControl.js
// Manages active floor state for a selected building.
// Drop-in replacement / supplement for the existing floor logic in CampusMap.jsx.
import { useState, useCallback } from 'react';

export function useFloorControl(building) {
  const maxFloors = building?.floors ?? 1;
  const [activeFloor, setActiveFloor] = useState(0);

  const goUp = useCallback(() => {
    setActiveFloor(f => Math.min(f + 1, maxFloors - 1));
  }, [maxFloors]);

  const goDown = useCallback(() => {
    setActiveFloor(f => Math.max(f - 1, 0));
  }, []);

  const setFloor = useCallback((f) => {
    if (f >= 0 && f < maxFloors) setActiveFloor(f);
  }, [maxFloors]);

  const reset = useCallback(() => setActiveFloor(0), []);

  return { activeFloor, setFloor, goUp, goDown, reset, maxFloors };
}