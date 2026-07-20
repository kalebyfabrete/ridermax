/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, TrendingUp, HelpCircle, 
  Plus, Minus, Receipt, Check, X, 
  Flame, Award, Trophy, Compass, ArrowUpRight, ArrowDownRight,
  TrendingDown, CheckCircle2, ChevronRight, Coins
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
import { UserProfile, ActiveShift, RideEntity, QuickExpense, ExpenseLimit } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardViewProps {
  profile: UserProfile;
  activeShift: ActiveShift | null;
  onStartShift: () => void;
  onEndShift: () => void;
  rides: RideEntity[];
  expenses: QuickExpense[];
  onAddRide: (rideData: Omit<RideEntity, 'id' | 'shiftId' | 'status' | 'app' | 'distance' | 'durationMinutes'>) => void;
  onAddExpense: (amount: number, category: 'Abastecimento' | 'Alimentação' | 'Manutenção' | 'Outros', description: string) => void;
  initialCash: number;
  expenseLimits: ExpenseLimit[];
  onUpdateInitialCash: (amount: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  activeShift,
  onStartShift,
  onEndShift,
  rides,
  expenses,
  onAddRide,
  onAddExpense,
  initialCash,
  expenseLimits,
  onUpdateInitialCash,
}) => {
  // Modal toggle states
  const [isRideModalOpen, setIsRideModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Toast notifications for instant feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual hours state for estimating productivity when shift is inactive
  const [manualHours, setManualHours] = useState<number>(5);

  // Calculate stats for current day
  const totalGross = rides.reduce((sum, r) => sum + r.earnings, 0);
  const totalRidesCount = rides.reduce((sum, r) => sum + r.tripsCount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalNet = totalGross - totalExpenses;

  // Compute worked hours
  const workedHours = activeShift 
    ? Math.max(0.1, Number(((Date.now() - new Date(activeShift.startTime).getTime()) / (1000 * 60 * 60)).toFixed(1)))
    : manualHours;

  // Calculate historical baseline average per hour (e.g. from previous rides)
  const historicalAveragePerHour = React.useMemo(() => {
    // If we have previous rides, calculate average.
    // If there is no previous data, let's default to R$ 22.00/h
    const pastRides = rides.filter(r => {
      if (!activeShift) return true;
      return r.shiftId !== activeShift.id;
    });
    if (pastRides.length === 0) return 22.00;
    
    const totalPastGross = pastRides.reduce((sum, r) => sum + r.earnings, 0);
    const uniqueDays = new Set(pastRides.map(r => r.timestamp.split('T')[0])).size || 1;
    return Number((totalPastGross / (uniqueDays * 5)).toFixed(2)); // average faturamento/hour
  }, [rides, activeShift]);

  const faturamentoMedioHora = workedHours > 0 ? (totalGross / workedHours) : 0;
  const lucroMedioHora = workedHours > 0 ? (totalNet / workedHours) : 0;
  const valorMedioCorrida = totalRidesCount > 0 ? (totalGross / totalRidesCount) : 0;

  // Performance classification
  let performanceRating: 'Abaixo da média' | 'Dentro da média' | 'Acima da média' = 'Dentro da média';
  const ratio = historicalAveragePerHour > 0 ? faturamentoMedioHora / historicalAveragePerHour : 1;
  if (totalGross === 0) {
    performanceRating = 'Abaixo da média';
  } else if (ratio < 0.85) {
    performanceRating = 'Abaixo da média';
  } else if (ratio > 1.15) {
    performanceRating = 'Acima da média';
  }

  // Physical Cash Box calculations (exclude non-cash payment methods)
  const cashEarnings = rides
    .filter(r => r.paymentMethod === 'Dinheiro')
    .reduce((sum, r) => sum + r.earnings, 0);
  const expectedCash = initialCash + cashEarnings - totalExpenses;

  // Calculate expense limit statuses for dashboard alerts
  const limitStatuses = expenseLimits.map(limit => {
    const consumed = expenses
      .filter(e => e.category === limit.category)
      .reduce((sum, e) => sum + e.amount, 0);
    const percentage = limit.amount > 0 ? (consumed / limit.amount) * 100 : 0;
    
    let state: 'normal' | 'atencao' | 'atingido' | 'ultrapassado' = 'normal';
    if (limit.enabled) {
      if (consumed > limit.amount) {
        state = 'ultrapassado';
      } else if (consumed === limit.amount) {
        state = 'atingido';
      } else if (percentage >= 80) {
        state = 'atencao';
      }
    }
    return { ...limit, consumed, percentage, state };
  });

  const activeAlerts = limitStatuses.filter(s => s.enabled && s.state !== 'normal');

  const rawProgress = profile.dailyGoal > 0 ? (totalGross / profile.dailyGoal) * 100 : 0;
  const progressPercent = Math.min(100, Math.round(rawProgress));
  const isGoalHit = totalGross >= profile.dailyGoal;
  const isGoalExceeded = totalGross > profile.dailyGoal;
  const missingToGoal = Math.max(0, profile.dailyGoal - totalGross);

  // Dashboard state categorization
  let dayState: 'no-data' | 'in-progress' | 'goal-hit' | 'goal-exceeded' = 'no-data';
  if (rides.length === 0 && expenses.length === 0) {
    dayState = 'no-data';
  } else if (isGoalExceeded) {
    dayState = 'goal-exceeded';
  } else if (isGoalHit) {
    dayState = 'goal-hit';
  } else {
    dayState = 'in-progress';
  }

  // State colors & configurations for custom headings
  const stateHeaderConfig = {
    'no-data': {
      badge: 'Fase de Preparação',
      badgeClass: 'bg-slate-900 border-slate-800 text-slate-400',
      title: 'Pronto para Rodar?',
      desc: 'Nenhum lançamento registrado hoje. Clique em Lançar Corrida abaixo.',
      icon: <Compass className="w-5 h-5 text-slate-400" />
    },
    'in-progress': {
      badge: 'Operação Ativa',
      badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/5',
      title: 'Rumo à Meta 🎯',
      desc: `Faltam apenas R$ ${missingToGoal.toFixed(2).replace('.', ',')} para atingir seu objetivo.`,
      icon: <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
    },
    'goal-hit': {
      badge: 'Meta Atingida',
      badgeClass: 'bg-red-500/15 border-red-500/30 text-red-400 shadow-lg shadow-red-500/5',
      title: 'Meta Batida! 🏁',
      desc: 'Parabéns, você atingiu seu objetivo financeiro planejado para hoje!',
      icon: <Award className="w-5 h-5 text-red-400 animate-bounce" />
    },
    'goal-exceeded': {
      badge: 'Superlucrativo',
      badgeClass: 'bg-gradient-to-r from-red-500/20 to-teal-500/20 border-red-500/40 text-red-300 shadow-lg shadow-red-500/10',
      title: 'Ganhos Recordes! 🚀',
      desc: `Você ultrapassou sua meta diária por R$ ${(totalGross - profile.dailyGoal).toFixed(2).replace('.', ',')} extras!`,
      icon: <Trophy className="w-5 h-5 text-red-400 animate-pulse" />
    }
  };

  const currentHeader = stateHeaderConfig[dayState];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-28 relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 left-4 right-4 z-50 max-w-sm mx-auto bg-slate-900 border border-red-500/40 shadow-xl shadow-red-500/10 rounded-xl px-4 py-3 flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-100">{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Profile / Operational Mode */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs uppercase tracking-widest text-red-500 font-bold font-mono">
            ESTADO OPERACIONAL
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white mt-0.5">
            Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-red-400">{profile.name}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-slate-500"></span>
            {profile.vehicleModel} • <span className="uppercase font-mono text-[10px] bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">{profile.vehicleType}</span>
          </p>
        </div>

        {/* Dynamic Shift Badge */}
        <div className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider font-mono flex items-center gap-1.5 transition-all duration-300 ${
          activeShift 
            ? 'bg-red-500/10 border-red-500/30 text-red-400' 
            : 'bg-slate-900 border-slate-800 text-slate-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${activeShift ? 'bg-red-400 animate-pulse' : 'bg-slate-600'}`}></span>
          {activeShift ? 'EM ROTA' : 'DESCONECTADO'}
        </div>
      </div>

      {/* Dynamic State Feedback Banner */}
      <Card variant={isGoalHit ? 'highlight' : 'glass'} className="p-4 relative overflow-hidden border-l-4 border-l-red-500">
        <div className="flex items-start gap-3 relative z-10">
          <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
            {currentHeader.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white">{currentHeader.title}</h2>
              <span className={`text-[8px] font-black uppercase font-mono px-1.5 py-0.5 rounded border ${currentHeader.badgeClass}`}>
                {currentHeader.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{currentHeader.desc}</p>
          </div>
        </div>
      </Card>

      {/* Expense Limit Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-rose-500 font-bold font-mono block">
            ALERTAS DE LIMITES DE GASTOS
          </span>
          <div className="space-y-2">
            {activeAlerts.map(alert => (
              <div 
                key={alert.category}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors duration-200 ${
                  alert.state === 'ultrapassado' 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                    : alert.state === 'atingido' 
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' 
                      : 'bg-amber-500/5 border-amber-500/20 text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.state === 'ultrapassado' ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
                  }`} />
                  <div>
                    <span className="font-bold">{alert.category}: </span>
                    <span>
                      {alert.state === 'ultrapassado' 
                        ? 'Limite Ultrapassado!' 
                        : alert.state === 'atingido' 
                          ? 'Limite Atingido!' 
                          : 'Atenção: Limite Próximo!'}
                    </span>
                    <span className="block text-[10px] opacity-70 mt-0.5">
                      Gasto: R$ {alert.consumed.toFixed(2).replace('.', ',')} / Limite: R$ {alert.amount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs">
                  {alert.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Core Bento Grid */}
      <div className="space-y-4">
        
        {/* Row 1: Estimated Net Profit (Hero Card) */}
        <Card variant="default" className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/15 border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Coins className="w-24 h-24 text-red-400" />
          </div>

          <span className="text-[10px] font-black tracking-widest text-red-400 uppercase font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            SOBROU LÍQUIDO (RESULTADO DO DIA)
          </span>

          <div className="mt-3 flex justify-between items-baseline">
            <CurrencyDisplay value={totalNet} size="4xl" trend={totalNet > 0 ? 'positive' : totalNet < 0 ? 'negative' : 'none'} />
            <div className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
              totalNet >= 0 ? 'bg-red-500/10 text-red-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {totalNet >= 0 ? 'SALDO POSITIVO' : 'DEFICITÁRIO'}
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-3.5 border-t border-slate-800/80 text-xs text-slate-500">
            <span>Faturamento Bruto: <span className="text-slate-300 font-bold font-mono">R$ {totalGross.toFixed(2).replace('.', ',')}</span></span>
            <span>Despesas Gastas: <span className="text-rose-400/90 font-bold font-mono">R$ {totalExpenses.toFixed(2).replace('.', ',')}</span></span>
          </div>
        </Card>

        {/* Caixa Físico Card */}
        <Card variant="outline" className="p-5 border-slate-800 bg-slate-900/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Coins className="w-16 h-16 text-amber-400" />
          </div>

          <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            CAIXA FÍSICO DO DIA (DINHEIRO EM MÃOS)
          </span>

          <div className="mt-3 flex justify-between items-baseline flex-wrap gap-2">
            <CurrencyDisplay value={expectedCash} size="2xl" trend="none" />
            
            {/* Set Initial Cash Button */}
            <button
              onClick={() => {
                const val = window.prompt("Defina o valor do caixa inicial do dia (R$):", initialCash.toString());
                if (val !== null) {
                  const num = parseFloat(val.replace(',', '.'));
                  if (!isNaN(num) && num >= 0) {
                    onUpdateInitialCash(Number(num.toFixed(2)));
                    triggerToast(`Caixa inicial definido para R$ ${num.toFixed(2)}`);
                  } else {
                    alert("Por favor, digite um valor numérico válido.");
                  }
                }
              }}
              className="text-[10px] font-bold font-mono text-amber-400 border border-amber-500/30 hover:border-amber-400 bg-amber-500/5 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
            >
              Definir Caixa Inicial: R$ {initialCash.toFixed(2).replace('.', ',')}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
            <div>
              <span>Inicial:</span>
              <span className="text-slate-300 font-bold block">R$ {initialCash.toFixed(2).replace('.', ',')}</span>
            </div>
            <div>
              <span>Em Dinheiro (+):</span>
              <span className="text-red-400 font-bold block">R$ {cashEarnings.toFixed(2).replace('.', ',')}</span>
            </div>
            <div>
              <span>Saídas (-):</span>
              <span className="text-rose-400 font-bold block">R$ {totalExpenses.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </Card>

        {/* Row 2: Secondary Metric Grid */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Card 1: Faturamento Bruto */}
          <Card variant="outline" className="p-4 bg-slate-900/10 border-slate-800/80">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">FATURAMENTO BRUTO</span>
            <div className="mt-2 flex items-center justify-between">
              <CurrencyDisplay value={totalGross} size="lg" trend="none" />
              <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
              </div>
            </div>
          </Card>

          {/* Card 2: Gastos do Dia */}
          <Card variant="outline" className="p-4 bg-slate-900/10 border-slate-800/80">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">GASTOS DO DIA</span>
            <div className="mt-2 flex items-center justify-between">
              <CurrencyDisplay value={totalExpenses} size="lg" trend={totalExpenses > 0 ? 'negative' : 'none'} />
              <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              </div>
            </div>
          </Card>

          {/* Card 3: Quantidade de Corridas */}
          <Card variant="outline" className="p-4 bg-slate-900/10 border-slate-800/80">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">CORRIDAS REALIZADAS</span>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-slate-100">{totalRidesCount}</span>
                <span className="text-xs text-slate-500">corridas</span>
              </div>
              <div className="text-[10px] font-mono font-bold text-red-500 bg-red-500/5 px-1.5 py-0.5 rounded">
                Média: R$ {totalRidesCount > 0 ? (totalGross / totalRidesCount).toFixed(2).replace('.', ',') : '0,00'}
              </div>
            </div>
          </Card>

          {/* Card 4: Meta Diária */}
          <Card variant="outline" className="p-4 bg-slate-900/10 border-slate-800/80">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">META DE FATURAMENTO</span>
            <div className="mt-2 flex items-center justify-between">
              <CurrencyDisplay value={profile.dailyGoal} size="lg" trend="none" />
              <div className="text-[10px] font-bold font-mono text-slate-400">
                {progressPercent}%
              </div>
            </div>
          </Card>

        </div>

        {/* Dynamic Goal Progress Indicator Block */}
        <Card variant="glass" className="p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-mono">Progresso: <span className="text-red-400 font-black">{progressPercent}%</span></span>
            <span className="text-slate-500 font-mono">
              {isGoalHit 
                ? 'Meta Superada! 🎉' 
                : `Falta: R$ ${missingToGoal.toFixed(2).replace('.', ',')}`}
            </span>
          </div>

          <div className="w-full bg-slate-850 h-3 rounded-full overflow-hidden relative border border-slate-800">
            <div 
              className={`h-full rounded-full transition-all duration-500 shadow-md ${
                isGoalHit 
                  ? 'bg-gradient-to-r from-red-500 to-teal-400 shadow-red-500/20' 
                  : 'bg-gradient-to-r from-amber-500 to-red-400 shadow-amber-500/10'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>R$ 0,00</span>
            <span className="text-red-400 font-black">Meta: R$ {profile.dailyGoal.toFixed(2).replace('.', ',')}</span>
          </div>
        </Card>

      </div>

      {/* Main Operational Buttons */}
      <div className="space-y-3 pt-2">
        <Button 
          variant="primary" 
          size="lg" 
          fullWidth 
          onClick={() => setIsRideModalOpen(true)}
          className="py-4 text-base tracking-wide shadow-red-500/10 border-t border-t-red-300/10"
        >
          <Plus className="w-5 h-5" />
          Lançar Corrida
        </Button>

        <Button 
          variant="secondary" 
          size="md" 
          fullWidth 
          onClick={() => setIsExpenseModalOpen(true)}
          className="py-3 border border-slate-700/60"
        >
          <Receipt className="w-4 h-4 text-rose-400" />
          Lançar Gasto Rápido
        </Button>
      </div>

      {/* Shift Management & Dynamic Productivity Card */}
      <Card variant="outline" className="p-5 border-slate-800 bg-slate-900/10 mt-4 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-850">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${activeShift ? 'bg-red-400 animate-pulse' : 'bg-slate-600'}`} />
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">Turno & Produtividade</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {activeShift ? 'Métricas de jornada em tempo real' : 'Defina as horas trabalhadas abaixo'}
              </p>
            </div>
          </div>
          <div>
            {activeShift ? (
              <Button variant="danger" size="sm" onClick={onEndShift} className="text-[10px] font-black uppercase tracking-wider py-1.5 px-3">
                Parar Turno
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={onStartShift} className="text-[10px] font-black uppercase tracking-wider py-1.5 px-3 shadow-red-500/10">
                Iniciar Turno
              </Button>
            )}
          </div>
        </div>

        {/* Worked Hours controller */}
        {!activeShift && (
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-900">
            <span className="text-xs font-bold text-slate-400">Tempo de Jornada Estimado:</span>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setManualHours(prev => Math.max(1, prev - 1))}
                className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-300"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-black text-white w-12 text-center">{manualHours}h</span>
              <button 
                type="button"
                onClick={() => setManualHours(prev => Math.min(24, prev + 1))}
                className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-300"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Real-Time Productivity metrics and Performance indicator */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Lucro Líquido Estimado</span>
              <span className="text-base font-mono font-black text-slate-100 block mt-1">
                R$ {totalNet.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                R$ {totalGross.toFixed(0)} bruto / R$ {totalExpenses.toFixed(0)} gastos
              </span>
            </div>

            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Lucro Médio por Hora</span>
              <span className="text-base font-mono font-black text-red-400 block mt-1">
                R$ {lucroMedioHora.toFixed(2).replace('.', ',')}/h
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Faturamento: R$ {faturamentoMedioHora.toFixed(0)}/h
              </span>
            </div>
          </div>

          {/* Performance Badge Banner */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors duration-300 ${
            performanceRating === 'Acima da média'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : performanceRating === 'Dentro da média'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase block tracking-wider font-mono">Desempenho do Turno</span>
                <span className="text-xs font-black">{performanceRating}</span>
              </div>
            </div>
            <span className="text-[10px] font-mono opacity-80">
              Média Ref: R$ {historicalAveragePerHour.toFixed(2).replace('.', ',')}/h
            </span>
          </div>
        </div>
      </Card>


      {/* ==================== MODAL: LANÇAR CORRIDA ==================== */}
      <AnimatePresence>
        {isRideModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-slate-950 rounded-t-3xl border-t border-slate-800 p-6 space-y-6 pb-safe-bottom"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <div>
                  <h3 className="text-base font-black text-white">Lançar Nova Corrida</h3>
                  <p className="text-xs text-slate-400">Insira valores e métodos de recebimento</p>
                </div>
                <button 
                  onClick={() => setIsRideModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Ride Mode Segmented Controls */}
              <RideLoggerForm 
                onConfirm={(rideData) => {
                  onAddRide(rideData);
                  setIsRideModalOpen(false);
                  triggerToast(`Corrida registrada com sucesso! (+ R$ ${rideData.earnings.toFixed(2)})`);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ==================== MODAL: LANÇAR GASTO ==================== */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-slate-950 rounded-t-3xl border-t border-slate-800 p-6 space-y-6 pb-safe-bottom"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <div>
                  <h3 className="text-base font-black text-white">Lançar Gasto Rápido</h3>
                  <p className="text-xs text-slate-400">Informe o valor e descrição do gasto</p>
                </div>
                <button 
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Expense Logger */}
              <ExpenseLoggerForm 
                onConfirm={(amount, category, desc) => {
                  onAddExpense(amount, category, desc);
                  setIsExpenseModalOpen(false);
                  triggerToast(`Gasto de R$ ${amount.toFixed(2)} lançado com sucesso em ${category}.`);
                }}
                expenseLimits={expenseLimits}
                expenses={expenses}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};


// ==================== SUB-COMPONENT: RIDE LOGGER FORM ====================
interface RideLoggerFormProps {
  onConfirm: (rideData: {
    earnings: number;
    paymentMethod: 'PIX' | 'Dinheiro' | 'Cartão' | 'Outro';
    tripsCount: number;
    notes?: string;
    timestamp: string;
  }) => void;
}

const RideLoggerForm: React.FC<RideLoggerFormProps> = ({ onConfirm }) => {
  const [formMode, setFormMode] = useState<'individual' | 'lote'>('individual');
  
  // Fields state
  const [value, setValue] = useState('');
  const [tripsCount, setTripsCount] = useState(5); // Default batch count is 5
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Dinheiro' | 'Cartão' | 'Outro'>('PIX');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const earnings = parseFloat(value.replace(',', '.'));
    
    if (isNaN(earnings) || earnings <= 0) {
      setErrorMsg('Por favor, insira um valor válido maior que zero.');
      return;
    }

    onConfirm({
      earnings: Number(earnings.toFixed(2)),
      paymentMethod,
      tripsCount: formMode === 'individual' ? 1 : tripsCount,
      notes: notes.trim() || undefined,
      timestamp: new Date().toISOString()
    });
  };

  const paymentOptions: { id: typeof paymentMethod; label: string }[] = [
    { id: 'PIX', label: 'PIX' },
    { id: 'Dinheiro', label: 'Dinheiro' },
    { id: 'Cartão', label: 'Cartão' },
    { id: 'Outro', label: 'Outro' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* Tab Selectors */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => {
            setFormMode('individual');
            setErrorMsg('');
          }}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
            formMode === 'individual' 
              ? 'bg-red-500 text-slate-950 shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Individual
        </button>
        <button
          type="button"
          onClick={() => {
            setFormMode('lote');
            setErrorMsg('');
          }}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
            formMode === 'lote' 
              ? 'bg-red-500 text-slate-950 shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Em Lote
        </button>
      </div>

      {errorMsg && (
        <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
          {errorMsg}
        </p>
      )}

      {/* Value Inputs */}
      <div className="space-y-4">
        
        {/* If Batch Mode: Quick Rides count slider/buttons */}
        {formMode === 'lote' && (
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 font-mono">
              QUANTIDADE DE CORRIDAS NO LOTE
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTripsCount(prev => Math.max(2, prev - 1))}
                className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 font-bold active:scale-95 transition-transform"
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-center font-mono">
                <span className="text-xl font-black text-white">{tripsCount}</span>
                <span className="text-xs text-slate-500 block">corridas</span>
              </div>

              <button
                type="button"
                onClick={() => setTripsCount(prev => Math.min(50, prev + 1))}
                className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 font-bold active:scale-95 transition-transform"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Ex: Lançar 10 corridas acumuladas em uma jornada.</span>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
            {formMode === 'individual' ? 'VALOR GANHO NA CORRIDA' : 'VALOR TOTAL GANHO NO LOTE'}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-sans font-bold text-slate-500">R$</span>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setErrorMsg('');
              }}
              placeholder="0,00"
              className="w-full bg-slate-950 border-2 border-slate-800 focus:border-red-500/50 rounded-2xl pl-11 pr-4 py-3.5 text-base text-slate-100 font-mono focus:outline-none transition-colors"
              required
              autoFocus
            />
          </div>
        </div>

        {/* Payment Methods selector (Grid of Big Buttons) */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 font-mono">
            FORMA DE RECEBIMENTO (TOQUE RÁPIDO)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {paymentOptions.map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => setPaymentMethod(opt.id)}
                className={`py-3.5 px-1 rounded-xl border text-xs font-black uppercase tracking-wider transition-all text-center ${
                  paymentMethod === opt.id
                    ? 'bg-red-500/10 border-red-500 text-red-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
            OBSERVAÇÃO (OPCIONAL)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: UberX passageiro tranquilo"
            className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none transition-colors"
          />
        </div>

      </div>

      {/* Confirm Button */}
      <Button variant="primary" size="lg" fullWidth type="submit" className="py-4 font-black tracking-wide">
        <Check className="w-5 h-5" />
        Confirmar Lançamento
      </Button>

    </form>
  );
};


// ==================== SUB-COMPONENT: EXPENSE LOGGER FORM ====================
interface ExpenseLoggerFormProps {
  onConfirm: (amount: number, category: 'Abastecimento' | 'Alimentação' | 'Manutenção' | 'Outros', description: string) => void;
  expenseLimits: ExpenseLimit[];
  expenses: QuickExpense[];
}

const ExpenseLoggerForm: React.FC<ExpenseLoggerFormProps> = ({ onConfirm, expenseLimits, expenses }) => {
  const [value, setValue] = useState('');
  const [category, setCategory] = useState<'Abastecimento' | 'Alimentação' | 'Manutenção' | 'Outros'>('Abastecimento');
  const [desc, setDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Define category-specific presets for optimal user experience
  const presetsByCategory: Record<typeof category, string[]> = {
    Abastecimento: ['Gasolina', 'Etanol', 'Diesel', 'GNV'],
    Alimentação: ['Almoço', 'Jantar', 'Lanche', 'Café', 'Água'],
    Manutenção: ['Troca de Óleo', 'Calibragem / Pneu', 'Lava-Jato', 'Pastilha de Freio', 'Oficina'],
    Outros: ['Pedágio', 'Internet / Celular', 'Acessório', 'Estacionamento']
  };

  const currentPresets = presetsByCategory[category];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(value.replace(',', '.'));

    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Insira um valor de gasto válido maior que zero.');
      return;
    }

    onConfirm(amount, category, desc.trim() || `Gasto em ${category}`);
  };

  // Real-time computations
  const enteredAmount = parseFloat(value.replace(',', '.')) || 0;
  const activeLimit = expenseLimits.find(l => l.category === category);
  const categoryAccumulated = expenses
    .filter(e => e.category === category)
    .reduce((sum, e) => sum + e.amount, 0);
  const totalWithNew = categoryAccumulated + enteredAmount;
  
  const limitValue = activeLimit?.amount || 0;
  const isLimitEnabled = activeLimit?.enabled || false;
  const remaining = limitValue - totalWithNew;

  // Status check styling
  let statusText = '';
  let badgeText = '';
  let badgeColor = '';
  let showSimulation = isLimitEnabled;

  if (isLimitEnabled) {
    if (totalWithNew > limitValue) {
      statusText = `Atenção: Limite ultrapassado em R$ ${Math.abs(remaining).toFixed(2).replace('.', ',')}!`;
      badgeText = 'Limite Ultrapassado';
      badgeColor = 'bg-rose-500/20 border-rose-500 text-rose-300';
    } else if (totalWithNew === limitValue) {
      statusText = 'Gasto atinge exatamente o limite configurado.';
      badgeText = 'Limite Atingido';
      badgeColor = 'bg-amber-500/25 border-amber-500 text-amber-300';
    } else if (totalWithNew >= limitValue * 0.8) {
      statusText = `Atenção: Próximo ao limite. Restará R$ ${remaining.toFixed(2).replace('.', ',')}`;
      badgeText = 'Atenção';
      badgeColor = 'bg-amber-500/10 border-amber-500/30 text-amber-300';
    } else {
      statusText = `Normal. Margem restante de R$ ${remaining.toFixed(2).replace('.', ',')}`;
      badgeText = 'Normal';
      badgeColor = 'bg-red-500/15 border-red-500/30 text-red-400';
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      
      {errorMsg && (
        <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
          {errorMsg}
        </p>
      )}

      {/* Category Picker Selector */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 font-mono">
          CATEGORIA DA DESPESA
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['Abastecimento', 'Alimentação', 'Manutenção', 'Outros'] as const).map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => {
                setCategory(cat);
                setDesc(''); // Clear preset if category changes
              }}
              className={`py-3 px-2 rounded-xl border text-xs font-black transition-all ${
                category === cat
                  ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                  : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Live Limit Simulation Panel */}
      {showSimulation && (
        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">SIMULAÇÃO DE CONSUMO</span>
            <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border font-bold ${badgeColor}`}>
              {badgeText}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
            <div>Gasto da Categoria:</div>
            <div className="text-right text-slate-200">R$ {categoryAccumulated.toFixed(2).replace('.', ',')}</div>
            
            {enteredAmount > 0 && (
              <>
                <div className="text-rose-400">Este Lançamento (+):</div>
                <div className="text-right text-rose-400">R$ {enteredAmount.toFixed(2).replace('.', ',')}</div>
              </>
            )}

            <div className="border-t border-slate-800 pt-1 font-bold">Total Acumulado:</div>
            <div className="border-t border-slate-800 pt-1 text-right font-bold text-white">R$ {totalWithNew.toFixed(2).replace('.', ',')}</div>

            <div>Limite Configurado:</div>
            <div className="text-right text-slate-300">R$ {limitValue.toFixed(2).replace('.', ',')}</div>

            <div className="border-t border-slate-800/50 pt-1">Valor Restante:</div>
            <div className={`border-t border-slate-800/50 pt-1 text-right font-black ${remaining >= 0 ? 'text-red-400' : 'text-rose-400'}`}>
              R$ {remaining.toFixed(2).replace('.', ',')}
            </div>
          </div>

          <p className="text-[10px] text-slate-500 leading-normal italic mt-1 text-center font-mono">
            {statusText}
          </p>
        </div>
      )}

      {/* Amount Input */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
          VALOR DO GASTO (R$)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-sans font-bold text-slate-500">R$</span>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setErrorMsg('');
            }}
            placeholder="0,00"
            className="w-full bg-slate-950 border-2 border-slate-800 focus:border-rose-500/50 rounded-2xl pl-11 pr-4 py-3 text-base text-slate-100 font-mono focus:outline-none transition-colors"
            required
            autoFocus
          />
        </div>
      </div>

      {/* Description input */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
          OBSERVAÇÃO OU DESCRIÇÃO DO GASTO
        </label>
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Ex: Combustível Posto Ipiranga"
          className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none transition-colors"
          required
        />
      </div>

      {/* Presets Quick Tapping */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 font-mono">
          ATALHOS RÁPIDOS DA CATEGORIA ({category})
        </label>
        <div className="flex flex-wrap gap-1.5">
          {currentPresets.map((preset) => (
            <button
              type="button"
              key={preset}
              onClick={() => setDesc(preset)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                desc === preset
                  ? 'bg-rose-500/15 border-rose-500 text-rose-400 font-black'
                  : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-300'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Confirm Button */}
      <Button variant="danger" size="lg" fullWidth type="submit" className="py-3.5 font-black tracking-wide mt-2">
        <Check className="w-5 h-5" />
        Confirmar Gasto
      </Button>

    </form>
  );
};
