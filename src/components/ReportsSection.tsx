/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Calendar, ArrowUpRight, ArrowDownRight, 
  TrendingUp, Activity, Award, ArrowLeft, Layers, Percent, Clock
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { CurrencyDisplay } from './CurrencyDisplay';
import { RideEntity, QuickExpense } from '../types';

interface ReportsSectionProps {
  rides: RideEntity[];
  expenses: QuickExpense[];
  onBack?: () => void;
}

type PeriodType = 'diario' | 'semanal' | 'mensal';

export const ReportsSection: React.FC<ReportsSectionProps> = ({ rides, expenses, onBack }) => {
  const [periodType, setPeriodType] = useState<PeriodType>('semanal');
  const [selectedOffset, setSelectedOffset] = useState<number>(0); // 0 = current, 1 = previous, etc.

  // Helper: Format date to YYYY-MM-DD
  const formatDateStr = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Helper: Get start and end of week (Monday to Sunday)
  const getWeekRange = (offsetWeeks: number) => {
    const now = new Date();
    // Adjust day to start on Monday
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const start = new Date(now);
    start.setDate(now.getDate() + distanceToMonday - (offsetWeeks * 7));
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  // Helper: Get start and end of month
  const getMonthRange = (offsetMonths: number) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - offsetMonths, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() - offsetMonths + 1, 0, 23, 59, 59, 999);
    return { start, end };
  };

  // Helper: Get start and end of day
  const getDayRange = (offsetDays: number) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - offsetDays);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  // Compute stats for a given date range
  const getPeriodStats = useMemo(() => {
    return (start: Date, end: Date) => {
      const filteredRides = rides.filter(r => {
        const d = new Date(r.timestamp);
        return d >= start && d <= end;
      });

      const filteredExpenses = expenses.filter(e => {
        const d = new Date(e.timestamp);
        return d >= start && d <= end;
      });

      const gross = filteredRides.reduce((sum, r) => sum + r.earnings, 0);
      const ridesCount = filteredRides.reduce((sum, r) => sum + r.tripsCount, 0);
      const exps = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
      const net = gross - exps;
      const avgPerRide = ridesCount > 0 ? gross / ridesCount : 0;

      // Expense categories breakdown
      const categories: Record<string, number> = {
        Abastecimento: 0,
        Alimentação: 0,
        Manutenção: 0,
        Outros: 0
      };
      filteredExpenses.forEach(e => {
        if (categories[e.category] !== undefined) {
          categories[e.category] += e.amount;
        } else {
          categories['Outros'] += e.amount;
        }
      });

      return {
        gross,
        ridesCount,
        expenses: exps,
        net,
        avgPerRide,
        categories,
        rides: filteredRides,
        expensesList: filteredExpenses
      };
    };
  }, [rides, expenses]);

  // Current selected range boundaries
  const currentRange = useMemo(() => {
    if (periodType === 'diario') {
      return getDayRange(selectedOffset);
    } else if (periodType === 'semanal') {
      return getWeekRange(selectedOffset);
    } else {
      return getMonthRange(selectedOffset);
    }
  }, [periodType, selectedOffset]);

  // Previous range boundaries for comparison
  const previousRange = useMemo(() => {
    if (periodType === 'diario') {
      return getDayRange(selectedOffset + 1);
    } else if (periodType === 'semanal') {
      return getWeekRange(selectedOffset + 1);
    } else {
      return getMonthRange(selectedOffset + 1);
    }
  }, [periodType, selectedOffset]);

  const currentStats = useMemo(() => {
    return getPeriodStats(currentRange.start, currentRange.end);
  }, [getPeriodStats, currentRange]);

  const previousStats = useMemo(() => {
    return getPeriodStats(previousRange.start, previousRange.end);
  }, [getPeriodStats, previousRange]);

  // Custom working hours state to let the user simulate real hourly wages
  const [customHoursInput, setCustomHoursInput] = useState<string>('6');
  const workingHours = parseFloat(customHoursInput) || 0;
  const avgPerHour = workingHours > 0 ? currentStats.gross / workingHours : 0;

  // Comparison message calculation
  const comparisonText = useMemo(() => {
    if (previousStats.gross <= 0) return null; // No previous data to compare
    const diff = currentStats.gross - previousStats.gross;
    const pct = Math.abs(Math.round((diff / previousStats.gross) * 100));
    
    const periodName = periodType === 'diario' ? 'ontem' : periodType === 'semanal' ? 'a semana anterior' : 'o mês anterior';
    
    if (diff > 0) {
      return {
        text: `Você faturou ${pct}% a mais que no período anterior (${periodName}).`,
        positive: true
      };
    } else if (diff < 0) {
      return {
        text: `Seu faturamento bruto está ${pct}% abaixo do período anterior (${periodName}).`,
        positive: false
      };
    } else {
      return {
        text: `Faturamento idêntico ao período anterior (${periodName}).`,
        positive: true
      };
    }
  }, [currentStats.gross, previousStats.gross, periodType]);

  // Dynamic label for period picker
  const periodLabel = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const monthOptions: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };

    if (periodType === 'diario') {
      if (selectedOffset === 0) return 'Hoje';
      if (selectedOffset === 1) return 'Ontem';
      return currentRange.start.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    } else if (periodType === 'semanal') {
      if (selectedOffset === 0) return 'Esta Semana';
      if (selectedOffset === 1) return 'Semana Passada';
      return `${currentRange.start.toLocaleDateString('pt-BR', options)} - ${currentRange.end.toLocaleDateString('pt-BR', options)}`;
    } else {
      if (selectedOffset === 0) return 'Este Mês';
      if (selectedOffset === 1) return 'Mês Passado';
      return currentRange.start.toLocaleDateString('pt-BR', monthOptions);
    }
  }, [periodType, selectedOffset, currentRange]);

  // Graph Data (by day of week if weekly, by day of month if monthly, or by Category for expenses)
  const chartBars = useMemo(() => {
    if (periodType === 'semanal') {
      // 7 days of the week starting Monday
      const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      const earningsByDay = Array(7).fill(0);
      
      currentStats.rides.forEach(r => {
        const dateObj = new Date(r.timestamp);
        // getDay: 0=Sun, 1=Mon, ..., 6=Sat
        let idx = dateObj.getDay() - 1;
        if (idx === -1) idx = 6; // Sunday to index 6
        if (idx >= 0 && idx < 7) {
          earningsByDay[idx] += r.earnings;
        }
      });

      const maxVal = Math.max(...earningsByDay, 10);

      return days.map((day, i) => ({
        label: day,
        value: earningsByDay[i],
        heightPct: (earningsByDay[i] / maxVal) * 100
      }));
    } else if (periodType === 'diario') {
      // By hour block (0-6h, 6-12h, 12-18h, 18-24h)
      const blocks = ['Madrugada', 'Manhã', 'Tarde', 'Noite'];
      const earningsByBlock = Array(4).fill(0);

      currentStats.rides.forEach(r => {
        const dateObj = new Date(r.timestamp);
        const hour = dateObj.getHours();
        if (hour >= 0 && hour < 6) earningsByBlock[0] += r.earnings;
        else if (hour >= 6 && hour < 12) earningsByBlock[1] += r.earnings;
        else if (hour >= 12 && hour < 18) earningsByBlock[2] += r.earnings;
        else earningsByBlock[3] += r.earnings;
      });

      const maxVal = Math.max(...earningsByBlock, 10);

      return blocks.map((block, i) => ({
        label: block,
        value: earningsByBlock[i],
        heightPct: (earningsByBlock[i] / maxVal) * 100
      }));
    } else {
      // Monthly - split into 4 quarters
      const quarters = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4+'];
      const earningsByWeek = Array(4).fill(0);

      currentStats.rides.forEach(r => {
        const dateObj = new Date(r.timestamp);
        const day = dateObj.getDate();
        if (day <= 7) earningsByWeek[0] += r.earnings;
        else if (day <= 14) earningsByWeek[1] += r.earnings;
        else if (day <= 21) earningsByWeek[2] += r.earnings;
        else earningsByWeek[3] += r.earnings;
      });

      const maxVal = Math.max(...earningsByWeek, 10);

      return quarters.map((q, i) => ({
        label: q,
        value: earningsByWeek[i],
        heightPct: (earningsByWeek[i] / maxVal) * 100
      }));
    }
  }, [currentStats.rides, periodType]);

  const expenseCategoriesList = Object.entries(currentStats.categories).map(([name, val]) => {
    const value = val as number;
    return {
      name,
      value,
      percentage: currentStats.expenses > 0 ? (value / currentStats.expenses) * 100 : 0
    };
  });

  const hasChartData = chartBars.some(bar => bar.value > 0);

  return (
    <div className="space-y-6">
      
      {/* Back Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button 
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <span className="text-xs uppercase tracking-widest text-red-500 font-bold font-mono block">ANÁLISE FINANCEIRA</span>
          <h2 className="text-xl font-black text-white">Relatórios & Histórico</h2>
        </div>
      </div>

      {/* Period Selector Tabs */}
      <div className="grid grid-cols-3 bg-slate-900 p-1 rounded-xl border border-slate-800">
        {(['diario', 'semanal', 'mensal'] as PeriodType[]).map(type => (
          <button
            key={type}
            onClick={() => {
              setPeriodType(type);
              setSelectedOffset(0);
            }}
            className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              periodType === type 
                ? 'bg-red-500 text-slate-950 font-black shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {type === 'diario' ? 'Diário' : type === 'semanal' ? 'Semanal' : 'Mensal'}
          </button>
        ))}
      </div>

      {/* Offset Browser Controller */}
      <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/80 rounded-xl px-4 py-2.5">
        <button
          onClick={() => setSelectedOffset(prev => prev + 1)}
          className="text-xs font-bold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 active:scale-95 transition-all"
        >
          Anterior
        </button>
        <span className="text-xs font-black text-slate-200 font-mono text-center">
          {periodLabel}
        </span>
        <button
          disabled={selectedOffset === 0}
          onClick={() => setSelectedOffset(prev => Math.max(0, prev - 1))}
          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border active:scale-95 transition-all ${
            selectedOffset === 0 
              ? 'text-slate-600 bg-slate-950/20 border-slate-900 cursor-not-allowed' 
              : 'text-slate-400 hover:text-white bg-slate-950 border-slate-800'
          }`}
        >
          Próximo
        </button>
      </div>

      {/* Comparative Alert */}
      {comparisonText && (
        <Card variant="outline" className={`p-3.5 border ${
          comparisonText.positive 
            ? 'bg-red-500/5 border-red-500/20 text-red-400' 
            : 'bg-amber-500/5 border-amber-500/20 text-amber-400'
        } flex items-center gap-3`}>
          <TrendingUp className={`w-5 h-5 ${comparisonText.positive ? 'text-red-400' : 'text-amber-400'}`} />
          <p className="text-xs font-semibold leading-normal">{comparisonText.text}</p>
        </Card>
      )}

      {/* Indicator Overview Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Faturamento Bruto */}
        <Card variant="outline" className="p-4 bg-slate-900/10 border-slate-800/80">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">FATURAMENTO BRUTO</span>
          <div className="mt-2.5">
            <CurrencyDisplay value={currentStats.gross} size="lg" trend="none" />
          </div>
          <span className="text-[9px] text-slate-500 mt-1.5 block">Total arrecadado no período</span>
        </Card>

        {/* Lucro Líquido */}
        <Card variant="outline" className="p-4 bg-slate-900/10 border-slate-800/80 border-l-2 border-l-red-500">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">SOBROU LÍQUIDO</span>
          <div className="mt-2.5">
            <CurrencyDisplay value={currentStats.net} size="lg" trend={currentStats.net > 0 ? 'positive' : 'none'} />
          </div>
          <span className="text-[9px] text-slate-500 mt-1.5 block">Ganhos menos despesas</span>
        </Card>

        {/* Quantidade Corridas */}
        <Card variant="outline" className="p-4 bg-slate-900/10 border-slate-800/80">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">TOTAL CORRIDAS</span>
          <div className="mt-2 text-baseline flex items-baseline gap-1">
            <span className="text-2xl font-black font-mono text-slate-100">{currentStats.ridesCount}</span>
            <span className="text-xs text-slate-500">viagens</span>
          </div>
          <span className="text-[9px] text-slate-500 mt-1.5 block">Atendimentos executados</span>
        </Card>

        {/* Gasto Total */}
        <Card variant="outline" className="p-4 bg-slate-900/10 border-slate-800/80">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">GASTOS DO PERÍODO</span>
          <div className="mt-2.5">
            <CurrencyDisplay value={currentStats.expenses} size="lg" trend={currentStats.expenses > 0 ? 'negative' : 'none'} />
          </div>
          <span className="text-[9px] text-slate-500 mt-1.5 block">Soma de todas despesas</span>
        </Card>

        {/* Média por Corrida */}
        <Card variant="outline" className="p-4 bg-slate-900/10 border-slate-800/80">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">TICKET MÉDIO / CORRIDA</span>
          <div className="mt-2.5">
            <CurrencyDisplay value={currentStats.avgPerRide} size="md" trend="none" />
          </div>
          <span className="text-[9px] text-slate-500 mt-1.5 block">Valor médio por corrida</span>
        </Card>

        {/* Média por Hora (Simulada/Interativa) */}
        <Card variant="outline" className="p-4 bg-slate-900/10 border-slate-800/80">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">MÉDIA HORÁRIA</span>
          <div className="mt-2.5">
            <CurrencyDisplay value={avgPerHour} size="md" trend="none" />
          </div>
          <span className="text-[9px] text-slate-500 mt-1.5 block">Média por hora trabalhada</span>
        </Card>

      </div>

      {/* Working Hours Simulation Tool */}
      <Card variant="glass" className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-red-400" />
            <h4 className="text-xs font-bold text-slate-200">Métrica de Horas Trabalhadas</h4>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-850">
            <input 
              type="number" 
              value={customHoursInput}
              onChange={(e) => setCustomHoursInput(e.target.value)}
              className="w-10 bg-transparent text-center font-mono font-bold text-xs text-red-400 focus:outline-none"
              min="0.1"
              step="0.5"
            />
            <span className="text-[10px] text-slate-500 uppercase font-bold font-mono">HORAS</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal">
          Insira a quantidade estimada de horas que você trabalhou neste período para obter o cálculo exato de faturamento médio por hora.
        </p>
      </Card>

      {/* Visual Chart: Period Earnings Breakdown */}
      <Card variant="default" className="p-5 border-slate-800/80 bg-slate-900/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">Faturamento ao Longo do Período</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Visão gráfica da evolução do faturamento bruto</p>
          </div>
          <BarChart3 className="w-4 h-4 text-slate-500" />
        </div>

        {hasChartData ? (
          <div className="space-y-4 pt-2">
            {/* Visual Bars Container */}
            <div className="h-28 flex items-end gap-3.5 px-2 pb-1 border-b border-slate-800/60">
              {chartBars.map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-850 text-[9px] font-mono px-1.5 py-0.5 rounded-md absolute -translate-y-8 text-red-400 font-bold shadow-lg pointer-events-none">
                    R$ {bar.value.toFixed(0)}
                  </div>
                  
                  {/* Bar fill */}
                  <div 
                    className="w-full bg-slate-850 rounded-t-md hover:bg-red-500/90 transition-all duration-300 relative overflow-hidden"
                    style={{ height: `${Math.max(4, bar.heightPct)}%` }}
                  >
                    {bar.value > 0 && (
                      <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-red-400/80" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* X Axis Labels */}
            <div className="flex justify-between px-2 text-[9px] font-bold text-slate-500 font-mono">
              {chartBars.map((bar, idx) => (
                <span key={idx} className="flex-1 text-center truncate">{bar.label}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-28 flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-850 rounded-xl">
            <span className="text-xs font-bold">Sem dados no período</span>
            <span className="text-[10px] opacity-70 mt-1">Lançar corridas para ver a evolução gráfica</span>
          </div>
        )}
      </Card>

      {/* GASTOS POR CATEGORIA */}
      <Card variant="default" className="p-5 border-slate-800/80 bg-slate-900/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">Distribuição das Despesas</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Destinação dos recursos gastos no período</p>
          </div>
          <Activity className="w-4 h-4 text-rose-500" />
        </div>

        {currentStats.expenses > 0 ? (
          <div className="space-y-3.5">
            {expenseCategoriesList.map(cat => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">{cat.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-100 font-mono font-bold">R$ {cat.value.toFixed(2).replace('.', ',')}</span>
                    <span className="text-[10px] font-mono text-slate-500">({cat.percentage.toFixed(0)}%)</span>
                  </div>
                </div>
                
                {/* Visual bar tracker */}
                <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden border border-slate-900">
                  <div 
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-24 flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-850 rounded-xl">
            <span className="text-xs font-bold">Nenhum gasto no período</span>
            <span className="text-[10px] opacity-70 mt-1">Sua rota está 100% livre de despesas operacionais!</span>
          </div>
        )}
      </Card>

    </div>
  );
};
