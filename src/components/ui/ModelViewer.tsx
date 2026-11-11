import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ModelViewerProps {
  modelPath?: string;
  className?: string;
  autoRotateSpeed?: number;
  offsetY?: number;
}

export const ModelViewer: React.FC<ModelViewerProps> = ({
  modelPath = '/models/Permease.glb',
  className = 'w-full h-full',
  autoRotateSpeed = 1.8,
  offsetY = 0.35,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / (container.clientHeight || 1),
      0.1,
      1000
    );
    camera.position.set(0, 0.5 + offsetY * 0.5, 3.5);

    // 2. Transparent WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false; // keep smooth page scrolling
    controls.autoRotate = true;
    controls.autoRotateSpeed = autoRotateSpeed;
    controls.target.set(0, offsetY, 0);

    // 4. Lighting tuned for Navy & Gold theme
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    // Golden Key Light
    const goldKeyLight = new THREE.DirectionalLight(0xf5cb5c, 3.2);
    goldKeyLight.position.set(4, 5, 4);
    scene.add(goldKeyLight);

    // Subtle Cool Navy Fill Light
    const navyFillLight = new THREE.DirectionalLight(0x7090d0, 1.8);
    navyFillLight.position.set(-4, -2, -3);
    scene.add(navyFillLight);

    // Rim Highlight
    const rimLight = new THREE.DirectionalLight(0xfff6dd, 2.0);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    let mixer: THREE.AnimationMixer | null = null;
    let modelGroup: THREE.Group | null = null;

    // 5. Load GLB Model
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        modelGroup = gltf.scene;

        // Auto-center and normalize size
        const box = new THREE.Box3().setFromObject(modelGroup);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        modelGroup.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const targetScale = 2.2 / maxDim;
          modelGroup.scale.setScalar(targetScale);
        }

        // Move higher by offsetY
        modelGroup.position.y += offsetY;

        scene.add(modelGroup);
        setIsLoading(false);

        // Play animations if model has them
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(modelGroup);
          gltf.animations.forEach((clip) => {
            mixer?.clipAction(clip).play();
          });
        }
      },
      undefined,
      (err) => {
        console.error('Failed to load 3D GLB model:', err);
        setIsLoading(false);
      }
    );

    // 6. Animation loop
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (mixer) mixer.update(delta);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 7. Resize handling
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / (height || 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 8. Cleanup
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();

      if (modelGroup) {
        modelGroup.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => mat.dispose());
            } else if (mesh.material) {
              mesh.material.dispose();
            }
          }
        });
      }

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelPath, autoRotateSpeed]);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
        </div>
      )}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
