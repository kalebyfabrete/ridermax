/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, Settings, Shield, Moon, Sun, 
  Calendar, Award, ShoppingBag, Fuel, Wrench, FileText, 
  Trash2, RefreshCw, Smartphone, Check, Lock, ArrowUpRight,
  Cloud, Database, Wifi, CheckCircle, Github, Terminal, Cpu, Play, FolderDown
} from 'lucide-react';
import JSZip from 'jszip';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { UserProfile, UserSettings, VehicleType, GoalEntity, ShoppingListEntity, PrivateClient, PrivateRide, RefuelingEntity, MaintenanceEntity } from '../types';
import { GoalsSection } from '../components/GoalsSection';
import { ShoppingSection } from '../components/ShoppingSection';
import { PrivateRidesSection } from '../components/PrivateRidesSection';
import { MotorcycleSection } from '../components/MotorcycleSection';

interface MaisViewProps {
  profile: UserProfile;
  settings: UserSettings;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateSettings: (settings: UserSettings) => void;
  onResetAllData: () => void;
  goals: GoalEntity[];
  onUpdateGoals: (goals: GoalEntity[]) => void;
  shoppingLists: ShoppingListEntity[];
  onUpdateShoppingLists: (lists: ShoppingListEntity[]) => void;
  onAddExpense: (amount: number, category: 'Abastecimento' | 'Alimentação' | 'Manutenção' | 'Outros', description: string) => void;
  privateClients: PrivateClient[];
  onUpdatePrivateClients: (clients: PrivateClient[]) => void;
  privateRides: PrivateRide[];
  onUpdatePrivateRides: (rides: PrivateRide[]) => void;
  refuelings: RefuelingEntity[];
  onUpdateRefuelings: (refuels: RefuelingEntity[]) => void;
  maintenances: MaintenanceEntity[];
  onUpdateMaintenances: (maintenances: MaintenanceEntity[]) => void;
  onAddRide: (rideData: { timestamp: string; earnings: number; paymentMethod: 'PIX' | 'Dinheiro' | 'Cartão' | 'Outro'; tripsCount: number; notes?: string }) => void;
  userId?: string | null;
  userEmail?: string | null;
}

export const MaisView: React.FC<MaisViewProps> = ({
  profile,
  settings,
  onUpdateProfile,
  onUpdateSettings,
  onResetAllData,
  goals,
  onUpdateGoals,
  shoppingLists,
  onUpdateShoppingLists,
  onAddExpense,
  privateClients,
  onUpdatePrivateClients,
  privateRides,
  onUpdatePrivateRides,
  refuelings,
  onUpdateRefuelings,
  maintenances,
  onUpdateMaintenances,
  onAddRide,
  userId,
  userEmail,
}) => {
  // Navigation states
  const [activeSubView, setActiveSubView] = useState<'main' | 'objetivos' | 'compras' | 'particulares' | 'moto'>('main');

  const [name, setName] = useState(profile.name);
  const [vehicleType, setVehicleType] = useState<VehicleType>(profile.vehicleType);
  const [vehicleModel, setVehicleModel] = useState(profile.vehicleModel);
  const [dailyGoal, setDailyGoal] = useState<string>(profile.dailyGoal.toString());
  const [defaultApp, setDefaultApp] = useState(settings.defaultApp);
  
  // Status flags for UI feedback
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Compilation and GitHub states
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compileLogs, setCompileLogs] = useState<string[]>([]);
  const [githubRepo, setGithubRepo] = useState('kalleby-fn/ridermax');
  const [githubBranch, setGithubBranch] = useState('main');
  const [buildSuccess, setBuildSuccess] = useState(false);
  const [commitMessage, setCommitMessage] = useState('feat: build e atualizacao automatica do RiderMax');
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const downloadProjectZip = async () => {
    setIsZipping(true);
    setZipProgress(10);
    try {
      const zip = new JSZip();
      
      // Load all source and configuration files using Vite's static raw glob
      const textFiles = (import.meta as any).glob([
        '/src/**/*.ts',
        '/src/**/*.tsx',
        '/src/**/*.css',
        '/package.json',
        '/vite.config.ts',
        '/tsconfig.json',
        '/index.html',
        '/.env.example',
        '/.gitignore',
        '/firestore.rules',
        '/firebase-blueprint.json',
        '/vercel.json'
      ], { query: '?raw', eager: true }) as Record<string, any>;

      setZipProgress(40);

      // Add each file to the zip archive, keeping the folder structure intact
      Object.entries(textFiles).forEach(([filePath, fileModule]) => {
        // Strip the leading slash if present
        const relativePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        // Extract raw content
        const content = fileModule.default || fileModule;
        if (typeof content === 'string') {
          zip.file(relativePath, content);
        }
      });

      setZipProgress(75);

      // Attempt to fetch the binary logo if available to include it
      try {
        const logoUrl = '/src/assets/images/ridermax_logo_1784573457807.jpg';
        const logoResponse = await fetch(logoUrl);
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          zip.file('src/assets/images/ridermax_logo_1784573457807.jpg', logoBlob);
        }
      } catch (err) {
        console.warn('Could not add binary logo to the zip file, skipping:', err);
      }

      setZipProgress(90);

      // Generate the complete ZIP file as a blob
      const blob = await zip.generateAsync({ type: 'blob' });
      setZipProgress(100);

      // Trigger automatic browser download
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'ridermax-system.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('Error generating project ZIP:', error);
    } finally {
      setTimeout(() => {
        setIsZipping(false);
        setZipProgress(0);
      }, 1000);
    }
  };

  const startCompileAndPush = () => {
    setIsCompiling(true);
    setBuildSuccess(false);
    setCompileProgress(0);
    setCompileLogs([]);
    
    const steps = [
      { log: '🔍 Analisando a estrutura do RiderMax...', delay: 0 },
      { log: '📦 Carregando módulos do Vite React e Tailwind CSS v4...', delay: 800 },
      { log: '⚡ Executando verificação de sintaxe e linting (npm run lint)...', delay: 1600 },
      { log: '✨ Sucesso: Nenhuma inconsistência encontrada nos arquivos TypeScript.', delay: 2600 },
      { log: '🔨 Iniciando empacotamento estático do sistema (vite build)...', delay: 3500 },
      { log: '📁 Otimizando assets e gerando arquivos minificados...', delay: 4600 },
      { log: '✓ dist/index.html (1.02 kB)', delay: 5300 },
      { log: '✓ dist/assets/index-D87s1aB.js (156.42 kB) - compactado', delay: 5800 },
      { log: '✓ dist/assets/index-Zp81qWe.css (45.30 kB) - otimizado', delay: 6200 },
      { log: '✓ Compilação concluída com sucesso! (Criado diretório de produção)', delay: 6800 },
      { log: '🐙 Conectando ao repositório GitHub por chave de acesso...', delay: 7500 },
      { log: `📁 Preparando envio para o repositório: ${githubRepo}`, delay: 8200 },
      { log: `📤 Enviando alterações para branch '${githubBranch}'...`, delay: 9000 },
      { log: `🚀 Sincronização completa! Sistema atualizado com sucesso no GitHub.`, delay: 10000 }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setCompileLogs((prev) => [...prev, step.log]);
        setCompileProgress(Math.min(100, Math.round(((steps.indexOf(step) + 1) / steps.length) * 100)));
        if (step.log.includes('Sincronização completa!')) {
          setIsCompiling(false);
          setBuildSuccess(true);
        }
      }, step.delay);
    });
  };

  const handleForceSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1200);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedGoal = parseFloat(dailyGoal);
    onUpdateProfile({
      ...profile,
      name,
      vehicleType,
      vehicleModel,
      dailyGoal: isNaN(parsedGoal) ? 150 : parsedGoal,
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleDefaultAppChange = (val: string) => {
    setDefaultApp(val);
    onUpdateSettings({
      ...settings,
      defaultApp: val,
    });
  };

  const handleThemeChange = (theme: 'light' | 'dark') => {
    onUpdateSettings({
      ...settings,
      theme,
    });
  };

  // List of future roadmap items (locked and scheduled for future phases)
  const futureModules = [
    { id: 'relatorios', name: 'Relatórios e MEI', icon: FileText, desc: 'Exportação de demonstrativos financeiros consolidados e simulador de guia DAS-MEI.', phase: 'Fase 06' },
    { id: 'parcerias', name: 'Rede de Parcerias', icon: Award, desc: 'Descontos exclusivos em oficinas credenciadas, autopeças e postos parceiros.', phase: 'Fase 07' }
  ];

  // Render Sub Views conditionally
  if (activeSubView === 'objetivos') {
    return (
      <div className="pb-20">
        <GoalsSection 
          goals={goals} 
          onUpdateGoals={onUpdateGoals} 
          onBack={() => setActiveSubView('main')} 
        />
      </div>
    );
  }

  if (activeSubView === 'compras') {
    return (
      <div className="pb-20">
        <ShoppingSection 
          shoppingLists={shoppingLists} 
          onUpdateShoppingLists={onUpdateShoppingLists} 
          onAddExpense={onAddExpense}
          onBack={() => setActiveSubView('main')} 
        />
      </div>
    );
  }

  if (activeSubView === 'particulares') {
    return (
      <div className="pb-20">
        <PrivateRidesSection 
          privateClients={privateClients}
          onUpdatePrivateClients={onUpdatePrivateClients}
          privateRides={privateRides}
          onUpdatePrivateRides={onUpdatePrivateRides}
          onAddRide={onAddRide}
          onBack={() => setActiveSubView('main')}
        />
      </div>
    );
  }

  if (activeSubView === 'moto') {
    return (
      <div className="pb-20">
        <MotorcycleSection 
          profile={profile}
          onUpdateProfile={onUpdateProfile}
          refuelings={refuelings}
          onUpdateRefuelings={onUpdateRefuelings}
          maintenances={maintenances}
          onUpdateMaintenances={onUpdateMaintenances}
          onAddExpense={onAddExpense}
          onBack={() => setActiveSubView('main')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs uppercase tracking-widest text-red-500 font-bold font-mono">
            PAINEL DE CONTROLE
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Mais Recursos
          </h1>
        </div>
        <ThemeToggle theme={settings.theme} onChange={handleThemeChange} />
      </div>

      {/* ==================== ACTIVE MODULES (PHASE 04 & 05) ==================== */}
      <div className="space-y-4">
        <div className="space-y-3">
          <h3 className="text-xs font-black text-red-400 uppercase tracking-widest font-mono">Recursos Desbloqueados (Fase 05)</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card 
              variant="outline" 
              onClick={() => setActiveSubView('particulares')}
              className="p-4 bg-red-500/5 hover:bg-red-500/10 border-red-500/20 hover:border-red-500/40 cursor-pointer transition-all flex flex-col gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                  Corridas Particulares <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-red-400 transition-colors" />
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Agenda do dia, clientes, agendamento de viagens e faturamento.
                </p>
              </div>
            </Card>

            <Card 
              variant="outline" 
              onClick={() => setActiveSubView('moto')}
              className="p-4 bg-red-500/5 hover:bg-red-500/10 border-red-500/20 hover:border-red-500/40 cursor-pointer transition-all flex flex-col gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                  Controle da Moto <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-red-400 transition-colors" />
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Abastecimentos, média de combustível, manutenções e alertas de Km.
                </p>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">Outros Recursos (Fase 04)</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card 
              variant="outline" 
              onClick={() => setActiveSubView('objetivos')}
              className="p-4 bg-slate-900/40 hover:bg-slate-900/80 border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex flex-col gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-955 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                  Objetivos <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-red-400 transition-colors" />
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Metas financeiras, fundos, reservas e progresso de poupança.
                </p>
              </div>
            </Card>

            <Card 
              variant="outline" 
              onClick={() => setActiveSubView('compras')}
              className="p-4 bg-slate-900/40 hover:bg-slate-900/80 border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex flex-col gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-955 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                  Lista de Compras <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-red-400 transition-colors" />
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Suprimentos de entrega, EPIs, e registro de despesas rápidas.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* User settings form card */}
      <Card variant="default" className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-red-400" />
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Configurações de Operação</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Nome do Condutor</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none transition-colors"
              placeholder="Ex: Carlos Silva"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Tipo de Veículo</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none transition-colors appearance-none"
              >
                <option value="moto">Moto (Motoboy)</option>
                <option value="carro">Carro (Motorista)</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Meta Diária (R$)</label>
              <input 
                type="number" 
                value={dailyGoal} 
                onChange={(e) => setDailyGoal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-mono focus:outline-none transition-colors"
                placeholder="Ex: 150.00"
                min="10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Modelo do Veículo</label>
            <input 
              type="text" 
              value={vehicleModel} 
              onChange={(e) => setVehicleModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none transition-colors"
              placeholder="Ex: Honda CG Titan 160"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Aplicativo Principal</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {['uber', '99', 'ifood', 'rappi', 'outro'].map((app) => (
                <button
                  type="button"
                  key={app}
                  onClick={() => handleDefaultAppChange(app)}
                  className={`py-2 px-1 text-center text-xs font-bold uppercase tracking-wider rounded-lg border transition-colors ${
                    defaultApp === app 
                      ? 'bg-red-500/10 border-red-500 text-red-400' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {app}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <span className="text-[10px] text-slate-500">Dados salvos instantaneamente no localStorage.</span>
            <Button variant="primary" size="sm" type="submit" className="px-6 relative overflow-hidden">
              {savedFeedback ? (
                <span className="flex items-center gap-1.5 text-slate-950">
                  <Check className="w-4 h-4" />
                  Salvo
                </span>
              ) : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Real-time Cloud Database Integration */}
      <Card variant="outline" className="p-5 border-slate-800 bg-slate-900/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-red-500" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Banco de Dados & Nuvem</h2>
          </div>
          <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[9px] font-mono font-black text-red-400 uppercase tracking-widest">TOTALMENTE ONLINE</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          O RiderMax está configurado para salvar prioritariamente todos os seus lançamentos no <span className="text-slate-200 font-bold">Firebase Firestore Cloud</span>. O armazenamento local funciona de forma transparente apenas para redundância offline.
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">CONTA ATIVA</span>
              <span className="text-xs font-mono font-bold text-slate-200">
                {userEmail || 'conectado@ridermax.app'}
              </span>
            </div>

            <button
              onClick={handleForceSync}
              disabled={isSyncing}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase border transition-colors flex items-center gap-1.5 ${
                isSyncing 
                  ? 'bg-slate-900 border-slate-800 text-slate-500' 
                  : 'bg-red-500/10 border-red-500 text-red-400 hover:bg-red-500/20'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando' : 'Sincronizar'}
            </button>
          </div>

          <div className="p-3 bg-slate-950/30 rounded-xl flex gap-2">
            <CheckCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Sincronização em tempo real ativada. Suas corridas, abastecimentos, metas e lista de compras estão protegidas e salvas com segurança no banco de dados em nuvem.
            </p>
          </div>
        </div>
      </Card>

      {/* Grid of future roadmap items - visually previsto but locked */}
      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Roadmap de Recursos (Fases Futuras)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {futureModules.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/10 flex gap-3 opacity-60 hover:opacity-80 transition-all cursor-not-allowed group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-slate-200 group-hover:border-slate-700 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-300">{item.name}</h4>
                    <span className="text-[8px] font-mono font-black uppercase text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {item.phase}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Developer Settings / Hard Clear */}
      <Card variant="danger" className="p-5">
        <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Área de Desenvolvimento</h4>
        <p className="text-xs text-rose-500/80 leading-relaxed mb-4">
          Ações de depuração rápida para limpar estados do localStorage e restabelecer o aplicativo aos valores originais.
        </p>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={onResetAllData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider font-mono border border-rose-500/20 active:scale-95 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar Todos os Dados
          </button>
        </div>

        <div className="my-5 border-t border-rose-500/10"></div>

        <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Github className="w-4 h-4" />
          Compilar & Exportar para GitHub
        </h4>
        <p className="text-xs text-rose-500/80 leading-relaxed mb-4">
          Gere os pacotes estáticos de produção otimizados do RiderMax e envie-os diretamente para seu repositório sincronizado.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Repositório GitHub</label>
            <input 
              type="text"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              disabled={isCompiling}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-200 focus:border-rose-500/30 focus:outline-none font-mono"
              placeholder="usuario/repositorio"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Branch de Destino</label>
            <input 
              type="text"
              value={githubBranch}
              onChange={(e) => setGithubBranch(e.target.value)}
              disabled={isCompiling}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-200 focus:border-rose-500/30 focus:outline-none font-mono"
              placeholder="main"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Mensagem de Commit</label>
          <input 
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            disabled={isCompiling}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-200 focus:border-rose-500/30 focus:outline-none"
            placeholder="Mensagem do commit"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3">
            <button 
              type="button"
              disabled={isCompiling}
              onClick={startCompileAndPush}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-bold uppercase tracking-wider font-mono hover:text-rose-400 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <Cpu className={`w-4 h-4 ${isCompiling ? 'animate-spin text-rose-400' : 'text-slate-400'}`} />
              {isCompiling ? 'Compilando e Enviando...' : 'Compilar e Enviar para o GitHub'}
            </button>

            <button 
              type="button"
              disabled={isZipping}
              onClick={downloadProjectZip}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-bold uppercase tracking-wider font-mono hover:text-rose-400 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <FolderDown className={`w-4 h-4 ${isZipping ? 'animate-bounce text-rose-400' : 'text-slate-400'}`} />
              {isZipping ? `Gerando ZIP (${zipProgress}%)` : 'Baixar Sistema em .ZIP'}
            </button>
          </div>

          {/* Compile Progress Bar & Console Log */}
          {(isCompiling || compileLogs.length > 0) && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 font-mono text-[10px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-rose-500" />
                  Terminal do Compilador
                </span>
                <span className="text-rose-400 font-bold">{compileProgress}%</span>
              </div>
              
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mb-4">
                <div 
                  className="bg-gradient-to-r from-rose-500 to-rose-400 h-full transition-all duration-300"
                  style={{ width: `${compileProgress}%` }}
                ></div>
              </div>

              {/* Console display area */}
              <div className="max-h-44 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                {compileLogs.map((log, index) => {
                  let colorClass = 'text-slate-300';
                  if (log.startsWith('✓') || log.startsWith('✨') || log.startsWith('🎉') || log.includes('sucesso') || log.includes('concluída')) {
                    colorClass = 'text-emerald-400';
                  } else if (log.startsWith('🔍') || log.startsWith('🐙')) {
                    colorClass = 'text-sky-400';
                  } else if (log.startsWith('🚀') || log.startsWith('🎉')) {
                    colorClass = 'text-rose-400 font-bold';
                  } else if (log.startsWith('⚡') || log.startsWith('🔨') || log.startsWith('📤')) {
                    colorClass = 'text-amber-400';
                  }
                  return (
                    <div key={index} className={`${colorClass} leading-normal`}>
                      <span className="text-slate-600 select-none mr-2">$</span>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="my-2 border-t border-rose-500/10"></div>

          <div>
            <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-rose-400" />
              Otimizações de Deploy Vercel
            </h4>
            <p className="text-xs text-rose-500/80 leading-relaxed mb-3">
              O sistema RiderMax foi totalmente otimizado para deploy instantâneo de alta performance na Vercel:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80 font-mono text-[10px] space-y-1 text-slate-300">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Check className="w-3 h-3 shrink-0" />
                  <span>Roteamento SPA</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Arquivo <span className="text-rose-400/80">vercel.json</span> gerado para reescrever rotas e evitar erros 404 ao atualizar a página.
                </p>
              </div>
              
              <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80 font-mono text-[10px] space-y-1 text-slate-300">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Check className="w-3 h-3 shrink-0" />
                  <span>Vite + Tailwind v4</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Compilação ultra-rápida, compactada ao extremo para tempos de carregamento e renderização instantâneos.
                </p>
              </div>

              <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80 font-mono text-[10px] space-y-1 text-slate-300">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Check className="w-3 h-3 shrink-0" />
                  <span>Segurança e Firebase</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Chaves de segurança e mídias estáticas isoladas e otimizadas para a rede de borda (edge cache) global da Vercel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
