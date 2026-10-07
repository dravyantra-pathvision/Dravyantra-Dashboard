'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Fuel,
  Activity,
  Gauge,
  Calendar,
  FileText,
  CheckCircle2,
  RotateCw,
  X,
  CreditCard,
  Cpu,
} from 'lucide-react';
import {
  SectionCard,
  StatCard,
  StatusBadge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  PageHeader,
  Modal,
  Drawer,
  ConfirmDialog,
} from '@/components/ui/primitives';
import { fetchVehicles, createVehicle, updateVehicle, deleteVehicle } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Vehicle, VehicleStatus } from '@/types';
import { cn } from '@/lib/utils';

function vehicleVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status?.toLowerCase()) {
    case 'running':
    case 'moving':
      return 'success';
    case 'idle':
      return 'warning';
    case 'stopped':
    case 'offline':
      return 'danger';
    default:
      return 'neutral';
  }
}

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Running', value: 'running' },
  { label: 'Idle', value: 'idle' },
  { label: 'Offline', value: 'offline' },
];

const VEHICLE_MAKES = ['Tata', 'Ashok Leyland', 'BharatBenz', 'Eicher', 'Mahindra', 'Force', 'Volvo', 'Scania', 'Other'];
const VEHICLE_TYPES = ['HCV', 'LCV', 'MCV', 'Trailer', 'Tanker', 'Tipper', 'Bus', 'Van', 'Car'];
const FUEL_TYPES = ['Diesel', 'CNG', 'Petrol', 'Electric', 'LNG'];

interface VehicleFormData {
  plate: string;
  make: string;
  model: string;
  type: string;
  year: number | string;
  fuel: number | string;
  fuel_capacity: number | string;
  fuel_type: string;
  mil: number | string;
  deviceId: string;
  odo: number | string;
  driver: string;
  next_service: string;
}

const initialForm: VehicleFormData = {
  plate: '',
  make: 'Tata',
  model: '',
  type: 'HCV',
  year: new Date().getFullYear(),
  fuel: 100,
  fuel_capacity: 300,
  fuel_type: 'Diesel',
  mil: 4.0,
  deviceId: '',
  odo: '',
  driver: '',
  next_service: '',
};

export default function VehiclesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal / Drawer state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [deletingPlate, setDeletingPlate] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState<VehicleFormData>(initialForm);

  const { data, isLoading, isFetching, isError, refetch } = useQuery<Vehicle[]>({
    queryKey: queryKeys.vehicles(),
    queryFn: fetchVehicles,
    staleTime: 30_000,
    retry: 2,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newVeh: Partial<Vehicle>) => createVehicle(newVeh),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles() });
      queryClient.invalidateQueries({ queryKey: queryKeys.liveLocations() });
      setIsAddOpen(false);
      setFormData(initialForm);
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error || err?.message || 'Failed to create vehicle');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ plate, data }: { plate: string; data: Partial<Vehicle> }) =>
      updateVehicle(plate, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles() });
      queryClient.invalidateQueries({ queryKey: queryKeys.liveLocations() });
      setEditingVehicle(null);
      if (selectedVehicle && editingVehicle && selectedVehicle.plate === editingVehicle.plate) {
        setSelectedVehicle((prev) => (prev ? {
          ...prev,
          ...formData,
          year: formData.year !== '' ? Number(formData.year) : prev.year,
          fuel: formData.fuel !== '' ? Number(formData.fuel) : prev.fuel,
          fuel_capacity: formData.fuel_capacity !== '' ? Number(formData.fuel_capacity) : prev.fuel_capacity,
          mil: formData.mil !== '' ? Number(formData.mil) : prev.mil,
          odo: formData.odo !== '' ? Number(formData.odo) : prev.odo,
          device_id: formData.deviceId.trim(),
          deviceId: formData.deviceId.trim(),
        } : null));
      }
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error || err?.message || 'Failed to update vehicle');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (plate: string) => deleteVehicle(plate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles() });
      queryClient.invalidateQueries({ queryKey: queryKeys.liveLocations() });
      setDeletingPlate(null);
      if (selectedVehicle && selectedVehicle.plate === deletingPlate) {
        setSelectedVehicle(null);
      }
    },
  });

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setFormError('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setFormData({
      plate: v.plate,
      make: v.make || 'Tata',
      model: v.model || '',
      type: v.type || 'HCV',
      year: v.year || new Date().getFullYear(),
      fuel: v.fuel ?? 100,
      fuel_capacity: v.fuel_capacity ?? 300,
      fuel_type: v.fuel_type || 'Diesel',
      mil: v.mil ?? v.mileage ?? 4.0,
      deviceId: v.device_id || v.deviceId || '',
      odo: v.odo !== undefined && v.odo !== null ? v.odo : '',
      driver: v.driver || '',
      next_service: v.next_service || v.nextService || '',
    });
    setFormError('');
    setEditingVehicle(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.plate.trim()) {
      setFormError('Vehicle registration plate is required.');
      return;
    }
    if (!formData.make.trim()) {
      setFormError('Manufacturer Make is required.');
      return;
    }
    if (!formData.model.trim()) {
      setFormError('Model Name is required.');
      return;
    }
    if (!formData.type.trim()) {
      setFormError('Vehicle Body Type is required.');
      return;
    }
    if (formData.year === '' || isNaN(Number(formData.year))) {
      setFormError('Manufacturing Year is required.');
      return;
    }
    if (!formData.fuel_type.trim()) {
      setFormError('Fuel Type is required.');
      return;
    }
    if (formData.fuel_capacity === '' || isNaN(Number(formData.fuel_capacity)) || Number(formData.fuel_capacity) <= 0) {
      setFormError('Fuel Tank Capacity (Liters) is required and must be greater than 0.');
      return;
    }
    if (formData.mil === '' || isNaN(Number(formData.mil)) || Number(formData.mil) <= 0) {
      setFormError('Baseline Mileage (km/L) is required and must be greater than 0.');
      return;
    }
    if (!formData.deviceId.trim()) {
      setFormError('IoT Telemetry Device ID is mandatory. Please assign our DravYantra device to this vehicle.');
      return;
    }
    if (formData.odo === '' || isNaN(Number(formData.odo))) {
      setFormError('Current Odometer Reading (km) is required.');
      return;
    }
    if (!formData.next_service) {
      setFormError('Next Service Due Date is required.');
      return;
    }

    const payload: Partial<Vehicle> = {
      plate: formData.plate.trim().toUpperCase(),
      make: formData.make,
      model: formData.model.trim(),
      type: formData.type,
      year: Number(formData.year),
      fuel: formData.fuel !== '' ? Number(formData.fuel) : 100,
      fuel_capacity: Number(formData.fuel_capacity),
      fuel_type: formData.fuel_type,
      mil: Number(formData.mil),
      deviceId: formData.deviceId.trim(),
      device_id: formData.deviceId.trim(),
      odo: Number(formData.odo),
      driver: formData.driver.trim() || undefined,
      next_service: formData.next_service,
      status: editingVehicle ? editingVehicle.status : 'offline',
      speed: editingVehicle ? editingVehicle.speed : 0,
    };

    if (editingVehicle) {
      updateMutation.mutate({ plate: editingVehicle.plate, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const vehicles = data ?? [];
  const runningCount = vehicles.filter((v) => v.status === 'running' || v.status === 'moving').length;
  const idleCount = vehicles.filter((v) => v.status === 'idle').length;
  const offlineCount = vehicles.filter((v) => v.status === 'offline' || v.status === 'stopped').length;

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      v.plate.toLowerCase().includes(q) ||
      (v.model ?? '').toLowerCase().includes(q) ||
      (v.make ?? '').toLowerCase().includes(q) ||
      (v.driver ?? '').toLowerCase().includes(q) ||
      (v.device_id ?? '').toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all' ||
      v.status === statusFilter ||
      (statusFilter === 'running' && (v.status === 'running' || v.status === 'moving')) ||
      (statusFilter === 'offline' && (v.status === 'offline' || v.status === 'stopped'));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        subtitle="Manage fleet registry, IoT telemetry assignments, fuel capacities, and compliance records."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh vehicle list"
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RotateCw className={cn('h-4 w-4', isFetching && 'animate-spin text-blue-600')} />
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Vehicle
            </button>
          </div>
        }
      />

      {/* ── Metric Summary Row ────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Registered"
          value={vehicles.length}
          subtitle="Fleet assets"
          icon={<Truck className="h-5 w-5" />}
          accent="blue"
          onClick={() => setStatusFilter('all')}
          actionText={statusFilter === 'all' ? 'Currently viewing all' : 'Filter: Show All'}
        />
        <StatCard
          title="Running / Moving"
          value={runningCount}
          subtitle="Active on road"
          icon={<Activity className="h-5 w-5" />}
          accent="green"
          onClick={() => setStatusFilter('running')}
          actionText={statusFilter === 'running' ? 'Active filter' : 'Filter Running'}
        />
        <StatCard
          title="Engine Idle"
          value={idleCount}
          subtitle="Stationary with ignition"
          icon={<Gauge className="h-5 w-5" />}
          accent="amber"
          onClick={() => setStatusFilter('idle')}
          actionText={statusFilter === 'idle' ? 'Active filter' : 'Filter Idle'}
        />
        <StatCard
          title="Offline / Stopped"
          value={offlineCount}
          subtitle="No telemetry stream"
          icon={<Truck className="h-5 w-5" />}
          accent="neutral"
          onClick={() => setStatusFilter('offline')}
          actionText={statusFilter === 'offline' ? 'Active filter' : 'Filter Offline'}
        />
      </div>

      {isLoading && <LoadingSpinner label="Loading fleet vehicle registry…" />}

      {isError && (
        <ErrorState
          message="Could not load vehicle records from the server."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (
        <SectionCard
          title={`Registered Vehicles (${filtered.length}${vehicles.length !== filtered.length ? ` of ${vehicles.length}` : ''})`}
          subtitle="Click on any vehicle row to inspect live telemetry and compliance records."
          actions={
            <div className="flex items-center gap-3">
              {/* Status Filters */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={cn(
                      'rounded-md px-3 py-1 text-xs font-semibold transition-all',
                      statusFilter === f.value
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search plate, model, driver, device…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-64 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          }
          bodyClassName="p-0"
        >
          {filtered.length === 0 ? (
            <EmptyState
              message={search || statusFilter !== 'all' ? 'No vehicles match your filter.' : 'No vehicles in fleet.'}
              description={search || statusFilter !== 'all' ? 'Try adjusting your search query or status filter.' : 'Add your first vehicle to start tracking telemetry and fuel efficiency.'}
              icon={<Truck className="h-10 w-10 text-slate-300" />}
              action={
                !search && statusFilter === 'all' ? (
                  <button
                    onClick={handleOpenAdd}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Vehicle
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75">
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Vehicle & Model
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Speed
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Fuel Tank
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Mileage
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Driver
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      IoT Device ID
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((v) => {
                    const fuelPct = Math.min(Math.max(v.fuel ?? 0, 0), 100);
                    const fuelLiters = v.fuel_capacity ? Math.round((fuelPct / 100) * v.fuel_capacity) : null;
                    const isAssigned = v.driver && v.driver !== 'Unassigned' && v.driver !== 'None' && v.driver.trim() !== '';

                    return (
                      <tr
                        key={v.plate}
                        onClick={() => setSelectedVehicle(v)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-100">
                              <Truck className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-mono text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {v.plate}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {v.make ? `${v.make} ` : ''}
                                {v.model || v.type || 'HCV'}
                                {v.year ? ` · ${v.year}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadge
                            label={v.status ? v.status.toUpperCase() : 'OFFLINE'}
                            variant={vehicleVariant(v.status)}
                            dot
                          />
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              'font-mono text-xs font-bold',
                              v.speed > 0 ? 'text-blue-700' : 'text-slate-400'
                            )}
                          >
                            {v.speed > 0 ? `${v.speed} km/h` : '0 km/h'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-semibold text-slate-700">{fuelPct}%</span>
                              {fuelLiters != null && (
                                <span className="text-slate-400">{fuelLiters}L</span>
                              )}
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  fuelPct > 50
                                    ? 'bg-emerald-500'
                                    : fuelPct > 20
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                )}
                                style={{ width: `${fuelPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-xs text-slate-700">
                            {v.mil ?? v.mileage ?? 4.0} <span className="text-[10px] text-slate-400 font-normal">km/L</span>
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          {isAssigned ? (
                            <span className="text-xs font-medium text-slate-800">{v.driver}</span>
                          ) : (
                            <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              Unassigned
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {v.device_id || v.deviceId ? (
                            <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">
                              {v.device_id || v.deviceId}
                            </span>
                          ) : (
                            <span className="text-rose-500 text-xs font-semibold">Not Assigned</span>
                          )}
                        </td>

                        <td
                          className="px-4 py-3.5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedVehicle(v)}
                              title="View Details"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(v)}
                              title="Edit Vehicle"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingPlate(v.plate)}
                              title="Delete Vehicle"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── ADD / EDIT VEHICLE MODAL ──────────────────────────────── */}
      <Modal
        isOpen={isAddOpen || editingVehicle !== null}
        onClose={() => {
          setIsAddOpen(false);
          setEditingVehicle(null);
          setFormError('');
        }}
        title={editingVehicle ? `Edit Vehicle — ${editingVehicle.plate}` : 'Add New Fleet Vehicle'}
        subtitle="Configure vehicle specifications, fuel limits, and IoT telemetry bindings."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Registration Plate */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Registration Plate <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={editingVehicle !== null}
                placeholder="e.g. KA 01 AB 1234"
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs uppercase font-mono font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>

            {/* Vehicle Make */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Manufacturer Make <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 bg-white focus:border-blue-500"
              >
                {VEHICLE_MAKES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Model Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Signa 4825.TK"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 focus:border-blue-500"
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Vehicle Body Type <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 bg-white focus:border-blue-500"
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Manufacturing Year */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Manufacturing Year <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={2000}
                max={2035}
                placeholder="2026"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 focus:border-blue-500"
              />
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Fuel Type <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 bg-white focus:border-blue-500"
              >
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Tank Capacity */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Fuel Tank Capacity (Liters) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={10}
                max={2000}
                placeholder="300"
                value={formData.fuel_capacity}
                onChange={(e) => setFormData({ ...formData, fuel_capacity: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 focus:border-blue-500"
              />
            </div>

            {/* Baseline Mileage */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Baseline Mileage (km/L) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                step="0.1"
                min={0.5}
                max={30}
                placeholder="4.0"
                value={formData.mil}
                onChange={(e) => setFormData({ ...formData, mil: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 focus:border-blue-500"
              />
            </div>

            {/* IoT Device ID (Mandatory) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                DravYantra IoT Device ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DEV-001 or DEV-SIM-001"
                value={formData.deviceId}
                onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-mono text-slate-800 focus:border-blue-500"
              />
            </div>

            {/* Odometer */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Current Odometer (km) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                placeholder="0"
                value={formData.odo}
                onChange={(e) => setFormData({ ...formData, odo: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 focus:border-blue-500"
              />
            </div>

            {/* Next Service Date */}
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Next Service Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.next_service}
                onChange={(e) => setFormData({ ...formData, next_service: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setEditingVehicle(null);
                setFormError('');
              }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving…'
                : editingVehicle
                ? 'Save Changes'
                : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── VEHICLE DETAILS DRAWER ─────────────────────────────────── */}
      <Drawer
        isOpen={selectedVehicle !== null}
        onClose={() => setSelectedVehicle(null)}
        title={selectedVehicle?.plate || 'Vehicle Details'}
        subtitle={`${selectedVehicle?.make ? `${selectedVehicle.make} ` : ''}${selectedVehicle?.model || 'HCV'} · ${selectedVehicle?.type || 'HCV'}`}
        width="lg"
      >
        {selectedVehicle && (
          <div className="space-y-6">
            {/* Live Status Header */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-mono text-sm font-bold text-slate-900">{selectedVehicle.plate}</p>
                  <p className="text-xs text-slate-500">
                    {selectedVehicle.driver ? `Assigned to ${selectedVehicle.driver}` : 'No driver assigned'}
                  </p>
                </div>
              </div>
              <StatusBadge
                label={selectedVehicle.status ? selectedVehicle.status.toUpperCase() : 'OFFLINE'}
                variant={vehicleVariant(selectedVehicle.status)}
                dot
              />
            </div>

            {/* Key Telemetry Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-100 bg-white p-3 text-center shadow-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400">Current Speed</p>
                <p className="text-lg font-bold text-blue-700 mt-0.5">{selectedVehicle.speed || 0} km/h</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 text-center shadow-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400">Fuel Level</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{selectedVehicle.fuel ?? 0}%</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 text-center shadow-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400">Mileage</p>
                <p className="text-lg font-bold text-emerald-600 mt-0.5">
                  {selectedVehicle.mil ?? selectedVehicle.mileage ?? 4.0} km/L
                </p>
              </div>
            </div>

            {/* Specifications Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-600" />
                Vehicle Specifications
              </h4>
              <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                <span className="text-slate-500">Manufacturer:</span>
                <span className="font-semibold text-slate-800 text-right">{selectedVehicle.make || '—'}</span>

                <span className="text-slate-500">Model:</span>
                <span className="font-semibold text-slate-800 text-right">{selectedVehicle.model || '—'}</span>

                <span className="text-slate-500">Body Type:</span>
                <span className="font-semibold text-slate-800 text-right">{selectedVehicle.type || '—'}</span>

                <span className="text-slate-500">Model Year:</span>
                <span className="font-semibold text-slate-800 text-right">{selectedVehicle.year || '—'}</span>

                <span className="text-slate-500">Tank Capacity:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {selectedVehicle.fuel_capacity ? `${selectedVehicle.fuel_capacity} L` : '—'}
                </span>

                <span className="text-slate-500">Fuel Type:</span>
                <span className="font-semibold text-slate-800 text-right">{selectedVehicle.fuel_type || '—'}</span>

                <span className="text-slate-500">IoT Device ID:</span>
                <span className="font-mono font-semibold text-blue-600 text-right">
                  {selectedVehicle.device_id || selectedVehicle.deviceId || 'Not Assigned'}
                </span>
              </div>
            </div>

            {/* Maintenance & Diagnostics Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                Maintenance & Diagnostics
              </h4>
              <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                <span className="text-slate-500">Odometer Reading:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {selectedVehicle.odo != null ? `${Math.round(selectedVehicle.odo).toLocaleString('en-IN')} km` : '—'}
                </span>

                <span className="text-slate-500">Next Service Due:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {selectedVehicle.next_service || selectedVehicle.nextService || '—'}
                </span>

                <span className="text-slate-500">Engine Health Score:</span>
                <span className="font-semibold text-emerald-600 text-right">
                  {selectedVehicle.health ?? 100}%
                </span>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  const v = selectedVehicle;
                  setSelectedVehicle(null);
                  handleOpenEdit(v);
                }}
                className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit Vehicle
              </button>
              <button
                onClick={() => {
                  const plate = selectedVehicle.plate;
                  setSelectedVehicle(null);
                  setDeletingPlate(plate);
                }}
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* ── DELETE CONFIRMATION DIALOG ────────────────────────────── */}
      <ConfirmDialog
        isOpen={deletingPlate !== null}
        onClose={() => setDeletingPlate(null)}
        onConfirm={() => deletingPlate && deleteMutation.mutate(deletingPlate)}
        isLoading={deleteMutation.isPending}
        title="Confirm Vehicle Deletion"
        description={`Are you sure you want to delete vehicle ${deletingPlate}? This will automatically unassign its IoT device and dissociate active trip references.`}
        confirmLabel="Delete Vehicle"
        variant="danger"
      />
    </div>
  );
}

