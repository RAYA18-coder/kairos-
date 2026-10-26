/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import * as d3 from 'd3';
import { SimulationResult } from '../../engine/types';

export interface SplitTimelineChartProps {
  simulation: SimulationResult;
  width?: number;
  height?: number;
}

export const SplitTimelineChart: React.FC<SplitTimelineChartProps> = ({
  simulation,
  width = 380,
  height = 190,
}) => {
  const margin = { top: 20, right: 24, bottom: 28, left: 34 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const nPoints = simulation.meanFocusShown.length;
  const xScale = d3
    .scaleLinear()
    .domain([0, nPoints - 1])
    .range([0, innerWidth]);

  const yScale = d3
    .scaleLinear()
    .domain([0, 1.0])
    .range([innerHeight, 0]);

  // Generators for curves
  const lineGenerator = d3
    .line<number>()
    .x((_, i) => xScale(i))
    .y((d) => yScale(d))
    .curve(d3.curveMonotoneX);

  const shownPath = lineGenerator(simulation.meanFocusShown) || '';
  const suppPath = lineGenerator(simulation.meanFocusSuppressed) || '';

  // Shaded region between curves
  const areaBetween = d3
    .area<{ s: number; h: number; i: number }>()
    .x((d) => xScale(d.i))
    .y0((d) => yScale(d.h))
    .y1((d) => yScale(d.s))
    .curve(d3.curveMonotoneX);

  const merged = simulation.meanFocusSuppressed.map((s, i) => ({
    s,
    h: simulation.meanFocusShown[i],
    i,
  }));
  const areaPath = areaBetween(merged) || '';

  // Interruption fork point at t=2
  const forkX = xScale(2);
  const forkYShown = yScale(simulation.meanFocusShown[2]);
  const forkYSupp = yScale(simulation.meanFocusSuppressed[2]);

  return (
    <div className="w-full flex flex-col items-center select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        aria-label="Split Counterfactual Timeline Chart"
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Subtle horizontal grid lines */}
          {[0.25, 0.5, 0.75, 1.0].map((tick) => (
            <line
              key={tick}
              x1={0}
              y1={yScale(tick)}
              x2={innerWidth}
              y2={yScale(tick)}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeDasharray="3 3"
            />
          ))}

          {/* Area between curves: Saved focus */}
          <path d={areaPath} fill="#C6FF3D" fillOpacity={0.12} />

          {/* Suppressed Branch (Lime - Intact Focus) */}
          <path
            d={suppPath}
            fill="none"
            stroke="#C6FF3D"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {/* Shown Branch (Coral - Interrupted Detour) */}
          <path
            d={shownPath}
            fill="none"
            stroke="#FF6B4A"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {/* Fork point vertical guide */}
          <line
            x1={forkX}
            y1={0}
            x2={forkX}
            y2={innerHeight}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeDasharray="2 2"
          />

          {/* Fork Point Indicators */}
          <circle cx={forkX} cy={forkYSupp} r={3.5} fill="#C6FF3D" />
          <circle cx={forkX} cy={forkYShown} r={3.5} fill="#FF6B4A" />

          {/* X Axis Labels */}
          <text
            x={0}
            y={innerHeight + 16}
            fill="#9A96AD"
            fontSize="10"
            fontFamily="Geist Mono, monospace"
          >
            0m
          </text>
          <text
            x={forkX}
            y={innerHeight + 16}
            textAnchor="middle"
            fill="#F3F1FA"
            fontSize="10"
            fontFamily="Geist Mono, monospace"
          >
            Alert
          </text>
          <text
            x={innerWidth}
            y={innerHeight + 16}
            textAnchor="end"
            fill="#9A96AD"
            fontSize="10"
            fontFamily="Geist Mono, monospace"
          >
            +60m
          </text>

          {/* Y Axis percentage markers */}
          <text
            x={-6}
            y={yScale(1.0) + 3}
            textAnchor="end"
            fill="#9A96AD"
            fontSize="9"
            fontFamily="Geist Mono, monospace"
          >
            100%
          </text>
          <text
            x={-6}
            y={yScale(0.5) + 3}
            textAnchor="end"
            fill="#9A96AD"
            fontSize="9"
            fontFamily="Geist Mono, monospace"
          >
            50%
          </text>
          <text
            x={-6}
            y={yScale(0) + 3}
            textAnchor="end"
            fill="#9A96AD"
            fontSize="9"
            fontFamily="Geist Mono, monospace"
          >
            0%
          </text>
        </g>
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-1 rounded-full bg-[#C6FF3D]" />
          <span className="text-[#F3F1FA] font-medium">SUPPRESSED (Held)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-1 rounded-full bg-[#FF6B4A]" />
          <span className="text-[#9A96AD]">SHOWN (Interrupted)</span>
        </div>
      </div>
    </div>
  );
};
