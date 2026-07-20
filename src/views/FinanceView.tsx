/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Coins, Plus, Edit2, Trash2, 
  Check, X, AlertTriangle, AlertCircle, Settings2, Sliders, Calendar,
  Clock, ShieldAlert, Receipt, Info, CheckCircle2, RefreshCw
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
import { RideEntity, QuickExpense, ExpenseLimit, PixCategory, PixDistribution } from '../types';
import { PixDistributionSection } from '../components/PixDistributionSection';
import { ReportsSection } from '../components/ReportsSection';
import { motion, AnimatePresence } from 'motion/react';

interface FinanceViewProps {
  rides: RideEntity[];
  expenses: QuickExpense[];
  initialCash: number;
  expenseLimits: ExpenseLimit[];
  onAddExpense: (amount: number, category: 'Abastecimento' | 'Alimentação' | 'Manutenção' | 'Outros', description: string) => void;
  onEditExpense: (id: string, updatedFields: Partial<QuickExpense>) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateInitialCash: (amount: number) => void;
  onUpdateExpenseLimits: (limits: ExpenseLimit[]) => void;
  pixCategories: PixCategory[];
  onUpdatePixCategories: (categories: PixCategory[]) => void;
  pixDistributions: PixDistribution[];
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  rides,
  expenses,
  initialCash,
  expenseLimits,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onUpdateInitialCash,
  onUpdateExpenseLimits,
  pixCategories,
  onUpdatePixCategories,
  pixDistributions,
}) => {
  // Navigation tabs inside Finance
  const [financeTab, setFinanceTab] = useState<'caixa' | 'gastos' | 'pix' | 'relatorios'>('caixa');

  // Local state for editing initial cash inline
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [cashInputValue, setCashInputValue] = useState(initialCash.toString());

  // Local state for adding/editing expense
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'Abastecimento' | 'Alimentação' | 'Manutenção' | 'Outros'>('Abastecimento');
  const [expenseDesc, setExpenseDesc] = useState('');

  // Local state for editing individual limits
  const [editingLimitCategory, setEditingLimitCategory] = useState<string | null>(null);
  const [limitInputValue, setLimitInputValue] = useState('');

  // Math totals
  const totalGross = rides.reduce((sum, r) => sum + r.earnings, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalNet = totalGross - totalExpenses;

  // Physical Cash box computations
  const cashEarnings = rides
    .filter(r => r.paymentMethod === 'Dinheiro')
    .reduce((sum, r) => sum + r.earnings, 0);
  const expectedCash = initialCash + cashEarnings - totalExpenses;

  // Category limits status calculation
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
    
    return {
      ...limit,
      consumed,
      percentage,
      state
    };
  });

  // Limit state colors and text mapper
  const limitStateConfig = {
    normal: {
      colorClass: 'text-red-400 bg-red-500/10 border-red-500/20',
      barColor: 'bg-red-400',
      text: 'Normal'
    },
    atencao: {
      colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      barColor: 'bg-amber-400',
      text: 'Atenção'
    },
    atingido: {
      colorClass: 'text-orange-400 bg-orange-500/15 border-orange-500/20',
      barColor: 'bg-orange-400',
      text: 'Atingido'
    },
    ultrapassado: {
      colorClass: 'text-rose-400 bg-rose-500/15 border-rose-500/20',
      barColor: 'bg-rose-500',
      text: 'Ultrapassado'
    }
  };

  // Preset despesas descriptions
  const presetsByCategory = {
    Abastecimento: ['Gasolina', 'Etanol', 'Diesel', 'GNV'],
    Alimentação: ['Almoço', 'Jantar', 'Lanche', 'Café', 'Água'],
    Manutenção: ['Troca de Óleo', 'Calibragem / Pneu', 'Lava-Jato', 'Mecânico'],
    Outros: ['Pedágio', 'Internet / Celular', 'Acessório', 'Estacionamento']
  };

  // Handlers for initial cash
  const handleSaveCash = () => {
    const val = parseFloat(cashInputValue.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      onUpdateInitialCash(Number(val.toFixed(2)));
      setIsEditingCash(false);
    } else {
      alert('Digite um número válido para o caixa inicial.');
    }
  };

  // Toggle active limits
  const handleToggleLimit = (category: string) => {
    const updated = expenseLimits.map(l => {
      if (l.category === category) {
        return { ...l, enabled: !l.enabled };
      }
      return l;
    });
    onUpdateExpenseLimits(updated);
  };

  // Save specific limit amount
  const handleSaveLimit = (category: string) => {
    const val = parseFloat(limitInputValue.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      const updated = expenseLimits.map(l => {
        if (l.category === category) {
          return { ...l, amount: Number(val.toFixed(2)) };
        }
        return l;
      });
      onUpdateExpenseLimits(updated);
      setEditingLimitCategory(null);
    } else {
      alert('Insira um limite válido.');
    }
  };

  // Open form for adding new expense
  const openAddExpenseForm = () => {
    setEditingExpenseId(null);
    setExpenseAmount('');
    setExpenseCategory('Abastecimento');
    setExpenseDesc('');
    setIsExpenseFormOpen(true);
  };

  // Open form for editing expense
  const openEditExpenseForm = (exp: QuickExpense) => {
    setEditingExpenseId(exp.id);
    setExpenseAmount(exp.amount.toString());
    setExpenseCategory(exp.category);
    setExpenseDesc(exp.description);
    setIsExpenseFormOpen(true);
  };

  // Confirm/save expense form
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor, informe um valor de gasto válido.');
      return;
    }

    const finalDesc = expenseDesc.trim() || `Gasto em ${expenseCategory}`;

    if (editingExpenseId) {
      // Edit mode
      onEditExpense(editingExpenseId, {
        amount: Number(amount.toFixed(2)),
        category: expenseCategory,
        description: finalDesc,
      });
    } else {
      // Add mode
      onAddExpense(amount, expenseCategory, finalDesc);
    }

    setIsExpenseFormOpen(false);
  };

  // Delete expense handler
  const handleDeleteExpenseClick = (id: string) => {
    if (window.confirm('Excluir este gasto definitivamente?')) {
      onDeleteExpense(id);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase tracking-widest text-red-500 font-bold font-mono">
          FASE 03 — ATIVO
        </span>
        <h1 className="text-2xl font-black tracking-tight text-white mt-0.5">
          Controle de Caixa e Limites
        </h1>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Gerencie o dinheiro físico do dia, despesas operacionais e monitore limites por categoria para evitar desperdícios.
        </p>
      </div>

      {/* Internal Tabs (Caixa, Gastos, PIX, Relatórios) */}
      <div className="grid grid-cols-4 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setFinanceTab('caixa')}
          className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all text-center ${
            financeTab === 'caixa'
              ? 'bg-red-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Caixa
        </button>
        <button
          onClick={() => setFinanceTab('gastos')}
          className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all text-center ${
            financeTab === 'gastos'
              ? 'bg-red-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Gastos
        </button>
        <button
          onClick={() => setFinanceTab('pix')}
          className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all text-center ${
            financeTab === 'pix'
              ? 'bg-red-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          PIX
        </button>
        <button
          onClick={() => setFinanceTab('relatorios')}
          className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all text-center ${
            financeTab === 'relatorios'
              ? 'bg-red-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Relatórios
        </button>
      </div>

      {/* RENDER TAB: CAIXA & LIMITES */}
      {financeTab === 'caixa' && (
        <div className="space-y-5">
          
          {/* Caixa Físico (Dinheiro Vivo em Mãos) Breakdown Panel */}
          <Card variant="highlight" className="p-5 border-l-4 border-l-amber-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Coins className="w-24 h-24 text-amber-400" />
            </div>

            <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              CAIXA FISICO ESPERADO
            </span>

            <div className="mt-2 flex justify-between items-baseline flex-wrap gap-2">
              <CurrencyDisplay value={expectedCash} size="3xl" trend="none" />
              <div className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 uppercase">
                Em Dinheiro
              </div>
            </div>

            {/* Inline Cash Start Configurator */}
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              {isEditingCash ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-sans font-bold text-slate-500">R$</span>
                    <input
                      type="text"
                      value={cashInputValue}
                      onChange={(e) => setCashInputValue(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleSaveCash}
                    className="p-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingCash(false);
                      setCashInputValue(initialCash.toString());
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 active:scale-95 border border-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Caixa Inicial do Dia:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-200 font-bold">R$ {initialCash.toFixed(2).replace('.', ',')}</span>
                    <button
                      onClick={() => setIsEditingCash(true)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline font-mono flex items-center gap-0.5"
                    >
                      <Edit2 className="w-2.5 h-2.5" /> Alterar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Caixa Formula Breakdown */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
              <div className="p-2 bg-slate-950/40 rounded-xl border border-slate-900/50">
                <span className="text-slate-500 block text-[8px] uppercase">Inicial</span>
                <span className="text-slate-300 font-bold block mt-0.5">R$ {initialCash.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="p-2 bg-slate-950/40 rounded-xl border border-slate-900/50">
                <span className="text-slate-500 block text-[8px] uppercase">Dinheiro (+)</span>
                <span className="text-red-400 font-bold block mt-0.5">R$ {cashEarnings.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="p-2 bg-slate-950/40 rounded-xl border border-slate-900/50">
                <span className="text-slate-500 block text-[8px] uppercase">Saídas (-)</span>
                <span className="text-rose-400 font-bold block mt-0.5">R$ {totalExpenses.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <div className="flex gap-1.5 items-start bg-slate-950/30 border border-slate-800/60 rounded-xl p-2.5 mt-3 text-[10px] text-slate-400 leading-normal">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>
                <strong>Nota:</strong> O caixa físico só contabiliza faturamentos recebidos em <strong>Dinheiro</strong> e subtrai todas as saídas (gastos). Cartão, PIX e outras formas não são adicionadas ao caixa físico.
              </span>
            </div>
          </Card>

          {/* Section: Limites de Gastos por Categoria */}
          <div className="space-y-3.5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">LIMITES DIÁRIOS POR CATEGORIA</h3>
                <p className="text-[10px] text-slate-500">Configure orçamentos e acompanhe o progresso</p>
              </div>
              <Sliders className="w-4 h-4 text-slate-500" />
            </div>

            <div className="space-y-3">
              {limitStatuses.map(status => {
                const config = limitStateConfig[status.state];
                const isEditingThisLimit = editingLimitCategory === status.category;

                return (
                  <Card key={status.category} variant="outline" className={`p-4 transition-all ${status.enabled ? 'bg-slate-900/10 border-slate-800' : 'bg-slate-950/10 border-slate-900/40 opacity-55'}`}>
                    
                    {/* Header: Name, Active Toggle & State Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`toggle-${status.category}`}
                          checked={status.enabled}
                          onChange={() => handleToggleLimit(status.category)}
                          className="w-4 h-4 rounded border-slate-800 text-red-500 bg-slate-950 focus:ring-red-500 focus:ring-offset-0 focus:outline-none"
                        />
                        <label htmlFor={`toggle-${status.category}`} className="text-xs font-bold text-slate-200 cursor-pointer select-none">
                          {status.category}
                        </label>
                      </div>

                      {status.enabled && (
                        <span className={`text-[8px] uppercase tracking-wide font-mono px-2 py-0.5 rounded-full border font-bold ${config.colorClass}`}>
                          {config.text}
                        </span>
                      )}
                    </div>

                    {/* Limit Values & Controls */}
                    <div className="mt-3 flex justify-between items-end">
                      
                      {/* Consumption info */}
                      <div className="text-[11px] text-slate-400">
                        <span>Gasto: <span className="font-mono text-slate-100 font-bold">R$ {status.consumed.toFixed(2).replace('.', ',')}</span></span>
                        <span className="text-slate-500 block text-[9px] font-mono mt-0.5">
                          {status.enabled 
                            ? `Meta: R$ ${status.amount.toFixed(2).replace('.', ',')} diário`
                            : 'Sem limite ativo'}
                        </span>
                      </div>

                      {/* Config limit value inline */}
                      {status.enabled && (
                        <div>
                          {isEditingThisLimit ? (
                            <div className="flex items-center gap-1.5">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">R$</span>
                                <input
                                  type="text"
                                  value={limitInputValue}
                                  onChange={(e) => setLimitInputValue(e.target.value)}
                                  placeholder="0,00"
                                  className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 pl-6 py-0.5 text-xs text-slate-200 font-mono text-right focus:outline-none focus:border-red-500"
                                  autoFocus
                                />
                              </div>
                              <button
                                onClick={() => handleSaveLimit(status.category)}
                                className="p-1 rounded bg-red-500 text-slate-950 hover:bg-red-400"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingLimitCategory(null)}
                                className="p-1 rounded bg-slate-800 text-slate-400 border border-slate-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingLimitCategory(status.category);
                                setLimitInputValue(status.amount.toString());
                              }}
                              className="text-[10px] font-mono text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 bg-slate-950/50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                            >
                              <Settings2 className="w-3 h-3 text-slate-500" />
                              R$ {status.amount.toFixed(0)}/dia
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Progress Bar (Gasto vs Limite) */}
                    {status.enabled && (
                      <div className="mt-3.5 space-y-1.5">
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${config.barColor}`}
                            style={{ width: `${Math.min(100, status.percentage)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                          <span>{status.percentage.toFixed(0)}% Consumido</span>
                          <span className={status.consumed > status.amount ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                            {status.consumed > status.amount
                              ? `Ultrapassou: R$ ${(status.consumed - status.amount).toFixed(2).replace('.', ',')}`
                              : `Resta: R$ ${(status.amount - status.consumed).toFixed(2).replace('.', ',')}`}
                          </span>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
          
        </div>
      )}

      {/* RENDER TAB: GASTOS (HISTORICO) */}
      {financeTab === 'gastos' && (
        <div className="space-y-4">
          
          {/* Summary Mini Dashboard */}
          <div className="grid grid-cols-2 gap-4">
            <Card variant="outline" className="p-3.5 bg-slate-900/10">
              <span className="text-[9px] font-bold text-slate-500 font-mono block">FATURAMENTO BRUTO</span>
              <span className="text-base font-bold font-mono text-slate-300 mt-1 block">R$ {totalGross.toFixed(2).replace('.', ',')}</span>
            </Card>
            <Card variant="outline" className="p-3.5 bg-rose-500/5 border-rose-500/15">
              <span className="text-[9px] font-bold text-rose-500/70 font-mono block">TOTAL DE DESPESAS</span>
              <span className="text-base font-bold font-mono text-rose-400 mt-1 block">R$ {totalExpenses.toFixed(2).replace('.', ',')}</span>
            </Card>
          </div>

          {/* Main List Controls */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">LISTA DE SAÍDAS / DESPESAS</h3>
              <p className="text-[10px] text-slate-500">Toque para editar ou remover um lançamento</p>
            </div>
            <Button variant="danger" size="sm" onClick={openAddExpenseForm} className="text-xs shrink-0 py-2 px-3">
              <Plus className="w-3.5 h-3.5" /> Lançar Gasto
            </Button>
          </div>

          {/* List display */}
          {expenses.length === 0 ? (
            <Card variant="outline" className="p-8 text-center border-dashed border-slate-800">
              <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2.5" />
              <p className="text-xs font-bold text-slate-400">Nenhum gasto registrado hoje</p>
              <p className="text-[10px] text-slate-500 mt-1">Lançar gastos operacionais ajuda a calcular o seu lucro real líquido de forma automática.</p>
              <button
                onClick={openAddExpenseForm}
                className="text-xs font-mono font-bold text-rose-400 underline mt-3 hover:text-rose-300"
              >
                Registrar primeiro gasto
              </button>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {expenses.map((exp) => {
                const limitConf = expenseLimits.find(l => l.category === exp.category);
                return (
                  <Card key={exp.id} variant="outline" className="p-3.5 border-slate-800 bg-slate-900/5 flex justify-between items-center gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      
                      {/* Header: Category Badge and Notes */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-mono bg-slate-900 border border-slate-800 text-slate-400">
                          {exp.category || 'Geral'}
                        </span>
                        
                        {/* If Limit Exists, show short indicator */}
                        {limitConf?.enabled && (
                          <span className="text-[8px] text-slate-500 font-mono">
                            limite ativo
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-200 truncate pr-2">
                        {exp.description}
                      </h4>

                      {/* Timestamp formatted nicely */}
                      <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono">
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" /> {new Date(exp.timestamp).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {new Date(exp.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                    </div>

                    {/* Amount & Actions panel */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-black font-mono text-rose-400 whitespace-nowrap">
                        - R$ {exp.amount.toFixed(2).replace('.', ',')}
                      </span>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 border-l border-slate-800/80 pl-2 shrink-0">
                        <button
                          onClick={() => openEditExpenseForm(exp)}
                          className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 active:scale-90 transition-transform"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpenseClick(exp.id)}
                          className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-950 active:scale-90 transition-transform"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

        </div>
      )}


      {/* ==================== EXPENSE FORM MODAL (ADD / EDIT) ==================== */}
      <AnimatePresence>
        {isExpenseFormOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-slate-950 rounded-t-3xl border-t border-slate-800 p-6 space-y-5 pb-safe-bottom"
            >
              
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingExpenseId ? 'Editar Gasto Lançado' : 'Registrar Novo Gasto'}
                  </h3>
                  <p className="text-xs text-slate-400">Informe os dados operacionais da despesa</p>
                </div>
                <button
                  onClick={() => setIsExpenseFormOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                
                {/* Category picker buttons */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    CATEGORIA DO GASTO
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Abastecimento', 'Alimentação', 'Manutenção', 'Outros'] as const).map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => {
                          setExpenseCategory(cat);
                          setExpenseDesc(''); // clear preset
                        }}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-black transition-all ${
                          expenseCategory === cat
                            ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                            : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount field */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    VALOR GASTO (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-sans font-bold text-slate-500">R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-slate-950 border-2 border-slate-800 focus:border-rose-500/50 rounded-2xl pl-11 pr-4 py-3 text-base text-slate-100 font-mono focus:outline-none transition-colors"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Description/Notes field */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    DESCRIÇÃO / OBSERVAÇÃO
                  </label>
                  <input
                    type="text"
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    placeholder="Ex: Abastecimento de Etanol no posto BR"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Presets Quick Tapping */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    ATALHOS DA CATEGORIA ({expenseCategory})
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {presetsByCategory[expenseCategory].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setExpenseDesc(preset)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          expenseDesc === preset
                            ? 'bg-rose-500/15 border-rose-500 text-rose-400 font-black'
                            : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions button */}
                <Button variant="danger" size="lg" fullWidth type="submit" className="py-3.5 font-black tracking-wide mt-2">
                  <Check className="w-5 h-5" />
                  {editingExpenseId ? 'Confirmar Alteração' : 'Registrar Gasto'}
                </Button>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENDER TAB: PIX AUTOMATIC DISTRIBUTION */}
      {financeTab === 'pix' && (
        <PixDistributionSection 
          categories={pixCategories}
          onUpdateCategories={onUpdatePixCategories}
          distributions={pixDistributions}
        />
      )}

      {/* RENDER TAB: REPORTS & ANALYTICS */}
      {financeTab === 'relatorios' && (
        <ReportsSection 
          rides={rides}
          expenses={expenses}
        />
      )}

    </div>
  );
};
