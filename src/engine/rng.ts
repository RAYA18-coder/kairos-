/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Mulberry32 32-bit deterministic PRNG
 */
export class Mulberry32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Returns uniform float in [0, 1) */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Standard normal distribution using Box-Muller transform */
  nextGaussian(mean = 0, stdDev = 1): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * stdDev;
  }

  /** Lognormal distribution */
  nextLognormal(mu: number, sigma: number): number {
    const normal = this.nextGaussian(0, 1);
    return Math.exp(mu + sigma * normal);
  }

  /** Bernoulli trial with probability p */
  chance(p: number): boolean {
    return this.next() < p;
  }
}

/** Compute numeric hash code from string */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}
