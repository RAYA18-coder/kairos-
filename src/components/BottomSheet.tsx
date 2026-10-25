/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        onClick={() => {
          triggerHaptic('light');
          onClose();
        }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Drawer Card */}
      <div className="relative z-10 w-full max-w-[430px] mx-auto bg-[#0d1017] border-t border-white/10 rounded-t-3xl max-h-[85dvh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Pull handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-3 border-b border-white/[0.06]">
          <div>
            <h3 className="text-base font-medium text-white font-sans">{title}</h3>
            {subtitle && (
              <p className="text-xs text-zinc-400 font-sans mt-0.5 tracking-wide">{subtitle}</p>
            )}
          </div>
          <button
            onClick={() => {
              triggerHaptic('selection');
              onClose();
            }}
            className="p-1.5 rounded-full bg-white/[0.05] hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-4 pb-safe">{children}</div>
      </div>
    </div>
  );
};
