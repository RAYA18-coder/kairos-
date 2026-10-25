/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { FocusCurvePoint } from '../engine/types';

export class FocusClock {
  public group: THREE.Group;
  private instancedMesh: THREE.InstancedMesh;
  private currentHourRing: THREE.Mesh;
  private dummy: THREE.Object3D;
  private currentHeights: number[];
  private targetHeights: number[];
  private currentHour: number = 22;

  constructor() {
    this.group = new THREE.Group();
    this.dummy = new THREE.Object3D();
    this.currentHeights = new Array(24).fill(0.5);
    this.targetHeights = new Array(24).fill(0.5);

    // Geometry for a radial bar
    const barGeo = new THREE.BoxGeometry(0.08, 1.0, 0.08);
    // Base material: sleek dark slate with lime emission
    const barMat = new THREE.MeshStandardMaterial({
      color: 0x8a8f98,
      emissive: 0xc6ff3d,
      emissiveIntensity: 0.15,
      roughness: 0.3,
      metalness: 0.8,
    });

    this.instancedMesh = new THREE.InstancedMesh(barGeo, barMat, 24);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(this.instancedMesh);

    // Glowing marker ring for the "current hour"
    const ringGeo = new THREE.TorusGeometry(0.12, 0.02, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xc6ff3d });
    this.currentHourRing = new THREE.Mesh(ringGeo, ringMat);
    this.group.add(this.currentHourRing);

    this.group.visible = false; // toggled active when on Twin tab
  }

  public updateData(curvePoints: FocusCurvePoint[], currentHour: number): void {
    this.currentHour = currentHour;
    for (let i = 0; i < 24; i++) {
      const pt = curvePoints.find((p) => p.hour === i);
      this.targetHeights[i] = pt ? Math.max(0.15, pt.probDeepFocus * 1.8) : 0.5;
    }
  }

  public update(delta: number): void {
    if (!this.group.visible) return;

    const clockRadius = 3.2;
    let needsUpdate = false;

    for (let h = 0; h < 24; h++) {
      // Smooth interpolation toward target height
      if (Math.abs(this.currentHeights[h] - this.targetHeights[h]) > 0.001) {
        this.currentHeights[h] = THREE.MathUtils.damp(
          this.currentHeights[h],
          this.targetHeights[h],
          8,
          delta
        );
        needsUpdate = true;
      }

      // Arrange in a 24-hour radial circle
      const angle = (h / 24) * Math.PI * 2 - Math.PI / 2;
      const height = this.currentHeights[h];
      const x = Math.cos(angle) * clockRadius;
      const z = Math.sin(angle) * clockRadius;

      this.dummy.position.set(x, height / 2, z);
      this.dummy.rotation.y = -angle;
      this.dummy.scale.set(1, height, 1);
      this.dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(h, this.dummy.matrix);

      // Color current hour with high electric lime, others neutral
      const color = new THREE.Color();
      if (h === this.currentHour) {
        color.set('#C6FF3D');
        // Position glowing marker ring at current hour
        this.currentHourRing.position.set(x, height + 0.15, z);
        this.currentHourRing.rotation.x = Math.PI / 2;
      } else {
        const focusVal = height / 1.8;
        color.lerpColors(new THREE.Color('#383c45'), new THREE.Color('#8a96a8'), focusVal);
      }
      this.instancedMesh.setColorAt(h, color);
    }

    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
    if (needsUpdate || true) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }

    // Slow orbital rotation of clock group for depth
    this.group.rotation.y += delta * 0.04;
  }

  public setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  public dispose(): void {
    this.instancedMesh.geometry.dispose();
    (this.instancedMesh.material as THREE.Material).dispose();
    this.currentHourRing.geometry.dispose();
    (this.currentHourRing.material as THREE.Material).dispose();
  }
}
