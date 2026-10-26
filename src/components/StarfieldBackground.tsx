/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

export const StarfieldBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Procedural Stars
    const starCount = Math.min(220, Math.floor((width * height) / 4500));
    const stars: {
      x: number;
      y: number;
      size: number;
      alpha: number;
      baseAlpha: number;
      speed: number;
      phase: number;
    }[] = [];

    for (let i = 0; i < starCount; i++) {
      const baseAlpha = 0.2 + Math.random() * 0.75;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() < 0.85 ? Math.random() * 1.4 + 0.6 : Math.random() * 2.2 + 1.2,
        alpha: baseAlpha,
        baseAlpha,
        speed: 0.005 + Math.random() * 0.015,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle deep cosmos background gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.2,
        10,
        width * 0.5,
        height * 0.3,
        width * 0.8
      );
      bgGrad.addColorStop(0, 'rgba(40, 10, 75, 0.25)');
      bgGrad.addColorStop(0.5, 'rgba(15, 4, 30, 0.15)');
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Render Stars with gentle scintillation
      for (const star of stars) {
        star.phase += star.speed;
        const currentAlpha = star.baseAlpha * (0.65 + 0.35 * Math.sin(star.phase));
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Extra twinkle flare on larger stars
        if (star.size > 2.0 && currentAlpha > 0.7) {
          ctx.strokeStyle = `rgba(180, 120, 255, ${(currentAlpha * 0.4).toFixed(3)})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(star.x - star.size * 2, star.y);
          ctx.lineTo(star.x + star.size * 2, star.y);
          ctx.moveTo(star.x, star.y - star.size * 2);
          ctx.lineTo(star.x, star.y + star.size * 2);
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Top Brain Ambient Violet Arch Flare */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-[#5FD1AB]/15 blur-[120px] pointer-events-none" />
    </div>
  );
};
