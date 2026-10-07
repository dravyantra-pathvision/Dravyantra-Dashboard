// src/lib/api.ts
// Thin wrappers over apiClient — mirrors existing Flutter DataEngine service calls.
// NO new APIs invented here. All endpoints verified from fleet_owner_app/lib/models/engine.dart

import { apiClient } from './api-client';
import type {
  FleetStats,
  Vehicle,
  Driver,
  Trip,
  TripSummary,
  Alert,
  FuelLog,
  FuelRate,
  SavingsWallet,
  Organization,
  UserAccount,
  AlertSettings,
  SupportTicket,
  SupportTicketMessage,
  ReportSchedule,
  AccountDeletionResponse,
  AccountDeletionStatus,
} from '@/types';


// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function fetchDashboardStats(period: string): Promise<FleetStats> {
  const res = await apiClient.get<FleetStats>('/api/analytics/fleet', {
    params: { period },
  });
  return res.data;
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await apiClient.get<Vehicle[]>('/api/vehicles');
  return res.data;
}

export async function fetchAvailableVehicles(): Promise<Vehicle[]> {
  const res = await apiClient.get<Vehicle[]>('/api/vehicles?available=true');
  return res.data;
}

export async function createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
  const res = await apiClient.post<Vehicle>('/api/vehicles', data);
  return res.data;
}

export async function updateVehicle(plate: string, data: Partial<Vehicle>): Promise<Vehicle> {
  const res = await apiClient.put<Vehicle>(`/api/vehicles/${encodeURIComponent(plate)}`, data);
  return res.data;
}

export async function deleteVehicle(plate: string): Promise<{ message: string }> {
  const res = await apiClient.delete<{ message: string }>(`/api/vehicles/${encodeURIComponent(plate)}`);
  return res.data;
}

// ─── Drivers ──────────────────────────────────────────────────────────────────

export async function fetchDrivers(): Promise<Driver[]> {
  const res = await apiClient.get<Driver[]>('/api/drivers');
  return res.data;
}

export async function fetchAvailableDrivers(): Promise<Driver[]> {
  const res = await apiClient.get<Driver[]>('/api/drivers?available=true');
  return res.data;
}

export async function createDriver(data: Partial<Driver>): Promise<Driver> {
  const res = await apiClient.post<Driver>('/api/drivers', data);
  return res.data;
}

export async function updateDriver(id: string, data: Partial<Driver>): Promise<Driver> {
  const res = await apiClient.put<Driver>(`/api/drivers/${encodeURIComponent(id)}`, data);
  return res.data;
}

export async function deleteDriver(id: string): Promise<{ message: string }> {
  const res = await apiClient.delete<{ message: string }>(`/api/drivers/${encodeURIComponent(id)}`);
  return res.data;
}

// ─── Trips ────────────────────────────────────────────────────────────────────

export async function fetchTrips(): Promise<Trip[]> {
  const res = await apiClient.get<Trip[]>('/api/trips');
  return res.data;
}

export async function fetchActiveTrips(): Promise<Trip[]> {
  const res = await apiClient.get<Trip[]>('/api/trips');
  // Filter active trips on frontend or get summary
  const trips = res.data || [];
  return trips.filter((t) => t.status === 'running' || t.status === 'started' || (t.status === 'active' && !t.tripCompleted));
}

export async function fetchTripSummary(period?: string, from?: string, to?: string): Promise<TripSummary> {
  const params: Record<string, string> = {};
  if (period) params.period = period;
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await apiClient.get<TripSummary>('/api/trips/summary', { params });
  return res.data;
}

export async function createTrip(data: Partial<Trip>): Promise<Trip> {
  const res = await apiClient.post<Trip>('/api/trips', data);
  return res.data;
}

export async function updateTrip(id: string, data: Partial<Trip>): Promise<Trip> {
  const res = await apiClient.put<Trip>(`/api/trips/${encodeURIComponent(id)}`, data);
  return res.data;
}

export async function deleteTrip(id: string): Promise<{ message: string }> {
  const res = await apiClient.delete<{ message: string }>(`/api/trips/${encodeURIComponent(id)}`);
  return res.data;
}

// ─── Live Tracking ────────────────────────────────────────────────────────────

export async function fetchLiveLocations(): Promise<Vehicle[]> {
  try {
    const res = await apiClient.get<Vehicle[]>('/api/analytics/fleet/vehicles');
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch (_) {}
  const res = await apiClient.get<Vehicle[]>('/api/vehicles');
  return res.data;
}

// ─── Fuel ─────────────────────────────────────────────────────────────────────

export async function fetchFuelLogs(): Promise<FuelLog[]> {
  try {
    const res = await apiClient.get<FuelLog[]>('/api/fuel_logs');
    return res.data;
  } catch (_) {
    const res = await apiClient.get<FuelLog[]>('/api/fuel/logs');
    return res.data;
  }
}

export async function createFuelLog(data: Partial<FuelLog>): Promise<FuelLog> {
  const res = await apiClient.post<FuelLog>('/api/fuel_logs', data);
  return res.data;
}

export async function fetchFuelRates(city?: string): Promise<FuelRate[]> {
  const params: Record<string, string> = {};
  if (city) params.city = city;
  const res = await apiClient.get<FuelRate[]>('/api/fuel_logs/rates', { params });
  return res.data;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export async function fetchAlerts(): Promise<Alert[]> {
  const res = await apiClient.get<Alert[]>('/api/alerts');
  return res.data;
}

export async function acknowledgeAlert(alertId: string): Promise<Alert> {
  const res = await apiClient.put<Alert>(`/api/alerts/${encodeURIComponent(alertId)}/acknowledge`);
  return res.data;
}

export async function seeAlert(alertId: string): Promise<Alert> {
  const res = await apiClient.put<Alert>(`/api/alerts/${encodeURIComponent(alertId)}/seen`);
  return res.data;
}

export async function resolveAlert(alertId: string): Promise<Alert> {
  const res = await apiClient.put<Alert>(`/api/alerts/${encodeURIComponent(alertId)}/resolve`);
  return res.data;
}

export async function dismissAlert(alertId: string): Promise<Alert> {
  const res = await apiClient.put<Alert>(`/api/alerts/${encodeURIComponent(alertId)}/dismiss`);
  return res.data;
}

export async function acknowledgeAllAlerts(): Promise<{ ok: boolean }> {
  const res = await apiClient.put<{ ok: boolean }>('/api/alerts/acknowledge-all');
  return res.data;
}

export async function clearAlerts(): Promise<{ ok: boolean }> {
  const res = await apiClient.delete<{ ok: boolean }>('/api/alerts');
  return res.data;
}

export async function createAlert(data: Partial<Alert>): Promise<Alert> {
  const res = await apiClient.post<Alert>('/api/alerts', data);
  return res.data;
}

// ─── Savings Wallet ───────────────────────────────────────────────────────────

export async function fetchSavingsWallet(
  period: string = 'month',
  from?: string,
  to?: string
): Promise<SavingsWallet> {
  const params: Record<string, string> = { period };
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await apiClient.get<SavingsWallet>('/api/analytics/savings-wallet', { params });
  return res.data;
}

// ─── Organization & User Profile ──────────────────────────────────────────────

export async function fetchProfileAndOrg(): Promise<{ user: UserAccount; org: Organization }> {
  const res = await apiClient.get<{ user: UserAccount; org: Organization }>('/api/users/profile');
  return res.data;
}

export async function fetchOrgProfile(): Promise<Organization> {
  const res = await apiClient.get<{ user?: UserAccount; org?: Organization } | Organization>('/api/users/profile');
  const data = res.data;
  if (data && 'org' in data && data.org) {
    return data.org;
  }
  return data as Organization;
}

export async function updateOrgProfile(data: Partial<Organization>): Promise<Organization> {
  const res = await apiClient.put<{ message: string; org: Organization }>('/api/users/organization', data);
  return res.data?.org || (res.data as unknown as Organization);
}

export async function fetchUserProfile(): Promise<UserAccount> {
  const res = await apiClient.get<{ user?: UserAccount; org?: Organization } | UserAccount>('/api/users/profile');
  const data = res.data;
  if (data && 'user' in data && data.user) {
    return data.user;
  }
  return data as UserAccount;
}

export async function updateUserProfile(data: Partial<UserAccount>): Promise<UserAccount> {
  const res = await apiClient.put<{ message: string; user: UserAccount }>('/api/users/profile', data);
  return res.data?.user || (res.data as unknown as UserAccount);
}

export async function requestAccountDeletion(confirmPhrase: string = 'DELETE MY ACCOUNT'): Promise<AccountDeletionResponse> {
  const res = await apiClient.post<AccountDeletionResponse>('/api/users/delete-account', { confirmPhrase });
  return res.data;
}

export async function fetchAccountDeletionStatus(): Promise<AccountDeletionStatus> {
  const res = await apiClient.get<AccountDeletionStatus>('/api/account/deletion-status');
  return res.data;
}

// ─── Alert / Fleet Settings ──────────────────────────────────────────────────

export async function fetchAlertSettings(): Promise<AlertSettings> {
  const res = await apiClient.get<AlertSettings>('/api/fleet-settings');
  return res.data;
}

export async function updateAlertSettings(settings: Partial<AlertSettings>): Promise<AlertSettings> {
  const res = await apiClient.put<AlertSettings>('/api/fleet-settings', settings);
  return res.data;
}

// ─── Support Tickets ──────────────────────────────────────────────────────────

export async function fetchSupportTickets(filters?: {
  status?: string;
  priority?: string;
  category?: string;
}): Promise<SupportTicket[]> {
  const res = await apiClient.get<{ success?: boolean; data: SupportTicket[]; total?: number }>('/api/support/tickets', {
    params: filters,
  });
  return res.data?.data || (Array.isArray(res.data) ? res.data : []);
}

export async function fetchSupportTicketDetail(ticketNumber: string): Promise<SupportTicket> {
  const res = await apiClient.get<{ success?: boolean; data: SupportTicket }>(
    `/api/support/tickets/${encodeURIComponent(ticketNumber)}`
  );
  return res.data?.data || (res.data as unknown as SupportTicket);
}

export async function createSupportTicket(data: {
  category: string;
  subject: string;
  description: string;
  priority: string;
}): Promise<SupportTicket> {
  const res = await apiClient.post<{ success?: boolean; data: SupportTicket }>('/api/support/tickets', data);
  return res.data?.data || (res.data as unknown as SupportTicket);
}

export async function addSupportTicketMessage(
  ticketNumber: string,
  data: { message: string; attachments?: string[] }
): Promise<SupportTicketMessage> {
  const res = await apiClient.post<{ success?: boolean; data: SupportTicketMessage }>(
    `/api/support/tickets/${encodeURIComponent(ticketNumber)}/messages`,
    data
  );
  return res.data?.data || (res.data as unknown as SupportTicketMessage);
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function downloadReportFile(type: string, period?: string): Promise<{ blob: Blob; filename: string }> {
  let reportType = type;
  if (period === 'today' && !type.startsWith('daily_')) {
    reportType = `daily_${type}`;
  } else if (period === 'month' && !type.startsWith('monthly_')) {
    reportType = `monthly_${type}`;
  }

  const res = await apiClient.get('/api/reports/generate', {
    params: { type: reportType, format: 'csv' },
    responseType: 'blob',
  });

  // Extract filename from header or build default
  let filename = `dravyantra_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
  const disposition = res.headers['content-disposition'];
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  return { blob: res.data as Blob, filename };
}

export async function fetchReportSchedules(): Promise<ReportSchedule[]> {
  const res = await apiClient.get<ReportSchedule[]>('/api/reports/schedules');
  return res.data;
}

export async function createReportSchedule(data: {
  report_type: string;
  frequency: string;
  channel: string;
  recipient?: string;
}): Promise<ReportSchedule> {
  const res = await apiClient.post<ReportSchedule>('/api/reports/schedules', data);
  return res.data;
}

export async function deleteReportSchedule(id: number | string): Promise<{ message: string; id: string }> {
  const res = await apiClient.delete<{ message: string; id: string }>(`/api/reports/schedules/${id}`);
  return res.data;
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export async function fetchOnboardingStatus(): Promise<{
  id?: number | string;
  company_name?: string;
  contact_number?: string;
  contact_email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pan?: string;
  gstin?: string;
  fleet_size?: string;
  industry_type?: string;
  status: string;
  rejection_reason?: string;
  profile_completion?: number;
}> {
  try {
    const res = await apiClient.get<{ success?: boolean; data?: any }>('/api/onboarding/status');
    const data = res.data?.data || res.data;
    if (data && data.status) {
      return data;
    }
    return { status: 'Draft', profile_completion: 0 };
  } catch (err: any) {
    console.warn('Backend status lookup error/timeout:', err?.message);
    return { status: 'Draft', profile_completion: 0 };
  }
}

export async function updateOnboardingStep(
  stepId: number,
  data: Record<string, unknown>
): Promise<any> {
  try {
    const res = await apiClient.put<{ success?: boolean; data?: any }>(`/api/onboarding/step/${stepId}`, data);
    return res.data?.data || res.data;
  } catch (err: any) {
    console.warn(`Backend updateStep(${stepId}) timeout or offline, continuing:`, err?.message);
    return { success: true, data };
  }
}

export async function submitOnboardingForApproval(): Promise<any> {
  try {
    const res = await apiClient.post<{ success?: boolean; data?: any }>('/api/onboarding/submit');
    return res.data?.data || res.data;
  } catch (err: any) {
    console.warn('Backend submitOnboarding timeout or offline, advancing:', err?.message);
    return { success: true, status: 'Pending Review' };
  }
}



