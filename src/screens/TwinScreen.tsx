/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useKairosStore } from '../store/useKairosStore';
import {
  GlassCard,
  ClayStat,
  NeuSegmented,
  NeuSlider,
  BentoGrid,
  BentoTile,
} from '../components/ui/ReferenceComponents';
import { FocusClockChart } from '../components/charts/FocusClockChart';
import {
  Compass,
  Zap,
  Flame,
  Battery,
  Layers,
  History,
  Cpu,
  ShieldCheck,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const TwinScreen: React.FC = () => {
  const activePersona = useKairosStore((s) => s.activePersona);
  const twins = useKairosStore((s) => s.twins);
  const userState = useKairosStore((s) => s.userState);
  const twinDiffs = useKairosStore((s) => s.twinDiffs);
  const checkIns = useKairosStore((s) => s.checkIns);
  const role = useKairosStore((s) => s.role);

  const [activeTab, setActiveTab] = useState<'modules' | 'diff'>('modules');
  const [selectedHour, setSelectedHour] = useState(userState.hour);
  const [twinSync, setTwinSync] = useState(84);

  const twin = twins[activePersona] || twins.arjun;
  const currentHourPoint = twin.focusCurve.data.weekday[selectedHour] || {
    probDeepFocus: 0.75,
    ciLower: 0.62,
    ciUpper: 0.88,
    sampleSize: 180,
  };

  const hourlyCurve = twin.focusCurve.data.weekday.map((p) => p.probDeepFocus);

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-28 text-left animate-in fade-in duration-200">
      {/* 1. Header & Tab Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7FE3C0]" />
            <span className="text-xs font-semibold text-[#7FE3C0] uppercase tracking-wider">
              Bayesian Cognitive Model
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2F7F3] mt-0.5">
            Learned Twin
          </h1>
        </div>

        <div className="w-48">
          <NeuSegmented
            value={activeTab}
            onChange={(val) => setActiveTab(val as any)}
            options={[
              { id: 'modules', label: '6 Modules' },
              { id: 'diff', label: 'Twin Diff' },
            ]}
          />
        </div>
      </div>

      {/* 2. Twin Sync & Calibration Hero Tile */}
      <GlassCard className="p-5 flex flex-col gap-4 border border-[#7FE3C0]/20 bg-[#0B2A1E]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0E2F22] text-[#7FE3C0] border border-[#7FE3C0]/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#F2F7F3]">
                Twin Synchronization Level
              </span>
              <p className="text-[11px] text-[rgba(242,247,243,0.62)]">
                Persona: <strong className="text-[#7FE3C0] capitalize">{activePersona}</strong> ({role}) · N={twin.focusCurve.sampleSize + twin.interruptionModel.sampleSize} total telemetry logs
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold font-mono-numbers text-[#7FE3C0]">
              {twinSync}%
            </span>
          </div>
        </div>

        <NeuSlider
          label="Model Fidelity Coupling"
          value={twinSync}
          onChange={setTwinSync}
        />
      </GlassCard>

      {activeTab === 'diff' ? (
        /* Twin Before vs After Data Diff View */
        <div className="flex flex-col gap-4">
          <GlassCard className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F2F7F3] flex items-center gap-2">
                <History className="w-4 h-4 text-[#7FE3C0]" />
                <span>Empirical Evolution (Prior vs Personal)</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#7FE3C0]/15 text-[#7FE3C0] font-mono-numbers">
                {checkIns.length} Check-ins Logged
              </span>
            </div>

            <p className="text-xs text-[rgba(242,247,243,0.65)] leading-relaxed">
              KAIROS initializes with an archetype prior (e.g. Arjun, Meera, Kabir) and incrementally shifts parameters toward your personal habits via Bayesian updates as notifications arrive.
            </p>

            {twinDiffs.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#061A12] border border-white/5 text-center flex flex-col items-center gap-2.5">
                <Cpu className="w-7 h-7 text-[#7FE3C0]" />
                <p className="text-xs text-[#F2F7F3] font-semibold">Population Prior Active</p>
                <p className="text-[11px] text-[rgba(242,247,243,0.6)] max-w-xs">
                  Interact with Guard notifications or log check-ins to generate personal posterior shifts. Below are the estimated module variances:
                </p>

                <div className="w-full flex flex-col gap-2 mt-2">
                  <div className="p-3 rounded-xl bg-[#092218] border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-[rgba(242,247,243,0.8)]">Focus Peak Drift</span>
                    <span className="text-[#7FE3C0] font-mono-numbers font-semibold">10:00 → 11:30 (+15%)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#092218] border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-[rgba(242,247,243,0.8)]">Instagram Detour P90</span>
                    <span className="text-[#FF6B4A] font-mono-numbers font-semibold">14.0m → 18.2m (+30%)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#092218] border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-[rgba(242,247,243,0.8)]">Resumption Lag</span>
                    <span className="text-[#FFC44D] font-mono-numbers font-semibold">8.2m → 6.5m (-20%)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {twinDiffs.map((diff, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-[#061A12] border border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-semibold text-[#F2F7F3]">{diff.metricLabel}</span>
                      <p className="text-[10px] text-[rgba(242,247,243,0.5)]">
                        Module: {diff.moduleName} · {diff.confidence}
                      </p>
                    </div>
                    <div className="text-right font-mono-numbers">
                      <span className="text-xs text-[rgba(242,247,243,0.5)]">
                        {diff.priorValue.toFixed(2)} →{' '}
                      </span>
                      <span className="text-xs font-semibold text-[#7FE3C0]">
                        {diff.personalValue.toFixed(2)} ({diff.deltaPercent})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      ) : (
        /* The 6 Learned Modules Bento Grid Layout */
        <div className="flex flex-col gap-4">
          {/* Module 1: Focus Curve / Diurnal Rhythm */}
          <GlassCard className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#7FE3C0]/15 text-[#7FE3C0] flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F2F7F3]">
                    1. Focus Diurnal Rhythm
                  </h3>
                  <span className="text-[10px] text-[rgba(242,247,243,0.5)]">
                    N={twin.focusCurve.sampleSize} · {twin.focusCurve.provenance}
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono-numbers font-bold text-[#7FE3C0]">
                {Math.round(currentHourPoint.probDeepFocus * 100)}% Focus @ {selectedHour}:00
              </span>
            </div>

            <p className="text-xs text-[rgba(242,247,243,0.65)]">
              Learned 24-hour deep focus probability curve. Tap any bar to inspect hourly resilience.
            </p>

            <FocusClockChart
              hourlyFocus={hourlyCurve}
              currentHour={selectedHour}
              onSelectHour={setSelectedHour}
            />

            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-[rgba(242,247,243,0.6)]">
              <span>95% Credible Interval:</span>
              <span className="font-mono-numbers text-[#7FE3C0] font-semibold">
                [{Math.round(currentHourPoint.ciLower * 100)}% - {Math.round(currentHourPoint.ciUpper * 100)}%]
              </span>
            </div>
          </GlassCard>

          {/* Module 2: Interruption Susceptibility Model */}
          <GlassCard className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FF6B4A]/15 text-[#FF6B4A] flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F2F7F3]">
                    2. Interruption Susceptibility
                  </h3>
                  <span className="text-[10px] text-[rgba(242,247,243,0.5)]">
                    Logistic regression · Accuracy: {(twin.interruptionModel.data.accuracy * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FF6B4A]/15 text-[#FF6B4A] font-bold">
                {twin.interruptionModel.confidence}
              </span>
            </div>

            <p className="text-xs text-[rgba(242,247,243,0.65)]">
              Predicts probability of focus break given current cognitive state and notification urgency.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono-numbers text-xs">
              <div className="p-3 rounded-xl bg-[#061A12] border border-white/5 flex flex-col gap-0.5">
                <span className="text-[10px] text-[rgba(242,247,243,0.5)] uppercase">Sender Weight</span>
                <span className="text-sm font-bold text-[#7FE3C0]">
                  {twin.interruptionModel.data.senderImportanceWeight > 0 ? '+' : ''}
                  {twin.interruptionModel.data.senderImportanceWeight.toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#061A12] border border-white/5 flex flex-col gap-0.5">
                <span className="text-[10px] text-[rgba(242,247,243,0.5)] uppercase">Fatigue Slope</span>
                <span className="text-sm font-bold text-[#FFC44D]">
                  +{twin.interruptionModel.data.fatigueWeight.toFixed(2)}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Module 3: App Gravity & Sticky Content Lognormals */}
          <GlassCard className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFC44D]/15 text-[#FFC44D] flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F2F7F3]">
                    3. App Gravity &amp; Sticky Content
                  </h3>
                  <span className="text-[10px] text-[rgba(242,247,243,0.5)]">
                    Lognormal session distributions (N={twin.stickyContent.sampleSize})
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[rgba(242,247,243,0.65)]">
              Expected detour length if an app is opened. Fat tails indicate infinite-scroll risks.
            </p>

            <div className="flex flex-col gap-2 pt-1">
              {twin.stickyContent.data.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#061A12] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-[#F2F7F3]">{item.appName}</span>
                    <span className="text-[10px] text-[rgba(242,247,243,0.5)] block">
                      N={item.sampleCount} · μ={item.mu.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right font-mono-numbers">
                    <span className="text-xs text-[#7FE3C0] font-bold">
                      {item.medianMinutes}m median
                    </span>
                    <span className="text-[10px] text-[#FF6B4A] block">
                      P90 tail: {item.p90Minutes}m
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Module 4: Personal Notification Value Distribution */}
          <GlassCard className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#6EC8FF]/15 text-[#6EC8FF] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F2F7F3]">
                    4. Personal Content Value
                  </h3>
                  <span className="text-[10px] text-[rgba(242,247,243,0.5)]">
                    Bayesian utility function (P(Action Meaningful))
                  </span>
                </div>
              </div>
              <span className="text-xs text-[#6EC8FF] font-mono-numbers font-bold">
                {twin.notificationValue.data.length} categories
              </span>
            </div>

            <p className="text-xs text-[rgba(242,247,243,0.65)]">
              Historical probability that a notification resulted in productive action vs regret.
            </p>

            <div className="flex flex-col gap-2 pt-1">
              {twin.notificationValue.data.slice(0, 3).map((nv, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-[#061A12] border border-white/5 flex items-center justify-between text-xs"
                >
                  <span className="text-[#F2F7F3] capitalize">
                    {nv.type.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2 font-mono-numbers">
                    <span className="text-xs font-bold text-[#7FE3C0]">
                      {Math.round(nv.probActedMeaningfully * 100)}%
                    </span>
                    <span className="text-[10px] text-[rgba(242,247,243,0.5)]">
                      [{Math.round(nv.ciLower * 100)}% - {Math.round(nv.ciUpper * 100)}%]
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Module 5: Fatigue Curve & Cognitive Load */}
          <GlassCard className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFC44D]/15 text-[#FFC44D] flex items-center justify-center">
                  <Battery className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F2F7F3]">
                    5. Cognitive Fatigue Decay
                  </h3>
                  <span className="text-[10px] text-[rgba(242,247,243,0.5)]">
                    R² = {twin.fatigueModel.data.rSquared.toFixed(2)} · Continuous screen accumulation
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono-numbers text-xs">
              <div className="p-3 rounded-xl bg-[#061A12] border border-white/5 flex flex-col gap-0.5">
                <span className="text-[10px] text-[rgba(242,247,243,0.5)] uppercase">Time Without Break</span>
                <span className="text-sm font-bold text-[#FFC44D]">
                  +{(twin.fatigueModel.data.minutesSinceBreakSlope * 60).toFixed(2)}/hr
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#061A12] border border-white/5 flex flex-col gap-0.5">
                <span className="text-[10px] text-[rgba(242,247,243,0.5)] uppercase">App Switch Penalty</span>
                <span className="text-sm font-bold text-[#FF6B4A]">
                  +{twin.fatigueModel.data.switchesSlope.toFixed(2)}/switch
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Module 6: Resumption Lag & Fragmentation Index */}
          <GlassCard className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#C4A7E7]/15 text-[#C4A7E7] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F2F7F3]">
                    6. Resumption Lag &amp; Fragmentation
                  </h3>
                  <span className="text-[10px] text-[rgba(242,247,243,0.5)]">
                    Cognitive re-entry tax following interruptions
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {twin.fragmentationIndex.data.slice(0, 3).map((frag, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#061A12] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-[#F2F7F3]">{frag.appName}</span>
                    <span className="text-[10px] text-[rgba(242,247,243,0.5)] block">
                      Block shortening: -{frag.nextBlockShorteningMinutes}m
                    </span>
                  </div>
                  <div className="text-right font-mono-numbers">
                    <span className="text-xs text-[#FFC44D] font-bold">
                      {frag.meanResumptionDelayMinutes.toFixed(1)}m delay
                    </span>
                    <span className="text-[10px] text-[rgba(242,247,243,0.5)] block">
                      [{frag.ciResumptionDelay[0].toFixed(1)}m - {frag.ciResumptionDelay[1].toFixed(1)}m]
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
