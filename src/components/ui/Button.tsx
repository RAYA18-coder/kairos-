/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'lime' | 'raised';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
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

  const baseStyle =
    'inline-flex items-center justify-center font-medium transition-all duration-200 select-none touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D]/50 disabled:opacity-40 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'text-xs h-9 px-3.5 rounded-xl gap-1.5',
    md: 'text-sm h-12 px-5 rounded-2xl gap-2',
    lg: 'text-base h-14 px-6 rounded-2xl gap-2.5',
  }[size];

  const variantStyles = {
    primary:
      'bg-[#F3F1FA] text-[#0F0E14] hover:bg-white active:bg-[#ECE9F7] font-semibold shadow-md',
    lime: 'bg-[#C6FF3D] text-[#0F0E14] hover:bg-[#d4ff66] active:bg-[#b5f524] font-semibold shadow-md shadow-[#C6FF3D]/10',
    secondary:
      'bg-[#1A1824] hover:bg-[#242134] text-[#F3F1FA] border border-white/[0.08] active:bg-[#2c2940]',
    raised:
      'bg-[#242134] hover:bg-[#2f2b44] text-[#F3F1FA] border border-white/[0.1] active:bg-[#1a1824]',
    ghost:
      'bg-transparent hover:bg-white/[0.06] text-[#9A96AD] hover:text-[#F3F1FA] active:bg-white/[0.1]',
    danger:
      'bg-[#FF6B4A]/15 text-[#FF6B4A] hover:bg-[#FF6B4A]/25 border border-[#FF6B4A]/30 active:bg-[#FF6B4A]/35',
  }[variant];

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={`${baseStyle} ${sizeStyles} ${variantStyles} ${className}`}
      {...(props as any)}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
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
