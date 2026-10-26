/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Hero slot placeholder. The Nexus video now plays as the app-wide background
 * (NeuroBrainBackground), so these slots no longer draw a second 3D scene; they
 * keep the same footprint so every screen's layout is unchanged, and show a soft
 * glow that reacts to focus.
 */

import React from 'react';

export interface BrainsProps {
  merge?: number;
  pulse?: number;
  fatigue?: number;
  jitter?: number;
  transferParticles?: boolean;
  className?: string;
  size?: number | string;
  interactive?: boolean;
}

export const BrainsSvgFallback: React.FC<{ merge?: number; pulse?: number; className?: string }> = ({ className = '' }) => (
  <div className={className} />
);

export const BrainsScene: React.FC<BrainsProps> = ({ pulse = 0.8, fatigue = 0.2, className = '', size = 220 }) => (
  <div
    className={`relative flex items-center justify-center shrink-0 pointer-events-none ${className}`}
    style={{ width: '100%', height: typeof size === 'number' ? size : 220 }}
    aria-hidden="true"
  >
    <div
      className="rounded-full blur-3xl"
      style={{
        width: '55%',
        height: '70%',
        opacity: 0.12 + pulse * 0.22,
        background: fatigue > 0.6 ? '#FFC44D' : '#6C7BFF',
      }}
    />
  </div>
);
