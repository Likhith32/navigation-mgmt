// useEyeControl.js — manual 360° eye orbit, no auto-rotate
import { useState, useRef, useCallback, useEffect } from 'react';

export function useEyeControl(mapRef) {
  const [eyeMode,  setEyeMode]  = useState(false);
  const [bearing,  setBearing]  = useState(-15);
  const [pitch,    setPitch]    = useState(52);

  const isDragging = useRef(false);
  const dragBtn    = useRef(null);  // 0 = left, 2 = right
  const lastPos    = useRef({ x: 0, y: 0 });

  const toggleEyeMode = useCallback(() => {
    setEyeMode(v => !v);
  }, []);

  // Mouse handlers — only active in eye mode
  const onMouseDown = useCallback((e) => {
    if (!eyeMode) return;
    isDragging.current = true;
    dragBtn.current = e.button;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, [eyeMode]);

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current || !eyeMode || !mapRef.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };

    if (dragBtn.current === 0) {
      // Left drag → orbit (bearing)
      const newBearing = mapRef.current.getBearing() + dx * 0.5;
      mapRef.current.setBearing(newBearing);
      setBearing(Math.round(((newBearing % 360) + 360) % 360));
    } else if (dragBtn.current === 2) {
      // Right drag → pitch (look up/down)
      const currentPitch = mapRef.current.getPitch();
      const newPitch = Math.max(0, Math.min(85, currentPitch - dy * 0.4));
      mapRef.current.setPitch(newPitch);
      setPitch(Math.round(newPitch));
    }
  }, [eyeMode, mapRef]);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Touch support (single finger = orbit, two fingers = pitch)
  const touchRef = useRef({ x:0, y:0, dist:0 });

  const onTouchStart = useCallback((e) => {
    if (!eyeMode) return;
    if (e.touches.length === 1) {
      touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [eyeMode]);

  const onTouchMove = useCallback((e) => {
    if (!eyeMode || !mapRef.current) return;
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchRef.current.x;
      touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const newBearing = mapRef.current.getBearing() + dx * 0.5;
      mapRef.current.setBearing(newBearing);
      setBearing(Math.round(((newBearing % 360) + 360) % 360));
      e.preventDefault();
    }
  }, [eyeMode, mapRef]);

  // Prevent context menu during eye mode
  const onContextMenu = useCallback((e) => {
    if (eyeMode) e.preventDefault();
  }, [eyeMode]);

  // Cursor style
  useEffect(() => {
    if (eyeMode) document.body.style.cursor = 'crosshair';
    else         document.body.style.cursor = '';
    return ()  => { document.body.style.cursor = ''; };
  }, [eyeMode]);

  // Sync bearing from map on external changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => setBearing(Math.round(((map.getBearing() % 360)+360)%360));
    map.on('bearing', update);
    map.on('pitch',   () => setPitch(Math.round(map.getPitch())));
    return () => { map.off('bearing', update); };
  }, [mapRef]);

  return {
    eyeMode,
    toggleEyeMode,
    bearing,
    pitch,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onContextMenu,
      onTouchStart,
      onTouchMove,
    },
  };
}
