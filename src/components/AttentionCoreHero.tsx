/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FallbackSvg } from '../scene/FallbackSvg';

interface CoreMeshProps {
  focus: number;
  fatigue: number;
}

const CoreMesh: React.FC<CoreMeshProps> = ({ focus, fatigue }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Line>(null);

  const focusColor = new THREE.Color('#C6FF3D');
  const fatigueColor = new THREE.Color('#FF6B4A');
  const baseColor = new THREE.Color().lerpColors(focusColor, fatigueColor, fatigue);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.15;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.04;
      meshRef.current.scale.set(pulse, pulse, pulse);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.25;
      ringRef.current.rotation.x = Math.PI / 3;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 3]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-3, -2, -2]} intensity={0.8} color={baseColor} />

      {/* Main Core Mesh */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.35, 3]} />
        <meshStandardMaterial
          color="#0F0E14"
          emissive={baseColor}
          emissiveIntensity={0.4 + focus * 0.3}
          roughness={0.2}
          metalness={0.8}
          wireframe={false}
        />
      </mesh>

      {/* Outer Wireframe Halo */}
      <mesh scale={[1.42, 1.42, 1.42]}>
        <icosahedronGeometry args={[1.35, 2]} />
        <meshBasicMaterial
          color={baseColor}
          wireframe
          transparent
          opacity={0.18}
        />
      </mesh>
    </group>
  );
};

export interface AttentionCoreHeroProps {
  focus?: number;
  fatigue?: number;
  className?: string;
  size?: number;
}

export const AttentionCoreHero: React.FC<AttentionCoreHeroProps> = ({
  focus = 0.82,
  fatigue = 0.25,
  className = '',
  size = 180,
}) => {
  const [webGlSupported, setWebGlSupported] = React.useState(true);

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {webGlSupported ? (
        <Suspense fallback={<FallbackSvg mode="core" focus={focus} fatigue={fatigue} />}>
          <Canvas
            camera={{ position: [0, 0, 3.8], fov: 45 }}
            gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0);
            }}
            onError={() => setWebGlSupported(false)}
            className="w-full h-full pointer-events-none"
          >
            <CoreMesh focus={focus} fatigue={fatigue} />
          </Canvas>
        </Suspense>
      ) : (
        <FallbackSvg mode="core" focus={focus} fatigue={fatigue} />
      )}
    </div>
  );
};
