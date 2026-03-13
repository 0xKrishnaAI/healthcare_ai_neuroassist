import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

const BrainViewer = ({ result, isProcessing }) => {
    const group = useRef();
    const [intensity, setIntensity] = useState(1);

    // Color Logic based on Diagnosis
    const getColor = () => {
        if (!result) return '#e2e8f0'; // Default Gray
        if (result.color === 'success') return '#28a745'; // Green
        if (result.color === 'warning') return '#ffc107'; // Yellow
        if (result.color === 'danger') return '#dc3545';  // Red
        return '#007bff';
    };

    // Animation Loop
    useFrame((state) => {
        const t = state.clock.getElapsedTime();

        // Auto-Rotate
        if (group.current) {
            group.current.rotation.y = t * 0.2;

            // Pulse Effect (Heartbeat) based on processing
            if (isProcessing) {
                const scale = 1 + Math.sin(t * 5) * 0.02;
                group.current.scale.set(scale, scale, scale);
                setIntensity(1.5 + Math.sin(t * 3));
            } else {
                group.current.scale.set(1, 1, 1);
                setIntensity(1);
            }
        }
    });

    // Procedural Brain Geometry (Since we don't have .gltf yet)
    // We construct a stylized mesh
    return (
        <group ref={group} dispose={null}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={intensity} color={getColor()} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4c1d95" />

            {/* Left Hemisphere */}
            <mesh position={[-0.6, 0, 0]} rotation={[0, 0, 0.2]}>
                <sphereGeometry args={[1.2, 32, 32]} />
                <meshPhysicalMaterial
                    color={getColor()}
                    roughness={0.2}
                    metalness={0.1}
                    transmission={0.6} // Glassy
                    thickness={0.5}
                    clearcoat={1}
                />
            </mesh>

            {/* Right Hemisphere */}
            <mesh position={[0.6, 0, 0]} rotation={[0, 0, -0.2]}>
                <sphereGeometry args={[1.2, 32, 32]} />
                <meshPhysicalMaterial
                    color={getColor()}
                    roughness={0.2}
                    metalness={0.1}
                    transmission={0.6}
                    thickness={0.5}
                    clearcoat={1}
                />
            </mesh>

            {/* Particles / Synapses */}
            <points>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={500}
                        array={new Float32Array(500 * 3).map(() => (Math.random() - 0.5) * 4)}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.05}
                    color={isProcessing ? "#007bff" : getColor()}
                    transparent opacity={0.6}
                />
            </points>

            {/* Loading / Status Label in 3D Space */}
            <Html position={[0, -2, 0]} center>
                <div className="bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-600 shadow-lg">
                    {isProcessing ? 'Analyzing...' : (result ? result.full : 'Waiting for Scan')}
                </div>
            </Html>
        </group>
    );
};

export default BrainViewer;
