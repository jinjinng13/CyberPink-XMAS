import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { OrbitControls, Environment } from '@react-three/drei';
import { MagicTree } from './components/MagicTree';
import { StarTopper } from './components/StarTopper';
import { GestureController } from './components/GestureController';
import { useStore } from './store';

const SceneContent = () => {
  return (
    <>
      <color attach="background" args={['#050103']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.2} color="#553344" />
      <pointLight position={[5, 5, 5]} intensity={10} color="#FFD1DC" />
      <pointLight position={[-5, 5, -5]} intensity={10} color="#E6E6FA" />
      <spotLight 
        position={[0, 10, 0]} 
        intensity={20} 
        angle={0.5} 
        penumbra={1} 
        color="#FF69B4" 
      />
      
      {/* Components - Raised position */}
      <group position={[0, 0, 0]}>
        <MagicTree />
        <StarTopper />
      </group>

      {/* Environment for reflections */}
      <Environment preset="night" />

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
      </EffectComposer>
    </>
  );
};

const UIOverlay = () => {
  const { mode, toggleMode, isHandDetected } = useStore();
  
  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-white drop-shadow-[0_0_10px_rgba(255,105,180,0.8)] tracking-tighter">
          CYBER<span className="text-[#FF69B4]">PINK</span> XMAS
        </h1>
        <p className="text-pink-200/60 font-mono text-sm uppercase tracking-widest max-w-md">
          Gesture Controlled // 7500 Entities
        </p>
      </header>

      <div className="flex flex-col gap-4 items-start pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-pink-500/30 text-pink-100 text-xs font-mono space-y-2 max-w-xs">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            STATUS: <span className="text-white font-bold">{mode.toUpperCase()}</span>
          </p>
          <div className="h-px bg-pink-500/30 w-full" />
          <p>✋ <span className="text-pink-300">OPEN PALM</span> → EXPLODE</p>
          <p>✊ <span className="text-pink-300">PINCH/FIST</span> → TREE</p>
          <p>👋 <span className="text-pink-300">MOVE HAND</span> → ROTATE</p>
          {isHandDetected && <p className="text-green-400 mt-2">AI TRACKING ACTIVE</p>}
        </div>

        <button 
          onClick={toggleMode}
          className="bg-[#FF69B4]/20 hover:bg-[#FF69B4]/40 text-pink-100 border border-[#FF69B4] px-6 py-2 rounded-full font-mono text-sm transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_20px_#FF69B4]"
        >
          TOGGLE MODE (CLICK)
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const { toggleMode } = useStore();

  return (
    <div className="relative w-full h-screen bg-[#050103]">
      <UIOverlay />
      <GestureController />
      
      <Canvas 
        camera={{ position: [0, 0, 12], fov: 45 }}
        dpr={[1, 2]} // Optimize pixel ratio
        gl={{ antialias: false, toneMappingExposure: 1.5 }}
        onClick={toggleMode}
      >
        <Suspense fallback={null}>
          <SceneContent />
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}