/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import * as d3 from 'd3';

export interface CalibrationBin {
  binLabel?: string;
  predictedProbability?: number;
  actualObservedRate?: number;
  pred?: number;
  observed?: number;
  count: number;
  low?: number;
  high?: number;
}

export interface CalibrationPlotProps {
  bins?: CalibrationBin[];
  ece?: number;
  width?: number;
  height?: number;
}

const DEFAULT_BINS: CalibrationBin[] = [
  { pred: 0.1, observed: 0.09, count: 48, low: 0.05, high: 0.14 },
  { pred: 0.25, observed: 0.23, count: 82, low: 0.18, high: 0.29 },
  { pred: 0.45, observed: 0.47, count: 120, low: 0.41, high: 0.53 },
  { pred: 0.65, observed: 0.63, count: 95, low: 0.56, high: 0.70 },
  { pred: 0.85, observed: 0.88, count: 64, low: 0.82, high: 0.94 },
];

export const CalibrationPlot: React.FC<CalibrationPlotProps> = ({
  bins = DEFAULT_BINS,
  ece = 0.038,
  width = 340,
  height = 200,
}) => {
  const margin = { top: 20, right: 24, bottom: 32, left: 36 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const scale = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
  const yScale = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);

  return (
    <div className="w-full flex flex-col items-center select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Diagonal Reference Line (Perfect Calibration y = x) */}
          <line
            x1={0}
            y1={innerHeight}
            x2={innerWidth}
            y2={0}
            stroke="rgba(242, 247, 243, 0.3)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((val) => (
            <React.Fragment key={val}>
              <line
                x1={0}
                y1={yScale(val)}
                x2={innerWidth}
                y2={yScale(val)}
                stroke="rgba(255, 255, 255, 0.06)"
              />
              <line
                x1={scale(val)}
                y1={0}
                x2={scale(val)}
                y2={innerHeight}
                stroke="rgba(255, 255, 255, 0.06)"
              />
            </React.Fragment>
          ))}

          {/* Error Bars and Data Points */}
          {bins.map((b, idx) => {
            const predVal = b.predictedProbability !== undefined ? b.predictedProbability : (b.pred ?? 0.5);
            const observedVal = b.actualObservedRate !== undefined ? b.actualObservedRate : (b.observed ?? 0.5);
            const lowVal = b.low !== undefined ? b.low : Math.max(0, observedVal - 0.05);
            const highVal = b.high !== undefined ? b.high : Math.min(1, observedVal + 0.05);

            const cx = scale(predVal);
            const cy = yScale(observedVal);
            const y1 = yScale(lowVal);
            const y2 = yScale(highVal);

            return (
              <g key={idx}>
                {/* 95% Confidence Interval error bar */}
                <line
                  x1={cx}
                  y1={y1}
                  x2={cx}
                  y2={y2}
                  stroke="#7FE3C0"
                  strokeWidth="1.5"
                  strokeOpacity="0.7"
                />
                <line
                  x1={cx - 3}
                  y1={y1}
                  x2={cx + 3}
                  y2={y1}
                  stroke="#7FE3C0"
                  strokeWidth="1.5"
                />
                <line
                  x1={cx - 3}
                  y2={y2}
                  x2={cx + 3}
                  y1={y2}
                  stroke="#7FE3C0"
                  strokeWidth="1.5"
                />

                {/* Empirical Point */}
                <circle cx={cx} cy={cy} r="4.5" fill="#7FE3C0" stroke="#081B12" strokeWidth="1.5" />
              </g>
            );
          })}

          {/* X Axis labels */}
          <text
            x={innerWidth / 2}
            y={innerHeight + 24}
            textAnchor="middle"
            fill="rgba(242, 247, 243, 0.6)"
            fontSize="10"
            fontFamily="sans-serif"
          >
            Predicted Open Probability
          </text>

          {/* Y Axis label */}
          <text
            x={-innerHeight / 2}
            y={-22}
            transform="rotate(-90)"
            textAnchor="middle"
            fill="rgba(242, 247, 243, 0.6)"
            fontSize="10"
            fontFamily="sans-serif"
          >
            Observed Rate
          </text>
        </g>
      </svg>

      <div className="flex items-center justify-between w-full mt-2 px-3 text-xs text-[rgba(242,247,243,0.65)]">
        <span>
          ECE Error:{' '}
          <strong className="text-[#7FE3C0] font-mono-numbers">
            ±{(ece * 100).toFixed(1)}%
          </strong>
        </span>
        <span className="text-[11px] font-mono-numbers">N = 409 held-out events</span>
      </div>
    </div>
  );
};
