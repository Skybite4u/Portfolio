import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeMesh() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 300;
    let height = container.clientHeight || 300;

    // WebGL support check
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (e) {
      console.warn('WebGL not supported, falling back to 2D geometric display');
    }

    if (!renderer) {
      // Create a beautiful standard CSS/SVG fallback of a glowing rotating wireframe
      container.innerHTML = `
        <div class="w-full h-full flex items-center justify-center relative">
          <div class="absolute w-44 h-44 border-2 border-dashed border-cyan-500/30 rounded-full animate-[spin_20s_linear_infinite]"></div>
          <div class="absolute w-32 h-32 border border-purple-500/40 rounded-lg rotate-45 animate-[spin_10s_linear_infinite_reverse]"></div>
          <div class="absolute w-20 h-20 bg-cyan-400/20 rounded-full blur-xl animate-pulse"></div>
          <svg class="w-24 h-24 text-cyan-400 opacity-65 animate-[bounce_4s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <polygon points="12 2 2 12 12 22 22 12" />
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
        </div>
      `;
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 3.5;

    // Tech geometry
    const geometry = new THREE.IcosahedronGeometry(1.2, 1);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
      shininess: 100,
    });
    
    // Core glow mesh
    const docMesh = new THREE.Mesh(geometry, material);
    scene.add(docMesh);

    // Subtle inner sphere for density
    const innerGeo = new THREE.IcosahedronGeometry(0.8, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xb600f8,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    // Lighting
    const pointLight = new THREE.PointLight(0xffffff, 1.2, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0x0a192f, 1.5);
    scene.add(ambientLight);

    let animationFrameId: number;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      docMesh.rotation.x += 0.006;
      docMesh.rotation.y += 0.008;

      innerMesh.rotation.x -= 0.004;
      innerMesh.rotation.y -= 0.003;

      if (renderer) {
        renderer.render(scene, camera);
      }
    }

    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      width = container.clientWidth;
      height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        renderer.dispose();
      }
      container.innerHTML = '';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[280px] md:min-h-[350px] flex items-center justify-center transition-all duration-300"
    />
  );
}
