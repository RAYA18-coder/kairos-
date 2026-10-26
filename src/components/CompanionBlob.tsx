/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

export interface CompanionBlobProps {
  fatigue: number; // 0.0 - 1.0
  focusScore?: number; // 0.0 - 1.0
  isProtected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CompanionBlob: React.FC<CompanionBlobProps> = ({
  fatigue,
  isProtected = false,
  size = 'md',
  className = '',
}) => {
  const isDeepFlow = fatigue < 0.25;
  const isTired = fatigue > 0.55;

  const dims = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  }[size];

  // Dynamic colors and emotion state
  let primaryColor = '#A78BFA'; // Lilac calm
  let glowColor = 'rgba(167, 139, 250, 0.25)';
  let expression = 'happy'; // 'focused' | 'happy' | 'sleepy' | 'shielded'

  if (isProtected) {
    primaryColor = '#C6FF3D'; // Lime protected
    glowColor = 'rgba(198, 255, 61, 0.3)';
    expression = 'shielded';
  } else if (isDeepFlow) {
    primaryColor = '#6EC8FF'; // Sky deep flow
    glowColor = 'rgba(110, 200, 255, 0.3)';
    expression = 'focused';
  } else if (isTired) {
    primaryColor = '#FFC44D'; // Amber fatigue
    glowColor = 'rgba(255, 196, 77, 0.25)';
    expression = 'sleepy';
  }

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${dims} ${className}`}>
      {/* Ambient Radial Aura */}
      <div
        className="absolute inset-0 rounded-full blur-xl transition-colors duration-700 pointer-events-none"
        style={{ backgroundColor: glowColor }}
      />

      {/* Morphing Organic Body */}
      <motion.div
        animate={{
          scale: [1, 1.04, 0.98, 1],
          rotate: [0, 1.5, -1.5, 0],
          borderRadius: [
            '45% 55% 50% 50% / 55% 45% 55% 45%',
            '52% 48% 58% 42% / 48% 54% 46% 52%',
            '46% 54% 48% 52% / 52% 46% 54% 48%',
            '45% 55% 50% 50% / 55% 45% 55% 45%',
          ],
        }}
        transition={{
          duration: isDeepFlow ? 3 : isTired ? 6 : 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative w-full h-full flex items-center justify-center shadow-lg transition-colors duration-500"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, #1A1824 100%)`,
          border: '1.5px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Face Elements */}
        <div className="relative flex items-center gap-2.5 z-10">
          {expression === 'focused' && (
            <>
              {/* Sharp analytical eyes */}
              <div className="w-2.5 h-1 bg-[#0F0E14] rounded-full" />
              <div className="w-2.5 h-1 bg-[#0F0E14] rounded-full" />
            </>
          )}

          {expression === 'happy' && (
            <>
              {/* Soft curved happy eyes */}
              <div className="w-2 h-2 rounded-full bg-[#0F0E14]" />
              <div className="w-2 h-2 rounded-full bg-[#0F0E14]" />
            </>
          )}

          {expression === 'sleepy' && (
            <>
              {/* Drooping sleepy slits */}
              <div className="w-2.5 h-0.5 bg-[#0F0E14] rounded-full rotate-6" />
              <div className="w-2.5 h-0.5 bg-[#0F0E14] rounded-full -rotate-6" />
            </>
          )}

          {expression === 'shielded' && (
            <>
              {/* Vigilant guard eyes with highlight */}
              <div className="w-2 h-2 rounded-full bg-[#0F0E14] flex items-center justify-center">
                <span className="w-0.5 h-0.5 rounded-full bg-white block" />
              </div>
              <div className="w-2 h-2 rounded-full bg-[#0F0E14] flex items-center justify-center">
                <span className="w-0.5 h-0.5 rounded-full bg-white block" />
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
