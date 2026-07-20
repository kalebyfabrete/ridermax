/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface CurrencyDisplayProps {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  trend?: 'none' | 'positive' | 'negative' | 'neutral';
  className?: string;
  showSign?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  value,
  size = 'md',
  trend = 'none',
  className = '',
  showSign = false,
}) => {
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  const [integers, cents] = formatted.split(',');

  // Sizes classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base md:text-lg',
    lg: 'text-xl md:text-2xl font-bold',
    xl: 'text-2xl md:text-3xl font-extrabold',
    '2xl': 'text-3xl md:text-4xl font-extrabold tracking-tight',
    '3xl': 'text-4xl md:text-5xl font-black tracking-tight',
    '4xl': 'text-5xl md:text-6xl font-black tracking-tight',
  };

  const trendClasses = {
    none: 'text-slate-100 dark:text-white',
    positive: 'text-red-500 font-bold',
    negative: 'text-rose-500 font-bold',
    neutral: 'text-slate-300',
  };

  const sign = showSign && value !== 0 ? (value > 0 ? '+' : '-') : '';

  return (
    <div className={`font-mono inline-flex items-baseline font-semibold ${trendClasses[trend]} ${className}`}>
      <span className="text-xs mr-1 opacity-70 font-sans tracking-wide">R$</span>
      <span className={`${sizeClasses[size]} tabular-nums leading-none`}>
        {sign}{integers}
      </span>
      <span className="text-xs opacity-80 font-semibold leading-none">
        ,{cents}
      </span>
    </div>
  );
};
