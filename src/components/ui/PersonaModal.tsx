/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useKairosStore } from '../../store/useKairosStore';
import { X, Check, Brain, Sliders, Shield, Code, Sparkles, GraduationCap, Briefcase } from 'lucide-react';
import { UserRole } from '../../native/importanceLearner';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonaModal: React.FC<PersonaModalProps> = ({ isOpen, onClose }) => {
  const activePersona = useKairosStore((s) => s.activePersona);
  const setActivePersona = useKairosStore((s) => s.setActivePersona);
  const setRole = useKairosStore((s) => s.setRole);
  const setCurrentView = useKairosStore((s) => s.setCurrentView);

  const personas: {
    id: 'arjun' | 'meera' | 'kabir' | 'rohan';
    name: string;
    role: UserRole;
    archetypeTitle: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    apps: string;
  }[] = [
    {
      id: 'arjun',
      name: 'Arjun',
      role: 'developer',
      archetypeTitle: 'Deep Work Coder',
      description: 'Protects 35m+ flow states. Suppresses social feeds, allows urgent GitHub PRs & server alerts.',
      icon: <Code className="w-5 h-5 text-[#00f5ff]" />,
      color: '#00f5ff',
      apps: 'VS Code · GitHub · Slack',
    },
    {
      id: 'meera',
      name: 'Meera',
      role: 'creator',
      archetypeTitle: 'Digital Content Creator',
      description: 'Balances content production & audience engagement. Batches likes into 21:00 digest, alerts for sponsors.',
      icon: <Sparkles className="w-5 h-5 text-[#FF6B4A]" />,
      color: '#FF6B4A',
      apps: 'Instagram · YouTube · TikTok',
    },
    {
      id: 'kabir',
      name: 'Kabir',
      role: 'student',
      archetypeTitle: 'Exam Aspirant',
      description: 'Split focus morning & evening. Strict detour resistance against infinite doomscrolling.',
      icon: <GraduationCap className="w-5 h-5 text-[#38BDF8]" />,
      color: '#38BDF8',
      apps: 'Notion · Telegram · Reddit',
    },
    {
      id: 'rohan',
      name: 'Rohan',
      role: 'founder',
      archetypeTitle: 'Startup Founder',
      description: 'Early chronotype. Filters low-signal noise, prioritizes investor, co-founder & customer escalations.',
      icon: <Briefcase className="w-5 h-5 text-[#F59E0B]" />,
      color: '#F59E0B',
      apps: 'Slack · Gmail · Calendar',
    },
  ];

  const handleSelectPersona = (p: typeof personas[0]) => {
    setActivePersona(p.id);
    setRole(p.role);
    onClose();
  };

  const handleOpenCustomBuilder = () => {
    setCurrentView('builder');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative z-10 w-full max-w-md max-h-[88vh] rounded-3xl bg-[#06120D] border border-[#7FE3C0]/35 shadow-2xl p-5 sm:p-6 flex flex-col gap-4 select-none violet-glow-line my-auto overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7FE3C0] to-[#3FB58F] flex items-center justify-center shadow-md shadow-[#5FD1AB]/40">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Choose Active Persona</h3>
                  <p className="text-[11px] text-[#8b8988]">Select attention profile or calibrate your twin</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8b8988] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Persona List */}
            <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto no-scrollbar">
              {personas.map((p) => {
                const isSelected = activePersona === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPersona(p)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#7FE3C0]/25 to-transparent border-[#7FE3C0] shadow-lg shadow-[#5FD1AB]/20'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                          {p.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{p.name}</span>
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${p.color}22`,
                                color: p.color,
                                border: `1px solid ${p.color}44`,
                              }}
                            >
                              {p.archetypeTitle}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#00f5ff] flex items-center justify-center text-black">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-[#8b8988] leading-relaxed pl-10">
                      {p.description}
                    </p>

                    <div className="pl-10 text-[10px] text-white/50 font-mono-numbers">
                      Active: {p.apps}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom: Custom Persona Builder Trigger */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#8b8988]">Need fine-grained tuning?</span>
              <button
                onClick={handleOpenCustomBuilder}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-[#00f5ff] flex items-center gap-1.5 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Persona Builder</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
