/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useKairosStore } from '../store/useKairosStore';
import { ShieldCheck, Play, Square, Eye, EyeOff, Plus, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export const Header: React.FC = () => {
  const activePersona = useKairosStore((s) => s.activePersona);
  const quietMode = useKairosStore((s) => s.quietMode);
  const isGuidedDemoRunning = useKairosStore((s) => s.isGuidedDemoRunning);
  const guidedDemoStep = useKairosStore((s) => s.guidedDemoStep);
  const setCurrentView = useKairosStore((s) => s.setCurrentView);
  const setQuietMode = useKairosStore((s) => s.setQuietMode);
  const startGuidedDemo = useKairosStore((s) => s.startGuidedDemo);
  const stopGuidedDemo = useKairosStore((s) => s.stopGuidedDemo);
  const setActivePersona = useKairosStore((s) => s.setActivePersona);

  const personas = [
    { id: 'arjun', label: 'Arjun' },
    { id: 'meera', label: 'Meera' },
    { id: 'kabir', label: 'Kabir' },
    { id: 'you', label: 'You' },
  ] as const;

  return (
    <header className="relative z-30 pt-safe px-4 pb-2 border-b border-white/[0.06] bg-[#050608]/80 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        {/* Brand & Persona badge */}
        <div>
          <button
            onClick={() => {
              triggerHaptic('light');
              setCurrentView('landing');
            }}
            className="flex items-center gap-2 group text-left"
            title="View KAIROS Mission & Story"
          >
            <span className="font-sans font-light tracking-[0.2em] text-sm text-white font-medium uppercase group-hover:text-[#C6FF3D] transition-colors">
              KAIROS
            </span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-zinc-400 font-mono">
              <ShieldCheck className="w-2.5 h-2.5 text-[#C6FF3D]" />
              <span>ON-DEVICE</span>
            </div>
          </button>
          <p className="text-[11px] text-zinc-500 font-sans tracking-wide">
            Your attention, simulated.
          </p>
        </div>

        {/* Action buttons: Demo & Quiet Mode */}
        <div className="flex items-center gap-1.5">
          {isGuidedDemoRunning ? (
            <button
              onClick={() => {
                triggerHaptic('medium');
                stopGuidedDemo();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#FF6B4A]/20 border border-[#FF6B4A]/40 text-[#FF6B4A] text-xs font-mono tracking-wider transition-all"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>STOP DEMO ({guidedDemoStep}/6)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                triggerHaptic('light');
                startGuidedDemo();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#C6FF3D]/10 hover:bg-[#C6FF3D]/20 border border-[#C6FF3D]/30 text-[#C6FF3D] text-xs font-mono tracking-wider transition-all"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>GUIDED DEMO</span>
            </button>
          )}

          <button
            onClick={() => {
              triggerHaptic('selection');
              setQuietMode(!quietMode);
            }}
            title={quietMode ? 'Quiet mode active (static)' : 'Toggle quiet mode'}
            className={`p-2 rounded-full border transition-all ${
              quietMode
                ? 'bg-zinc-800 border-zinc-600 text-zinc-300'
                : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white'
            }`}
          >
            {quietMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Persona quick-switch bar */}
      <div className="flex items-center gap-1 mt-2.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider mr-1">
          TWIN:
        </span>
        {personas.map((p) => {
          const isActive = activePersona === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                triggerHaptic('selection');
                setActivePersona(p.id);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {p.label}
            </button>
          );
        })}

        <button
          onClick={() => {
            triggerHaptic('light');
            setCurrentView('builder');
          }}
          className="p-1 rounded-md text-zinc-500 hover:text-[#C6FF3D] border border-dashed border-white/10 hover:border-[#C6FF3D]/40 transition-colors ml-1"
          title="Create New Attention Persona"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
