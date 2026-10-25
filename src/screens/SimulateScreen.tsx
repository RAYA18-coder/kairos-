/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useKairosStore } from '../store/useKairosStore';
import {
  ActivityType,
  AppName,
  NotificationItem,
  NotificationType,
} from '../engine/types';
import {
  Sparkles,
  Sliders,
  HelpCircle,
  ArrowRight,
  TrendingDown,
  Clock,
  ShieldAlert,
  Bot,
  RotateCw,
  Users,
  Sun,
  Shield,
} from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';
import { BottomSheet } from '../components/BottomSheet';

export const SimulateScreen: React.FC = () => {
  const simulation = useKairosStore((s) => s.simulation);
  const userState = useKairosStore((s) => s.userState);
  const activeNotification = useKairosStore((s) => s.activeNotification);
  const judgeMode = useKairosStore((s) => s.judgeMode);
  const sideBySideSimulations = useKairosStore((s) => s.sideBySideSimulations);
  const aiExplanation = useKairosStore((s) => s.aiExplanation);
  const isAiGenerating = useKairosStore((s) => s.isAiGenerating);

  const setUserState = useKairosStore((s) => s.setUserState);
  const setActiveNotification = useKairosStore((s) => s.setActiveNotification);
  const runSimulationNow = useKairosStore((s) => s.runSimulationNow);
  const runSideBySideSimulations = useKairosStore((s) => s.runSideBySideSimulations);
  const setJudgeMode = useKairosStore((s) => s.setJudgeMode);
  const requestAiExplanation = useKairosStore((s) => s.requestAiExplanation);

  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const [show4PeopleModal, setShow4PeopleModal] = useState(false);

  // Preset notification options
  const presetNotifications: NotificationItem[] = [
    {
      id: 'p_1',
      appName: 'Instagram',
      type: 'social_like',
      title: 'Instagram',
      body: 'Someone liked your post',
      senderImportance: 0.1,
      timestamp: Date.now(),
    },
    {
      id: 'p_2',
      appName: 'Slack',
      type: 'work_msg',
      title: 'Slack #engineering',
      body: 'Alex: Are the updated API schemas ready for review?',
      senderImportance: 0.85,
      timestamp: Date.now(),
    },
    {
      id: 'p_3',
      appName: 'System',
      type: 'otp',
      title: 'Security Verification',
      body: '849201 is your one-time verification code',
      senderImportance: 1.0,
      timestamp: Date.now(),
    },
    {
      id: 'p_4',
      appName: 'Reddit',
      type: 'promo',
      title: 'Reddit Promo',
      body: 'Trending post in communities you might like',
      senderImportance: 0.05,
      timestamp: Date.now(),
    },
    {
      id: 'p_5',
      appName: 'WhatsApp',
      type: 'dm',
      title: 'Maya',
      body: 'Hey, are you free for a quick call later?',
      senderImportance: 0.72,
      timestamp: Date.now(),
    },
  ];

  const activities: ActivityType[] = ['coding', 'studying', 'reading', 'writing', 'idle'];

  const getVerdictBadge = () => {
    switch (simulation.verdict.decision) {
      case 'ALLOW NOW':
        return {
          bg: 'bg-[#C6FF3D]/10 border-[#C6FF3D]/40 text-[#C6FF3D]',
          label: simulation.verdict.isSafetyRule ? 'ALLOW NOW (SAFETY RULE)' : 'ALLOW NOW',
        };
      case 'HOLD UNTIL NEXT BREAK':
        return {
          bg: 'bg-amber-400/10 border-amber-400/40 text-amber-400',
          label: 'HOLD FOR BREAK',
        };
      case 'BATCH IN DIGEST':
        return {
          bg: 'bg-sky-400/10 border-sky-400/40 text-sky-400',
          label: 'BATCH IN DIGEST',
        };
      case 'SUPPRESS':
        return {
          bg: 'bg-[#FF6B4A]/10 border-[#FF6B4A]/40 text-[#FF6B4A]',
          label: 'SUPPRESS',
        };
    }
  };

  const badge = getVerdictBadge();

  return (
    <div className="relative z-10 min-h-[calc(100dvh-130px)] px-4 py-3 pb-32 space-y-4">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">
            ATTENTION COUNTERFACTUAL
          </span>
          <h2 className="text-lg font-light text-white font-sans">Simulation Engine</h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              triggerHaptic('medium');
              runSideBySideSimulations();
              setShow4PeopleModal(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-mono border bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:text-white"
          >
            <Users className="w-3.5 h-3.5 text-[#C6FF3D]" />
            <span>4 PERSONAS</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              setJudgeMode(!judgeMode);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-mono border transition-all ${
              judgeMode
                ? 'bg-[#C6FF3D]/15 border-[#C6FF3D]/40 text-[#C6FF3D]'
                : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>JUDGE MODE</span>
          </button>
        </div>
      </div>

      {/* WHAT-IF TIME SCRUBBER: Drag the hour of day and watch verdict flip */}
      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>WHAT-IF TIME SCRUBBER: {userState.hour}:00</span>
          </span>
          <span className="text-zinc-500 text-[10px]">Hour of Day Sensitivity</span>
        </div>

        <input
          type="range"
          min="0"
          max="23"
          value={userState.hour}
          onChange={(e) => {
            triggerHaptic('selection');
            setUserState({ hour: Number(e.target.value) });
          }}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#C6FF3D]"
        />
        <div className="flex justify-between text-[9px] font-mono text-zinc-600">
          <span>00:00 (Night)</span>
          <span>08:00 (Morning)</span>
          <span>14:00 (Dip)</span>
          <span>22:00 (Late Peak)</span>
        </div>
      </div>

      {/* JUDGE MODE SLIDERS: Live parametric proving */}
      {judgeMode && (
        <div className="p-4 rounded-2xl bg-[#0e121a]/95 border border-[#C6FF3D]/30 backdrop-blur-md space-y-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-mono text-[#C6FF3D]">
            <span>LIVE PARAMETRIC PROVING</span>
            <span className="text-[10px] text-zinc-400">Monte Carlo 500 Runs</span>
          </div>

          {/* Slider 1: Fatigue Level */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-zinc-400">Cognitive Fatigue:</span>
              <span className="text-white font-medium">
                {Math.round(userState.fatigue * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(userState.fatigue * 100)}
              onChange={(e) => {
                setUserState({ fatigue: Number(e.target.value) / 100 });
              }}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#C6FF3D]"
            />
          </div>

          {/* Slider 2: Minutes Into Focus Block */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-zinc-400">Focus Block Duration:</span>
              <span className="text-white font-medium">{userState.minutesIntoFocusBlock}m</span>
            </div>
            <input
              type="range"
              min="5"
              max="90"
              value={userState.minutesIntoFocusBlock}
              onChange={(e) => {
                setUserState({ minutesIntoFocusBlock: Number(e.target.value) });
              }}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#C6FF3D]"
            />
          </div>
        </div>
      )}

      {/* Context Selection Chips */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono tracking-wider uppercase text-zinc-500">
          CURRENT COGNITIVE CONTEXT
        </label>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {activities.map((act) => {
            const isActive = userState.activity === act;
            return (
              <button
                key={act}
                onClick={() => {
                  triggerHaptic('selection');
                  setUserState({ activity: act });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono capitalize transition-all ${
                  isActive
                    ? 'bg-white/15 text-white border border-white/30'
                    : 'bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:text-white'
                }`}
              >
                {act}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification Selection Chips */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono tracking-wider uppercase text-zinc-500">
          INCOMING SIGNAL TO TEST
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {presetNotifications.map((n) => {
            const isSelected = activeNotification.id === n.id;
            return (
              <button
                key={n.id}
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveNotification(n);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-white/[0.08] border-[#C6FF3D]/50 text-white'
                    : 'bg-white/[0.02] border-white/[0.05] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="truncate pr-2">
                  <span className="text-xs font-medium font-sans text-zinc-200 block truncate">
                    {n.appName} • {n.title}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-sans truncate block">
                    "{n.body}"
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 shrink-0">
                  {n.type}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RE-SIMULATE TRIGGER */}
      <button
        onClick={() => {
          triggerHaptic('heavy');
          runSimulationNow();
        }}
        className="w-full py-3 px-4 rounded-2xl bg-[#C6FF3D] hover:bg-[#b2eb30] text-black font-mono font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-98 shadow-[0_0_20px_rgba(198,255,61,0.25)]"
      >
        <RotateCw className="w-4 h-4" />
        <span>RE-SIMULATE ATTENTION CASCADE</span>
      </button>

      {/* 3D Timeline Legend (3D TubeGeometry Ribbons Behind) */}
      <div className="p-3.5 rounded-2xl bg-[#090d14]/80 border border-white/[0.08] backdrop-blur-md">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className="text-zinc-400">3D SPLIT-TIMELINE (0–90 MIN)</span>
          <span className="text-zinc-500 text-[10px]">Dual Ribbon Depth Projection</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-full bg-[#C6FF3D]" />
            <span className="text-zinc-300">Timeline B (Suppress)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-full bg-[#FF6B4A]" />
            <span className="text-zinc-300">Timeline A (Allow)</span>
          </div>
        </div>

        <div className="mt-2 text-[11px] text-zinc-400 font-sans">
          The glowing area between ribbons represents{' '}
          <span className="text-[#C6FF3D] font-mono font-medium">
            +{simulation.counterfactual.focusMinutesSaved} min
          </span>{' '}
          of cognitive flow protected [
          {simulation.counterfactual.focusMinutesSavedInterval[0]}–
          {simulation.counterfactual.focusMinutesSavedInterval[1]}m].
        </div>
      </div>

      {/* VERDICT & EXPLANATION CARD */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500">
            TWIN VERDICT
          </span>
          <div
            className={`px-3 py-1 rounded-full border text-xs font-mono tracking-wider font-semibold ${badge.bg}`}
          >
            {badge.label}
          </div>
        </div>

        <p className="text-sm font-sans font-normal text-zinc-200">
          {simulation.verdict.primaryReason}
        </p>

        {/* Computed Top Factors */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {simulation.verdict.topFactors.map((factor, i) => (
            <span
              key={i}
              className="text-[11px] font-mono text-zinc-400 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]"
            >
              • {factor}
            </span>
          ))}
        </div>

        {/* Bottom Sheet Trigger & AI Summary */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsWhyOpen(true);
            }}
            className="text-xs font-mono text-[#C6FF3D] hover:underline flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why this verdict? (View factors)</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              requestAiExplanation();
            }}
            disabled={isAiGenerating}
            className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <Bot className="w-3.5 h-3.5 text-zinc-400" />
            <span>{isAiGenerating ? 'Generating...' : 'Summary'}</span>
          </button>
        </div>

        {aiExplanation && (
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-sans text-zinc-300 leading-relaxed animate-in fade-in">
            <span className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">
              Automotive Summary:
            </span>
            {aiExplanation}
          </div>
        )}
      </div>

      {/* METRIC BREAKDOWN */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <span className="text-[10px] text-zinc-500 font-mono uppercase block">P(Detour)</span>
          <span className="text-xl font-light font-sans text-white tabular-nums">
            {Math.round(simulation.pDetour * 100)}%
          </span>
          <span className="text-[10px] text-zinc-500 block mt-0.5">Feed open probability</span>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <span className="text-[10px] text-zinc-500 font-mono uppercase block">Detour Min</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-light font-sans text-white tabular-nums">
              {simulation.expectedDetourMinutes}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">m</span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            [{simulation.detourRange[0]}–{simulation.detourRange[1]}m]
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <span className="text-[10px] text-zinc-500 font-mono uppercase block">Resume Delay</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-light font-sans text-white tabular-nums">
              {simulation.expectedResumptionDelay}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">m</span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            [{simulation.resumptionRange[0]}–{simulation.resumptionRange[1]}m]
          </span>
        </div>
      </div>

      {/* BRANCH PROBABILITY TREE (Run-Computed Probabilities and Losses) */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400 uppercase">Branch Probability Tree</span>
          <span className="text-[10px] text-zinc-500">500 Iterations</span>
        </div>

        <div className="space-y-2">
          {simulation.branches.map((b) => (
            <div key={b.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300">
                  {b.label} (~{b.expectedLossMinutes}m loss)
                </span>
                <span className="text-white font-medium">{Math.round(b.probability * 100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round(b.probability * 100)}%`,
                    backgroundColor: b.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SAME NOTIFICATION, 4 PEOPLE MODAL */}
      <BottomSheet
        isOpen={show4PeopleModal}
        onClose={() => setShow4PeopleModal(false)}
        title="Same Notification, 4 People"
        subtitle={`Testing '${activeNotification.appName}' across 4 distinct attention twins`}
      >
        <div className="space-y-3">
          {sideBySideSimulations &&
            Object.entries(sideBySideSimulations).map(([personaId, res]) => (
              <div
                key={personaId}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-mono font-medium text-white uppercase block">
                    {personaId}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-sans">
                    P(Open): {Math.round(res.pOpen * 100)}% • Loss: ~
                    {res.expectedFocusLossMinutes}m
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    res.verdict.decision === 'ALLOW NOW'
                      ? 'text-[#C6FF3D] border-[#C6FF3D]/40 bg-[#C6FF3D]/10'
                      : 'text-[#FF6B4A] border-[#FF6B4A]/40 bg-[#FF6B4A]/10'
                  }`}
                >
                  {res.verdict.decision}
                </span>
              </div>
            ))}
        </div>
      </BottomSheet>

      {/* WHY BOTTOM SHEET */}
      <BottomSheet
        isOpen={isWhyOpen}
        onClose={() => setIsWhyOpen(false)}
        title="Decision Decomposition"
        subtitle="Transparent terms computed from /engine"
      >
        <div className="space-y-3.5">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-xs font-mono text-[#C6FF3D] uppercase block mb-1">
              Attention Cost: {simulation.verdict.attentionCostScore} / 100
            </span>
            <p className="text-xs text-zinc-300 font-sans">
              Weighted by expected focus loss ({simulation.expectedFocusLossMinutes}m), mental
              fatigue baseline ({Math.round(userState.fatigue * 100)}%), and active session depth.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-xs font-mono text-zinc-200 uppercase block mb-1">
              Information Utility: {simulation.verdict.utilityScore} / 100
            </span>
            <p className="text-xs text-zinc-300 font-sans">
              Derived from learned Beta posterior of meaningful actions on {activeNotification.type}{' '}
              signals and sender importance ({Math.round(activeNotification.senderImportance * 100)}
              %).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-xs font-mono text-zinc-200 uppercase block mb-1">
              Counterfactual Paired Net Gain
            </span>
            <p className="text-xs text-zinc-300 font-sans">
              Holding this signal preserves{' '}
              <strong className="text-[#C6FF3D]">
                +{simulation.counterfactual.focusMinutesSaved} min
              </strong>{' '}
              unbroken attention and avoids{' '}
              <strong className="text-white">
                +{simulation.counterfactual.resumeDelayAvoided} min
              </strong>{' '}
              of mental reorientation delay.
            </p>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
