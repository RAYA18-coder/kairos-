/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';

interface BannerItem {
  id: string;
  title: string;
  body: string;
  timestamp: number;
}

export const InAppBanner: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);

  useEffect(() => {
    const handleInAppNotif = (e: Event) => {
      const customEvent = e as CustomEvent<BannerItem>;
      if (!customEvent.detail) return;
      const item = customEvent.detail;
      setBanners((prev) => [item, ...prev.slice(0, 2)]);

      // Auto dismiss after 5s
      setTimeout(() => {
        setBanners((prev) => prev.filter((b) => b.id !== item.id));
      }, 5000);
    };

    window.addEventListener('kairos:in-app-notification', handleInAppNotif);
    return () => {
      window.removeEventListener('kairos:in-app-notification', handleInAppNotif);
    };
  }, []);

  const dismiss = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="fixed top-3 inset-x-0 z-50 pointer-events-none flex flex-col items-center gap-2 px-4 max-w-[480px] mx-auto">
      <AnimatePresence>
        {banners.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="pointer-events-auto w-full glass-sheet rounded-2xl p-3.5 shadow-xl border border-white/[0.12] flex items-center justify-between gap-3 bg-[#1A1824]/95 text-[#F3F1FA]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#C6FF3D]/15 text-[#C6FF3D] flex items-center justify-center shrink-0 border border-[#C6FF3D]/30">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#F3F1FA] truncate">{item.title}</p>
                <p className="text-xs text-[#9A96AD] truncate">{item.body}</p>
              </div>
            </div>
            <button
              onClick={() => dismiss(item.id)}
              className="p-1 rounded-lg text-[#9A96AD] hover:text-[#F3F1FA] hover:bg-white/[0.08]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
