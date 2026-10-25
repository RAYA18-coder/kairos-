/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useKairosStore } from '../store/useKairosStore';
import { AttentionCore } from './AttentionCore';
import { FocusClock } from './FocusClock';
import { SplitTimeline } from './SplitTimeline';
import { FallbackSvg } from './FallbackSvg';

export const SceneContainer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGlError, setHasWebGlError] = useState(false);

  // Zustand state subscriptions
  const activeTab = useKairosStore((s) => s.activeTab);
  const quietMode = useKairosStore((s) => s.quietMode);
  const isExperimentActive = useKairosStore((s) => s.isExperimentActive);
  const userState = useKairosStore((s) => s.userState);
  const simulation = useKairosStore((s) => s.simulation);
  const twins = useKairosStore((s) => s.twins);
  const activePersona = useKairosStore((s) => s.activePersona);

  // References to keep mutable 3D instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const coreRef = useRef<AttentionCore | null>(null);
  const clockRef = useRef<FocusClock | null>(null);
  const timelineRef = useRef<SplitTimeline | null>(null);

  // Camera targets for tabs
  const targetCamPos = useRef(new THREE.Vector3(0, 0, 5));
  const targetCamLook = useRef(new THREE.Vector3(0, 0, 0));

  // Pointer tracking for subtle parallax
  const pointer = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect WebGL capability safely
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setHasWebGlError(true);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Studio Lighting Rig (No HDRI/network textures)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xc6ff3d, 0.8);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    // Initialize 3D Objects
    const core = new AttentionCore();
    scene.add(core.group);
    coreRef.current = core;

    const focusClock = new FocusClock();
    scene.add(focusClock.group);
    clockRef.current = focusClock;

    const splitTimeline = new SplitTimeline();
    scene.add(splitTimeline.group);
    timelineRef.current = splitTimeline;

    // Pointer move listener for subtle parallax tilt
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      pointer.current.targetX = (clientX / window.innerWidth) * 2 - 1;
      pointer.current.targetY = -(clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    // Window resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Render loop with high-efficiency frame pacing
    let frameId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      frameId = requestAnimationFrame(tick);
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // When experiment is active or tab is hidden, pause heavy 3D rendering
      if (useKairosStore.getState().isExperimentActive) {
        return;
      }

      // Parallax smooth interpolation
      pointer.current.x = THREE.MathUtils.lerp(pointer.current.x, pointer.current.targetX, 0.05);
      pointer.current.y = THREE.MathUtils.lerp(pointer.current.y, pointer.current.targetY, 0.05);

      if (coreRef.current) {
        coreRef.current.setParallax(pointer.current.x, pointer.current.y);
        coreRef.current.update(now * 0.001, delta, {
          focus: 1.0 - useKairosStore.getState().userState.fatigue,
          fatigue: useKairosStore.getState().userState.fatigue,
          quietMode: useKairosStore.getState().quietMode,
        });
      }

      if (clockRef.current) {
        clockRef.current.update(delta);
      }

      // Smooth camera interpolation toward tab target
      camera.position.lerp(targetCamPos.current, 0.06);
      const currentLook = new THREE.Vector3(0, 0, 0).lerp(targetCamLook.current, 0.06);
      camera.lookAt(currentLook);

      renderer.render(scene, camera);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      core.dispose();
      focusClock.dispose();
      splitTimeline.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync tab transitions and camera dollies
  useEffect(() => {
    if (!coreRef.current || !clockRef.current || !timelineRef.current) return;

    if (activeTab === 'now') {
      targetCamPos.current.set(0, 0, 4.8);
      targetCamLook.current.set(0, 0, 0);
      coreRef.current.group.position.set(0, 0.4, 0);
      coreRef.current.group.scale.set(1, 1, 1);
      clockRef.current.setVisible(false);
      timelineRef.current.setVisible(false);
    } else if (activeTab === 'simulate') {
      // Slow camera dolly back for 3D Split-Timeline
      targetCamPos.current.set(0, 2.8, 6.2);
      targetCamLook.current.set(0, 0.8, -4);
      coreRef.current.group.position.set(0, 1.4, 0);
      coreRef.current.group.scale.set(0.65, 0.65, 0.65);
      clockRef.current.setVisible(false);
      timelineRef.current.setVisible(true);
      timelineRef.current.updateData(simulation);
    } else if (activeTab === 'twin') {
      // Perspective showing core surrounded by 24-hour radial clock
      targetCamPos.current.set(0, 3.8, 5.6);
      targetCamLook.current.set(0, 0, 0);
      coreRef.current.group.position.set(0, 0, 0);
      coreRef.current.group.scale.set(0.75, 0.75, 0.75);
      clockRef.current.setVisible(true);
      timelineRef.current.setVisible(false);
      const curve = twins[activePersona].focusCurve.data.weekday;
      clockRef.current.updateData(curve, userState.hour);
    } else {
      // Guard / Proof tabs: ambient subtle background core
      targetCamPos.current.set(0, 0, 6.5);
      targetCamLook.current.set(0, 0, 0);
      coreRef.current.group.position.set(0, 0, 0);
      coreRef.current.group.scale.set(0.85, 0.85, 0.85);
      clockRef.current.setVisible(false);
      timelineRef.current.setVisible(false);
    }
  }, [activeTab, simulation, twins, activePersona, userState.hour]);

  // Update simulation data on the timeline whenever it changes
  useEffect(() => {
    if (timelineRef.current && activeTab === 'simulate') {
      timelineRef.current.updateData(simulation);
    }
  }, [simulation, activeTab]);

  if (hasWebGlError) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-40">
        <FallbackSvg
          mode={activeTab === 'simulate' ? 'timeline' : 'core'}
          focus={1 - userState.fatigue}
          fatigue={userState.fatigue}
          simulation={simulation}
        />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ${
        isExperimentActive ? 'opacity-0' : 'opacity-100'
      }`}
      aria-hidden="true"
    />
  );
};
