/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, UserSettings, ActiveShift, RideEntity, QuickExpense, ExpenseLimit, GoalEntity, ShoppingListEntity, PrivateClient, PrivateRide, RefuelingEntity, MaintenanceEntity, PixCategory, PixDistribution } from '../types';

const KEYS = {
  PROFILE: 'rota_profile_v5',
  SETTINGS: 'rota_settings',
  ACTIVE_SHIFT: 'rota_active_shift',
  RIDES: 'rota_rides_v2',
  EXPENSES: 'rota_expenses_v2',
  INITIAL_CASH: 'rota_initial_cash_v3',
  LIMITS: 'rota_expense_limits_v3',
  GOALS: 'rota_goals_v4',
  SHOPPING_LISTS: 'rota_shopping_lists_v4',
  PRIVATE_CLIENTS: 'rota_private_clients_v5',
  PRIVATE_RIDES: 'rota_private_rides_v5',
  REFUELINGS: 'rota_refuelings_v5',
  MAINTENANCES: 'rota_maintenances_v5',
  PIX_CATEGORIES: 'rota_pix_categories_v6',
  PIX_DISTRIBUTIONS: 'rota_pix_distributions_v6',
};

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_default',
  name: 'Parceiro RiderMax',
  email: 'parceiro@ridermax.app',
  vehicleType: 'moto',
  vehicleModel: 'Honda CG Titan 160',
  dailyGoal: 150.00,
  isOnline: false,
  currentOdometer: 12850,
};

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  defaultApp: 'uber',
  useBiometrics: false,
  notificationsEnabled: true,
  offlineMode: false,
};

export const storageService = {
  // User Profile
  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(KEYS.PROFILE);
      return data ? JSON.parse(data) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile: UserProfile): void {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  // User Settings
  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Active Shift State (Work Session)
  getActiveShift(): ActiveShift | null {
    try {
      const data = localStorage.getItem(KEYS.ACTIVE_SHIFT);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveActiveShift(shift: ActiveShift | null): void {
    if (shift) {
      localStorage.setItem(KEYS.ACTIVE_SHIFT, JSON.stringify(shift));
    } else {
      localStorage.removeItem(KEYS.ACTIVE_SHIFT);
    }
  },

  // Daily Rides list
  getRides(): RideEntity[] {
    try {
      const data = localStorage.getItem(KEYS.RIDES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveRides(rides: RideEntity[]): void {
    localStorage.setItem(KEYS.RIDES, JSON.stringify(rides));
  },

  // Daily Quick Expenses (simulated/simple for net profit calculation)
  getExpenses(): QuickExpense[] {
    try {
      const data = localStorage.getItem(KEYS.EXPENSES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveExpenses(expenses: QuickExpense[]): void {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  },

  // Initial Cash of the day
  getInitialCash(): number {
    try {
      const data = localStorage.getItem(KEYS.INITIAL_CASH);
      return data ? Number(data) : 0;
    } catch {
      return 0;
    }
  },

  saveInitialCash(amount: number): void {
    localStorage.setItem(KEYS.INITIAL_CASH, amount.toString());
  },

  // Expense Limits
  getExpenseLimits(): ExpenseLimit[] {
    const defaultLimits: ExpenseLimit[] = [
      { category: 'Abastecimento', amount: 50, enabled: true },
      { category: 'Alimentação', amount: 30, enabled: true },
      { category: 'Manutenção', amount: 100, enabled: false },
      { category: 'Outros', amount: 20, enabled: true }
    ];
    try {
      const data = localStorage.getItem(KEYS.LIMITS);
      return data ? JSON.parse(data) : defaultLimits;
    } catch {
      return defaultLimits;
    }
  },

  saveExpenseLimits(limits: ExpenseLimit[]): void {
    localStorage.setItem(KEYS.LIMITS, JSON.stringify(limits));
  },

  // Goals / Objetivos
  getGoals(): GoalEntity[] {
    const defaultGoals: GoalEntity[] = [];
    try {
      const data = localStorage.getItem(KEYS.GOALS);
      return data ? JSON.parse(data) : defaultGoals;
    } catch {
      return defaultGoals;
    }
  },

  saveGoals(goals: GoalEntity[]): void {
    localStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
  },

  // Shopping Lists / Listas de Compras
  getShoppingLists(): ShoppingListEntity[] {
    const defaultLists: ShoppingListEntity[] = [];
    try {
      const data = localStorage.getItem(KEYS.SHOPPING_LISTS);
      return data ? JSON.parse(data) : defaultLists;
    } catch {
      return defaultLists;
    }
  },

  saveShoppingLists(lists: ShoppingListEntity[]): void {
    localStorage.setItem(KEYS.SHOPPING_LISTS, JSON.stringify(lists));
  },

  // Private Clients / Cadastro de Clientes
  getPrivateClients(): PrivateClient[] {
    const defaultClients: PrivateClient[] = [];
    try {
      const data = localStorage.getItem(KEYS.PRIVATE_CLIENTS);
      return data ? JSON.parse(data) : defaultClients;
    } catch {
      return defaultClients;
    }
  },

  savePrivateClients(clients: PrivateClient[]): void {
    localStorage.setItem(KEYS.PRIVATE_CLIENTS, JSON.stringify(clients));
  },

  // Private Rides / Corridas Particulares
  getPrivateRides(): PrivateRide[] {
    const defaultRides: PrivateRide[] = [];
    try {
      const data = localStorage.getItem(KEYS.PRIVATE_RIDES);
      return data ? JSON.parse(data) : defaultRides;
    } catch {
      return defaultRides;
    }
  },

  savePrivateRides(rides: PrivateRide[]): void {
    localStorage.setItem(KEYS.PRIVATE_RIDES, JSON.stringify(rides));
  },

  // Refuelings / Abastecimentos
  getRefuelings(): RefuelingEntity[] {
    const defaultRefuelings: RefuelingEntity[] = [];
    try {
      const data = localStorage.getItem(KEYS.REFUELINGS);
      return data ? JSON.parse(data) : defaultRefuelings;
    } catch {
      return defaultRefuelings;
    }
  },

  saveRefuelings(refuelings: RefuelingEntity[]): void {
    localStorage.setItem(KEYS.REFUELINGS, JSON.stringify(refuelings));
  },

  // Maintenances / Manutenções
  getMaintenances(): MaintenanceEntity[] {
    const defaultMaintenances: MaintenanceEntity[] = [];
    try {
      const data = localStorage.getItem(KEYS.MAINTENANCES);
      return data ? JSON.parse(data) : defaultMaintenances;
    } catch {
      return defaultMaintenances;
    }
  },

  saveMaintenances(maintenances: MaintenanceEntity[]): void {
    localStorage.setItem(KEYS.MAINTENANCES, JSON.stringify(maintenances));
  },

  // PIX Categories / Categorias do PIX
  getPixCategories(): PixCategory[] {
    const defaultCategories: PixCategory[] = [
      { id: 'cat_1', name: 'Custos da Moto (Combustível/Oficina)', percentage: 30 },
      { id: 'cat_2', name: 'Reserva de Emergência', percentage: 20 },
      { id: 'cat_3', name: 'Alimentação e Dia a Dia', percentage: 20 },
      { id: 'cat_4', name: 'Caixa Pessoal (Sobrou)', percentage: 30 }
    ];
    try {
      const data = localStorage.getItem(KEYS.PIX_CATEGORIES);
      return data ? JSON.parse(data) : defaultCategories;
    } catch {
      return defaultCategories;
    }
  },

  savePixCategories(categories: PixCategory[]): void {
    localStorage.setItem(KEYS.PIX_CATEGORIES, JSON.stringify(categories));
  },

  // PIX Distributions / Distribuições Realizadas
  getPixDistributions(): PixDistribution[] {
    try {
      const data = localStorage.getItem(KEYS.PIX_DISTRIBUTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  savePixDistributions(distributions: PixDistribution[]): void {
    localStorage.setItem(KEYS.PIX_DISTRIBUTIONS, JSON.stringify(distributions));
  },

  // Hard Reset
  clearAll(): void {
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.ACTIVE_SHIFT);
    localStorage.removeItem(KEYS.RIDES);
    localStorage.removeItem(KEYS.EXPENSES);
    localStorage.removeItem(KEYS.INITIAL_CASH);
    localStorage.removeItem(KEYS.LIMITS);
    localStorage.removeItem(KEYS.GOALS);
    localStorage.removeItem(KEYS.SHOPPING_LISTS);
    localStorage.removeItem(KEYS.PRIVATE_CLIENTS);
    localStorage.removeItem(KEYS.PRIVATE_RIDES);
    localStorage.removeItem(KEYS.REFUELINGS);
    localStorage.removeItem(KEYS.MAINTENANCES);
    localStorage.removeItem(KEYS.PIX_CATEGORIES);
    localStorage.removeItem(KEYS.PIX_DISTRIBUTIONS);
  }
};
