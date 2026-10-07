'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Route,
  Navigation,
  CheckCircle2,
  Clock,
  Fuel,
  TrendingDown,
  AlertCircle,
  Truck,
  User,
  FileText,
  Calendar,
  Gauge,
  Activity,
  Feather,
  Coins,
  XCircle,
  Droplets,
  CreditCard,
  Rocket,
  Shield,
  ShieldAlert,
  ArrowUpDown,
  Download,
  Share2,
  Play,
  Pause,
  LayoutGrid,
  List as ListIcon,
  ExternalLink,
  Sparkles,
  Map as MapIcon,
  Maximize2,
} from 'lucide-react';
import {
  SectionCard,
  StatCard,
  StatusBadge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  PageHeader,
  DataTable,
  Modal,
  Drawer,
  ConfirmDialog,
} from '@/components/ui/primitives';
import {
  fetchTrips,
  fetchTripSummary,
  fetchAvailableVehicles,
  fetchAvailableDrivers,
  fetchVehicles,
  fetchDrivers,
  createTrip,
  updateTrip,
  deleteTrip,
} from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Trip, TripSummary, Vehicle, Driver } from '@/types';
import { cn } from '@/lib/utils';
import { PlaceAutocompleteInput } from '@/components/maps/PlaceAutocompleteInput';
import { LiveTripGoogleMap } from '@/components/maps/LiveTripGoogleMap';
import { calculateOptimizedDrivingRoute, OptimizedRouteResult } from '@/lib/google-maps';

// Helper to get styling variant for trip status
function tripStatusVariant(status?: string): 'success' | 'warning' | 'info' | 'neutral' | 'danger' {
  if (!status) return 'neutral';
  const s = status.toLowerCase().replace(/_/g, ' ');
  if (s === 'completed') return 'success';
  if (s === 'running' || s === 'active' || s === 'in progress') return 'info';
  if (s === 'idle' || s === 'paused' || s === 'scheduled' || s === 'not started' || s === 'pending') return 'warning';
  if (s === 'cancelled') return 'danger';
  return 'neutral';
}

function normalizeStatus(status?: string): string {
  if (!status) return 'scheduled';
  const s = status.toLowerCase().replace(/_/g, ' ');
  if (s === 'in progress' || s === 'running' || s === 'active') return 'running';
  if (s === 'not started' || s === 'pending') return 'scheduled';
  if (s === 'completed') return 'completed';
  if (s === 'paused' || s === 'halted' || s === 'stopped') return 'paused';
  if (s === 'cancelled') return 'cancelled';
  return s;
}

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'Started', value: 'started' },
  { label: 'Completed', value: 'completed' },
];

function fmtDate(iso?: string) {
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

// Generate CSV Report matching the Flutter App format
function downloadTripCsv(trip: Trip) {
  const norm = normalizeStatus(trip.status);
  const distance = trip.distance ?? 0;
  const progress = norm === 'completed' ? 1.0 : trip.progress ?? 0;
  const defaultMil = (trip.defaultMileage || trip.default_mileage || 0) > 0 ? (trip.defaultMileage || trip.default_mileage)! : 4.0;
  const currentMil = trip.currentMileage ?? trip.current_mileage ?? defaultMil;
  const fuelUsed = trip.fuelUsed ?? trip.fuel_used ?? (norm === 'scheduled' ? 0 : (distance * progress) / defaultMil);
  const fuelSaved = trip.fuelSaved ?? trip.fuel_saved ?? 0;
  const moneySaved = trip.moneySaved ?? trip.money_saved ?? 0;
  const moneyWasted = trip.moneyWasted ?? trip.money_wasted ?? 0;
  const fuelWasted = trip.fuelWasted ?? trip.fuel_wasted ?? 0;
  const tollCount = trip.tollCount ?? 0;

  const idleMoney = trip.idleMoneyWasted ?? trip.idle_money_wasted ?? 0;
  const idleFuelLiters = trip.idleFuelWasted ?? trip.idle_fuel_wasted ?? (idleMoney / 100);
  const speedingFuel = trip.speedingFuelLoss ?? 0;
  const speedingMoney = trip.speedingMoneyLoss ?? 0;
  const theftFuel = trip.theftFuelLoss ?? 0;
  const theftMoney = trip.theftMoneyLoss ?? 0;

  const rows = [
    ['Trip Report'],
    ['ID', trip.id],
    ['Status', trip.status],
    ['From', trip.from || trip.origin || ''],
    ['To', trip.to || trip.destination || ''],
    ['Vehicle', trip.vehicle || ''],
    ['Driver', trip.driver || ''],
    ['Client', trip.client || ''],
    ['e-Way Bill', trip.ewayBill || trip.eway_bill || ''],
    ['Date', trip.date || trip.start_time || ''],
    ['Distance (km)', distance.toFixed(1)],
    ['Fuel Used (L)', fuelUsed.toFixed(1)],
    ['Default Mileage (km/l)', defaultMil.toFixed(1)],
    ['Current Mileage (km/l)', currentMil.toFixed(1)],
    ['Fuel Saved (L)', fuelSaved.toFixed(1)],
    ['Money Saved (INR)', moneySaved.toFixed(2)],
    ['Money Wasted (INR)', moneyWasted.toFixed(2)],
    ['Fuel Wasted (L)', fuelWasted.toFixed(1)],
    ['Tolls Passed', tollCount],
    ['Idle Fuel Wasted (L)', idleFuelLiters.toFixed(2)],
    ['Idle Money Wasted (INR)', idleMoney.toFixed(2)],
    ['Speeding Fuel Loss (L)', speedingFuel.toFixed(2)],
    ['Speeding Money Loss (INR)', speedingMoney.toFixed(2)],
    ['Theft Fuel Loss (L)', theftFuel.toFixed(2)],
    ['Theft Money Loss (INR)', theftMoney.toFixed(2)],
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `trip_${trip.id}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function TripsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals & Drawers State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTripData, setEditTripData] = useState<Trip | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [liveMapTrip, setLiveMapTrip] = useState<Trip | null>(null);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);

  // Route calculation optimization state for Create Modal
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeCalculationResult, setRouteCalculationResult] = useState<OptimizedRouteResult | null>(null);

  // Form State for Create Trip
  const [formData, setFormData] = useState({
    id: '',
    from: '',
    to: '',
    vehicle: '',
    driver: '',
    client: '',
    ewayBill: '',
    status: 'not started',
    distance: 0,
    date: new Date().toISOString().split('T')[0],
  });

  // Queries
  const { data: trips, isLoading, isError, refetch } = useQuery<Trip[]>({
    queryKey: queryKeys.trips(),
    queryFn: fetchTrips,
    staleTime: 30_000,
    retry: 2,
  });

  const { data: summary } = useQuery<TripSummary>({
    queryKey: queryKeys.tripSummary(),
    queryFn: () => fetchTripSummary(),
    staleTime: 60_000,
  });

  const { data: allVehicles } = useQuery<Vehicle[]>({
    queryKey: queryKeys.vehicles(),
    queryFn: fetchVehicles,
    staleTime: 30_000,
  });

  const { data: allDrivers } = useQuery<Driver[]>({
    queryKey: queryKeys.drivers(),
    queryFn: fetchDrivers,
    staleTime: 30_000,
  });

  const { data: availableVehicles } = useQuery<Vehicle[]>({
    queryKey: ['availableVehicles'],
    queryFn: fetchAvailableVehicles,
    staleTime: 10_000,
  });

  const { data: availableDrivers } = useQuery<Driver[]>({
    queryKey: ['availableDrivers'],
    queryFn: fetchAvailableDrivers,
    staleTime: 10_000,
  });

  // Combined lists for vehicles & drivers
  const driverList = useMemo(() => {
    const map = new Map<string, Driver>();
    (allDrivers ?? []).forEach((d) => map.set(d.name || d.id, d));
    (availableDrivers ?? []).forEach((d) => map.set(d.name || d.id, d));
    return Array.from(map.values());
  }, [availableDrivers, allDrivers]);

  const vehicleList = useMemo(() => {
    const map = new Map<string, Vehicle>();
    (allVehicles ?? []).forEach((v) => map.set(v.plate, v));
    (availableVehicles ?? []).forEach((v) => map.set(v.plate, v));
    return Array.from(map.values());
  }, [availableVehicles, allVehicles]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<Trip>) => createTrip(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tripSummary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles() });
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers() });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Trip> }) => updateTrip(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tripSummary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles() });
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers() });
      setEditTripData(null);
      if (selectedTrip && selectedTrip.id === updated?.id) {
        setSelectedTrip((prev) => (prev ? { ...prev, ...updated } : updated));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTrip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tripSummary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles() });
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers() });
      setDeletingTripId(null);
      if (selectedTrip?.id === deletingTripId) {
        setSelectedTrip(null);
      }
    },
  });

  const resetForm = () => {
    setFormData({
      id: `TRP-${Math.floor(100000 + Math.random() * 900000)}`,
      from: '',
      to: '',
      vehicle: '',
      driver: '',
      client: '',
      ewayBill: '',
      status: 'not started',
      distance: 0,
      date: new Date().toISOString().split('T')[0],
    });
    setRouteCalculationResult(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  // Optimize and calculate route using Google Directions API
  const handleCalculateRoute = async (start: string, end: string) => {
    if (!start.trim() || !end.trim() || start.trim().length < 2 || end.trim().length < 2) return;
    setIsCalculatingRoute(true);
    try {
      const result = await calculateOptimizedDrivingRoute(start.trim(), end.trim());
      if (result) {
        setRouteCalculationResult(result);
        setFormData((prev) => ({
          ...prev,
          distance: result.distanceKm,
        }));
      }
    } catch (err) {
      console.error('Route calculation error:', err);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id.trim() || !formData.from.trim() || !formData.to.trim()) return;
    createMutation.mutate({
      id: formData.id.trim(),
      from: formData.from.trim(),
      to: formData.to.trim(),
      vehicle: formData.vehicle,
      driver: formData.driver,
      client: formData.client.trim(),
      ewayBill: formData.ewayBill.trim(),
      status: formData.status,
      distance: Number(formData.distance) || (routeCalculationResult?.distanceKm ?? 0),
      date: formData.date,
      progress: formData.status === 'running' ? 0.05 : 0.0,
      tripCompleted: false,
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTripData) return;
    updateMutation.mutate({
      id: editTripData.id,
      data: {
        from: editTripData.from || editTripData.origin,
        to: editTripData.to || editTripData.destination,
        vehicle: editTripData.vehicle,
        driver: editTripData.driver,
        client: editTripData.client,
        ewayBill: editTripData.ewayBill,
        distance: Number(editTripData.distance) || 0,
        status: editTripData.status,
        tripCompleted: editTripData.status === 'completed',
      },
    });
  };

  // Quick Lifecycle Status Change
  const handleQuickStatusUpdate = (tripId: string, newStatus: string) => {
    const isCompleted = newStatus === 'completed';
    updateMutation.mutate({
      id: tripId,
      data: {
        status: newStatus,
        tripCompleted: isCompleted,
        ...(isCompleted ? { progress: 1.0, end_time: new Date().toISOString() } : {}),
      },
    });
  };

  // Swap Origin and Destination
  const handleSwapCities = () => {
    const newFrom = formData.to;
    const newTo = formData.from;
    setFormData((prev) => ({
      ...prev,
      from: newFrom,
      to: newTo,
    }));
    if (newFrom && newTo) {
      handleCalculateRoute(newFrom, newTo);
    }
  };

  // Compute KPIs exactly matching Flutter App
  const allTrips = trips ?? [];
  const runningCount = allTrips.filter((t) => {
    const s = normalizeStatus(t.status);
    return s === 'running';
  }).length;

  const completedCount = allTrips.filter((t) => {
    const s = normalizeStatus(t.status);
    return s === 'completed' || t.tripCompleted === true;
  }).length;

  const scheduledCount = allTrips.filter((t) => {
    const s = normalizeStatus(t.status);
    return s === 'scheduled';
  }).length;

  // Calculate Fuel Used (L) across all active/completed trips
  const totalFuelUsedLiters = allTrips.reduce((sum, t) => {
    const norm = normalizeStatus(t.status);
    if (norm === 'scheduled') return sum;
    const dist = (t.distance || 0) * (norm === 'completed' ? 1.0 : t.progress ?? 0);
    const mileage = (t.defaultMileage || t.default_mileage || 0) > 0 ? (t.defaultMileage || t.default_mileage)! : 4.0;
    const fuel = t.fuelUsed ?? t.fuel_used ?? (dist / mileage);
    return sum + (Number(fuel) || 0);
  }, 0);

  // Fuel Wasted & Money Wasted from summary or sum
  const totalFuelWastedLiters =
    summary?.totalFuelWastedLiters ??
    allTrips.reduce((sum, t) => sum + (t.fuelWasted ?? t.fuel_wasted ?? 0), 0);

  const totalMoneyWasted =
    summary?.totalMoneyWasted ??
    allTrips.reduce((sum, t) => sum + (t.moneyWasted ?? t.money_wasted ?? 0), 0);

  // Filtered trips list
  const filtered = allTrips.filter((t) => {
    const originStr = t.from || t.origin || '';
    const destStr = t.to || t.destination || '';
    const norm = normalizeStatus(t.status);

    const matchesSearch =
      !search ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      originStr.toLowerCase().includes(search.toLowerCase()) ||
      destStr.toLowerCase().includes(search.toLowerCase()) ||
      (t.vehicle && t.vehicle.toLowerCase().includes(search.toLowerCase())) ||
      (t.driver && t.driver.toLowerCase().includes(search.toLowerCase())) ||
      (t.client && t.client.toLowerCase().includes(search.toLowerCase())) ||
      (t.ewayBill && t.ewayBill.toLowerCase().includes(search.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === 'assigned') {
      matchesStatus = norm === 'scheduled';
    } else if (statusFilter === 'started') {
      matchesStatus = norm === 'running' || norm === 'paused';
    } else if (statusFilter === 'completed') {
      matchesStatus = norm === 'completed' || t.tripCompleted === true;
    }

    return matchesSearch && matchesStatus;
  });

  // Table Columns Definition
  const columns = [
    {
      key: 'id',
      header: 'Trip ID',
      render: (t: Trip) => (
        <div className="flex items-center gap-1.5">
          <span
            className="font-mono text-xs font-bold text-blue-700 hover:underline cursor-pointer"
            onClick={() => setSelectedTrip(t)}
          >
            {t.id}
          </span>
          {t.delayMinutes != null && t.delayMinutes > 0 && (
            <span className="inline-flex items-center rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
              DELAY {t.delayMinutes}M
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Route (From → To)',
      render: (t: Trip) => {
        const origin = t.from || t.origin || '—';
        const dest = t.to || t.destination || '—';
        return (
          <div className="flex flex-col gap-0.5 max-w-[200px]">
            <span className="text-xs font-semibold text-slate-800 truncate" title={origin}>
              {origin}
            </span>
            <span className="text-[11px] text-slate-400 truncate" title={dest}>
              → {dest}
            </span>
          </div>
        );
      },
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (t: Trip) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {t.vehicle || '—'}
        </span>
      ),
    },
    {
      key: 'driver',
      header: 'Driver',
      render: (t: Trip) => <span className="text-xs text-slate-700 font-medium">{t.driver || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t: Trip) => {
        const norm = normalizeStatus(t.status);
        return (
          <StatusBadge
            label={norm.toUpperCase()}
            variant={tripStatusVariant(t.status)}
            dot
          />
        );
      },
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (t: Trip) => {
        const norm = normalizeStatus(t.status);
        const prog = norm === 'completed' ? 1.0 : t.progress ?? 0;
        const pct = Math.min(100, Math.max(0, Math.round(prog * 100)));
        return (
          <div className="w-24 space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
              <span>{pct}%</span>
              <span>{t.distance != null ? `${t.distance}km` : ''}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  norm === 'completed' ? 'bg-emerald-500' : 'bg-blue-600'
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'fuel',
      header: 'Fuel Consumed',
      render: (t: Trip) => {
        const norm = normalizeStatus(t.status);
        const distance = t.distance ?? 0;
        const prog = norm === 'completed' ? 1.0 : t.progress ?? 0;
        const defaultMil = (t.defaultMileage || t.default_mileage || 0) > 0 ? (t.defaultMileage || t.default_mileage)! : 4.0;
        const fuel = t.fuelUsed ?? t.fuel_used ?? (norm === 'scheduled' ? 0 : (distance * prog) / defaultMil);
        return (
          <span className="text-xs font-semibold text-slate-700">
            {fuel > 0 ? `${fuel.toFixed(1)} L` : '—'}
          </span>
        );
      },
    },
    {
      key: 'date',
      header: 'Date / Time',
      render: (t: Trip) => (
        <span className="text-[11px] text-slate-500 font-medium">
          {fmtDate(t.date || t.start_time)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t: Trip) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLiveMapTrip(t)}
            title="Live Google Map View"
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
          >
            <MapIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSelectedTrip(t)}
            title="View Trip Details"
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          {normalizeStatus(t.status) !== 'completed' && (
            <button
              onClick={() => setEditTripData(t)}
              title="Edit Trip"
              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setDeletingTripId(t.id)}
            title="Delete Trip"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trip Management"
        subtitle="Schedule, track, and optimize fleet journeys with live Google Maps telemetry."
        actions={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Trip
          </button>
        }
      />

      {/* 6 Summary KPI Cards matching Flutter App _buildAllKpis */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="Total Trips"
          value={allTrips.length}
          subtitle="all time"
          icon={<Route className="h-4 w-4" />}
          accent="green"
          onClick={() => setStatusFilter('all')}
          actionText={statusFilter === 'all' ? 'Filtered' : 'Filter All'}
        />
        <StatCard
          title="Live Tracking"
          value={runningCount}
          subtitle="on road"
          icon={<Navigation className="h-4 w-4" />}
          accent="blue"
          onClick={() => setStatusFilter('started')}
          actionText={statusFilter === 'started' ? 'Filtered' : 'Filter Live'}
        />
        <StatCard
          title="Successful"
          value={completedCount}
          subtitle="delivered"
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="purple"
          onClick={() => setStatusFilter('completed')}
          actionText={statusFilter === 'completed' ? 'Filtered' : 'Filter Done'}
        />
        <StatCard
          title="Fuel Used"
          value={`${totalFuelUsedLiters.toFixed(1)} L`}
          subtitle="all trips"
          icon={<Fuel className="h-4 w-4" />}
          accent="cyan"
        />
        <StatCard
          title="Fuel Wasted"
          value={`${Number(totalFuelWastedLiters).toFixed(1)} L`}
          subtitle="all trips"
          icon={<TrendingDown className="h-4 w-4" />}
          accent="red"
        />
        <StatCard
          title="Money Wasted"
          value={`₹${Number(totalMoneyWasted).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="all trips"
          icon={<Coins className="h-4 w-4" />}
          accent="red"
        />
      </div>

      {isLoading && <LoadingSpinner label="Loading trips…" />}
      {isError && <ErrorState message="Could not load trips." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <SectionCard
          title={`Trips (${filtered.length}${allTrips.length ? ` / ${allTrips.length}` : ''})`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Tabs matching App */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={cn(
                      'rounded-md px-3 py-1 text-xs font-semibold transition-all',
                      statusFilter === f.value
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Card Grid View"
                  className={cn(
                    'p-1.5 rounded-md text-xs font-medium transition-colors',
                    viewMode === 'grid' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  title="Table View"
                  className={cn(
                    'p-1.5 rounded-md text-xs font-medium transition-colors',
                    viewMode === 'table' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                  )}
                >
                  <ListIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search trip, route, vehicle, driver…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-56 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          }
          bodyClassName={viewMode === 'table' ? 'p-0' : 'p-4'}
        >
          {filtered.length === 0 ? (
            <EmptyState
              message={
                search || statusFilter !== 'all'
                  ? 'No trips match your filter criteria.'
                  : 'No trips recorded yet. Click "New Trip" to start.'
              }
              icon={<MapPin className="h-10 w-10 text-slate-300" />}
            />
          ) : viewMode === 'table' ? (
            <DataTable columns={columns} data={filtered} rowKey={(t) => t.id} />
          ) : (
            /* CARD GRID VIEW MATCHING FLUTTER APP */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((t) => {
                const norm = normalizeStatus(t.status);
                const prog = norm === 'completed' ? 1.0 : t.progress ?? 0;
                const pct = Math.min(100, Math.max(0, Math.round(prog * 100)));
                const origin = t.from || t.origin || '—';
                const dest = t.to || t.destination || '—';

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTrip(t)}
                    className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                  >
                    {/* Top Row: ID, Delay Badge, Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {t.id}
                        </span>
                        {t.delayMinutes != null && t.delayMinutes > 0 && (
                          <span className="inline-flex items-center rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            DELAY {t.delayMinutes}M
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLiveMapTrip(t);
                          }}
                          title="Open Live Google Map"
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50"
                        >
                          <MapIcon className="h-3.5 w-3.5" />
                        </button>
                        {norm !== 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditTripData(t);
                            }}
                            title="Edit Trip"
                            className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100 opacity-80 group-hover:opacity-100"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <StatusBadge
                          label={norm.toUpperCase()}
                          variant={tripStatusVariant(t.status)}
                          dot
                        />
                      </div>
                    </div>

                    {/* Route */}
                    <div className="mb-3">
                      <p className="text-sm font-bold text-slate-800 leading-tight">
                        {origin} <span className="text-slate-400 font-normal">→</span> {dest}
                      </p>
                      {t.client && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Client: <span className="text-slate-600 font-medium">{t.client}</span>
                        </p>
                      )}
                    </div>

                    {/* Driver & Vehicle */}
                    <div className="flex items-center gap-4 text-xs mb-3 bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                        <span className="truncate font-semibold text-slate-800 dark:text-slate-100">{t.driver || 'No Driver'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Truck className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-100 truncate">{t.vehicle || 'No Vehicle'}</span>
                      </div>
                    </div>

                    {/* Progress Bar / Trip Metrics */}
                    {norm === 'running' || norm === 'active' || norm === 'completed' ? (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 font-medium">Trip Progress</span>
                          <span className={cn('font-bold', norm === 'completed' ? 'text-emerald-600' : 'text-blue-600')}>
                            {pct}% ({t.distance != null ? `${t.distance} km` : ''})
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              norm === 'completed' ? 'bg-emerald-500' : 'bg-blue-600'
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span>Distance: <strong className="text-slate-700">{t.distance ?? 0} km</strong></span>
                        <span>Date: <strong className="text-slate-700">{t.date || '—'}</strong></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      )}

      {/* CREATE TRIP MODAL WITH GOOGLE PLACES AUTOCOMPLETE & ROUTE OPTIMIZER */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule New Trip"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Trip ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Origin & Destination: Clean Grid Layout Matching Form Theme */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Origin with Auto-Suggestions */}
              <div>
                <PlaceAutocompleteInput
                  label="Origin / Starting Point"
                  required
                  placeholder="Type city, hub, airport, or landmark…"
                  value={formData.from}
                  iconColor="text-emerald-500"
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, from: val }));
                  }}
                  onPlaceSelect={(p) => {
                    const placeName = p.description || p.mainText;
                    setFormData((prev) => ({ ...prev, from: placeName }));
                    if (formData.to) {
                      handleCalculateRoute(placeName, formData.to);
                    }
                  }}
                />
              </div>

              {/* Destination with Auto-Suggestions */}
              <div>
                <PlaceAutocompleteInput
                  label="Destination / Going To"
                  required
                  placeholder="Type city, port, hub, or destination…"
                  value={formData.to}
                  iconColor="text-rose-500"
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, to: val }));
                  }}
                  onPlaceSelect={(p) => {
                    const placeName = p.description || p.mainText;
                    setFormData((prev) => ({ ...prev, to: placeName }));
                    if (formData.from) {
                      handleCalculateRoute(formData.from, placeName);
                    }
                  }}
                />
              </div>
            </div>

            {/* Quick Swap Button */}
            {(formData.from || formData.to) && (
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={handleSwapCities}
                  title="Swap Origin & Destination"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline transition-colors"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  <span>Swap Origin & Destination</span>
                </button>
              </div>
            )}

            {/* Optimized Route Calculation Badge */}
            {isCalculatingRoute ? (
              <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 animate-pulse">
                <Sparkles className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
                <span className="font-semibold">Calculating most optimized driving route…</span>
              </div>
            ) : routeCalculationResult ? (
              <div className="rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/80 border border-blue-200/90 p-3 space-y-1.5 text-xs text-slate-800 shadow-2xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-blue-900 font-extrabold text-xs">
                    <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                    Optimized Route: {routeCalculationResult.routeSummary}
                  </span>
                  <span className="text-blue-700 font-black text-sm">
                    {routeCalculationResult.distanceText}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5 border-t border-blue-100/80">
                  <span>Estimated Duration (HCV): <strong className="text-slate-900 font-bold">{routeCalculationResult.durationText}</strong></span>
                  <span className="font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">Heavy Freight Speed (~42 km/h)</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Vehicle</label>
              <select
                value={formData.vehicle}
                onChange={(e) => {
                  const selectedPlate = e.target.value;
                  const matchedVeh = vehicleList.find((v) => v.plate === selectedPlate);
                  setFormData((prev) => ({
                    ...prev,
                    vehicle: selectedPlate,
                    driver:
                      matchedVeh?.driver &&
                      matchedVeh.driver !== 'None' &&
                      matchedVeh.driver !== 'Unassigned' &&
                      matchedVeh.driver.trim() !== ''
                        ? matchedVeh.driver
                        : prev.driver,
                  }));
                }}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono"
              >
                <option value="">Select vehicle</option>
                {vehicleList.map((v) => (
                  <option key={v.plate} value={v.plate}>
                    {v.plate} {v.make ? `· ${v.make}` : ''} {v.model ? ` ${v.model}` : ''}
                    {v.driver && v.driver !== 'None' && v.driver !== 'Unassigned' ? ` (${v.driver})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Driver</label>
              <select
                value={formData.driver}
                onChange={(e) => {
                  const selectedDriverName = e.target.value;
                  const matchedDrv = driverList.find((d) => d.name === selectedDriverName || d.id === selectedDriverName);
                  setFormData((prev) => ({
                    ...prev,
                    driver: selectedDriverName,
                    vehicle:
                      matchedDrv?.vehicle &&
                      matchedDrv.vehicle !== 'None' &&
                      matchedDrv.vehicle !== 'Unassigned' &&
                      matchedDrv.vehicle.trim() !== '' &&
                      !prev.vehicle
                        ? matchedDrv.vehicle
                        : prev.vehicle,
                  }));
                }}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select driver</option>
                {driverList.map((d) => (
                  <option key={d.id || d.name} value={d.name}>
                    {d.name} {d.vehicle && d.vehicle !== 'None' && d.vehicle !== 'Unassigned' ? `(Assigned: ${d.vehicle})` : ''} {d.phone ? `· ${d.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Total Distance (km)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="Calculated automatically"
                value={formData.distance || ''}
                onChange={(e) => setFormData({ ...formData, distance: parseFloat(e.target.value) || 0 })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Client Name</label>
              <input
                type="text"
                placeholder="e.g. Reliance Logistics"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">E-Way Bill Number</label>
              <input
                type="text"
                maxLength={12}
                placeholder="12-digit number"
                value={formData.ewayBill}
                onChange={(e) => setFormData({ ...formData, ewayBill: e.target.value })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-semibold"
              >
                <option value="not started">Scheduled / Not Started</option>
                <option value="running">Active / Running</option>
              </select>
            </div>
          </div>

          {createMutation.isError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                {((createMutation.error as unknown) as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                  'Failed to create trip. Please try again.'}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? 'Dispatching…' : 'Dispatch Trip'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT TRIP MODAL WITH AUTOCOMPLETE */}
      <Modal
        isOpen={!!editTripData}
        onClose={() => setEditTripData(null)}
        title={`Edit Trip — ${editTripData?.id}`}
      >
        {editTripData && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <PlaceAutocompleteInput
                  label="Origin / From"
                  required
                  value={editTripData.from || editTripData.origin || ''}
                  onChange={(val) => setEditTripData({ ...editTripData, from: val, origin: val })}
                  onPlaceSelect={(p) => {
                    const val = p.description || p.mainText;
                    setEditTripData({ ...editTripData, from: val, origin: val });
                  }}
                />
              </div>
              <div>
                <PlaceAutocompleteInput
                  label="Destination / To"
                  required
                  value={editTripData.to || editTripData.destination || ''}
                  onChange={(val) => setEditTripData({ ...editTripData, to: val, destination: val })}
                  onPlaceSelect={(p) => {
                    const val = p.description || p.mainText;
                    setEditTripData({ ...editTripData, to: val, destination: val });
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Vehicle</label>
                <select
                  value={editTripData.vehicle || ''}
                  onChange={(e) => setEditTripData({ ...editTripData, vehicle: e.target.value })}
                  className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono"
                >
                  <option value="">Select vehicle</option>
                  {vehicleList.map((v) => (
                    <option key={v.plate} value={v.plate}>
                      {v.plate} {v.make ? `· ${v.make}` : ''} {v.model ? ` ${v.model}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Driver</label>
                <select
                  value={editTripData.driver || ''}
                  onChange={(e) => setEditTripData({ ...editTripData, driver: e.target.value })}
                  className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select driver</option>
                  {driverList.map((d) => (
                    <option key={d.id || d.name} value={d.name}>
                      {d.name} {d.vehicle && d.vehicle !== 'None' ? `(Assigned: ${d.vehicle})` : ''} {d.phone ? `· ${d.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Distance (km)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={editTripData.distance || ''}
                  onChange={(e) => setEditTripData({ ...editTripData, distance: parseFloat(e.target.value) || 0 })}
                  className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Client Name</label>
                <input
                  type="text"
                  value={editTripData.client || ''}
                  onChange={(e) => setEditTripData({ ...editTripData, client: e.target.value })}
                  className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">E-Way Bill</label>
                <input
                  type="text"
                  value={editTripData.ewayBill || ''}
                  onChange={(e) => setEditTripData({ ...editTripData, ewayBill: e.target.value })}
                  className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Trip Status</label>
                <select
                  value={editTripData.status}
                  onChange={(e) => setEditTripData({ ...editTripData, status: e.target.value })}
                  className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-semibold"
                >
                  <option value="not started">Scheduled / Not Started</option>
                  <option value="running">Active / Running</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {updateMutation.isError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  {((updateMutation.error as unknown) as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                    'Failed to update trip.'}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditTripData(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* FULLSCREEN LIVE GOOGLE MAP MODAL */}
      <Modal
        isOpen={!!liveMapTrip}
        onClose={() => setLiveMapTrip(null)}
        title={`Live Google Map Navigation — ${liveMapTrip?.id} (${liveMapTrip?.vehicle || 'Fleet Truck'})`}
      >
        {liveMapTrip && (
          <div className="space-y-4">
            <LiveTripGoogleMap
              trip={liveMapTrip}
              height="500px"
              showControls
              interactive
              autoAnimate
            />
            <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
              <span>Route: <strong className="text-slate-800">{liveMapTrip.from || liveMapTrip.origin} → {liveMapTrip.to || liveMapTrip.destination}</strong></span>
              <button
                onClick={() => setLiveMapTrip(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
              >
                Close Map
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* TRIP DETAILS DRAWER (DURING & AFTER TRIP) - FULL TELEMETRY & LIVE GOOGLE MAP */}
      <Drawer
        isOpen={!!selectedTrip}
        onClose={() => setSelectedTrip(null)}
        title={`Trip Details — ${selectedTrip?.id}`}
      >
        {selectedTrip && (() => {
          const norm = normalizeStatus(selectedTrip.status);
          const distance = selectedTrip.distance ?? 0;
          const prog = norm === 'completed' ? 1.0 : selectedTrip.progress ?? 0;
          const distCovered = norm === 'completed' ? distance : distance * prog;
          const distRemaining = norm === 'completed' ? 0 : Math.max(0, distance - distCovered);
          const defaultMil = (selectedTrip.defaultMileage || selectedTrip.default_mileage || 0) > 0
            ? (selectedTrip.defaultMileage || selectedTrip.default_mileage)!
            : 4.0;
          const currentMil = selectedTrip.currentMileage ?? selectedTrip.current_mileage ?? defaultMil;
          const fuelUsed = selectedTrip.fuelUsed ?? selectedTrip.fuel_used ?? (norm === 'scheduled' ? 0 : distCovered / defaultMil);
          const fuelSaved = selectedTrip.fuelSaved ?? selectedTrip.fuel_saved ?? 0;
          const moneySaved = selectedTrip.moneySaved ?? selectedTrip.money_saved ?? 0;
          const moneyWasted = selectedTrip.moneyWasted ?? selectedTrip.money_wasted ?? 0;
          const fuelWasted = selectedTrip.fuelWasted ?? selectedTrip.fuel_wasted ?? 0;
          const tollCount = selectedTrip.tollCount ?? 0;

          const idleMoney = selectedTrip.idleMoneyWasted ?? selectedTrip.idle_money_wasted ?? 0;
          const idleFuelLiters = selectedTrip.idleFuelWasted ?? selectedTrip.idle_fuel_wasted ?? (idleMoney / 100);
          const speedingFuel = selectedTrip.speedingFuelLoss ?? 0;
          const speedingMoney = selectedTrip.speedingMoneyLoss ?? 0;
          const theftFuel = selectedTrip.theftFuelLoss ?? 0;
          const theftMoney = selectedTrip.theftMoneyLoss ?? 0;

          return (
            <div className="space-y-5 pb-20">
              {/* LIVE GOOGLE MAP VIEW AT TOP OF DRAWER */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MapIcon className="h-3.5 w-3.5 text-blue-600" />
                    Live Route & Vehicle Movement
                  </span>
                  <button
                    onClick={() => setLiveMapTrip(selectedTrip)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Maximize2 className="h-3 w-3" /> Expand Map
                  </button>
                </div>
                <LiveTripGoogleMap
                  trip={selectedTrip}
                  height="260px"
                  showControls
                  interactive
                  autoAnimate
                />
              </div>

              {/* Header Badge & Route Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-900 text-white p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-300">TRIP ID: {selectedTrip.id}</span>
                  <div className="flex items-center gap-1.5">
                    {norm === 'completed' && (
                      <button
                        onClick={() => downloadTripCsv(selectedTrip)}
                        title="Download CSV Trip Report"
                        className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold px-2.5 py-1 rounded transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Report
                      </button>
                    )}
                    <StatusBadge
                      label={norm.toUpperCase()}
                      variant={tripStatusVariant(selectedTrip.status)}
                      dot
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From (Origin)</p>
                      <p className="text-sm font-semibold text-white">
                        {selectedTrip.from || selectedTrip.origin || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To (Destination)</p>
                      <p className="text-sm font-semibold text-white">
                        {selectedTrip.to || selectedTrip.destination || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle & Driver Association */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Truck className="h-4 w-4 text-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Vehicle</span>
                  </div>
                  <p className="font-mono text-xs font-bold text-slate-800">
                    {selectedTrip.vehicle || 'Not assigned'}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <User className="h-4 w-4 text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Driver</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedTrip.driver || 'Not assigned'}
                  </p>
                </div>
              </div>

              {/* TRIP INFORMATION / TELEMETRY BREAKDOWN */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Trip Information & Telemetry
                </p>
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white text-xs">
                  <div className="flex justify-between px-3 py-2">
                    <span className="text-slate-500 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-slate-400" /> Client</span>
                    <span className="font-semibold text-slate-800">{selectedTrip.client || '—'}</span>
                  </div>
                  <div className="flex justify-between px-3 py-2">
                    <span className="text-slate-500 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-slate-400" /> e-Way Bill</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedTrip.ewayBill || selectedTrip.eway_bill || '—'}</span>
                  </div>
                  <div className="flex justify-between px-3 py-2">
                    <span className="text-slate-500 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" /> Date</span>
                    <span className="text-slate-700 font-medium">{fmtDate(selectedTrip.date || selectedTrip.start_time)}</span>
                  </div>
                  <div className="flex justify-between px-3 py-2">
                    <span className="text-slate-500 flex items-center gap-1.5"><Route className="h-3.5 w-3.5 text-slate-400" /> Total Distance</span>
                    <span className="font-bold text-slate-800">{distance.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between px-3 py-2">
                    <span className="text-slate-500 flex items-center gap-1.5"><Navigation className="h-3.5 w-3.5 text-blue-500" /> Distance Covered</span>
                    <span className="font-bold text-blue-600">{distCovered.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between px-3 py-2">
                    <span className="text-slate-500 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> Remaining Distance</span>
                    <span className="font-semibold text-slate-700">{distRemaining.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between px-3 py-2 bg-blue-50/30">
                    <span className="text-slate-500 flex items-center gap-1.5"><Fuel className="h-3.5 w-3.5 text-blue-600" /> Fuel Used</span>
                    <span className="font-bold text-blue-700">{fuelUsed.toFixed(1)} L</span>
                  </div>
                  <div className="flex justify-between px-3 py-2">
                    <span className="text-slate-500 flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5 text-slate-400" /> Default Baseline Mileage</span>
                    <span className="font-semibold text-slate-700">{defaultMil.toFixed(1)} km/l</span>
                  </div>
                  <div className="flex justify-between px-3 py-2">
                    <span className="text-slate-500 flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-slate-400" /> Current Mileage</span>
                    <span className="font-semibold text-slate-700">{currentMil.toFixed(1)} km/l</span>
                  </div>
                  <div className="flex justify-between px-3 py-2 bg-emerald-50/40">
                    <span className="text-emerald-700 font-medium flex items-center gap-1.5"><Feather className="h-3.5 w-3.5 text-emerald-600" /> Fuel Saved</span>
                    <span className="font-bold text-emerald-700">{fuelSaved.toFixed(1)} L</span>
                  </div>
                  <div className="flex justify-between px-3 py-2 bg-emerald-50/40">
                    <span className="text-emerald-700 font-medium flex items-center gap-1.5"><Coins className="h-3.5 w-3.5 text-emerald-600" /> Money Saved</span>
                    <span className="font-bold text-emerald-700">₹{moneySaved.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between px-3 py-2 bg-rose-50/40">
                    <span className="text-rose-700 font-medium flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5 text-rose-600" /> Money Wasted</span>
                    <span className="font-bold text-rose-700">₹{moneyWasted.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between px-3 py-2 bg-rose-50/40">
                    <span className="text-rose-700 font-medium flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5 text-rose-600" /> Fuel Wasted</span>
                    <span className="font-bold text-rose-700">{fuelWasted.toFixed(1)} L</span>
                  </div>
                  <div className="flex justify-between px-3 py-2">
                    <span className="text-slate-500 flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-slate-400" /> Tolls Passed</span>
                    <span className="font-semibold text-slate-700">{tollCount}</span>
                  </div>
                </div>
              </div>

              {/* IDLE STATUS BREAKDOWN */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Idle Status
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Idle Fuel Wasted</span>
                    <p className="text-base font-bold text-amber-900 mt-1">{idleFuelLiters.toFixed(2)} L</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Idle Money Wasted</span>
                    <p className="text-base font-bold text-amber-900 mt-1">₹{idleMoney.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* OVERSPEEDING STATUS BREAKDOWN */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Overspeeding Status
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3">
                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Speeding Fuel Loss</span>
                    <p className="text-base font-bold text-rose-900 mt-1">{speedingFuel.toFixed(2)} L</p>
                  </div>
                  <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3">
                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Speeding Money Loss</span>
                    <p className="text-base font-bold text-rose-900 mt-1">₹{speedingMoney.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* FUEL THEFT STATUS BREAKDOWN */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Fuel Theft Status
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3">
                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Theft Fuel Loss</span>
                    <p className="text-base font-bold text-rose-900 mt-1">{theftFuel.toFixed(2)} L</p>
                  </div>
                  <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3">
                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Theft Money Loss</span>
                    <p className="text-base font-bold text-rose-900 mt-1">₹{theftMoney.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* E-WAY BILL DOCUMENT PREVIEW IF PRESENT */}
              {(selectedTrip.ewayBillUrl || selectedTrip.eway_bill_url) && (
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    e-Way Bill Document
                  </p>
                  <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                    <img
                      src={selectedTrip.ewayBillUrl || selectedTrip.eway_bill_url}
                      alt="e-Way Bill Document"
                      className="w-full h-44 object-cover"
                    />
                  </div>
                </div>
              )}

              {/* LIFECYCLE ACTION BUTTONS MATCHING FLUTTER APP */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                {norm === 'scheduled' && (
                  <button
                    onClick={() => handleQuickStatusUpdate(selectedTrip.id, 'running')}
                    disabled={updateMutation.isPending}
                    className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition-colors disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" />
                    Start Trip
                  </button>
                )}

                {(norm === 'running' || norm === 'active') && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleQuickStatusUpdate(selectedTrip.id, 'paused')}
                      disabled={updateMutation.isPending}
                      className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow transition-colors disabled:opacity-50"
                    >
                      <Pause className="h-4 w-4" />
                      Stop Trip / Pause
                    </button>
                    <button
                      onClick={() => handleQuickStatusUpdate(selectedTrip.id, 'completed')}
                      disabled={updateMutation.isPending}
                      className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Trip as Completed
                    </button>
                  </div>
                )}

                {norm === 'paused' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleQuickStatusUpdate(selectedTrip.id, 'running')}
                      disabled={updateMutation.isPending}
                      className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition-colors disabled:opacity-50"
                    >
                      <Play className="h-4 w-4" />
                      Resume Trip
                    </button>
                    <button
                      onClick={() => handleQuickStatusUpdate(selectedTrip.id, 'completed')}
                      disabled={updateMutation.isPending}
                      className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Trip as Completed
                    </button>
                  </div>
                )}

                {norm === 'completed' && (
                  <button
                    onClick={() => downloadTripCsv(selectedTrip)}
                    className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Trip Report (.csv)
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </Drawer>

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingTripId}
        onClose={() => setDeletingTripId(null)}
        onConfirm={() => deletingTripId && deleteMutation.mutate(deletingTripId)}
        title="Delete Trip"
        message={`Are you sure you want to delete Trip "${deletingTripId}"? This action cannot be undone.`}
        confirmText="Delete Trip"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
