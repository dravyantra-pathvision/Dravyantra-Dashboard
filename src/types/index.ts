// src/types/index.ts

export type UserRole = 'fleet_owner' | 'driver' | 'admin';

export interface UserAccount {
  uid: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  timezone?: string;
  employee_id?: string;
  department?: string;
  language_pref?: string;
  email_notif?: boolean;
  sms_notif?: boolean;
  push_notif?: boolean;
  created_at?: string;
  last_login?: string;
  last_prompted_at?: string;
}

export interface Organization {
  id?: string;
  uid?: string;
  name?: string;
  company_name?: string;
  gstin?: string;
  pan?: string;
  city?: string;
  state?: string;
  contact_phone?: string;
  contact_number?: string;
  contact_email?: string;
  address?: string;
  country?: string;
  fleet_size?: string | number;
  industry_type?: string;
  subscription_plan?: string;
  created_at?: string;
  updated_at?: string;
}

export type OnboardingStatus = 'Approved' | 'Pending Review' | 'Rejected' | 'Draft' | 'Unknown';

export interface OnboardingStatusResponse {
  status: OnboardingStatus;
  remarks?: string;
  submitted_at?: string;
}

export interface MonthlyStat {
  month: string;
  totalFuel: number;
  totalLoss: number;
  idleWasted: number;
}

export interface FleetStats {
  distanceKm: number;
  fuelConsumedL: number;
  fuelCostRupees: number;
  fuelSavedLiters: number;
  verifiedSavingsRupees: number;
  co2AvoidedKg: number;
  carbonReducedKg: number;
  idleLossRupees: number;
  idleLossLiters: number;
  speedingLossRupees: number;
  speedingLossLiters: number;
  theftLossRupees: number;
  theftLossLiters: number;
  totalLossRupees: number;
  totalLossLiters: number;
  tripCount: number;
  completedTrips: number;
  alertCount: number;
  idleTimeSeconds: number;
  co2EmittedKg: number;
  vehiclesRunning: number;
  vehiclesIdle: number;
  vehiclesOffline: number;
  devicesOnline: number;
  devicesOffline: number;
  devicesWeakSignal: number;
  activeTripCount: number;
  monthlyStats: MonthlyStat[];
}

export type VehicleStatus = 'running' | 'moving' | 'idle' | 'stopped' | 'offline';

export interface Vehicle {
  plate: string;
  model?: string;
  make?: string;
  type?: string;
  year?: number;
  capacity?: number;
  fuel_capacity?: number;
  fuel_type?: string;
  fuel: number;
  status: VehicleStatus;
  speed: number;
  driver?: string;
  device_id?: string;
  deviceId?: string;
  mil?: number;
  mileage?: number;
  idle?: number;
  fastag?: number;
  health?: number;
  odo?: number;
  next_service?: string;
  nextService?: string;
  last_fill?: string;
  lastFill?: string;
  loc?: string;
  lat?: number;
  lng?: number;
  route?: number[][];
  is_active?: boolean;
  isActive?: boolean;
  is_blacklisted?: boolean;
  image_url?: string;
  imageUrl?: string;
  rc_url?: string;
  last_updated?: string;
  device_status?: string;
  signal_quality?: string;
  gps_fix_status?: string;
  trip_id?: string;
  trip_status?: string;
  tripAvgSpeedKmh?: number;
  vibration?: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  age?: number;
  exp?: number;
  lic: string;
  lic_exp?: string;
  licExp?: string;
  blood?: string;
  vehicle?: string;
  status: string;
  score: number;
  mil?: number;
  idle?: number;
  trips?: number;
  trips_count?: number;
  harsh?: number;
  over_speed?: number;
  deviation?: number;
  fuel_eff?: number;
  rating?: number;
  home?: string;
  on_leave?: boolean;
  is_active?: boolean;
  image_url?: string;
  imageUrl?: string;
  aadhar_url?: string;
  license_url?: string;
}

export interface Trip {
  id: string;
  origin?: string;
  from?: string;
  destination?: string;
  to?: string;
  vehicle: string;
  driver: string;
  load?: string;
  client?: string;
  status: string;
  ewayBill?: string;
  eway_bill?: string;
  ewayBillUrl?: string;
  eway_bill_url?: string;
  date?: string;
  distance?: number;
  progress?: number;
  fuelUsed?: number;
  fuel_used?: number;
  fuelSaved?: number;
  fuel_saved?: number;
  fuelWasted?: number;
  fuel_wasted?: number;
  moneySaved?: number;
  money_saved?: number;
  moneyWasted?: number;
  money_wasted?: number;
  idleMoneyWasted?: number;
  idle_money_wasted?: number;
  score?: number;
  delayMinutes?: number;
  waypoints?: string[];
  tollCount?: number;
  liveSpeed?: number;
  live_speed?: number;
  power?: boolean;
  idleDuration?: number;
  idle_duration?: number;
  liveIdleTime?: string;
  live_idle_time?: string;
  start_time?: string;
  end_time?: string;
  lat?: number;
  lng?: number;
  speedingFuelLoss?: number;
  speedingMoneyLoss?: number;
  theftFuelLoss?: number;
  theftMoneyLoss?: number;
  defaultMileage?: number;
  default_mileage?: number;
  currentMileage?: number;
  current_mileage?: number;
  idleFuelWasted?: number;
  idle_fuel_wasted?: number;
  tripCompleted?: boolean;
  trip_completed?: boolean;
}

export interface TripSummary {
  totalFuelLiters: number;
  totalFuelRupees: number;
  totalFuelWastedLiters: number;
  totalFuelSavedLiters: number;
  totalMoneyWasted: number;
  totalMoneySaved: number;
  totalIdleSeconds: number;
  totalIdleMinutes: number;
  totalIdleHours: number;
  totalIdleRupees: number;
  period?: string;
  fromDate?: string;
  toDate?: string;
}

export type AlertSeverity = 'critical' | 'danger' | 'warning' | 'info';

export interface Alert {
  id: string;
  vehiclePlate?: string;
  vehicle_plate?: string;
  truck?: string;
  driver?: string;
  type?: string;
  message?: string;
  msg?: string;
  severity?: AlertSeverity;
  sev?: AlertSeverity;
  category?: string;
  status: 'pending' | 'acknowledged' | 'read' | 'resolved' | 'dismissed' | 'ignored' | 'seen';
  lifecycleState?: string;
  detectedAt?: string;
  detected_at?: string;
  created_at?: string;
  seenAt?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  dismissedAt?: string;
  lat?: number;
  lng?: number;
  tripId?: string;
  trip_id?: string;
  source?: string;
}

export interface FuelLog {
  id: string;
  vehiclePlate?: string;
  vehicle_plate?: string;
  vehicle?: string;
  liters: number;
  cost: number;
  location?: string;
  timestamp?: string;
  created_at?: string;
  fuel_type?: string;
  fuelType?: string;
  odo?: number;
  driver?: string;
  receipt_url?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface FuelRate {
  city: string;
  rate: string;
}

export interface SavingsWalletPeriod {
  start: string | null;
  end: string | null;
  label: string;
}

export interface SavingsWalletVehicleBreakdown {
  vehicleId: string;
  registrationNumber?: string;
  baselineStatus: string;
  baselineEfficiency: number;
  currentEfficiency: number;
  distance: number;
  fuelConsumed: number;
  fuelSavedLiters: number;
  fuelSavedRupees: number;
  fuelLossPreventedLiters: number;
  fuelLossPreventedRupees: number;
  identifiedWasteLiters: number;
  identifiedWasteRupees: number;
}

export interface SavingsWallet {
  period: SavingsWalletPeriod;
  verifiedSavings: {
    fuelLiters: number;
    rupees: number;
  };
  fuelLossPrevented: {
    liters: number;
    rupees: number;
    events: number;
  };
  identifiedWaste: {
    totalLiters: number;
    totalRupees: number;
    idling: {
      liters: number;
      rupees: number;
    };
    overspeeding: {
      liters: number;
      rupees: number;
      events: number;
    };
    fuelTheft: {
      liters: number;
      rupees: number;
      events: number;
    };
  };
  vehicleBreakdown: SavingsWalletVehicleBreakdown[];
}

export interface AlertSettings {
  speedThreshold?: number;
  speedingThreshold?: number;
  fuelDropThreshold?: number;
  idleLimit?: number;
  idleTimeMinutes?: number;
  lowFuelPercent?: number;
  theftAlertEnabled?: boolean;
  fastagThreshold?: number;
  mileageThreshold?: number;
  whatsappEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  perTypeToggles?: {
    overSpeed?: boolean;
    excessIdle?: boolean;
    fuelDrop?: boolean;
    geoFence?: boolean;
    harshBraking?: boolean;
    eWayBill?: boolean;
    fastag?: boolean;
    gpsLost?: boolean;
  };
  fuelPricePerLiter?: number;
  co2FactorPerLiter?: number;
  overspeedThresholdKmh?: number;
  idleWarningSeconds?: number;
  idleCriticalSeconds?: number;
  fuelTheftThresholdLiters?: number;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SupportTicketMessage {
  id: string | number;
  ticket_number: string;
  sender_id: string;
  sender_name?: string;
  sender_role?: string;
  message: string;
  attachments?: string[];
  created_at: string;
}

export interface SupportTicket {
  id?: string | number;
  ticket_number?: string;
  ticketNumber?: string;
  uid?: string;
  category: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'Low' | 'Medium' | 'High' | 'Urgent' | string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Reopened' | string;
  assigned_staff_id?: string;
  assigned_staff_name?: string;
  fleet_owner_name?: string;
  fleet_owner_email?: string;
  organization_name?: string;
  resolved_at?: string;
  created_at: string;
  updated_at?: string;
  messages?: SupportTicketMessage[];
}

export interface ReportSchedule {
  id: number | string;
  uid?: string;
  report_type: string;
  frequency: string;
  channel: string;
  recipient?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AccountDeletionResponse {
  success: boolean;
  message?: string;
  jobId?: number | string;
  status?: string;
  requestedAt?: string;
  error?: string;
}

export interface AccountDeletionStatus {
  success: boolean;
  hasDeletionRequest: boolean;
  deletionRequest?: {
    id: number;
    status: string;
    requested_at: string;
    started_at?: string;
    completed_at?: string;
    failed_at?: string;
  };
}
