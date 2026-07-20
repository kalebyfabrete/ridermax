/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'glass' | 'highlight' | 'danger';
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  onClick,
  interactive = false,
}) => {
  const baseStyles = 'rounded-2xl border transition-all duration-200 overflow-hidden';
  
  const variants = {
    default: 'bg-slate-900/60 border-slate-800/80 shadow-md backdrop-blur-sm',
    outline: 'bg-transparent border-slate-800',
    glass: 'bg-slate-950/40 border-slate-800/60 backdrop-blur-md shadow-inner',
    highlight: 'bg-gradient-to-br from-red-950/30 to-slate-900 border-red-500/30 shadow-red-500/5',
    danger: 'bg-rose-950/15 border-rose-500/20 shadow-rose-500/5',
  };

  const interactiveStyles = onClick || interactive 
    ? 'hover:border-slate-700/80 cursor-pointer active:scale-[0.98]' 
    : '';

  if (onClick || interactive) {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`${baseStyles} ${variants[variant]} ${interactiveStyles} ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};
