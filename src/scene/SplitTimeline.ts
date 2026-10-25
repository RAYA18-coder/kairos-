/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { SimulationResult } from '../engine/types';

export class SplitTimeline {
  public group: THREE.Group;
  private ribbonShown: THREE.Line;
  private ribbonSuppressed: THREE.Line;
  private ribbonShownP10: THREE.Line;
  private ribbonShownP90: THREE.Line;
  private deltaSurface: THREE.Mesh;
  private markerGroup: THREE.Group;
  private progress: number = 1.0; // 0.0 to 1.0
  private maxPoints: number = 90;

  constructor() {
    this.group = new THREE.Group();
    this.markerGroup = new THREE.Group();
    this.group.add(this.markerGroup);

    // Initial empty buffers for 90 minutes
    const makeLine = (color: string, opacity: number, linewidth = 2) => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(this.maxPoints * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setDrawRange(0, 0);
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity,
        linewidth,
      });
      return new THREE.Line(geo, mat);
    };

    // Timeline B (Suppress): Lime #C6FF3D
    this.ribbonSuppressed = makeLine('#C6FF3D', 0.95, 3);
    this.group.add(this.ribbonSuppressed);

    // Timeline A (Shown/Allow): Coral #FF6B4A
    this.ribbonShown = makeLine('#FF6B4A', 0.95, 3);
    this.group.add(this.ribbonShown);

    // Confidence bands for shown timeline (P10 / P90)
    this.ribbonShownP10 = makeLine('#FF6B4A', 0.25, 1);
    this.ribbonShownP90 = makeLine('#FF6B4A', 0.25, 1);
    this.group.add(this.ribbonShownP10);
    this.group.add(this.ribbonShownP90);

    // Translucent gradient area mesh filling the gap between Timeline A and B
    const surfaceGeo = new THREE.BufferGeometry();
    const surfaceMat = new THREE.MeshBasicMaterial({
      color: 0xc6ff3d,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.deltaSurface = new THREE.Mesh(surfaceGeo, surfaceMat);
    this.group.add(this.deltaSurface);

    this.group.visible = false;
  }

  public updateData(sim: SimulationResult): void {
    const pointsCount = sim.meanFocusShown.length;
    const zSpacing = 0.18; // length of 90 min = ~16 units along Z
    const yScale = 2.4; // scale focus score 0..1 to 0..2.4

    // 1. Update Suppressed line (Lime)
    const suppPos = this.ribbonSuppressed.geometry.getAttribute('position') as THREE.BufferAttribute;
    const shownPos = this.ribbonShown.geometry.getAttribute('position') as THREE.BufferAttribute;
    const p10Pos = this.ribbonShownP10.geometry.getAttribute('position') as THREE.BufferAttribute;
    const p90Pos = this.ribbonShownP90.geometry.getAttribute('position') as THREE.BufferAttribute;

    // Build ribbon gap vertices: 2 vertices per time step (top and bottom)
    const surfaceVertices: number[] = [];
    const surfaceIndices: number[] = [];

    for (let t = 0; t < pointsCount; t++) {
      const z = -t * zSpacing;
      const suppY = sim.meanFocusSuppressed[t] * yScale;
      const shownY = sim.meanFocusShown[t] * yScale;
      const p10Y = sim.shownP10[t] * yScale;
      const p90Y = sim.shownP90[t] * yScale;

      // X offset: suppress ribbon slightly left (-0.15), shown ribbon slightly right (+0.15)
      suppPos.setXYZ(t, -0.15, suppY, z);
      shownPos.setXYZ(t, 0.15, shownY, z);
      p10Pos.setXYZ(t, 0.15, p10Y, z);
      p90Pos.setXYZ(t, 0.15, p90Y, z);

      // Area quad vertices:
      // vertex 2*t = suppressed point, vertex 2*t+1 = shown point
      surfaceVertices.push(-0.15, suppY, z);
      surfaceVertices.push(0.15, shownY, z);

      if (t < pointsCount - 1) {
        const v0 = t * 2;
        const v1 = t * 2 + 1;
        const v2 = (t + 1) * 2;
        const v3 = (t + 1) * 2 + 1;
        surfaceIndices.push(v0, v1, v2);
        surfaceIndices.push(v1, v3, v2);
      }
    }

    suppPos.needsUpdate = true;
    shownPos.needsUpdate = true;
    p10Pos.needsUpdate = true;
    p90Pos.needsUpdate = true;

    // Rebuild surface geometry
    this.deltaSurface.geometry.dispose();
    const newSurfaceGeo = new THREE.BufferGeometry();
    newSurfaceGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(surfaceVertices, 3)
    );
    newSurfaceGeo.setIndex(surfaceIndices);
    newSurfaceGeo.computeVertexNormals();
    this.deltaSurface.geometry = newSurfaceGeo;

    // Update draw range based on current progress
    this.applyProgress();

    // Rebuild milestone 3D markers on timeline A
    while (this.markerGroup.children.length > 0) {
      const child = this.markerGroup.children[0];
      this.markerGroup.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    }

    // Milestones at key minutes
    const detourMin = Math.round(sim.expectedDetourMinutes);
    const resumeMin = Math.round(sim.expectedResumptionDelay);

    const milestones = [
      { minute: 2, label: 'Interruption', color: 0xff6b4a },
      { minute: Math.min(88, 2 + Math.floor(detourMin * 0.5)), label: 'Browsing detour', color: 0xff6b4a },
      { minute: Math.min(88, 2 + detourMin), label: 'Resumption recovery', color: 0xe6e8eb },
      { minute: Math.min(88, 2 + detourMin + resumeMin), label: 'Restored flow', color: 0xc6ff3d },
    ];

    milestones.forEach((m) => {
      const z = -m.minute * zSpacing;
      const y = (sim.meanFocusShown[m.minute] || 0.4) * yScale;

      // Small glowing milestone sphere
      const sphereGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const sphereMat = new THREE.MeshBasicMaterial({ color: m.color });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(0.15, y, z);
      this.markerGroup.add(sphere);

      // Vertical hairline stem to ground
      const stemGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0.15, y, z),
        new THREE.Vector3(0.15, 0, z),
      ]);
      const stemMat = new THREE.LineBasicMaterial({
        color: m.color,
        transparent: true,
        opacity: 0.35,
      });
      const stem = new THREE.Line(stemGeo, stemMat);
      this.markerGroup.add(stem);
    });
  }

  public setProgress(p: number): void {
    this.progress = Math.max(0, Math.min(1, p));
    this.applyProgress();
  }

  private applyProgress(): void {
    const drawCount = Math.floor(this.progress * this.maxPoints);
    this.ribbonSuppressed.geometry.setDrawRange(0, drawCount);
    this.ribbonShown.geometry.setDrawRange(0, drawCount);
    this.ribbonShownP10.geometry.setDrawRange(0, drawCount);
    this.ribbonShownP90.geometry.setDrawRange(0, drawCount);

    const surfaceIndexCount = Math.max(0, (drawCount - 1) * 6);
    this.deltaSurface.geometry.setDrawRange(0, surfaceIndexCount);
  }

  public setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  public dispose(): void {
    this.ribbonSuppressed.geometry.dispose();
    (this.ribbonSuppressed.material as THREE.Material).dispose();
    this.ribbonShown.geometry.dispose();
    (this.ribbonShown.material as THREE.Material).dispose();
    this.ribbonShownP10.geometry.dispose();
    (this.ribbonShownP10.material as THREE.Material).dispose();
    this.ribbonShownP90.geometry.dispose();
    (this.ribbonShownP90.material as THREE.Material).dispose();
    this.deltaSurface.geometry.dispose();
    (this.deltaSurface.material as THREE.Material).dispose();
  }
}
