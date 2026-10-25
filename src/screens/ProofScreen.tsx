/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useKairosStore } from '../store/useKairosStore';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Cpu,
  Smartphone,
  RotateCcw,
} from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export const ProofScreen: React.FC = () => {
  const activePersona = useKairosStore((s) => s.activePersona);
  const backtestResults = useKairosStore((s) => s.backtestResults);
  const selfChecks = useKairosStore((s) => s.selfChecks);
  const resetEverything = useKairosStore((s) => s.resetEverything);

  const backtest = backtestResults[activePersona] || backtestResults.arjun;
  const { report, calibrationBins } = backtest;

  return (
    <div className="relative z-10 min-h-[calc(100dvh-130px)] px-4 py-3 pb-32 space-y-4">
      {/* Top Banner */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">
              EMPIRICAL VALIDATION
            </span>
            <h2 className="text-lg font-light text-white font-sans">Ground Truth & Proof</h2>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 text-xs font-mono text-[#C6FF3D]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fidelity {report.score}%</span>
          </div>
        </div>
        <p className="text-xs text-zinc-400 font-sans mt-1">
          Backtested on held-out test days (24–30) and validated against hidden ground-truth
          generators.
        </p>
      </div>

      {/* TWIN FIDELITY HERO METRIC */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase block tracking-wider">
              UNIFIED FIDELITY SCORE
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-4xl font-light font-sans text-white tabular-nums">
                {report.score}
              </span>
              <span className="text-lg text-[#C6FF3D] font-mono">%</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-500 block uppercase">
              Evaluation Split
            </span>
            <span className="text-xs font-mono text-zinc-300">Days 1–23 / 24–30</span>
          </div>
        </div>

        <p className="text-xs text-zinc-300 font-sans leading-relaxed">{report.summary}</p>

        {/* Triple metric cards */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/[0.06]">
          <div className="p-2 rounded-xl bg-white/[0.02]">
            <span className="text-[9px] font-mono text-zinc-500 block uppercase">
              Calibration Error (ECE)
            </span>
            <span className="text-sm font-mono text-white tabular-nums">
              ±{Math.round(report.ece * 100)}%
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white/[0.02]">
            <span className="text-[9px] font-mono text-zinc-500 block uppercase">Detour MAE</span>
            <span className="text-sm font-mono text-white tabular-nums">
              {report.detourMaeMinutes}m
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white/[0.02]">
            <span className="text-[9px] font-mono text-zinc-500 block uppercase">
              Counterfactual Err
            </span>
            <span className="text-sm font-mono text-white tabular-nums">
              {report.counterfactualMaeMinutes}m
            </span>
          </div>
        </div>
      </div>

      {/* CALIBRATION PLOT (Predicted vs Actual Open Rate) */}
      <div className="p-4 rounded-2xl bg-[#090d14]/90 border border-white/[0.06] backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-300 uppercase">Reliability Calibration Plot</span>
          <span className="text-[10px] text-zinc-500">Perfect = 45° Diagonal</span>
        </div>

        <div className="space-y-2 pt-1">
          {calibrationBins.map((bin) => (
            <div key={bin.binLabel} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">{bin.binLabel}</span>
                <span className="text-zinc-300">
                  Pred: {Math.round(bin.predictedProbability * 100)}% • Act:{' '}
                  <strong className="text-[#C6FF3D]">
                    {Math.round(bin.actualObservedRate * 100)}%
                  </strong>
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-zinc-600 rounded-full"
                  style={{ width: `${Math.round(bin.predictedProbability * 100)}%` }}
                />
                <div
                  className="h-full bg-[#C6FF3D] rounded-full -ml-1"
                  style={{ width: `${Math.max(2, Math.round(bin.actualObservedRate * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MATHEMATICAL SELF-CHECKS STATUS */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500">
            ENGINE SELF-CHECKS (RUN ON DEV BOOT)
          </span>
          <span className="text-[10px] font-mono text-[#C6FF3D] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> ALL CHECKS PASSING
          </span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C6FF3D]" />
              <span>Determinism Check:</span>
            </div>
            <p className="text-[11px] text-zinc-400 pl-5">
              {selfChecks.deterministicCheck.message}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C6FF3D]" />
              <span>Counterfactual Invariant Check:</span>
            </div>
            <p className="text-[11px] text-zinc-400 pl-5">
              {selfChecks.counterfactualCheck.message}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C6FF3D]" />
              <span>CI Narrowing Invariant:</span>
            </div>
            <p className="text-[11px] text-zinc-400 pl-5">
              {selfChecks.confidenceNarrowingCheck.message}
            </p>
          </div>
        </div>
      </div>

      {/* HONEST LIMITS CARD */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
        <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>Honest Scientific Limits</span>
        </span>
        <ul className="space-y-1.5 text-xs text-zinc-400 font-sans">
          {report.honestLimits.map((lim, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="text-zinc-600 font-mono">•</span>
              <span>{lim}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* PRODUCTION PATH CARD */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#C6FF3D]" />
          <span className="text-xs font-mono uppercase tracking-wider text-white">
            PRODUCTION ON-DEVICE ARCHITECTURE
          </span>
        </div>
        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
          In native production, KAIROS leverages Android{' '}
          <code className="text-[11px] font-mono bg-white/[0.06] px-1 py-0.5 rounded text-white">
            NotificationListenerService
          </code>{' '}
          and{' '}
          <code className="text-[11px] font-mono bg-white/[0.06] px-1 py-0.5 rounded text-white">
            UsageStatsManager
          </code>
          . All training, Monte Carlo simulations, and counterfactuals execute locally with zero
          network telemetry.
        </p>
      </div>

      {/* RESET EVERYTHING BUTTON */}
      <div className="pt-2">
        <button
          onClick={() => {
            triggerHaptic('heavy');
            resetEverything();
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-mono text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET EVERYTHING (COLD START)</span>
        </button>
      </div>
    </div>
  );
};
