/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  ci?: [number | string, number | string];
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    text: string;
  };
  accent?: 'lime' | 'coral' | 'amber' | 'sky' | 'lilac' | 'neutral';
  className?: string;
}

export const Stat: React.FC<StatProps> = ({
  label,
  value,
  unit,
  ci,
  trend,
  accent = 'neutral',
  className = '',
}) => {
  const accentColor = {
    lime: 'text-[#C6FF3D]',
    coral: 'text-[#FF6B4A]',
    amber: 'text-[#FFC44D]',
    sky: 'text-[#6EC8FF]',
    lilac: 'text-[#A78BFA]',
    neutral: 'text-[#F3F1FA]',
  }[accent];

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-[#9A96AD] tracking-wide">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl sm:text-3xl font-semibold font-mono-numbers tracking-tight ${accentColor}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-[#9A96AD] font-medium">{unit}</span>}
      </div>
      {ci && (
        <span className="text-[11px] font-mono-numbers text-[#9A96AD]/80">
          95% CI: [{ci[0]}, {ci[1]}]
        </span>
      )}
      {trend && (
        <div className="flex items-center gap-1 text-xs mt-0.5">
          <span
            className={
              trend.direction === 'up'
                ? 'text-[#C6FF3D]'
                : trend.direction === 'down'
                ? 'text-[#FF6B4A]'
                : 'text-[#9A96AD]'
            }
          >
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.text}
          </span>
        </div>
      )}
    </div>
  );
};
