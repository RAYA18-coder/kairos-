/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useKairosStore } from '../store/useKairosStore';
import { Compass, Sparkles, Shield, Cpu, Award } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export const TabBar: React.FC = () => {
  const activeTab = useKairosStore((s) => s.activeTab);
  const setActiveTab = useKairosStore((s) => s.setActiveTab);

  const tabs = [
    { id: 'now', label: 'NOW', icon: Compass },
    { id: 'simulate', label: 'SIMULATE', icon: Sparkles },
    { id: 'guard', label: 'GUARD', icon: Shield },
    { id: 'twin', label: 'TWIN', icon: Cpu },
    { id: 'proof', label: 'PROOF', icon: Award },
  ] as const;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 pb-safe bg-[#050608]/90 backdrop-blur-xl border-t border-white/[0.06] transition-transform duration-300"
      aria-label="App Navigation"
    >
      <div className="max-w-[430px] mx-auto flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all duration-200 group ${
                isActive ? 'text-[#C6FF3D]' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {/* Active subtle pill highlight */}
              {isActive && (
                <span className="absolute inset-x-2 bottom-1 h-0.5 bg-[#C6FF3D] rounded-full shadow-[0_0_8px_rgba(198,255,61,0.6)]" />
              )}

              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'scale-105 stroke-[2.2px]' : 'scale-100 stroke-[1.6px]'
                }`}
              />
              <span className="text-[10px] font-mono tracking-wider mt-1 font-medium uppercase">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
