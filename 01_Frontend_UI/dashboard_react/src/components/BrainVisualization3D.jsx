import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

/**
 * BrainVisualization3D
 * ====================
 * 3D interactive brain built entirely from THREE.js primitives.
 * No external .glb/.obj models needed.
 *
 * Props:
 *   brainRegions  - { hippocampus: 0.92, ... } from API
 *   diagnosis     - "CN" | "MCI" | "AD"
 *   isLoading     - boolean
 */

const REGION_POSITIONS = {
  hippocampus:       [[-1.2, -0.3, 0.2], [1.2, -0.3, 0.2]],
  entorhinal_cortex: [[-1.4, -0.5, 0.5], [1.4, -0.5, 0.5]],
  temporal_lobe:     [[-2.0, -0.2, 0.0], [2.0, -0.2, 0.0]],
  parietal_cortex:   [[0.0, 1.8, -0.5]],
  frontal_lobe:      [[0.0, 0.5, 2.2]],
  cerebellum:        [[0.0, -1.8, -1.5]],
};

const REGION_LABELS = {
  hippocampus: 'Hippocampus',
  entorhinal_cortex: 'Entorhinal Cortex',
  temporal_lobe: 'Temporal Lobe',
  parietal_cortex: 'Parietal Cortex',
  frontal_lobe: 'Frontal Lobe',
  cerebellum: 'Cerebellum',
};

function getHotspotColor(score) {
  if (score > 0.8) return 0xFF2020;
  if (score > 0.6) return 0xFF6600;
  if (score > 0.4) return 0xFFAA00;
  if (score > 0.2) return 0xFFFF00;
  return 0x00FF88;
}

function getStatusText(score) {
  if (score > 0.7) return { text: '⚠ ATROPHY DETECTED', color: '#FF5E5E' };
  if (score > 0.4) return { text: '⚡ Changes Detected', color: '#FFD166' };
  return { text: '✓ Normal', color: '#00E5A0' };
}

export default function BrainVisualization3D({ brainRegions = {}, diagnosis = null, isLoading = false }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const hotspotMeshes = useRef([]);
  const animFrameRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0, y: 0 });
  const autoRotateSpeed = useRef(0.003);

  const buildBrain = useCallback((scene) => {
    // Clear old meshes
    while (scene.children.length > 0) scene.remove(scene.children[0]);
    hotspotMeshes.current = [];

    // --- LIGHTING ---
    const ambient = new THREE.AmbientLight(0x223355, 1.2); // Brighter ambient
    scene.add(ambient);

    const cyanLight = new THREE.PointLight(0x00E5FF, 1.8, 30); // More intense
    cyanLight.position.set(5, 5, 5);
    scene.add(cyanLight);

    const purpleLight = new THREE.PointLight(0x9B4FDE, 1.2, 30);
    purpleLight.position.set(-5, -3, 2);
    scene.add(purpleLight);

    const warmLight = new THREE.PointLight(0xFFBB66, 0.8, 25);
    warmLight.position.set(0, 3, -5);
    scene.add(warmLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8); // Front highlight
    dirLight.position.set(0, 5, 10);
    scene.add(dirLight);

    // --- BRAIN MATERIAL ---
    const brainMat = new THREE.MeshPhongMaterial({
      color: 0x2a5282, // Brighter base brain color
      transparent: true,
      opacity: 0.85,
      shininess: 45,
      specular: 0x5588cc, // Lighter specular
    });

    // --- LEFT HEMISPHERE ---
    const leftGeo = new THREE.SphereGeometry(2.2, 32, 32);
    const leftHemi = new THREE.Mesh(leftGeo, brainMat.clone());
    leftHemi.position.set(-0.3, 0, 0);
    leftHemi.scale.set(0.85, 0.85, 1.1);
    scene.add(leftHemi);

    // --- RIGHT HEMISPHERE ---
    const rightGeo = new THREE.SphereGeometry(2.2, 32, 32);
    const rightHemi = new THREE.Mesh(rightGeo, brainMat.clone());
    rightHemi.position.set(0.3, 0, 0);
    rightHemi.scale.set(0.85, 0.85, 1.1);
    scene.add(rightHemi);

    // --- FISSURE LINE (central sulcus) ---
    const fissureGeo = new THREE.BoxGeometry(0.05, 4.0, 5.0);
    const fissureMat = new THREE.MeshBasicMaterial({ color: 0x0a1628, transparent: true, opacity: 0.4 });
    const fissure = new THREE.Mesh(fissureGeo, fissureMat);
    fissure.position.set(0, 0, 0);
    scene.add(fissure);

    // --- BRAIN STEM ---
    const stemGeo = new THREE.CylinderGeometry(0.5, 0.35, 1.8, 16);
    const stemMat = new THREE.MeshPhongMaterial({ color: 0x152e4a, shininess: 20 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(0, -2.2, -0.8);
    scene.add(stem);

    // --- CEREBELLUM ---
    const cerebGeo = new THREE.SphereGeometry(1.2, 24, 24);
    const cerebMat = new THREE.MeshPhongMaterial({ color: 0x1a3a5c, shininess: 20 });
    const cereb = new THREE.Mesh(cerebGeo, cerebMat);
    cereb.position.set(0, -1.8, -1.5);
    cereb.scale.set(1.3, 0.7, 0.9);
    scene.add(cereb);

    // --- HOTSPOT REGIONS ---
    const hasResults = Object.keys(brainRegions).length > 0;

    if (hasResults && !isLoading) {
      for (const [regionName, positions] of Object.entries(REGION_POSITIONS)) {
        const score = brainRegions[regionName] || 0;
        if (score < 0.05) continue;

        const color = getHotspotColor(score);
        const radius = 0.25 + score * 0.55;

        for (const pos of positions) {
          const geo = new THREE.SphereGeometry(radius, 16, 16);
          const mat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.65 + score * 0.25,
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(pos[0], pos[1], pos[2]);
          mesh.userData = { regionName, score, label: REGION_LABELS[regionName] || regionName };
          scene.add(mesh);
          hotspotMeshes.current.push(mesh);

          // Glow sphere (outer)
          const glowGeo = new THREE.SphereGeometry(radius * 1.5, 16, 16);
          const glowMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.12,
          });
          const glow = new THREE.Mesh(glowGeo, glowMat);
          glow.position.copy(mesh.position);
          scene.add(glow);
        }
      }
    }

    // Loading state: scanning rings
    if (isLoading) {
      const ringGeo = new THREE.TorusGeometry(3.0, 0.04, 8, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00C6FF, transparent: true, opacity: 0.6 });
      const ring1 = new THREE.Mesh(ringGeo, ringMat);
      ring1.userData.isRing = true;
      scene.add(ring1);

      const ring2Geo = new THREE.TorusGeometry(3.3, 0.03, 8, 64);
      const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x7B2FBE, transparent: true, opacity: 0.4 });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.rotation.x = Math.PI / 3;
      ring2.userData.isRing = true;
      scene.add(ring2);
    }
  }, [brainRegions, isLoading]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5); // Bring camera slightly closer
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Build brain
    buildBrain(scene);

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // Animation loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Auto-rotate
      if (!isDragging.current) {
        rotation.current.y += autoRotateSpeed.current;
      }

      scene.rotation.y = rotation.current.y;
      scene.rotation.x = rotation.current.x;

      // Pulse hotspots
      hotspotMeshes.current.forEach((mesh) => {
        const score = mesh.userData.score || 0;
        const pulseSpeed = 2 + score * 3;
        const pulseAmt = 0.06 * score;
        mesh.scale.setScalar(1 + Math.sin(t * pulseSpeed) * pulseAmt);
      });

      // Spin loading rings
      scene.children.forEach(child => {
        if (child.userData?.isRing) {
          child.rotation.z = t * 1.5;
        }
      });

      // Raycast for tooltip
      pointer.x = (mouseRef.current.x / width) * 2 - 1;
      pointer.y = -(mouseRef.current.y / height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(hotspotMeshes.current);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const { label, score } = hit.userData;
        const status = getStatusText(score);
        setTooltip({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          label,
          score: (score * 100).toFixed(1),
          status: status.text,
          statusColor: status.color,
        });
      } else {
        setTooltip(null);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Mouse events
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;

      if (isDragging.current) {
        const dx = e.clientX - prevMouse.current.x;
        const dy = e.clientY - prevMouse.current.y;
        rotation.current.y += dx * 0.005;
        rotation.current.x += dy * 0.005;
        rotation.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotation.current.x));
        prevMouse.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseDown = (e) => {
      isDragging.current = true;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // Resize
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [buildBrain]);

  // Rebuild hotspots when regions change
  useEffect(() => {
    if (sceneRef.current) {
      buildBrain(sceneRef.current);
    }
  }, [brainRegions, isLoading, buildBrain]);


  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '500px', borderRadius: '16px', overflow: 'hidden', background: 'radial-gradient(ellipse at center, #0d2044 0%, #040d1a 100%)' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: isDragging.current ? 'grabbing' : 'grab' }} />

      {/* Center overlay text */}
      {isLoading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 10 }}>
          <div style={{ color: '#00C6FF', fontSize: '18px', fontWeight: 700, textShadow: '0 0 20px rgba(0,198,255,0.5)', animation: 'pulse 2s infinite' }}>
            Analyzing MRI data...
          </div>
          <div style={{ color: '#7EB8D8', fontSize: '13px', marginTop: '8px' }}>Powered by MedicalNet ResNet-10</div>
        </div>
      )}

      {!isLoading && !diagnosis && Object.keys(brainRegions).length === 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 10 }}>
          <div style={{ color: '#7EB8D8', fontSize: '16px', fontWeight: 600 }}>Upload a scan to begin neural analysis</div>
          <div style={{ color: '#3a5c80', fontSize: '13px', marginTop: '8px' }}>Powered by MedicalNet ResNet-10</div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: Math.min(tooltip.x + 12, (mountRef.current?.clientWidth || 400) - 220),
          top: Math.max(tooltip.y - 80, 10),
          background: 'rgba(5,15,35,0.95)',
          border: '1px solid #00C6FF',
          borderRadius: '8px',
          padding: '12px 16px',
          pointerEvents: 'none',
          zIndex: 20,
          minWidth: '180px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ color: '#E8F4FD', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{tooltip.label}</div>
          <div style={{ color: '#7EB8D8', fontSize: '12px' }}>Attention: {tooltip.score}%</div>
          <div style={{ color: tooltip.statusColor, fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>{tooltip.status}</div>
        </div>
      )}

      {/* Legend */}
      {Object.keys(brainRegions).length > 0 && !isLoading && (
        <div style={{
          position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '16px', padding: '6px 16px', borderRadius: '20px',
          background: 'rgba(5,15,35,0.85)', border: '1px solid rgba(0,198,255,0.15)',
          fontSize: '11px', color: '#7EB8D8', zIndex: 10,
        }}>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#FF2020', marginRight: 4 }} /> Severe (&gt;80%)</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#FFAA00', marginRight: 4 }} /> Moderate (40-80%)</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#00FF88', marginRight: 4 }} /> Normal (&lt;40%)</span>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
