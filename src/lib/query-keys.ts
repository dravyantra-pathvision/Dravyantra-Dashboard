// src/lib/query-keys.ts
// Centralised TanStack Query key factory — mirrors existing Flutter service endpoints

export const queryKeys = {
  // Dashboard / overview
  dashboardStats: (period: string) => ['dashboard', 'stats', period] as const,

  // Vehicles
  vehicles: () => ['vehicles'] as const,
  vehicle: (plate: string) => ['vehicles', plate] as const,

  // Drivers
  drivers: () => ['drivers'] as const,
  driver: (id: string) => ['drivers', id] as const,

  // Trips
  trips: () => ['trips'] as const,
  activeTrips: () => ['trips', 'active'] as const,
  tripSummary: (period?: string) => ['trip', 'summary', period ?? 'all'] as const,

  // Live Tracking
  liveLocations: () => ['live', 'locations'] as const,

  // Fuel
  fuelLogs: () => ['fuel', 'logs'] as const,
  fuelRates: (city?: string) => ['fuel', 'rates', city ?? 'all'] as const,
  fuelSummary: (period: string) => ['fuel', 'summary', period] as const,

  // Alerts
  alerts: () => ['alerts'] as const,
  alertsActive: () => ['alerts', 'active'] as const,
  alertSettings: () => ['alerts', 'settings'] as const,

  // Savings
  savings: (period: string) => ['savings', period] as const,
  savingsWallet: (period: string) => ['savings-wallet', period] as const,

  // Carbon
  carbon: (period: string) => ['carbon', period] as const,

  // Reports
  reports: () => ['reports'] as const,
  reportSchedules: () => ['reports', 'schedules'] as const,

  // Organization / Profile / Account
  orgProfile: () => ['org', 'profile'] as const,
  userProfile: () => ['user', 'profile'] as const,
  accountDeletionStatus: () => ['account', 'deletion-status'] as const,

  // Support Tickets
  supportTickets: (filters?: Record<string, string>) => ['support', 'tickets', filters ?? {}] as const,
  supportTicket: (id: string) => ['support', 'tickets', id] as const,
};

export const QUERY_KEYS = queryKeys;

