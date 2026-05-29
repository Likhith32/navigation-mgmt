// src/campus-map/useCampusCamera.js
// Camera control hook for SophisticatedCampusMap (R3F version)
// Wraps refs to the R3F camera and OrbitControls, exposes a flyTo helper.

import { useRef, useCallback } from 'react';
import * as THREE from 'three';

/**
 * useCampusCamera
 *
 * Returns:
 *   cameraRef    – attach to Canvas onCreated: ({ camera }) => { cameraRef.current = camera }
 *   controlsRef  – attach to <OrbitControls ref={controlsRef} />
 *   flyTo(opts)  – smoothly move camera; opts: { position:[x,y,z], target:[x,y,z], duration?:number }
 *   getBearing   – returns current azimuthal angle in degrees (matches MapLibre convention)
 */
export function useCampusCamera() {
  const cameraRef   = useRef(null);
  const controlsRef = useRef(null);
  const animRef     = useRef(null); // requestAnimationFrame handle

  const flyTo = useCallback(({ position, target, duration = 900 }) => {
    const cam      = cameraRef.current;
    const controls = controlsRef.current;
    if (!cam) return;

    // Cancel any running animation
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const startPos    = cam.position.clone();
    const endPos      = new THREE.Vector3(...(position ?? [0, 28, 55]));
    const startTarget = controls ? controls.target.clone() : new THREE.Vector3();
    const endTarget   = new THREE.Vector3(...(target ?? [0, 0, 0]));
    const startTime   = performance.now();

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function tick(now) {
      const raw  = Math.min((now - startTime) / duration, 1);
      const ease = easeInOutCubic(raw);

      cam.position.lerpVectors(startPos, endPos, ease);

      if (controls) {
        controls.target.lerpVectors(startTarget, endTarget, ease);
        controls.update();
      }

      if (raw < 1) {
        animRef.current = requestAnimationFrame(tick);
      }
    }

    animRef.current = requestAnimationFrame(tick);
  }, []);

  const getBearing = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return 0;
    // Azimuthal angle from OrbitControls (radians → degrees)
    return THREE.MathUtils.radToDeg(controls.getAzimuthalAngle());
  }, []);

  return { cameraRef, controlsRef, flyTo, getBearing };
}