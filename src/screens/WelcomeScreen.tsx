/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BrainsScene } from '../components/BrainsScene';
import { ClayButton } from '../components/ui/ReferenceComponents';
import { Shield, Sparkles, ArrowRight, Brain } from 'lucide-react';

export interface WelcomeScreenProps {
  onStart: () => void;
  onExploreLanding: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onExploreLanding }) => {
  // Animate merge 0 -> 1 over 3.5 seconds
  const [mergeProgress, setMergeProgress] = useState(0.15);

  useEffect(() => {
    const timer = setInterval(() => {
      setMergeProgress((prev) => {
        if (prev < 0.95) return prev + 0.04;
        return 0.95;
      });
    }, 120);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full min-h-[100dvh] flex flex-col items-center justify-between p-6 overflow-hidden living-mesh-bg text-left select-none">
      {/* Background 3D Human Brains Merging WebGL Layer */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-95 pointer-events-none">
        <BrainsScene merge={mergeProgress} pulse={0.88} size={380} />
      </div>

      {/* Top Header Logo */}
      <div className="relative z-10 w-full flex items-center justify-between pt-safe">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00f5ff] shadow-md shadow-[#00f5ff]/60 animate-pulse" />
          <span className="font-extrabold text-sm tracking-widest text-[#f7f7f8] flex items-center gap-1.5">
            KAIROS
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#5FD1AB]/30 text-[#B8F27A] border border-[#7FE3C0]/30">
              v2.0
            </span>
          </span>
        </div>
        <button
          onClick={onExploreLanding}
          className="text-xs text-[#8b8988] hover:text-[#f7f7f8] flex items-center gap-1 transition-colors px-2.5 py-1 rounded-full bg-white/5 border border-white/10"
        >
          <span>SaaS Overview</span>
          <ArrowRight className="w-3 h-3 text-[#7FE3C0]" />
        </button>
      </div>

      {/* Floating Center Glass Card with Glowing Violet Edge Line */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 25, delay: 0.2 }}
        className="relative z-10 w-full max-w-[420px] glass-panel p-7 flex flex-col items-center text-center gap-5 my-auto violet-glow-line"
      >
        <div className="w-13 h-13 rounded-2xl bg-[#0F3B2C] text-[#00f5ff] flex items-center justify-center shadow-lg border border-[#7FE3C0]/40 shadow-[#5FD1AB]/30">
          <Brain className="w-6 h-6 text-[#00f5ff]" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#f7f7f8]">
            <span className="bg-gradient-to-r from-[#C9E4A5] via-[#7FE3C0] to-[#3FB58F] bg-clip-text text-transparent">
              KAIROS
            </span>
          </h1>
          <p className="text-sm font-bold text-[#B8F27A]">
            Your attention twin. Your focus, protected.
          </p>
          <p className="text-xs text-[#8b8988] max-w-xs mt-1 leading-relaxed">
            A personal counterfactual digital twin that absorbs incoming interruptions first, simulating both futures before deciding what gets through.
          </p>
        </div>

        {/* Live Merging Progress Indicator */}
        <div className="w-full flex items-center justify-between px-2 pt-2 border-t border-white/10 text-xs text-[#8b8988]">
          <span>YOU (Biological)</span>
          <span className="font-mono-numbers text-[#00f5ff] font-bold">
            Twin Sync {Math.round(mergeProgress * 100)}%
          </span>
          <span>TWIN (Silicon)</span>
        </div>

        <ClayButton
          variant="sage"
          size="lg"
          onClick={onStart}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="w-full mt-2"
        >
          Get Started
        </ClayButton>

        {/* Pagination Dots */}
        <div className="flex items-center gap-2 pt-2">
          <span className="w-6 h-1.5 rounded-full bg-[#7FE3C0] shadow-sm shadow-[#7FE3C0]/60" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>
      </motion.div>

      {/* Bottom Legal / Device Sovereignty note */}
      <div className="relative z-10 text-[11px] text-white/40 pb-safe">
        100% On-Device · Zero Cloud Telemetry · Privacy by Mathematical Proof
      </div>
    </div>
  );
};
