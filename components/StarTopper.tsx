import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { Sparkles } from '@react-three/drei';

// Pre-create glow texture to avoid recreation on re-renders
const glowTexture = (() => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(canvas);
})();

export const StarTopper: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { mode } = useStore();

  // Custom Star Shape
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    // Reduced size as requested
    const outerRadius = 0.6; 
    const innerRadius = 0.25;
    
    // Start from top point to align better visually
    for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2; // -90deg offset to point up in 2D
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  const extrudeSettings = useMemo(() => ({
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2
  }), []);

  useFrame((state, delta) => {
    if (!groupRef.current || !meshRef.current) return;

    const time = state.clock.elapsedTime;
    
    // Vertical bobbing
    groupRef.current.position.y = 4.3 + Math.sin(time * 1.5) * 0.15;
    
    // Mode Scaling (Tree vs Explode)
    const targetScale = mode === 'tree' ? 1 : 0.01;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 3);

    // Rotation: Slow spin on Y axis, facing front (Z) primarily
    meshRef.current.rotation.y = time * 0.5;
  });

  return (
    <group ref={groupRef} position={[0, 4.3, 0]}>
      {/* 3D Star Mesh */}
      <mesh ref={meshRef}>
        <extrudeGeometry args={[starShape, extrudeSettings]} />
        <meshStandardMaterial 
          color="#FFFFFF"
          emissive="#FFFFFF"
          emissiveIntensity={2.0}
          roughness={0.1}
          metalness={1.0}
          toneMapped={false}
        />
      </mesh>
      
      {/* Halo Glow Sprite - Always faces camera */}
      {glowTexture && (
        <sprite scale={[3.5, 3.5, 1]} position={[0, 0, 0]}>
          <spriteMaterial 
            map={glowTexture} 
            transparent 
            opacity={0.8} 
            blending={THREE.AdditiveBlending} 
            depthWrite={false}
          />
        </sprite>
      )}

      {/* Light Source */}
      <pointLight color="#FFFFFF" intensity={8} distance={10} decay={1.5} />

      {/* Dynamic Particles */}
      <Sparkles 
        count={60} 
        scale={2.0} 
        size={4} 
        speed={0.6} 
        opacity={0.8} 
        color="#FFFFFF"
      />
    </group>
  );
};