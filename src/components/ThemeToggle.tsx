/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onChange: (theme: 'light' | 'dark') => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onChange }) => {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => onChange(isDark ? 'light' : 'dark')}
      className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 text-slate-300 hover:text-white transition-colors cursor-pointer relative overflow-hidden"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ y: isDark ? 0 : 30, opacity: isDark ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <Moon className="w-5 h-5 text-red-400" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ y: isDark ? -30 : 0, opacity: isDark ? 0 : 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="absolute inset-0 m-auto w-5 h-5"
      >
        <Sun className="w-5 h-5 text-amber-500" />
      </motion.div>
    </button>
  );
};
