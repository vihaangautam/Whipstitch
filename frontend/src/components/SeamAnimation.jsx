import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function SeamAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous canvas
    container.innerHTML = '';

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 550;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6.8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Main Earth Globe Group
    const globeGroup = new THREE.Group();
    // Slightly tilt Earth on axial tilt (~23.5 degrees)
    globeGroup.rotation.z = 0.35;
    scene.add(globeGroup);

    const GLOBE_RADIUS = 2.4;
    const NUM_MERIDIANS = 32;
    const POINTS_PER_MERIDIAN = 120;

    const meridians = [];

    // 1. Create Meridian Longitude Lines (Vertical Ribbons constrained to perfect sphere)
    for (let i = 0; i < NUM_MERIDIANS; i++) {
      const basePhi = (i / NUM_MERIDIANS) * Math.PI * 2;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(POINTS_PER_MERIDIAN * 3);

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // Crisp white line material
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        linewidth: 1.2,
      });

      const line = new THREE.Line(geometry, material);
      globeGroup.add(line);

      meridians.push({ line, basePhi, geometry, positions });
    }

    // 2. Create Latitude Parallel Rings (Horizontal circles across the Earth sphere)
    const NUM_PARALLELS = 16;
    const parallels = [];

    for (let j = 1; j < NUM_PARALLELS; j++) {
      const theta = (j / NUM_PARALLELS) * Math.PI; // theta from 0 (North Pole) to PI (South Pole)
      const ringPoints = 100;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(ringPoints * 3);

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const isEquator = j === Math.floor(NUM_PARALLELS / 2);
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: isEquator ? 0.6 : 0.3,
        linewidth: isEquator ? 1.5 : 1,
      });

      const ring = new THREE.LineLoop(geometry, material);
      globeGroup.add(ring);

      parallels.push({ ring, theta, geometry, positions, points: ringPoints });
    }

    // 3. Mouse Interaction (Tilt & Rotate on hover)
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;

      targetRotationY = (x / rect.width) * 0.5;
      targetRotationX = (y / rect.height) * 0.5;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animId;
    let time = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.015;

      // Update Meridians (Wave motion remains strictly ON the spherical surface radius = GLOBE_RADIUS)
      meridians.forEach(({ basePhi, geometry, positions }) => {
        for (let k = 0; k < POINTS_PER_MERIDIAN; k++) {
          const theta = (k / (POINTS_PER_MERIDIAN - 1)) * Math.PI;

          // Surface wave: alter phi along theta so the curve stays a PERFECT SPHERE
          const phiWave = Math.sin(theta * 5 + time * 1.5 + basePhi * 2) * 0.08;
          const phi = basePhi + phiWave;

          // Exact spherical coordinates
          const x = GLOBE_RADIUS * Math.sin(theta) * Math.cos(phi);
          const y = GLOBE_RADIUS * Math.cos(theta);
          const z = GLOBE_RADIUS * Math.sin(theta) * Math.sin(phi);

          positions[k * 3] = x;
          positions[k * 3 + 1] = y;
          positions[k * 3 + 2] = z;
        }
        geometry.attributes.position.needsUpdate = true;
      });

      // Update Parallels (Horizontal latitude rings on exact sphere)
      parallels.forEach(({ theta, geometry, positions, points }) => {
        for (let p = 0; p < points; p++) {
          const basePhi = (p / points) * Math.PI * 2;
          const thetaWave = Math.sin(basePhi * 4 + time * 1.2 + theta * 3) * 0.02;
          const currentTheta = Math.max(0.01, Math.min(Math.PI - 0.01, theta + thetaWave));

          const x = GLOBE_RADIUS * Math.sin(currentTheta) * Math.cos(basePhi);
          const y = GLOBE_RADIUS * Math.cos(currentTheta);
          const z = GLOBE_RADIUS * Math.sin(currentTheta) * Math.sin(basePhi);

          positions[p * 3] = x;
          positions[p * 3 + 1] = y;
          positions[p * 3 + 2] = z;
        }
        geometry.attributes.position.needsUpdate = true;
      });

      // Smooth revolving Earth Y rotation
      globeGroup.rotation.y += 0.0035;

      // Smooth inertia dampening for mouse movement
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 550;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer && renderer.domElement) {
        renderer.domElement.remove();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[450px] md:h-[550px] relative flex items-center justify-center cursor-grab active:cursor-grabbing"
    ></div>
  );
}
