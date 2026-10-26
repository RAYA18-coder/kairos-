/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';

/**
 * App-wide animated backdrop: the Nexus motion video, played as-is behind every
 * screen. (Component name kept so App.tsx is unchanged.)
 *
 * The clip is black-backed, so `mix-blend-mode: screen` drops the black away and
 * only the glowing orb is left floating over the page. The glass panels above
 * then blur it. The end of the clip fades out/in so the loop has no hard cut.
 */
const FADE_S = 0.7;

export const NeuroBrainBackground: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true);
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    // Some mobile browsers only allow playback after a first touch
    window.addEventListener('pointerdown', tryPlay, { once: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tryPlay();
    });
    return () => window.removeEventListener('pointerdown', tryPlay);
  }, []);

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setVisible(v.duration - v.currentTime > FADE_S);
  };

  const onEnded = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
    setVisible(true);
  };

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#05060F]">
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[6dvh]"
        style={{
          width: 'min(100vw, 92dvh)',
          aspectRatio: '1 / 1',
          opacity: visible ? 1 : 0,
          transition: `opacity ${FADE_S}s ease`,
          mixBlendMode: 'screen',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 52%, transparent 71%)',
          maskImage: 'radial-gradient(circle at 50% 50%, #000 52%, transparent 71%)',
        }}
      >
        {reduced ? (
          <img src="/nexus-poster.jpg" alt="" className="w-full h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            src="/nexus-bg.mp4"
            poster="/nexus-poster.jpg"
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            onTimeUpdate={onTimeUpdate}
            onEnded={onEnded}
          />
        )}
      </div>

      {/* Indigo bloom so the orb feels lit into the page */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[420px] rounded-full bg-[#6C7BFF]/12 blur-[130px]" />

      {/* Vignette keeps text legible */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 38%, rgba(5,6,15,0) 0%, rgba(5,6,15,0.7) 90%)' }}
      />
    </div>
  );
};
