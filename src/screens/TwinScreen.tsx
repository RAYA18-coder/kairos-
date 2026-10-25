/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useKairosStore } from '../store/useKairosStore';
import {
  Compass,
  Zap,
  Flame,
  Award,
  Battery,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';
import {
  FocusCurvePoint,
  StickyContentInfo,
} from '../engine/types';

export const TwinScreen: React.FC = () => {
  const activePersona = useKairosStore((s) => s.activePersona);
  const twins = useKairosStore((s) => s.twins);
  const userState = useKairosStore((s) => s.userState);
  const twinDiffs = useKairosStore((s) => s.twinDiffs);
  const checkIns = useKairosStore((s) => s.checkIns);
  const setActivePersona = useKairosStore((s) => s.setActivePersona);

  const [activeModuleTab, setActiveModuleTab] = useState<number>(0);
  const [selectedHour, setSelectedHour] = useState<number>(userState.hour);

  const twin = twins[activePersona] || twins.arjun;

  const modules = [
    { id: 0, title: 'Focus Curve', icon: Compass },
    { id: 1, title: 'Interruption Triggers', icon: Zap },
    { id: 2, title: 'Sticky Content', icon: Flame },
    { id: 3, title: 'Notification Value', icon: Award },
    { id: 4, title: 'Fatigue Model', icon: Battery },
    { id: 5, title: 'Fragmentation Index', icon: Layers },
  ];

  const currentHourPoint =
    twin.focusCurve.data.weekday.find((p: FocusCurvePoint) => p.hour === selectedHour) || {
      hour: selectedHour,
      probDeepFocus: 0.7,
      ciLower: 0.58,
      ciUpper: 0.82,
    };

  return (
    <div className="relative z-10 min-h-[calc(100dvh-130px)] px-4 py-3 pb-32 space-y-4">
      {/* Top Title */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">
              NEURAL ARCHITECTURE
            </span>
            <h2 className="text-lg font-light text-white font-sans">Twin Internal Models</h2>
          </div>

          <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
            {(['arjun', 'meera', 'kabir', 'you'] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  triggerHaptic('selection');
                  setActivePersona(p);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-mono capitalize transition-all ${
                  activePersona === p
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-zinc-400 font-sans mt-1">
          3D 24-hour radial Focus Clock active above. Six explainable statistical modules below.
        </p>
      </div>

      {/* 24-Hour Focus Clock Interactive Dial Card */}
      <div className="p-4 rounded-2xl bg-[#090d14]/80 border border-white/[0.08] backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400 uppercase">Interactive Hour Inspection</span>
          <span className="text-[#C6FF3D]">Selected: {selectedHour}:00</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-light text-white font-sans tabular-nums">
                {Math.round(currentHourPoint.probDeepFocus * 100)}
              </span>
              <span className="text-xs text-[#C6FF3D] font-mono">% Deep Focus</span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Wilson 95% Band: [{Math.round(currentHourPoint.ciLower * 100)}% –{' '}
              {Math.round(currentHourPoint.ciUpper * 100)}%]
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">
              Hour Sample Size
            </span>
            <span className="text-sm font-mono text-zinc-300">
              n = {Math.round(twin.focusCurve.sampleSize / 24)} sessions
            </span>
          </div>
        </div>

        {/* 24-Hour Horizontal Slider / Scrubber */}
        <div className="pt-2">
          <input
            type="range"
            min="0"
            max="23"
            value={selectedHour}
            onChange={(e) => {
              triggerHaptic('selection');
              setSelectedHour(Number(e.target.value));
            }}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#C6FF3D]"
          />
          <div className="flex justify-between text-[9px] font-mono text-zinc-600 mt-1">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </div>
      </div>

      {/* Twin Diff: Personal Calibration vs Archetype Prior */}
      {(activePersona === 'you' || twinDiffs.length > 0) && (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#C6FF3D]/30 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#C6FF3D]" />
              <span className="text-xs font-mono uppercase tracking-wider text-white">
                TWIN DIFF: PERSONAL CALIBRATION
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#C6FF3D] px-2 py-0.5 rounded bg-[#C6FF3D]/10">
              BAYESIAN UPDATED
            </span>
          </div>
          <p className="text-xs text-zinc-300 font-sans leading-relaxed">
            Compares your personal calibrated twin ({checkIns.length} check-ins logged) against the
            archetype prior. Real device responses are weighted 2.0x.
          </p>
          {twinDiffs.length > 0 ? (
            <div className="space-y-2 pt-1">
              {twinDiffs.map((diff, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1 text-xs font-mono"
                >
                  <div className="flex justify-between text-zinc-300">
                    <span>
                      {diff.moduleName}: {diff.metricLabel}
                    </span>
                    <span
                      className={
                        diff.deltaPercent.startsWith('+') ? 'text-[#C6FF3D]' : 'text-amber-400'
                      }
                    >
                      {diff.deltaPercent}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Archetype Prior: {diff.priorValue}</span>
                    <span>Your Signal: {diff.personalValue}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] font-mono text-zinc-400">
              Personal signals loaded from 90-second experiment. Log active check-ins on NOW screen to observe live parameter divergence.
            </div>
          )}
        </div>
      )}

      {/* Module Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {modules.map((m) => {
          const Icon = m.icon;
          const isActive = activeModuleTab === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                triggerHaptic('selection');
                setActiveModuleTab(m.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono whitespace-nowrap border transition-all ${
                isActive
                  ? 'bg-white/10 text-white border-white/20'
                  : 'bg-white/[0.02] text-zinc-500 border-white/[0.05] hover:text-zinc-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{m.title}</span>
            </button>
          );
        })}
      </div>

      {/* ACTIVE MODULE DETAIL CARD */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-md space-y-4">
        {/* Module Header with Sample Size & Confidence */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-medium text-white font-sans">
              {modules[activeModuleTab].title}
            </h3>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Explainable statistical inference
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-zinc-400">
              n = {twin.focusCurve.sampleSize}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                twin.focusCurve.confidence === 'high'
                  ? 'bg-[#C6FF3D]/10 text-[#C6FF3D]'
                  : 'bg-amber-400/10 text-amber-400'
              }`}
            >
              {twin.focusCurve.confidence} CONFIDENCE
            </span>
          </div>
        </div>

        {/* Dynamic Content based on selected module */}
        {activeModuleTab === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              Models probability of deep focus as a function of hour of the day and day type. Wilson
              score intervals bound the true probability with 95% coverage.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-zinc-500 text-[10px] block">PEAK HOUR</span>
                <span className="text-white text-base font-light">22:00</span>
                <span className="text-[#C6FF3D] text-[10px] block">92% probability</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-zinc-500 text-[10px] block">TROUGH HOUR</span>
                <span className="text-white text-base font-light">05:00</span>
                <span className="text-zinc-400 text-[10px] block">5% probability</span>
              </div>
            </div>
          </div>
        )}

        {activeModuleTab === 1 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-300 font-sans leading-relaxed mb-2">
              L2-regularized logistic regression predicting interruption probability and flow diversion (Accuracy: {Math.round(twin.interruptionModel.data.accuracy * 100)}%).
            </p>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                <span className="text-zinc-300">Fatigue Weight (Log-odds)</span>
                <span className="text-[#FF6B4A]">+{twin.interruptionModel.data.fatigueWeight.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                <span className="text-zinc-300">Recent Switches Weight</span>
                <span className="text-amber-400">+{twin.interruptionModel.data.recentSwitchesWeight.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                <span className="text-zinc-300">Sender Importance Weight</span>
                <span className="text-[#C6FF3D]">+{twin.interruptionModel.data.senderImportanceWeight.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {activeModuleTab === 2 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-300 font-sans leading-relaxed mb-2">
              Lognormal session duration MLE fits across sink applications.
            </p>
            {twin.stickyContent.data.slice(0, 5).map((s: StickyContentInfo) => (
              <div
                key={s.appName}
                className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="text-white font-medium block">{s.appName}</span>
                  <span className="text-[10px] text-zinc-500">n = {s.sampleCount}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#C6FF3D] block">Median: {s.medianMinutes}m</span>
                  <span className="text-zinc-500 text-[10px]">P90: {s.p90Minutes}m</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeModuleTab === 3 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-300 font-sans leading-relaxed mb-2">
              Beta posterior utility distributions comparing meaningful action against extraction risk.
            </p>
            {twin.notificationValue.data.slice(0, 6).map((nv) => (
              <div
                key={nv.type}
                className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="text-white uppercase">{nv.type}</span>
                  <span className="text-[10px] text-zinc-500 block">n = {nv.sampleCount}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#C6FF3D] font-medium block">
                    {Math.round(nv.probActedMeaningfully * 100)}% Utility
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    [{Math.round(nv.ciLower * 100)}% – {Math.round(nv.ciUpper * 100)}%]
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeModuleTab === 4 && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              Continuous linear cognitive fatigue fit (R² = {twin.fatigueModel.data.rSquared.toFixed(2)}, n = {twin.fatigueModel.data.sampleCount}).
            </p>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-zinc-400">Baseline fatigue intercept:</span>
                <span className="text-white font-medium">{twin.fatigueModel.data.intercept.toFixed(3)}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-zinc-400">Slope per minute since break:</span>
                <span className="text-[#FF6B4A] font-medium">+{twin.fatigueModel.data.minutesSinceBreakSlope.toFixed(4)}/min</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-zinc-400">Slope per recent app-switch:</span>
                <span className="text-amber-400 font-medium">+{twin.fatigueModel.data.switchesSlope.toFixed(4)}/switch</span>
              </div>
            </div>
          </div>
        )}

        {activeModuleTab === 5 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-300 font-sans leading-relaxed mb-2">
              Calculates task resumption delays and focus block shortening across distracted applications.
            </p>
            {twin.fragmentationIndex.data.slice(0, 5).map((f) => (
              <div
                key={f.appName}
                className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="text-white font-medium block">{f.appName}</span>
                  <span className="text-[10px] text-zinc-500">n = {f.sampleCount}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#FF6B4A] block">+{f.meanResumptionDelayMinutes.toFixed(1)}m delay</span>
                  <span className="text-zinc-500 text-[10px]">Shortens next: -{f.nextBlockShorteningMinutes.toFixed(1)}m</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Top 3 Feature Contributions */}
        <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
            Top 3 Feature Contributions:
          </span>
          {twin.focusCurve.topFeatures.map(
            (feat: { name: string; impact: string; weight: number }, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs font-mono text-zinc-400"
              >
                <span>{feat.name}</span>
                <span className="text-zinc-200">{feat.impact}</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
