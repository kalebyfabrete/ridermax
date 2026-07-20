/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { storageService } from './services/storage';
import { authService } from './services/authService';
import { auth } from './services/firebase';
import { firebaseService } from './services/firebaseService';
import { AuthScreen } from './components/AuthScreen';
import { TabId, TabNavigation } from './components/TabNavigation';
import { DashboardView } from './views/DashboardView';
import { RidesView } from './views/RidesView';
import { FinanceView } from './views/FinanceView';
import { MaisView } from './views/MaisView';
import { 
  UserProfile, UserSettings, ActiveShift, RideEntity, QuickExpense, 
  ExpenseLimit, GoalEntity, ShoppingListEntity, PrivateClient, 
  PrivateRide, RefuelingEntity, MaintenanceEntity, PixCategory, 
  PixDistribution, PixDistributionItem 
} from './types';
import { Shield, Smartphone, ArrowRight, Compass, LogOut, Wifi, Database, RefreshCw } from 'lucide-react';

const isToday = (dateStr?: string) => {
  if (!dateStr) return false;
  try {
    const itemDate = dateStr.split('T')[0];
    const todayDate = new Date().toISOString().split('T')[0];
    return itemDate === todayDate;
  } catch {
    return false;
  }
};

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<TabId>('inicio');

  // Firebase Auth states
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'syncing'>('offline');
  const [isHistoryLoaded, setIsHistoryLoaded] = useState<boolean>(false);

  // Operational states loaded from storage
  const [profile, setProfile] = useState<UserProfile>(storageService.getProfile());
  const [settings, setSettings] = useState<UserSettings>(storageService.getSettings());
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(storageService.getActiveShift());
  
  // Lazy load: initially only load today's items to maximize initial startup speed
  const [rides, setRides] = useState<RideEntity[]>(() => {
    const all = storageService.getRides();
    return all.filter((r) => isToday(r.timestamp));
  });
  const [expenses, setExpenses] = useState<QuickExpense[]>(() => {
    const all = storageService.getExpenses();
    return all.filter((e) => isToday(e.timestamp));
  });

  const [initialCash, setInitialCash] = useState<number>(() => storageService.getInitialCash());
  const [expenseLimits, setExpenseLimits] = useState<ExpenseLimit[]>(() => storageService.getExpenseLimits());

  const [goals, setGoals] = useState<GoalEntity[]>(() => storageService.getGoals());
  const [shoppingLists, setShoppingLists] = useState<ShoppingListEntity[]>(() => storageService.getShoppingLists());

  const [privateClients, setPrivateClients] = useState<PrivateClient[]>(() => storageService.getPrivateClients());
  const [privateRides, setPrivateRides] = useState<PrivateRide[]>(() => storageService.getPrivateRides());
  const [refuelings, setRefuelings] = useState<RefuelingEntity[]>(() => storageService.getRefuelings());
  const [maintenances, setMaintenances] = useState<MaintenanceEntity[]>(() => storageService.getMaintenances());

  // PIX states
  const [pixCategories, setPixCategories] = useState<PixCategory[]>(() => storageService.getPixCategories());
  const [pixDistributions, setPixDistributions] = useState<PixDistribution[]>(() => storageService.getPixDistributions());

  // Apply Theme effects (Dark/Light Mode) dynamically
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      body.className = 'bg-slate-950 text-slate-100 select-none overflow-x-hidden transition-colors duration-300';
      document.getElementById('meta-theme-color')?.setAttribute('content', '#090a0f');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      body.className = 'bg-slate-50 text-slate-900 select-none overflow-x-hidden transition-colors duration-300';
      document.getElementById('meta-theme-color')?.setAttribute('content', '#f8fafc');
    }
  }, [settings.theme]);

  // Firebase Auth & Real-time onSnapshot Synchronization
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        setConnectionStatus('syncing');

        if (unsubscribeSnapshot) unsubscribeSnapshot();

        unsubscribeSnapshot = firebaseService.subscribeToUserData(
          user.uid,
          (cloudData) => {
            setConnectionStatus('online');
            if (cloudData) {
              if (cloudData.profile) setProfile(cloudData.profile);
              if (cloudData.settings) setSettings(cloudData.settings);
              if (cloudData.activeShift !== undefined) setActiveShift(cloudData.activeShift);
              
              if (cloudData.rides) {
                storageService.saveRides(cloudData.rides);
                if (isHistoryLoaded) {
                  setRides(cloudData.rides);
                } else {
                  setRides(cloudData.rides.filter((r: any) => isToday(r.timestamp)));
                }
              }

              if (cloudData.expenses) {
                storageService.saveExpenses(cloudData.expenses);
                if (isHistoryLoaded) {
                  setExpenses(cloudData.expenses);
                } else {
                  setExpenses(cloudData.expenses.filter((e: any) => isToday(e.timestamp)));
                }
              }

              if (cloudData.initialCash !== undefined) setInitialCash(cloudData.initialCash);
              if (cloudData.expenseLimits) setExpenseLimits(cloudData.expenseLimits);
              if (cloudData.goals) setGoals(cloudData.goals);
              if (cloudData.shoppingLists) setShoppingLists(cloudData.shoppingLists);
              if (cloudData.privateClients) setPrivateClients(cloudData.privateClients);
              if (cloudData.privateRides) setPrivateRides(cloudData.privateRides);
              if (cloudData.refuelings) setRefuelings(cloudData.refuelings);
              if (cloudData.maintenances) setMaintenances(cloudData.maintenances);
              if (cloudData.pixCategories) setPixCategories(cloudData.pixCategories);
              if (cloudData.pixDistributions) setPixDistributions(cloudData.pixDistributions);
            } else {
              // No cloud data yet, back up existing local storage data to the Cloud!
              const initialCloudData = {
                profile,
                settings,
                activeShift,
                rides: storageService.getRides(),
                expenses: storageService.getExpenses(),
                initialCash,
                expenseLimits,
                goals,
                shoppingLists,
                privateClients,
                privateRides,
                refuelings,
                maintenances,
                pixCategories,
                pixDistributions
              };
              firebaseService.saveAllUserData(user.uid, initialCloudData);
            }
          },
          (err) => {
            console.error('Snapshot subscription error:', err);
            setConnectionStatus('offline');
          }
        );
      } else {
        setUserId(null);
        setConnectionStatus('offline');
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [isHistoryLoaded]);

  // Monitor browser online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (userId) {
        setConnectionStatus('syncing');
      } else {
        setConnectionStatus('offline');
      }
    };
    const handleOffline = () => {
      setConnectionStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId]);

  // Automatically trigger lazy loading of history when entering history/reports/more tabs
  useEffect(() => {
    if ((activeTab === 'corridas' || activeTab === 'financeiro' || activeTab === 'mais') && !isHistoryLoaded) {
      setIsHistoryLoaded(true);
      const fullRides = storageService.getRides();
      const fullExpenses = storageService.getExpenses();
      setRides(fullRides);
      setExpenses(fullExpenses);
    }
  }, [activeTab, isHistoryLoaded]);

  // Save changes to Firestore on any state updates
  useEffect(() => {
    if (!userId) return;

    // Use full historical arrays from localStorage if they aren't fully loaded in state yet,
    // to avoid overwriting the cloud's history with just today's entries!
    const dataToSave = {
      profile,
      settings,
      activeShift,
      rides: isHistoryLoaded ? rides : storageService.getRides(),
      expenses: isHistoryLoaded ? expenses : storageService.getExpenses(),
      initialCash,
      expenseLimits,
      goals,
      shoppingLists,
      privateClients,
      privateRides,
      refuelings,
      maintenances,
      pixCategories,
      pixDistributions
    };

    const timer = setTimeout(() => {
      setConnectionStatus('syncing');
      firebaseService.saveAllUserData(userId, dataToSave)
        .then(() => setConnectionStatus('online'))
        .catch(() => setConnectionStatus('offline'));
    }, 1500); // slight debounce

    return () => clearTimeout(timer);
  }, [
    userId, profile, settings, activeShift, rides, expenses, initialCash,
    expenseLimits, goals, shoppingLists, privateClients, privateRides,
    refuelings, maintenances, pixCategories, pixDistributions, isHistoryLoaded
  ]);

  // Operational shifts actions
  const startShift = () => {
    const newShift: ActiveShift = {
      id: `shf_${Date.now()}`,
      startTime: new Date().toISOString(),
      totalEarnings: 0,
      totalDistance: 0,
      totalTrips: 0,
      isPaused: false,
    };
    setActiveShift(newShift);
    storageService.saveActiveShift(newShift);
  };

  const endShift = () => {
    if (activeShift) {
      setActiveShift(null);
      storageService.saveActiveShift(null);
    }
  };

  const addRide = (rideData: Omit<RideEntity, 'id' | 'shiftId' | 'status' | 'app' | 'distance' | 'durationMinutes'>) => {
    const newRide: RideEntity = {
      ...rideData,
      id: `rid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      shiftId: activeShift?.id || 'daily',
      status: 'completed',
      app: settings.defaultApp || 'outro',
      distance: 0,
      durationMinutes: 0,
    };
    
    // Save to full list in localStorage first to keep integrity
    const fullRides = storageService.getRides();
    const updatedFull = [newRide, ...fullRides];
    storageService.saveRides(updatedFull);

    // Update active visible rides list
    setRides(prev => [newRide, ...prev]);

    // Auto PIX Intelligent Distribution
    if (rideData.paymentMethod === 'PIX' && pixCategories.length > 0) {
      const distributionsList: PixDistributionItem[] = pixCategories.map(cat => ({
        categoryName: cat.name,
        percentage: cat.percentage,
        amount: Number(((rideData.earnings * cat.percentage) / 100).toFixed(2))
      }));
      const newDist: PixDistribution = {
        id: `pix_dist_${Date.now()}`,
        rideId: newRide.id,
        rideAmount: newRide.earnings,
        timestamp: newRide.timestamp,
        distributions: distributionsList
      };
      const updatedDists = [newDist, ...pixDistributions];
      setPixDistributions(updatedDists);
      storageService.savePixDistributions(updatedDists);
    }

    // Also update current activeShift totals if shift is active!
    if (activeShift) {
      const updatedShift: ActiveShift = {
        ...activeShift,
        totalEarnings: Number((activeShift.totalEarnings + rideData.earnings).toFixed(2)),
        totalTrips: activeShift.totalTrips + rideData.tripsCount,
      };
      setActiveShift(updatedShift);
      storageService.saveActiveShift(updatedShift);
    }
  };

  const editRide = (id: string, updatedFields: Partial<RideEntity>) => {
    const fullRides = storageService.getRides();
    const updatedFull = fullRides.map(r => r.id === id ? { ...r, ...updatedFields } : r);
    storageService.saveRides(updatedFull);

    setRides(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));

    // Recalculate active shift totals if shift is active
    if (activeShift) {
      const activeShiftRides = updatedFull.filter(r => r.shiftId === activeShift.id);
      const totalEarnings = activeShiftRides.reduce((acc, r) => acc + r.earnings, 0);
      const totalTrips = activeShiftRides.reduce((acc, r) => acc + r.tripsCount, 0);
      const updatedShift: ActiveShift = {
        ...activeShift,
        totalEarnings: Number(totalEarnings.toFixed(2)),
        totalTrips,
      };
      setActiveShift(updatedShift);
      storageService.saveActiveShift(updatedShift);
    }
  };

  const deleteRide = (id: string) => {
    const fullRides = storageService.getRides();
    const updatedFull = fullRides.filter(r => r.id !== id);
    storageService.saveRides(updatedFull);

    setRides(prev => prev.filter(r => r.id !== id));

    // Filter out any PIX distribution associated with the deleted ride
    const filteredDists = pixDistributions.filter(d => d.rideId !== id);
    setPixDistributions(filteredDists);
    storageService.savePixDistributions(filteredDists);

    // Recalculate active shift totals if shift is active
    if (activeShift) {
      const activeShiftRides = updatedFull.filter(r => r.shiftId === activeShift.id);
      const totalEarnings = activeShiftRides.reduce((acc, r) => acc + r.earnings, 0);
      const totalTrips = activeShiftRides.reduce((acc, r) => acc + r.tripsCount, 0);
      const updatedShift: ActiveShift = {
        ...activeShift,
        totalEarnings: Number(totalEarnings.toFixed(2)),
        totalTrips,
      };
      setActiveShift(updatedShift);
      storageService.saveActiveShift(updatedShift);
    }
  };

  const addExpense = (amount: number, category: 'Abastecimento' | 'Alimentação' | 'Manutenção' | 'Outros', description: string) => {
    const newExpense: QuickExpense = {
      id: `exp_${Date.now()}`,
      amount: Number(amount.toFixed(2)),
      category,
      timestamp: new Date().toISOString(),
      description: description || 'Gasto Operacional',
    };
    const fullExpenses = storageService.getExpenses();
    const updatedFull = [newExpense, ...fullExpenses];
    storageService.saveExpenses(updatedFull);

    setExpenses(prev => [newExpense, ...prev]);
  };

  const editExpense = (id: string, updatedFields: Partial<QuickExpense>) => {
    const fullExpenses = storageService.getExpenses();
    const updatedFull = fullExpenses.map(e => e.id === id ? { ...e, ...updatedFields } : e);
    storageService.saveExpenses(updatedFull);

    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updatedFields } : e));
  };

  const deleteExpense = (id: string) => {
    const fullExpenses = storageService.getExpenses();
    const updatedFull = fullExpenses.filter(e => e.id !== id);
    storageService.saveExpenses(updatedFull);

    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const updateInitialCash = (amount: number) => {
    setInitialCash(amount);
    storageService.saveInitialCash(amount);
  };

  const updateExpenseLimits = (limits: ExpenseLimit[]) => {
    setExpenseLimits(limits);
    storageService.saveExpenseLimits(limits);
  };

  const updateGoals = (updatedGoals: GoalEntity[]) => {
    setGoals(updatedGoals);
    storageService.saveGoals(updatedGoals);
  };

  const updateShoppingLists = (updatedLists: ShoppingListEntity[]) => {
    setShoppingLists(updatedLists);
    storageService.saveShoppingLists(updatedLists);
  };

  const updatePrivateClients = (updatedClients: PrivateClient[]) => {
    setPrivateClients(updatedClients);
    storageService.savePrivateClients(updatedClients);
  };

  const updatePrivateRides = (updatedRides: PrivateRide[]) => {
    setPrivateRides(updatedRides);
    storageService.savePrivateRides(updatedRides);
  };

  const updateRefuelings = (updatedRefuelings: RefuelingEntity[]) => {
    setRefuelings(updatedRefuelings);
    storageService.saveRefuelings(updatedRefuelings);
  };

  const updateMaintenances = (updatedMaintenances: MaintenanceEntity[]) => {
    setMaintenances(updatedMaintenances);
    storageService.saveMaintenances(updatedMaintenances);
  };

  // Profile configuration updates
  const updateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    storageService.saveProfile(updatedProfile);
  };

  // System settings updates
  const updateSettings = (updatedSettings: UserSettings) => {
    setSettings(updatedSettings);
    storageService.saveSettings(updatedSettings);
  };

  // Hard Reset Developer Action
  const resetAllData = () => {
    if (window.confirm('Tem certeza de que deseja apagar todos os dados e restaurar as configurações originais?')) {
      storageService.clearAll();
      setProfile(storageService.getProfile());
      setSettings(storageService.getSettings());
      setActiveShift(null);
      setRides([]);
      setExpenses([]);
      setInitialCash(0);
      setExpenseLimits(storageService.getExpenseLimits());
      setGoals(storageService.getGoals());
      setShoppingLists(storageService.getShoppingLists());
      setPrivateClients(storageService.getPrivateClients());
      setPrivateRides(storageService.getPrivateRides());
      setRefuelings(storageService.getRefuelings());
      setMaintenances(storageService.getMaintenances());
      setActiveTab('inicio');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Tem certeza de que deseja desconectar de sua conta?')) {
      await auth.signOut();
      setUserId(null);
    }
  };

  const handleUpdatePixCategories = (newCats: PixCategory[]) => {
    setPixCategories(newCats);
    storageService.savePixCategories(newCats);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono font-black text-slate-400 uppercase tracking-widest">Carregando Painel RiderMax...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <AuthScreen 
        onAuthSuccess={(uid, email, name) => {
          setUserId(uid);
          if (name) {
            const updatedProfile = { ...profile, name };
            setProfile(updatedProfile);
            storageService.saveProfile(updatedProfile);
          }
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Top Banner App Logo */}
      <header className="sticky top-0 z-40 bg-slate-950/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-900/60 transition-colors duration-300">
        <div className="max-w-md mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center font-black text-slate-950 text-base shadow-md shadow-red-500/10">
              R
            </div>
            <div>
              <span className="font-sans font-black text-slate-100 tracking-tight text-sm">RiderMax</span>
              <span className="text-[10px] text-red-400 font-mono block leading-none font-bold">SO_CONDUTOR.v1</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Database Sync Status Badge */}
            {connectionStatus === 'online' && (
              <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full transition-all duration-300" title="Banco de dados em Nuvem Conectado">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[8px] font-bold text-emerald-400 font-mono tracking-wider uppercase">Online</span>
              </div>
            )}
            {connectionStatus === 'syncing' && (
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full transition-all duration-300" title="Sincronizando dados com a Nuvem">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-[8px] font-bold text-amber-400 font-mono tracking-wider uppercase">Syncing</span>
              </div>
            )}
            {connectionStatus === 'offline' && (
              <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/65 px-2 py-0.5 rounded-full transition-all duration-300" title="Trabalhando localmente em modo Offline">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                <span className="text-[8px] font-bold text-slate-400 font-mono tracking-wider uppercase">Offline</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 active:scale-95 transition-all flex items-center justify-center"
              title="Sair do painel"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <Smartphone className="w-4 h-4 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wide">
              PWA ACTIVE
            </span>
          </div>
        </div>
      </header>

      {/* Main View Container */}
      <main className="max-w-md mx-auto px-5 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {activeTab === 'inicio' && (
              <DashboardView 
                profile={profile}
                activeShift={activeShift}
                onStartShift={startShift}
                onEndShift={endShift}
                rides={rides}
                expenses={expenses}
                onAddRide={addRide}
                onAddExpense={addExpense}
                initialCash={initialCash}
                expenseLimits={expenseLimits}
                onUpdateInitialCash={updateInitialCash}
              />
            )}
            
            {activeTab === 'corridas' && (
              <RidesView 
                rides={rides}
                onAddRide={addRide}
                onEditRide={editRide}
                onDeleteRide={deleteRide}
                settings={settings}
              />
            )}

            {activeTab === 'financeiro' && (
              <FinanceView 
                rides={rides}
                expenses={expenses}
                initialCash={initialCash}
                expenseLimits={expenseLimits}
                onAddExpense={addExpense}
                onEditExpense={editExpense}
                onDeleteExpense={deleteExpense}
                onUpdateInitialCash={updateInitialCash}
                onUpdateExpenseLimits={updateExpenseLimits}
                pixCategories={pixCategories}
                onUpdatePixCategories={handleUpdatePixCategories}
                pixDistributions={pixDistributions}
              />
            )}

            {activeTab === 'mais' && (
              <MaisView 
                profile={profile}
                settings={settings}
                onUpdateProfile={updateProfile}
                onUpdateSettings={updateSettings}
                onResetAllData={resetAllData}
                goals={goals}
                onUpdateGoals={updateGoals}
                shoppingLists={shoppingLists}
                onUpdateShoppingLists={updateShoppingLists}
                onAddExpense={addExpense}
                privateClients={privateClients}
                onUpdatePrivateClients={updatePrivateClients}
                privateRides={privateRides}
                onUpdatePrivateRides={updatePrivateRides}
                refuelings={refuelings}
                onUpdateRefuelings={updateRefuelings}
                maintenances={maintenances}
                onUpdateMaintenances={updateMaintenances}
                onAddRide={addRide}
                userId={userId}
                userEmail={auth.currentUser?.email || 'parceiro@ridermax.app'}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Primary Mobile Bottom Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
