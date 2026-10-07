'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Truck,
  Fuel,
  AlertTriangle,
  TrendingDown,
  Leaf,
  Activity,
  MapPin,
  Wifi,
  Radio,
  Clock,
  RotateCw,
  ShieldAlert,
  Flame,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import {
  StatCard,
  SectionCard,
  StatusBadge,
  LoadingSpinner,
  ErrorState,
  PageHeader,
  PeriodSelector,
} from '@/components/ui/primitives';
import { fetchDashboardStats } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useUiStore } from '@/store/ui-store';
import type { FleetStats } from '@/types';
import { cn } from '@/lib/utils';

// Currency and measurement formatters matching backend data format
function fmtINR(rupees: number): string {
  if (isNaN(rupees) || rupees == null) return '₹0';
  return `₹${Math.round(rupees).toLocaleString('en-IN')}`;
}

function fmtL(liters: number): string {
  if (isNaN(liters) || liters == null) return '0.0 L';
  return `${liters.toFixed(1)} L`;
}

function fmtKm(km: number): string {
  if (isNaN(km) || km == null) return '0 km';
  return `${Math.round(km).toLocaleString('en-IN')} km`;
}

function fmtKg(kg: number): string {
  if (isNaN(kg) || kg == null) return '0.0 kg';
  return `${kg.toFixed(1)} kg`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { selectedPeriod, setSelectedPeriod } = useUiStore();

  const { data, isLoading, isFetching, isError, refetch } = useQuery<FleetStats>({
    queryKey: queryKeys.dashboardStats(selectedPeriod),
    queryFn: () => fetchDashboardStats(selectedPeriod),
    staleTime: 60_000,
    retry: 2,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet Overview"
        subtitle="Real-time operations, operational efficiency, and fleet diagnostics."
        actions={
          <div className="flex items-center gap-3">
            <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh Dashboard"
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
            >
              <RotateCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin text-blue-600')} />
            </button>
          </div>
        }
      />

      {isLoading && <LoadingSpinner label="Fetching fleet intelligence…" />}

      {isError && (
        <ErrorState
          message="Could not load fleet analytics data. Please ensure backend services are connected."
          onRetry={() => refetch()}
        />
      )}

      {data && (
        <>
          {/* ── Operational Status Row ───────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              title="Vehicles In Service"
              value={data.vehiclesRunning + data.vehiclesIdle}
              subtitle={`${data.vehiclesRunning} running · ${data.vehiclesIdle} idle · ${data.vehiclesOffline} offline`}
              icon={<Truck className="h-5 w-5" />}
              accent="blue"
              onClick={() => router.push('/vehicles')}
              actionText="Manage Vehicles"
            />
            <StatCard
              title="Active Trips"
              value={data.activeTripCount}
              subtitle={`${data.completedTrips} completed · ${data.tripCount} total`}
              icon={<MapPin className="h-5 w-5" />}
              accent="purple"
              onClick={() => router.push('/trips')}
              actionText="Dispatch Center"
            />
            <StatCard
              title="Pending Alerts"
              value={data.alertCount}
              subtitle={data.alertCount > 0 ? 'Requires attention' : 'All systems normal'}
              icon={<AlertTriangle className="h-5 w-5" />}
              accent={data.alertCount > 0 ? 'red' : 'green'}
              onClick={() => router.push('/alerts')}
              actionText="Review Alerts"
            />
            <StatCard
              title="Live Fleet Tracking"
              value={data.devicesOnline}
              subtitle={`${data.devicesOnline} GPS signals active · ${data.devicesOffline} offline`}
              icon={<Radio className="h-5 w-5" />}
              accent="cyan"
              onClick={() => router.push('/live-tracking')}
              actionText="Live GPS Map"
            />
          </div>

          {/* ── Fuel & Savings Performance ───────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              title="Distance Logged"
              value={fmtKm(data.distanceKm)}
              subtitle={`Across ${data.tripCount} trips in period`}
              icon={<Activity className="h-5 w-5" />}
              accent="blue"
              onClick={() => router.push('/trips')}
              actionText="View Route Logs"
            />
            <StatCard
              title="Fuel Consumed"
              value={fmtL(data.fuelConsumedL)}
              subtitle={`Total Cost: ${fmtINR(data.fuelCostRupees)}`}
              icon={<Fuel className="h-5 w-5" />}
              accent="amber"
              onClick={() => router.push('/fuel')}
              actionText="Fuel Intelligence"
            />
            <StatCard
              title="Verified Savings"
              value={fmtINR(data.verifiedSavingsRupees)}
              subtitle={`${fmtL(data.fuelSavedLiters)} saved vs baseline`}
              icon={<TrendingDown className="h-5 w-5" />}
              accent="green"
              trend={{ value: `${fmtL(data.fuelSavedLiters)} Saved`, isPositive: true }}
              onClick={() => router.push('/savings')}
              actionText="Open Savings Wallet"
            />
            <StatCard
              title="CO₂ Avoided"
              value={fmtKg(data.co2AvoidedKg)}
              subtitle={`Total Carbon Reduced: ${fmtKg(data.carbonReducedKg)}`}
              icon={<Leaf className="h-5 w-5" />}
              accent="green"
              trend={{ value: 'ESG Target Met', isPositive: true }}
              onClick={() => router.push('/carbon')}
              actionText="ESG Carbon Ledger"
            />
          </div>

          {/* ── Detailed Breakdown Panels ────────────────────────────── */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Loss Breakdown Card */}
            <SectionCard
              title="Fuel Loss Breakdown"
              subtitle="Calculated loss factors for this period"
              actions={
                <button
                  onClick={() => router.push('/fuel')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <span>Details</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              }
            >
              <div className="space-y-3.5">
                <LossRow
                  label="Excess Idle Waste"
                  rupees={data.idleLossRupees}
                  liters={data.idleLossLiters}
                  icon={<Clock className="h-4 w-4 text-amber-500" />}
                  color="amber"
                  onClick={() => router.push('/fuel')}
                />
                <LossRow
                  label="Overspeeding Waste"
                  rupees={data.speedingLossRupees}
                  liters={data.speedingLossLiters}
                  icon={<Flame className="h-4 w-4 text-rose-500" />}
                  color="red"
                  onClick={() => router.push('/alerts')}
                />
                <LossRow
                  label="Fuel Theft & Siphon"
                  rupees={data.theftLossRupees}
                  liters={data.theftLossLiters}
                  icon={<ShieldAlert className="h-4 w-4 text-red-600" />}
                  color="red"
                  onClick={() => router.push('/alerts')}
                />
                <div className="border-t border-slate-100 pt-3">
                  <LossRow
                    label="Total Preventable Losses"
                    rupees={data.totalLossRupees}
                    liters={data.totalLossLiters}
                    icon={<TrendingDown className="h-4 w-4 text-slate-600" />}
                    color="neutral"
                    bold
                    onClick={() => router.push('/savings')}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Device Diagnostics Card */}
            <SectionCard
              title="Device Diagnostics"
              subtitle="Hardware telemetry connectivity"
              actions={
                <button
                  onClick={() => router.push('/live-tracking')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <span>Live Map</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              }
            >
              <div className="flex flex-col gap-3">
                <DeviceRow
                  label="Online & Connected"
                  count={data.devicesOnline}
                  variant="success"
                  onClick={() => router.push('/live-tracking')}
                />
                <DeviceRow
                  label="Weak Cellular Signal"
                  count={data.devicesWeakSignal}
                  variant="warning"
                  onClick={() => router.push('/vehicles')}
                />
                <DeviceRow
                  label="Offline / Disconnected"
                  count={data.devicesOffline}
                  variant="danger"
                  onClick={() => router.push('/vehicles')}
                />
                <div
                  onClick={() => router.push('/vehicles')}
                  className="mt-2 cursor-pointer rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 p-3 text-[11px] text-slate-500 flex justify-between items-center group"
                >
                  <span className="group-hover:text-slate-700 font-medium">Total IoT Telemetry Units:</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 group-hover:text-blue-600">
                    <span>{data.devicesOnline + data.devicesWeakSignal + data.devicesOffline}</span>
                    <span className="text-xs">→</span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Monthly Trend Card */}
            <SectionCard
              title="Monthly Fuel Trend"
              subtitle="Aggregated fuel & losses by month"
              actions={
                <button
                  onClick={() => router.push('/reports')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <span>Reports</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              }
            >
              {data.monthlyStats && data.monthlyStats.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400 border-b border-slate-100 pb-1.5">
                    <span className="w-16">Month</span>
                    <span className="text-right">Fuel Used</span>
                    <span className="text-right">Loss</span>
                  </div>
                  {data.monthlyStats.slice(-6).map((m) => (
                    <div
                      key={m.month}
                      onClick={() => router.push('/fuel')}
                      className="flex cursor-pointer items-center justify-between text-xs border-b border-slate-50 pb-2 hover:bg-slate-50/80 rounded-md px-1 transition-colors last:border-0 last:pb-0"
                    >
                      <span className="font-semibold text-slate-700 w-16 shrink-0">{m.month}</span>
                      <span className="text-slate-600 font-medium">{fmtL(m.totalFuel)}</span>
                      <span className="text-rose-600 font-bold">{fmtINR(m.totalLoss)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                  <Activity className="h-8 w-8 text-slate-200 mb-2" />
                  <p className="text-xs">No monthly trends recorded yet for this year.</p>
                </div>
              )}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LossRow({
  label,
  rupees,
  liters,
  icon,
  color,
  bold = false,
  onClick,
}: {
  label: string;
  rupees: number;
  liters: number;
  icon: React.ReactNode;
  color: string;
  bold?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex items-center justify-between gap-3 rounded-lg p-1.5 -mx-1.5 transition-colors',
        onClick && 'cursor-pointer hover:bg-slate-50',
        bold && 'font-bold text-slate-900'
      )}
    >
      <div className="flex items-center gap-2 text-xs text-slate-700 min-w-0">
        {icon}
        <span className="truncate group-hover:text-blue-700 transition-colors">{label}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs">
        <span className="text-slate-500 font-medium">{liters.toFixed(1)} L</span>
        <span
          className={cn(
            'font-semibold',
            color === 'red' && 'text-rose-600',
            color === 'amber' && 'text-amber-600',
            color === 'neutral' && 'text-slate-900 font-bold'
          )}
        >
          {fmtINR(rupees)}
        </span>
      </div>
    </div>
  );
}

function DeviceRow({
  label,
  count,
  variant,
  onClick,
}: {
  label: string;
  count: number;
  variant: 'success' | 'warning' | 'danger';
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between rounded-lg p-1.5 -mx-1.5 transition-colors',
        onClick && 'cursor-pointer hover:bg-slate-50 group'
      )}
    >
      <StatusBadge label={label} variant={variant} dot />
      <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{count}</span>
    </div>
  );
}

