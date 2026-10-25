/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useKairosStore } from '../store/useKairosStore';
import {
  Clock,
  BatteryCharging,
  Shield,
  Sparkles,
  Check,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export const NowScreen: React.FC = () => {
  const userState = useKairosStore((s) => s.userState);
  const activeProfileId = useKairosStore((s) => s.activeProfileId);
  const profiles = useKairosStore((s) => s.profiles);
  const twins = useKairosStore((s) => s.twins);
  const attentionSavedTodayMinutes = useKairosStore((s) => s.attentionSavedTodayMinutes);
  const logCheckIn = useKairosStore((s) => s.logCheckIn);
  const setActiveTab = useKairosStore((s) => s.setActiveTab);

  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);

  const profile = profiles[activeProfileId];
  const twin = twins[activeProfileId] || twins.arjun;
  const provenance = twin.focusCurve.provenance;

  const currentHourPoint = twin.focusCurve.data.weekday[userState.hour] || {
    probDeepFocus: 0.75,
  };
  const focusPercentage = Math.round(
    currentHourPoint.probDeepFocus * (1 - userState.fatigue * 0.45) * 100
  );

  // 12-hour forecast strip starting from current hour
  const forecastHours = Array.from({ length: 12 }, (_, i) => (userState.hour + i) % 24);

  // Compute next golden peak window
  const goldenWindows = [21, 22, 23, 0, 1, 6, 7, 8, 9];
  const nextGoldenHour =
    goldenWindows.find((h) => h !== userState.hour && (h > userState.hour || userState.hour > 22)) ||
    22;

  const handleCheckIn = (type: 'flow' | 'distracted' | 'tired', label: string) => {
    triggerHaptic('medium');
    logCheckIn(type);
    setLastCheckIn(label);
    setTimeout(() => setLastCheckIn(null), 3000);
  };

  return (
    <div className="relative z-10 flex flex-col justify-between min-h-[calc(100dvh-130px)] px-5 py-4 pb-28 space-y-4">
      {/* Top Status & Provenance Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF3D]" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-300">
              {userState.activity}: {userState.minutesIntoFocusBlock}m active
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-400 text-xs font-mono">
            <BatteryCharging className="w-3.5 h-3.5 text-zinc-400" />
            <span>Fatigue {Math.round(userState.fatigue * 100)}%</span>
          </div>
        </div>

        {/* Provenance badge */}
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-zinc-500">
            Twin: <strong className="text-zinc-300">{profile?.config.name || 'Arjun'}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-zinc-400 text-[10px]">
            PROVENANCE: {provenance}
          </span>
        </div>
      </div>

      {/* Hero Cognitive Depth (Spacious negative space around 3D core) */}
      <div className="my-auto py-10 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-500 mb-1">
          CURRENT COGNITIVE DEPTH
        </span>
        <div className="flex items-baseline justify-center">
          <span className="text-7xl font-sans font-light tracking-tight text-white tabular-nums">
            {focusPercentage}
          </span>
          <span className="text-2xl font-light text-[#C6FF3D] font-mono ml-1">%</span>
        </div>
        <p className="text-xs font-mono text-zinc-400 mt-2 tracking-wide">
          {focusPercentage >= 75
            ? 'Deep Flow State'
            : focusPercentage >= 50
            ? 'Moderate Concentration'
            : 'Fragile Focus • Interruption Hazard'}
        </p>

        {/* Quick Simulator CTA */}
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('simulate');
          }}
          className="mt-5 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-zinc-300 transition-all hover:scale-102"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C6FF3D]" />
          <span>Simulate Counterfactual Interruption</span>
        </button>
      </div>

      {/* 12-Hour Focus Forecast Strip */}
      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-500">
          <span>12-Hour Attention Forecast</span>
          <span className="text-zinc-400">Circadian Baseline</span>
        </div>

        <div className="grid grid-cols-6 gap-1 pt-1">
          {forecastHours.slice(0, 6).map((h) => {
            const pt = twin.focusCurve.data.weekday[h];
            const prob = pt ? Math.round(pt.probDeepFocus * 100) : 50;
            const isNow = h === userState.hour;
            return (
              <div
                key={h}
                className={`p-1.5 rounded-lg text-center font-mono ${
                  isNow ? 'bg-white/10 border border-white/20' : 'bg-white/[0.02]'
                }`}
              >
                <span className="text-[9px] text-zinc-500 block">{h}:00</span>
                <span
                  className={`text-xs font-light tabular-nums ${
                    prob >= 75 ? 'text-[#C6FF3D]' : prob >= 45 ? 'text-zinc-300' : 'text-zinc-500'
                  }`}
                >
                  {prob}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Automotive Instrument Cards */}
      <div className="space-y-3">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Attention Saved Today */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-wider mb-1">
              <Shield className="w-3 h-3 text-[#C6FF3D]" />
              <span>Protected Today</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-sans font-light text-white tabular-nums">
                +{attentionSavedTodayMinutes}
              </span>
              <span className="text-xs text-zinc-400 font-mono">min</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">Sum of counterfactuals held</p>
          </div>

          {/* Next Golden Window */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-wider mb-1">
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>Next Peak</span>
            </div>
            <div className="text-2xl font-sans font-light text-white tabular-nums">
              {nextGoldenHour}:00
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">Optimal cognitive window</p>
          </div>
        </div>

        {/* Teach Your Twin (Check-In) */}
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500">
              TEACH YOUR TWIN (MOMENTARY SIGNAL)
            </span>
            {lastCheckIn && (
              <span className="text-[10px] text-[#C6FF3D] font-mono flex items-center gap-1 animate-pulse">
                <Check className="w-3 h-3" /> Logged: {lastCheckIn}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleCheckIn('flow', 'In Flow')}
              className="py-2.5 px-2 rounded-xl bg-white/[0.04] hover:bg-[#C6FF3D]/10 hover:border-[#C6FF3D]/30 border border-white/[0.08] text-xs font-mono text-zinc-300 hover:text-[#C6FF3D] transition-all flex flex-col items-center gap-1"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>In Flow</span>
            </button>
            <button
              onClick={() => handleCheckIn('distracted', 'Distracted')}
              className="py-2.5 px-2 rounded-xl bg-white/[0.04] hover:bg-[#FF6B4A]/10 hover:border-[#FF6B4A]/30 border border-white/[0.08] text-xs font-mono text-zinc-300 hover:text-[#FF6B4A] transition-all flex flex-col items-center gap-1"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Distracted</span>
            </button>
            <button
              onClick={() => handleCheckIn('tired', 'Fatigued')}
              className="py-2.5 px-2 rounded-xl bg-white/[0.04] hover:bg-zinc-700/30 border border-white/[0.08] text-xs font-mono text-zinc-300 transition-all flex flex-col items-center gap-1"
            >
              <BatteryCharging className="w-3.5 h-3.5" />
              <span>Fatigued</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
