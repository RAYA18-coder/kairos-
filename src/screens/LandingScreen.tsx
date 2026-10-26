/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useKairosStore } from '../store/useKairosStore';
import {
  GlassCard,
  ClayButton,
  ClayChip,
  ClayStat,
  NeuSegmented,
  BentoGrid,
  BentoTile,
} from '../components/ui/ReferenceComponents';
import { BrainsScene } from '../components/BrainsScene';
import { Badge } from '../components/ui/Badge';
import {
  ArrowRight,
  Sparkles,
  Lock,
  Cpu,
  BarChart3,
  GitFork,
  CheckCircle2,
  Trash2,
  Shield,
  Layers,
  Flame,
  Battery,
} from 'lucide-react';

export const LandingScreen: React.FC = () => {
  const setCurrentView = useKairosStore((s) => s.setCurrentView);
  const setActiveTab = useKairosStore((s) => s.setActiveTab);
  const startGuidedDemo = useKairosStore((s) => s.startGuidedDemo);
  const deleteEverything = useKairosStore((s) => s.deleteEverything);

  // Live mini-demo toggle state
  const [demoRole, setDemoRole] = useState<'coder' | 'creator'>('coder');
  const [demoNotif, setDemoNotif] = useState<'like' | 'collab'>('like');

  const openApp = () => {
    setCurrentView('app');
    setActiveTab('now');
  };

  // Verdict logic for the interactive role comparison widget
  const getDemoVerdict = () => {
    if (demoRole === 'coder') {
      if (demoNotif === 'like') {
        return {
          verdict: 'SUPPRESS',
          reason: 'Deep coding flow (35m). High detour risk into feed (predicted 17m lost).',
          saved: '+24m focus preserved',
        };
      } else {
        return {
          verdict: 'SUPPRESS',
          reason: 'Non-urgent cold outreach during focus block. Held for evening digest.',
          saved: '+18m focus preserved',
        };
      }
    } else {
      // Creator role
      if (demoNotif === 'like') {
        return {
          verdict: 'BATCH IN DIGEST',
          reason: 'Low priority engagement metrics queued for scheduled 21:00 batch review.',
          saved: '+9m focus preserved',
        };
      } else {
        return {
          verdict: 'ALLOW NOW',
          reason: 'High business utility: Verified brand sponsor inquiry for active campaign.',
          saved: 'Instant delivery',
        };
      }
    }
  };

  const demoResult = getDemoVerdict();

  return (
    <div className="w-full min-h-screen living-mesh-bg text-[#F2F7F3] flex flex-col selection:bg-[#7FE3C0]/20 selection:text-[#7FE3C0]">
      {/* Sticky Glass Nav */}
      <nav className="sticky top-0 z-40 w-full glass-nav px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-[#7FE3C0] shadow-md shadow-[#7FE3C0]/50" />
          <span className="font-bold text-base tracking-widest text-[#F2F7F3]">
            KAIROS
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-[rgba(242,247,243,0.65)]">
          <a href="#how-it-works" className="hover:text-[#F2F7F3] transition-colors">
            How It Works
          </a>
          <a href="#bento" className="hover:text-[#F2F7F3] transition-colors">
            Feature Bento
          </a>
          <a href="#demo" className="hover:text-[#F2F7F3] transition-colors">
            Live Role Widget
          </a>
          <a href="#trust" className="hover:text-[#F2F7F3] transition-colors">
            Empirical Trust
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={startGuidedDemo}
            className="text-xs font-semibold text-[#7FE3C0] hover:text-[#B8F27A] px-3 py-1.5 rounded-xl border border-[#7FE3C0]/30 hover:bg-[#7FE3C0]/10 transition-colors"
          >
            Judge Demo
          </button>
          <ClayButton variant="sage" size="sm" onClick={openApp} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Open App
          </ClayButton>
        </div>
      </nav>

      {/* Hero Section with Signature Merging Brains */}
      <section className="relative px-6 pt-16 pb-20 max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="flex-1 flex flex-col gap-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7FE3C0]/12 border border-[#7FE3C0]/30 text-[#7FE3C0] text-xs font-bold w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Personal Attention Digital Twin</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#F2F7F3] leading-[1.1]">
            Know what a notification will cost you,{' '}
            <span className="text-[#7FE3C0]">before you see it.</span>
          </h1>

          <p className="text-base sm:text-lg text-[rgba(242,247,243,0.65)] max-w-xl leading-relaxed">
            Your phone doesn't know you're in the zone. KAIROS runs a personal counterfactual digital twin right on your device, simulating both futures before deciding what gets through.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <ClayButton variant="sage" size="lg" onClick={openApp} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Try The Twin Live
            </ClayButton>
            <button
              onClick={() => {
                const el = document.getElementById('demo');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 rounded-3xl bg-[#0E2F22] text-[#F2F7F3] text-sm font-bold border border-white/10 hover:bg-[#153D2D] transition-colors"
            >
              See Interactive Comparison
            </button>
          </div>
        </div>

        {/* Hero Card with Merging Brains Point Cloud */}
        <div className="flex-1 flex justify-center w-full max-w-md">
          <GlassCard tilt className="w-full p-6 flex flex-col items-center relative">
            <div className="w-full flex items-center justify-between pb-2 border-b border-white/10">
              <Badge label="Twin Sync 64%" variant="provenance" />
              <span className="text-xs font-mono-numbers text-[#7FE3C0] font-bold">
                84% Focus Deep
              </span>
            </div>

            {/* Procedural WebGL Merging Brains Canvas */}
            <div className="w-full my-2">
              <BrainsScene merge={0.64} pulse={0.84} size={240} />
            </div>

            <div className="w-full flex items-center justify-between border-t border-white/10 pt-4 mt-2">
              <div className="flex flex-col text-left">
                <span className="text-[11px] text-[rgba(242,247,243,0.6)]">YOU (Biological)</span>
                <span className="text-sm font-bold text-[#FFC44D]">Coding Flow (35m)</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[11px] text-[rgba(242,247,243,0.6)]">TWIN (Silicon)</span>
                <span className="text-sm font-bold text-[#7FE3C0]">Absorbing Interruption</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* FEATURE BENTO (6 Mixed Tiles) */}
      <section id="bento" className="px-6 py-20 max-w-6xl mx-auto w-full flex flex-col gap-8">
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F2F7F3]">
            Spatial Cognitive Architecture
          </h2>
          <p className="text-sm sm:text-base text-[rgba(242,247,243,0.62)]">
            A 6-module mathematical twin calibrated strictly on-device.
          </p>
        </div>

        <BentoGrid className="mt-4">
          {/* Tile 1: Counterfactual Twin (2x2 Hero) */}
          <BentoTile span="2x2" className="flex flex-col justify-between gap-4 p-6 bg-gradient-to-br from-[#0F3B2C]/40 to-transparent">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-2xl bg-[#7FE3C0]/20 text-[#7FE3C0] flex items-center justify-center font-bold">
                <GitFork className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#F2F7F3] mt-2">
                Counterfactual Rollouts
              </h3>
              <p className="text-xs text-[rgba(242,247,243,0.65)] leading-relaxed">
                When an alert rings, the simulator runs 1,000 paired Monte Carlo trajectories: Future A (Shown Now) vs Future B (Held for Break). If detour cost exceeds information utility, it suppresses.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#0B251B] border border-white/10 flex items-center justify-between text-xs font-mono-numbers">
              <span className="text-[#FFC44D]">SHOWN: ~17m lost</span>
              <span className="text-[#7FE3C0] font-bold">SUPPRESSED: +24m saved</span>
            </div>
          </BentoTile>

          {/* Tile 2: Personal Importance (2x1) */}
          <BentoTile span="2x1" className="flex flex-col justify-between gap-3 p-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#FFC44D]/20 text-[#FFC44D] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#F2F7F3]">Hierarchical Bayesian Importance</h4>
                <p className="text-[11px] text-[rgba(242,247,243,0.6)]">App → Channel → Salted Sender</p>
              </div>
            </div>
            <p className="text-xs text-[rgba(242,247,243,0.65)]">
              Learns per person, not by app name. Instagram DMs are work for Creators, pure distraction for Developers.
            </p>
          </BentoTile>

          {/* Tile 3: Fatigue Accumulator (1x1) */}
          <BentoTile span="1x1" className="flex flex-col justify-between p-5">
            <div className="w-8 h-8 rounded-xl bg-[#FF6B4A]/20 text-[#FF6B4A] flex items-center justify-center">
              <Battery className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <span className="text-[10px] text-[rgba(242,247,243,0.6)] uppercase">Fatigue Load</span>
              <p className="text-2xl font-bold font-mono-numbers text-[#FFC44D]">λ +0.14/h</p>
            </div>
          </BentoTile>

          {/* Tile 4: On-Device Privacy (1x1) */}
          <BentoTile span="1x1" className="flex flex-col justify-between p-5">
            <div className="w-8 h-8 rounded-xl bg-[#7FE3C0]/20 text-[#7FE3C0] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <span className="text-[10px] text-[rgba(242,247,243,0.6)] uppercase">Privacy</span>
              <p className="text-sm font-bold text-[#7FE3C0]">Zero Cloud</p>
            </div>
          </BentoTile>

          {/* Tile 5: Empirical Proof (2x1) */}
          <BentoTile span="2x1" className="flex flex-col justify-between gap-3 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#7FE3C0]" />
                <h4 className="text-sm font-bold text-[#F2F7F3]">Held-Out Ground Truth</h4>
              </div>
              <Badge label="ECE ±3.8%" variant="accent" />
            </div>
            <p className="text-xs text-[rgba(242,247,243,0.65)]">
              Calibrated on 409 held-out events. Zero fake numbers, zero hallucinated predictions.
            </p>
          </BentoTile>
        </BentoGrid>
      </section>

      {/* LIVE MINI-DEMO STRIP: The Creator Problem Solved */}
      <section id="demo" className="w-full px-6 py-20 bg-[#071610] border-y border-white/10">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F2F7F3]">
              The Creator Problem: Importance is Personal
            </h2>
            <p className="text-sm sm:text-base text-[rgba(242,247,243,0.65)] max-w-xl">
              Toggle the archetype below to witness the twin adjust its verdict on the exact same app.
            </p>
          </div>

          {/* Interactive Widget Box */}
          <GlassCard className="w-full max-w-2xl p-6 flex flex-col gap-5 text-left">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
              {/* Role Toggle with NeuSegmented */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[rgba(242,247,243,0.65)] font-semibold">Your Archetype:</span>
                <NeuSegmented
                  options={[
                    { id: 'coder', label: 'Developer (Coder)' },
                    { id: 'creator', label: 'Content Creator' },
                  ]}
                  value={demoRole}
                  onChange={(r) => setDemoRole(r as any)}
                />
              </div>

              {/* Notification Type Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[rgba(242,247,243,0.65)] font-semibold">Signal:</span>
                <NeuSegmented
                  options={[
                    { id: 'like', label: 'Post Like' },
                    { id: 'collab', label: 'Brand Collab DM' },
                  ]}
                  value={demoNotif}
                  onChange={(n) => setDemoNotif(n as any)}
                />
              </div>
            </div>

            {/* Notification Card */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#0D241B] border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-pink-500 flex items-center justify-center font-bold text-white text-sm shrink-0">
                  IG
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F2F7F3]">
                    {demoNotif === 'like' ? 'Instagram' : 'Instagram Direct'}
                  </h4>
                  <p className="text-xs text-[rgba(242,247,243,0.65)] mt-0.5">
                    {demoNotif === 'like'
                      ? 'sarah_k and 14 others liked your reel'
                      : 'Acme Studio: We would love to sponsor your next video project!'}
                  </p>
                </div>
              </div>

              {/* Dynamic Verdict Chip */}
              <ClayChip verdict={demoResult.verdict} size="md" />
            </div>

            {/* Reason & Value */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-[#091D15] border border-white/5">
              <div className="text-xs text-[rgba(242,247,243,0.65)]">
                <strong className="text-[#F2F7F3]">Why: </strong>
                {demoResult.reason}
              </div>
              <div className="text-xs font-mono-numbers text-[#7FE3C0] font-bold shrink-0">
                {demoResult.saved}
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* HOW IT WORKS (3 Steps) */}
      <section id="how-it-works" className="px-6 py-20 max-w-5xl mx-auto w-full flex flex-col gap-12">
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#F2F7F3]">
            How Your Attention Twin Works
          </h2>
          <p className="text-[rgba(242,247,243,0.62)] text-sm sm:text-base">
            Statistical modeling replaces blunt do-not-disturb with mathematical precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="flex flex-col gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#7FE3C0]/20 text-[#7FE3C0] flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="text-lg font-bold text-[#F2F7F3]">Learn your attention</h3>
            <p className="text-xs text-[rgba(242,247,243,0.65)] leading-relaxed">
              Fits a 24-hour diurnal focus curve, app stickiness distributions, and fatigue buildup on-device.
            </p>
          </GlassCard>

          <GlassCard className="flex flex-col gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#FFC44D]/20 text-[#FFC44D] flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="text-lg font-bold text-[#F2F7F3]">Simulate both futures</h3>
            <p className="text-xs text-[rgba(242,247,243,0.65)] leading-relaxed">
              Forks the timeline at arrival: Future A if shown immediately vs Future B if held until your natural break.
            </p>
          </GlassCard>

          <GlassCard className="flex flex-col gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#B8F27A]/20 text-[#B8F27A] flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="text-lg font-bold text-[#F2F7F3]">Decide and explain</h3>
            <p className="text-xs text-[rgba(242,247,243,0.65)] leading-relaxed">
              Renders ALLOW, HOLD, BATCH, or SUPPRESS quoting exact simulated minutes and empirical reasons.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* FOOTER CTA */}
      <footer className="px-6 py-12 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-5xl mx-auto w-full text-xs text-[rgba(242,247,243,0.6)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#7FE3C0]" />
          <span className="font-bold text-[#F2F7F3]">KAIROS</span>
          <span>— Your attention twin. Your focus, protected.</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={startGuidedDemo} className="hover:text-[#F2F7F3] transition-colors">
            Run 60s Judge Demo
          </button>
          <button onClick={openApp} className="text-[#7FE3C0] hover:underline font-bold">
            Open Dashboard
          </button>
        </div>
      </footer>
    </div>
  );
};
