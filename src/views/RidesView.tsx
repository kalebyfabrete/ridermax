/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, Minus, X, Trash2, Edit2, Check, Calendar, Clock, 
  MapPin, Sparkles, Filter, ChevronDown, MessageSquare, 
  CreditCard, Smartphone, Banknote, HelpCircle, Eye, AlertCircle, Coins
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
import { RideEntity, UserSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface RidesViewProps {
  rides: RideEntity[];
  onAddRide: (rideData: Omit<RideEntity, 'id' | 'shiftId' | 'status' | 'app' | 'distance' | 'durationMinutes'>) => void;
  onEditRide: (id: string, updatedFields: Partial<RideEntity>) => void;
  onDeleteRide: (id: string) => void;
  settings: UserSettings;
}

export const RidesView: React.FC<RidesViewProps> = ({
  rides,
  onAddRide,
  onEditRide,
  onDeleteRide,
  settings,
}) => {
  // Modal toggle states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRide, setEditingRide] = useState<RideEntity | null>(null);
  const [viewingDetailsRide, setViewingDetailsRide] = useState<RideEntity | null>(null);
  const [rideToDeleteId, setRideToDeleteId] = useState<string | null>(null);

  // Filters
  const [paymentFilter, setPaymentFilter] = useState<'Todos' | 'PIX' | 'Dinheiro' | 'Cartão' | 'Outro'>('Todos');
  const [typeFilter, setTypeFilter] = useState<'Todos' | 'Individual' | 'Lote'>('Todos');

  // Filter logic
  const filteredRides = rides.filter(ride => {
    const matchesPayment = paymentFilter === 'Todos' || ride.paymentMethod === paymentFilter;
    const isBatch = ride.tripsCount > 1;
    const matchesType = typeFilter === 'Todos' || 
                        (typeFilter === 'Individual' && !isBatch) || 
                        (typeFilter === 'Lote' && isBatch);
    return matchesPayment && matchesType;
  });

  // Helper formatters
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'PIX':
        return <Smartphone className="w-4 h-4 text-teal-400" />;
      case 'Dinheiro':
        return <Banknote className="w-4 h-4 text-red-400" />;
      case 'Cartão':
        return <CreditCard className="w-4 h-4 text-violet-400" />;
      default:
        return <Coins className="w-4 h-4 text-slate-400" />;
    }
  };

  const getPaymentBg = (method: string) => {
    switch (method) {
      case 'PIX':
        return 'bg-teal-500/10 border-teal-500/20';
      case 'Dinheiro':
        return 'bg-red-500/10 border-red-500/20';
      case 'Cartão':
        return 'bg-violet-500/10 border-violet-500/20';
      default:
        return 'bg-slate-900 border-slate-800';
    }
  };

  return (
    <div className="space-y-6 pb-28 relative">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs uppercase tracking-widest text-red-500 font-bold font-mono">
            MÓDULO DE CORRIDAS
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white mt-0.5">
            Histórico do Dia
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {rides.length} lançamentos efetuados hoje
          </p>
        </div>

        {/* Quick Launch Header Action */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-10 h-10 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-red-500/10 active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Filter Chips Bar */}
      <Card variant="outline" className="p-3 bg-slate-900/10 border-slate-850 space-y-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          Filtrar Lançamentos
        </div>
        
        <div className="space-y-2">
          {/* Payment Filter */}
          <div className="flex flex-wrap gap-1.5">
            {(['Todos', 'PIX', 'Dinheiro', 'Cartão', 'Outro'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setPaymentFilter(filter)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                  paymentFilter === filter
                    ? 'bg-red-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-850'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Batch vs Individual Filter */}
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-900">
            {(['Todos', 'Individual', 'Lote'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setTypeFilter(filter)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono tracking-wide ${
                  typeFilter === filter
                    ? 'bg-slate-800 text-red-400 border border-red-500/30'
                    : 'bg-slate-950 text-slate-500 border border-transparent'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Rides Logger List Content */}
      <div className="space-y-3.5">
        
        {/* Empty state conditional */}
        {filteredRides.length === 0 ? (
          <div className="text-center py-12 px-6 bg-slate-900/10 border border-slate-900/80 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mx-auto">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Nenhuma corrida encontrada</h4>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                {rides.length === 0 
                  ? 'Você ainda não registrou corridas hoje. Toque no botão "+" acima para iniciar.' 
                  : 'Nenhuma corrida corresponde aos filtros aplicados.'}
              </p>
            </div>
            {rides.length > 0 && (
              <button 
                onClick={() => { setPaymentFilter('Todos'); setTypeFilter('Todos'); }}
                className="text-[10px] font-bold text-red-400 font-mono uppercase underline hover:text-red-300"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filteredRides.map((ride) => {
                const isBatch = ride.tripsCount > 1;
                return (
                  <motion.div
                    key={ride.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, y: 15 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Card variant="outline" className="p-4 border-slate-850 hover:border-slate-800 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        
                        {/* Left Side: Payment Method Badge & Time */}
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${getPaymentBg(ride.paymentMethod)}`}>
                            {getPaymentIcon(ride.paymentMethod)}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-slate-200 font-mono uppercase">
                                {ride.paymentMethod}
                              </span>
                              
                              {/* Batch Identifier Pill */}
                              {isBatch ? (
                                <span className="text-[8px] font-black uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                  LOTE: {ride.tripsCount} CORRIDAS
                                </span>
                              ) : (
                                <span className="text-[8px] font-bold font-mono px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500">
                                  INDIVIDUAL
                                </span>
                              )}
                            </div>
                            
                            <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-600" />
                              {formatTime(ride.timestamp)}
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Total Earnings */}
                        <div className="text-right">
                          <CurrencyDisplay value={ride.earnings} size="lg" trend="positive" />
                          <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
                            {isBatch ? `Média: R$ ${(ride.earnings / ride.tripsCount).toFixed(2).replace('.', ',')}` : 'Valor Único'}
                          </span>
                        </div>

                      </div>

                      {/* Display Observation if exists */}
                      {ride.notes && (
                        <div className="mt-3 pt-2.5 border-t border-slate-900/60 flex items-start gap-1.5 text-[10px] text-slate-400">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
                          <span className="italic">"{ride.notes}"</span>
                        </div>
                      )}

                      {/* Utility Action Buttons (Edit / Delete) */}
                      <div className="mt-3 pt-2.5 border-t border-slate-900/60 flex justify-between items-center">
                        <button
                          onClick={() => setViewingDetailsRide(ride)}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-300 flex items-center gap-1 font-mono uppercase"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detalhes
                        </button>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={() => setEditingRide(ride)}
                            className="text-[10px] font-bold text-slate-500 hover:text-red-400 flex items-center gap-1 font-mono uppercase transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          
                          <button
                            onClick={() => setRideToDeleteId(ride.id)}
                            className="text-[10px] font-bold text-slate-500 hover:text-rose-400 flex items-center gap-1 font-mono uppercase transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir
                          </button>
                        </div>
                      </div>

                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>


      {/* ==================== MODAL: ADICIONAR CORRIDA ==================== */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-slate-950 rounded-t-3xl border-t border-slate-800 p-6 space-y-6 pb-safe-bottom"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <div>
                  <h3 className="text-base font-black text-white">Lançar Nova Corrida</h3>
                  <p className="text-xs text-slate-400">Insira valores e formas de recebimento</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <RideForm 
                onConfirm={(rideData) => {
                  onAddRide(rideData);
                  setIsAddModalOpen(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ==================== MODAL: EDITAR CORRIDA ==================== */}
      <AnimatePresence>
        {editingRide && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-slate-950 rounded-t-3xl border-t border-slate-800 p-6 space-y-6 pb-safe-bottom"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <div>
                  <h3 className="text-base font-black text-white">Editar Lançamento</h3>
                  <p className="text-xs text-slate-400">Modifique os dados do lançamento</p>
                </div>
                <button 
                  onClick={() => setEditingRide(null)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <RideForm 
                initialRide={editingRide}
                onConfirm={(rideData) => {
                  onEditRide(editingRide.id, rideData);
                  setEditingRide(null);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ==================== MODAL: DETALHES COMPLETOS ==================== */}
      <AnimatePresence>
        {viewingDetailsRide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-red-400">
                  Comprovante de Lançamento
                </span>
                <button 
                  onClick={() => setViewingDetailsRide(null)}
                  className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-center py-4 space-y-1.5 bg-slate-900/20 border border-slate-900 rounded-xl">
                <span className="text-xs text-slate-500 font-mono uppercase block">Valor Total Recebido</span>
                <CurrencyDisplay value={viewingDetailsRide.earnings} size="3xl" trend="positive" />
                <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-full inline-block">
                  Recebimento via {viewingDetailsRide.paymentMethod}
                </span>
              </div>

              <div className="space-y-3.5 pt-1">
                
                <div className="flex justify-between text-xs border-b border-slate-900 pb-2">
                  <span className="text-slate-500 font-mono uppercase">Tipo de Entrada</span>
                  <span className="font-bold text-slate-200 font-mono">
                    {viewingDetailsRide.tripsCount > 1 ? `Lote (${viewingDetailsRide.tripsCount} corridas)` : 'Corrida Individual'}
                  </span>
                </div>

                <div className="flex justify-between text-xs border-b border-slate-900 pb-2">
                  <span className="text-slate-500 font-mono uppercase">Data / Horário</span>
                  <span className="font-mono text-slate-300">
                    {new Date(viewingDetailsRide.timestamp).toLocaleDateString('pt-BR')} às {formatTime(viewingDetailsRide.timestamp)}
                  </span>
                </div>

                <div className="flex justify-between text-xs border-b border-slate-900 pb-2">
                  <span className="text-slate-500 font-mono uppercase">Aplicativo</span>
                  <span className="font-bold text-slate-300 uppercase font-mono">
                    {viewingDetailsRide.app}
                  </span>
                </div>

                {viewingDetailsRide.notes && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono uppercase block">Observação</span>
                    <p className="text-xs text-slate-300 bg-slate-900/40 border border-slate-900 p-2.5 rounded-lg italic leading-relaxed">
                      "{viewingDetailsRide.notes}"
                    </p>
                  </div>
                )}

              </div>

              <Button variant="secondary" size="md" fullWidth onClick={() => setViewingDetailsRide(null)}>
                Fechar Detalhes
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ==================== CONFIRM DELETE QUICK PROMPT ==================== */}
      <AnimatePresence>
        {rideToDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-xs bg-slate-950 rounded-2xl border border-rose-500/30 p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertCircle className="w-5 h-5 shrink-0 animate-pulse" />
                <h4 className="text-sm font-black uppercase font-mono">Confirmar Exclusão</h4>
              </div>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Tem certeza de que deseja apagar permanentemente esta corrida? Essa ação recalcula imediatamente o seu lucro líquido do dia.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRideToDeleteId(null)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteRide(rideToDeleteId);
                    setRideToDeleteId(null);
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-xs font-black text-slate-950 shadow-md shadow-rose-500/10"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};


// ==================== SUB-COMPONENT: REUSABLE RIDE FORM ====================
interface RideFormProps {
  initialRide?: RideEntity;
  onConfirm: (rideData: {
    earnings: number;
    paymentMethod: 'PIX' | 'Dinheiro' | 'Cartão' | 'Outro';
    tripsCount: number;
    notes?: string;
    timestamp: string;
  }) => void;
}

const RideForm: React.FC<RideFormProps> = ({ initialRide, onConfirm }) => {
  const isEditing = !!initialRide;
  const [formMode, setFormMode] = useState<'individual' | 'lote'>(
    initialRide && initialRide.tripsCount > 1 ? 'lote' : 'individual'
  );

  // Fields state
  const [value, setValue] = useState(initialRide ? initialRide.earnings.toString().replace('.', ',') : '');
  const [tripsCount, setTripsCount] = useState(initialRide ? initialRide.tripsCount : 5);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Dinheiro' | 'Cartão' | 'Outro'>(
    initialRide ? initialRide.paymentMethod : 'PIX'
  );
  const [notes, setNotes] = useState(initialRide?.notes || '');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const earnings = parseFloat(value.replace(',', '.'));

    if (isNaN(earnings) || earnings <= 0) {
      setErrorMsg('Insira um valor de recebimento válido maior que zero.');
      return;
    }

    onConfirm({
      earnings: Number(earnings.toFixed(2)),
      paymentMethod,
      tripsCount: formMode === 'individual' ? 1 : tripsCount,
      notes: notes.trim() || undefined,
      timestamp: initialRide ? initialRide.timestamp : new Date().toISOString()
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
      
      {/* If creating new, show Mode tabs. If editing, hide mode selection for integrity */}
      {!isEditing && (
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
      )}

      {errorMsg && (
        <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
          {errorMsg}
        </p>
      )}

      <div className="space-y-4">
        
        {/* Lote Counter */}
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
                <Minus className="w-4 h-4" />
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
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Value field */}
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

        {/* Payment options */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 font-mono">
            FORMA DE RECEBIMENTO
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

        {/* Notes */}
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

      <Button variant="primary" size="lg" fullWidth type="submit" className="py-4 font-black tracking-wide">
        <Check className="w-5 h-5" />
        {isEditing ? 'Confirmar Alteração' : 'Confirmar Lançamento'}
      </Button>

    </form>
  );
};
