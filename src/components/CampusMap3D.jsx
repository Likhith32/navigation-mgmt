// CampusMap3D_Complete.jsx
// JNTU Vizianagaram — Complete 3D Interactive Campus Map
// Enhanced with vibrant street lights, rich sky textures, dense tree placement,
// full perimeter fences, Infinitown-style visual appeal, Road Hover Functionality,
// AND Vehicle System with JNTUGV Branding - IMPROVED STABLE VEHICLE SYSTEM
// ADDED: Birds in sky (reduced count), slower vehicle movement
// UPDATED: More realistic clouds during daytime
// ADDED: CampusChatbot integration

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import CampusChatbot from "../campus-map/CampusChatbot"; // Import the chatbot component

// ============================================================================
//  GEO UTILITIES
// ============================================================================
const ORIGIN = { lat: 18.150300, lng: 83.375500 };
const LAT_TO_M = 111139;
const LNG_TO_M = 111139 * Math.cos(ORIGIN.lat * Math.PI / 180);
const SCALE = 0.6;

function lngLatToWorld(lng, lat) {
  return {
    x: (lng - ORIGIN.lng) * LNG_TO_M * SCALE,
    z: -(lat - ORIGIN.lat) * LAT_TO_M * SCALE,
  };
}

function ringToWorld(ring) {
  return ring.map(([lng, lat]) => lngLatToWorld(lng, lat));
}

function ptsCentroid(pts) {
  let sx = 0, sz = 0;
  pts.forEach(p => { sx += p.x; sz += p.z; });
  return { x: sx / pts.length, z: sz / pts.length };
}

function ptsBBox(pts) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  pts.forEach(({ x, z }) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  });
  return { w: Math.max(maxX - minX, 3), d: Math.max(maxZ - minZ, 3) };
}

// ============================================================================
//  BIRD SYSTEM - Reduced count for cleaner sky
// ============================================================================

function createBird(x, y, z, color = 0x2c2c2c) {
  const group = new THREE.Group();
  
  // Body
  const bodyGeo = new THREE.BoxGeometry(0.15, 0.1, 0.2);
  const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);
  
  // Left wing
  const leftWingGeo = new THREE.BoxGeometry(0.35, 0.05, 0.12);
  const wingMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4 });
  const leftWing = new THREE.Mesh(leftWingGeo, wingMat);
  leftWing.position.set(-0.22, 0.03, 0);
  leftWing.castShadow = true;
  group.add(leftWing);
  
  // Right wing
  const rightWing = new THREE.Mesh(leftWingGeo, wingMat);
  rightWing.position.set(0.22, 0.03, 0);
  rightWing.castShadow = true;
  group.add(rightWing);
  
  // Head
  const headGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const headMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 0.08, 0.12);
  head.castShadow = true;
  group.add(head);
  
  // Tail
  const tailGeo = new THREE.ConeGeometry(0.08, 0.15, 4);
  const tailMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4 });
  const tail = new THREE.Mesh(tailGeo, tailMat);
  tail.position.set(0, 0.02, -0.15);
  tail.rotation.x = 0.3;
  tail.castShadow = true;
  group.add(tail);
  
  group.position.set(x, y, z);
  
  // Store wing references for animation
  group.userData = {
    leftWing,
    rightWing,
    wingAngle: 0,
    wingSpeed: 0.15 + Math.random() * 0.1,
    speed: 0.8 + Math.random() * 0.5,
    radius: 60 + Math.random() * 40,
    angle: Math.random() * Math.PI * 2,
    height: y,
    heightSpeed: 0.3 + Math.random() * 0.2,
    heightPhase: Math.random() * Math.PI * 2
  };
  
  return group;
}

class BirdManager {
  constructor(scene, count = 12) { // Reduced from 25 to 12
    this.scene = scene;
    this.birds = [];
    this.birdGroups = [];
    this.count = count;
  }
  
  createBirdFlocks() {
    const colors = [0x2c2c2c, 0x3a3a3a, 0x444444, 0x333333];
    
    // Create fewer, more dispersed flocks
    const flockPositions = [
      { center: { x: -80, y: 45, z: -60 }, radius: 40, count: 5, heightVar: 10 },
      { center: { x: 50, y: 55, z: 70 }, radius: 50, count: 4, heightVar: 12 },
      { center: { x: 30, y: 40, z: -100 }, radius: 45, count: 3, heightVar: 8 },
    ];
    
    flockPositions.forEach(flock => {
      for (let i = 0; i < flock.count; i++) {
        const angle = (i / flock.count) * Math.PI * 2;
        const radiusOffset = (Math.random() - 0.5) * flock.radius * 0.6;
        const x = flock.center.x + Math.cos(angle) * (flock.radius + radiusOffset);
        const z = flock.center.z + Math.sin(angle) * (flock.radius + radiusOffset);
        const y = flock.center.y + (Math.random() - 0.5) * flock.heightVar;
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const bird = createBird(x, y, z, color);
        
        // Store orbit parameters
        bird.userData.flockCenter = flock.center;
        bird.userData.flockRadius = flock.radius + radiusOffset * 0.5;
        bird.userData.orbitAngle = angle;
        bird.userData.orbitSpeed = 0.08 + Math.random() * 0.06;
        
        this.scene.add(bird);
        this.birds.push(bird);
      }
    });
    
    // Add a few solo birds flying across
    for (let i = 0; i < 3; i++) {
      const x = (Math.random() - 0.5) * 400;
      const z = (Math.random() - 0.5) * 400;
      const y = 35 + Math.random() * 40;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const bird = createBird(x, y, z, color);
      
      bird.userData.solo = true;
      bird.userData.direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 2
      ).normalize();
      bird.userData.speed = 1.2 + Math.random() * 0.8;
      bird.userData.bounds = { minX: -200, maxX: 200, minZ: -200, maxZ: 200 };
      
      this.scene.add(bird);
      this.birds.push(bird);
    }
  }
  
  updateBirds(deltaTime) {
    const dt = Math.min(deltaTime, 0.033);
    
    this.birds.forEach(bird => {
      // Animate wings
      if (bird.userData.leftWing && bird.userData.rightWing) {
        bird.userData.wingAngle += bird.userData.wingSpeed * dt * 8;
        const wingRotation = Math.sin(bird.userData.wingAngle) * 0.8;
        bird.userData.leftWing.rotation.z = wingRotation;
        bird.userData.rightWing.rotation.z = -wingRotation;
      }
      
      // Update position based on bird type
      if (bird.userData.flockCenter) {
        // Orbital birds
        bird.userData.orbitAngle += bird.userData.orbitSpeed * dt;
        const x = bird.userData.flockCenter.x + Math.cos(bird.userData.orbitAngle) * bird.userData.flockRadius;
        const z = bird.userData.flockCenter.z + Math.sin(bird.userData.orbitAngle) * bird.userData.flockRadius;
        
        // Gentle height oscillation
        bird.userData.heightPhase += bird.userData.heightSpeed * dt;
        const y = bird.userData.flockCenter.y + Math.sin(bird.userData.heightPhase) * 6;
        
        bird.position.set(x, y, z);
        
        // Face direction of movement
        bird.lookAt(x + Math.cos(bird.userData.orbitAngle + 0.5), y, z + Math.sin(bird.userData.orbitAngle + 0.5));
      } else if (bird.userData.solo) {
        // Free-flying birds
        const newX = bird.position.x + bird.userData.direction.x * bird.userData.speed * dt;
        const newZ = bird.position.z + bird.userData.direction.z * bird.userData.speed * dt;
        const newY = bird.position.y + bird.userData.direction.y * bird.userData.speed * dt;
        
        // Bounce off boundaries
        if (newX < bird.userData.bounds.minX || newX > bird.userData.bounds.maxX) {
          bird.userData.direction.x *= -1;
        }
        if (newZ < bird.userData.bounds.minZ || newZ > bird.userData.bounds.maxZ) {
          bird.userData.direction.z *= -1;
        }
        if (newY < 20 || newY > 80) {
          bird.userData.direction.y *= -1;
        }
        
        bird.position.x = Math.max(bird.userData.bounds.minX, Math.min(bird.userData.bounds.maxX, newX));
        bird.position.z = Math.max(bird.userData.bounds.minZ, Math.min(bird.userData.bounds.maxZ, newZ));
        bird.position.y = Math.max(20, Math.min(80, newY));
        
        // Face direction
        bird.lookAt(
          bird.position.x + bird.userData.direction.x,
          bird.position.y + bird.userData.direction.y,
          bird.position.z + bird.userData.direction.z
        );
      }
      
      // Subtle body bob
      bird.position.y += Math.sin(Date.now() * 0.003) * 0.01;
    });
  }
  
  stop() {
    this.birds.forEach(bird => {
      this.scene.remove(bird);
    });
    this.birds = [];
  }
}

// ============================================================================
//  VEHICLE SYSTEM - SLOW MOVEMENT LIKE INFITOWN
// ============================================================================

// Car Model (Procedurally generated)
function createCar(color = 0x3366cc, position = { x: 0, z: 0 }, rotation = 0) {
  const group = new THREE.Group();
  
  // Body (main)
  const bodyGeo = new THREE.BoxGeometry(1.2, 0.4, 2.4);
  const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.7 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.25;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  
  // Roof (slightly lighter)
  const roofGeo = new THREE.BoxGeometry(0.9, 0.25, 1.8);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xccccdd, roughness: 0.4, metalness: 0.5 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 0.55;
  roof.castShadow = true;
  group.add(roof);
  
  // Windshield (front)
  const windshieldGeo = new THREE.BoxGeometry(0.85, 0.2, 0.05);
  const windshieldMat = new THREE.MeshStandardMaterial({ color: 0x88aaff, roughness: 0.1, metalness: 0.9, emissive: 0x112233 });
  const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
  windshield.position.set(0, 0.55, 1.05);
  group.add(windshield);
  
  // Rear window
  const rearWindow = new THREE.Mesh(windshieldGeo, windshieldMat);
  rearWindow.position.set(0, 0.55, -1.05);
  group.add(rearWindow);
  
  // Side windows
  const sideWindowGeo = new THREE.BoxGeometry(0.05, 0.2, 0.9);
  const sideWindowMat = new THREE.MeshStandardMaterial({ color: 0x88aaff, roughness: 0.1, metalness: 0.9 });
  
  const leftWindow = new THREE.Mesh(sideWindowGeo, sideWindowMat);
  leftWindow.position.set(-0.55, 0.55, 0);
  group.add(leftWindow);
  
  const rightWindow = new THREE.Mesh(sideWindowGeo, sideWindowMat);
  rightWindow.position.set(0.55, 0.55, 0);
  group.add(rightWindow);
  
  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.3 });
  
  const wheelPositions = [
    [-0.7, 0.12, 0.85], [0.7, 0.12, 0.85],
    [-0.7, 0.12, -0.85], [0.7, 0.12, -0.85]
  ];
  
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos[0], pos[1], pos[2]);
    wheel.castShadow = true;
    group.add(wheel);
    
    // Wheel rim
    const rimGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.13, 8);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xccccaa, metalness: 0.8, roughness: 0.2 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(pos[0], pos[1], pos[2]);
    group.add(rim);
  });
  
  // Headlights
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffaa66, emissive: 0xff4422, emissiveIntensity: 0.3 });
  const leftHeadlight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), lightMat);
  leftHeadlight.position.set(-0.45, 0.2, 1.22);
  group.add(leftHeadlight);
  
  const rightHeadlight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), lightMat);
  rightHeadlight.position.set(0.45, 0.2, 1.22);
  group.add(rightHeadlight);
  
  // Taillights
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xff0000, emissiveIntensity: 0.2 });
  const leftTail = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), tailMat);
  leftTail.position.set(-0.45, 0.2, -1.22);
  group.add(leftTail);
  
  const rightTail = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), tailMat);
  rightTail.position.set(0.45, 0.2, -1.22);
  group.add(rightTail);
  
  group.position.set(position.x, 0, position.z);
  group.rotation.y = rotation;
  
  return group;
}

// JNTUGV Campus Bus (Branded with university colors)
function createJNTUGVBus(position = { x: 0, z: 0 }, rotation = 0) {
  const group = new THREE.Group();
  
  // Bus body (longer)
  const bodyGeo = new THREE.BoxGeometry(2.4, 0.9, 5.2);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a5f7a, roughness: 0.2, metalness: 0.4 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.6;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  
  // White stripe
  const stripeGeo = new THREE.BoxGeometry(2.45, 0.15, 5.25);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.set(0, 0.95, 0);
  group.add(stripe);
  
  // Gold accent stripe (JNTU colors)
  const goldStripeGeo = new THREE.BoxGeometry(2.45, 0.08, 5.25);
  const goldStripeMat = new THREE.MeshStandardMaterial({ color: 0xffaa33, metalness: 0.6, roughness: 0.3 });
  const goldStripe = new THREE.Mesh(goldStripeGeo, goldStripeMat);
  goldStripe.position.set(0, 1.02, 0);
  group.add(goldStripe);
  
  // Roof
  const roofGeo = new THREE.BoxGeometry(2.2, 0.3, 4.8);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xeeeeff, roughness: 0.3 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 1.15;
  group.add(roof);
  
  // Front windshield (larger)
  const frontWindGeo = new THREE.BoxGeometry(2.1, 0.5, 0.08);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88aaff, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.7 });
  const frontWind = new THREE.Mesh(frontWindGeo, glassMat);
  frontWind.position.set(0, 0.85, 2.65);
  group.add(frontWind);
  
  // Rear window
  const rearWind = new THREE.Mesh(frontWindGeo, glassMat);
  rearWind.position.set(0, 0.85, -2.65);
  group.add(rearWind);
  
  // Side windows (row of windows)
  const windowGeo = new THREE.BoxGeometry(0.08, 0.45, 1.1);
  const windowPositions = [
    [-1.25, 0.85, 1.8], [-1.25, 0.85, 0.6], [-1.25, 0.85, -0.6], [-1.25, 0.85, -1.8],
    [1.25, 0.85, 1.8], [1.25, 0.85, 0.6], [1.25, 0.85, -0.6], [1.25, 0.85, -1.8]
  ];
  
  windowPositions.forEach(pos => {
    const window = new THREE.Mesh(windowGeo, glassMat);
    window.position.set(pos[0], pos[1], pos[2]);
    group.add(window);
  });
  
  // Wheels (larger for bus)
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.18, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.3 });
  
  const busWheelPositions = [
    [-1.1, 0.25, 1.6], [1.1, 0.25, 1.6],
    [-1.1, 0.25, -1.6], [1.1, 0.25, -1.6],
    [-1.1, 0.25, 0], [1.1, 0.25, 0]
  ];
  
  busWheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos[0], pos[1], pos[2]);
    wheel.castShadow = true;
    group.add(wheel);
  });
  
  // Headlights
  const busLightMat = new THREE.MeshStandardMaterial({ color: 0xffaa66, emissive: 0xff6622, emissiveIntensity: 0.4 });
  const leftHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), busLightMat);
  leftHead.position.set(-0.9, 0.45, 2.68);
  group.add(leftHead);
  
  const rightHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), busLightMat);
  rightHead.position.set(0.9, 0.45, 2.68);
  group.add(rightHead);
  
  // JNTUGV Text on sides
  const createTextTexture = (text, bgColor = '#1a5f7a', textColor = '#ffffff') => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = textColor;
    ctx.font = 'Bold 48px "Arial"';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 15);
    
    ctx.font = '24px "Arial"';
    ctx.fillStyle = '#ffaa33';
    ctx.fillText('Campus Shuttle', canvas.width / 2, canvas.height - 25);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };
  
  // Side text panels
  const textPanelGeo = new THREE.BoxGeometry(1.8, 0.45, 0.05);
  const jntuTextMat = new THREE.MeshStandardMaterial({ map: createTextTexture('JNTUGV'), color: 0xffffff });
  
  const leftText = new THREE.Mesh(textPanelGeo, jntuTextMat);
  leftText.position.set(-1.28, 0.7, 0);
  group.add(leftText);
  
  const rightText = new THREE.Mesh(textPanelGeo, jntuTextMat);
  rightText.position.set(1.28, 0.7, 0);
  group.add(rightText);
  
  // Roof AC unit
  const acGeo = new THREE.BoxGeometry(1.2, 0.25, 1.0);
  const acMat = new THREE.MeshStandardMaterial({ color: 0xccaa88, roughness: 0.5 });
  const acUnit = new THREE.Mesh(acGeo, acMat);
  acUnit.position.set(0, 1.4, -1.2);
  group.add(acUnit);
  
  // Door (sliding door indicator)
  const doorGeo = new THREE.BoxGeometry(1.0, 0.8, 0.05);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x88aaff, metalness: 0.6 });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(1.28, 0.55, 1.0);
  group.add(door);
  
  group.position.set(position.x, 0, position.z);
  group.rotation.y = rotation;
  
  return group;
}

// Improved Vehicle Manager - SLOW movement like Infinitown
class VehicleManager {
  constructor(scene, pathSegments) {
    this.scene = scene;
    this.vehicles = [];
    this.pathSegments = pathSegments;
    this.vehicleTypes = ['car', 'car', 'car', 'bus'];
    this.colors = [0x3366cc, 0xcc3333, 0x33cc33, 0xffaa33, 0x9933cc, 0x33cccc];
    this.spawnInterval = null;
    this.maxVehicles = 5; // Reduced for slower, more realistic traffic
    this.active = true;
    
    // SLOW speeds like Infinitown
    this.minDistance = 4.0;
  }
  
  startSpawning() {
    if (this.spawnInterval) clearInterval(this.spawnInterval);
    
    // Spawn initial vehicles with longer delays
    let delay = 0;
    for (let i = 0; i < 2; i++) {
      setTimeout(() => {
        if (this.active) this.spawnVehicle();
      }, delay);
      delay += 3000; // Longer delay between initial spawns
    }
    
    // Continue spawning at longer intervals
    this.spawnInterval = setInterval(() => {
      if (this.active && this.vehicles.length < this.maxVehicles) {
        this.spawnVehicle();
      }
    }, 12000); // Spawn every 12 seconds max
  }
  
  spawnVehicle() {
    if (!this.pathSegments.length) return;
    
    // Find a segment that's not too crowded
    const safeSegments = this.pathSegments.filter(segment => {
      return !this.vehicles.some(v => 
        v.currentSegment === segment && v.progress < 0.3
      );
    });
    
    const availableSegments = safeSegments.length > 0 ? safeSegments : this.pathSegments;
    const segment = availableSegments[Math.floor(Math.random() * availableSegments.length)];
    const isBus = this.vehicleTypes[Math.floor(Math.random() * this.vehicleTypes.length)] === 'bus';
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    
    // Create vehicle at start of segment
    let vehicle;
    if (isBus) {
      vehicle = createJNTUGVBus({ x: segment.start.x, z: segment.start.z }, segment.angle);
    } else {
      vehicle = createCar(color, { x: segment.start.x, z: segment.start.z }, segment.angle);
    }
    
    const vehicleData = {
      mesh: vehicle,
      currentSegment: segment,
      progress: 0,
      // SLOW speeds like Infinitown (much slower than before)
      speed: (isBus ? 0.35 : 0.55),
      isBus: isBus,
      id: Math.random(),
      lastPosition: { x: segment.start.x, z: segment.start.z }
    };
    
    this.scene.add(vehicle);
    this.vehicles.push(vehicleData);
  }
  
  updateVehicles(deltaTime) {
    const dt = Math.min(deltaTime, 0.033);
    
    // Update each vehicle
    for (let i = 0; i < this.vehicles.length; i++) {
      const vehicle = this.vehicles[i];
      if (!vehicle) continue;
      
      // Calculate progress increment - SLOW movement
      const increment = vehicle.speed * dt;
      vehicle.progress += increment;
      
      // Check if reached end of current segment
      if (vehicle.progress >= 1.0) {
        vehicle.progress = 0;
        
        // Find next segment
        const nextSegment = this.findNextSegment(vehicle.currentSegment);
        
        if (nextSegment) {
          vehicle.currentSegment = nextSegment;
          
          // Update vehicle rotation to face new direction
          vehicle.mesh.rotation.y = nextSegment.angle;
        } else {
          // No next segment, reverse direction
          vehicle.progress = 0;
        }
      }
      
      // Calculate interpolated position
      const seg = vehicle.currentSegment;
      const t = vehicle.progress;
      const x = seg.start.x + (seg.end.x - seg.start.x) * t;
      const z = seg.start.z + (seg.end.z - seg.start.z) * t;
      
      vehicle.mesh.position.set(x, 0, z);
      vehicle.lastPosition = { x, z };
    }
    
    // Gentle collision avoidance
    this.preventCollisions();
  }
  
  findNextSegment(currentSegment) {
    const endPoint = currentSegment.end;
    const tolerance = 3.0;
    
    const candidates = this.pathSegments.filter(seg => {
      if (seg === currentSegment) return false;
      
      const distToStart = Math.hypot(seg.start.x - endPoint.x, seg.start.z - endPoint.z);
      const distToEnd = Math.hypot(seg.end.x - endPoint.x, seg.end.z - endPoint.z);
      
      return distToStart < tolerance || distToEnd < tolerance;
    });
    
    if (candidates.length > 0) {
      // Prefer continuing in similar direction
      const best = candidates.reduce((best, curr) => {
        const angleDiff = Math.abs(curr.angle - currentSegment.angle);
        const bestDiff = best ? Math.abs(best.angle - currentSegment.angle) : Infinity;
        return angleDiff < bestDiff ? curr : best;
      }, candidates[0]);
      return best;
    }
    
    // No connection, reverse direction on same segment
    const reversedSegment = {
      start: currentSegment.end,
      end: currentSegment.start,
      length: currentSegment.length,
      angle: currentSegment.angle + Math.PI,
      original: true
    };
    
    return reversedSegment;
  }
  
  preventCollisions() {
    // Gentle collision avoidance - just slow down slightly
    const sorted = [...this.vehicles].sort((a, b) => a.progress - b.progress);
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const v1 = sorted[i];
      const v2 = sorted[i + 1];
      
      if (v1.currentSegment === v2.currentSegment || 
          this.areSegmentsAdjacent(v1.currentSegment, v2.currentSegment)) {
        
        const distance = Math.hypot(
          v1.mesh.position.x - v2.mesh.position.x,
          v1.mesh.position.z - v2.mesh.position.z
        );
        
        if (distance < this.minDistance) {
          // Very gentle slowdown
          if (v1.progress < v2.progress) {
            v1.progress = Math.max(0, v1.progress - 0.01);
          } else {
            v2.progress = Math.max(0, v2.progress - 0.01);
          }
        }
      }
    }
  }
  
  areSegmentsAdjacent(seg1, seg2) {
    const dist1 = Math.hypot(seg1.end.x - seg2.start.x, seg1.end.z - seg2.start.z);
    const dist2 = Math.hypot(seg1.start.x - seg2.end.x, seg1.start.z - seg2.end.z);
    return dist1 < 4.0 || dist2 < 4.0;
  }
  
  stop() {
    this.active = false;
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
      this.spawnInterval = null;
    }
    
    this.vehicles.forEach(vehicle => {
      if (vehicle.mesh && this.scene) {
        this.scene.remove(vehicle.mesh);
      }
    });
    this.vehicles = [];
  }
  
  getVehicleCount() {
    return this.vehicles.length;
  }
}

// Extract path points and create continuous path segments from road network
function createPathSegments() {
  const segments = [];
  
  PATHS_GEOJSON.features.forEach(feature => {
    const points = feature.geometry.coordinates.map(([lng, lat]) => lngLatToWorld(lng, lat));
    
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const dx = end.x - start.x;
      const dz = end.z - start.z;
      const length = Math.hypot(dx, dz);
      const angle = Math.atan2(dz, dx);
      
      if (length > 2.0) {
        segments.push({
          start: { x: start.x, z: start.z },
          end: { x: end.x, z: end.z },
          length: length,
          angle: angle,
          roadType: feature.properties.type
        });
      }
    }
  });
  
  // Connect segments that are close to create continuous paths
  const connectedSegments = [];
  const used = new Set();
  
  for (let i = 0; i < segments.length && connectedSegments.length < 60; i++) {
    if (used.has(i)) continue;
    
    let current = segments[i];
    connectedSegments.push(current);
    used.add(i);
    
    let changed = true;
    let attempts = 0;
    
    while (changed && attempts < 10) {
      changed = false;
      attempts++;
      
      for (let j = 0; j < segments.length; j++) {
        if (used.has(j)) continue;
        
        const candidate = segments[j];
        const distToEnd = Math.hypot(candidate.start.x - current.end.x, candidate.start.z - current.end.z);
        const distToStart = Math.hypot(candidate.end.x - current.end.x, candidate.end.z - current.end.z);
        
        if (distToEnd < 3.0) {
          connectedSegments.push(candidate);
          used.add(j);
          current = candidate;
          changed = true;
          break;
        } else if (distToStart < 3.0) {
          const reversed = {
            start: candidate.end,
            end: candidate.start,
            length: candidate.length,
            angle: candidate.angle + Math.PI,
            roadType: candidate.roadType          };
          connectedSegments.push(reversed);
          used.add(j);
          current = reversed;
          changed = true;
          break;
        }
      }
    }
  }
  
  for (let i = 0; i < segments.length; i++) {
    if (!used.has(i) && connectedSegments.length < 80) {
      connectedSegments.push(segments[i]);
    }
  }
  
  return connectedSegments;
}

// ============================================================================
//  CAMPUS DATA (same as before)
// ============================================================================
const BUILDINGS_GEOJSON = {
  features: [
    { properties: { id: "HOSTEL_BOYS", name: "Boys Hostel I", short_name: "B.Hostel I", floors: 3, floor_height: 3.5, type: "hostel", room_prefix: "H1", floor_labels: ["Ground", "First", "Second"], description: "Houses 240 male students with common room, study hall, CCTV and 24/7 warden.", capacity: 240, established: 2005 }, geometry: { coordinates: [[[83.372375, 18.148956], [83.373239, 18.148864], [83.373211, 18.148486], [83.372328, 18.148589], [83.372375, 18.148956]]] } },
    { properties: { id: "HOSTEL_BOYS_II", name: "Boys Hostel II", short_name: "B.Hostel II", floors: 3, floor_height: 3.5, type: "hostel", room_prefix: "H2", floor_labels: ["Ground", "First", "Second"], description: "Accommodates 320 residents with laundry, warden office, indoor games and 24-hour security.", capacity: 320, established: 2010 }, geometry: { coordinates: [[[83.371000, 18.148933], [83.371136, 18.149300], [83.371972, 18.149000], [83.371831, 18.148619], [83.371000, 18.148933]]] } },
    { properties: { id: "HOSTEL_GIRLS_I", name: "Girls Hostel I", short_name: "GH-1", floors: 3, floor_height: 3.5, type: "girls_hostel", room_prefix: "GH1", floor_labels: ["Ground", "First", "Second"], description: "Fully secured residential block for female students with CCTV and warden accommodation.", capacity: 210, established: 2006, allowed_roles: ["admin", "faculty"] }, geometry: { coordinates: [[[83.378128, 18.149250], [83.377233, 18.149289], [83.377211, 18.148961], [83.378094, 18.148858], [83.378128, 18.149250]]] } },
    { properties: { id: "HOSTEL_GIRLS_II", name: "Girls Hostel II", short_name: "GH-2", floors: 3, floor_height: 3.5, type: "girls_hostel", room_prefix: "GH2", floor_labels: ["Ground", "First", "Second"], description: "Newer residential block with enhanced facilities, indoor recreation room and study lounge.", capacity: 280, established: 2012, allowed_roles: ["admin", "faculty"] }, geometry: { coordinates: [[[83.377219, 18.148769], [83.378094, 18.148717], [83.378075, 18.148333], [83.377178, 18.148364], [83.377219, 18.148769]]] } },
    { properties: { id: "BS_HSS", name: "BS & HSS Department", short_name: "BS/HSS", floors: 2, floor_height: 3.5, type: "academic", room_prefix: "BSH", floor_labels: ["Ground", "First"], has_corridor: true, description: "Basic Sciences and Humanities block: Chemistry, Physics, Mathematics, English with equipped labs.", capacity: 800, established: 1998 }, geometry: { coordinates: [[[83.374292, 18.151553], [83.374286, 18.151769], [83.374631, 18.151764], [83.374628, 18.151558], [83.374292, 18.151553]]] } },
    { properties: { id: "MECH_WORKSHOP_1", name: "Mech Workshop 1", short_name: "Mech W/S 1", floors: 1, floor_height: 6.0, type: "workshop", room_prefix: "MW1", floor_labels: ["Ground"], description: "Large mechanical workshop with lathe, milling and drilling machines.", capacity: 200, established: 2001 }, geometry: { coordinates: [[[83.374711, 18.151344], [83.374708, 18.151703], [83.374833, 18.151706], [83.374828, 18.151342], [83.374711, 18.151344]]] } },
    { properties: { id: "MECH_WORKSHOP_2", name: "Mech Workshop 2", short_name: "Mech W/S 2", floors: 1, floor_height: 6.0, type: "workshop", room_prefix: "MW2", floor_labels: ["Ground"], description: "Large mechanical workshop with welding and fabrication equipment.", capacity: 200, established: 2001 }, geometry: { coordinates: [[[83.374936, 18.151342], [83.374931, 18.151703], [83.375056, 18.151711], [83.375047, 18.151331], [83.374936, 18.151342]]] } },
    { properties: { id: "EXAM_CENTER", name: "Exam Evaluation Center", short_name: "Exam Center", floors: 1, floor_height: 3.5, type: "admin", room_prefix: "EEC", floor_labels: ["Ground"], description: "Examination evaluation and result processing center with AC halls and CCTV.", capacity: 80, established: 2003 }, geometry: { coordinates: [[[83.376219, 18.151461], [83.376275, 18.151564], [83.376564, 18.151381], [83.376508, 18.151289], [83.376219, 18.151461]]] } },
    { properties: { id: "ESTATE_OFFICE", name: "Estate Office", short_name: "Estate", floors: 1, floor_height: 3.5, type: "admin", room_prefix: "EST", floor_labels: ["Ground"], description: "Campus estate management and maintenance coordination office.", capacity: 30, established: 2000 }, geometry: { coordinates: [[[83.376231, 18.151356], [83.376167, 18.151250], [83.376225, 18.151219], [83.376272, 18.151167], [83.376386, 18.151253], [83.376231, 18.151356]]] } },
    { properties: { id: "CANTEEN", name: "Main Canteen", short_name: "Canteen", floors: 1, floor_height: 3.5, type: "canteen", room_prefix: "CAN", floor_labels: ["Ground"], description: "Serves breakfast, lunch and dinner. Vegetarian section and juice bar. Open 7am–10pm.", capacity: 300, established: 2005, open_time: "07:00", close_time: "22:00" }, geometry: { coordinates: [[[83.376072, 18.151317], [83.376053, 18.151308], [83.376022, 18.151322], [83.376028, 18.151339], [83.375958, 18.151378], [83.375997, 18.151442], [83.376108, 18.151378], [83.376072, 18.151317]]] } },
    { properties: { id: "METALLURGICAL_WORKSHOP", name: "Metallurgical Workshop", short_name: "Metall W/S", floors: 1, floor_height: 5.0, type: "workshop", room_prefix: "MET", floor_labels: ["Ground"], description: "Metallurgical workshop for materials science and metal processing with furnaces.", capacity: 150, established: 2002 }, geometry: { coordinates: [[[83.375717, 18.151339], [83.375839, 18.151339], [83.375833, 18.151667], [83.375722, 18.151667], [83.375717, 18.151339]]] } },
    { properties: { id: "YSR_LIBRARY", name: "YSR Central Library", short_name: "Library", floors: 3, floor_height: 4.0, type: "library", room_prefix: "LIB", floor_labels: ["Ground", "First", "Second"], description: "Knowledge hub with 50,000+ volumes, digital research terminals, IEEE workstation lab and reading zones.", capacity: 500, established: 2000, open_time: "08:00", close_time: "22:00" }, geometry: { coordinates: [[[83.375900, 18.149600], [83.376400, 18.149600], [83.376400, 18.149850], [83.375900, 18.149850], [83.375900, 18.149600]]] } },
  ]
};

const PATHS_GEOJSON = {
  features: [
    { properties: { name: "Main Campus Road", type: "primary", width: 8 }, geometry: { coordinates: [[83.3710794, 18.149356], [83.3719361, 18.1490904], [83.3731148, 18.1489345], [83.3736279, 18.1487581], [83.3744233, 18.1487082], [83.3748674, 18.1487389], [83.375045, 18.148785], [83.3752792, 18.1489001], [83.3756991, 18.1491303], [83.3761432, 18.1493374]] } },
    { properties: { name: "North Loop Road", type: "secondary", width: 6 }, geometry: { coordinates: [[83.3761432, 18.1493374], [83.3761432, 18.1489269], [83.3767165, 18.1489001], [83.3768175, 18.1488348], [83.3768821, 18.1482747], [83.3779641, 18.1481749], [83.3781297, 18.1483284]] } },
    { properties: { name: "East Academic Road", type: "primary", width: 8 }, geometry: { coordinates: [[83.3781297, 18.1483284], [83.3784567, 18.1494487], [83.3784365, 18.1495753]] } },
    { properties: { name: "Library Connector", type: "secondary", width: 6 }, geometry: { coordinates: [[83.3761432, 18.1493336], [83.3765994, 18.1494103], [83.3769911, 18.1494525], [83.3774998, 18.1494525], [83.3781256, 18.1494257], [83.3783840, 18.1495600], [83.3785904, 18.1498324]] } },
    { properties: { name: "South Campus Road", type: "primary", width: 8 }, geometry: { coordinates: [[83.3785904, 18.1498324], [83.3788935, 18.1502583], [83.3792489, 18.1512137], [83.3792516, 18.1513413]] } },
    { properties: { name: "Internal Road West", type: "secondary", width: 6 }, geometry: { coordinates: [[83.3792134, 18.1512142], [83.3779556, 18.1504442], [83.3777155, 18.1504001], [83.3759748, 18.1505505], [83.3753203, 18.1505298], [83.3750148, 18.1509602], [83.3747582, 18.1512529]] } },
    { properties: { name: "Hostel Access Road", type: "tertiary", width: 4 }, geometry: { coordinates: [[83.3747582, 18.1512529], [83.3738879, 18.1512736], [83.3732221, 18.1510169], [83.3720162, 18.1508069]] } },
    { properties: { name: "Academic Block Road", type: "secondary", width: 6 }, geometry: { coordinates: [[83.372379, 18.1507784], [83.3732194, 18.1510169], [83.3738906, 18.1512736], [83.3747582, 18.1512553]] } },
    { properties: { name: "East Ring Road", type: "primary", width: 8 }, geometry: { coordinates: [[83.3768043, 18.1505449], [83.3775218, 18.1504671], [83.3779829, 18.1505242], [83.3785204, 18.1508431], [83.3791998, 18.151289]] } },
    { properties: { name: "Gate Road", type: "primary", width: 10 }, geometry: { coordinates: [[83.3792759, 18.1516948], [83.3800311, 18.1519515], [83.3797059, 18.1522679], [83.3792347, 18.1529502], [83.3791045, 18.1530974], [83.3783686, 18.1533334], [83.3772302, 18.1535256], [83.3760179, 18.1535657], [83.3754443, 18.1535841], [83.3748937, 18.1534405]] } },
  ]
};

const ROOMS = [
  { id: "HB_G01", building_id: "HOSTEL_BOYS", floor: 0, name: "Room G01", type: "hostel_room", capacity: 3, area_sqm: 24, attributes: ["fan", "wifi"], description: "Triple occupancy room, ground floor." },
  { id: "HB_G02", building_id: "HOSTEL_BOYS", floor: 0, name: "Room G02", type: "hostel_room", capacity: 3, area_sqm: 24, attributes: ["fan", "wifi"], description: "Triple occupancy room, ground floor." },
  { id: "HB_CMN", building_id: "HOSTEL_BOYS", floor: 0, name: "Common Room", type: "common_room", capacity: 40, area_sqm: 80, attributes: ["tv", "wifi"], description: "Common room with TV and seating." },
  { id: "HB_BTH", building_id: "HOSTEL_BOYS", floor: 0, name: "Bathrooms", type: "bathroom", capacity: 10, area_sqm: 30, attributes: ["24/7"], description: "Shared bathroom block." },
  { id: "HB_101", building_id: "HOSTEL_BOYS", floor: 1, name: "Room 101", type: "hostel_room", capacity: 3, area_sqm: 24, attributes: ["fan", "wifi"], description: "Triple occupancy room, first floor." },
  { id: "HB_STD", building_id: "HOSTEL_BOYS", floor: 1, name: "Study Hall", type: "study_room", capacity: 20, area_sqm: 60, attributes: ["wifi", "quiet"], description: "Silent study hall." },
  { id: "HB_201", building_id: "HOSTEL_BOYS", floor: 2, name: "Room 201", type: "hostel_room", capacity: 3, area_sqm: 24, attributes: ["fan", "wifi"], description: "Triple occupancy room, second floor." },
  { id: "HB_WRD", building_id: "HOSTEL_BOYS", floor: 2, name: "Warden Office", type: "warden_office", capacity: 5, area_sqm: 20, attributes: ["ac"], allowed_roles: ["admin", "faculty"], description: "Warden's office — restricted access." },
  { id: "GH1_G01", building_id: "HOSTEL_GIRLS_I", floor: 0, name: "Room G01", type: "hostel_room", capacity: 3, area_sqm: 24, attributes: ["fan", "wifi", "cctv"], allowed_roles: ["admin", "faculty"], description: "Triple occupancy room." },
  { id: "GH1_CMN", building_id: "HOSTEL_GIRLS_I", floor: 0, name: "Common Room", type: "common_room", capacity: 40, area_sqm: 80, attributes: ["tv", "wifi"], allowed_roles: ["admin", "faculty"], description: "Ladies common room." },
  { id: "GH2_G01", building_id: "HOSTEL_GIRLS_II", floor: 0, name: "Room G01", type: "hostel_room", capacity: 3, area_sqm: 24, attributes: ["fan", "wifi", "cctv"], allowed_roles: ["admin", "faculty"], description: "Triple occupancy room." },
  { id: "BS_GR1", building_id: "BS_HSS", floor: 0, name: "Classroom G01", type: "classroom", capacity: 40, area_sqm: 48, attributes: ["projector", "fan", "wifi"], description: "Ground floor classroom." },
  { id: "BS_GR2", building_id: "BS_HSS", floor: 0, name: "Lab G02", type: "lab", capacity: 30, area_sqm: 48, attributes: ["lab", "fan"], description: "Science lab." },
  { id: "BS_COR", building_id: "BS_HSS", floor: 0, name: "Corridor", type: "corridor", capacity: 30, area_sqm: 60, attributes: [], description: "Central corridor." },
  { id: "BS_101", building_id: "BS_HSS", floor: 1, name: "Classroom 101", type: "classroom", capacity: 40, area_sqm: 48, attributes: ["projector", "fan", "wifi"], description: "First floor classroom." },
  { id: "BS_HOD", building_id: "BS_HSS", floor: 1, name: "HOD Office", type: "office", capacity: 5, area_sqm: 24, attributes: ["ac", "wifi"], allowed_roles: ["admin", "faculty"], description: "Head of Department office." },
  { id: "CAN_DIN", building_id: "CANTEEN", floor: 0, name: "Dining Hall", type: "canteen", capacity: 150, area_sqm: 120, attributes: ["fan", "water"], description: "Main canteen dining area.", open_time: "07:00", close_time: "22:00" },
  { id: "CAN_KIT", building_id: "CANTEEN", floor: 0, name: "Kitchen", type: "kitchen", capacity: 10, area_sqm: 40, attributes: ["ventilation", "water"], description: "Canteen kitchen." },
  { id: "LIB_REC", building_id: "YSR_LIBRARY", floor: 0, name: "Reception", type: "office", capacity: 10, area_sqm: 48, attributes: ["wifi"], description: "Front reception and query desk." },
  { id: "LIB_REF", building_id: "YSR_LIBRARY", floor: 0, name: "Reference Room", type: "study_room", capacity: 30, area_sqm: 80, attributes: ["fan", "wifi"], description: "Reference books and desks." },
  { id: "LIB_ARC", building_id: "YSR_LIBRARY", floor: 1, name: "Archive Room", type: "study_room", capacity: 20, area_sqm: 120, attributes: ["ac", "wifi"], description: "Archived thesis and research stacks." },
  { id: "LIB_JNL", building_id: "YSR_LIBRARY", floor: 1, name: "Journals Section", type: "study_room", capacity: 20, area_sqm: 120, attributes: ["fan", "wifi"], description: "Research reviews and periodicals." },
  { id: "LIB_DIG", building_id: "YSR_LIBRARY", floor: 2, name: "Digital Library", type: "lab", capacity: 60, area_sqm: 300, attributes: ["computers", "ac", "wifi"], description: "IEEE workstation lab grid." },
  { id: "EXM_H1", building_id: "EXAM_CENTER", floor: 0, name: "Evaluation Hall", type: "classroom", capacity: 80, area_sqm: 200, attributes: ["ac", "cctv", "wifi"], allowed_roles: ["admin", "faculty"], description: "Main exam evaluation hall." },
  { id: "MW1_BAY", building_id: "MECH_WORKSHOP_1", floor: 0, name: "Workshop Bay", type: "lab", capacity: 60, area_sqm: 450, attributes: ["heavy_machinery", "ventilation"], description: "Lathe, milling and drilling machines." },
  { id: "MW2_BAY", building_id: "MECH_WORKSHOP_2", floor: 0, name: "Workshop Bay", type: "lab", capacity: 60, area_sqm: 450, attributes: ["welding", "ventilation"], description: "Welding and fabrication equipment." },
  { id: "MET_BAY", building_id: "METALLURGICAL_WORKSHOP", floor: 0, name: "Metallurgical Bay", type: "lab", capacity: 40, area_sqm: 380, attributes: ["furnace", "ventilation"], description: "Metal processing with furnaces." },
  { id: "EST_OFF", building_id: "ESTATE_OFFICE", floor: 0, name: "Estate Office", type: "office", capacity: 8, area_sqm: 80, attributes: ["ac", "wifi"], description: "Campus estate management office." },
];

// ============================================================================
//  VISUAL CONFIGURATION (same as before)
// ============================================================================
const VIS = {
  hostel: { dayWall: 0xd4cfc8, nightWall: 0x1a2a4a, dayRoof: 0xb0aca5, nightRoof: 0x0d1828, accent: 0x7E3AF2, nightAccent: 0x4c1d95, winDay: 0x9bc4e8, winNight: 0xffd080, label: "Boys Hostel", icon: "🏠" },
  girls_hostel: { dayWall: 0xe8d0cc, nightWall: 0x2a1530, dayRoof: 0xc8b0ac, nightRoof: 0x180c1e, accent: 0xEC4899, nightAccent: 0x9d174d, winDay: 0xf9a8d4, winNight: 0xfda4af, label: "Girls Hostel", icon: "🏠" },
  academic: { dayWall: 0xc8c4bc, nightWall: 0x10182e, dayRoof: 0xa8a49c, nightRoof: 0x080e1a, accent: 0x3b82f6, nightAccent: 0x1d4ed8, winDay: 0x93c5fd, winNight: 0x7dd3fc, label: "Academic", icon: "🏫" },
  workshop: { dayWall: 0xa8a49c, nightWall: 0x0e1420, dayRoof: 0x6b7280, nightRoof: 0x060a10, accent: 0xf59e0b, nightAccent: 0x92400e, winDay: 0xfde68a, winNight: 0xfcd34d, label: "Workshop", icon: "⚙️" },
  admin: { dayWall: 0xd8d0c0, nightWall: 0x141c2c, dayRoof: 0xb8b0a0, nightRoof: 0x0c1018, accent: 0x6366f1, nightAccent: 0x4338ca, winDay: 0xa5b4fc, winNight: 0x818cf8, label: "Admin", icon: "🏛️" },
  canteen: { dayWall: 0xd4a870, nightWall: 0x1c1208, dayRoof: 0xb48850, nightRoof: 0x100a04, accent: 0x10b981, nightAccent: 0x065f46, winDay: 0x6ee7b7, winNight: 0x34d399, label: "Canteen", icon: "🍔" },
  library: { dayWall: 0xc8b898, nightWall: 0x121e32, dayRoof: 0xa89878, nightRoof: 0x0a1220, accent: 0x0ea5e9, nightAccent: 0x0369a1, winDay: 0x7dd3fc, winNight: 0x38bdf8, label: "Library", icon: "📚" },
};

const ROOM_META = {
  hostel_room: { icon: "🛏", label: "Hostel Room" },
  common_room: { icon: "📺", label: "Common Room" },
  bathroom: { icon: "🚿", label: "Bathroom" },
  stairwell: { icon: "🪜", label: "Stairwell" },
  corridor: { icon: "🚶", label: "Corridor" },
  warden_office: { icon: "🏢", label: "Warden Office" },
  study_room: { icon: "📚", label: "Study Room" },
  exit: { icon: "🚪", label: "Exit/Terrace" },
  classroom: { icon: "🏫", label: "Classroom" },
  lab: { icon: "🔬", label: "Lab" },
  office: { icon: "💼", label: "Office" },
  canteen: { icon: "🍽️", label: "Dining Hall" },
  kitchen: { icon: "👨‍🍳", label: "Kitchen" },
};

const CAMERA_PRESETS = [
  { id: "all", label: "Full Campus", icon: "⬡", theta: Math.PI * 0.22, phi: 1.05, radius: 110, tx: 0, ty: 5, tz: 0 },
  { id: "hostels", label: "Hostels", icon: "🏠", theta: Math.PI * 0.45, phi: 0.90, radius: 55, tx: -25, ty: 4, tz: 30 },
  { id: "academic", label: "Academic", icon: "🎓", theta: Math.PI * 0.15, phi: 0.85, radius: 48, tx: 3, ty: 4, tz: -28 },
  { id: "workshops", label: "Workshop", icon: "⚙️", theta: Math.PI * 0.10, phi: 0.90, radius: 40, tx: 6, ty: 4, tz: -32 },
  { id: "top", label: "Top View", icon: "⬆️", theta: Math.PI * 0.22, phi: 0.15, radius: 130, tx: 0, ty: 0, tz: 0 },
];

const FLOOR_COLS = ["#38bdf8", "#34d399", "#fb923c", "#a78bfa", "#f472b6", "#fbbf24"];

// ============================================================================
//  CANVAS LABEL HELPER (same as before)
// ============================================================================
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    return this;
  };
}

function makeCanvasLabel(name, shortName, typLabel, isNight) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, 512, 128);
  ctx.fillStyle = isNight ? "rgba(6,12,30,0.92)" : "rgba(255,255,255,0.94)";
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 14);
  ctx.fill();

  ctx.fillStyle = isNight ? "#38bdf8" : "#1d4ed8";
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 6, 14);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.font = "bold 46px system-ui";
  ctx.fillStyle = isNight ? "#e0f2fe" : "#1e293b";
  ctx.fillText(shortName || name, 256, 72);

  ctx.font = "22px system-ui";
  ctx.fillStyle = isNight ? "rgba(148,210,250,0.75)" : "rgba(71,85,105,0.75)";
  ctx.fillText(typLabel, 256, 102);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.userData.isLabel = true;
  return sprite;
}

// ============================================================================
//  BUILDING FACTORY (same as before)
// ============================================================================
function addWindowGrid(group, w, h, d, floors, vis, isNight) {
  const windowColor = isNight ? vis.winNight : vis.winDay;
  const material = new THREE.MeshBasicMaterial({ color: windowColor, transparent: true, opacity: isNight ? 0.95 : 0.7 });
  const floorHeight = h / floors;
  const windowsX = Math.max(1, Math.floor(w / 2.8));
  const windowsZ = Math.max(1, Math.floor(d / 2.8));
  const windowW = Math.min(0.7, (w / windowsX) * 0.5);
  const windowH = Math.min(0.9, floorHeight * 0.42);

  const addWindows = (count, totalWidth, offsetX, offsetZ, rotationY) => {
    for (let f = 0; f < floors; f++) {
      for (let i = 0; i < count; i++) {
        const windowMesh = new THREE.Mesh(new THREE.PlaneGeometry(windowW, windowH), material.clone());
        const xPos = -((count - 1) * (totalWidth / count)) / 2 + i * (totalWidth / count) + offsetX;
        const yPos = floorHeight * 0.38 + f * floorHeight;
        windowMesh.position.set(xPos, yPos, offsetZ);
        if (rotationY) windowMesh.rotation.y = rotationY;
        group.add(windowMesh);
      }
    }
  };

  addWindows(windowsX, w, 0, d / 2 + 0.02, 0);
  addWindows(windowsX, w, 0, -(d / 2 + 0.02), Math.PI);
  addWindows(windowsZ, d, -(w / 2 + 0.02), 0, -Math.PI / 2);
  addWindows(windowsZ, d, w / 2 + 0.02, 0, Math.PI / 2);
}

function createBuilding(feature, isNight) {
  const props = feature.properties;
  const type = props.type || "academic";
  const visual = VIS[type] || VIS.academic;
  const floors = props.floors || 1;
  const floorHeight = props.floor_height || 3.5;
  const totalHeight = floors * floorHeight;

  const worldPoints = ringToWorld(feature.geometry.coordinates[0]);
  const center = ptsCentroid(worldPoints);
  const box = ptsBBox(worldPoints);
  const width = box.w;
  const depth = box.d;

  const group = new THREE.Group();
  group.userData = {
    id: props.id,
    name: props.name,
    shortName: props.short_name,
    type,
    floors,
    floorHeight,
    totalHeight,
    width,
    depth,
    centroid: center,
    props: props
  };

  const accentColor = isNight ? visual.nightAccent : visual.accent;

  const bodyMaterial = new THREE.MeshLambertMaterial({ color: isNight ? visual.nightWall : visual.dayWall });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, totalHeight, depth), bodyMaterial);
  body.position.y = totalHeight / 2;
  body.castShadow = body.receiveShadow = true;
  body.userData = { isBuilding: true, buildingId: props.id };
  group.add(body);

  for (let f = 1; f < floors; f++) {
    const divider = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, 0.15, depth + 0.1), new THREE.MeshLambertMaterial({ color: isNight ? 0x1e3050 : accentColor }));
    divider.position.y = f * floorHeight;
    group.add(divider);
  }

  const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.3, depth + 0.4), new THREE.MeshLambertMaterial({ color: isNight ? visual.nightRoof : visual.dayRoof }));
  roof.position.y = totalHeight + 0.15;
  group.add(roof);

  const parapetPositions = [
    [width / 2 + 0.2, 0, 0, Math.PI / 2],
    [-width / 2 - 0.2, 0, 0, Math.PI / 2],
    [0, 0, depth / 2 + 0.2, 0],
    [0, 0, -depth / 2 - 0.2, 0]
  ];
  parapetPositions.forEach(([px, py, pz, ry]) => {
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(ry === 0 ? width : depth, 0.7, 0.25), new THREE.MeshLambertMaterial({ color: isNight ? 0x0d1828 : 0x9ca3af }));
    parapet.position.set(px, totalHeight + 0.65, pz);
    parapet.rotation.y = ry;
    group.add(parapet);
  });

  const accentMaterial = new THREE.MeshLambertMaterial({ color: accentColor });
  const cornerPositions = [[-width / 2, depth / 2], [width / 2, depth / 2], [-width / 2, -depth / 2], [width / 2, -depth / 2]];
  cornerPositions.forEach(([px, pz]) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.35, totalHeight + 0.3, 0.35), accentMaterial);
    pillar.position.set(px, totalHeight / 2, pz);
    group.add(pillar);
  });

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(Math.min(width * 0.4, 4), 0.18, 1.4), new THREE.MeshLambertMaterial({ color: accentColor }));
  canopy.position.set(0, 2.6, depth / 2 + 0.7);
  group.add(canopy);

  const door = new THREE.Mesh(new THREE.BoxGeometry(Math.min(width * 0.22, 2.2), 2.2, 0.12), new THREE.MeshLambertMaterial({ color: isNight ? 0x1e3a5f : 0x64748b }));
  door.position.set(0, 1.1, depth / 2 + 0.07);
  group.add(door);

  addWindowGrid(group, width, totalHeight, depth, floors, visual, isNight);

  const label = makeCanvasLabel(props.name, props.short_name, visual.label, isNight);
  label.scale.set(Math.max(width * 0.6, 9), 2.8, 1);
  label.position.y = totalHeight + 3.8;
  group.add(label);

  group.position.set(center.x, 0, center.z);
  return group;
}

function createFloorHighlight(group, floorIndex, color = 0x38bdf8) {
  const { width, depth, floorHeight } = group.userData;
  const highlight = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.06, floorHeight - 0.1, depth + 0.06),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, depthTest: false })
  );
  highlight.position.y = floorIndex * floorHeight + floorHeight / 2;
  highlight.userData.isFloorHighlight = true;
  return highlight;
}

// ============================================================================
//  ENVIRONMENT: GROUND (same as before)
// ============================================================================
function createGround(isNight) {
  const group = new THREE.Group();

  // Completely uniform ground
  const groundColor = isNight ? 0x0a150a : 0x5a8a4a;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(800, 800), 
    new THREE.MeshLambertMaterial({ color: groundColor })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  return group;
}
// ============================================================================
//  ENVIRONMENT: ROADS WITH KERBS, MARKINGS, AND HOVER SUPPORT
// ============================================================================
function createRoads(isNight) {
  const group = new THREE.Group();
  const roadPrimary = isNight ? 0x181828 : 0x3c3c4c;
  const roadSecondary = isNight ? 0x1a1a2a : 0x444455;
  const kerbColor = isNight ? 0x242432 : 0x6a6a78;
  const markingColor = isNight ? 0xfff8c0 : 0xffffff;
  const roadMeshes = [];

  PATHS_GEOJSON.features.forEach(feature => {
    const points = feature.geometry.coordinates.map(([lng, lat]) => lngLatToWorld(lng, lat));
    const roadWidth = (feature.properties.width || 6) * SCALE * 0.5;
    const roadColor = feature.properties.type === "primary" ? roadPrimary : roadSecondary;

    for (let i = 0; i < points.length - 1; i++) {
      const pointA = new THREE.Vector3(points[i].x, 0.02, points[i].z);
      const pointB = new THREE.Vector3(points[i + 1].x, 0.02, points[i + 1].z);
      const direction = new THREE.Vector3().subVectors(pointB, pointA);
      const length = direction.length();
      const angle = Math.atan2(direction.x, direction.z);
      const midpoint = new THREE.Vector3().addVectors(pointA, pointB).multiplyScalar(0.5);

      const roadSegment = new THREE.Mesh(new THREE.BoxGeometry(roadWidth * 2, 0.05, length), new THREE.MeshLambertMaterial({ color: roadColor }));
      roadSegment.position.copy(midpoint);
      roadSegment.rotation.y = angle;
      
      roadSegment.userData = {
        isRoad: true,
        name: feature.properties.name,
        type: feature.properties.type,
        originalColor: roadColor
      };
      
      group.add(roadSegment);
      roadMeshes.push(roadSegment);

      [-1, 1].forEach(side => {
        const kerb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, length), new THREE.MeshLambertMaterial({ color: kerbColor }));
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize().multiplyScalar((roadWidth + 0.11) * side);
        kerb.position.copy(midpoint).add(perpendicular).setY(0.06);
        kerb.rotation.y = angle;
        group.add(kerb);
      });

      if (feature.properties.type === "primary" && length > 4) {
        const dashCount = Math.floor(length / 3.5);
        for (let d = 0; d < dashCount; d++) {
          const dashPoint = new THREE.Vector3().lerpVectors(pointA, pointB, (d + 0.5) / dashCount);
          const dash = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 1.1), new THREE.MeshBasicMaterial({ color: markingColor }));
          dash.position.copy(dashPoint).setY(0.06);
          dash.rotation.y = angle;
          group.add(dash);
        }
      }

      if (feature.properties.type !== "tertiary" && length > 8) {
        [-0.04, 0.96].forEach(t => {
          const crossPoint = new THREE.Vector3().lerpVectors(pointA, pointB, t);
          for (let s = -1; s <= 1; s += 0.5) {
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(roadWidth * 1.8, 0.06, 0.22), new THREE.MeshBasicMaterial({ color: markingColor, transparent: true, opacity: 0.55 }));
            stripe.position.copy(crossPoint).setY(0.06);
            const offset = new THREE.Vector3(-direction.z, 0, direction.x).normalize().multiplyScalar(s * 0.4);
            stripe.position.add(offset);
            stripe.rotation.y = angle;
            group.add(stripe);
          }
        });
      }
    }
  });

  const junctionMaterial = new THREE.MeshLambertMaterial({ color: isNight ? 0x1e1e2e : 0x555568 });
  const junctionPositions = [[0, -5], [25, -18], [-15, -22]];
  junctionPositions.forEach(([jx, jz]) => {
    const junction = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.05, 20), junctionMaterial);
    junction.position.set(jx, 0.01, jz);
    group.add(junction);
  });

  return { group, meshes: roadMeshes };
}

// ============================================================================
//  ENVIRONMENT: TREES (same as before)
// ============================================================================
function createTree(x, z, height, isNight, variant = 0) {
  const group = new THREE.Group();
  const trunkColor = isNight ? 0x2a1a0a : 0x6b3a1e;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.20, height * 0.32, 8), new THREE.MeshLambertMaterial({ color: trunkColor }));
  trunk.position.y = height * 0.16;
  group.add(trunk);

  const palettes = [
    { leaf: isNight ? 0x0a200a : 0x2d7a2d, dark: isNight ? 0x061006 : 0x1b5c1b },
    { leaf: isNight ? 0x0c220a : 0x3a8230, dark: isNight ? 0x071206 : 0x1f6a1a },
    { leaf: isNight ? 0x0a1e0c : 0x2a7035, dark: isNight ? 0x060e08 : 0x185530 },
  ];
  const palette = palettes[variant % palettes.length];

  const layers = [
    [height * 0.26, 0.82, height * 0.52],
    [height * 0.20, 0.65, height * 0.70],
    [height * 0.15, 0.50, height * 0.84]
  ];
  layers.forEach(([coneHeight, coneRadius, coneY]) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(coneRadius, coneHeight, 9), new THREE.MeshLambertMaterial({ color: palette.leaf }));
    cone.position.y = coneY;
    group.add(cone);
  });

  const innerCone = new THREE.Mesh(new THREE.ConeGeometry(0.35, height * 0.28, 8), new THREE.MeshLambertMaterial({ color: palette.dark }));
  innerCone.position.y = height * 0.56;
  group.add(innerCone);

  group.position.set(x, 0, z);
  return group;
}

function createPineTree(x, z, h, isNight) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshLambertMaterial({ color: isNight ? 0x2a1a0a : 0x5c3317 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.20, h * 0.28, 7), trunkMat);
  trunk.position.y = h * 0.14;
  g.add(trunk);
  const leafColor = isNight ? 0x0a1e08 : 0x1e5c1a;
  const darkColor = isNight ? 0x060e04 : 0x134010;
  const leafMat = new THREE.MeshLambertMaterial({ color: leafColor });
  const darkMat = new THREE.MeshLambertMaterial({ color: darkColor });
  [[h * 0.44, 0.95, h * 0.42],[h * 0.36, 0.72, h * 0.60],[h * 0.28, 0.52, h * 0.75],[h * 0.20, 0.34, h * 0.87]].forEach(([ch, cr, cy]) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(cr, ch, 8), leafMat);
    cone.position.y = cy;
    g.add(cone);
  });
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.18, h * 0.18, 6), darkMat);
  tip.position.y = h * 0.94;
  g.add(tip);
  g.position.set(x, 0, z);
  return g;
}

function createRoundTree(x, z, h, isNight) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshLambertMaterial({ color: isNight ? 0x2a1a0a : 0x6b4226 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, h * 0.35, 8), trunkMat);
  trunk.position.y = h * 0.175;
  g.add(trunk);
  const leafMat = new THREE.MeshLambertMaterial({ color: isNight ? 0x0c2010 : 0x2e7d32 });
  const darkMat = new THREE.MeshLambertMaterial({ color: isNight ? 0x061008 : 0x1b5e20 });
  const crown = new THREE.Mesh(new THREE.SphereGeometry(h * 0.30, 10, 8), leafMat);
  crown.position.y = h * 0.68;
  g.add(crown);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(h * 0.20, 8, 6), darkMat);
  inner.position.y = h * 0.62;
  g.add(inner);
  const top = new THREE.Mesh(new THREE.SphereGeometry(h * 0.16, 8, 6), leafMat);
  top.position.y = h * 0.80;
  g.add(top);
  g.position.set(x, 0, z);
  return g;
}

function createPalmTree(x, z, h, isNight) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshLambertMaterial({ color: isNight ? 0x2e1f0a : 0x8d6e40 });
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.12 - i * 0.01, 0.16 - i * 0.01, h * 0.18, 7), trunkMat);
    seg.position.set(Math.sin(i * 0.15) * 0.3, h * 0.09 + i * h * 0.15, Math.cos(i * 0.08) * 0.1);
    g.add(seg);
  }
  const frondMat = new THREE.MeshLambertMaterial({ color: isNight ? 0x0d2208 : 0x33691e, side: THREE.DoubleSide });
  const frondCount = 8;
  for (let i = 0; i < frondCount; i++) {
    const angle = (i / frondCount) * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.PlaneGeometry(h * 0.55, h * 0.10), frondMat);
    frond.position.set(Math.cos(angle) * h * 0.18, h * 0.94, Math.sin(angle) * h * 0.18);
    frond.rotation.set(-0.45, angle, 0.3);
    g.add(frond);
  }
  const crownMat = new THREE.MeshLambertMaterial({ color: isNight ? 0x0a1a06 : 0x2e7d32 });
  const crown = new THREE.Mesh(new THREE.SphereGeometry(h * 0.12, 8, 6), crownMat);
  crown.position.y = h * 0.90;
  g.add(crown);
  g.position.set(x, 0, z);
  return g;
}

function createOakTree(x, z, h, isNight) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshLambertMaterial({ color: isNight ? 0x1e1208 : 0x4e342e });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.30, h * 0.42, 8), trunkMat);
  trunk.position.y = h * 0.21;
  g.add(trunk);
  const branchMat = new THREE.MeshLambertMaterial({ color: isNight ? 0x1a1006 : 0x5d4037 });
  [[-0.3, 0.6, 0.2], [0.3, 0.55, -0.2], [0, 0.7, 0.3]].forEach(([bx, by, bz]) => {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, h * 0.22, 6), branchMat);
    branch.position.set(bx * h * 0.3, h * by, bz * h * 0.2);
    branch.rotation.z = bx * 0.8;
    g.add(branch);
  });
  const leafMat = new THREE.MeshLambertMaterial({ color: isNight ? 0x0e2210 : 0x388e3c });
  const darkMat = new THREE.MeshLambertMaterial({ color: isNight ? 0x081408 : 0x1b5e20 });
  [
    [0, h * 0.75, 0, h * 0.36],
    [-h * 0.20, h * 0.68, h * 0.12, h * 0.28],
    [h * 0.20, h * 0.70, -h * 0.10, h * 0.26],
    [0, h * 0.90, 0, h * 0.22],
    [-h * 0.12, h * 0.58, -h * 0.14, h * 0.22],
  ].forEach(([cx, cy, cz, cr], i) => {
    const mat = i % 2 === 0 ? leafMat : darkMat;
    const blob = new THREE.Mesh(new THREE.SphereGeometry(cr, 9, 7), mat);
    blob.position.set(cx, cy, cz);
    g.add(blob);
  });
  g.position.set(x, 0, z);
  return g;
}

function createCherryTree(x, z, h, isNight) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshLambertMaterial({ color: isNight ? 0x1a1008 : 0x4a2c2a });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.20, h * 0.38, 7), trunkMat);
  trunk.position.y = h * 0.19;
  g.add(trunk);
  const branchMat = new THREE.MeshLambertMaterial({ color: isNight ? 0x180e06 : 0x5d4037 });
  [[-0.4, 0.5, 0], [0.4, 0.48, 0], [0, 0.6, -0.3]].forEach(([bx, by, bz]) => {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, h * 0.20, 6), branchMat);
    branch.position.set(bx * h * 0.25, h * by, bz * h * 0.2);
    branch.rotation.z = bx * 0.9;
    g.add(branch);
  });
  const blossomColor = isNight ? 0x2a1520 : 0xf8bbd0;
  const blossomDark  = isNight ? 0x1a0c14 : 0xf48fb1;
  const blossomMat  = new THREE.MeshLambertMaterial({ color: blossomColor });
  const blossomDarkMat = new THREE.MeshLambertMaterial({ color: blossomDark });
  [
    [0, h * 0.70, 0, h * 0.30],
    [-h * 0.18, h * 0.62, h * 0.10, h * 0.22],
    [h * 0.18, h * 0.64, -h * 0.10, h * 0.22],
    [0, h * 0.88, 0, h * 0.18],
    [-h * 0.10, h * 0.54, -h * 0.12, h * 0.18],
  ].forEach(([cx, cy, cz, cr], i) => {
    const mat = i % 2 === 0 ? blossomMat : blossomDarkMat;
    const blob = new THREE.Mesh(new THREE.SphereGeometry(cr, 9, 7), mat);
    blob.position.set(cx, cy, cz);
    g.add(blob);
  });
  g.position.set(x, 0, z);
  return g;
}

function createTrees(isNight) {
  const group = new THREE.Group();

  const treePositions = [
  // ── BOYS HOSTEL I — entrance cherries, corner oaks, side rounds
  [-163,115,4], [-181,115,4],
  [-155,95,3],  [-190,95,3],
  [-155,108,1], [-190,108,1],

  // ── BOYS HOSTEL II — entrance oaks, windbreak pines, centre round
  [-245,98,3],  [-263,98,3],
  [-244,79,0],  [-264,79,0],
  [-254,72,1],

  // ── GIRLS HOSTEL I — cherry blossom entrance pair, corner oaks
  [128,90,4],   [147,90,4],
  [127,72,3],   [148,72,3],

  // ── GIRLS HOSTEL II — cherry entrance trio, side rounds
  [125,126,4],  [136,128,4],  [148,126,4],
  [125,108,1],  [148,108,1],

  // ── YSR LIBRARY — formal palm entrance pair, garden grove
  [32,47,2],    [51,47,2],
  [28,28,4],    [41,25,3],    [55,28,4],
  [58,38,1],

  // ── BS & HSS DEPT — courtyard oaks, entrance pines
  [-78,-80,3],  [-54,-80,3],
  [-76,-100,0], [-56,-100,0],

  // ── WORKSHOP ZONE — pine windbreak row + separating oak
  [-58,-70,0],  [-38,-70,0],  [-18,-70,0],  [2,-70,0],
  [-22,-90,3],

  // ── EXAM / CANTEEN / ESTATE plaza — shade trees, cherry accents
  [24,-60,1],   [34,-58,4],   [46,-58,4],
  [65,-65,3],   [65,-80,1],

  // ── MAIN CAMPUS ROAD — palm avenue one side every ~35 units
  [-250,72,2],  [-215,75,2],  [-180,78,2],
  [-145,82,2],  [-110,86,2],  [-75,90,2],
  [-40,93,2],   [-5,90,2],    [30,82,2],

  // ── LIBRARY CONNECTOR — cherry promenade + round understorey
  [70,55,4],    [95,52,4],    [120,52,4],   [150,54,4],
  [70,45,1],    [95,44,1],    [120,44,1],

  // ── GATE ROAD — stately palm pair at entrance, landmark palms
  [250,-82,2],  [232,-82,2],
  [200,-145,2], [150,-175,2], [80,-205,2],

  // ── CENTRAL OPEN SPACE — landmark palms, scattered rounds, oak anchors
  [-60,20,2],   [-40,5,2],
  [-90,30,1],   [-120,50,1],  [-20,45,1],
  [0,0,3],      [-30,-10,3],
];

  const creators = [createPineTree, createRoundTree, createPalmTree, createOakTree, createCherryTree];

  treePositions.forEach(([x, z, type], index) => {
    const baseHeights = [5.5, 4.8, 7.0, 5.2, 4.5];
    const h = baseHeights[type] + ((index * 7 + 3) % 5) * 0.5;
    group.add(creators[type](x, z, h, isNight));
  });

  return group;
}

// ============================================================================
//  ENVIRONMENT: VIBRANT STREET LIGHTS (same as before)
// ============================================================================
function createStreetLights(isNight) {
  const group = new THREE.Group();
  const poleColor  = isNight ? 0x1c2230 : 0x78909c;
  const armColor   = isNight ? 0x1e2840 : 0x90a4ae;

  const lightPositions = [
    [-255,77,0],[-227,85,0],[-197,90,0],[-167,94,0],[-137,102,0],[-102,109,0],[-69,111,0],[-40,109,0],[15,82,0],[43,69,0],
    [266,-95,2],[241,-179,2],[183,-207,2],[110,-220,2],[33,-223,2],[-3,-224,2],
    [112,-8,1],[158,-10,1],[209,-42,1],[237,-62,1],
    [193,-40,0],[153,-14,0],[109,-15,0],[62,-19,0],
    [-84,-69,0],[-146,-52,0],[-206,-42,0],
    [95,61,0],[166,63,0],
  ];

  lightPositions.forEach(([x, z, style]) => {
    const poleH = style === 2 ? 10 : 8;
    const armLen = style === 2 ? 2.2 : 1.5;
    const lightColor = style === 2 ? 0xffa040 : 0xffcc44;
    const lightIntensity = style === 2 ? 2.2 : 1.5;
    const lightRange    = style === 2 ? 35   : 26;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.16, poleH, 10), new THREE.MeshLambertMaterial({ color: poleColor }));
    pole.position.set(x, poleH / 2, z);
    group.add(pole);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 0.35, 8), new THREE.MeshLambertMaterial({ color: poleColor }));
    base.position.set(x, 0.175, z);
    group.add(base);

    const armOffsets = style === 1 ? [1, -1] : [1];

    armOffsets.forEach(side => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, armLen, 7), new THREE.MeshLambertMaterial({ color: armColor }));
      arm.rotation.z = Math.PI / 2;
      arm.position.set(x + side * armLen * 0.5, poleH - 0.3, z);
      group.add(arm);

      const housing = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.38, 0.60), new THREE.MeshLambertMaterial({ color: isNight ? 0x1a2030 : 0xcfd8dc }));
      housing.position.set(x + side * armLen, poleH - 0.28, z);
      group.add(housing);

      if (isNight) {
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.26, 16), new THREE.MeshBasicMaterial({ color: style === 2 ? 0xffbb66 : 0xffee88 }));
        lens.rotation.x = Math.PI / 2;
        lens.position.set(x + side * armLen, poleH - 0.52, z);
        group.add(lens);

        const mainLight = new THREE.PointLight(lightColor, lightIntensity, lightRange);
        mainLight.position.set(x + side * armLen, poleH - 0.5, z);
        group.add(mainLight);

        const fillLight = new THREE.PointLight(0xff8800, 0.45, lightRange * 1.8);
        fillLight.position.set(x + side * armLen, poleH - 1.2, z);
        group.add(fillLight);

        const glowR = style === 2 ? 7 : 5;
        const glow = new THREE.Mesh(new THREE.CircleGeometry(glowR, 24), new THREE.MeshBasicMaterial({ color: lightColor, transparent: true, opacity: style === 2 ? 0.14 : 0.08 }));
        glow.rotation.x = -Math.PI / 2;
        glow.position.set(x + side * armLen, 0.04, z);
        group.add(glow);

        const haloCanvas = document.createElement("canvas");
        haloCanvas.width = 128; haloCanvas.height = 128;
        const hctx = haloCanvas.getContext("2d");
        const grad = hctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        if (style === 2) {
          grad.addColorStop(0, "rgba(255,160,50,1.0)");
          grad.addColorStop(0.12, "rgba(255,130,30,0.75)");
          grad.addColorStop(0.40, "rgba(255,100,10,0.20)");
          grad.addColorStop(1, "rgba(255,60,0,0)");
        } else {
          grad.addColorStop(0, "rgba(255,230,80,1.0)");
          grad.addColorStop(0.14, "rgba(255,200,40,0.65)");
          grad.addColorStop(0.45, "rgba(255,160,20,0.16)");
          grad.addColorStop(1, "rgba(255,110,0,0)");
        }
        hctx.fillStyle = grad;
        hctx.fillRect(0, 0, 128, 128);
        const haloSize = style === 2 ? 16 : 12;
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({
          map: new THREE.CanvasTexture(haloCanvas),
          transparent: true, depthTest: false,
          blending: THREE.AdditiveBlending
        }));
        halo.scale.set(haloSize, haloSize, 1);
        halo.position.set(x + side * armLen, poleH - 0.4, z);
        group.add(halo);

        if (style === 2) {
          const baseGlow = new THREE.PointLight(0xff6600, 0.6, 12);
          baseGlow.position.set(x, 0.5, z);
          group.add(baseGlow);
        }
      } else {
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.20, 16), new THREE.MeshBasicMaterial({ color: 0xb0bec5 }));
        lens.rotation.x = Math.PI / 2;
        lens.position.set(x + side * armLen, poleH - 0.52, z);
        group.add(lens);
      }
    });
  });

  return group;
}

// ============================================================================
//  ENVIRONMENT: RICH PROCEDURAL SKY - IMPROVED REALISM (fewer clouds)
// ============================================================================
function createRichSky(isNight) {
  const group = new THREE.Group();

  if (!isNight) {
    // DAY SKY - More realistic with better cloud distribution
    const horizonGlow = new THREE.Mesh(
      new THREE.SphereGeometry(338, 48, 24, 0, Math.PI * 2, 0, 0.42),
      new THREE.MeshBasicMaterial({ color: 0xffcc99, side: THREE.BackSide, transparent: true, opacity: 0.45 })
    );
    group.add(horizonGlow);

    const midSky = new THREE.Mesh(
      new THREE.SphereGeometry(340, 48, 24, 0, Math.PI * 2, 0.1, 0.35),
      new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide, transparent: true, opacity: 0.6 })
    );
    group.add(midSky);

    const mainSky = new THREE.Mesh(
      new THREE.SphereGeometry(342, 48, 24),
      new THREE.MeshBasicMaterial({ color: 0x6bb5e0, side: THREE.BackSide })
    );
    group.add(mainSky);

    const zenith = new THREE.Mesh(
      new THREE.SphereGeometry(344, 48, 20, 0, Math.PI * 2, 0.55, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x2d6fb0, side: THREE.BackSide, transparent: true, opacity: 0.7 })
    );
    group.add(zenith);

    // Sun
    const sunGlow = new THREE.Mesh(
      new THREE.CircleGeometry(12, 32),
      new THREE.MeshBasicMaterial({ color: 0xfff5e0, transparent: true, opacity: 0.95 })
    );
    sunGlow.position.set(140, 210, -200);
    sunGlow.lookAt(0, 0, 0);
    group.add(sunGlow);

    [16, 24, 36, 50].forEach((radius, i) => {
      const corona = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 48),
        new THREE.MeshBasicMaterial({ 
          color: 0xffdd88, 
          transparent: true, 
          opacity: 0.12 - i * 0.02,
          side: THREE.DoubleSide
        })
      );
      corona.position.set(140, 210, -200 - i * 0.3);
      corona.lookAt(0, 0, 0);
      group.add(corona);
    });

    // Realistic Cloud Textures - More natural looking, fewer clouds
    const createRealisticCloudTexture = (width, height, isCumulus = true) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      
      ctx.clearRect(0, 0, width, height);
      
      if (isCumulus) {
        // Create fluffy cumulus clouds
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Multiple overlapping circles for fluffy appearance
        const circles = [
          { x: centerX - width * 0.2, y: centerY, r: width * 0.28 },
          { x: centerX + width * 0.15, y: centerY - height * 0.08, r: width * 0.32 },
          { x: centerX, y: centerY + height * 0.05, r: width * 0.25 },
          { x: centerX + width * 0.25, y: centerY + height * 0.02, r: width * 0.22 },
          { x: centerX - width * 0.1, y: centerY - height * 0.12, r: width * 0.2 },
        ];
        
        circles.forEach(circle => {
          const grad = ctx.createRadialGradient(circle.x, circle.y, 0, circle.x, circle.y, circle.r);
          grad.addColorStop(0, `rgba(255, 255, 245, ${0.7 + Math.random() * 0.2})`);
          grad.addColorStop(0.4, `rgba(255, 255, 240, ${0.4 + Math.random() * 0.2})`);
          grad.addColorStop(0.7, `rgba(240, 240, 235, ${0.2 + Math.random() * 0.1})`);
          grad.addColorStop(1, `rgba(230, 230, 225, 0)`);
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Create wispy cirrus clouds
        const grad = ctx.createLinearGradient(0, height/2, width, height/2);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.2, "rgba(255,255,250,0.35)");
        grad.addColorStop(0.5, "rgba(255,255,250,0.55)");
        grad.addColorStop(0.8, "rgba(255,255,250,0.35)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        
        ctx.fillStyle = grad;
        
        // Create wavy shape
        for (let y = 0; y < height; y++) {
          const waveX = Math.sin(y * 0.1) * 20;
          const alpha = Math.sin(y * 0.15) * 0.3 + 0.4;
          ctx.fillStyle = `rgba(255,255,250,${alpha * 0.5})`;
          ctx.fillRect(waveX + width * 0.1, y, width * 0.7, 1);
        }
      }
      
      return new THREE.CanvasTexture(canvas);
    };
    
    // Create fewer, larger clouds for a cleaner sky (reduced from 5 to 3)
    const cloudTextures = [
      createRealisticCloudTexture(512, 256, true),
      createRealisticCloudTexture(600, 280, true),
      createRealisticCloudTexture(540, 260, true),
    ];
    
    const cirrusTexture = createRealisticCloudTexture(512, 128, false);
    
    // Position clouds realistically - scattered naturally (fewer positions)
    const cloudPositions = [
      // High altitude clouds
      { angle: 0.3, radius: 280, y: 210, scaleX: 95, scaleY: 45, texIdx: 0 },
      { angle: 2.5, radius: 275, y: 220, scaleX: 85, scaleY: 40, texIdx: 1 },
      { angle: 4.2, radius: 295, y: 215, scaleX: 90, scaleY: 42, texIdx: 2 },
      { angle: 5.8, radius: 270, y: 200, scaleX: 105, scaleY: 47, texIdx: 0 },
    ];
    
    cloudPositions.forEach(pos => {
      const cloud = new THREE.Sprite(
        new THREE.SpriteMaterial({ 
          map: cloudTextures[pos.texIdx], 
          transparent: true, 
          opacity: 0.65 + Math.random() * 0.2,
          depthTest: false,
          blending: THREE.NormalBlending
        })
      );
      
      const x = Math.cos(pos.angle) * pos.radius;
      const z = Math.sin(pos.angle) * pos.radius;
      cloud.position.set(x, pos.y, z);
      cloud.scale.set(pos.scaleX, pos.scaleY, 1);
      group.add(cloud);
    });
    
    // Add wispy cirrus clouds at higher altitude (fewer)
    const cirrusPositions = [
      { angle: 0.5, radius: 320, y: 240, scaleX: 160, scaleY: 18, rotation: 0.3 },
      { angle: 2.8, radius: 315, y: 235, scaleX: 150, scaleY: 16, rotation: -0.2 },
      { angle: 4.6, radius: 318, y: 238, scaleX: 155, scaleY: 17, rotation: -0.1 },
    ];
    
    cirrusPositions.forEach(pos => {
      const cirrus = new THREE.Sprite(
        new THREE.SpriteMaterial({ 
          map: cirrusTexture, 
          transparent: true, 
          opacity: 0.35 + Math.random() * 0.15,
          depthTest: false,
          blending: THREE.AdditiveBlending
        })
      );
      
      const x = Math.cos(pos.angle) * pos.radius;
      const z = Math.sin(pos.angle) * pos.radius;
      cirrus.position.set(x, pos.y, z);
      cirrus.scale.set(pos.scaleX, pos.scaleY, 1);
      cirrus.material.rotation = pos.rotation;
      group.add(cirrus);
    });
    
    // Atmospheric haze
    const hazeCanvas = document.createElement("canvas");
    hazeCanvas.width = 4;
    hazeCanvas.height = 256;
    const hazeCtx = hazeCanvas.getContext("2d");
    const hazeGrad = hazeCtx.createLinearGradient(0, 0, 0, 256);
    hazeGrad.addColorStop(0, "rgba(200,220,240,0)");
    hazeGrad.addColorStop(0.3, "rgba(220,230,248,0.25)");
    hazeGrad.addColorStop(0.6, "rgba(240,245,250,0.4)");
    hazeGrad.addColorStop(1, "rgba(255,250,240,0.15)");
    hazeCtx.fillStyle = hazeGrad;
    hazeCtx.fillRect(0, 0, 4, 256);
    
    const hazeRing = new THREE.Mesh(
      new THREE.CylinderGeometry(335, 335, 70, 64, 1, true),
      new THREE.MeshBasicMaterial({ 
        map: new THREE.CanvasTexture(hazeCanvas), 
        transparent: true, 
        side: THREE.BackSide,
        opacity: 0.4
      })
    );
    hazeRing.position.y = 15;
    group.add(hazeRing);

  } else {
    // NIGHT SKY - Fewer, more realistic stars
    const nightBase = new THREE.Mesh(
      new THREE.SphereGeometry(344, 64, 32),
      new THREE.MeshBasicMaterial({ color: 0x020410, side: THREE.BackSide })
    );
    group.add(nightBase);
    
    const nightHorizon = new THREE.Mesh(
      new THREE.SphereGeometry(342, 48, 24, 0, Math.PI * 2, 0.7, 0.25),
      new THREE.MeshBasicMaterial({ color: 0x0a0a2a, side: THREE.BackSide, transparent: true, opacity: 0.4 })
    );
    group.add(nightHorizon);
    
    // REDUCED STAR COUNT - More realistic night sky
    // Only use 2 layers instead of 4, with fewer stars
    const starLayers = [
      { count: 600, radius: 300, color: 0xffffff, size: 0.35, opacity: 0.7 },
      { count: 200, radius: 315, color: 0xaaddff, size: 0.55, opacity: 0.6 },
    ];
    
    starLayers.forEach(layer => {
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      
      for (let i = 0; i < layer.count; i++) {
        // Avoid clustering near the horizon
        const theta = Math.random() * Math.PI * 2;
        let phi = Math.acos(2 * Math.random() - 1);
        
        // Keep stars mostly in upper sky (avoid horizon clustering)
        if (phi < 0.8) phi = 0.8 + Math.random() * 1.0;
        
        positions.push(
          layer.radius * Math.sin(phi) * Math.cos(theta),
          layer.radius * Math.cos(phi),
          layer.radius * Math.sin(phi) * Math.sin(theta)
        );
      }
      
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      
      const stars = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({ 
          color: layer.color, 
          size: layer.size, 
          sizeAttenuation: true, 
          transparent: true, 
          opacity: layer.opacity,
          blending: THREE.AdditiveBlending
        })
      );
      group.add(stars);
    });
    
    // A few bright stars (constellation-like)
    const brightStarsGeo = new THREE.BufferGeometry();
    const brightPositions = [];
    const brightColors = [0xffeedd, 0xffddcc, 0xffccaa, 0xffddff];
    
    for (let i = 0; i < 40; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = 0.9 + Math.random() * 1.2;
      const color = brightColors[Math.floor(Math.random() * brightColors.length)];
      brightPositions.push({
        pos: [310 * Math.sin(phi) * Math.cos(theta), 310 * Math.cos(phi), 310 * Math.sin(phi) * Math.sin(theta)],
        color: color
      });
    }
    
    // Create separate points for bright stars with individual colors
    brightPositions.forEach(star => {
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(star.pos), 3));
      const starPoint = new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ color: star.color, size: 0.7, sizeAttenuation: true, transparent: true, blending: THREE.AdditiveBlending })
      );
      group.add(starPoint);
    });
    
    // Moon - more realistic
    const moonGroup = new THREE.Group();
    
    const moonGlowCanvas = document.createElement("canvas");
    moonGlowCanvas.width = 256;
    moonGlowCanvas.height = 256;
    const moonGlowCtx = moonGlowCanvas.getContext("2d");
    const moonGlowGrad = moonGlowCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
    moonGlowGrad.addColorStop(0, "rgba(255,255,220,0.5)");
    moonGlowGrad.addColorStop(0.3, "rgba(220,230,190,0.15)");
    moonGlowGrad.addColorStop(0.7, "rgba(180,200,160,0.05)");
    moonGlowGrad.addColorStop(1, "rgba(140,160,120,0)");
    moonGlowCtx.fillStyle = moonGlowGrad;
    moonGlowCtx.fillRect(0, 0, 256, 256);
    
    const moonHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(moonGlowCanvas), transparent: true, depthTest: false, blending: THREE.AdditiveBlending })
    );
    moonHalo.scale.set(45, 45, 1);
    moonHalo.position.set(-115, 238, -145);
    moonGroup.add(moonHalo);
    
    const moonCanvas = document.createElement("canvas");
    moonCanvas.width = 512;
    moonCanvas.height = 512;
    const moonCtx = moonCanvas.getContext("2d");
    
    // Realistic moon surface
    moonCtx.fillStyle = "#f2e8c0";
    moonCtx.beginPath();
    moonCtx.arc(256, 256, 240, 0, Math.PI * 2);
    moonCtx.fill();
    
    // Add realistic craters
    const craters = [
      { x: 200, y: 210, r: 35 },
      { x: 310, y: 230, r: 28 },
      { x: 250, y: 300, r: 25 },
      { x: 170, y: 290, r: 20 },
      { x: 340, y: 280, r: 18 },
      { x: 280, y: 180, r: 22 },
      { x: 220, y: 150, r: 15 },
      { x: 360, y: 200, r: 16 },
    ];
    
    craters.forEach(crater => {
      moonCtx.beginPath();
      moonCtx.arc(crater.x, crater.y, crater.r, 0, Math.PI * 2);
      moonCtx.fillStyle = `rgba(200, 180, 120, 0.25)`;
      moonCtx.fill();
      
      moonCtx.beginPath();
      moonCtx.arc(crater.x - 3, crater.y - 2, crater.r * 0.6, 0, Math.PI * 2);
      moonCtx.fillStyle = `rgba(160, 140, 90, 0.2)`;
      moonCtx.fill();
    });
    
    // Add tiny surface details
    for (let i = 0; i < 200; i++) {
      const x = 100 + Math.random() * 312;
      const y = 100 + Math.random() * 312;
      const r = 1 + Math.random() * 4;
      moonCtx.beginPath();
      moonCtx.arc(x, y, r, 0, Math.PI * 2);
      moonCtx.fillStyle = `rgba(180, 160, 100, ${0.1 + Math.random() * 0.15})`;
      moonCtx.fill();
    }
    
    const moonTexture = new THREE.CanvasTexture(moonCanvas);
    const moon = new THREE.Mesh(
      new THREE.CircleGeometry(12, 64),
      new THREE.MeshStandardMaterial({ map: moonTexture, color: 0xf2e8c0, emissive: 0x221100, emissiveIntensity: 0.08 })
    );
    moon.position.set(-115, 238, -140);
    moon.lookAt(0, 0, 0);
    moonGroup.add(moon);
    
    group.add(moonGroup);
    
    // Subtle aurora effect (more subtle)
    const auroraCanvas = document.createElement("canvas");
    auroraCanvas.width = 512;
    auroraCanvas.height = 256;
    const aCtx = auroraCanvas.getContext("2d");
    
    for (let x = 0; x < 512; x++) {
      const height = 50 + Math.sin(x * 0.04) * 20 + Math.cos(x * 0.08) * 10;
      const alpha = 0.04 + Math.sin(x * 0.06) * 0.02;
      
      const grad = aCtx.createLinearGradient(x, 0, x, height);
      grad.addColorStop(0, `rgba(0, 100, 80, 0)`);
      grad.addColorStop(0.3, `rgba(0, 120, 100, ${alpha * 0.5})`);
      grad.addColorStop(0.6, `rgba(50, 80, 120, ${alpha * 0.3})`);
      grad.addColorStop(1, `rgba(100, 60, 80, 0)`);
      
      aCtx.fillStyle = grad;
      aCtx.fillRect(x, 0, 1, height);
    }
    
    const auroraPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 50),
      new THREE.MeshBasicMaterial({ 
        map: new THREE.CanvasTexture(auroraCanvas), 
        transparent: true, 
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        opacity: 0.35
      })
    );
    
    auroraPlane.position.set(-50, 90, -120);
    auroraPlane.rotation.y = 0.8;
    auroraPlane.rotation.x = 0.2;
    group.add(auroraPlane);
    
    // Night clouds - very subtle, fewer
    const nightCloudTex = (() => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      const grad = ctx.createRadialGradient(128, 64, 0, 128, 64, 128);
      grad.addColorStop(0, "rgba(140,160,180,0.08)");
      grad.addColorStop(0.5, "rgba(120,140,160,0.04)");
      grad.addColorStop(1, "rgba(100,120,140,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);
      return new THREE.CanvasTexture(canvas);
    })();
    
    // Fewer night clouds (reduced from 12 to 6)
    for (let i = 0; i < 6; i++) {
      const nightCloud = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: nightCloudTex, transparent: true, opacity: 0.15 + Math.random() * 0.08, depthTest: false })
      );
      const angle = Math.random() * Math.PI * 2;
      const radius = 240 + Math.random() * 60;
      nightCloud.position.set(Math.cos(angle) * radius, 150 + Math.random() * 40, Math.sin(angle) * radius);
      const scale = 60 + Math.random() * 50;
      nightCloud.scale.set(scale, scale * 0.35, 1);
      group.add(nightCloud);
    }
  }
  
  return group;
}

// ============================================================================
//  NAME BOARD SPRITE (same as before)
// ============================================================================
function createNameBoard(isNight) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = isNight ? "rgba(8,14,36,0.96)" : "rgba(255,255,255,0.96)";
  ctx.beginPath();
  ctx.roundRect(4, 4, 760, 120, 12);
  ctx.fill();

  ctx.fillStyle = isNight ? "#38bdf8" : "#1d4ed8";
  ctx.fillRect(4, 4, 760, 7);

  ctx.textAlign = "center";
  ctx.font = "bold 48px system-ui";
  ctx.fillStyle = isNight ? "#e0f2fe" : "#0f172a";
  ctx.fillText("JNTU Vizianagaram", 384, 72);

  ctx.font = "24px system-ui";
  ctx.fillStyle = isNight ? "#7dd3fc" : "#475569";
  ctx.fillText("Jawaharlal Nehru Technological University — 3D Campus", 384, 106);

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthTest: false }));
  sprite.scale.set(42, 7, 1);
  sprite.position.set(0, 15, -85);
  return sprite;
}

// ============================================================================
//  CAMERA SYSTEM (same as before)
// ============================================================================
class CameraSystem {
  constructor(camera) {
    this.camera = camera;
    this.theta = Math.PI * 0.22;
    this.phi = 1.05;
    this.radius = 110;
    this.thetaVel = 0;
    this.phiVel = 0;
    this.radiusVel = 0;
    this.target = new THREE.Vector3(0, 5, 0);
    this.targetVel = new THREE.Vector3();
    this.drag = { active: false, button: -1, lastX: 0, lastY: 0 };
    this.cinematic = false;
    this.cinematicTime = 0;
    this.cinematicSpeed = 0.036;
    this.damping = 0.88;
  }

  onMouseDown(e) {
    this.drag = { active: true, button: e.button, lastX: e.clientX, lastY: e.clientY };
  }

  onMouseMove(e) {
    if (!this.drag.active || this.cinematic) return;
    const dx = e.clientX - this.drag.lastX;
    const dy = e.clientY - this.drag.lastY;
    this.drag.lastX = e.clientX;
    this.drag.lastY = e.clientY;

    if (this.drag.button === 0) {
      this.thetaVel -= dx * 0.005;
      this.phiVel += dy * 0.004;
    } else if (this.drag.button === 2) {
      const speed = this.radius * 0.0008;
      const right = new THREE.Vector3();
      this.camera.getWorldDirection(right);
      right.cross(new THREE.Vector3(0, 1, 0)).normalize();
      this.targetVel.addScaledVector(right, -dx * speed);
      this.targetVel.addScaledVector(new THREE.Vector3(0, 1, 0), dy * speed);
    }
  }

  onMouseUp() {
    this.drag.active = false;
  }

  onWheel(e) {
    if (this.cinematic) return;
    this.radiusVel += e.deltaY * 0.06;
  }

  onTouchStart(e) {
    if (e.touches.length === 1) {
      this.drag = { active: true, button: 0, lastX: e.touches[0].clientX, lastY: e.touches[0].clientY };
    }
  }

  onTouchMove(e) {
    if (e.touches.length === 1 && this.drag.active && !this.cinematic) {
      const dx = e.touches[0].clientX - this.drag.lastX;
      const dy = e.touches[0].clientY - this.drag.lastY;
      this.drag.lastX = e.touches[0].clientX;
      this.drag.lastY = e.touches[0].clientY;
      this.thetaVel -= dx * 0.005;
      this.phiVel += dy * 0.004;
    }
  }

  onTouchEnd() {
    this.drag.active = false;
  }

  applyPreset(preset) {
    this.cinematic = false;
    this.theta = preset.theta;
    this.phi = preset.phi;
    this.radius = preset.radius;
    this.target.set(preset.tx, preset.ty, preset.tz);
    this.thetaVel = this.phiVel = this.radiusVel = 0;
    this.targetVel.set(0, 0, 0);
  }

  flyToBuilding(buildingGroup) {
    this.cinematic = false;
    const { centroid, totalHeight, width, depth } = buildingGroup.userData;
    this.target.set(centroid.x, totalHeight * 0.35, centroid.z);
    this.radius = Math.max(width, depth) * 2.8 + 12;
    this.phi = 1.1;
  }

  toggleCinematic() {
    this.cinematic = !this.cinematic;
    this.cinematicTime = 0;
    if (!this.cinematic) {
      this.theta = Math.PI * 0.22;
      this.phi = 1.05;
      this.radius = 110;
      this.target.set(0, 5, 0);
    }
    return this.cinematic;
  }

  reset() {
    this.cinematic = false;
    this.cinematicTime = 0;
    this.theta = Math.PI * 0.22;
    this.phi = 1.05;
    this.radius = 110;
    this.target.set(0, 5, 0);
    this.thetaVel = this.phiVel = this.radiusVel = 0;
    this.targetVel.set(0, 0, 0);
  }

  update(deltaTime) {
    if (this.cinematic) {
      this.cinematicTime += deltaTime * this.cinematicSpeed;
      if (this.cinematicTime >= 1) this.cinematicTime = 0;

      const waypoints = [
        { pos: new THREE.Vector3(-90, 65, 110), target: new THREE.Vector3(0, 8, 0), time: 0.00 },
        { pos: new THREE.Vector3(70, 40, 100), target: new THREE.Vector3(10, 5, -10), time: 0.13 },
        { pos: new THREE.Vector3(100, 22, 20), target: new THREE.Vector3(5, 4, 0), time: 0.27 },
        { pos: new THREE.Vector3(80, 12, -70), target: new THREE.Vector3(-5, 3, -15), time: 0.40 },
        { pos: new THREE.Vector3(-20, 10, -90), target: new THREE.Vector3(0, 5, -5), time: 0.53 },
        { pos: new THREE.Vector3(-100, 20, -45), target: new THREE.Vector3(-5, 4, 10), time: 0.65 },
        { pos: new THREE.Vector3(-95, 40, 45), target: new THREE.Vector3(0, 6, 5), time: 0.78 },
        { pos: new THREE.Vector3(-30, 85, 90), target: new THREE.Vector3(0, 0, 0), time: 0.90 },
        { pos: new THREE.Vector3(-90, 65, 110), target: new THREE.Vector3(0, 8, 0), time: 1.00 }
      ];

      let waypointA = waypoints[0];
      let waypointB = waypoints[1];
      for (let i = 0; i < waypoints.length - 1; i++) {
        if (this.cinematicTime >= waypoints[i].time && this.cinematicTime <= waypoints[i + 1].time) {
          waypointA = waypoints[i];
          waypointB = waypoints[i + 1];
          break;
        }
      }

      const lerpFactor = (this.cinematicTime - waypointA.time) / Math.max(0.001, waypointB.time - waypointA.time);
      const smoothFactor = lerpFactor < 0.5 ? 2 * lerpFactor * lerpFactor : -1 + (4 - 2 * lerpFactor) * lerpFactor;

      this.camera.position.lerpVectors(waypointA.pos, waypointB.pos, smoothFactor);
      this.camera.lookAt(new THREE.Vector3().lerpVectors(waypointA.target, waypointB.target, smoothFactor));
      return;
    }

    this.theta += this.thetaVel;
    this.thetaVel *= this.damping;
    this.phi += this.phiVel;
    this.phiVel *= this.damping;
    this.radius += this.radiusVel;
    this.radiusVel *= this.damping;

    this.phi = Math.max(0.08, Math.min(Math.PI * 0.47, this.phi));
    this.radius = Math.max(8, Math.min(290, this.radius));

    this.target.addScaledVector(this.targetVel, 1);
    this.targetVel.multiplyScalar(this.damping);

    const x = this.target.x + this.radius * Math.sin(this.phi) * Math.sin(this.theta);
    const y = this.target.y + this.radius * Math.cos(this.phi);
    const z = this.target.z + this.radius * Math.sin(this.phi) * Math.cos(this.theta);

    this.camera.position.lerp(new THREE.Vector3(x, y, z), 0.1);
    this.camera.lookAt(this.target);
  }
}

// ============================================================================
//  INFO PANEL COMPONENT (same as before)
// ============================================================================
function InfoPanel({ building, onClose, onFloorSelect, activeFloor, userRole }) {
  const [view, setView] = useState("building");
  const [selectedRoom, setSelectedRoom] = useState(null);

  const props = building?.userData?.props || {};
  const type = building?.userData?.type || "academic";
  const floors = building?.userData?.floors || 1;
  const totalHeight = building?.userData?.totalHeight || 4;
  const width = building?.userData?.width || 0;
  const depth = building?.userData?.depth || 0;

  const badgeColors = {
    hostel: "#1d4ed8",
    girls_hostel: "#9d174d",
    academic: "#065f46",
    workshop: "#78350f",
    admin: "#374151",
    canteen: "#92400e",
    library: "#0369a1"
  };
  const badgeColor = badgeColors[type] || "#374151";

  const floorRooms = useMemo(() => {
    if (activeFloor === null) return [];
    return ROOMS.filter(room => room.building_id === props.id && room.floor === activeFloor);
  }, [props.id, activeFloor]);

  useEffect(() => {
    setView("building");
    setSelectedRoom(null);
  }, [building]);

  if (!building) return null;

  const getTimeStatus = (openTime, closeTime) => {
    if (!openTime || !closeTime) return null;
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const isOpen = currentTime >= openTime && currentTime <= closeTime;
    return {
      isOpen,
      text: isOpen ? `Open · ${openTime}–${closeTime}` : `Closed · Opens ${openTime}`,
      color: isOpen ? "#34d399" : "#f87171"
    };
  };

  const buildingStatus = getTimeStatus(props.open_time, props.close_time);

  return (
    <div style={{
      position: "absolute",
      top: "50%",
      right: 20,
      transform: "translateY(-50%)",
      width: 300,
      maxHeight: "82vh",
      overflowY: "auto",
      background: "rgba(6,10,24,0.97)",
      backdropFilter: "blur(22px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 20,
      padding: 22,
      zIndex: 25,
      boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
      scrollbarWidth: "thin"
    }}>
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "rgba(255,255,255,0.06)",
          border: "none",
          color: "rgba(255,255,255,0.45)",
          width: 26,
          height: 26,
          borderRadius: "50%",
          cursor: "pointer",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        ✕
      </button>

      <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 11,
            color: view === "building" ? "#38bdf8" : "rgba(255,255,255,0.4)",
            cursor: "pointer",
            fontWeight: 600
          }}
          onClick={() => { setView("building"); setSelectedRoom(null); }}
        >
          {props.short_name || props.name}
        </span>
        {(view === "floor" || view === "room") && (
          <>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>›</span>
            <span
              style={{
                fontSize: 11,
                color: view === "floor" ? "#38bdf8" : "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontWeight: 600
              }}
              onClick={() => { setView("floor"); setSelectedRoom(null); }}
            >
              Floor {activeFloor === 0 ? "G" : activeFloor}
            </span>
          </>
        )}
        {view === "room" && selectedRoom && (
          <>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>›</span>
            <span style={{ fontSize: 11, color: "#38bdf8", fontWeight: 600 }}>{selectedRoom.name}</span>
          </>
        )}
      </div>

      {view === "building" && (
        <>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "white",
            borderRadius: 20,
            padding: "3px 10px",
            marginBottom: 10,
            background: badgeColor
          }}>
            {VIS[type]?.icon} {VIS[type]?.label}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", marginBottom: 8, paddingRight: 28 }}>{props.name}</div>
          {props.description && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 12 }}>{props.description}</div>
          )}

          {buildingStatus && (
            <div style={{
              padding: "7px 12px",
              borderRadius: 8,
              marginBottom: 12,
              background: buildingStatus.isOpen ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${buildingStatus.isOpen ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: buildingStatus.color, display: "inline-block" }} />
              <span style={{ fontSize: 11, color: buildingStatus.color, fontWeight: 600 }}>{buildingStatus.text}</span>
            </div>
          )}

          {props.allowed_roles && !props.allowed_roles.includes(userRole) && (
            <div style={{
              padding: "8px 12px",
              borderRadius: 8,
              marginBottom: 12,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              fontSize: 11,
              color: "#f87171"
            }}>
              🚫 Restricted · {props.allowed_roles.join(", ")} access only
            </div>
          )}

          <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
            {[["Floors", floors], ["Height", Math.round(totalHeight) + "m"], props.room_prefix && ["Prefix", props.room_prefix]].filter(Boolean).map(([label, value]) => (
              <div key={label} style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10,
                padding: "8px 5px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#38bdf8" }}>{value}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Explore Floors</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
            {Array.from({ length: floors }).map((_, floorIndex) => {
              const floorLabel = props.floor_labels?.[floorIndex] || (floorIndex === 0 ? "Ground" : `Floor ${floorIndex}`);
              const color = FLOOR_COLS[floorIndex % FLOOR_COLS.length];
              return (
                <div
                  key={floorIndex}
                  onClick={() => { onFloorSelect(floorIndex); setView("floor"); setSelectedRoom(null); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                    border: `1px solid ${activeFloor === floorIndex ? color : "rgba(255,255,255,0.07)"}`,
                    background: activeFloor === floorIndex ? color + "22" : "rgba(255,255,255,0.03)",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0
                  }}>{floorIndex === 0 ? "G" : floorIndex}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: activeFloor === floorIndex ? "#fff" : "rgba(255,255,255,0.55)" }}>{floorLabel} Floor</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Click to highlight & explore</div>
                  </div>
                  {activeFloor === floorIndex && (
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: color, color: "#fff", fontWeight: 600 }}>Active</span>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: "3px 8px" }}>
              📐 {Math.round(width)}×{Math.round(depth)}m
            </span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: "3px 8px" }}>
              🏗️ {props.type}
            </span>
            {props.capacity && (
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: "3px 8px" }}>
                👥 {props.capacity}
              </span>
            )}
            {props.established && (
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: "3px 8px" }}>
                📅 Est. {props.established}
              </span>
            )}
          </div>

          {props.id === "YSR_LIBRARY" && (
            <div style={{
              marginTop: 12,
              padding: "10px 14px",
              background: "rgba(14,165,233,0.12)",
              border: "1px solid rgba(14,165,233,0.3)",
              borderRadius: 10,
              fontSize: 12,
              color: "#7dd3fc",
              textAlign: "center"
            }}>
              📚 50,000+ volumes · IEEE Digital Access
            </div>
          )}
        </>
      )}

      {view === "floor" && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{props.name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>
            {props.floor_labels?.[activeFloor] || (activeFloor === 0 ? "Ground" : `Floor ${activeFloor}`)} · {floorRooms.length} rooms
          </div>
          {floorRooms.length === 0 ? (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px 0" }}>No room data for this floor yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 300, overflowY: "auto" }}>
              {floorRooms.map(room => {
                const roomMeta = ROOM_META[room.type] || { icon: "📍", label: room.type };
                const allowed = !room.allowed_roles || room.allowed_roles.includes(userRole);
                return (
                  <div
                    key={room.id}
                    onClick={() => { setSelectedRoom(room); setView("room"); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                      border: "1px solid rgba(255,255,255,0.07)",
                      background: "rgba(255,255,255,0.03)",
                      opacity: allowed ? 1 : 0.5
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{roomMeta.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "#f1f5f9", fontWeight: 500 }}>{room.name}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{roomMeta.label}</div>
                    </div>
                    {!allowed && (
                      <span style={{ fontSize: 9, color: "#f87171", border: "1px solid #f87171", borderRadius: 4, padding: "1px 4px" }}>Restricted</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {view === "room" && selectedRoom && (() => {
        const roomMeta = ROOM_META[selectedRoom.type] || { icon: "📍", label: selectedRoom.type };
        const allowed = !selectedRoom.allowed_roles || selectedRoom.allowed_roles.includes(userRole);
        const roomStatus = getTimeStatus(selectedRoom.open_time, selectedRoom.close_time);
        return (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(56,189,248,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                border: "1px solid rgba(56,189,248,0.3)",
                flexShrink: 0
              }}>{roomMeta.icon}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{selectedRoom.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{roomMeta.label} · {props.short_name}</div>
              </div>
            </div>
            {selectedRoom.description && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.55, marginBottom: 14 }}>{selectedRoom.description}</div>
            )}

            <div style={{
              padding: "9px 12px",
              borderRadius: 10,
              marginBottom: 10,
              background: allowed ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${allowed ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.35)"}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Authorization</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: allowed ? "#34d399" : "#f87171" }}>{allowed ? "🛡 Access Granted" : "🚫 Restricted"}</span>
            </div>

            {roomStatus && (
              <div style={{
                padding: "8px 12px",
                borderRadius: 8,
                marginBottom: 10,
                background: roomStatus.isOpen ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)",
                border: `1px solid ${roomStatus.isOpen ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.25)"}`,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: roomStatus.color, display: "inline-block" }} />
                <span style={{ fontSize: 11, color: roomStatus.color, fontWeight: 600 }}>{roomStatus.text}</span>
              </div>
            )}

            {!allowed && (
              <div style={{
                padding: "10px 12px",
                borderRadius: 10,
                marginBottom: 12,
                background: "rgba(239,68,68,0.09)",
                border: "1px solid rgba(239,68,68,0.3)",
                fontSize: 11,
                color: "#fca5a5",
                lineHeight: 1.5
              }}>
                <strong>🚫 Access Denied</strong><br />
                Role <strong>{userRole.toUpperCase()}</strong> lacks permission. Required: <strong>{selectedRoom.allowed_roles?.join(", ").toUpperCase()}</strong>
              </div>
            )}

            <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
              {selectedRoom.capacity && (
                <div style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "8px 5px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#38bdf8" }}>{selectedRoom.capacity}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 2 }}>Capacity</div>
                </div>
              )}
              {selectedRoom.area_sqm && (
                <div style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "8px 5px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#38bdf8" }}>{selectedRoom.area_sqm}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 2 }}>m²</div>
                </div>
              )}
            </div>

            {(selectedRoom.attributes || []).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {selectedRoom.attributes.map(attr => (
                  <span key={attr} style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.45)",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 10,
                    padding: "3px 8px"
                  }}>{attr}</span>
                ))}
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}

// ============================================================================
//  SEARCH BAR COMPONENT (same as before)
// ============================================================================
function SearchBar({ onSelect }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const searchTerm = query.toLowerCase();
    const buildingResults = BUILDINGS_GEOJSON.features
      .filter(f => f.properties.name.toLowerCase().includes(searchTerm) || 
                   f.properties.short_name?.toLowerCase().includes(searchTerm) ||
                   f.properties.type?.includes(searchTerm))
      .map(f => ({ ...f.properties, _kind: "building" }));
    const roomResults = ROOMS
      .filter(r => r.name.toLowerCase().includes(searchTerm) ||
                   r.type.toLowerCase().includes(searchTerm) ||
                   (r.attributes || []).some(a => a.includes(searchTerm)))
      .slice(0, 8)
      .map(r => ({ ...r, _kind: "room" }));
    return [...buildingResults, ...roomResults].slice(0, 12);
  }, [query]);

  const chips = ["classroom", "lab", "hostel", "canteen", "library", "workshop"];

  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 22,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(8,12,28,0.90)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 30,
          padding: "10px 22px",
          cursor: "pointer",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)"
        }}
      >
        <span style={{ fontSize: 14, opacity: 0.4 }}>🔍</span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>Search rooms & buildings…</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginLeft: 8 }}>Ctrl+K</span>
      </div>
    );
  }

  return (
    <div style={{
      position: "absolute",
      top: 20,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 22,
      width: 440,
      maxWidth: "90vw"
    }}>
      <div style={{
        background: "rgba(8,12,28,0.97)",
        backdropFilter: "blur(22px)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 18,
        padding: "14px 16px",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16, opacity: 0.5 }}>🔍</span>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search rooms, buildings, type…"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              color: "white",
              fontSize: 14,
              outline: "none",
              fontFamily: "inherit"
            }}
          />
          <button
            onClick={() => { setExpanded(false); setQuery(""); }}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              borderRadius: "50%",
              width: 24,
              height: 24,
              cursor: "pointer",
              fontSize: 13
            }}
          >
            ✕
          </button>
        </div>

        {!query && (
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {chips.map(chip => (
              <span
                key={chip}
                onClick={() => setQuery(chip)}
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  textTransform: "capitalize"
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4, maxHeight: 280, overflowY: "auto" }}>
            {results.map((result, index) => {
              const isBuilding = result._kind === "building";
              const icon = isBuilding ? (VIS[result.type]?.icon || "🏛️") : (ROOM_META[result.type]?.icon || "📍");
              const label = isBuilding ? (VIS[result.type]?.label) : (ROOM_META[result.type]?.label || result.type);
              return (
                <div
                  key={result.id || index}
                  onClick={() => { onSelect(result); setExpanded(false); setQuery(""); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 10px",
                    borderRadius: 10,
                    cursor: "pointer",
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.03)"
                  }}
                >
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 500 }}>{result.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{isBuilding ? "Building" : "Room"} · {label}</div>
                  </div>
                  <span style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: "rgba(56,189,248,0.15)",
                    color: "#38bdf8"
                  }}>
                    {isBuilding ? "🏛 Go" : "🚪 Room"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
//  COMPASS HUD (same as before)
// ============================================================================
function CompassHUD({ bearing }) {
  return (
    <div style={{
      position: "absolute",
      bottom: 100,
      left: 20,
      zIndex: 20,
      width: 88,
      height: 88,
      background: "rgba(8,12,28,0.78)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none"
    }}>
      <div style={{
        position: "relative",
        width: "100%",
        height: "100%",
        transform: `rotate(${-bearing}deg)`,
        transition: "transform 0.15s ease-out"
      }}>
        <div style={{ position: "absolute", top: 5, left: "50%", transform: "translateX(-50%)", color: "#ef4444", fontWeight: 800, fontSize: 15 }}>N</div>
        <div style={{ position: "absolute", bottom: 5, left: "50%", transform: "translateX(-50%)", color: "#38bdf8", fontWeight: 800, fontSize: 12 }}>S</div>
        <div style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", color: "#38bdf8", fontWeight: 800, fontSize: 12 }}>E</div>
        <div style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", color: "#38bdf8", fontWeight: 800, fontSize: 12 }}>W</div>
        <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", width: 4, height: 20, background: "#ef4444", clipPath: "polygon(50% 0%,100% 100%,0% 100%)" }} />
        <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", width: 4, height: 20, background: "#38bdf8", clipPath: "polygon(50% 100%,100% 0%,0% 0%)" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 7, height: 7, background: "#fff", borderRadius: "50%" }} />
      </div>
    </div>
  );
}

// ============================================================================
//  MAIN COMPONENT
// ============================================================================
export default function CampusMap3D() {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const cameraSystemRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const animationRef = useRef(null);
  const buildingsRef = useRef([]);
  const roadsRef = useRef([]);
  const lastHoveredRoadRef = useRef(null);
  const floorOverlayRef = useRef(null);
  const highlightedBuildingRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const isDraggingRef = useRef(false);
  const mouseDownPosRef = useRef({ x: 0, y: 0 });
  const vehicleManagerRef = useRef(null);
  const birdManagerRef = useRef(null);

  // Chatbot state
  const [userRole, setUserRole] = useState("student");
  const [events, setEvents] = useState([]);
  
  const [isNight, setIsNight] = useState(false);
  const [isCinematic, setIsCinematic] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [activeFloor, setActiveFloor] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [fps, setFps] = useState(0);
  const [activePreset, setActivePreset] = useState("all");
  const [bearing, setBearing] = useState(42);
  const [rightClickCoords, setRightClickCoords] = useState(null);

  // Load events from database/localStorage on mount
  useEffect(() => {
    const loadEventsData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/events');
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        } else {
          throw new Error('API server returned error status');
        }
      } catch (err) {
        console.warn('⚠️ Server offline or credentials error. Fetching events from localStorage.');
        const localEvents = localStorage.getItem('college_events');
        if (localEvents) {
          setEvents(JSON.parse(localEvents));
        }
      }
    };
    loadEventsData();
  }, []);

  const clearHighlight = useCallback(() => {
    if (highlightedBuildingRef.current) {
      highlightedBuildingRef.current.traverse(child => {
        if (child.isMesh && child.userData.isBuilding && child.material) {
          child.material.emissive = new THREE.Color(0x000000);
          if (child.material.emissiveIntensity !== undefined) child.material.emissiveIntensity = 0;
        }
      });
      highlightedBuildingRef.current = null;
    }
    if (floorOverlayRef.current) {
      floorOverlayRef.current.parent?.remove(floorOverlayRef.current);
      floorOverlayRef.current = null;
    }
  }, []);

  const highlightBuilding = useCallback((buildingGroup) => {
    clearHighlight();
    buildingGroup.traverse(child => {
      if (child.isMesh && child.userData.isBuilding) {
        child.material.emissive = new THREE.Color(0x1d4ed8);
        child.material.emissiveIntensity = 0.3;
      }
    });
    highlightedBuildingRef.current = buildingGroup;
  }, [clearHighlight]);

  const highlightFloor = useCallback((buildingGroup, floorIndex) => {
    if (floorOverlayRef.current) {
      floorOverlayRef.current.parent?.remove(floorOverlayRef.current);
    }
    const overlay = createFloorHighlight(buildingGroup, floorIndex, 0x38bdf8);
    buildingGroup.add(overlay);
    floorOverlayRef.current = overlay;
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedBuilding(null);
    setActiveFloor(null);
    clearHighlight();
    cameraSystemRef.current?.reset();
  }, [clearHighlight]);

  const handleFloorSelect = useCallback((floorIndex) => {
    setActiveFloor(floorIndex);
    if (selectedBuilding) {
      highlightFloor(selectedBuilding, floorIndex);
    }
  }, [selectedBuilding, highlightFloor]);

  // Handle chatbot entity selection
  const handleChatbotSelect = useCallback((entity) => {
    if (!entity) return;
    
    // Find building by name or ID
    const buildingGroup = buildingsRef.current.find(g => 
      g.userData.name.toLowerCase().includes(entity.name.toLowerCase()) ||
      g.userData.id === entity.id ||
      (entity.building_name && g.userData.name.toLowerCase().includes(entity.building_name.toLowerCase()))
    );
    
    if (buildingGroup) {
      highlightBuilding(buildingGroup);
      setSelectedBuilding(buildingGroup);
      setActiveFloor(entity.floor || 0);
      highlightFloor(buildingGroup, entity.floor || 0);
      
      // Fly to the building/entity location
      if (entity.entrance_lat && entity.entrance_lng) {
        // Convert lat/lng to world coordinates for camera target
        const worldPos = lngLatToWorld(entity.entrance_lng, entity.entrance_lat);
        cameraSystemRef.current.target.set(worldPos.x, 8, worldPos.z);
        cameraSystemRef.current.radius = Math.max(35, buildingGroup.userData.width * 2.5);
        cameraSystemRef.current.phi = 1.1;
      } else {
        cameraSystemRef.current.flyToBuilding(buildingGroup);
      }
    }
  }, [highlightBuilding, highlightFloor]);

  const rebuildScene = useCallback((nightMode) => {
    const scene = sceneRef.current;
    if (!scene) return;

    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    scene.fog = new THREE.FogExp2(nightMode ? 0x060c18 : 0x8dd4e8, 0.0015);
    scene.add(new THREE.AmbientLight(nightMode ? 0x0a1530 : 0xffffff, nightMode ? 0.28 : 0.55));

    const sunLight = new THREE.DirectionalLight(nightMode ? 0x0a1530 : 0xfff4e0, nightMode ? 0 : 1.1);
    sunLight.position.set(80, 130, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 400;
    sunLight.shadow.camera.left = -180;
    sunLight.shadow.camera.right = 180;
    sunLight.shadow.camera.top = 180;
    sunLight.shadow.camera.bottom = -180;
    scene.add(sunLight);

    scene.add(new THREE.HemisphereLight(
      nightMode ? 0x0a1040 : 0x87ceeb,
      nightMode ? 0x050a10 : 0x3a6b35,
      nightMode ? 0.22 : 0.45
    ));

    scene.add(createRichSky(nightMode));
    scene.add(createGround(nightMode));
    
    const roads = createRoads(nightMode);
    scene.add(roads.group);
    roadsRef.current = roads.meshes;
    
    scene.add(createTrees(nightMode));
    scene.add(createStreetLights(nightMode));
    scene.add(createNameBoard(nightMode));

    buildingsRef.current = [];
    BUILDINGS_GEOJSON.features.forEach(feature => {
      const building = createBuilding(feature, nightMode);
      scene.add(building);
      buildingsRef.current.push(building);
    });

    // Create path segments from roads and initialize vehicle manager
    const pathSegments = createPathSegments();
    
    if (vehicleManagerRef.current) {
      vehicleManagerRef.current.stop();
    }
    const vehicleManager = new VehicleManager(scene, pathSegments);
    vehicleManager.startSpawning();
    vehicleManagerRef.current = vehicleManager;
    
    // Initialize birds with reduced count
    if (birdManagerRef.current) {
      birdManagerRef.current.stop();
    }
    const birdManager = new BirdManager(scene, 12); // Reduced from 25 to 12
    birdManager.createBirdFlocks();
    birdManagerRef.current = birdManager;
  }, []);

  useEffect(() => {
    const mountElement = mountRef.current;
    if (!mountElement) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mountElement.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, mountElement.clientWidth / mountElement.clientHeight, 0.5, 800);
    camera.position.set(-70, 55, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const cameraSystem = new CameraSystem(camera);
    cameraSystemRef.current = cameraSystem;

    scene.background = new THREE.Color(0x7ec8e3);
    rebuildScene(false);

    const handleResize = () => {
      const width = mountElement.clientWidth;
      const height = mountElement.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    let lastTimestamp = performance.now();
    let fpsFrameCount = 0;
    let fpsTimeAccum = 0;
    
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      const now = performance.now();
      let deltaTime = Math.min((now - lastTimestamp) / 1000, 0.033);
      lastTimestamp = now;
      
      fpsFrameCount++;
      fpsTimeAccum += deltaTime;
      if (fpsTimeAccum >= 0.5) {
        setFps(Math.round(fpsFrameCount / fpsTimeAccum));
        fpsFrameCount = 0;
        fpsTimeAccum = 0;
      }
      
      cameraSystem.update(deltaTime);
      
      // Update vehicles with delta time
      if (vehicleManagerRef.current) {
        vehicleManagerRef.current.updateVehicles(deltaTime);
      }
      
      // Update birds
      if (birdManagerRef.current) {
        birdManagerRef.current.updateBirds(deltaTime);
      }
      
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      setBearing(Math.round((Math.atan2(direction.x, direction.z) * 180 / Math.PI + 180) % 360));
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
      if (vehicleManagerRef.current) {
        vehicleManagerRef.current.stop();
      }
      if (birdManagerRef.current) {
        birdManagerRef.current.stop();
      }
      renderer.dispose();
      if (mountElement.contains(renderer.domElement)) {
        mountElement.removeChild(renderer.domElement);
      }
    };
  }, [rebuildScene]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.background = new THREE.Color(isNight ? 0x040810 : 0x7ec8e3);
    rebuildScene(isNight);
    clearHighlight();
    setSelectedBuilding(null);
    setActiveFloor(null);
  }, [isNight, rebuildScene, clearHighlight]);

  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;
    const cameraSystem = cameraSystemRef.current;

    const onMouseDown = (e) => {
      cameraSystem.onMouseDown(e);
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
      isDraggingRef.current = false;
    };

    const onMouseMove = (e) => {
      cameraSystem.onMouseMove(e);
      
      const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
      const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
      if (dx > 3 || dy > 3) isDraggingRef.current = true;
      
      const rect = canvas.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = ((e.clientY - rect.top) / rect.height) * -2 + 1;
      raycasterRef.current.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current);
      
      const buildingMeshes = [];
      buildingsRef.current.forEach(group => {
        group.traverse(child => {
          if (child.isMesh && child.userData.isBuilding) buildingMeshes.push(child);
        });
      });
      
      const buildingHits = raycasterRef.current.intersectObjects(buildingMeshes, false);
      const roadHits = raycasterRef.current.intersectObjects(roadsRef.current, false);
      
      if (lastHoveredRoadRef.current) {
        const originalColor = lastHoveredRoadRef.current.userData.originalColor;
        lastHoveredRoadRef.current.material.color.setHex(originalColor);
        lastHoveredRoadRef.current = null;
      }
      
      if (buildingHits.length > 0) {
        canvas.style.cursor = "pointer";
        const buildingId = buildingHits[0].object.userData.buildingId;
        const buildingFeature = BUILDINGS_GEOJSON.features.find(f => f.properties.id === buildingId);
        if (buildingFeature) {
          setTooltip({
            name: buildingFeature.properties.name,
            type: buildingFeature.properties.type,
            x: e.clientX,
            y: e.clientY
          });
        }
      } else if (roadHits.length > 0) {
        canvas.style.cursor = "pointer";
        const road = roadHits[0].object;
        
        lastHoveredRoadRef.current = road;
        road.material.color.setHex(0xfbbf24);
        
        setTooltip({
          name: road.userData.name,
          type: `Road (${road.userData.type})`,
          x: e.clientX,
          y: e.clientY,
          isRoad: true
        });
      } else {
        canvas.style.cursor = "grab";
        setTooltip(null);
      }
    };

    const onMouseUp = () => cameraSystem.onMouseUp();
    const onWheel = (e) => { e.preventDefault(); cameraSystem.onWheel(e); };
    
    const onContextMenu = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = ((e.clientY - rect.top) / rect.height) * -2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current);
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectionPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
        const lng = ORIGIN.lng + intersectionPoint.x / (LNG_TO_M * SCALE);
        const lat = ORIGIN.lat - intersectionPoint.z / (LAT_TO_M * SCALE);
        setRightClickCoords({ lat, lng });
      }
    };
    
    const onClick = (e) => {
      if (isDraggingRef.current) return;
      
      const rect = canvas.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = ((e.clientY - rect.top) / rect.height) * -2 + 1;
      raycasterRef.current.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current);
      
      const roadHits = raycasterRef.current.intersectObjects(roadsRef.current, false);
      if (roadHits.length > 0) {
        return;
      }
      
      const buildingMeshes = [];
      buildingsRef.current.forEach(group => {
        group.traverse(child => {
          if (child.isMesh && child.userData.isBuilding) buildingMeshes.push(child);
        });
      });
      
      const buildingHits = raycasterRef.current.intersectObjects(buildingMeshes, false);
      if (buildingHits.length > 0) {
        const buildingId = buildingHits[0].object.userData.buildingId;
        const buildingGroup = buildingsRef.current.find(g => g.userData.id === buildingId);
        if (buildingGroup) {
          highlightBuilding(buildingGroup);
          setSelectedBuilding(buildingGroup);
          setActiveFloor(0);
          highlightFloor(buildingGroup, 0);
          cameraSystem.flyToBuilding(buildingGroup);
        }
      } else {
        clearHighlight();
        setSelectedBuilding(null);
        setActiveFloor(null);
      }
    };

    const onTouchStart = (e) => cameraSystem.onTouchStart(e);
    const onTouchMove = (e) => cameraSystem.onTouchMove(e);
    const onTouchEnd = () => cameraSystem.onTouchEnd();

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", onContextMenu);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContextMenu);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [clearHighlight, highlightBuilding, highlightFloor]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "f" || e.key === "F") {
        const isCinematicNow = cameraSystemRef.current.toggleCinematic();
        setIsCinematic(isCinematicNow);
        if (isCinematicNow) {
          setSelectedBuilding(null);
          clearHighlight();
        }
      }
      if (e.key === "n" || e.key === "N") {
        setIsNight(prev => !prev);
      }
      if (e.key === "Escape") {
        cameraSystemRef.current.cinematic = false;
        setIsCinematic(false);
        handleClosePanel();
        setRightClickCoords(null);
      }
      if (e.key === "r" || e.key === "R") {
        cameraSystemRef.current.reset();
        setIsCinematic(false);
      }
      if ((e.key === "k" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearHighlight, handleClosePanel]);

  const handleSearchSelect = useCallback((item) => {
    if (item._kind === "building") {
      const buildingGroup = buildingsRef.current.find(g => g.userData.id === item.id);
      if (buildingGroup) {
        highlightBuilding(buildingGroup);
        setSelectedBuilding(buildingGroup);
        setActiveFloor(0);
        highlightFloor(buildingGroup, 0);
        cameraSystemRef.current.flyToBuilding(buildingGroup);
      }
    } else {
      const buildingGroup = buildingsRef.current.find(g => g.userData.id === item.building_id);
      if (buildingGroup) {
        highlightBuilding(buildingGroup);
        setSelectedBuilding(buildingGroup);
        setActiveFloor(item.floor || 0);
        highlightFloor(buildingGroup, item.floor || 0);
        cameraSystemRef.current.flyToBuilding(buildingGroup);
      }
    }
  }, [highlightBuilding, highlightFloor]);

  const applyCameraPreset = useCallback((preset) => {
    setActivePreset(preset.id);
    cameraSystemRef.current?.applyPreset(preset);
  }, []);

  const copyCoordinates = useCallback(() => {
    if (rightClickCoords) {
      navigator.clipboard?.writeText(`${rightClickCoords.lat.toFixed(7)}, ${rightClickCoords.lng.toFixed(7)}`);
    }
  }, [rightClickCoords]);

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100vh",
      overflow: "hidden",
      background: "#040810",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      WebkitFontSmoothing: "antialiased"
    }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: "grab" }} />
      <SearchBar onSelect={handleSearchSelect} />

      <div style={{
        position: "absolute",
        top: 20,
        left: 20,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(8,12,28,0.88)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14,
        padding: "7px 14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em" }}>ROLE</span>
        <select
          value={userRole}
          onChange={e => setUserRole(e.target.value)}
          style={{
            background: "transparent",
            border: "none",
            color: "#38bdf8",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "inherit",
            outline: "none",
            cursor: "pointer"
          }}
        >
          <option value="student" style={{ background: "#0a0f1e" }}>🧑‍🎓 Student</option>
          <option value="faculty" style={{ background: "#0a0f1e" }}>👨‍🏫 Faculty</option>
          <option value="admin" style={{ background: "#0a0f1e" }}>🛠 Admin</option>
          <option value="visitor" style={{ background: "#0a0f1e" }}>🧭 Visitor</option>
        </select>
      </div>

      <div style={{
        position: "absolute",
        top: 68,
        left: 20,
        zIndex: 20,
        background: "rgba(8,12,28,0.82)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 12,
        padding: "9px 16px"
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", letterSpacing: "0.02em" }}>JNTU Vizianagaram</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1, textTransform: "uppercase", letterSpacing: "0.08em" }}>3D Interactive Campus</div>
      </div>

      <div style={{
        position: "absolute",
        top: 20,
        right: 20,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        gap: 6
      }}>
        {[
          { label: isNight ? "☀️ Day" : "🌙 Night", active: isNight, activeClass: "blue", onClick: () => setIsNight(v => !v), title: "Toggle Day/Night (N)" },
          { label: isCinematic ? "⏹ Stop" : "🎬 Fly", active: isCinematic, activeClass: "red", onClick: () => { const on = cameraSystemRef.current.toggleCinematic(); setIsCinematic(on); if (on) { setSelectedBuilding(null); clearHighlight(); } }, title: "Cinematic flythrough (F)" },
          { label: "⟲ Reset", active: false, activeClass: "", onClick: () => { cameraSystemRef.current.reset(); setIsCinematic(false); handleClosePanel(); }, title: "Reset view (R)" }
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            title={btn.title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: btn.active && btn.activeClass === "blue" ? "rgba(14,40,80,0.9)" : btn.active && btn.activeClass === "red" ? "rgba(80,10,10,0.9)" : "rgba(8,12,28,0.88)",
              backdropFilter: "blur(14px)",
              border: `1px solid ${btn.active && btn.activeClass === "blue" ? "rgba(56,189,248,0.5)" : btn.active && btn.activeClass === "red" ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 22,
              padding: "9px 16px",
              color: btn.active && btn.activeClass === "blue" ? "#38bdf8" : btn.active && btn.activeClass === "red" ? "#fca5a5" : "rgba(255,255,255,0.7)",
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 500,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)"
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.02em" }}>{btn.label}</span>
          </button>
        ))}
      </div>

      <div style={{
        position: "absolute",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(8,12,28,0.82)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 30,
        padding: "8px 14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
      }}>
        {CAMERA_PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => applyCameraPreset(preset)}
            title={`${preset.label} View`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "6px 10px",
              borderRadius: 20,
              border: `1px solid ${activePreset === preset.id ? "rgba(56,189,248,0.5)" : "rgba(255,255,255,0.0)"}`,
              background: activePreset === preset.id ? "rgba(56,189,248,0.12)" : "transparent",
              color: activePreset === preset.id ? "#38bdf8" : "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.18s"
            }}
          >
            <span style={{ fontSize: 18 }}>{preset.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.05em" }}>{preset.label}</span>
          </button>
        ))}
        <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.12)", margin: "0 4px" }} />
        <button
          onClick={() => setIsNight(v => !v)}
          title="Toggle Day/Night"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            padding: "6px 10px",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0)",
            background: "transparent",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontFamily: "inherit"
          }}
        >
          <span style={{ fontSize: 18 }}>{isNight ? "☀️" : "🌙"}</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>{isNight ? "Day" : "Night"}</span>
        </button>
      </div>

      {selectedBuilding && (
        <div style={{
          position: "absolute",
          left: 20,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          zIndex: 20
        }}>
          {Array.from({ length: selectedBuilding.userData.floors }).map((_, floorIndex) => {
            const color = FLOOR_COLS[floorIndex % FLOOR_COLS.length];
            const floorLabel = selectedBuilding.userData.props.floor_labels?.[floorIndex] || (floorIndex === 0 ? "Ground" : `Floor ${floorIndex}`);
            return (
              <button
                key={floorIndex}
                onClick={() => handleFloorSelect(floorIndex)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 10,
                  border: `1px solid ${activeFloor === floorIndex ? color : "rgba(255,255,255,0.15)"}`,
                  background: activeFloor === floorIndex ? color + "33" : "rgba(8,12,28,0.85)",
                  backdropFilter: "blur(8px)",
                  color: activeFloor === floorIndex ? color : "rgba(255,255,255,0.5)",
                  fontFamily: "inherit",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  minWidth: 80,
                  transition: "all 0.2s"
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, opacity: activeFloor === floorIndex ? 1 : 0.5 }} />
                {floorLabel}
              </button>
            );
          })}
        </div>
      )}

      {isCinematic && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 15 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "9vh", background: "#000" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "9vh", background: "#000" }} />
          <div style={{
            position: "absolute",
            top: "calc(9vh + 14px)",
            left: 28,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.65)",
            textTransform: "uppercase"
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", animation: "blink 1.1s step-start infinite", display: "block" }} />
            CINEMATIC FLYTHROUGH
          </div>
          <div style={{
            position: "absolute",
            bottom: "calc(9vh + 20px)",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 22,
            fontWeight: 700,
            color: "rgba(255,255,255,0.75)",
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
            textShadow: "0 2px 20px rgba(0,0,0,0.8)"
          }}>
            JNTU Vizianagaram Campus
          </div>
          <div style={{
            position: "absolute",
            bottom: "calc(9vh + 54px)",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            whiteSpace: "nowrap"
          }}>
            Press <kbd style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, padding: "1px 6px", fontSize: 10 }}>Esc</kbd> or <kbd style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, padding: "1px 6px", fontSize: 10 }}>F</kbd> to exit
          </div>
        </div>
      )}

      {selectedBuilding && (
        <InfoPanel
          building={selectedBuilding}
          onClose={handleClosePanel}
          onFloorSelect={handleFloorSelect}
          activeFloor={activeFloor}
          userRole={userRole}
        />
      )}

      {tooltip && !selectedBuilding && (
        <div style={{
          position: "fixed",
          zIndex: 30,
          background: "rgba(6,10,24,0.93)",
          border: "1px solid rgba(255,255,255,0.13)",
          borderRadius: 8,
          padding: "5px 12px",
          fontSize: 12,
          fontWeight: 600,
          color: "white",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: 6,
          left: tooltip.x + 14,
          top: tooltip.y - 36
        }}>
          {tooltip.name}
          <span style={{ color: "rgba(255,255,255,0.38)", fontWeight: 400, fontSize: 10 }}>{tooltip.type}</span>
        </div>
      )}

      <div style={{
        position: "absolute",
        bottom: 88,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        pointerEvents: "none"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: "rgba(6,10,24,0.72)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20,
          padding: "5px 16px",
          fontSize: 10,
          color: "rgba(255,255,255,0.4)",
          whiteSpace: "nowrap"
        }}>
          🖱 Drag orbit · Scroll zoom · Right-drag pan · Right-click coordinates ·
          <kbd style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 4, padding: "1px 5px", fontSize: 9, color: "rgba(255,255,255,0.7)" }}>F</kbd>Fly ·
          <kbd style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 4, padding: "1px 5px", fontSize: 9, color: "rgba(255,255,255,0.7)" }}>N</kbd>Night ·
          <kbd style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 4, padding: "1px 5px", fontSize: 9, color: "rgba(255,255,255,0.7)" }}>R</kbd>Reset
        </div>
      </div>

      <div style={{
        position: "absolute",
        bottom: 90,
        left: 126,
        zIndex: 10,
        fontSize: 10,
        fontWeight: 700,
        padding: "4px 11px",
        borderRadius: 20,
        background: isNight ? "rgba(30,40,100,0.35)" : "rgba(255,247,200,0.12)",
        border: isNight ? "1px solid rgba(56,189,248,0.25)" : "1px solid rgba(255,200,50,0.25)",
        color: isNight ? "#7dd3fc" : "#fcd34d"
      }}>
        {isNight ? "🌙 Night" : "☀️ Day"}
      </div>

      <div style={{
        position: "absolute",
        bottom: 90,
        left: 22,
        zIndex: 10,
        fontSize: 10,
        color: "rgba(255,255,255,0.18)",
        fontFamily: "monospace"
      }}>
        {fps} FPS
      </div>

      <CompassHUD bearing={bearing} />

      {/* ============================================================================
          CHATBOT INTEGRATION
        ============================================================================ */}
      <CampusChatbot 
        events={events} 
        onSelectEntity={handleChatbotSelect} 
        activeRole={userRole} 
      />

      {rightClickCoords && (
        <div style={{
          position: "absolute",
          bottom: 120,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(8,14,36,0.94)",
          border: "1px solid rgba(56,189,248,0.35)",
          borderRadius: 16,
          padding: "16px 20px",
          color: "white",
          zIndex: 100,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          backdropFilter: "blur(10px)",
          minWidth: 280,
          boxSizing: "border-box"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8", letterSpacing: "0.08em", textTransform: "uppercase" }}>🛰️ Geodetic Inspector</span>
            <button onClick={() => setRightClickCoords(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16, padding: 0 }}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: "monospace", fontSize: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Latitude:</span>
              <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{rightClickCoords.lat.toFixed(7)}° N</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Longitude:</span>
              <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{rightClickCoords.lng.toFixed(7)}° E</span>
            </div>
          </div>
          <button
            onClick={copyCoordinates}
            style={{
              width: "100%",
              background: "linear-gradient(135deg,#0284c7,#0369a1)",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              boxSizing: "border-box"
            }}
          >
            📋 Copy GPS Coordinates
          </button>
        </div>
      )}

      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}