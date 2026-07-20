/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, Calendar, Clock, MapPin, DollarSign, Plus, Edit2, Trash2, 
  Check, X, ChevronLeft, Phone, Info, RefreshCw, CalendarDays, CheckCircle2, MessageSquare, AlertCircle
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { PrivateClient, PrivateRide, PrivateRideStatus, RideEntity } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface PrivateRidesSectionProps {
  privateClients: PrivateClient[];
  onUpdatePrivateClients: (clients: PrivateClient[]) => void;
  privateRides: PrivateRide[];
  onUpdatePrivateRides: (rides: PrivateRide[]) => void;
  onAddRide: (rideData: { timestamp: string; earnings: number; paymentMethod: 'PIX' | 'Dinheiro' | 'Cartão' | 'Outro'; tripsCount: number; notes?: string }) => void;
  onBack: () => void;
}

export const PrivateRidesSection: React.FC<PrivateRidesSectionProps> = ({
  privateClients,
  onUpdatePrivateClients,
  privateRides,
  onUpdatePrivateRides,
  onAddRide,
  onBack,
}) => {
  // Tabs: 'agenda' or 'clientes'
  const [activeTab, setActiveTab] = useState<'agenda' | 'clientes'>('agenda');

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  const [isRideModalOpen, setIsRideModalOpen] = useState(false);
  const [editingRideId, setEditingRideId] = useState<string | null>(null);
  const [rideClientId, setRideClientId] = useState('');
  const [rideDate, setRideDate] = useState('');
  const [rideTime, setRideTime] = useState('');
  const [rideOrigin, setRideOrigin] = useState('');
  const [rideDestination, setRideDestination] = useState('');
  const [rideAmount, setRideAmount] = useState('');
  const [rideRecurrence, setRideRecurrence] = useState('');
  const [rideNotes, setRideNotes] = useState('');
  const [rideStatus, setRideStatus] = useState<PrivateRideStatus>('Agendada');

  // Launch revenue modal state
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [revenueAmount, setRevenueAmount] = useState('');
  const [revenueMethod, setRevenueMethod] = useState<'PIX' | 'Dinheiro' | 'Cartão' | 'Outro'>('PIX');
  const [revenueNotes, setRevenueNotes] = useState('');
  const [completedRideId, setCompletedRideId] = useState<string | null>(null);

  // ----------------- CLIENT OPERATIONS -----------------
  const handleOpenAddClient = () => {
    setEditingClientId(null);
    setClientName('');
    setClientPhone('');
    setClientNotes('');
    setIsClientModalOpen(true);
  };

  const handleOpenEditClient = (client: PrivateClient) => {
    setEditingClientId(client.id);
    setClientName(client.name);
    setClientPhone(client.phone);
    setClientNotes(client.notes || '');
    setIsClientModalOpen(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      alert('Por favor, preencha nome e telefone do cliente.');
      return;
    }

    let updated: PrivateClient[];
    if (editingClientId) {
      updated = privateClients.map(c => {
        if (c.id === editingClientId) {
          return { ...c, name: clientName.trim(), phone: clientPhone.trim(), notes: clientNotes.trim() || undefined };
        }
        return c;
      });
    } else {
      const newClient: PrivateClient = {
        id: 'client_' + Date.now(),
        name: clientName.trim(),
        phone: clientPhone.trim(),
        notes: clientNotes.trim() || undefined,
      };
      updated = [...privateClients, newClient];
    }

    onUpdatePrivateClients(updated);
    setIsClientModalOpen(false);
  };

  const handleDeleteClient = (id: string) => {
    // Check if client has scheduled rides
    const hasRides = privateRides.some(r => r.clientId === id);
    const msg = hasRides 
      ? 'Este cliente possui corridas vinculadas. Excluir o cliente também apagará ou desvinculará suas corridas. Confirmar exclusão?'
      : 'Tem certeza que deseja excluir este cliente?';
      
    if (window.confirm(msg)) {
      const updatedClients = privateClients.filter(c => c.id !== id);
      onUpdatePrivateClients(updatedClients);
      // Clean up linked rides
      const updatedRides = privateRides.filter(r => r.clientId !== id);
      onUpdatePrivateRides(updatedRides);
    }
  };

  // ----------------- RIDE OPERATIONS -----------------
  const handleOpenAddRide = () => {
    if (privateClients.length === 0) {
      alert('Você precisa cadastrar pelo menos um cliente antes de agendar uma corrida.');
      setActiveTab('clientes');
      return;
    }
    setEditingRideId(null);
    setRideClientId(privateClients[0].id);
    setRideDate(new Date().toISOString().split('T')[0]);
    setRideTime('12:00');
    setRideOrigin('');
    setRideDestination('');
    setRideAmount('');
    setRideRecurrence('');
    setRideNotes('');
    setRideStatus('Agendada');
    setIsRideModalOpen(true);
  };

  const handleOpenEditRide = (ride: PrivateRide) => {
    setEditingRideId(ride.id);
    setRideClientId(ride.clientId);
    setRideDate(ride.date);
    setRideTime(ride.time);
    setRideOrigin(ride.origin || '');
    setRideDestination(ride.destination || '');
    setRideAmount(ride.amount.toString());
    setRideRecurrence(ride.recurrence || '');
    setRideNotes(ride.notes || '');
    setRideStatus(ride.status);
    setIsRideModalOpen(true);
  };

  const handleSaveRide = (e: React.FormEvent) => {
    e.preventDefault();
    const amountFloat = parseFloat(rideAmount.replace(',', '.'));

    if (!rideClientId) {
      alert('Por favor, selecione um cliente.');
      return;
    }
    if (!rideDate || !rideTime) {
      alert('Por favor, especifique data e horário.');
      return;
    }
    if (isNaN(amountFloat) || amountFloat <= 0) {
      alert('Por favor, insira um valor combinado válido.');
      return;
    }

    let updated: PrivateRide[];
    if (editingRideId) {
      updated = privateRides.map(r => {
        if (r.id === editingRideId) {
          return {
            ...r,
            clientId: rideClientId,
            date: rideDate,
            time: rideTime,
            origin: rideOrigin.trim() || undefined,
            destination: rideDestination.trim() || undefined,
            amount: Number(amountFloat.toFixed(2)),
            recurrence: rideRecurrence.trim() || undefined,
            notes: rideNotes.trim() || undefined,
            status: rideStatus,
          };
        }
        return r;
      });
    } else {
      const newRide: PrivateRide = {
        id: 'ride_p_' + Date.now(),
        clientId: rideClientId,
        date: rideDate,
        time: rideTime,
        origin: rideOrigin.trim() || undefined,
        destination: rideDestination.trim() || undefined,
        amount: Number(amountFloat.toFixed(2)),
        recurrence: rideRecurrence.trim() || undefined,
        notes: rideNotes.trim() || undefined,
        status: rideStatus,
      };
      updated = [...privateRides, newRide];
    }

    onUpdatePrivateRides(updated);
    setIsRideModalOpen(false);
  };

  const handleDeleteRide = (id: string) => {
    if (window.confirm('Excluir este compromisso permanentemente?')) {
      const filtered = privateRides.filter(r => r.id !== id);
      onUpdatePrivateRides(filtered);
    }
  };

  // ----------------- COMPLETE RIDE & REGISTER REVENUE -----------------
  const handleMarkAsRealized = (ride: PrivateRide) => {
    // Open revenue registry modal
    setCompletedRideId(ride.id);
    setRevenueAmount(ride.amount.toFixed(2));
    const client = privateClients.find(c => c.id === ride.clientId);
    setRevenueNotes(`Corrida Particular: ${client?.name || 'Cliente'}`);
    setIsRevenueModalOpen(true);
  };

  const handleSaveRevenue = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseFloat(revenueAmount.replace(',', '.'));

    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert('Por favor, insira um valor de faturamento válido.');
      return;
    }

    // 1. Update the status of the private ride to 'Realizada'
    if (completedRideId) {
      const updatedRides = privateRides.map(r => {
        if (r.id === completedRideId) {
          return { ...r, status: 'Realizada' as PrivateRideStatus };
        }
        return r;
      });
      onUpdatePrivateRides(updatedRides);

      // 2. Add as a standard completed ride (revenue) in App.tsx state
      onAddRide({
        timestamp: new Date().toISOString(),
        earnings: Number(finalAmount.toFixed(2)),
        paymentMethod: revenueMethod,
        tripsCount: 1,
        notes: revenueNotes,
      });

      alert(`Sucesso! R$ ${finalAmount.toFixed(2).replace('.', ',')} lançados no seu faturamento diário.`);
    }

    setIsRevenueModalOpen(false);
    setCompletedRideId(null);
  };

  // ----------------- DATE & FILTER HELPERS -----------------
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const todayStr = getTodayDateString();

  // "Agenda do Dia" filter
  const todayRides = privateRides
    .filter(r => r.date === todayStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  // "Próximos compromissos" filter: rides in the future OR today later than now
  const upcomingRides = privateRides
    .filter(r => r.date > todayStr)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

  const getStatusStyle = (status: PrivateRideStatus) => {
    switch (status) {
      case 'Agendada':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'Confirmada':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
      case 'Realizada':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'Cancelada':
        return 'bg-slate-800 border-slate-700 text-slate-400 line-through';
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
            OPERACIONAL PARTICULAR
          </span>
          <h2 className="text-base font-black text-white">Corridas & Agenda</h2>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 border border-slate-850 rounded-xl">
        <button
          onClick={() => setActiveTab('agenda')}
          className={`py-2 px-3 text-xs font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'agenda' 
              ? 'bg-slate-950 border border-slate-800 text-white shadow' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-red-400" />
          Agenda & Corridas
        </button>
        <button
          onClick={() => setActiveTab('clientes')}
          className={`py-2 px-3 text-xs font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'clientes' 
              ? 'bg-slate-950 border border-slate-800 text-white shadow' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-red-400" />
          Clientes ({privateClients.length})
        </button>
      </div>

      {/* ==================== SUB-VIEW: AGENDA ==================== */}
      {activeTab === 'agenda' && (
        <div className="space-y-5">
          {/* Action Overview Card */}
          <Card variant="outline" className="p-4 bg-slate-900/10 border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block">COMPROMISSOS</span>
              <span className="text-xl font-bold font-mono text-slate-200 mt-0.5 block">
                {privateRides.filter(r => r.status !== 'Realizada' && r.status !== 'Cancelada').length} agendados
              </span>
            </div>
            <Button variant="danger" size="sm" onClick={handleOpenAddRide} className="text-xs py-2 px-3 shrink-0">
              <Plus className="w-3.5 h-3.5" /> Nova Corrida
            </Button>
          </Card>

          {/* Section 1: Agenda do Dia */}
          <div className="space-y-3.5">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">
                AGENDA DO DIA (HOJE)
              </h3>
              <span className="text-[10px] font-mono text-red-400 font-bold bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">
                {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
              </span>
            </div>

            {todayRides.length === 0 ? (
              <Card variant="outline" className="p-6 text-center border-dashed border-slate-850">
                <Calendar className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Sem corridas particulares hoje</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {todayRides.map(ride => {
                  const client = privateClients.find(c => c.id === ride.clientId);
                  return (
                    <Card key={ride.id} variant="outline" className="p-4 bg-slate-900/10 border-slate-800 space-y-3">
                      {/* Ride header */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-red-400" />
                            {ride.time}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1 truncate">{client?.name || 'Cliente Excluído'}</h4>
                          {client?.phone && (
                            <a 
                              href={`tel:${client.phone}`}
                              className="text-[10px] text-slate-500 hover:text-red-400 font-mono flex items-center gap-1 mt-0.5 cursor-pointer underline decoration-dotted"
                            >
                              <Phone className="w-3 h-3" /> {client.phone}
                            </a>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border block ${getStatusStyle(ride.status)}`}>
                            {ride.status}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-300 block mt-1.5">
                            R$ {ride.amount.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>

                      {/* Route specs */}
                      {(ride.origin || ride.destination) && (
                        <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-900 space-y-1 font-sans">
                          {ride.origin && (
                            <div className="flex items-start gap-1.5 min-w-0">
                              <MapPin className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" />
                              <span className="truncate"><strong className="text-slate-500">Origem:</strong> {ride.origin}</span>
                            </div>
                          )}
                          {ride.destination && (
                            <div className="flex items-start gap-1.5 min-w-0">
                              <MapPin className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                              <span className="truncate"><strong className="text-slate-500">Destino:</strong> {ride.destination}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Recurrence Indicator */}
                      {ride.recurrence && (
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-slate-900 px-2 py-1 rounded">
                          <RefreshCw className="w-3 h-3 text-red-400 animate-spin-slow" />
                          <span>Recorrente: {ride.recurrence}</span>
                        </div>
                      )}

                      {/* Notes */}
                      {ride.notes && (
                        <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-900/40 p-2 rounded border border-slate-900 border-dashed">
                          <strong className="font-mono">Obs:</strong> {ride.notes}
                        </p>
                      )}

                      {/* Quick Actions */}
                      <div className="flex gap-2 pt-2.5 border-t border-slate-900/80 justify-end items-center">
                        {(ride.status === 'Agendada' || ride.status === 'Confirmada') && (
                          <button
                            onClick={() => handleMarkAsRealized(ride)}
                            className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-slate-950 font-black text-xs flex items-center gap-1 active:scale-95 transition-transform"
                          >
                            <Check className="w-3.5 h-3.5" /> Concluída
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditRide(ride)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                          title="Editar corrida"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRide(ride.id)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400"
                          title="Excluir corrida"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Próximos Compromissos */}
          <div className="space-y-3.5">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">
              PRÓXIMOS COMPROMISSOS (OUTROS DIAS)
            </h3>

            {upcomingRides.length === 0 ? (
              <Card variant="outline" className="p-6 text-center border-dashed border-slate-850">
                <Calendar className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Nenhum compromisso futuro agendado</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcomingRides.map(ride => {
                  const client = privateClients.find(c => c.id === ride.clientId);
                  const formattedDate = new Date(ride.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric' });
                  
                  return (
                    <Card key={ride.id} variant="outline" className="p-3 bg-slate-900/5 border-slate-800/80 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-black text-red-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {formattedDate} - {ride.time}
                          </span>
                          <span className={`text-[8px] uppercase tracking-wide font-mono font-bold px-1.5 py-0.5 rounded border ${getStatusStyle(ride.status)}`}>
                            {ride.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 mt-1.5 truncate">{client?.name || 'Cliente'}</h4>
                        {(ride.origin || ride.destination) && (
                          <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                            {ride.origin || 'N/A'} ➔ {ride.destination || 'N/A'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right whitespace-nowrap shrink-0">
                          <span className="text-xs font-mono font-bold text-slate-300">
                            R$ {ride.amount.toFixed(2).replace('.', ',')}
                          </span>
                          {ride.recurrence && (
                            <span className="text-[8px] text-red-500 font-mono block mt-0.5">Recorrente</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 border-l border-slate-900 pl-2">
                          <button
                            onClick={() => handleOpenEditRide(ride)}
                            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteRide(ride.id)}
                            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-VIEW: CLIENTS ==================== */}
      {activeTab === 'clientes' && (
        <div className="space-y-4">
          <Card variant="outline" className="p-4 bg-slate-900/10 border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block">CLIENTES ATIVOS</span>
              <span className="text-xl font-bold font-mono text-slate-200 mt-0.5 block">{privateClients.length}</span>
            </div>
            <Button variant="danger" size="sm" onClick={handleOpenAddClient} className="text-xs py-2 px-3 shrink-0">
              <Plus className="w-3.5 h-3.5" /> Novo Cliente
            </Button>
          </Card>

          {privateClients.length === 0 ? (
            <Card variant="outline" className="p-8 text-center border-dashed border-slate-800">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400">Nenhum cliente cadastrado</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">
                Cadastre pessoas físicas, clínicas, escritórios ou empresas que solicitam suas corridas diretas sem intermediários de aplicativo.
              </p>
              <button
                onClick={handleOpenAddClient}
                className="text-xs font-mono font-bold text-red-400 underline mt-3 hover:text-red-300"
              >
                Cadastrar primeiro cliente
              </button>
            </Card>
          ) : (
            <div className="space-y-3">
              {privateClients.map(client => (
                <Card key={client.id} variant="outline" className="p-4 bg-slate-900/10 border-slate-800 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white">{client.name}</h4>
                      <a 
                        href={`tel:${client.phone}`}
                        className="text-xs font-mono text-red-400 hover:text-red-300 flex items-center gap-1.5 mt-1 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {client.phone}
                      </a>
                    </div>

                    <div className="flex gap-1.5">
                      <a 
                        href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                        title="Conversar no WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleOpenEditClient(client)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {client.notes && (
                    <p className="text-[10px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 leading-normal font-sans">
                      <strong className="text-slate-500 font-mono block text-[9px] uppercase tracking-wider mb-0.5">NOTAS / OBSERVAÇÕES:</strong>
                      {client.notes}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== MODAL: CLIENT FORM ==================== */}
      <AnimatePresence>
        {isClientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-slate-950 rounded-t-3xl border-t border-slate-800 p-6 space-y-4 pb-safe-bottom"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <h3 className="text-base font-black text-white">
                  {editingClientId ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
                </h3>
                <button
                  onClick={() => setIsClientModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveClient} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    NOME COMPLETO *
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Dr. Roberto Alencar"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    TELEFONE / WHATSAPP *
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Ex: 11999998888 (somente números)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    OBSERVAÇÕES (OPCIONAL)
                  </label>
                  <textarea
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    placeholder="Ex: Endereço comercial, restrição de horários, ou convênios recorrentes."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none resize-none"
                  />
                </div>

                <Button variant="danger" size="lg" fullWidth type="submit" className="py-3 font-black tracking-wide mt-2">
                  <Check className="w-5 h-5" />
                  {editingClientId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL: RIDE FORM ==================== */}
      <AnimatePresence>
        {isRideModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-slate-950 rounded-t-3xl border-t border-slate-800 p-6 space-y-4 pb-safe-bottom max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <h3 className="text-base font-black text-white">
                  {editingRideId ? 'Editar Corrida Particular' : 'Agendar Corrida Particular'}
                </h3>
                <button
                  onClick={() => setIsRideModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRide} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    SELECIONAR CLIENTE *
                  </label>
                  <select
                    value={rideClientId}
                    onChange={(e) => setRideClientId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none appearance-none"
                    required
                  >
                    {privateClients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                      DATA *
                    </label>
                    <input
                      type="date"
                      value={rideDate}
                      onChange={(e) => setRideDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                      HORÁRIO *
                    </label>
                    <input
                      type="time"
                      value={rideTime}
                      onChange={(e) => setRideTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                      VALOR COMBINADO (R$) *
                    </label>
                    <input
                      type="text"
                      value={rideAmount}
                      onChange={(e) => setRideAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                      STATUS DA CORRIDA
                    </label>
                    <select
                      value={rideStatus}
                      onChange={(e) => setRideStatus(e.target.value as PrivateRideStatus)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none appearance-none"
                    >
                      <option value="Agendada">Agendada</option>
                      <option value="Confirmada">Confirmada</option>
                      <option value="Realizada">Realizada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    ENDEREÇO DE ORIGEM (OPCIONAL)
                  </label>
                  <input
                    type="text"
                    value={rideOrigin}
                    onChange={(e) => setRideOrigin(e.target.value)}
                    placeholder="Ex: Av. Paulista, 1000 ou Casa do Cliente"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    ENDEREÇO DE DESTINO (OPCIONAL)
                  </label>
                  <input
                    type="text"
                    value={rideDestination}
                    onChange={(e) => setRideDestination(e.target.value)}
                    placeholder="Ex: Aeroporto de Guarulhos ou Centro Médico"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    RECORRÊNCIA SIMPLES (OPCIONAL)
                  </label>
                  <input
                    type="text"
                    value={rideRecurrence}
                    onChange={(e) => setRideRecurrence(e.target.value)}
                    placeholder="Ex: Segunda, quarta e sexta às 06:30"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Segunda e Quarta', 'Terça e Quinta', 'Seg, Qua e Sex'].map(rec => (
                      <button
                        type="button"
                        key={rec}
                        onClick={() => setRideRecurrence(rec)}
                        className="text-[9px] font-mono font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 hover:text-slate-200"
                      >
                        {rec}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    OBSERVAÇÕES DA CORRIDA (OPCIONAL)
                  </label>
                  <textarea
                    value={rideNotes}
                    onChange={(e) => setRideNotes(e.target.value)}
                    placeholder="Ex: Aguardar retorno, viagem longa, bagagem média, etc."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none resize-none"
                  />
                </div>

                <Button variant="danger" size="lg" fullWidth type="submit" className="py-3 font-black tracking-wide mt-2">
                  <Check className="w-5 h-5" />
                  {editingRideId ? 'Salvar Alterações' : 'Agendar Corrida'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL: COMPLETE & REVENUE LANDING ==================== */}
      <AnimatePresence>
        {isRevenueModalOpen && (
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
                  <h3 className="text-base font-black text-white">Lançar no Faturamento</h3>
                  <p className="text-xs text-slate-400">Lance o valor recebido no seu caixa de receitas diárias</p>
                </div>
                <button
                  onClick={() => setIsRevenueModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRevenue} className="space-y-4">
                <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 text-xs text-red-400/90 leading-normal flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>
                    Marcar como realizada atualizará o status do compromisso e permitirá consolidar os ganhos na tela de faturamento da sua jornada ativa hoje!
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    VALOR EFETIVAMENTE RECEBIDO (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-sans font-bold text-slate-500">R$</span>
                    <input
                      type="text"
                      value={revenueAmount}
                      onChange={(e) => setRevenueAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-slate-950 border-2 border-slate-800 focus:border-red-500/50 rounded-2xl pl-11 pr-4 py-3 text-base text-slate-100 font-mono focus:outline-none transition-colors"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    FORMA DE PAGAMENTO RECEBIDO
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {([ 'PIX', 'Dinheiro', 'Cartão', 'Outro' ] as const).map(method => (
                      <button
                        type="button"
                        key={method}
                        onClick={() => setRevenueMethod(method)}
                        className={`py-2 px-1 text-center text-xs font-bold uppercase rounded-lg border transition-colors ${
                          revenueMethod === method 
                            ? 'bg-red-500/10 border-red-500 text-red-400' 
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    DESCRIÇÃO DA RECEITA
                  </label>
                  <input
                    type="text"
                    value={revenueNotes}
                    onChange={(e) => setRevenueNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                    required
                  />
                </div>

                <Button variant="danger" size="lg" fullWidth type="submit" className="py-3.5 font-black tracking-wide mt-2">
                  <Check className="w-5 h-5" />
                  Confirmar e Integrar ao Faturamento
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
