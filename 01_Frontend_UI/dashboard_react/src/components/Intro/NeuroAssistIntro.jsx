import React, { useRef, useEffect, useState, useMemo, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const NeuralParticles = ({ isReady, onPhaseComplete }) => {
  const pointsRef = useRef();
  const count = 4000;
  
  const [brainGeometry, setBrainGeometry] = useState(null);

  // Load Brain Geometry natively to prevent Suspense/Error-Boundary SPA crash loops
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      '/models/brain.glb',
      (gltf) => {
        let geo = null;
        gltf.scene.traverse((node) => {
          if (node.isMesh && !geo) {
            geo = node.geometry;
            if (!geo.boundingBox) geo.computeBoundingBox();
            const center = new THREE.Vector3();
            geo.boundingBox.getCenter(center);
            geo.translate(-center.x, -center.y, -center.z); // center the brain
          }
        });
        setBrainGeometry(geo || 'fallback');
      },
      undefined,
      (error) => {
        console.warn('NeuroAssistIntro: fallback to procedural brain.', error);
        setBrainGeometry('fallback');
      }
    );
  }, []);

  const targetPositions = useMemo(() => {
    const targets = new Float32Array(count * 3);
    
    if (brainGeometry && brainGeometry !== 'fallback') {
      const positions = brainGeometry.attributes.position.array;
      const posCount = positions.length / 3;
      
      for (let i = 0; i < count; i++) {
          const vi = (i % posCount) * 3;
          // Scale 1.5 to match the visual presence of a brain
          targets[i * 3]     = positions[vi] * 1.5;
          targets[i * 3 + 1] = positions[vi + 1] * 1.5;
          targets[i * 3 + 2] = positions[vi + 2] * 1.5;
      }
    } else {
      // Procedural fallback
      const geo = new THREE.IcosahedronGeometry(2.5, 9);
      const pos = geo.attributes.position;
      const maxCount = pos.count;
      for (let i = 0; i < count; i++) {
          const vi = i % maxCount;
          let x = pos.getX(vi);
          let y = pos.getY(vi);
          let z = pos.getZ(vi);
          if (Math.abs(x) < 0.2) { y *= 0.8; z *= 0.8; }
          targets[i * 3] = x * 0.9;
          targets[i * 3 + 1] = y;
          targets[i * 3 + 2] = z * 1.1;
      }
    }
    return targets;
  }, [brainGeometry]);

  const initialData = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return pos;
  }, []);

  useEffect(() => {
    if (!isReady || !brainGeometry) return;

    const points = pointsRef.current;
    if (!points) return;

    const geo = points.geometry;
    const posAttr = geo.attributes.position;
    const dummy = { convergence: 0, swirl: 0, opacity: 0.8 };

    const tl = gsap.timeline({
      onComplete: onPhaseComplete
    });

    // 1. & 2. Particles merge together
    tl.to(dummy, {
      convergence: 1,
      swirl: 8,
      duration: 3.5,
      ease: "power3.inOut",
      onUpdate: () => {
        const arr = posAttr.array;
        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          
          const tx = targetPositions[i3];
          const ty = targetPositions[i3 + 1];
          const tz = targetPositions[i3 + 2];

          const ix = initialData[i3];
          const iy = initialData[i3 + 1];
          const iz = initialData[i3 + 2];

          const angle = dummy.swirl * (1 - dummy.convergence) * (i / count) * Math.PI * 2;
          const radius = (1 - dummy.convergence) * 12;
          
          const sx = Math.cos(angle) * radius;
          const sz = Math.sin(angle) * radius;

          // 3. Form glowing 3D brain
          arr[i3] = THREE.MathUtils.lerp(ix + sx, tx, dummy.convergence);
          arr[i3 + 1] = THREE.MathUtils.lerp(iy, ty, dummy.convergence);
          arr[i3 + 2] = THREE.MathUtils.lerp(iz + sz, tz, dummy.convergence);
        }
        posAttr.needsUpdate = true;
      }
    });

    // Add pulsing effect
    tl.to(points.material, { size: 0.12, duration: 0.5, yoyo: true, repeat: 1 }, 4);
    
    // 5. Brain dissolves
    tl.to(dummy, {
      convergence: 0,
      opacity: 0,
      duration: 1.5,
      ease: "power2.in",
      onUpdate: () => {
         const arr = posAttr.array;
         for (let i = 0; i < count * 3; i++) {
            arr[i] *= 1.05; // explode outward
         }
         posAttr.needsUpdate = true;
         points.material.opacity = dummy.opacity;
      }
    }, 5);

    return () => {
        tl.kill();
    };
  }, [isReady, onPhaseComplete, targetPositions, initialData, brainGeometry]);

  // 4. Brain rotates slowly
  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.002;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry attach="geometry">
        <bufferAttribute 
          attach="attributes-position" 
          count={count} 
          array={new Float32Array(initialData)} 
          itemSize={3} 
        />
      </bufferGeometry>
      <pointsMaterial 
        attach="material"
        size={0.06} 
        color="#00e5ff" 
        transparent 
        sizeAttenuation 
        blending={THREE.AdditiveBlending} 
      />
    </points>
  );
};

const NeuroAssistIntro = ({ onIntroComplete }) => {
  const [isReady, setIsReady] = useState(false);
  const [showText, setShowText] = useState(false);
  const containerRef = useRef();

  const handleSequenceFinish = useMemo(() => () => {
    // 6. NeuroAssist logo appears
    setShowText(true);
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 1,
      delay: 1.5,
      onComplete: onIntroComplete // 7. Main app loads
    });
  }, [onIntroComplete]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100000] bg-[#05070a] flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <Canvas 
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
          onCreated={() => setIsReady(true)}
          dpr={[1, 2]}
        >
          <PerspectiveCamera makeDefault position={[0, 0, 10]} />
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={2} color="#00e5ff" />
          
          {/* 1. Star sky */}
          <Stars radius={100} depth={50} count={500} factor={4} saturation={0} fade speed={1} />

          <NeuralParticles isReady={isReady} onPhaseComplete={handleSequenceFinish} />
        </Canvas>
      </div>

      {showText && (
        <div className="relative z-10 text-center px-4 animate-reveal-logo will-change-transform">
          <h1 className="text-6xl md:text-9xl font-black mb-4 tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-slate-400 drop-shadow-[0_0_20px_rgba(0,229,255,0.4)] uppercase">
            NeuroAssist
          </h1>
          <p className="text-xl md:text-3xl font-light tracking-[1em] text-cyan-300 uppercase opacity-80">
            by Clinical Node
          </p>
        </div>
      )}

      <style>{`
        @keyframes revealLogo {
          0% { opacity: 0; transform: scale(0.9); filter: blur(20px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0px); }
        }
        .animate-reveal-logo {
          animation: revealLogo 1.2s forwards cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default memo(NeuroAssistIntro);
