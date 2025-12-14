import * as THREE from 'three';

export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Generate positions for the Tree shape
export const getTreePosition = (index: number, total: number) => {
  const y = randomRange(-4, 4); // Height
  const levelRadius = (1 - (y + 4) / 8) * 3.5; // Cone shape: radius decreases as Y increases
  const angle = randomRange(0, Math.PI * 2);
  const r = Math.sqrt(Math.random()) * levelRadius; // Uniform distribution in circle
  
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  return new THREE.Vector3(x, y, z);
};

// Generate positions for the Ribbon shape
export const getRibbonPosition = (t: number) => {
  // t is 0 to 1
  const height = -4 + t * 8;
  const revolutions = 3;
  const radius = ((1 - t) * 3.5) + 0.2; // Slightly wider than tree
  const angle = t * Math.PI * 2 * revolutions;
  
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  return new THREE.Vector3(x, height, z);
};

// Generate positions for the Explode/Chaos shape
export const getExplodePosition = () => {
  // Increased range to fill the screen
  const r = randomRange(8, 25);
  const theta = randomRange(0, Math.PI * 2);
  const phi = randomRange(0, Math.PI);
  
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};