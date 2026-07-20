/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Compass, DollarSign, Menu } from 'lucide-react';
import { motion } from 'motion/react';

export type TabId = 'inicio' | 'corridas' | 'financeiro' | 'mais';

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<any>;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const items: NavItem[] = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'corridas', label: 'Corridas', icon: Compass },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'mais', label: 'Mais', icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/80 dark:bg-slate-950/85 backdrop-blur-lg border-t border-slate-800/80 pb-safe-bottom">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="relative flex flex-col items-center justify-center w-16 h-full text-slate-400 hover:text-slate-100 transition-colors focus:outline-none"
              aria-label={item.label}
            >
              {/* Highlight background */}
              {isActive && (
                <motion.span
                  layoutId="active-tab-glow"
                  className="absolute inset-x-1 top-1 bottom-1 bg-red-500/5 dark:bg-red-500/10 rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Active Indicator Top Line */}
              {isActive && (
                <motion.span
                  layoutId="active-tab-line"
                  className="absolute top-0 w-8 h-1 bg-red-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'text-red-400 scale-110' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-300'
                }`}
              />

              <span
                className={`text-[10px] mt-1 font-medium tracking-wide transition-colors ${
                  isActive ? 'text-slate-100 font-bold' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
