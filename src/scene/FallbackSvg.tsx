/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimulationResult } from '../engine/types';

interface FallbackSvgProps {
  mode: 'core' | 'timeline' | 'clock';
  focus: number;
  fatigue: number;
  simulation?: SimulationResult;
}

export const FallbackSvg: React.FC<FallbackSvgProps> = ({
  mode,
  focus,
  fatigue,
  simulation,
}) => {
  if (mode === 'timeline' && simulation) {
    const width = 360;
    const height = 180;
    const padding = 24;

    // Convert simulation points to SVG path
    const pointsCount = simulation.meanFocusShown.length;
    const getX = (i: number) => padding + (i / (pointsCount - 1)) * (width - 2 * padding);
    const getY = (val: number) => height - padding - val * (height - 2 * padding);

    const suppPath = simulation.meanFocusSuppressed
      .map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(val).toFixed(1)}`)
      .join(' ');

    const shownPath = simulation.meanFocusShown
      .map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(val).toFixed(1)}`)
      .join(' ');

    // Area between curves
    const areaPath =
      suppPath +
      ' ' +
      simulation.meanFocusShown
        .map((_, idx) => {
          const revIdx = pointsCount - 1 - idx;
          return `L ${getX(revIdx).toFixed(1)} ${getY(simulation.meanFocusShown[revIdx]).toFixed(1)}`;
        })
        .join(' ') +
      ' Z';

    return (
      <div className="w-full flex items-center justify-center p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-[400px]">
          {/* Subtle grid */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#1c2029"
            strokeWidth="1"
          />
          <line
            x1={padding}
            y1={padding}
            x2={width - padding}
            y2={padding}
            stroke="#1c2029"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Area between curves (focus minutes saved) */}
          <path d={areaPath} fill="#C6FF3D" fillOpacity="0.12" />

          {/* Suppressed curve (Lime) */}
          <path d={suppPath} fill="none" stroke="#C6FF3D" strokeWidth="2.5" />

          {/* Shown curve (Coral) */}
          <path d={shownPath} fill="none" stroke="#FF6B4A" strokeWidth="2.5" />

          {/* Milestone dots */}
          <circle cx={getX(2)} cy={getY(simulation.meanFocusShown[2])} r="3.5" fill="#FF6B4A" />
        </svg>
      </div>
    );
  }

  // Core mode
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.max(0.05, focus));
  const coreColor = fatigue > 0.5 ? '#FF6B4A' : '#C6FF3D';

  return (
    <div className="w-full flex items-center justify-center py-4">
      <svg width="180" height="180" viewBox="0 0 180 180" className="overflow-visible">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#161a22" strokeWidth="3" />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={coreColor}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
          className="transition-all duration-700 ease-out"
        />
        {/* Core sphere inner fill */}
        <circle
          cx="90"
          cy="90"
          r="42"
          fill="#0c1017"
          stroke={coreColor}
          strokeWidth="1"
          strokeOpacity="0.4"
        />
        <text
          x="90"
          y="95"
          textAnchor="middle"
          fill="#e6e8eb"
          fontFamily="Geist Mono, monospace"
          fontSize="18"
          fontWeight="500"
        >
          {Math.round(focus * 100)}%
        </text>
      </svg>
    </div>
  );
};
