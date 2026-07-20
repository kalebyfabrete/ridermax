/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VehicleType = 'moto' | 'carro' | 'outro';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  dailyGoal: number; // Daily revenue goal in BRL
  isOnline: boolean;
  avatarUrl?: string;
  currentOdometer?: number; // Current odometer of the motorcycle in km
}

export interface UserSettings {
  theme: 'light' | 'dark';
  defaultApp: string; // 'uber' | '99' | 'rappi' | 'ifood' | 'outro'
  useBiometrics: boolean;
  notificationsEnabled: boolean;
  offlineMode: boolean;
}

export interface ActiveShift {
  id: string;
  startTime: string; // ISO string
  endTime?: string;
  totalEarnings: number;
  totalDistance: number; // in km
  totalTrips: number;
  isPaused: boolean;
}

// Future architectures preview - planned structures
export interface RideEntity {
  id: string;
  shiftId: string;
  timestamp: string;
  app: string;
  distance: number;
  earnings: number;
  durationMinutes: number;
  status: 'completed' | 'cancelled';
  notes?: string;
  // Phase 02 extensions
  paymentMethod: 'PIX' | 'Dinheiro' | 'Cartão' | 'Outro';
  tripsCount: number; // 1 for individual, > 1 for batch
}

export interface QuickExpense {
  id: string;
  amount: number;
  category: 'Abastecimento' | 'Alimentação' | 'Manutenção' | 'Outros';
  timestamp: string;
  description: string;
}

export interface ExpenseLimit {
  category: 'Abastecimento' | 'Alimentação' | 'Manutenção' | 'Outros';
  amount: number;
  enabled: boolean;
}

export interface GoalEntity {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // Format: YYYY-MM-DD
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: number;
  estimatedPrice?: number;
  priority: 'Baixa' | 'Média' | 'Alta';
  purchased: boolean;
}

export interface ShoppingListEntity {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: string;
}

export interface TransactionEntity {
  id: string;
  type: 'receita' | 'despesa';
  category: string; // 'combustivel' | 'alimentacao' | 'manutencao' | 'corrida' | 'outros'
  amount: number;
  timestamp: string;
  description: string;
  paymentMethod: string;
}

export interface PrivateClient {
  id: string;
  name: string;
  phone: string;
  notes?: string;
}

export type PrivateRideStatus = 'Agendada' | 'Confirmada' | 'Realizada' | 'Cancelada';

export interface PrivateRide {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  origin?: string;
  destination?: string;
  amount: number;
  recurrence?: string; // Simple recurrence description, e.g. "Segunda, quarta e sexta às 06:30"
  notes?: string;
  status: PrivateRideStatus;
}

export interface RefuelingEntity {
  id: string;
  amount: number; // valor
  liters: number; // litros
  odometer: number; // odômetro
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface MaintenanceEntity {
  id: string;
  type: 'Troca de óleo' | 'Pneus' | 'Pastilhas' | 'Relação' | 'Revisão' | 'Outro';
  date: string; // YYYY-MM-DD
  odometer: number;
  amount: number;
  notes?: string;
}

export interface PixCategory {
  id: string;
  name: string;
  percentage: number; // 0 to 100
}

export interface PixDistributionItem {
  categoryName: string;
  percentage: number;
  amount: number;
}

export interface PixDistribution {
  id: string;
  rideId: string;
  rideAmount: number;
  timestamp: string;
  distributions: PixDistributionItem[];
}


