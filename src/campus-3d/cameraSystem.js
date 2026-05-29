// cameraSystem.js — Full 360° orbit, pan, zoom, cinematic flythrough
// Exported as a class to keep CampusMap3D.jsx clean

import * as THREE from 'three';
import { lngLatToWorld } from './geoUtils';

// ── CINEMATIC KEYFRAMES (world-space positions) ──────────────────────────────
// Points chosen to showcase the real campus from multiple dramatic angles
const CIN_KF = [
  { pos: new THREE.Vector3(-80, 55, 100), tgt: new THREE.Vector3(0,  8, 0),   t: 0.00 },
  { pos: new THREE.Vector3( 60, 35,  90), tgt: new THREE.Vector3(10, 5, -10), t: 0.15 },
  { pos: new THREE.Vector3( 90, 20,  20), tgt: new THREE.Vector3( 5, 4, 0),   t: 0.30 },
  { pos: new THREE.Vector3( 70, 12, -60), tgt: new THREE.Vector3(-5, 3,-15),  t: 0.45 },
  { pos: new THREE.Vector3(-20, 10, -80), tgt: new THREE.Vector3( 0, 5, -5),  t: 0.55 },
  { pos: new THREE.Vector3(-90, 18, -40), tgt: new THREE.Vector3(-5, 4, 10),  t: 0.68 },
  { pos: new THREE.Vector3(-90, 40,  40), tgt: new THREE.Vector3( 0, 6, 5),   t: 0.82 },
  { pos: new THREE.Vector3(-30, 80,  80), tgt: new THREE.Vector3( 0, 0, 0),   t: 0.92 },
  { pos: new THREE.Vector3(-80, 55, 100), tgt: new THREE.Vector3(0,  8, 0),   t: 1.00 },
];

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export class CameraSystem {
  constructor(camera) {
    this.camera = camera;

    // Spherical state for orbit
    this.spherical = { theta: Math.PI * 0.25, phi: Math.PI / 3.2, radius: 95 };
    this.target    = new THREE.Vector3(0, 4, 0);

    // Cinematic
    this.cinematic = false;
    this.cinT      = 0;
    this.cinSpeed  = 0.045; // full loop ÷ seconds

    // Smooth damping
    this._targetLerp  = new THREE.Vector3(0, 4, 0);
    this._radiusLerp  = 95;
    this._thetaLerp   = Math.PI * 0.25;
    this._phiLerp     = Math.PI / 3.2;

    // Drag state
    this._drag        = { active: false, button: -1, lastX: 0, lastY: 0 };
  }

  // ── Mouse event handlers ───────────────────────────────────────────────────
  onMouseDown(e) {
    this._drag = { active: true, button: e.button, lastX: e.clientX, lastY: e.clientY };
  }

  onMouseMove(e) {
    if (!this._drag.active || this.cinematic) return;
    const dx = e.clientX - this._drag.lastX;
    const dy = e.clientY - this._drag.lastY;
    this._drag.lastX = e.clientX;
    this._drag.lastY = e.clientY;

    if (this._drag.button === 0) {
      // ── LEFT DRAG: orbit (full 360° horizontal, limited vertical) ──
      this.spherical.theta -= dx * 0.006;
      this.spherical.phi    = Math.max(0.05, Math.min(Math.PI * 0.48,
        this.spherical.phi + dy * 0.005));
    } else if (this._drag.button === 2) {
      // ── RIGHT DRAG: pan ──
      const right = new THREE.Vector3();
      const up    = new THREE.Vector3(0, 1, 0);
      this.camera.getWorldDirection(right);
      right.cross(up).normalize();
      const panSpeed = this.spherical.radius * 0.0012;
      this.target.addScaledVector(right, -dx * panSpeed);
      this.target.addScaledVector(up,     dy * panSpeed);
    }
  }

  onMouseUp() {
    this._drag.active = false;
  }

  onWheel(e) {
    if (this.cinematic) return;
    this.spherical.radius = Math.max(12, Math.min(250,
      this.spherical.radius + e.deltaY * 0.10));
  }

  // Touch support for mobile
  onTouchStart(e) {
    if (e.touches.length === 1) {
      this._drag = { active: true, button: 0, lastX: e.touches[0].clientX, lastY: e.touches[0].clientY };
    }
  }
  onTouchMove(e) {
    if (e.touches.length === 1) {
      this.onMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    }
  }
  onTouchEnd() { this._drag.active = false; }

  // ── Fly to a target position smoothly ─────────────────────────────────────
  flyTo({ position, target, radius, duration = 1.2 }) {
    if (target) this.target.copy(target);
    if (radius) this.spherical.radius = radius;
    if (position) {
      // Decompose position relative to target into spherical
      const diff = new THREE.Vector3().subVectors(position, this.target);
      this.spherical.radius = diff.length();
      this.spherical.phi    = Math.acos(Math.max(-1, Math.min(1, diff.y / this.spherical.radius)));
      this.spherical.theta  = Math.atan2(diff.x, diff.z);
    }
  }

  // ── Fly to a building centroid ─────────────────────────────────────────────
  flyToBuilding(buildingGroup) {
    const { centroid, totalH, w, d } = buildingGroup.userData;
    const dist = Math.max(w, d) * 2.2 + 15;
    this.cinematic = false;
    this.target.set(centroid.x, totalH * 0.4, centroid.z);
    this.spherical.radius = dist;
    this.spherical.phi    = 1.05;
  }

  // ── Toggle cinematic ────────────────────────────────────────────────────────
  toggleCinematic() {
    this.cinematic = !this.cinematic;
    this.cinT = 0;
    if (!this.cinematic) {
      // Reset to overview
      this.spherical = { theta: Math.PI * 0.25, phi: Math.PI / 3.2, radius: 95 };
      this.target.set(0, 4, 0);
    }
    return this.cinematic;
  }

  // ── Per-frame update ────────────────────────────────────────────────────────
  update(delta) {
    const cam = this.camera;

    if (this.cinematic) {
      this.cinT += delta * this.cinSpeed;
      if (this.cinT >= 1) this.cinT = 0;

      // Find surrounding keyframes
      let segA = CIN_KF[0], segB = CIN_KF[1];
      for (let i = 0; i < CIN_KF.length - 1; i++) {
        if (this.cinT >= CIN_KF[i].t && this.cinT <= CIN_KF[i + 1].t) {
          segA = CIN_KF[i]; segB = CIN_KF[i + 1]; break;
        }
      }
      const localT  = (this.cinT - segA.t) / Math.max(0.001, segB.t - segA.t);
      const smooth  = easeInOut(localT);
      cam.position.lerpVectors(segA.pos, segB.pos, smooth);
      const tgt = new THREE.Vector3().lerpVectors(segA.tgt, segB.tgt, smooth);
      cam.lookAt(tgt);
    } else {
      // Smooth damp spherical → camera position
      const sp = this.spherical;
      const x  = this.target.x + sp.radius * Math.sin(sp.phi) * Math.sin(sp.theta);
      const y  = this.target.y + sp.radius * Math.cos(sp.phi);
      const z  = this.target.z + sp.radius * Math.sin(sp.phi) * Math.cos(sp.theta);
      cam.position.lerp(new THREE.Vector3(x, y, z), 0.12);
      cam.lookAt(this.target);
    }
  }

  // ── Reset ───────────────────────────────────────────────────────────────────
  reset() {
    this.cinematic = false;
    this.cinT = 0;
    this.spherical = { theta: Math.PI * 0.25, phi: Math.PI / 3.2, radius: 95 };
    this.target.set(0, 4, 0);
  }
}