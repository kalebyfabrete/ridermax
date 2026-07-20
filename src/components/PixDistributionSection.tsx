/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Percent, Coins, Plus, Trash2, Check, X, AlertCircle, 
  HelpCircle, History, Settings2, Sparkles, ArrowLeft, PiggyBank
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { CurrencyDisplay } from './CurrencyDisplay';
import { PixCategory, PixDistribution } from '../types';

interface PixDistributionSectionProps {
  categories: PixCategory[];
  onUpdateCategories: (categories: PixCategory[]) => void;
  distributions: PixDistribution[];
  onBack?: () => void;
}

export const PixDistributionSection: React.FC<PixDistributionSectionProps> = ({
  categories,
  onUpdateCategories,
  distributions,
  onBack,
}) => {
  // Tabs inside Pix Section: 'saldos' | 'config' | 'historico'
  const [activeTab, setActiveTab] = useState<'saldos' | 'config' | 'historico'>('saldos');

  // Form states for Category configuration
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatPercentage, setNewCatPercentage] = useState('');
  const [validationError, setValidationError] = useState('');

  // Local state copy of categories for real-time percentage editing
  const [editingPercentages, setEditingPercentages] = useState<Record<string, string>>({});
  const [isEditingPercentages, setIsEditingPercentages] = useState(false);

  // Math: Sum of percentages
  const totalPercentage = useMemo(() => {
    return categories.reduce((sum, c) => sum + c.percentage, 0);
  }, [categories]);

  // Aggregate accumulated balances per category from all distributions
  const categoryBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    
    // Initialize with current categories
    categories.forEach(c => {
      balances[c.name] = 0;
    });

    // Accumulate from history
    distributions.forEach(dist => {
      dist.distributions.forEach(item => {
        if (balances[item.categoryName] === undefined) {
          balances[item.categoryName] = 0;
        }
        balances[item.categoryName] += item.amount;
      });
    });

    return balances;
  }, [categories, distributions]);

  // Total distributed amount
  const totalDistributed = useMemo(() => {
    return distributions.reduce((sum, dist) => sum + dist.rideAmount, 0);
  }, [distributions]);

  // Handler: Add category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!newCatName.trim()) {
      setValidationError('O nome da categoria é obrigatório.');
      return;
    }

    const pct = parseInt(newCatPercentage, 10);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setValidationError('Por favor, insira um percentual entre 0% e 100%.');
      return;
    }

    if (totalPercentage + pct > 100) {
      setValidationError(`Limite excedido. O total ultrapassa 100% (Atual: ${totalPercentage}%, Adicionando: ${pct}%).`);
      return;
    }

    const newCat: PixCategory = {
      id: `pix_cat_${Date.now()}`,
      name: newCatName.trim(),
      percentage: pct,
    };

    onUpdateCategories([...categories, newCat]);
    setNewCatName('');
    setNewCatPercentage('');
    setIsAddingCategory(false);
  };

  // Handler: Delete category
  const handleDeleteCategory = (id: string) => {
    const filtered = categories.filter(c => c.id !== id);
    onUpdateCategories(filtered);
  };

  // Start percentage editing
  const handleStartEditPercentages = () => {
    const initial: Record<string, string> = {};
    categories.forEach(c => {
      initial[c.id] = c.percentage.toString();
    });
    setEditingPercentages(initial);
    setIsEditingPercentages(true);
    setValidationError('');
  };

  // Save modified percentages
  const handleSavePercentages = () => {
    setValidationError('');
    let sum = 0;
    const updated = categories.map(c => {
      const val = parseInt(editingPercentages[c.id] || '0', 10);
      if (isNaN(val) || val < 0 || val > 100) {
        throw new Error(`Percentual inválido para a categoria "${c.name}".`);
      }
      sum += val;
      return { ...c, percentage: val };
    });

    if (sum !== 100) {
      setValidationError(`O total das porcentagens deve somar exatamente 100%. (Soma atual: ${sum}%).`);
      return;
    }

    onUpdateCategories(updated);
    setIsEditingPercentages(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header back */}
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
          <span className="text-xs uppercase tracking-widest text-red-500 font-bold font-mono block">DISTRIBUIÇÃO DE ENTRADAS</span>
          <h2 className="text-xl font-black text-white">Inteligente PIX</h2>
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="grid grid-cols-3 bg-slate-900 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('saldos')}
          className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'saldos' 
              ? 'bg-red-500 text-slate-950 font-black shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Saldos
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'config' 
              ? 'bg-red-500 text-slate-950 font-black shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Regras
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'historico' 
              ? 'bg-red-500 text-slate-950 font-black shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Histórico
        </button>
      </div>

      {/* ==================== TAB: SALDOS ACUMULADOS ==================== */}
      {activeTab === 'saldos' && (
        <div className="space-y-6">
          {/* Main PIX distributed card indicator */}
          <Card variant="default" className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/10 border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <PiggyBank className="w-20 h-20 text-red-400" />
            </div>

            <span className="text-[10px] font-black tracking-widest text-red-400 uppercase font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
              TOTAL PROCESSADO EM PIX
            </span>

            <div className="mt-3 flex justify-between items-baseline">
              <CurrencyDisplay value={totalDistributed} size="3xl" trend="positive" />
              <div className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400">
                {distributions.length} lançamentos
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-3.5 leading-relaxed">
              *Apenas valores recebidos via **PIX** entram nessa distribuição automática. Dinheiro em mãos e cartões são preservados fora dessas regras.
            </p>
          </Card>

          {/* List of Category balances */}
          <div className="space-y-3.5">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono block">SALDO ACUMULADO POR CATEGORIA</span>
            
            {categories.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-850 rounded-2xl text-slate-500 text-xs">
                Nenhuma categoria de distribuição configurada.
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map(cat => {
                  const balance = categoryBalances[cat.name] || 0;
                  return (
                    <Card key={cat.id} variant="outline" className="p-4 bg-slate-900/10 border-slate-800/80 flex items-center justify-between">
                      <div className="space-y-1 pr-3 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-100">{cat.name}</h4>
                          <span className="text-[9px] font-mono font-bold bg-slate-900 border border-slate-800 text-red-400 px-1.5 py-0.5 rounded-md">
                            {cat.percentage}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">Destinação automática de novos PIX recebidos.</p>
                      </div>
                      <div className="text-right shrink-0">
                        <CurrencyDisplay value={balance} size="md" trend="positive" />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB: REGRAS E CONFIGURAÇÕES ==================== */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <Card variant="glass" className="p-4 border-slate-800/80">
            <div className="flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed">
              <HelpCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-200 mb-1">Como funciona a distribuição?</p>
                <p>
                  Defina suas categorias de poupança/custo e seus percentuais. Ao registrar qualquer corrida no app com o método de recebimento **PIX**, o valor será automaticamente fatiado conforme estas regras. Lançamentos antigos **não são alterados** caso você mude os percentuais!
                </p>
              </div>
            </div>
          </Card>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
              {validationError}
            </div>
          )}

          {/* Categories configuration list */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">REGRAS ATIVAS ({categories.length})</span>
              
              {!isEditingPercentages && (
                <button
                  onClick={handleStartEditPercentages}
                  className="text-[10px] font-bold text-red-400 border border-red-500/20 bg-red-500/5 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                >
                  Alterar Percentuais
                </button>
              )}
            </div>

            {isEditingPercentages ? (
              <div className="space-y-3 bg-slate-900/20 border border-slate-850 p-4 rounded-2xl">
                <span className="text-[10px] font-black text-slate-400 uppercase font-mono block">EDITANDO PORCENTAGENS</span>
                
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-300 font-bold truncate flex-1">{cat.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 w-20">
                      <input 
                        type="number"
                        value={editingPercentages[cat.id] || ''}
                        onChange={(e) => setEditingPercentages({
                          ...editingPercentages,
                          [cat.id]: e.target.value
                        })}
                        className="w-full bg-transparent text-center font-mono font-bold text-xs text-red-400 focus:outline-none"
                        max="100"
                        min="0"
                      />
                      <span className="text-[10px] text-slate-500 font-bold">%</span>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2.5 pt-2">
                  <Button variant="primary" size="sm" fullWidth onClick={handleSavePercentages} className="py-2.5">
                    <Check className="w-4 h-4" /> Salvar Regra
                  </Button>
                  <Button variant="secondary" size="sm" fullWidth onClick={() => setIsEditingPercentages(false)} className="py-2.5 bg-slate-950 border-slate-800 text-slate-400">
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="p-3 bg-slate-900/10 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-[10px] shrink-0">
                        {cat.percentage}%
                      </div>
                      <span className="text-slate-200 font-bold">{cat.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-500 hover:text-rose-400 transition-colors"
                      title="Deletar categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Sum Indicator */}
            <div className={`p-3 rounded-xl flex items-center justify-between text-xs border ${
              totalPercentage === 100 
                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <span className="font-bold">Soma Total dos Percentuais:</span>
              <span className="font-mono font-black">{totalPercentage}% / 100%</span>
            </div>
          </div>

          {/* Add Category Section */}
          {!isAddingCategory ? (
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => {
                setIsAddingCategory(true);
                setValidationError('');
              }}
              className="py-3 border border-slate-800 bg-slate-900/15"
            >
              <Plus className="w-4 h-4" /> Nova Categoria de Distribuição
            </Button>
          ) : (
            <form onSubmit={handleAddCategory} className="bg-slate-900/30 border border-slate-850 p-4 rounded-2xl space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase font-mono block">Nova Categoria</span>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase font-mono mb-1">NOME DA CATEGORIA</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ex: Investimento a longo prazo"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase font-mono mb-1">PERCENTUAL DA CATEGORIA</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newCatPercentage}
                      onChange={(e) => setNewCatPercentage(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none transition-colors"
                      max="100"
                      min="0"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">%</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="primary" size="sm" fullWidth type="submit" className="py-2.5">
                  Confirmar
                </Button>
                <Button variant="secondary" size="sm" fullWidth onClick={() => setIsAddingCategory(false)} className="py-2.5 bg-slate-950 border-slate-800 text-slate-400">
                  Cancelar
                </Button>
              </div>
            </form>
          )}

        </div>
      )}

      {/* ==================== TAB: HISTÓRICO DE DISTRIBUIÇÕES ==================== */}
      {activeTab === 'historico' && (
        <div className="space-y-4">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono block">HISTÓRICO DE DIVISÕES ({distributions.length})</span>
          
          {distributions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-850 rounded-2xl text-slate-500 text-xs">
              Nenhuma distribuição PIX realizada até o momento.
            </div>
          ) : (
            <div className="space-y-3.5">
              {distributions.map(dist => (
                <Card key={dist.id} variant="outline" className="p-4 bg-slate-900/10 border-slate-800/80 space-y-3">
                  {/* Dist main header */}
                  <div className="flex justify-between items-start text-xs border-b border-slate-900 pb-2">
                    <div>
                      <span className="font-bold text-slate-100 block">PIX Recebido</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(dist.timestamp).toLocaleDateString('pt-BR')} {new Date(dist.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-right">
                      <CurrencyDisplay value={dist.rideAmount} size="md" trend="positive" />
                    </div>
                  </div>

                  {/* Splits breakdown lists */}
                  <div className="space-y-1.5 text-[11px]">
                    {dist.distributions.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center font-mono">
                        <span className="text-slate-400">{item.categoryName} ({item.percentage}%):</span>
                        <span className="text-red-400 font-bold">R$ {item.amount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
