/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type VerdictType = 'ALLOW NOW' | 'HOLD' | 'HOLD UNTIL NEXT BREAK' | 'BATCH' | 'BATCH IN DIGEST' | 'SUPPRESS';

export interface ChipProps {
  verdict: VerdictType | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({ verdict, size = 'sm', className = '' }) => {
  const norm = verdict.toUpperCase();
  const isAllow = norm.includes('ALLOW');
  const isHold = norm.includes('HOLD');
  const isBatch = norm.includes('BATCH');
  const isSuppress = norm.includes('SUPPRESS');

  let style = 'bg-white/[0.08] text-[#F3F1FA] border-white/[0.12]';
  let dotColor = 'bg-[#F3F1FA]';
  let label = verdict;

  if (isAllow) {
    style = 'bg-[#C6FF3D]/12 text-[#C6FF3D] border-[#C6FF3D]/30';
    dotColor = 'bg-[#C6FF3D]';
    label = 'ALLOW NOW';
  } else if (isHold) {
    style = 'bg-[#FFC44D]/12 text-[#FFC44D] border-[#FFC44D]/30';
    dotColor = 'bg-[#FFC44D]';
    label = 'HOLD';
  } else if (isBatch) {
    style = 'bg-[#6EC8FF]/12 text-[#6EC8FF] border-[#6EC8FF]/30';
    dotColor = 'bg-[#6EC8FF]';
    label = 'BATCH IN DIGEST';
  } else if (isSuppress) {
    style = 'bg-[#FF6B4A]/12 text-[#FF6B4A] border-[#FF6B4A]/30';
    dotColor = 'bg-[#FF6B4A]';
    label = 'SUPPRESS';
  }

  const sizeStyle = size === 'sm' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-3.5 py-1.5 text-sm gap-2';

  return (
    <span
      className={`inline-flex items-center font-medium tracking-wide rounded-full border shrink-0 ${sizeStyle} ${style} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};
