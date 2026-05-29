// src/campus-map/useEyeControl.js
// Enhanced version for React Three Fiber with OrbitControls
import { useState, useCallback, useRef, useEffect } from 'react';

export function useEyeControl(controlsRef) {
  const [eyeMode, setEyeMode] = useState(false);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const toggleEyeMode = useCallback(() => {
    setEyeMode(v => !v);
  }, []);

  // Mouse handlers for custom orbit control when eyeMode is active
  const onMouseDown = useCallback((e) => {
    if (!eyeMode) return;
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, [eyeMode]);

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current || !eyeMode || !controlsRef?.current) return;
    
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };

    // Get current camera position and target from OrbitControls
    const controls = controlsRef.current;
    const camera = controls.object;
    const target = controls.target;
    
    // Calculate new position based on mouse movement
    const angle = (dx * 0.5) * Math.PI / 180;
    const currentRadius = Math.sqrt(
      Math.pow(camera.position.x - target.x, 2) + 
      Math.pow(camera.position.z - target.z, 2)
    );
    
    const newX = target.x + (camera.position.x - target.x) * Math.cos(angle) - (camera.position.z - target.z) * Math.sin(angle);
    const newZ = target.z + (camera.position.x - target.x) * Math.sin(angle) + (camera.position.z - target.z) * Math.cos(angle);
    
    camera.position.x = newX;
    camera.position.z = newZ;
    
    // Handle vertical rotation (pitch)
    const newPitch = Math.max(0, Math.min(Math.PI / 2.2, camera.position.y - dy * 0.02));
    camera.position.y = newPitch;
    
    controls.target.set(target.x, target.y, target.z);
    controls.update();
  }, [eyeMode, controlsRef]);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const onContextMenu = useCallback((e) => {
    if (eyeMode) e.preventDefault();
  }, [eyeMode]);

  // Cursor style
  useEffect(() => {
    if (eyeMode) {
      document.body.style.cursor = 'grab';
    } else {
      document.body.style.cursor = '';
    }
    return () => { document.body.style.cursor = ''; };
  }, [eyeMode]);

  return {
    eyeMode,
    toggleEyeMode,
    bearing: 0,
    pitch: 45,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onContextMenu,
    },
  };
}