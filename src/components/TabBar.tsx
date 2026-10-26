/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { useKairosStore } from '../store/useKairosStore';
import { Compass, GitFork, Shield, BrainCircuit, CheckCircle2 } from 'lucide-react';

export const TabBar: React.FC = () => {
  const activeTab = useKairosStore((s) => s.activeTab);
  const setActiveTab = useKairosStore((s) => s.setActiveTab);
  const guardStream = useKairosStore((s) => s.guardStream);

  const heldCount = guardStream.filter(
    (item) => item.status === 'held' || item.status === 'batched' || item.status === 'suppressed'
  ).length;

  const tabs = [
    { id: 'now' as const, label: 'Today', icon: Compass },
    { id: 'simulate' as const, label: 'Simulate', icon: GitFork },
    { id: 'guard' as const, label: 'Guard', icon: Shield, badge: heldCount > 0 ? heldCount : null },
    { id: 'twin' as const, label: 'Twin', icon: BrainCircuit },
    { id: 'proof' as const, label: 'Proof', icon: CheckCircle2 },
  ];

  const handleSelect = (id: typeof activeTab) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(6);
      }
    } catch {
      // Haptics ignore
    }
    setActiveTab(id);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-tab-bar pb-safe pt-2 px-3 border-t border-[#7FE3C0]/25 shadow-2xl backdrop-blur-2xl">
      <div className="flex items-center justify-around max-w-[480px] mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl touch-target focus:outline-none select-none transition-colors"
            >
              {/* Spring Active Indicator Blob with Royal Violet Glow */}
              {isActive && (
                <motion.div
                  layoutId="active-tab-blob"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 bg-gradient-to-r from-[#7FE3C0]/20 to-[#3FB58F]/20 rounded-2xl border border-[#7FE3C0]/35 shadow-md shadow-[#5FD1AB]/30"
                />
              )}

              {/* Icon with potential badge */}
              <div className="relative z-10 flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? 'text-[#00f5ff] drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]' : 'text-[#8b8988]'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-3.5 px-1 rounded-full bg-[#f03b2a] text-[9px] font-bold text-white flex items-center justify-center shadow-sm">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`relative z-10 text-[11px] font-semibold mt-1 transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-[#8b8988]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
