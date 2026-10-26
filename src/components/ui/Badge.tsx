/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface BadgeProps {
  label: string;
  variant?: 'provenance' | 'subtle' | 'accent' | 'vip';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'provenance', className = '' }) => {
  let style = 'bg-white/[0.06] text-[#9A96AD] border-white/[0.08]';

  if (variant === 'provenance') {
    if (label.includes('device') || label.includes('You: your device')) {
      style = 'bg-[#6EC8FF]/10 text-[#6EC8FF] border-[#6EC8FF]/20';
    } else if (label.includes('experiment') || label.includes('You: experiment')) {
      style = 'bg-[#C6FF3D]/10 text-[#C6FF3D] border-[#C6FF3D]/20';
    } else {
      style = 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/20';
    }
  } else if (variant === 'vip') {
    style = 'bg-[#FFC44D]/15 text-[#FFC44D] border-[#FFC44D]/30';
  } else if (variant === 'accent') {
    style = 'bg-[#C6FF3D]/12 text-[#C6FF3D] border-[#C6FF3D]/30';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded-full border tracking-tight shrink-0 ${style} ${className}`}
    >
      {label}
    </span>
  );
};
