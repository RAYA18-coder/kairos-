/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';

/* =========================================================================
   1. GlassCard (Floating Layer: radius 28px, frosted glass, 3D pointer tilt)
   ========================================================================= */
export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  tilt?: boolean;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  tilt = false,
  className = '',
  onClick,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!tilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Max 8deg tilt
    setRotate({
      x: ((y - centerY) / centerY) * -7,
      y: ((x - centerX) / centerX) * 7,
    });
  };

  const handlePointerLeave = () => {
    if (!tilt) return;
    setRotate({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      animate={{
        rotateX: rotate.x,
        rotateY: rotate.y,
      }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      onClick={onClick}
      className={`glass-panel p-5 relative overflow-hidden transition-shadow duration-200 ${
        onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      } ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
      {...(props as any)}
    >
      {/* Specular Glare Highlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${rotate.y * 10 + 50}% ${-rotate.x * 10 + 50}%, rgba(255,255,255,0.3) 0%, transparent 60%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

/* =========================================================================
   2. ClayButton (Touchable CTA: Sage CTA with dark text, or neutral clay)
   ========================================================================= */
export interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'sage' | 'mint' | 'amber' | 'coral' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const ClayButton: React.FC<ClayButtonProps> = ({
  children,
  variant = 'sage',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(8);
      }
    } catch {
      // Haptics ignore
    }
    onClick?.(e);
  };

  const sizeStyles = {
    sm: 'text-xs h-10 px-4 rounded-2xl gap-1.5',
    md: 'text-sm h-13 px-6 rounded-3xl gap-2 font-bold',
    lg: 'text-base h-14 px-7 rounded-3xl gap-2.5 font-bold',
  }[size];

  const variantClass = {
    sage: 'clay-button-sage',
    mint: 'bg-[#7FE3C0] text-[#081B12] font-bold shadow-lg shadow-[#7FE3C0]/20 active:scale-95 border border-[#7FE3C0]/40',
    amber: 'bg-[#FFC44D] text-[#081B12] font-bold shadow-lg shadow-[#FFC44D]/20 active:scale-95 border border-[#FFC44D]/40',
    coral: 'bg-[#FF6B4A] text-white font-bold shadow-lg shadow-[#FF6B4A]/20 active:scale-95 border border-[#FF6B4A]/40',
    neutral: 'bg-[#123628] text-[#F2F7F3] font-semibold border border-white/10 active:scale-95',
  }[variant];

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.96 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={`inline-flex items-center justify-center select-none touch-target focus:outline-none transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${sizeStyles} ${variantClass} ${className}`}
      {...(props as any)}
    >
      {isLoading ? (
        <span className="animate-spin mr-2">◷</span>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};

/* =========================================================================
   3. ClayStat (Key stat tiles: focus %, minutes saved, radius 32px)
   ========================================================================= */
export interface ClayStatProps {
  label: string;
  value: string | number;
  unit?: string;
  ci?: [number | string, number | string];
  accent?: 'mint' | 'amber' | 'coral' | 'sky' | 'lime' | 'sage';
  className?: string;
}

export const ClayStat: React.FC<ClayStatProps> = ({
  label,
  value,
  unit,
  ci,
  accent = 'mint',
  className = '',
}) => {
  const accentColor = {
    mint: 'text-[#7FE3C0]',
    amber: 'text-[#FFC44D]',
    coral: 'text-[#FF6B4A]',
    sky: 'text-[#6EC8FF]',
    lime: 'text-[#B8F27A]',
    sage: 'text-[#C9E4A5]',
  }[accent];

  return (
    <div className={`clay-card p-5 flex flex-col justify-between gap-1 ${className}`}>
      <span className="text-xs font-semibold text-[rgba(242,247,243,0.62)] uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className={`text-3xl sm:text-4xl font-bold font-mono-numbers tracking-tight ${accentColor}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-[rgba(242,247,243,0.62)] font-semibold">{unit}</span>}
      </div>
      {ci && (
        <span className="text-[11px] font-mono-numbers text-[rgba(242,247,243,0.48)] mt-0.5">
          95% CI: [{ci[0]}, {ci[1]}]
        </span>
      )}
    </div>
  );
};

/* =========================================================================
   4. ClayChip (Verdict Chips: ALLOW, HOLD, BATCH, SUPPRESS)
   ========================================================================= */
export interface ClayChipProps {
  verdict: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const ClayChip: React.FC<ClayChipProps> = ({ verdict, size = 'sm', className = '' }) => {
  const norm = verdict.toUpperCase();
  const isAllow = norm.includes('ALLOW');
  const isHold = norm.includes('HOLD');
  const isBatch = norm.includes('BATCH');
  const isSuppress = norm.includes('SUPPRESS');

  let style = 'bg-[#123628] text-[#F2F7F3] border-white/20';
  let dotColor = 'bg-[#F2F7F3]';
  let label = verdict;

  if (isAllow) {
    style = 'bg-[#B8F27A]/15 text-[#B8F27A] border-[#B8F27A]/40';
    dotColor = 'bg-[#B8F27A]';
    label = 'ALLOW';
  } else if (isHold) {
    style = 'bg-[#FFC44D]/15 text-[#FFC44D] border-[#FFC44D]/40';
    dotColor = 'bg-[#FFC44D]';
    label = 'HOLD';
  } else if (isBatch) {
    style = 'bg-[#6EC8FF]/15 text-[#6EC8FF] border-[#6EC8FF]/40';
    dotColor = 'bg-[#6EC8FF]';
    label = 'BATCH';
  } else if (isSuppress) {
    style = 'bg-[#FF6B4A]/15 text-[#FF6B4A] border-[#FF6B4A]/40';
    dotColor = 'bg-[#FF6B4A]';
    label = 'SUPPRESS';
  }

  const sizeClass = size === 'sm' ? 'px-3 py-1 text-xs gap-1.5' : 'px-4 py-1.5 text-sm gap-2';

  return (
    <span
      className={`clay-chip inline-flex items-center font-bold tracking-wide border shrink-0 ${sizeClass} ${style} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shadow-sm`} />
      <span>{label}</span>
    </span>
  );
};

/* =========================================================================
   5. NeuToggle (Neumorphic switch extruded from #0D241B)
   ========================================================================= */
export interface NeuToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  className?: string;
}

export const NeuToggle: React.FC<NeuToggleProps> = ({
  checked,
  onChange,
  label,
  className = '',
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2.5 focus:outline-none cursor-pointer ${className}`}
    >
      <div
        className={`w-12 h-7 rounded-full transition-all duration-200 p-1 flex items-center ${
          checked ? 'bg-[#0E2F22] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.5)]' : 'neu-inset'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`w-5 h-5 rounded-full shadow-md ${
            checked ? 'bg-[#7FE3C0]' : 'bg-[#1C4535]'
          }`}
        />
      </div>
      {label && <span className="text-xs text-[#F2F7F3] font-medium">{label}</span>}
    </button>
  );
};

/* =========================================================================
   6. NeuSlider (Neumorphic slider knob for Twin Sync preview)
   ========================================================================= */
export interface NeuSliderProps {
  value: number; // 0 to 100
  onChange: (val: number) => void;
  label?: string;
  className?: string;
}

export const NeuSlider: React.FC<NeuSliderProps> = ({
  value,
  onChange,
  label,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-medium text-[rgba(242,247,243,0.62)]">
          <span>{label}</span>
          <span className="text-[#7FE3C0] font-mono-numbers font-bold">{Math.round(value)}%</span>
        </div>
      )}
      <div className="neu-inset h-3 w-full rounded-full relative flex items-center px-1">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-[#FFC44D] to-[#7FE3C0]"
          style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
        />
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>
    </div>
  );
};

/* =========================================================================
   7. NeuSegmented (Neumorphic segmented picker for roles and filters)
   ========================================================================= */
export interface NeuSegmentedProps<T extends string> {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

export function NeuSegmented<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: NeuSegmentedProps<T>) {
  return (
    <div className={`neu-surface p-1.5 flex items-center rounded-2xl gap-1 ${className}`}>
      {options.map((opt) => {
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all relative ${
              isSelected ? 'neu-inset text-[#7FE3C0]' : 'text-[rgba(242,247,243,0.62)] hover:text-[#F2F7F3]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================================
   8. NeuSearch (Neumorphic input for natural language scenario query)
   ========================================================================= */
export interface NeuSearchProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
}

export const NeuSearch: React.FC<NeuSearchProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Ask your twin: what if my brand manager DMs me at 11pm?',
  className = '',
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <div className={`neu-inset flex items-center gap-3 px-4 py-3 rounded-2xl w-full ${className}`}>
      <Search className="w-4 h-4 text-[#7FE3C0] shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-transparent text-xs text-[#F2F7F3] placeholder-[rgba(242,247,243,0.45)] focus:outline-none"
      />
    </div>
  );
};

/* =========================================================================
   9. BentoGrid & BentoTile (Mobile 4-col grid, 12px gap, 3D tilt)
   ========================================================================= */
export const BentoGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`bento-grid ${className}`}>{children}</div>;
};

export interface BentoTileProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: '1x1' | '2x1' | '2x2' | '4x1' | '4x2';
  tilt?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export const BentoTile: React.FC<BentoTileProps> = ({
  span = '2x1',
  tilt = true,
  className = '',
  children,
  onClick,
  ...props
}) => {
  const spanClass = {
    '1x1': 'bento-1x1',
    '2x1': 'bento-2x1',
    '2x2': 'bento-2x2',
    '4x1': 'bento-4x1',
    '4x2': 'bento-4x2',
  }[span];

  return (
    <div className={`${spanClass} h-full`}>
      <GlassCard tilt={tilt} onClick={onClick} className={`h-full ${className}`} {...props}>
        {children}
      </GlassCard>
    </div>
  );
};
