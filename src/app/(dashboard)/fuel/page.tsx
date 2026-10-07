'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Fuel,
  TrendingDown,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Clock,
  Plus,
  Search,
  RotateCw,
  MapPin,
  Truck,
  IndianRupee,
  Activity,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import {
  SectionCard,
  StatCard,
  StatusBadge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  PageHeader,
  PeriodSelector,
  DataTable,
  Modal,
} from '@/components/ui/primitives';
import {
  fetchFuelLogs,
  createFuelLog,
  fetchFuelRates,
  fetchDashboardStats,
  fetchVehicles,
} from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useUiStore } from '@/store/ui-store';
import type { FuelLog, FuelRate, FleetStats, Vehicle } from '@/types';
import { cn } from '@/lib/utils';

function fmtINR(r: number): string {
  if (isNaN(r) || r == null) return '₹0';
  return `₹${Math.round(r).toLocaleString('en-IN')}`;
}

function fmtL(l: number): string {
  if (isNaN(l) || l == null) return '0.0 L';
  return `${l.toFixed(1)} L`;
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function FuelPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedPeriod, setSelectedPeriod } = useUiStore();
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Form state for creating a new fuel log
  const [formData, setFormData] = useState({
    vehicle_plate: '',
    liters: '',
    cost: '',
    location: '',
    driver: '',
    odo: '',
    fuel_type: 'Diesel',
    timestamp: new Date().toISOString().slice(0, 16),
  });

  // Queries
  const { data: stats, isLoading: isStatsLoading, isError: isStatsError, refetch: refetchStats } = useQuery<FleetStats>({
    queryKey: queryKeys.dashboardStats(selectedPeriod),
    queryFn: () => fetchDashboardStats(selectedPeriod),
    staleTime: 60_000,
  });

  const { data: logs, isLoading: isLogsLoading, isError: isLogsError, refetch: refetchLogs } = useQuery<FuelLog[]>({
    queryKey: queryKeys.fuelLogs(),
    queryFn: fetchFuelLogs,
    staleTime: 30_000,
  });

  const { data: rates } = useQuery<FuelRate[]>({
    queryKey: queryKeys.fuelRates(),
    queryFn: () => fetchFuelRates(),
    staleTime: 300_000,
  });

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: queryKeys.vehicles(),
    queryFn: fetchVehicles,
    staleTime: 60_000,
  });

  // Mutation to add a fuel fill-up log
  const addLogMutation = useMutation({
    mutationFn: (data: Partial<FuelLog>) => createFuelLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fuelLogs() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats(selectedPeriod) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles() });
      setIsLogModalOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      vehicle_plate: '',
      liters: '',
      cost: '',
      location: '',
      driver: '',
      odo: '',
      fuel_type: 'Diesel',
      timestamp: new Date().toISOString().slice(0, 16),
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_plate.trim() || !formData.liters || !formData.cost) return;

    addLogMutation.mutate({
      vehicle_plate: formData.vehicle_plate.trim(),
      liters: Number(formData.liters),
      cost: Number(formData.cost),
      location: formData.location.trim() || undefined,
      driver: formData.driver.trim() || undefined,
      odo: formData.odo ? Number(formData.odo) : undefined,
      fuel_type: formData.fuel_type,
      timestamp: new Date(formData.timestamp).toISOString(),
    });
  };

  const allLogs = logs ?? [];
  const filteredLogs = allLogs.filter((l) => {
    const plate = l.vehicle_plate || l.vehiclePlate || l.vehicle || '';
    const loc = l.location || '';
    const drv = l.driver || '';

    const matchesSearch =
      !search ||
      plate.toLowerCase().includes(search.toLowerCase()) ||
      loc.toLowerCase().includes(search.toLowerCase()) ||
      drv.toLowerCase().includes(search.toLowerCase());

    const matchesVehicle = vehicleFilter === 'all' || plate === vehicleFilter;
    return matchesSearch && matchesVehicle;
  });

  const uniquePlates = Array.from(
    new Set(allLogs.map((l) => l.vehicle_plate || l.vehiclePlate || l.vehicle || '').filter(Boolean))
  );

  const columns = [
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (f: FuelLog) => {
        const plate = f.vehicle_plate || f.vehiclePlate || f.vehicle || '—';
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {plate}
            </span>
          </div>
        );
      },
    },
    {
      key: 'liters',
      header: 'Quantity',
      render: (f: FuelLog) => (
        <span className="font-semibold text-xs text-slate-800">{f.liters ? `${f.liters.toFixed(1)} L` : '—'}</span>
      ),
    },
    {
      key: 'cost',
      header: 'Total Cost',
      render: (f: FuelLog) => (
        <span className="font-semibold text-xs text-emerald-700">{fmtINR(f.cost)}</span>
      ),
    },
    {
      key: 'rate',
      header: 'Fuel Rate',
      render: (f: FuelLog) => {
        const rate = f.liters && f.cost ? (f.cost / f.liters).toFixed(2) : null;
        return <span className="text-xs text-slate-600 font-mono">{rate ? `₹${rate}/L` : '—'}</span>;
      },
    },
    {
      key: 'driver',
      header: 'Driver',
      render: (f: FuelLog) => <span className="text-xs text-slate-700">{f.driver || '—'}</span>,
    },
    {
      key: 'location',
      header: 'Station Location',
      render: (f: FuelLog) => <span className="text-xs text-slate-600">{f.location || '—'}</span>,
    },
    {
      key: 'timestamp',
      header: 'Date & Time',
      render: (f: FuelLog) => (
        <span className="text-[11px] text-slate-500 font-medium">
          {fmtDate(f.timestamp || f.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel Management"
        subtitle="Real-time fuel consumption, verified savings, audited loss attribution, and fill-up logs."
        actions={
          <div className="flex items-center gap-3">
            <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
            <button
              onClick={() => {
                refetchStats();
                refetchLogs();
              }}
              title="Refresh fuel analytics"
              className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 shadow-2xs transition-colors"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                resetForm();
                setIsLogModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Log Refill
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      {isStatsLoading && <LoadingSpinner label="Loading fuel metrics…" />}
      {isStatsError && (
        <ErrorState message="Could not load fuel metrics." onRetry={() => refetchStats()} />
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              title="Fuel Consumed"
              value={fmtL(stats.fuelConsumedL)}
              subtitle={`Total Cost: ${fmtINR(stats.fuelCostRupees)}`}
              icon={<Fuel className="h-5 w-5" />}
              accent="amber"
              onClick={() => {
                const logsEl = document.getElementById('fuel-logs-table');
                if (logsEl) logsEl.scrollIntoView({ behavior: 'smooth' });
              }}
              actionText="View Refill Logs"
            />
            <StatCard
              title="Verified Fuel Saved"
              value={fmtL(stats.fuelSavedLiters)}
              subtitle={`Saved: ${fmtINR(stats.verifiedSavingsRupees)}`}
              icon={<TrendingDown className="h-5 w-5" />}
              accent="green"
              trend={{ value: `${fmtINR(stats.verifiedSavingsRupees)}`, isPositive: true }}
              onClick={() => router.push('/savings')}
              actionText="Open Savings Wallet"
            />
            <StatCard
              title="Idle Fuel Waste"
              value={fmtL(stats.idleLossLiters)}
              subtitle={`Loss: ${fmtINR(stats.idleLossRupees)}`}
              icon={<Clock className="h-5 w-5" />}
              accent="amber"
              onClick={() => router.push('/vehicles')}
              actionText="Audit Fleet Idling"
            />
            <StatCard
              title="Total Preventable Losses"
              value={fmtINR(stats.totalLossRupees)}
              subtitle={`Volume: ${fmtL(stats.totalLossLiters)}`}
              icon={<AlertTriangle className="h-5 w-5" />}
              accent="red"
              trend={{ value: `${fmtL(stats.totalLossLiters)} Lost`, isPositive: false }}
              onClick={() => router.push('/savings')}
              actionText="Review Losses"
            />
          </div>

          {/* Loss Attribution Row */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div
              onClick={() => router.push('/vehicles')}
              className="group cursor-pointer rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 p-4 space-y-2 transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                  Excess Idling Loss
                </span>
                <span className="text-xs font-mono font-bold text-amber-700">
                  {fmtL(stats.idleLossLiters)}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-amber-900">{fmtINR(stats.idleLossRupees)}</p>
              <p className="text-[11px] text-amber-700">
                Calculated from stationary vehicle telemetry with ignition running.
              </p>
              <div className="pt-1 text-[11px] font-semibold text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>View Idling Fleet</span>
                <span>→</span>
              </div>
            </div>

            <div
              onClick={() => router.push('/alerts')}
              className="group cursor-pointer rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 p-4 space-y-2 transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-rose-600" />
                  Overspeeding Waste
                </span>
                <span className="text-xs font-mono font-bold text-rose-700">
                  {fmtL(stats.speedingLossLiters)}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-rose-900">{fmtINR(stats.speedingLossRupees)}</p>
              <p className="text-[11px] text-rose-700">
                Excess aerodynamic drag loss above highway economy thresholds.
              </p>
              <div className="pt-1 text-[11px] font-semibold text-rose-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Investigate Speed Alerts</span>
                <span>→</span>
              </div>
            </div>

            <div
              onClick={() => router.push('/alerts')}
              className="group cursor-pointer rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 p-4 space-y-2 transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                  Theft & Siphon Loss
                </span>
                <span className="text-xs font-mono font-bold text-rose-700">
                  {fmtL(stats.theftLossLiters)}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-rose-900">{fmtINR(stats.theftLossRupees)}</p>
              <p className="text-[11px] text-rose-700">
                Sudden unconfirmed drop events detected by IoT fuel tank sensor.
              </p>
              <div className="pt-1 text-[11px] font-semibold text-rose-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>View Theft Alarms</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Live Diesel Price Rates Bar */}
      {rates && rates.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between gap-4 flex-wrap text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
              <IndianRupee className="h-4 w-4 text-blue-600" />
              Live City Diesel Benchmark Rates:
            </span>
            <div className="flex items-center gap-4 flex-wrap">
              {rates.map((r) => (
                <div key={r.city} className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium">{r.city}:</span>
                  <span className="font-mono font-bold text-slate-800">{r.rate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fuel Refill Logs Table */}
      <SectionCard
        title={`Fuel Refill History (${filteredLogs.length}${allLogs.length ? ` / ${allLogs.length}` : ''})`}
        subtitle="Audit logs of all recorded diesel & CNG fill-ups across fleet vehicles."
        actions={
          <div className="flex items-center gap-2">
            {/* Vehicle Filter */}
            {uniquePlates.length > 0 && (
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-blue-500 font-mono"
              >
                <option value="all">All Vehicles</option>
                {uniquePlates.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search vehicle, location, driver…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-56 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        }
        bodyClassName="p-0"
      >
        {isLogsLoading && <LoadingSpinner label="Loading fuel logs…" />}
        {isLogsError && (
          <ErrorState message="Could not load fuel logs." onRetry={() => refetchLogs()} />
        )}

        {!isLogsLoading && !isLogsError && (
          filteredLogs.length === 0 ? (
            <EmptyState
              message={
                search || vehicleFilter !== 'all'
                  ? 'No fuel logs match your search criteria.'
                  : 'No fuel refill logs recorded yet. Click "Log Refill" to add one.'
              }
              icon={<Fuel className="h-10 w-10 text-slate-300" />}
            />
          ) : (
            <DataTable columns={columns} data={filteredLogs} rowKey={(f) => f.id} />
          )
        )}
      </SectionCard>

      {/* LOG REFILL MODAL */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Fuel Fill-Up"
        subtitle="Record a vehicle fuel refill event with volume, invoice cost, and location."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Vehicle <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.vehicle_plate}
                onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono"
              >
                <option value="">Select vehicle</option>
                {(vehicles ?? []).map((v) => (
                  <option key={v.plate} value={v.plate}>
                    {v.plate} {v.model ? `(${v.model})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Fuel Type
              </label>
              <select
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Petrol">Petrol</option>
                <option value="LNG">LNG</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Quantity (Liters / kg) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                required
                placeholder="e.g. 150.5"
                value={formData.liters}
                onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Total Cost (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="e.g. 13850"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Station / Location</label>
              <input
                type="text"
                placeholder="e.g. IndianOil Plaza, Panvel"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Driver Name</label>
              <input
                type="text"
                placeholder="e.g. Rajesh Kumar"
                value={formData.driver}
                onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Odometer (km)</label>
              <input
                type="number"
                placeholder="e.g. 48250"
                value={formData.odo}
                onChange={(e) => setFormData({ ...formData, odo: e.target.value })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Refill Date & Time</label>
              <input
                type="datetime-local"
                value={formData.timestamp}
                onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {addLogMutation.isError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                {((addLogMutation.error as unknown) as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                  'Failed to record fuel log. Please try again.'}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsLogModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addLogMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {addLogMutation.isPending ? 'Saving…' : 'Record Fill-Up'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
