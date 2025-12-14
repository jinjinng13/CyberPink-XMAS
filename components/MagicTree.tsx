import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { getTreePosition, getRibbonPosition, getExplodePosition, randomRange } from '../utils/math';

// Colors configuration - STRICTLY PINK AND WHITE
const LEAF_COLORS = ['#FFFFFF', '#FFB7C5', '#FF69B4', '#FF1493']; // White, Light Pink, Hot Pink, Deep Pink
const DECOR_COLORS = ['#FFFFFF', '#FFE4E1']; // White, Misty Rose

// Counts
const PARTICLE_COUNT = 7500;
const RIBBON_COUNT = 600;
const DECOR_CUBE_COUNT = 300;
const DECOR_ICO_COUNT = 300;
const LEAF_COUNT = PARTICLE_COUNT - RIBBON_COUNT - DECOR_CUBE_COUNT - DECOR_ICO_COUNT;

// Index Ranges
const RIBBON_END = RIBBON_COUNT;
const CUBE_END = RIBBON_END + DECOR_CUBE_COUNT;
const ICO_END = CUBE_END + DECOR_ICO_COUNT;

interface ParticleData {
  targetTree: THREE.Vector3;
  targetExplode: THREE.Vector3;
  currentPos: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  scale: number;
}

export const MagicTree: React.FC = () => {
  // Separate meshes for different geometries
  const ribbonRef = useRef<THREE.InstancedMesh>(null);
  const cubeRef = useRef<THREE.InstancedMesh>(null);
  const icoRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  
  const { mode, handRotation } = useStore();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-calculate positions and data
  const particles = useMemo(() => {
    const data: ParticleData[] = [];
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let treePos: THREE.Vector3;
      let scale = 1;

      if (i < RIBBON_END) {
        // Ribbon: Tiny Tetrahedrons
        scale = 0.06;
        treePos = getRibbonPosition(i / RIBBON_COUNT);
      } else if (i < CUBE_END) {
        // Decor: Cubes
        scale = randomRange(0.12, 0.22);
        treePos = getTreePosition(i, PARTICLE_COUNT);
      } else if (i < ICO_END) {
        // Decor: Icosahedrons
        scale = randomRange(0.12, 0.22);
        treePos = getTreePosition(i, PARTICLE_COUNT);
      } else {
        // Leaves: Octahedrons
        scale = randomRange(0.04, 0.10);
        treePos = getTreePosition(i, PARTICLE_COUNT);
      }

      data.push({
        targetTree: treePos,
        targetExplode: getExplodePosition(),
        currentPos: treePos.clone(),
        rotationSpeed: new THREE.Vector3(
          Math.random() * 0.02, 
          Math.random() * 0.02, 
          Math.random() * 0.02
        ),
        scale,
      });
    }
    return data;
  }, []);

  // Initialize Colors
  useEffect(() => {
    const applyColors = (mesh: THREE.InstancedMesh | null, count: number, palette: string[], isSolid: boolean = false) => {
      if (!mesh) return;
      const c = new THREE.Color();
      for (let i = 0; i < count; i++) {
        if (isSolid) {
          c.set(palette[0]);
        } else {
          c.set(palette[Math.floor(Math.random() * palette.length)]);
          // Subtle variation
          if (!isSolid) c.offsetHSL(0, 0, randomRange(-0.02, 0.02));
        }
        mesh.setColorAt(i, c);
      }
      mesh.instanceColor!.needsUpdate = true;
    };

    applyColors(ribbonRef.current, RIBBON_COUNT, ['#FFFFFF'], true);
    applyColors(cubeRef.current, DECOR_CUBE_COUNT, DECOR_COLORS);
    applyColors(icoRef.current, DECOR_ICO_COUNT, DECOR_COLORS);
    applyColors(leafRef.current, LEAF_COUNT, LEAF_COLORS);
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const isTreeMode = mode === 'tree';
    
    // Global Rotation logic (Tree auto-spin + Hand control)
    const rotSpeed = delta * 0.1 + (handRotation * delta * 2);
    
    [ribbonRef, cubeRef, icoRef, leafRef].forEach(ref => {
      if (ref.current) ref.current.rotation.y += rotSpeed;
    });

    // Update individual particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const target = isTreeMode ? p.targetTree : p.targetExplode;
      
      const lerpSpeed = isTreeMode ? 2.5 * delta : 1.5 * delta;
      p.currentPos.lerp(target, lerpSpeed);

      dummy.position.copy(p.currentPos);
      
      // Individual rotation
      dummy.rotation.x += p.rotationSpeed.x;
      dummy.rotation.y += p.rotationSpeed.y;
      dummy.rotation.z += p.rotationSpeed.z;
      
      // Breathing scale effect
      const breathe = Math.sin(time * 2 + i) * 0.1 + 1;
      dummy.scale.setScalar(p.scale * breathe);

      dummy.updateMatrix();
      
      // Route to correct InstancedMesh
      if (i < RIBBON_END) {
        ribbonRef.current!.setMatrixAt(i, dummy.matrix);
      } else if (i < CUBE_END) {
        cubeRef.current!.setMatrixAt(i - RIBBON_END, dummy.matrix);
      } else if (i < ICO_END) {
        icoRef.current!.setMatrixAt(i - CUBE_END, dummy.matrix);
      } else {
        leafRef.current!.setMatrixAt(i - ICO_END, dummy.matrix);
      }
    }
    
    // Mark updates
    if (ribbonRef.current) ribbonRef.current.instanceMatrix.needsUpdate = true;
    if (cubeRef.current) cubeRef.current.instanceMatrix.needsUpdate = true;
    if (icoRef.current) icoRef.current.instanceMatrix.needsUpdate = true;
    if (leafRef.current) leafRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Ribbon: White Tetrahedrons - GLOWING WHITE */}
      <instancedMesh ref={ribbonRef} args={[undefined, undefined, RIBBON_COUNT]}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
          color="#FFFFFF" 
          emissive="#FFFFFF" 
          emissiveIntensity={1.0}
          roughness={0.1}
          metalness={0.0}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Decor 1: Shiny White/Pink Cubes - GLOWING */}
      <instancedMesh ref={cubeRef} args={[undefined, undefined, DECOR_CUBE_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#FFFFFF"
          emissive="#FFC0CB" 
          emissiveIntensity={0.2}
          roughness={0.05} 
          metalness={0.0} 
          envMapIntensity={2}
          toneMapped={false} 
        />
      </instancedMesh>

      {/* Decor 2: Shiny White/Pink Icosahedrons - GLOWING */}
      <instancedMesh ref={icoRef} args={[undefined, undefined, DECOR_ICO_COUNT]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
          color="#FFFFFF"
          emissive="#FFC0CB" 
          emissiveIntensity={0.2}
          roughness={0.05} 
          metalness={0.0} 
          envMapIntensity={2}
          toneMapped={false} 
        />
      </instancedMesh>

      {/* Leaves: SHINY PINK/WHITE ONLY - NO GREY */}
      <instancedMesh ref={leafRef} args={[undefined, undefined, LEAF_COUNT]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
          color="#FFFFFF"
          emissive="#FF69B4"
          emissiveIntensity={0.25}
          roughness={0.05} 
          metalness={0.0} 
          envMapIntensity={2.0}
          toneMapped={false} 
        />
      </instancedMesh>
    </group>
  );
};