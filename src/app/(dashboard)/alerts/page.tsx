'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  XCircle,
  Filter,
  CheckCheck,
  Trash2,
  RotateCw,
  Clock,
  Truck,
  User,
  ShieldAlert,
  Radio,
  Search,
} from 'lucide-react';
import {
  SectionCard,
  StatCard,
  StatusBadge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  PageHeader,
  ConfirmDialog,
} from '@/components/ui/primitives';
import {
  fetchAlerts,
  acknowledgeAlert,
  seeAlert,
  resolveAlert,
  dismissAlert,
  acknowledgeAllAlerts,
  clearAlerts,
} from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Alert, AlertSeverity } from '@/types';
import { cn } from '@/lib/utils';

function severityVariant(sev?: string): 'danger' | 'warning' | 'info' | 'neutral' {
  switch (sev?.toLowerCase()) {
    case 'critical':
    case 'danger':
      return 'danger';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'neutral';
  }
}

function statusBadgeVariant(status?: string): 'success' | 'warning' | 'info' | 'neutral' | 'danger' {
  switch (status?.toLowerCase()) {
    case 'resolved':
      return 'success';
    case 'acknowledged':
      return 'info';
    case 'seen':
      return 'neutral';
    case 'pending':
      return 'warning';
    case 'dismissed':
      return 'danger';
    default:
      return 'neutral';
  }
}

function severityBorderBg(sev?: string) {
  switch (sev?.toLowerCase()) {
    case 'critical':
    case 'danger':
      return 'border-red-200 bg-red-50/30';
    case 'warning':
      return 'border-amber-200 bg-amber-50/30';
    case 'info':
      return 'border-blue-200 bg-blue-50/30';
    default:
      return 'border-slate-200 bg-white';
  }
}

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

const SEV_FILTERS = [
  { label: 'All Severities', value: 'all' },
  { label: 'Critical / Danger', value: 'danger' },
  { label: 'Warning', value: 'warning' },
  { label: 'Info', value: 'info' },
];

const STATUS_FILTERS = [
  { label: 'Pending Action', value: 'pending' },
  { label: 'Acknowledged', value: 'acknowledged' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'All Alerts', value: 'all' },
];

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [sevFilter, setSevFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const { data: alertsData, isLoading, isFetching, isError, refetch } = useQuery<Alert[]>({
    queryKey: queryKeys.alerts(),
    queryFn: fetchAlerts,
    staleTime: 15_000,
    retry: 2,
  });

  // Mutations
  const ackMutation = useMutation({
    mutationFn: (id: string) => acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => resolveAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => dismissAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const ackAllMutation = useMutation({
    mutationFn: () => acknowledgeAllAlerts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => clearAlerts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsClearConfirmOpen(false);
    },
  });

  const alerts = alertsData ?? [];
  const pendingCount = alerts.filter((a) => a.status === 'pending').length;
  const dangerCount = alerts.filter((a) => a.severity === 'danger' || a.severity === 'critical' || a.sev === 'danger').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning' || a.sev === 'warning').length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

  const filtered = alerts.filter((a) => {
    const sev = (a.severity || a.sev || 'info').toLowerCase();
    const isDanger = sev === 'danger' || sev === 'critical';
    const isWarning = sev === 'warning';
    const isInfo = sev === 'info';

    let matchesSev = true;
    if (sevFilter === 'danger') matchesSev = isDanger;
    else if (sevFilter === 'warning') matchesSev = isWarning;
    else if (sevFilter === 'info') matchesSev = isInfo;

    const matchesStatus =
      statusFilter === 'all' ||
      a.status === statusFilter ||
      (statusFilter === 'pending' && (a.status === 'pending' || a.status === 'seen'));

    const truckStr = a.vehiclePlate || a.vehicle_plate || a.truck || '';
    const msgStr = a.message || a.msg || '';
    const drvStr = a.driver || '';

    const matchesSearch =
      !search ||
      truckStr.toLowerCase().includes(search.toLowerCase()) ||
      msgStr.toLowerCase().includes(search.toLowerCase()) ||
      drvStr.toLowerCase().includes(search.toLowerCase());

    return matchesSev && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts & Incident Monitoring"
        subtitle="Live telemetry anomaly alarms, overspeeding alerts, excess idling triggers, and fuel theft warnings."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh Alerts"
              className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 shadow-2xs transition-colors disabled:opacity-50"
            >
              <RotateCw className={cn('h-4 w-4', isFetching && 'animate-spin text-blue-600')} />
            </button>
            {pendingCount > 0 && (
              <button
                onClick={() => ackAllMutation.mutate()}
                disabled={ackAllMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <CheckCheck className="h-4 w-4" />
                Acknowledge All ({pendingCount})
              </button>
            )}
            {alerts.length > 0 && (
              <button
                onClick={() => setIsClearConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-rose-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Pending Action"
          value={pendingCount}
          subtitle={pendingCount > 0 ? 'Requires acknowledgment' : 'All clear'}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent={pendingCount > 0 ? 'red' : 'green'}
          onClick={() => {
            setStatusFilter('pending');
            setSevFilter('all');
          }}
          actionText={statusFilter === 'pending' ? 'Active filter' : 'Filter Pending'}
        />
        <StatCard
          title="Critical & Danger"
          value={dangerCount}
          subtitle="Fuel drops & high speed"
          icon={<XCircle className="h-5 w-5" />}
          accent="red"
          onClick={() => {
            setSevFilter(sevFilter === 'danger' ? 'all' : 'danger');
            setStatusFilter('all');
          }}
          actionText={sevFilter === 'danger' ? 'Active filter' : 'Filter Critical'}
        />
        <StatCard
          title="Warnings"
          value={warningCount}
          subtitle="Idling & deviations"
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="amber"
          onClick={() => {
            setSevFilter(sevFilter === 'warning' ? 'all' : 'warning');
            setStatusFilter('all');
          }}
          actionText={sevFilter === 'warning' ? 'Active filter' : 'Filter Warnings'}
        />
        <StatCard
          title="Resolved"
          value={resolvedCount}
          subtitle={`of ${alerts.length} total events`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="blue"
          onClick={() => {
            setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved');
            setSevFilter('all');
          }}
          actionText={statusFilter === 'resolved' ? 'Active filter' : 'Filter Resolved'}
        />
      </div>

      {/* Filter Toolbar & Alert Feed */}
      <SectionCard
        title={`Alert Stream (${filtered.length}${alerts.length ? ` / ${alerts.length}` : ''})`}
        subtitle="Chronological list of all generated hardware telemetry incidents and exceptions."
        className="overflow-hidden"
        bodyClassName="p-5 space-y-4"
      >
        {/* Full-width Responsive Filter Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/80 p-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                    statusFilter === f.value
                      ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/80 p-1">
              {SEV_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSevFilter(f.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                    sevFilter === f.value
                      ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search alert, truck, driver…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 pl-9 pr-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
        {isLoading && <LoadingSpinner label="Loading telemetry alert feed…" />}
        {isError && (
          <ErrorState message="Could not load alerts from the backend." onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            message={
              pendingCount === 0 && statusFilter === 'pending'
                ? 'No pending alerts. Fleet telemetry is running normally.'
                : 'No alerts match your filter criteria.'
            }
            icon={<CheckCircle2 className="h-10 w-10 text-emerald-400" />}
          />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((alert) => {
              const truck = alert.vehiclePlate || alert.vehicle_plate || alert.truck || '—';
              const message = alert.message || alert.msg || 'No details provided';
              const sev = alert.severity || alert.sev || 'info';
              const isResolved = alert.status === 'resolved';
              const isDismissed = alert.status === 'dismissed';
              const isPending = alert.status === 'pending' || alert.status === 'seen';

              return (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-start justify-between gap-4 rounded-xl border p-4 transition-all shadow-2xs',
                    severityBorderBg(sev)
                  )}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                        sev === 'danger' || sev === 'critical'
                          ? 'bg-red-100 text-red-600'
                          : sev === 'warning'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-blue-100 text-blue-600'
                      )}
                    >
                      <AlertTriangle className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {truck}
                        </span>
                        {alert.driver && (
                          <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            {alert.driver}
                          </span>
                        )}
                        <StatusBadge
                          label={sev.toUpperCase()}
                          variant={severityVariant(sev)}
                        />
                        <StatusBadge
                          label={alert.status.toUpperCase()}
                          variant={statusBadgeVariant(alert.status)}
                          dot
                        />
                        {alert.category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {alert.category}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-slate-800 leading-relaxed">
                        {message}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {fmtDate(alert.detectedAt || alert.detected_at || alert.created_at)}
                        </span>
                        {alert.lat && alert.lng && (
                          <span className="font-mono">
                            GPS: {Number(alert.lat).toFixed(4)}, {Number(alert.lng).toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPending && (
                      <button
                        onClick={() => ackMutation.mutate(alert.id)}
                        disabled={ackMutation.isPending}
                        title="Acknowledge Alert"
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Acknowledge
                      </button>
                    )}
                    {!isResolved && !isDismissed && (
                      <button
                        onClick={() => resolveMutation.mutate(alert.id)}
                        disabled={resolveMutation.isPending}
                        title="Mark as Resolved"
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Resolve
                      </button>
                    )}
                    {!isDismissed && (
                      <button
                        onClick={() => dismissMutation.mutate(alert.id)}
                        disabled={dismissMutation.isPending}
                        title="Dismiss Alert"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* CLEAR ALL ALERTS CONFIRMATION */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={() => clearAllMutation.mutate()}
        title="Clear All Alerts"
        description="Are you sure you want to dismiss all alerts across the fleet? This action will mark all active alerts as dismissed."
        confirmText="Clear All Alerts"
        variant="danger"
        isLoading={clearAllMutation.isPending}
      />
    </div>
  );
}
