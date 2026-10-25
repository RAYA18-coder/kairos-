/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useKairosStore } from '../store/useKairosStore';
import {
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Cpu,
  Lock,
  Compass,
  Zap,
  TrendingDown,
  ChevronDown,
} from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';
import { NotificationItem } from '../engine/types';
import { simulate } from '../engine/simulator';

export const LandingScreen: React.FC = () => {
  const setCurrentView = useKairosStore((s) => s.setCurrentView);
  const startExperiment = useKairosStore((s) => s.startExperiment);
  const activeProfileId = useKairosStore((s) => s.activeProfileId);
  const profiles = useKairosStore((s) => s.profiles);
  const twins = useKairosStore((s) => s.twins);
  const userState = useKairosStore((s) => s.userState);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeProfile = profiles[activeProfileId];
  const twin = twins[activeProfileId] || twins.arjun;

  // Mini live simulation before login
  const sampleNotifs: NotificationItem[] = [
    {
      id: 'mini_1',
      appName: 'Instagram',
      type: 'social_like',
      title: 'Instagram',
      body: 'Someone liked your post',
      senderImportance: 0.1,
      timestamp: Date.now(),
    },
    {
      id: 'mini_2',
      appName: 'Slack',
      type: 'work_msg',
      title: 'Slack #core',
      body: 'Alex: Are the updated API schemas ready?',
      senderImportance: 0.85,
      timestamp: Date.now(),
    },
    {
      id: 'mini_3',
      appName: 'System',
      type: 'otp',
      title: 'Security Verification',
      body: '849201 is your login confirmation code',
      senderImportance: 1.0,
      timestamp: Date.now(),
    },
  ];

  const [selectedMiniNotif, setSelectedMiniNotif] = useState(sampleNotifs[0]);
  const miniSimResult = simulate(userState, selectedMiniNotif, twin, 555);

  // Time-aware dynamic headline
  const currentHour = new Date().getHours();
  const getDynamicHeadline = () => {
    if (currentHour >= 21 || currentHour <= 2) {
      return 'Late-night focus window active. Protect your deepest code flow.';
    } else if (currentHour >= 5 && currentHour <= 10) {
      return 'Morning circadian acceleration. High resistance to detours.';
    } else if (currentHour >= 13 && currentHour <= 16) {
      return 'Post-meridian fatigue dip. Vulnerability to algorithmic extraction is elevated.';
    } else {
      return 'Evening transition window. Next deep-focus block opens in ~35 minutes.';
    }
  };

  return (
    <div ref={containerRef} className="relative z-10 w-full min-h-screen text-left pb-24 space-y-16">
      {/* SECTION 1: HERO (Dynamic State-Aware) */}
      <section className="min-h-[85dvh] flex flex-col justify-between px-6 pt-12 pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-sans font-light tracking-[0.25em] text-base text-white font-medium uppercase">
              KAIROS
            </span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-[#C6FF3D] font-mono">
              <ShieldCheck className="w-3 h-3 text-[#C6FF3D]" />
              <span>ON-DEVICE</span>
            </div>
          </div>

          <h1 className="text-3xl font-light text-white font-sans tracking-tight leading-tight">
            Your attention, simulated.
          </h1>

          <p className="text-xs text-zinc-300 font-sans leading-relaxed max-w-[340px]">
            {getDynamicHeadline()}
          </p>
        </div>

        {/* Hero Visual Space for 3D Attention Core behind */}
        <div className="my-auto py-12 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-500 mb-1">
            CIRCADIAN ATTENTION TWIN
          </span>
          <span className="text-5xl font-sans font-light text-white tabular-nums">
            {Math.round((twin.focusCurve.data.weekday[currentHour]?.probDeepFocus || 0.75) * 100)}%
          </span>
          <span className="text-xs font-mono text-[#C6FF3D] mt-1">
            Predicted Flow Probability at {currentHour}:00
          </span>
        </div>

        {/* Action CTAs */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              triggerHaptic('heavy');
              setCurrentView('app');
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#C6FF3D] hover:bg-[#b2eb30] text-black font-mono font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(198,255,61,0.25)]"
          >
            <span>CONTINUE AS {activeProfile?.config.name.toUpperCase() || 'ARJUN'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                triggerHaptic('medium');
                setCurrentView('builder');
              }}
              className="py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-zinc-300 transition-all text-center"
            >
              Build New Persona
            </button>

            <button
              onClick={() => {
                triggerHaptic('medium');
                setCurrentView('app');
                startExperiment();
              }}
              className="py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-[#C6FF3D] transition-all text-center"
            >
              90s Calibration
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: ATTENTION IS EXTRACTED */}
      <section className="px-6 space-y-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B4A]">
          01 • THE PROBLEM
        </span>
        <h2 className="text-2xl font-light text-white font-sans tracking-tight">
          Notifications fragment deep thought before it forms.
        </h2>
        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
          The modern attention economy optimizes for extraction: interrupting you when your
          cognitive barrier is fragile. KAIROS turns this around with a personal computational
          barrier that models attention friction before any alert sounds.
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-2xl font-light text-[#FF6B4A] font-sans tabular-nums">23m</span>
            <span className="text-[10px] text-zinc-500 font-mono block mt-1">
              Average recovery time after an algorithmic rabbit hole
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-2xl font-light text-[#C6FF3D] font-sans tabular-nums">100%</span>
            <span className="text-[10px] text-zinc-500 font-mono block mt-1">
              Private on-device inference with zero cloud telemetry
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 3: MEET YOUR TWIN */}
      <section className="px-6 space-y-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#C6FF3D]">
          02 • STATISTICAL TWIN
        </span>
        <h2 className="text-2xl font-light text-white font-sans tracking-tight">
          Six explainable modules learning your cognitive baseline.
        </h2>
        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
          No black-box neural networks. Hand-coded logistic regressions, Beta posteriors, and
          lognormal MLE fits decompose your attention habits into transparent factors.
        </p>

        <div className="space-y-2 pt-1 text-xs font-mono">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <span className="text-zinc-300">1. 24h Circadian Focus Curve</span>
            <span className="text-[#C6FF3D]">Wilson 95% Band</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <span className="text-zinc-300">2. Interruption Open Logistic Fit</span>
            <span className="text-zinc-400">L2 Regulated</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <span className="text-zinc-300">3. App Stickiness Lognormals</span>
            <span className="text-zinc-400">Median & P90</span>
          </div>
        </div>
      </section>

      {/* SECTION 4: WATCH IT PREDICT (Live Mini Simulation) */}
      <section className="px-6 space-y-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#C6FF3D]">
          03 • REAL SIMULATION
        </span>
        <h2 className="text-2xl font-light text-white font-sans tracking-tight">
          Counterfactual simulation before interruption.
        </h2>
        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
          Test the live simulation engine right now for {activeProfile?.config.name || 'Arjun'}:
        </p>

        {/* Live Mini Notification Chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {sampleNotifs.map((sn) => (
            <button
              key={sn.id}
              onClick={() => {
                triggerHaptic('selection');
                setSelectedMiniNotif(sn);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap border transition-all ${
                selectedMiniNotif.id === sn.id
                  ? 'bg-white/15 text-white border-white/30'
                  : 'bg-white/[0.03] text-zinc-500 border-white/[0.06]'
              }`}
            >
              {sn.appName} ({sn.type})
            </button>
          ))}
        </div>

        {/* Mini Result Card */}
        <div className="p-4 rounded-2xl bg-[#090d14] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white font-medium">
              {selectedMiniNotif.appName}: "{selectedMiniNotif.body}"
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                miniSimResult.verdict.decision === 'ALLOW NOW'
                  ? 'text-[#C6FF3D] border-[#C6FF3D]/40 bg-[#C6FF3D]/10'
                  : 'text-[#FF6B4A] border-[#FF6B4A]/40 bg-[#FF6B4A]/10'
              }`}
            >
              {miniSimResult.verdict.decision}
            </span>
          </div>

          <p className="text-xs text-zinc-300 font-sans">
            {miniSimResult.verdict.primaryReason}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-white/[0.06]">
            <div>
              <span className="text-[10px] text-zinc-500 block">P(Detour)</span>
              <span className="text-white font-light">
                {Math.round(miniSimResult.pDetour * 100)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">Focus Saved</span>
              <span className="text-[#C6FF3D] font-light">
                +{miniSimResult.counterfactual.focusMinutesSaved}m
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: PRIVATE BY DESIGN */}
      <section className="px-6 space-y-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#C6FF3D]">
          04 • PRIVACY CONSTITUTION
        </span>
        <h2 className="text-2xl font-light text-white font-sans tracking-tight">
          All on-device. Nothing leaves your phone.
        </h2>
        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
          KAIROS has no remote user database, no cloud telemetry, and no advertising trackers. All
          persona models, Monte Carlo iterations, and check-in logs reside in IndexedDB on this
          browser instance.
        </p>

        <div className="pt-4">
          <button
            onClick={() => {
              triggerHaptic('heavy');
              setCurrentView('app');
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#C6FF3D] hover:bg-[#b2eb30] text-black font-mono font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(198,255,61,0.25)]"
          >
            <span>ENTER KAIROS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
