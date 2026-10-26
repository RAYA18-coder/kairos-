/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useKairosStore } from '../store/useKairosStore';
import { Settings, Sun, Moon, Shield, Sparkles, ChevronDown } from 'lucide-react';
import { PersonaModal } from './ui/PersonaModal';

export const Header: React.FC = () => {
  const role = useKairosStore((s) => s.role);
  const theme = useKairosStore((s) => s.theme);
  const setTheme = useKairosStore((s) => s.setTheme);
  const isSettingsOpen = useKairosStore((s) => s.isSettingsOpen);
  const setIsSettingsOpen = useKairosStore((s) => s.setIsSettingsOpen);
  const startGuidedDemo = useKairosStore((s) => s.startGuidedDemo);
  const isGuidedDemoRunning = useKairosStore((s) => s.isGuidedDemoRunning);
  const aiOnline = useKairosStore((s) => s.aiOnline);
  const activePersona = useKairosStore((s) => s.activePersona);

  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);

  const personaNames: Record<string, string> = {
    arjun: 'Arjun · Coder',
    meera: 'Meera · Creator',
    kabir: 'Kabir · Student',
    rohan: 'Rohan · Founder',
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full glass-nav px-4 py-3 flex items-center justify-between border-b border-[#7FE3C0]/20">
        {/* Brand & Status */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00f5ff] shadow-sm shadow-[#00f5ff]/60 animate-pulse" />
            <span className="font-extrabold text-base tracking-wider text-[#f7f7f8] flex items-center gap-1.5">
              <span className="bg-gradient-to-r from-[#C9E4A5] to-[#7FE3C0] bg-clip-text text-transparent">
                KAIROS
              </span>
            </span>
          </div>

          {/* Persona Choosing Button: Opens the Persona Chooser Modal */}
          <button
            onClick={() => setIsPersonaModalOpen(true)}
            title="Click to choose persona or calibrate attention profile"
            className="ml-1 text-xs px-2.5 py-1 rounded-full bg-[#7FE3C0]/15 hover:bg-[#7FE3C0]/25 text-[#B8F27A] border border-[#7FE3C0]/30 flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          >
            <Shield className="w-3 h-3 text-[#00f5ff]" />
            <span className="font-semibold">{personaNames[activePersona] || 'Choose Persona'}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5">
          {/* Judge Demo Quick Trigger */}
          {!isGuidedDemoRunning && (
            <button
              onClick={startGuidedDemo}
              title="Start 60-Second Guided Demo"
              className="text-xs px-2.5 py-1 rounded-xl bg-[#00f5ff]/15 hover:bg-[#00f5ff]/25 text-[#00f5ff] border border-[#00f5ff]/30 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Judge Demo</span>
            </button>
          )}

          {/* AI Offline Indicator if unreachable */}
          {!aiOnline && (
            <span
              title="Local deterministic fallback mode active"
              className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] text-[#8b8988] border border-white/[0.06]"
            >
              AI Offline
            </span>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 rounded-xl text-[#8b8988] hover:text-[#f7f7f8] hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Settings Gear Button: Opens SettingsSheet */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-9 h-9 rounded-xl text-[#8b8988] hover:text-[#f7f7f8] hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            title="Settings & Admin Configuration"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Persona Choosing Modal */}
      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
      />
    </>
  );
};
