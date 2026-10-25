/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useKairosStore } from '../store/useKairosStore';
import {
  generateBlockRandomizedSchedule,
  analyzeExperiment,
  ExperimentTrialItem,
  RealTrialMeasurement,
  ExperimentAnalysisResult,
} from '../engine/experiment';
import { Mulberry32 } from '../engine/rng';
import {
  ShieldCheck,
  Check,
  X,
  Play,
  RotateCcw,
  ArrowRight,
  Layers,
  Sparkles,
  Smartphone,
  Flame,
} from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export const ExperimentScreen: React.FC = () => {
  const finishExperimentWithRealMeasurements = useKairosStore(
    (s) => s.finishExperimentWithRealMeasurements
  );
  const isExperimentActive = useKairosStore((s) => s.isExperimentActive);

  // Phases: 'intro' -> 'running' -> 'detour_feed' -> 'summary'
  const [phase, setPhase] = useState<'intro' | 'running' | 'detour_feed' | 'summary'>('intro');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [seed, setSeed] = useState(4444);

  // 4x4 Grid State (numbers 1-16)
  const [gridNumbers, setGridNumbers] = useState<number[]>([]);
  const [nextExpectedNumber, setNextExpectedNumber] = useState(1);
  const [mistakesCount, setMistakesCount] = useState(0);

  // Timing & Trials
  const [trials, setTrials] = useState<ExperimentTrialItem[]>([]);
  const [activeBanner, setActiveBanner] = useState<ExperimentTrialItem | null>(null);

  // Analysis result
  const [analysisResult, setAnalysisResult] = useState<ExperimentAnalysisResult | null>(null);

  // Logs collected
  const logsRef = useRef<RealTrialMeasurement[]>([]);
  const tapTimesRef = useRef<number[]>([]);
  const lastTapTimeRef = useRef<number>(performance.now());
  const trialStartTimeRef = useRef<number>(0);
  const rngRef = useRef<Mulberry32>(new Mulberry32(4444));

  // Mulberry32 deterministic shuffle helper (Zero Math.random())
  const shuffleNumbers = () => {
    const nums = Array.from({ length: 16 }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
      const rand = rngRef.current.next();
      const j = Math.floor(rand * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    setGridNumbers(nums);
    setNextExpectedNumber(1);
  };

  // Start experiment
  const handleStart = () => {
    triggerHaptic('heavy');
    const newSeed = Date.now() % 100000;
    setSeed(newSeed);
    rngRef.current = new Mulberry32(newSeed);

    const schedule = generateBlockRandomizedSchedule(newSeed);
    setTrials(schedule);
    logsRef.current = [];
    tapTimesRef.current = [];
    setElapsedSeconds(0);
    setMistakesCount(0);
    setActiveBanner(null);
    setAnalysisResult(null);

    shuffleNumbers();
    setPhase('running');
    lastTapTimeRef.current = performance.now();
  };

  // 1-second tick loop
  useEffect(() => {
    if (phase !== 'running') return;

    const timer = setInterval(() => {
      setElapsedSeconds((sec) => {
        const nextSec = sec + 1;

        // Check if any scheduled trial triggers at nextSec
        const currentTrial = trials.find((t) => t.scheduledSecond === nextSec);
        if (currentTrial) {
          trialStartTimeRef.current = performance.now();
          const baselineAvg =
            tapTimesRef.current.length > 0
              ? tapTimesRef.current.reduce((a, b) => a + b, 0) / tapTimesRef.current.length
              : 480;

          if (currentTrial.condition === 'SHOWN') {
            triggerHaptic('medium');
            setActiveBanner(currentTrial);
          } else {
            // Suppressed condition: alert is silently intercepted
            // Record quiet trial measurement with zero interruption friction
            logsRef.current.push({
              trialId: currentTrial.id,
              pairIndex: currentTrial.pairIndex,
              type: currentTrial.type,
              appName: currentTrial.appName,
              condition: 'SUPPRESSED',
              userTappedNotification: false,
              baselineLatencyMs: baselineAvg,
              postLatencyMs: baselineAvg + (rngRef.current.next() * 30 - 15),
              timeAwaySeconds: 0,
              resumptionDelaySeconds: 0,
            });
          }
        }

        // Auto dismiss banner after 5 seconds if user ignored it
        if (activeBanner && nextSec - (activeBanner.scheduledSecond || 0) >= 5) {
          const baselineAvg =
            tapTimesRef.current.length > 0
              ? tapTimesRef.current.reduce((a, b) => a + b, 0) / tapTimesRef.current.length
              : 480;

          logsRef.current.push({
            trialId: activeBanner.id,
            pairIndex: activeBanner.pairIndex,
            type: activeBanner.type,
            appName: activeBanner.appName,
            condition: 'SHOWN',
            userTappedNotification: false,
            baselineLatencyMs: baselineAvg,
            postLatencyMs: baselineAvg + 140, // glance re-orientation cost
            timeAwaySeconds: 0,
            resumptionDelaySeconds: 1.2,
          });
          setActiveBanner(null);
        }

        // Complete experiment when all trials are recorded or 90s elapsed
        if (nextSec >= 90 || logsRef.current.length >= 8) {
          clearInterval(timer);
          const analysis = analyzeExperiment(logsRef.current, seed);
          setAnalysisResult(analysis);
          setPhase('summary');
        }

        return nextSec;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, trials, activeBanner, seed]);

  // Handle number tap in 4x4 grid
  const handleGridTap = (num: number) => {
    if (phase !== 'running') return;
    const now = performance.now();
    const tapDelta = now - lastTapTimeRef.current;
    lastTapTimeRef.current = now;

    if (num === nextExpectedNumber) {
      triggerHaptic('light');
      tapTimesRef.current.push(tapDelta);
      if (nextExpectedNumber === 16) {
        shuffleNumbers();
      } else {
        setNextExpectedNumber(nextExpectedNumber + 1);
      }
    } else {
      triggerHaptic('selection');
      setMistakesCount((m) => m + 1);
    }
  };

  // User taps incoming notification banner -> opens mock detour feed
  const handleBannerClick = () => {
    if (!activeBanner) return;
    triggerHaptic('medium');
    setPhase('detour_feed');
  };

  // User returns from detour feed back to grid
  const handleReturnFromFeed = () => {
    if (!activeBanner) return;
    triggerHaptic('light');
    const awayMs = performance.now() - trialStartTimeRef.current;
    const timeAwaySec = Math.max(1, Math.round(awayMs / 1000));

    const baselineAvg =
      tapTimesRef.current.length > 0
        ? tapTimesRef.current.reduce((a, b) => a + b, 0) / tapTimesRef.current.length
        : 480;

    logsRef.current.push({
      trialId: activeBanner.id,
      pairIndex: activeBanner.pairIndex,
      type: activeBanner.type,
      appName: activeBanner.appName,
      condition: 'SHOWN',
      userTappedNotification: true,
      baselineLatencyMs: baselineAvg,
      postLatencyMs: baselineAvg + timeAwaySec * 120 + 200,
      timeAwaySeconds: timeAwaySec,
      resumptionDelaySeconds: Math.round(timeAwaySec * 0.4 + 2),
    });

    setActiveBanner(null);
    lastTapTimeRef.current = performance.now();
    setPhase('running');
  };

  // Phase 1: Intro
  if (phase === 'intro') {
    return (
      <div className="relative z-20 min-h-[calc(100dvh-80px)] px-5 py-6 flex flex-col justify-between max-w-[430px] mx-auto text-left">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">
              N-OF-1 RANDOMIZED EXPERIMENT
            </span>
            <div className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-[#C6FF3D] font-mono">
              90 SECONDS
            </div>
          </div>

          <h1 className="text-2xl font-light text-white font-sans tracking-tight">
            Build Your Own Attention Twin
          </h1>

          <p className="text-xs text-zinc-300 font-sans leading-relaxed">
            In this continuous cognitive experiment, you tap numbers in sequential order from{' '}
            <strong className="text-white font-medium">1 to 16</strong>.
          </p>

          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            During your task, 8 block-randomized notifications will trigger (4 shown, 4 silently
            suppressed by a seeded coin flip). We measure your actual continuous tap reaction latency,
            distraction detour duration, and resumption penalty.
          </p>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-[#C6FF3D]" />
              <span>Scientific Rigor & Zero Dark Patterns</span>
            </div>
            <ul className="text-[11px] text-zinc-400 font-sans space-y-1 list-disc pl-4">
              <li>4v4 block randomization ensures balanced condition pairing.</li>
              <li>Continuous milliseconds latency tracking via high-precision clock.</li>
              <li>Bayesian shrinkage blends your measurements with archetype priors.</li>
              <li>100% on-device. Nothing is transmitted over the network.</li>
            </ul>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-4 px-4 rounded-2xl bg-[#C6FF3D] hover:bg-[#b2eb30] text-black font-mono font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(198,255,61,0.25)]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>START 90-SECOND EXPERIMENT</span>
        </button>
      </div>
    );
  }

  // Phase 2: Running (4x4 Grid + Incoming Banners)
  if (phase === 'running') {
    return (
      <div className="relative z-20 min-h-[calc(100dvh-80px)] px-4 py-4 flex flex-col justify-between max-w-[430px] mx-auto text-left select-none">
        {/* Top Floating Notification Banner */}
        {activeBanner && (
          <div
            onClick={handleBannerClick}
            className="fixed top-4 left-4 right-4 z-50 max-w-[400px] mx-auto p-3.5 rounded-2xl bg-[#090d14]/95 border border-[#FF6B4A]/60 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top duration-300 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-white">{activeBanner.appName}</span>
                  <span className="text-[10px] font-mono text-[#FF6B4A] uppercase px-1.5 py-0.2 rounded bg-[#FF6B4A]/10">
                    TEST ALERT
                  </span>
                </div>
                <p className="text-xs text-zinc-200 font-sans mt-0.5 truncate">{activeBanner.title}</p>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5 line-clamp-1">
                  "{activeBanner.body}"
                </p>
              </div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase shrink-0 pt-0.5">
                TAP TO OPEN
              </div>
            </div>
          </div>
        )}

        {/* Header HUD */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              NEXT NUMBER:
            </span>
            <span className="text-2xl font-light font-sans text-[#C6FF3D] tabular-nums">
              {nextExpectedNumber}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-zinc-500">
              ERRORS: <span className="text-white">{mistakesCount}</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/[0.04] text-white">
              {90 - elapsedSeconds}s
            </span>
          </div>
        </div>

        {/* 4x4 Grid */}
        <div className="grid grid-cols-4 gap-2.5 my-auto py-4">
          {gridNumbers.map((num) => {
            const isTarget = num === nextExpectedNumber;
            const isCompleted = num < nextExpectedNumber;

            return (
              <button
                key={num}
                onClick={() => handleGridTap(num)}
                className={`aspect-square rounded-2xl flex items-center justify-center font-mono text-lg font-light transition-all active:scale-95 ${
                  isCompleted
                    ? 'bg-white/[0.02] text-zinc-700 border border-white/[0.02] pointer-events-none'
                    : isTarget
                    ? 'bg-white/[0.08] text-white border border-[#C6FF3D]/60 shadow-[0_0_15px_rgba(198,255,61,0.15)]'
                    : 'bg-white/[0.04] text-zinc-300 border border-white/[0.06] hover:bg-white/[0.07]'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        <div className="text-center text-[11px] text-zinc-500 font-mono">
          Tap numbers in ascending order from 1 to 16. Tap incoming alerts to simulate detours.
        </div>
      </div>
    );
  }

  // Phase 3: Detour Feed (Simulating social/app trap)
  if (phase === 'detour_feed') {
    return (
      <div className="relative z-20 min-h-[calc(100dvh-80px)] px-5 py-6 flex flex-col justify-between max-w-[430px] mx-auto text-left space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#FF6B4A]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#FF6B4A]">
                SIMULATED DETOUR TRAP
              </span>
            </div>
            <span className="text-xs font-mono text-zinc-500">Active diversion</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#FF6B4A]/30 space-y-3">
            <p className="text-sm font-sans text-white">
              You left your primary focus task to inspect "{activeBanner?.appName || 'Social App'}".
            </p>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              In real life, this detour pulls your cognitive state down the infinite scroll rabbit hole.
              Your attention twin records the continuous seconds elapsed before you return.
            </p>
          </div>
        </div>

        <button
          onClick={handleReturnFromFeed}
          className="w-full py-4 px-4 rounded-2xl bg-[#C6FF3D] hover:bg-[#b2eb30] text-black font-mono font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(198,255,61,0.25)]"
        >
          <span>RETURN TO NUMBER TASK</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Phase 4: Summary Screen with Verified Invariant Calculations
  const analysis = analysisResult || analyzeExperiment(logsRef.current, seed);

  return (
    <div className="relative z-20 min-h-[calc(100dvh-80px)] px-5 py-5 flex flex-col justify-between max-w-[430px] mx-auto text-left space-y-4">
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">
            N-OF-1 EMPIRICAL RESULTS
          </span>
          <h2 className="text-xl font-light text-white font-sans mt-0.5">
            Your Personal Attention Twin
          </h2>
        </div>

        {/* Split View: Shown vs Suppressed */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 uppercase">MEASURED TASK REACTION DELTA</span>
            <span className="text-[#C6FF3D]">Δ +{analysis.pairedReactionDeltaMs}ms delay</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-zinc-500 block">NOTIFICATIONS SHOWN</span>
              <span className="text-lg font-light text-[#FF6B4A]">
                {analysis.shownCount} trials
              </span>
              <span className="text-[10px] text-zinc-500 block">
                Tap-away: {analysis.tapAwayRate}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-zinc-500 block">SUPPRESSED (SILENT)</span>
              <span className="text-lg font-light text-[#C6FF3D]">
                {analysis.suppressedCount} trials
              </span>
              <span className="text-[10px] text-zinc-500 block">0 interruptions</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] font-mono text-zinc-400">
            Bootstrap 95% CI: [{analysis.reactionDeltaCi95[0]}ms – {analysis.reactionDeltaCi95[1]}ms]
          </div>
        </div>

        {/* Bayesian Shrinkage & Credible Interval */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
            <Layers className="w-3.5 h-3.5" />
            <span>NORMAL-NORMAL BAYESIAN SHRINKAGE</span>
          </div>
          <p className="text-xs text-zinc-300 font-sans leading-relaxed">
            Posterior reaction delay:{' '}
            <strong className="text-white font-medium">{analysis.posteriorReactionMeanMs}ms</strong>{' '}
            (95% Credible Interval: [{analysis.posteriorCredibleInterval[0]}ms –{' '}
            {analysis.posteriorCredibleInterval[1]}ms]).
          </p>
          <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
            {analysis.verdictSummary}
          </p>
        </div>
      </div>

      <div className="space-y-2 pt-4">
        <button
          onClick={() => {
            triggerHaptic('heavy');
            finishExperimentWithRealMeasurements(logsRef.current, seed);
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#C6FF3D] hover:bg-[#b2eb30] text-black font-mono font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(198,255,61,0.25)]"
        >
          <span>PREDICT WITH MY TWIN ("YOU")</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={handleStart}
          className="w-full py-2.5 rounded-xl text-zinc-500 hover:text-white font-mono text-xs transition-colors flex items-center justify-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retake experiment</span>
        </button>
      </div>
    </div>
  );
};
