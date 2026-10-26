/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface FocusClockChartProps {
  hourlyFocus: number[]; // 24 numbers [0, 1]
  currentHour: number; // 0 - 23
  onSelectHour?: (hour: number) => void;
  className?: string;
}

export const FocusClockChart: React.FC<FocusClockChartProps> = ({
  hourlyFocus,
  currentHour,
  onSelectHour,
  className = '',
}) => {
  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      <div className="flex items-end justify-between h-20 gap-1 px-1">
        {hourlyFocus.map((val, h) => {
          const isCurrent = h === currentHour;
          const heightPct = Math.max(12, Math.round(val * 100));

          let barColor = 'bg-[#123628] hover:bg-[#7FE3C0]/40';
          if (isCurrent) {
            barColor = 'bg-[#7FE3C0] shadow-md shadow-[#7FE3C0]/30';
          } else if (val > 0.75) {
            barColor = 'bg-[#48BB78]/70';
          } else if (val < 0.3) {
            barColor = 'bg-[#061A12] border border-white/5';
          }

          return (
            <button
              key={h}
              type="button"
              onClick={() => onSelectHour?.(h)}
              title={`${h}:00 — Focus probability: ${Math.round(val * 100)}%`}
              className="flex-1 flex flex-col items-center justify-end h-full group focus:outline-none cursor-pointer"
            >
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full rounded-t-sm transition-all duration-300 ${barColor}`}
              />
            </button>
          );
        })}
      </div>

      {/* Axis Hour Labels (0, 6, 12, 18, 23) */}
      <div className="flex justify-between text-[10px] font-mono-numbers text-[rgba(242,247,243,0.5)] px-1">
        <span>00:00</span>
        <span>06:00</span>
        <span className="text-[#7FE3C0] font-bold">12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
};
