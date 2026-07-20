/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Award, Plus, Edit2, Trash2, Check, X, Calendar, 
  DollarSign, TrendingUp, ChevronLeft, ArrowUpRight, CheckCircle2 
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { GoalEntity } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface GoalsSectionProps {
  goals: GoalEntity[];
  onUpdateGoals: (goals: GoalEntity[]) => void;
  onBack: () => void;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  goals,
  onUpdateGoals,
  onBack,
}) => {
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);

  // Form input states
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [depositValue, setDepositValue] = useState('');

  // Helper to determine status
  const getGoalStatus = (goal: GoalEntity): { text: 'Em andamento' | 'Meta atingida' | 'Prazo próximo' | 'Atrasado'; colorClass: string; barColor: string } => {
    if (goal.currentAmount >= goal.targetAmount) {
      return {
        text: 'Meta atingida',
        colorClass: 'bg-red-500/10 border-red-500/20 text-red-400',
        barColor: 'bg-red-500'
      };
    }

    if (goal.deadline) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(goal.deadline + 'T00:00:00');

      if (deadlineDate < today) {
        return {
          text: 'Atrasado',
          colorClass: 'bg-rose-500/15 border-rose-500/20 text-rose-400',
          barColor: 'bg-rose-500'
        };
      }

      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) {
        return {
          text: 'Prazo próximo',
          colorClass: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          barColor: 'bg-amber-500'
        };
      }
    }

    return {
      text: 'Em andamento',
      colorClass: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      barColor: 'bg-blue-400'
    };
  };

  // Open modal to add a new goal
  const handleOpenAdd = () => {
    setEditingGoalId(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setDeadline('');
    setIsFormOpen(true);
  };

  // Open modal to edit a goal
  const handleOpenEdit = (goal: GoalEntity) => {
    setEditingGoalId(goal.id);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setDeadline(goal.deadline || '');
    setIsFormOpen(true);
  };

  // Open modal to add money to a goal
  const handleOpenDeposit = (goal: GoalEntity) => {
    setDepositGoalId(goal.id);
    setDepositValue('');
    setIsDepositOpen(true);
  };

  // Handle Form submit (Add or Edit)
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();

    const target = parseFloat(targetAmount.replace(',', '.'));
    const current = parseFloat(currentAmount.replace(',', '.'));

    if (!name.trim()) {
      alert('Por favor, informe o nome do objetivo.');
      return;
    }
    if (isNaN(target) || target <= 0) {
      alert('Por favor, informe uma meta válida maior que zero.');
      return;
    }
    if (isNaN(current) || current < 0) {
      alert('Por favor, informe um valor acumulado válido.');
      return;
    }

    const updatedGoals = [...goals];

    if (editingGoalId) {
      // Edit mode
      const idx = updatedGoals.findIndex(g => g.id === editingGoalId);
      if (idx !== -1) {
        updatedGoals[idx] = {
          ...updatedGoals[idx],
          name: name.trim(),
          targetAmount: Number(target.toFixed(2)),
          currentAmount: Number(current.toFixed(2)),
          deadline: deadline || undefined,
        };
      }
    } else {
      // Add mode
      const newGoal: GoalEntity = {
        id: 'goal_' + Date.now(),
        name: name.trim(),
        targetAmount: Number(target.toFixed(2)),
        currentAmount: Number(current.toFixed(2)),
        deadline: deadline || undefined,
      };
      updatedGoals.push(newGoal);
    }

    onUpdateGoals(updatedGoals);
    setIsFormOpen(false);
  };

  // Handle Deposit submit
  const handleSaveDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const valueToAdd = parseFloat(depositValue.replace(',', '.'));

    if (isNaN(valueToAdd) || valueToAdd <= 0) {
      alert('Por favor, digite um valor numérico válido.');
      return;
    }

    const updatedGoals = goals.map(g => {
      if (g.id === depositGoalId) {
        return {
          ...g,
          currentAmount: Number((g.currentAmount + valueToAdd).toFixed(2)),
        };
      }
      return g;
    });

    onUpdateGoals(updatedGoals);
    setIsDepositOpen(false);
  };

  // Handle Delete
  const handleDelete = (id: string) => {
    if (window.confirm('Excluir este objetivo definitivamente?')) {
      const filtered = goals.filter(g => g.id !== id);
      onUpdateGoals(filtered);
    }
  };

  return (
    <div className="space-y-5">
      {/* Navigation Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-red-500 font-bold font-mono">
            RECURSO ATIVO
          </span>
          <h2 className="text-base font-black text-white">Objetivos & Metas</h2>
        </div>
      </div>

      {/* Main Stats Card */}
      <Card variant="outline" className="p-4 bg-slate-900/10 border-slate-800 flex justify-between items-center">
        <div>
          <span className="text-[10px] text-slate-500 font-mono block">OBJETIVOS ATIVOS</span>
          <span className="text-xl font-bold font-mono text-slate-200 mt-0.5 block">{goals.length}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-mono block">CONCLUÍDOS</span>
          <span className="text-xl font-bold font-mono text-red-400 mt-0.5 block">
            {goals.filter(g => g.currentAmount >= g.targetAmount).length}
          </span>
        </div>
        <Button variant="danger" size="sm" onClick={handleOpenAdd} className="text-xs py-2 px-3 shrink-0">
          <Plus className="w-3.5 h-3.5" /> Novo Objetivo
        </Button>
      </Card>

      {/* List of Goals */}
      {goals.length === 0 ? (
        <Card variant="outline" className="p-8 text-center border-dashed border-slate-800">
          <Award className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-400">Nenhum objetivo registrado</p>
          <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">
            Defina metas como comprar um celular novo, reservar dinheiro para manutenção, IPVA ou viagem de férias.
          </p>
          <button
            onClick={handleOpenAdd}
            className="text-xs font-mono font-bold text-red-400 underline mt-3 hover:text-red-300"
          >
            Adicionar primeiro objetivo
          </button>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {goals.map((goal) => {
            const status = getGoalStatus(goal);
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

            return (
              <Card 
                key={goal.id} 
                variant="outline" 
                className="p-4 bg-slate-900/10 border-slate-800 space-y-3"
              >
                {/* Header: Title and Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{goal.name}</h3>
                    {goal.deadline && (
                      <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        Limite: {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-md border ${status.colorClass}`}>
                    {status.text}
                  </span>
                </div>

                {/* Amount Progress Detail */}
                <div className="flex justify-between items-baseline font-mono text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Acumulado</span>
                    <span className="text-white font-bold">R$ {goal.currentAmount.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">Meta</span>
                    <span className="text-slate-300 font-bold">R$ {goal.targetAmount.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${status.barColor}`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>{progress.toFixed(0)}% concluído</span>
                    {goal.currentAmount < goal.targetAmount && (
                      <span>Falta R$ {(goal.targetAmount - goal.currentAmount).toFixed(2).replace('.', ',')}</span>
                    )}
                  </div>
                </div>

                {/* Goal Action Buttons */}
                <div className="flex gap-2 pt-1.5 border-t border-slate-900 justify-end">
                  {goal.currentAmount < goal.targetAmount && (
                    <button
                      onClick={() => handleOpenDeposit(goal)}
                      className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-slate-950 font-bold text-xs flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <Plus className="w-3 h-3" /> Aportar Valor
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEdit(goal)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 active:scale-95 transition-all"
                    title="Editar objetivo"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-950 active:scale-95 transition-all"
                    title="Excluir objetivo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ==================== OBJECTIVE FORM MODAL (ADD / EDIT) ==================== */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-slate-950 rounded-t-3xl border-t border-slate-800 p-6 space-y-4 pb-safe-bottom"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingGoalId ? 'Editar Objetivo' : 'Criar Novo Objetivo'}
                  </h3>
                  <p className="text-xs text-slate-400">Insira as metas do seu objetivo financeiro</p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveGoal} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    NOME DO OBJETIVO
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Fundo de emergência ou Manutenção"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                    required
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Comprar celular', 'Fundo da moto', 'Viagem de Férias', 'Reserva de Emergência'].map(ex => (
                      <button
                        type="button"
                        key={ex}
                        onClick={() => setName(ex)}
                        className="text-[9px] font-mono font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2 py-1 rounded-md text-slate-400"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                      VALOR DA META (R$)
                    </label>
                    <input
                      type="text"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                      VALOR JÁ ACUMULADO (R$)
                    </label>
                    <input
                      type="text"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    DATA LIMITE (OPCIONAL)
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                  />
                </div>

                <Button variant="danger" size="lg" fullWidth type="submit" className="py-3 font-black tracking-wide mt-2">
                  <Check className="w-5 h-5" />
                  {editingGoalId ? 'Salvar Alterações' : 'Criar Objetivo'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== DEPOSIT VALUE FORM MODAL ==================== */}
      <AnimatePresence>
        {isDepositOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-slate-950 rounded-t-3xl border-t border-slate-800 p-6 space-y-4 pb-safe-bottom"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <div>
                  <h3 className="text-base font-black text-white">Adicionar Valor</h3>
                  <p className="text-xs text-slate-400">
                    Aportar dinheiro para "{goals.find(g => g.id === depositGoalId)?.name}"
                  </p>
                </div>
                <button
                  onClick={() => setIsDepositOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDeposit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    QUANTO DESEJA APORTAR (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-sans font-bold text-slate-500">R$</span>
                    <input
                      type="text"
                      value={depositValue}
                      onChange={(e) => setDepositValue(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-slate-950 border-2 border-slate-800 focus:border-red-500/50 rounded-2xl pl-11 pr-4 py-3 text-base text-slate-100 font-mono focus:outline-none transition-colors"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-1">
                  {[10, 20, 50, 100].map(val => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setDepositValue(val.toString())}
                      className="px-3 py-1.5 rounded-lg border border-slate-850 bg-slate-900 text-xs font-mono font-bold text-slate-300 hover:text-white transition-colors"
                    >
                      + R$ {val}
                    </button>
                  ))}
                </div>

                <Button variant="danger" size="lg" fullWidth type="submit" className="py-3.5 font-black tracking-wide mt-2">
                  <Check className="w-5 h-5" />
                  Confirmar Aporte
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
