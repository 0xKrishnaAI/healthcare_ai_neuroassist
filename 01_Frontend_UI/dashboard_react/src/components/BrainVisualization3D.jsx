import React, { useRef, useState, useEffect, useMemo, memo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

// Fallback procedural brain if GLB is missing or generic Box
const FallbackBrain = () => {
  const meshRef = useRef();
  
  const geo = useMemo(() => {
    const geometry = new THREE.IcosahedronGeometry(2.5, 8);
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);
        if (Math.abs(x) < 0.2) {
            y *= 0.8;
            z *= 0.8;
        }
        pos.setXYZ(i, x * 0.9, y, z * 1.1);
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  useFrame(() => {
    if(meshRef.current) meshRef.current.rotation.y += 0.002;
  });

  return (
    <mesh ref={meshRef} geometry={geo}>
      <meshPhysicalMaterial 
        color="#0a192f"
        emissive="#0044ff"
        emissiveIntensity={0.2}
        roughness={0.2}
        metalness={0.8}
        clearcoat={1.0}
        transparent={true}
        opacity={0.8}
      />
    </mesh>
  );
};

class GLTFErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const GLTFBrain = () => {
  const group = useRef();
  const gltf = useGLTF('/models/brain.glb');

  useFrame(() => {
    if (group.current) {
      group.current.rotation.y += 0.002;
    }
  });

  useEffect(() => {
    if (gltf.scene) {
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshPhysicalMaterial({
                    color: new THREE.Color('#0a192f'),
                    emissive: new THREE.Color('#0044ff'),
                    emissiveIntensity: 0.2,
                    roughness: 0.2,
                    metalness: 0.8,
                    clearcoat: 1.0,
                    transparent: true,
                    opacity: 0.8,
                    side: THREE.DoubleSide
                });
            }
        });
    }
  }, [gltf]);

  if (!gltf.scene) return null;

  return <primitive ref={group} object={gltf.scene} scale={[1.5, 1.5, 1.5]} position={[0,0,0]} />;
};


const BrainScene = ({ brainRegions, isLoading }) => {
  const [hasModel, setHasModel] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch('/models/brain.glb', { method: 'HEAD' })
      .then(res => {
        const type = res.headers.get('content-type') || '';
        if (res.ok && !type.includes('text/html')) {
          setHasModel(true);
        }
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, []);

  if (!checked) return null;

  return (
    <>
      <ambientLight intensity={0.5} color="#00e5ff" />
      <pointLight position={[5, 5, 5]} intensity={2} color="#00e5ff" />
      <pointLight position={[-5, -5, -5]} intensity={1} color="#a855f7" />
      
      {hasModel ? (
        <GLTFErrorBoundary fallback={<FallbackBrain />}>
          <Suspense fallback={<FallbackBrain />}>
            <GLTFBrain />
          </Suspense>
        </GLTFErrorBoundary>
      ) : (
        <FallbackBrain />
      )}

      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        enableRotate={true}
        autoRotate={false}
      />
    </>
  );
};

const BrainVisualization3D = ({ brainRegions = {}, diagnosis = null, isLoading = false }) => {
  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#020508] via-[#050d1a] to-[#0a192f] border border-white/5 shadow-2xl">
      <Canvas 
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 7], fov: 45 }}
      >
        <BrainScene brainRegions={brainRegions} isLoading={isLoading} />
      </Canvas>

      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
           <div className="text-cyan-400 text-sm font-black tracking-[0.3em] uppercase bg-black/40 border border-cyan-500/30 px-8 py-3 rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(0,198,255,0.2)] flex items-center gap-3 animate-pulse">
             <div className="w-2 h-2 rounded-full bg-cyan-400" />
             Decrypting Neural Architecture...
           </div>
        </div>
      )}
    </div>
  );
};

export default memo(BrainVisualization3D);
