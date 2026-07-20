/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-red-500 text-slate-950 hover:bg-red-400 border border-red-400/20 shadow-lg shadow-red-500/10 active:bg-red-600',
    secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 active:bg-slate-900',
    outline: 'border-2 border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 hover:bg-slate-900/40',
    danger: 'bg-rose-500 text-white hover:bg-rose-400 border border-rose-400/20 shadow-lg shadow-rose-500/10 active:bg-rose-600',
    ghost: 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 active:bg-slate-800',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-3 text-sm gap-2',
    lg: 'px-6 py-4 text-base gap-3.5',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full flex' : ''}
        ${className}
      `}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
};
