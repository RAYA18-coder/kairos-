import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';


const DURATION_MS = 3000;

/**
 * 3-second launch skeleton: app icon + shimmering placeholder blocks, then a fade-out.
 * It is a fixed overlay on top of the app, NOT a screen/route, so app navigation is untouched.
 * Shows once per app launch (module-level flag), not on every re-render.
 */
let alreadyShown = false;

export function BootLoader() {
  const [visible, setVisible] = useState(!alreadyShown);

  useEffect(() => {
    if (alreadyShown) return;
    alreadyShown = true;
    const t = setTimeout(() => setVisible(false), DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="boot"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#05060F] px-8"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45 } }}
          aria-busy="true"
          aria-label="Loading KAIROS"
          role="status"
        >
          <style>{`
            @keyframes kairos-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
            .kairos-sk{background:linear-gradient(90deg,rgba(255,255,255,.05) 25%,rgba(142,162,255,.2) 50%,rgba(255,255,255,.05) 75%);background-size:200% 100%;animation:kairos-shimmer 1.4s linear infinite;border-radius:16px}
            @media (prefers-reduced-motion: reduce){.kairos-sk{animation:none}}
          `}</style>

          <div className="w-[220px] h-[220px] rounded-full" style={{ mixBlendMode: 'screen', background: 'radial-gradient(circle, rgba(108,123,255,0.45), transparent 65%)' }} />
          <div className="mt-4 text-sm font-semibold tracking-[0.3em] text-[#F2F7F3]/80">KAIROS</div>

          <div className="mt-10 w-full max-w-[360px] space-y-3">
            <div className="kairos-sk h-24 w-full" />
            <div className="flex gap-3">
              <div className="kairos-sk h-16 flex-1" />
              <div className="kairos-sk h-16 flex-1" />
            </div>
            <div className="kairos-sk h-10 w-2/3" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
