'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Shield,
  Truck,
  Phone,
  Calendar,
  RotateCw,
  AlertTriangle,
  Award,
  Link as LinkIcon,
  CheckCircle2,
  Flame,
  UserCheck,
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
import {
  fetchDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  fetchVehicles,
  updateVehicle,
} from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Driver, Vehicle } from '@/types';
import { cn } from '@/lib/utils';

function driverStatusVariant(status: string): 'success' | 'warning' | 'info' | 'neutral' | 'danger' {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'success';
    case 'on_duty':
    case 'on duty':
    case 'on_trip':
      return 'info';
    case 'idle':
      return 'warning';
    case 'on_leave':
    case 'on leave':
      return 'neutral';
    case 'inactive':
      return 'danger';
    default:
      return 'neutral';
  }
}

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'On Duty', value: 'on_duty' },
  { label: 'Idle', value: 'idle' },
  { label: 'On Leave', value: 'on_leave' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

interface DriverFormData {
  id: string;
  name: string;
  phone: string;
  age: number | string;
  exp: number | string;
  lic: string;
  lic_exp: string;
  blood: string;
  vehicle: string;
  status: string;
  score: number | string;
  home: string;
}

const initialForm: DriverFormData = {
  id: '',
  name: '',
  phone: '',
  age: 32,
  exp: 6,
  lic: '',
  lic_exp: '',
  blood: 'O+',
  vehicle: '',
  status: 'Active',
  score: 100,
  home: '',
};

function ScoreIndicator({ score }: { score: number }) {
  const s = Math.min(Math.max(score || 0, 0), 100);
  const color =
    s >= 85 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
    s >= 65 ? 'text-amber-700 bg-amber-50 border-amber-200' :
    'text-rose-700 bg-rose-50 border-rose-200';

  const barColor =
    s >= 85 ? 'bg-emerald-500' :
    s >= 65 ? 'bg-amber-500' :
    'bg-rose-500';

  return (
    <div className="w-28 space-y-1">
      <div className="flex items-center justify-between">
        <span className={cn('font-mono font-bold text-xs px-1.5 py-0.2 rounded border', color)}>
          {s}/100
        </span>
        <span className="text-[10px] text-slate-400 font-medium">
          {s >= 85 ? 'Excellent' : s >= 65 ? 'Fair' : 'Risk'}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${s}%` }} />
      </div>
    </div>
  );
}

export default function DriversPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal / Drawer state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [assigningDriver, setAssigningDriver] = useState<Driver | null>(null);
  const [assignedVehiclePlate, setAssignedVehiclePlate] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState<DriverFormData>(initialForm);

  const { data: driversData, isLoading, isFetching, isError, refetch } = useQuery<Driver[]>({
    queryKey: queryKeys.drivers(),
    queryFn: fetchDrivers,
    staleTime: 30_000,
    retry: 2,
  });

  const { data: vehiclesData } = useQuery<Vehicle[]>({
    queryKey: queryKeys.vehicles(),
    queryFn: fetchVehicles,
    staleTime: 60_000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newDriver: Partial<Driver>) => createDriver(newDriver),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers() });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles() });
      setIsAddOpen(false);
      setFormData(initialForm);
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error || err?.message || 'Failed to create driver');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Driver> }) => updateDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers() });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles() });
      setEditingDriver(null);
      if (selectedDriver && editingDriver && selectedDriver.id === editingDriver.id) {
        setSelectedDriver((prev) => (prev ? {
          ...prev,
          ...formData,
          age: formData.age !== '' ? Number(formData.age) : prev.age,
          exp: formData.exp !== '' ? Number(formData.exp) : prev.exp,
          score: formData.score !== '' ? Number(formData.score) : prev.score,
        } : null));
      }
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error || err?.message || 'Failed to update driver');
    },
  });

  const assignVehicleMutation = useMutation({
    mutationFn: async ({ driver, vehiclePlate }: { driver: Driver; vehiclePlate: string }) => {
      // 1. Update driver record with vehicle plate
      await updateDriver(driver.id, { vehicle: vehiclePlate });
      // 2. If assigning a vehicle, update that vehicle record with driver's name
      if (vehiclePlate) {
        await updateVehicle(vehiclePlate, { driver: driver.name });
      }
      // 3. If driver had a previous vehicle, clear that previous vehicle's driver field
      if (driver.vehicle && driver.vehicle !== vehiclePlate) {
        await updateVehicle(driver.vehicle, { driver: '' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers() });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles() });
      setAssigningDriver(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers() });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles() });
      setDeletingId(null);
      if (selectedDriver && selectedDriver.id === deletingId) {
        setSelectedDriver(null);
      }
    },
  });

  const handleOpenAdd = () => {
    const nextId = `DRV-${String((driversData?.length ?? 0) + 1).padStart(3, '0')}`;
    setFormData({ ...initialForm, id: nextId });
    setFormError('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setFormData({
      id: d.id,
      name: d.name,
      phone: d.phone,
      age: d.age || 30,
      exp: d.exp || 5,
      lic: d.lic || '',
      lic_exp: d.lic_exp || d.licExp || '',
      blood: d.blood || 'O+',
      vehicle: d.vehicle || '',
      status: d.status || 'Active',
      score: d.score ?? 100,
      home: d.home || '',
    });
    setFormError('');
    setEditingDriver(d);
  };

  const handleOpenAssign = (d: Driver) => {
    setAssigningDriver(d);
    setAssignedVehiclePlate(d.vehicle || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Driver name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Driver contact phone is required.');
      return;
    }
    if (!formData.id.trim()) {
      setFormError('Driver ID is required.');
      return;
    }

    const payload: Partial<Driver> = {
      id: formData.id.trim(),
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      age: formData.age !== '' ? Number(formData.age) : 30,
      exp: formData.exp !== '' ? Number(formData.exp) : 0,
      lic: formData.lic.trim(),
      lic_exp: formData.lic_exp || undefined,
      blood: formData.blood,
      vehicle: formData.vehicle || undefined,
      status: formData.status,
      score: formData.score !== '' ? Number(formData.score) : 100,
      home: formData.home.trim() || undefined,
    };

    if (editingDriver) {
      updateMutation.mutate({ id: editingDriver.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const drivers = driversData ?? [];
  const vehicles = vehiclesData ?? [];

  const activeCount = drivers.filter(
    (d) => d.status?.toLowerCase() === 'active' || d.status?.toLowerCase() === 'on_duty' || d.status?.toLowerCase() === 'on duty'
  ).length;
  const assignedCount = drivers.filter((d) => d.vehicle && d.vehicle !== 'Unassigned' && d.vehicle.trim() !== '').length;
  const avgScore = drivers.length > 0 ? Math.round(drivers.reduce((acc, d) => acc + (d.score ?? 100), 0) / drivers.length) : 100;

  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      d.name.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      (d.lic ?? '').toLowerCase().includes(q) ||
      (d.vehicle ?? '').toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all' ||
      d.status?.toLowerCase() === statusFilter.toLowerCase() ||
      (statusFilter === 'on_duty' && (d.status?.toLowerCase() === 'on duty' || d.status?.toLowerCase() === 'on_trip')) ||
      (statusFilter === 'on_leave' && (d.status?.toLowerCase() === 'on leave' || d.on_leave));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        subtitle="Manage fleet driver profiles, commercial license verifications, vehicle assignments, and safety scores."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh driver list"
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RotateCw className={cn('h-4 w-4', isFetching && 'animate-spin text-blue-600')} />
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Driver
            </button>
          </div>
        }
      />

      {/* ── Driver Fleet KPIs ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Drivers"
          value={drivers.length}
          subtitle="Registered staff"
          icon={<Users className="h-5 w-5" />}
          accent="blue"
          onClick={() => setStatusFilter('all')}
          actionText={statusFilter === 'all' ? 'Currently viewing all' : 'Show All Staff'}
        />
        <StatCard
          title="Active / On Duty"
          value={activeCount}
          subtitle={`${drivers.length - activeCount} off-duty / leave`}
          icon={<UserCheck className="h-5 w-5" />}
          accent="green"
          onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
          actionText={statusFilter === 'active' ? 'Active filter' : 'Filter On-Duty'}
        />
        <StatCard
          title="Vehicles Assigned"
          value={assignedCount}
          subtitle={`${drivers.length - assignedCount} unassigned`}
          icon={<Truck className="h-5 w-5" />}
          accent="purple"
          onClick={() => setStatusFilter('all')}
          actionText="View Vehicle Links"
        />
        <StatCard
          title="Avg Safety Score"
          value={`${avgScore}/100`}
          subtitle="Fleet-wide safety index"
          icon={<Shield className="h-5 w-5" />}
          accent={avgScore >= 80 ? 'green' : 'amber'}
          trend={{ value: `${avgScore}%`, isPositive: avgScore >= 80 }}
          onClick={() => setStatusFilter('all')}
          actionText="Safety Scorecard"
        />
      </div>

      {isLoading && <LoadingSpinner label="Loading fleet driver registry…" />}

      {isError && (
        <ErrorState
          message="Could not load driver records from the server."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (
        <SectionCard
          title={`Registered Drivers (${filtered.length}${drivers.length !== filtered.length ? ` of ${drivers.length}` : ''})`}
          subtitle="Click on any driver row to inspect detailed performance scorecard and license status."
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
                  placeholder="Search name, phone, license, vehicle…"
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
              message={search || statusFilter !== 'all' ? 'No drivers match your filter.' : 'No drivers in fleet.'}
              description={search || statusFilter !== 'all' ? 'Try adjusting your search query or status filter.' : 'Add your first driver to assign trips and monitor safety performance.'}
              icon={<Users className="h-10 w-10 text-slate-300" />}
              action={
                !search && statusFilter === 'all' ? (
                  <button
                    onClick={handleOpenAdd}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Driver
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
                      Driver Profile
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      License & Blood
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Assigned Vehicle
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Safety Score
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Completed Trips
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Infractions
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((d) => {
                    const initials = d.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <tr
                        key={d.id}
                        onClick={() => setSelectedDriver(d)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200">
                              {initials || 'DR'}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                                {d.name}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {d.phone}
                                <span className="text-slate-300">·</span>
                                <span className="font-mono text-[10px] text-slate-400">{d.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div>
                            <div className="font-mono text-xs font-semibold text-slate-800">
                              {d.lic || '—'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {d.blood ? `Group ${d.blood}` : ''}
                              {d.exp ? ` · ${d.exp} yrs exp` : ''}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          {d.vehicle && d.vehicle !== 'Unassigned' && d.vehicle.trim() !== '' ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {d.vehicle}
                              </span>
                              <button
                                onClick={() => handleOpenAssign(d)}
                                title="Change Vehicle Assignment"
                                className="text-slate-400 hover:text-blue-600 transition-colors"
                              >
                                <LinkIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenAssign(d)}
                              className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                              Assign Vehicle
                            </button>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadge
                            label={d.status ? d.status.replace('_', ' ').toUpperCase() : 'ACTIVE'}
                            variant={driverStatusVariant(d.status)}
                            dot
                          />
                        </td>

                        <td className="px-4 py-3.5">
                          <ScoreIndicator score={d.score} />
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-xs text-slate-700">
                            {d.trips_count ?? d.trips ?? 0}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">trips</span>
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              title="Harsh Braking Incidents"
                              className={cn(
                                'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                                (d.harsh ?? 0) > 3
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                  : 'text-slate-500 bg-slate-50'
                              )}
                            >
                              {d.harsh ?? 0} Braking
                            </span>
                            <span
                              title="Overspeeding Incidents"
                              className={cn(
                                'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                                (d.over_speed ?? 0) > 3
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                  : 'text-slate-500 bg-slate-50'
                              )}
                            >
                              {d.over_speed ?? 0} Speed
                            </span>
                          </div>
                        </td>

                        <td
                          className="px-4 py-3.5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedDriver(d)}
                              title="View Profile"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(d)}
                              title="Edit Driver"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(d.id)}
                              title="Delete Driver"
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

      {/* ── ADD / EDIT DRIVER MODAL ────────────────────────────────── */}
      <Modal
        isOpen={isAddOpen || editingDriver !== null}
        onClose={() => {
          setIsAddOpen(false);
          setEditingDriver(null);
          setFormError('');
        }}
        title={editingDriver ? `Edit Driver — ${editingDriver.name}` : 'Register New Fleet Driver'}
        subtitle="Manage personal records, commercial driving license, and baseline scorecard."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Driver ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Driver Staff ID *
              </label>
              <input
                type="text"
                required
                disabled={editingDriver !== null}
                placeholder="e.g. DRV-001"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rajesh Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-mono text-slate-900 focus:border-blue-500"
              />
            </div>

            {/* Driving License Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Driving License Number
              </label>
              <input
                type="text"
                placeholder="e.g. DL-KA-2021-0012345"
                value={formData.lic}
                onChange={(e) => setFormData({ ...formData, lic: e.target.value.toUpperCase() })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs uppercase font-mono text-slate-900 focus:border-blue-500"
              />
            </div>

            {/* License Expiry Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                License Expiry Date
              </label>
              <input
                type="date"
                value={formData.lic_exp}
                onChange={(e) => setFormData({ ...formData, lic_exp: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 focus:border-blue-500"
              />
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Blood Group
              </label>
              <select
                value={formData.blood}
                onChange={(e) => setFormData({ ...formData, blood: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 bg-white focus:border-blue-500"
              >
                {BLOOD_GROUPS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                min={18}
                max={75}
                placeholder="32"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 focus:border-blue-500"
              />
            </div>

            {/* Driving Experience */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Experience (Years)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                placeholder="6"
                value={formData.exp}
                onChange={(e) => setFormData({ ...formData, exp: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 focus:border-blue-500"
              />
            </div>

            {/* Initial Assigned Vehicle */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Assigned Vehicle
              </label>
              <select
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 bg-white focus:border-blue-500"
              >
                <option value="">Unassigned</option>
                {vehicles.map((v) => (
                  <option key={v.plate} value={v.plate}>
                    {v.plate} ({v.model || v.type || 'Vehicle'})
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 bg-white focus:border-blue-500"
              >
                <option value="Active">Active</option>
                <option value="On Duty">On Duty</option>
                <option value="Idle">Idle</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Safety Score Baseline */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Safety Score (0–100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                placeholder="100"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 focus:border-blue-500"
              />
            </div>

            {/* Base City */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Hometown / Base City
              </label>
              <input
                type="text"
                placeholder="e.g. Bengaluru"
                value={formData.home}
                onChange={(e) => setFormData({ ...formData, home: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setEditingDriver(null);
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
                : editingDriver
                ? 'Save Changes'
                : 'Register Driver'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── ASSIGN VEHICLE MODAL ──────────────────────────────────── */}
      <Modal
        isOpen={assigningDriver !== null}
        onClose={() => setAssigningDriver(null)}
        title={`Assign Vehicle to ${assigningDriver?.name || 'Driver'}`}
        subtitle="Select a fleet vehicle to bind to this driver."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Select Vehicle
            </label>
            <select
              value={assignedVehiclePlate}
              onChange={(e) => setAssignedVehiclePlate(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 px-3 text-xs text-slate-800 bg-white focus:border-blue-500 font-mono"
            >
              <option value="">Unassigned (No Vehicle)</option>
              {vehicles.map((v) => (
                <option key={v.plate} value={v.plate}>
                  {v.plate} — {v.make ? `${v.make} ` : ''}{v.model || v.type || 'HCV'}
                  {v.driver ? ` (Currently: ${v.driver})` : ' (Available)'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAssigningDriver(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={assignVehicleMutation.isPending}
              onClick={() => {
                if (assigningDriver) {
                  assignVehicleMutation.mutate({
                    driver: assigningDriver,
                    vehiclePlate: assignedVehiclePlate,
                  });
                }
              }}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {assignVehicleMutation.isPending ? 'Updating…' : 'Save Assignment'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── DRIVER PROFILE DRAWER ─────────────────────────────────── */}
      <Drawer
        isOpen={selectedDriver !== null}
        onClose={() => setSelectedDriver(null)}
        title={selectedDriver?.name || 'Driver Profile'}
        subtitle={`Staff ID: ${selectedDriver?.id || '—'} · ${selectedDriver?.status || 'Active'}`}
        width="lg"
      >
        {selectedDriver && (
          <div className="space-y-6">
            {/* Header Identity Card */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm">
                  {selectedDriver.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'DR'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{selectedDriver.name}</p>
                  <p className="text-xs text-slate-500">{selectedDriver.phone}</p>
                  <p className="font-mono text-[10px] text-slate-400 mt-0.5">ID: {selectedDriver.id}</p>
                </div>
              </div>
              <StatusBadge
                label={selectedDriver.status ? selectedDriver.status.replace('_', ' ').toUpperCase() : 'ACTIVE'}
                variant={driverStatusVariant(selectedDriver.status)}
                dot
              />
            </div>

            {/* Scorecard Overview */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                Safety Scorecard & Behavioral Index
              </h4>
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Safety Index</p>
                  <p className="text-lg font-bold text-blue-700 mt-0.5">{selectedDriver.score ?? 100}/100</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Trips Done</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedDriver.trips_count ?? selectedDriver.trips ?? 0}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Rating</p>
                  <p className="text-lg font-bold text-amber-600 mt-0.5">
                    {selectedDriver.rating != null ? `${selectedDriver.rating.toFixed(1)} ★` : '—'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div className="rounded-lg border border-slate-100 p-2 text-center">
                  <span className="text-slate-400 block text-[10px]">Harsh Braking</span>
                  <span className="font-bold text-slate-800">{selectedDriver.harsh ?? 0} events</span>
                </div>
                <div className="rounded-lg border border-slate-100 p-2 text-center">
                  <span className="text-slate-400 block text-[10px]">Overspeeding</span>
                  <span className="font-bold text-slate-800">{selectedDriver.over_speed ?? 0} events</span>
                </div>
                <div className="rounded-lg border border-slate-100 p-2 text-center">
                  <span className="text-slate-400 block text-[10px]">Deviations</span>
                  <span className="font-bold text-slate-800">{selectedDriver.deviation ?? 0} events</span>
                </div>
              </div>
            </div>

            {/* License & Personal Credentials */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-600" />
                License & Credentials
              </h4>
              <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                <span className="text-slate-500">Commercial License:</span>
                <span className="font-mono font-bold text-slate-900 text-right">
                  {selectedDriver.lic || '—'}
                </span>

                <span className="text-slate-500">License Expiry:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {selectedDriver.lic_exp || selectedDriver.licExp || '—'}
                </span>

                <span className="text-slate-500">Blood Group:</span>
                <span className="font-semibold text-slate-800 text-right">{selectedDriver.blood || '—'}</span>

                <span className="text-slate-500">Age & Experience:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {selectedDriver.age ? `${selectedDriver.age} yrs` : '—'} · {selectedDriver.exp ? `${selectedDriver.exp} yrs exp` : '—'}
                </span>

                <span className="text-slate-500">Assigned Vehicle:</span>
                <span className="font-mono font-bold text-blue-600 text-right">
                  {selectedDriver.vehicle || 'Unassigned'}
                </span>

                <span className="text-slate-500">Hometown / Base:</span>
                <span className="font-semibold text-slate-800 text-right">{selectedDriver.home || '—'}</span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  const d = selectedDriver;
                  setSelectedDriver(null);
                  handleOpenAssign(d);
                }}
                className="flex-1 rounded-lg border border-blue-200 bg-blue-50 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Assign Vehicle
              </button>
              <button
                onClick={() => {
                  const d = selectedDriver;
                  setSelectedDriver(null);
                  handleOpenEdit(d);
                }}
                className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit Driver
              </button>
              <button
                onClick={() => {
                  const id = selectedDriver.id;
                  setSelectedDriver(null);
                  setDeletingId(id);
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
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending}
        title="Confirm Driver Deletion"
        description={`Are you sure you want to delete driver ID ${deletingId}? This will dissociate driver assignment from all trips and vehicles.`}
        confirmLabel="Delete Driver"
        variant="danger"
      />
    </div>
  );
}
