/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'clay' | 'raised' | 'flat' | 'outline';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'clay',
  interactive = false,
  className = '',
  onClick,
  ...props
}) => {
  const variantClass = {
    clay: 'clay-card',
    raised: 'clay-metric',
    flat: 'bg-[#1A1824] rounded-3xl border border-white/[0.05]',
    outline: 'bg-transparent rounded-3xl border border-white/[0.1]',
  }[variant];

  if (interactive) {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 320, damping: 25 }}
        onClick={onClick}
        className={`${variantClass} p-5 cursor-pointer transition-colors duration-150 ${className}`}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${variantClass} p-5 ${className}`} onClick={onClick} {...props}>
      {children}
    </div>
  );
};
