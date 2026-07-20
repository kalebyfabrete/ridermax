/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wrench, Fuel, Gauge, DollarSign, Calendar, Plus, Trash2, Edit2, 
  Check, X, ChevronLeft, AlertTriangle, CheckCircle2, TrendingUp, Info, HelpCircle
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { RefuelingEntity, MaintenanceEntity, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface MotorcycleSectionProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  refuelings: RefuelingEntity[];
  onUpdateRefuelings: (refuels: RefuelingEntity[]) => void;
  maintenances: MaintenanceEntity[];
  onUpdateMaintenances: (maintenances: MaintenanceEntity[]) => void;
  onAddExpense: (amount: number, category: 'Abastecimento' | 'Alimentação' | 'Manutenção' | 'Outros', description: string) => void;
  onBack: () => void;
}

interface MaintenanceTypeConfig {
  type: 'Troca de óleo' | 'Pneus' | 'Pastilhas' | 'Relação' | 'Revisão';
  label: string;
  defaultInterval: number; // in km
  description: string;
}

const MAINTENANCE_CONFIGS: MaintenanceTypeConfig[] = [
  { type: 'Troca de óleo', label: 'Troca de Óleo', defaultInterval: 3000, description: 'Recomendado a cada 3.000 km' },
  { type: 'Pastilhas', label: 'Pastilhas de Freio', defaultInterval: 10000, description: 'Recomendado a cada 10.050 km' },
  { type: 'Relação', label: 'Kit Relação (Coroa/Pinhão/Corrente)', defaultInterval: 12000, description: 'Recomendado a cada 12.000 km' },
  { type: 'Revisão', label: 'Revisão Geral', defaultInterval: 10000, description: 'Recomendado a cada 10.000 km' },
  { type: 'Pneus', label: 'Troca de Pneus', defaultInterval: 15000, description: 'Recomendado a cada 15.000 km' },
];

export const MotorcycleSection: React.FC<MotorcycleSectionProps> = ({
  profile,
  onUpdateProfile,
  refuelings,
  onUpdateRefuelings,
  maintenances,
  onUpdateMaintenances,
  onAddExpense,
  onBack,
}) => {
  // Tabs: 'combustivel' | 'manutencao' | 'alertas'
  const [activeTab, setActiveTab] = useState<'combustivel' | 'manutencao' | 'alertas'>('alertas');

  // Odometer editing state
  const [isEditingOdometer, setIsEditingOdometer] = useState(false);
  const [tempOdometer, setTempOdometer] = useState(profile.currentOdometer?.toString() || '0');

  // Modals state
  const [isRefuelModalOpen, setIsRefuelModalOpen] = useState(false);
  const [refuelAmount, setRefuelAmount] = useState('');
  const [refuelLiters, setRefuelLiters] = useState('');
  const [refuelOdometer, setRefuelOdometer] = useState('');
  const [refuelDate, setRefuelDate] = useState(new Date().toISOString().split('T')[0]);
  const [refuelNotes, setRefuelNotes] = useState('');

  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [maintType, setMaintType] = useState<MaintenanceEntity['type']>('Troca de óleo');
  const [maintAmount, setMaintAmount] = useState('');
  const [maintOdometer, setMaintOdometer] = useState('');
  const [maintDate, setMaintDate] = useState(new Date().toISOString().split('T')[0]);
  const [maintNotes, setMaintNotes] = useState('');

  const currentOdometer = profile.currentOdometer || 0;

  // ----------------- ODOMETER UPDATE -----------------
  const handleSaveOdometer = (e: React.FormEvent) => {
    e.preventDefault();
    const newOdo = parseInt(tempOdometer, 10);
    if (isNaN(newOdo) || newOdo < 0) {
      alert('Por favor, insira um odômetro válido.');
      return;
    }
    onUpdateProfile({
      ...profile,
      currentOdometer: newOdo
    });
    setIsEditingOdometer(false);
  };

  // ----------------- REFUELING ACTIONS -----------------
  const handleOpenRefuelModal = () => {
    setRefuelAmount('');
    setRefuelLiters('');
    setRefuelOdometer(currentOdometer > 0 ? currentOdometer.toString() : '');
    setRefuelDate(new Date().toISOString().split('T')[0]);
    setRefuelNotes('');
    setIsRefuelModalOpen(true);
  };

  const handleSaveRefuel = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(refuelAmount.replace(',', '.'));
    const litersVal = parseFloat(refuelLiters.replace(',', '.'));
    const odoVal = parseInt(refuelOdometer, 10);

    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Insira um valor em dinheiro válido.');
      return;
    }
    if (isNaN(litersVal) || litersVal <= 0) {
      alert('Insira uma quantidade de litros válida.');
      return;
    }
    if (isNaN(odoVal) || odoVal < 0) {
      alert('Insira uma leitura de odômetro válida.');
      return;
    }

    const newRefuel: RefuelingEntity = {
      id: 'refuel_' + Date.now(),
      amount: Number(amountVal.toFixed(2)),
      liters: Number(litersVal.toFixed(3)),
      odometer: odoVal,
      date: refuelDate,
      notes: refuelNotes.trim() || undefined
    };

    const updated = [newRefuel, ...refuelings];
    onUpdateRefuelings(updated);

    // If refueling odometer is greater than current, automatically update the vehicle's odometer
    if (odoVal > currentOdometer) {
      onUpdateProfile({
        ...profile,
        currentOdometer: odoVal
      });
      setTempOdometer(odoVal.toString());
    }

    // Automatically register as an operational expense under category "Abastecimento"
    onAddExpense(
      Number(amountVal.toFixed(2)),
      'Abastecimento',
      `Abastecimento: ${litersVal.toFixed(2)}L (odômetro: ${odoVal} km)`
    );

    setIsRefuelModalOpen(false);
    alert(`Combustível registrado! Despesa de R$ ${amountVal.toFixed(2).replace('.', ',')} adicionada ao financeiro.`);
  };

  const handleDeleteRefuel = (id: string) => {
    if (window.confirm('Excluir este registro de abastecimento?')) {
      const filtered = refuelings.filter(r => r.id !== id);
      onUpdateRefuelings(filtered);
    }
  };

  // ----------------- MAINTENANCE ACTIONS -----------------
  const handleOpenMaintModal = (preselectedType?: MaintenanceEntity['type']) => {
    setMaintType(preselectedType || 'Troca de óleo');
    setMaintAmount('');
    setMaintOdometer(currentOdometer > 0 ? currentOdometer.toString() : '');
    setMaintDate(new Date().toISOString().split('T')[0]);
    setMaintNotes('');
    setIsMaintModalOpen(true);
  };

  const handleSaveMaint = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(maintAmount.replace(',', '.'));
    const odoVal = parseInt(maintOdometer, 10);

    if (isNaN(amountVal) || amountVal < 0) {
      alert('Insira um valor válido para a manutenção.');
      return;
    }
    if (isNaN(odoVal) || odoVal < 0) {
      alert('Insira uma leitura de odômetro válida.');
      return;
    }

    const newMaint: MaintenanceEntity = {
      id: 'maint_' + Date.now(),
      type: maintType,
      amount: Number(amountVal.toFixed(2)),
      odometer: odoVal,
      date: maintDate,
      notes: maintNotes.trim() || undefined
    };

    const updated = [newMaint, ...maintenances];
    onUpdateMaintenances(updated);

    // If maintenance odometer is greater than current, automatically update odometer
    if (odoVal > currentOdometer) {
      onUpdateProfile({
        ...profile,
        currentOdometer: odoVal
      });
      setTempOdometer(odoVal.toString());
    }

    // Automatically register as an operational expense under category "Manutenção"
    onAddExpense(
      Number(amountVal.toFixed(2)),
      'Manutenção',
      `Manutenção: ${maintType} (odômetro: ${odoVal} km)`
    );

    setIsMaintModalOpen(false);
    alert(`Manutenção de "${maintType}" salva! Despesa de R$ ${amountVal.toFixed(2).replace('.', ',')} lançada no financeiro.`);
  };

  const handleDeleteMaint = (id: string) => {
    if (window.confirm('Excluir este registro de manutenção?')) {
      const filtered = maintenances.filter(m => m.id !== id);
      onUpdateMaintenances(filtered);
    }
  };

  // ----------------- CALCULATIONS -----------------
  // 1. Average refueling statistics
  const totalRefuelSpent = refuelings.reduce((sum, r) => sum + r.amount, 0);
  const totalRefuelLiters = refuelings.reduce((sum, r) => sum + r.liters, 0);
  
  // Custo médio por abastecimento (Average BRL spent per refueling)
  const avgCostPerRefuel = refuelings.length > 0 ? (totalRefuelSpent / refuelings.length) : 0;
  
  // Preço médio por litro (Average price per liter of fuel)
  const avgPricePerLiter = totalRefuelLiters > 0 ? (totalRefuelSpent / totalRefuelLiters) : 0;

  // Consumption calculation: (odometer_new - odometer_old) / liters_old
  // We sort refuelings by odometer ascending to calculate intervals
  const getConsumptionKmPerLiter = (): number | null => {
    if (refuelings.length < 2) return null;
    const sortedRefuels = [...refuelings].sort((a, b) => a.odometer - b.odometer);
    
    let totalKm = 0;
    let totalLitersUsed = 0;

    for (let i = 0; i < sortedRefuels.length - 1; i++) {
      const current = sortedRefuels[i];
      const next = sortedRefuels[i + 1];
      const diffKm = next.odometer - current.odometer;
      
      if (diffKm > 0) {
        totalKm += diffKm;
        totalLitersUsed += current.liters; // filled up to full, so liters represent the fuel consumed in this interval
      }
    }

    return totalLitersUsed > 0 ? (totalKm / totalLitersUsed) : null;
  };

  const avgConsumption = getConsumptionKmPerLiter();

  // 2. Mileage reminders & calculations
  const getMaintenanceAlerts = () => {
    return MAINTENANCE_CONFIGS.map(config => {
      // Find latest maintenance in history for this category
      const logsOfThisType = maintenances.filter(m => m.type === config.type);
      const lastMaint = logsOfThisType.length > 0 
        ? logsOfThisType.sort((a, b) => b.odometer - a.odometer)[0] 
        : null;

      const lastOdoValue = lastMaint ? lastMaint.odometer : 0;
      const nextOdoValue = lastOdoValue + config.defaultInterval;
      const remainingKm = nextOdoValue - currentOdometer;

      // Severity levels
      // <= 0: overdue (danger)
      // <= 300: near (warning)
      // > 300: safe (ok)
      let severity: 'ok' | 'warning' | 'danger' = 'ok';
      if (remainingKm <= 0) {
        severity = 'danger';
      } else if (remainingKm <= 300) {
        severity = 'warning';
      }

      return {
        ...config,
        lastOdometer: lastOdoValue,
        nextOdometer: nextOdoValue,
        remainingKm,
        severity,
        lastDate: lastMaint?.date || null
      };
    });
  };

  const maintAlerts = getMaintenanceAlerts();
  const activeAlertsCount = maintAlerts.filter(a => a.severity !== 'ok').length;

  return (
    <div className="space-y-5">
      {/* Navigation Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-880 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-red-500 font-bold font-mono">
            CONTROLE DA MOTO
          </span>
          <h2 className="text-base font-black text-white">Combustível & Oficina</h2>
        </div>
      </div>

      {/* Primary Odometer Header */}
      <Card variant="outline" className="p-4 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 font-mono block">ODÔMETRO DA MOTO</span>
              {isEditingOdometer ? (
                <form onSubmit={handleSaveOdometer} className="flex items-center gap-1.5 mt-1">
                  <input
                    type="number"
                    value={tempOdometer}
                    onChange={(e) => setTempOdometer(e.target.value)}
                    className="w-24 bg-slate-950 border-2 border-red-500/50 rounded px-2 py-0.5 text-xs font-mono text-white focus:outline-none"
                    autoFocus
                  />
                  <button type="submit" className="p-1 bg-red-500 rounded text-slate-950">
                    <Check className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => setIsEditingOdometer(false)} className="p-1 bg-slate-900 rounded text-slate-400 border border-slate-800">
                    <X className="w-3 h-3" />
                  </button>
                </form>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-mono font-black text-slate-100">
                    {currentOdometer.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">KM</span>
                  <button
                    onClick={() => {
                      setTempOdometer(currentOdometer.toString());
                      setIsEditingOdometer(true);
                    }}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    title="Editar odômetro"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-mono text-slate-500 block uppercase">STATUS DOS ALERTAS</span>
            <span className={`text-xs font-mono font-bold flex items-center justify-end gap-1.5 mt-1 ${activeAlertsCount > 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {activeAlertsCount > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  {activeAlertsCount} Alertas
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
                  Tudo OK
                </>
              )}
            </span>
          </div>
        </div>
      </Card>

      {/* Tab Selectors */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 border border-slate-850 rounded-xl">
        <button
          onClick={() => setActiveTab('alertas')}
          className={`py-2 px-1 text-[11px] font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'alertas' 
              ? 'bg-slate-950 border border-slate-800 text-white shadow' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Alertas
        </button>
        <button
          onClick={() => setActiveTab('combustivel')}
          className={`py-2 px-1 text-[11px] font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'combustivel' 
              ? 'bg-slate-950 border border-slate-800 text-white shadow' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Fuel className="w-3.5 h-3.5 text-red-400" />
          Combustível
        </button>
        <button
          onClick={() => setActiveTab('manutencao')}
          className={`py-2 px-1 text-[11px] font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'manutencao' 
              ? 'bg-slate-950 border border-slate-800 text-white shadow' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-red-400" />
          Manutenção
        </button>
      </div>

      {/* ==================== SUB-VIEW: ALERTS & REMINDERS ==================== */}
      {activeTab === 'alertas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">
              LEMBRETES DE MANUTENÇÃO POR KM
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              Refletido em tempo real
            </span>
          </div>

          <div className="space-y-3">
            {maintAlerts.map(alert => {
              return (
                <Card 
                  key={alert.type} 
                  variant="outline" 
                  className={`p-4 transition-colors ${
                    alert.severity === 'danger' 
                      ? 'bg-rose-500/5 border-rose-500/20' 
                      : alert.severity === 'warning'
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-slate-900/10 border-slate-850'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-100">{alert.label}</span>
                        {alert.severity === 'danger' && (
                          <span className="text-[8px] bg-rose-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase font-mono animate-pulse">
                            VENCIDO
                          </span>
                        )}
                        {alert.severity === 'warning' && (
                          <span className="text-[8px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase font-mono">
                            ATENÇÃO
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono leading-none">{alert.description}</p>
                    </div>

                    <div className="text-right whitespace-nowrap shrink-0">
                      {alert.remainingKm <= 0 ? (
                        <span className="text-xs font-mono font-bold text-rose-400 block">
                          Atrasado {Math.abs(alert.remainingKm)} km
                        </span>
                      ) : (
                        <span className={`text-xs font-mono font-bold block ${alert.severity === 'warning' ? 'text-amber-400' : 'text-slate-300'}`}>
                          Faltam {alert.remainingKm.toLocaleString()} km
                        </span>
                      )}
                      <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                        Próxima: {alert.nextOdometer.toLocaleString()} km
                      </span>
                    </div>
                  </div>

                  {/* Visual Odometer timeline progress bar */}
                  <div className="mt-3.5 space-y-1">
                    <div className="w-full h-1.5 bg-slate-900 border border-slate-850 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          alert.severity === 'danger' 
                            ? 'bg-rose-500' 
                            : alert.severity === 'warning'
                            ? 'bg-amber-400'
                            : 'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, Math.max(0, (1 - (alert.remainingKm / alert.defaultInterval)) * 100))}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>Última: {alert.lastOdometer.toLocaleString()} km</span>
                      {alert.lastDate && (
                        <span>Feita em: {new Date(alert.lastDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  </div>

                  {/* Reset/Done shortcut action button */}
                  <div className="mt-3 pt-2.5 border-t border-slate-900 flex justify-end">
                    <button
                      onClick={() => handleOpenMaintModal(alert.type)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 ${
                        alert.severity === 'danger'
                          ? 'bg-rose-500 text-slate-950 font-black'
                          : alert.severity === 'warning'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700'
                      }`}
                    >
                      <Wrench className="w-3 h-3" /> Registrar {alert.label}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== SUB-VIEW: REFUELINGS ==================== */}
      {activeTab === 'combustivel' && (
        <div className="space-y-4">
          {/* Refueling stats dashboard */}
          <div className="grid grid-cols-3 gap-2">
            <Card variant="outline" className="p-2.5 bg-slate-900/10 border-slate-850 text-center space-y-1">
              <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">CUSTO MÉDIO</span>
              <span className="text-xs font-mono font-black text-slate-200 block">
                R$ {avgCostPerRefuel > 0 ? avgCostPerRefuel.toFixed(2).replace('.', ',') : '0,00'}
              </span>
              <span className="text-[7px] text-slate-500 font-mono block">Por Abastecimento</span>
            </Card>

            <Card variant="outline" className="p-2.5 bg-slate-900/10 border-slate-850 text-center space-y-1">
              <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">MÉDIA / LITRO</span>
              <span className="text-xs font-mono font-black text-slate-200 block">
                R$ {avgPricePerLiter > 0 ? avgPricePerLiter.toFixed(2).replace('.', ',') : '0,00'}
              </span>
              <span className="text-[7px] text-slate-500 font-mono block">Preço do Litro</span>
            </Card>

            <Card variant="outline" className="p-2.5 bg-slate-900/10 border-slate-850 text-center space-y-1">
              <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">CONSUMO</span>
              <span className="text-xs font-mono font-black text-red-400 block">
                {avgConsumption ? `${avgConsumption.toFixed(1)} km/L` : '---'}
              </span>
              <span className="text-[7px] text-slate-500 font-mono block">Médio Calculado</span>
            </Card>
          </div>

          {/* Quick Action Button */}
          <Button variant="danger" size="md" fullWidth onClick={handleOpenRefuelModal} className="text-xs py-2.5">
            <Plus className="w-4 h-4" /> Novo Abastecimento
          </Button>

          {/* History */}
          <div className="space-y-2.5">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">
              HISTÓRICO DE ABASTECIMENTOS
            </h3>

            {refuelings.length === 0 ? (
              <Card variant="outline" className="p-6 text-center border-dashed border-slate-850">
                <Fuel className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Nenhum abastecimento registrado</p>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {refuelings.map(refuel => {
                  const formattedDate = new Date(refuel.date + 'T12:00:00').toLocaleDateString('pt-BR');
                  const unitPrice = refuel.liters > 0 ? (refuel.amount / refuel.liters) : 0;

                  return (
                    <Card key={refuel.id} variant="outline" className="p-3 bg-slate-900/5 border-slate-850 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-200">
                            R$ {refuel.amount.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-950 border border-slate-900 px-1.5 py-0.5 rounded">
                            {refuel.liters.toFixed(2)}L
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-1.5">
                          {formattedDate} • Odômetro: {refuel.odometer.toLocaleString()} km
                        </p>
                        {refuel.notes && (
                          <p className="text-[9px] text-slate-500 italic mt-0.5 truncate max-w-xs">
                            "{refuel.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right font-mono whitespace-nowrap">
                          <span className="text-[10px] text-slate-400 block">R$ {unitPrice.toFixed(2)}/L</span>
                        </div>
                        <button
                          onClick={() => handleDeleteRefuel(refuel.id)}
                          className="p-1 rounded bg-slate-900 border border-slate-850 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Excluir"
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
        </div>
      )}

      {/* ==================== SUB-VIEW: MAINTENANCES ==================== */}
      {activeTab === 'manutencao' && (
        <div className="space-y-4">
          <Button variant="danger" size="md" fullWidth onClick={() => handleOpenMaintModal()} className="text-xs py-2.5">
            <Plus className="w-4 h-4" /> Registrar Nova Manutenção
          </Button>

          {/* History */}
          <div className="space-y-2.5">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">
              HISTÓRICO DE MANUTENÇÃO E REFORMAS
            </h3>

            {maintenances.length === 0 ? (
              <Card variant="outline" className="p-6 text-center border-dashed border-slate-850">
                <Wrench className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Nenhuma manutenção realizada ainda</p>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {maintenances.map(maint => {
                  const formattedDate = new Date(maint.date + 'T12:00:00').toLocaleDateString('pt-BR');

                  return (
                    <Card key={maint.id} variant="outline" className="p-3 bg-slate-900/5 border-slate-850 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-100">{maint.type}</span>
                          <span className="text-[10px] font-mono font-bold text-red-400">
                            R$ {maint.amount.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-1.5">
                          {formattedDate} • Feita com {maint.odometer.toLocaleString()} km
                        </p>
                        {maint.notes && (
                          <p className="text-[10px] text-slate-400 bg-slate-950/40 p-2 rounded border border-slate-900 leading-normal font-sans mt-2">
                            <strong className="text-slate-500 font-mono block text-[8px] uppercase">NOTAS DE SERVIÇO:</strong>
                            {maint.notes}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteMaint(maint.id)}
                        className="p-1 rounded bg-slate-900 border border-slate-850 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL: REFUELING FORM ==================== */}
      <AnimatePresence>
        {isRefuelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-slate-950 rounded-t-3xl border-t border-slate-800 p-6 space-y-4 pb-safe-bottom"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <h3 className="text-base font-black text-white">Registrar Abastecimento</h3>
                <button
                  onClick={() => setIsRefuelModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRefuel} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                      VALOR TOTAL (R$) *
                    </label>
                    <input
                      type="text"
                      value={refuelAmount}
                      onChange={(e) => setRefuelAmount(e.target.value)}
                      placeholder="Ex: 50,00"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                      LITROS ABASTECIDOS *
                    </label>
                    <input
                      type="text"
                      value={refuelLiters}
                      onChange={(e) => setRefuelLiters(e.target.value)}
                      placeholder="Ex: 8.520"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                      ODÔMETRO NO ATO (KM) *
                    </label>
                    <input
                      type="number"
                      value={refuelOdometer}
                      onChange={(e) => setRefuelOdometer(e.target.value)}
                      placeholder={`Ex: ${currentOdometer}`}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                      DATA *
                    </label>
                    <input
                      type="date"
                      value={refuelDate}
                      onChange={(e) => setRefuelDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    POSTO DE COMBUSTÍVEL / OBSERVAÇÃO
                  </label>
                  <input
                    type="text"
                    value={refuelNotes}
                    onChange={(e) => setRefuelNotes(e.target.value)}
                    placeholder="Ex: Posto Shell Av. Paulista, gasolina aditivada"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <Button variant="danger" size="lg" fullWidth type="submit" className="py-3 font-black tracking-wide mt-2">
                  <Check className="w-5 h-5" /> Salvar Abastecimento
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL: MAINTENANCE FORM ==================== */}
      <AnimatePresence>
        {isMaintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-slate-950 rounded-t-3xl border-t border-slate-800 p-6 space-y-4 pb-safe-bottom"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <h3 className="text-base font-black text-white">Registrar Manutenção</h3>
                <button
                  onClick={() => setIsMaintModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMaint} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    TIPO DE MANUTENÇÃO *
                  </label>
                  <select
                    value={maintType}
                    onChange={(e) => setMaintType(e.target.value as MaintenanceEntity['type'])}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none appearance-none"
                    required
                  >
                    <option value="Troca de óleo">Troca de óleo</option>
                    <option value="Pneus">Troca de pneus</option>
                    <option value="Pastilhas">Pastilhas de freio</option>
                    <option value="Relação">Kit Relação (Coroa/Pinhão/Corrente)</option>
                    <option value="Revisão">Revisão geral</option>
                    <option value="Outro">Outro serviço</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                      VALOR DO SERVIÇO (R$) *
                    </label>
                    <input
                      type="text"
                      value={maintAmount}
                      onChange={(e) => setMaintAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                      KM REALIZADA *
                    </label>
                    <input
                      type="number"
                      value={maintOdometer}
                      onChange={(e) => setMaintOdometer(e.target.value)}
                      placeholder={`Ex: ${currentOdometer}`}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    DATA DO SERVIÇO *
                  </label>
                  <input
                    type="date"
                    value={maintDate}
                    onChange={(e) => setMaintDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    DETALHES OU NOTAS (OPCIONAL)
                  </label>
                  <textarea
                    value={maintNotes}
                    onChange={(e) => setMaintNotes(e.target.value)}
                    placeholder="Ex: Óleo Mobil, pastilhas Cobreq traseiras, ajustado folga..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none resize-none"
                  />
                </div>

                <Button variant="danger" size="lg" fullWidth type="submit" className="py-3 font-black tracking-wide mt-2">
                  <Check className="w-5 h-5" /> Salvar Manutenção
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
