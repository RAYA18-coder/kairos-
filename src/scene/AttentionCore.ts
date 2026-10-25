/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface CoreConfig {
  focus: number; // 0.0 - 1.0
  fatigue: number; // 0.0 - 1.0
  quietMode: boolean;
}

export class AttentionCore {
  public group: THREE.Group;
  private coreMesh: THREE.Mesh;
  private orbitRing: THREE.Line;
  private particles: THREE.Points;
  private coreMaterial: THREE.ShaderMaterial;
  private ringMaterial: THREE.LineBasicMaterial;
  private particlePositions: Float32Array;
  private particleSpeeds: Float32Array;

  constructor() {
    this.group = new THREE.Group();

    // 1. Core Geometry: refined low-poly icosphere (detail 4)
    const geometry = new THREE.IcosahedronGeometry(1.6, 4);

    // Custom Fresnel + Vertex Noise displacement ShaderMaterial
    this.coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFocus: { value: 0.8 },
        uFatigue: { value: 0.2 },
        uColorFocus: { value: new THREE.Color('#C6FF3D') }, // Electric Lime
        uColorFatigue: { value: new THREE.Color('#FF6B4A') }, // Alert Coral
        uColorDark: { value: new THREE.Color('#0a0d12') },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uFocus;
        uniform float uFatigue;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying float vDisplacement;

        // Simplex-like procedural noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          vec4 j = p - 49.0 * floor(p * (1.0 / 49.0));
          vec4 x_ = floor(j * (1.0 / 7.0));
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * (2.0 / 7.0) + 0.5 / 7.0 - 1.0;
          vec4 y = y_ * (2.0 / 7.0) + 0.5 / 7.0 - 1.0;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
          vNormal = normalize(normalMatrix * normal);
          // Noise frequency & turbulence higher when fatigue increases
          float noiseSpeed = 0.4 + uFatigue * 0.8;
          float noiseFreq = 1.2 + uFatigue * 1.5;
          float displacement = snoise(position * noiseFreq + vec3(uTime * noiseSpeed)) * (0.04 + uFatigue * 0.22);
          vDisplacement = displacement;

          vec3 newPosition = position + normal * displacement;
          vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uFocus;
        uniform float uFatigue;
        uniform vec3 uColorFocus;
        uniform vec3 uColorFatigue;
        uniform vec3 uColorDark;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying float vDisplacement;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          // Fresnel computation for glowing rim
          float fresnel = 1.0 - max(0.0, dot(normal, viewDir));
          fresnel = pow(fresnel, 2.5);

          // Dynamic color interpolation: Lime (high focus) -> Coral (high fatigue)
          vec3 rimColor = mix(uColorFocus, uColorFatigue, clamp(uFatigue * 1.2 - (uFocus * 0.3), 0.0, 1.0));

          // Body is dark matte automotive carbon with subtle displacement sheen
          vec3 bodyColor = mix(uColorDark, rimColor * 0.15, clamp(vDisplacement * 3.0, 0.0, 0.5));

          // Combine body with glowing rim
          vec3 finalColor = bodyColor + rimColor * fresnel * (0.8 + uFocus * 0.8);
          gl_FragColor = vec4(finalColor, 0.95);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
    });

    this.coreMesh = new THREE.Mesh(geometry, this.coreMaterial);
    this.group.add(this.coreMesh);

    // 2. Focus Orbit Arc Ring (Arc length = focus score)
    const ringSegments = 120;
    const ringGeo = new THREE.BufferGeometry();
    const ringPositions = new Float32Array((ringSegments + 1) * 3);
    const radius = 2.15;

    for (let i = 0; i <= ringSegments; i++) {
      const angle = (i / ringSegments) * Math.PI * 2 * 0.8; // initial 80% arc
      ringPositions[i * 3] = Math.cos(angle) * radius;
      ringPositions[i * 3 + 1] = 0;
      ringPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));

    this.ringMaterial = new THREE.LineBasicMaterial({
      color: 0xc6ff3d,
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
    });
    this.orbitRing = new THREE.Line(ringGeo, this.ringMaterial);
    this.orbitRing.rotation.x = Math.PI * 0.25;
    this.group.add(this.orbitRing);

    // 3. Faint Particle Halo (400 points, additive blending)
    const particleCount = 400;
    const pGeo = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(particleCount * 3);
    this.particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.0 + Math.random() * 1.5;

      this.particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      this.particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      this.particlePositions[i * 3 + 2] = r * Math.cos(phi);

      this.particleSpeeds[i] = 0.2 + Math.random() * 0.4;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0xc6ff3d,
      size: 0.04,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(pGeo, pMat);
    this.group.add(this.particles);
  }

  public update(time: number, delta: number, config: CoreConfig): void {
    if (config.quietMode) {
      this.coreMesh.rotation.y = 0;
      this.particles.visible = false;
      return;
    }

    this.particles.visible = true;

    // Shader uniforms
    this.coreMaterial.uniforms.uTime.value = time;
    this.coreMaterial.uniforms.uFocus.value = config.focus;
    this.coreMaterial.uniforms.uFatigue.value = config.fatigue;

    // Slow calm rotation: slower and steadier when focus is high
    const rotSpeed = (0.12 - config.focus * 0.05 + config.fatigue * 0.1) * delta;
    this.coreMesh.rotation.y += rotSpeed;
    this.coreMesh.rotation.x = Math.sin(time * 0.2) * 0.08;

    // Orbit ring rotation and color
    this.orbitRing.rotation.z += rotSpeed * 0.8;
    this.ringMaterial.color.set(config.fatigue > 0.5 ? 0xff6b4a : 0xc6ff3d);

    // Update orbit ring geometry arc length matching current focus
    const ringSegments = 120;
    const activeSegments = Math.max(10, Math.floor(ringSegments * Math.max(0.1, config.focus)));
    const posAttr = this.orbitRing.geometry.getAttribute('position') as THREE.BufferAttribute;
    const radius = 2.15;
    for (let i = 0; i <= ringSegments; i++) {
      const angle = (i / ringSegments) * Math.PI * 2 * config.focus;
      const r = i <= activeSegments ? radius : 0; // zero out beyond focus length
      posAttr.setXYZ(i, Math.cos(angle) * r, 0, Math.sin(angle) * r);
    }
    posAttr.needsUpdate = true;

    // Slow drifting particle halo
    const particlePositions = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
    const count = particlePositions.count;
    const driftFactor = (1.2 - config.focus * 0.7) * delta * 0.3;

    for (let i = 0; i < count; i++) {
      let y = particlePositions.getY(i);
      y += this.particleSpeeds[i] * driftFactor;
      if (y > 3.0) y = -3.0;
      particlePositions.setY(i, y);
    }
    particlePositions.needsUpdate = true;
    this.particles.rotation.y += rotSpeed * 0.4;
  }

  public setParallax(targetX: number, targetY: number): void {
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetX * 0.35, 0.08);
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, -targetY * 0.25, 0.08);
  }

  public dispose(): void {
    this.coreMesh.geometry.dispose();
    this.coreMaterial.dispose();
    this.orbitRing.geometry.dispose();
    this.ringMaterial.dispose();
    this.particles.geometry.dispose();
    (this.particles.material as THREE.Material).dispose();
  }
}
