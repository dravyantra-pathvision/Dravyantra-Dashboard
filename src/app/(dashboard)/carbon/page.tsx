'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Leaf,
  Zap,
  Fuel,
  BarChart3,
  CheckCircle2,
  Info,
  RotateCw,
  TrendingDown,
  Activity,
  Truck,
  Globe,
} from 'lucide-react';
import {
  SectionCard,
  StatCard,
  StatusBadge,
  Badge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  PageHeader,
  PeriodSelector,
} from '@/components/ui/primitives';
import { fetchDashboardStats, fetchSavingsWallet } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useUiStore } from '@/store/ui-store';
import type { FleetStats, SavingsWallet } from '@/types';
import { cn } from '@/lib/utils';

function fmtKg(kg?: number): string {
  if (kg == null || isNaN(kg)) return '0.00 kg';
  return `${kg.toFixed(2)} kg`;
}

function fmtL(l?: number): string {
  if (l == null || isNaN(l)) return '0.0 L';
  return `${l.toFixed(1)} L`;
}

export default function CarbonPage() {
  const router = useRouter();
  const { selectedPeriod, setSelectedPeriod } = useUiStore();

  const { data: stats, isLoading: isStatsLoading, isError: isStatsError, refetch: refetchStats } = useQuery<FleetStats>({
    queryKey: queryKeys.dashboardStats(selectedPeriod),
    queryFn: () => fetchDashboardStats(selectedPeriod),
    staleTime: 60_000,
  });

  const { data: wallet, isLoading: isWalletLoading, isError: isWalletError, refetch: refetchWallet } = useQuery<SavingsWallet>({
    queryKey: queryKeys.savingsWallet(selectedPeriod),
    queryFn: () => fetchSavingsWallet(selectedPeriod),
    staleTime: 60_000,
  });

  const isLoading = isStatsLoading || isWalletLoading;
  const isError = isStatsError && isWalletError;

  // Real backend metrics
  const co2AvoidedKg = stats?.co2AvoidedKg ?? 0;
  const carbonReducedKg = stats?.carbonReducedKg ?? 0;
  const fuelSavedLiters = stats?.fuelSavedLiters ?? 0;
  const co2EmittedKg = stats?.co2EmittedKg ?? 0;
  const carbonIntensity = fuelSavedLiters > 0 ? (co2AvoidedKg / fuelSavedLiters).toFixed(2) : '2.68';

  // Vehicle-level carbon attribution from real backend savings wallet
  const vehicleBreakdown = wallet?.vehicleBreakdown ?? [];
  const vehicleCarbonList = vehicleBreakdown.map((v) => {
    const savedL = v.fuelSavedLiters ?? 0;
    const co2Kg = savedL * 2.68;
    const carbonKg = co2Kg * (12.0 / 44.0);
    return {
      vehicleId: v.vehicleId || v.registrationNumber || '—',
      baselineStatus: v.baselineStatus,
      fuelSavedL: savedL,
      co2Kg: Number(co2Kg.toFixed(2)),
      carbonKg: Number(carbonKg.toFixed(2)),
    };
  }).sort((a, b) => b.co2Kg - a.co2Kg);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Carbon Reduction & Decarbonization"
        subtitle="Traceable CO₂ emissions avoided and elemental carbon (C) reduced derived strictly from verified fuel savings."
        actions={
          <div className="flex items-center gap-3">
            <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
            <button
              onClick={() => {
                refetchStats();
                refetchWallet();
              }}
              title="Refresh Carbon Analytics"
              className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 shadow-2xs transition-colors"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>
        }
      />

      {/* Audit Traceability Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/40 p-4 text-xs text-emerald-950 dark:text-emerald-200 shadow-2xs">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-emerald-950 dark:text-emerald-100">Decarbonization Methodology Standard</p>
          <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
            <strong className="font-mono">CO₂ Avoided (kg CO₂) = Fuel Saved (L) × 2.68 kg CO₂/L</strong>.
            Elemental Carbon (C) Reduced is the stoichiometric mass fraction <strong className="font-mono">(12/44 = 27.27%)</strong> of avoided CO₂. Decarbonization metrics are calculated strictly from verified fuel savings, never from unrecovered waste.
          </p>
        </div>
      </div>

      {isLoading && <LoadingSpinner label="Compiling fleet decarbonization analytics…" />}
      {isError && (
        <ErrorState
          message="Could not load carbon analytics from the backend."
          onRetry={() => {
            refetchStats();
            refetchWallet();
          }}
        />
      )}

      {!isLoading && !isError && stats && (
        <>
          {/* Carbon KPI Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* CO2 Avoided */}
            <div
              onClick={() => router.push('/savings')}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900/90 p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  CO₂ Avoided
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-inner group-hover:scale-105 transition-transform">
                  <Leaf className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400 font-mono">
                  {fmtKg(co2AvoidedKg)}
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">2.68 kg CO₂ per liter saved</p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-emerald-100 dark:border-emerald-900/50 pt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span>View Savings Ledger</span>
                <span className="transform transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>

            {/* Elemental Carbon Reduced */}
            <div
              onClick={() => router.push('/savings')}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-900/90 p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Carbon (C) Reduced
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-inner group-hover:scale-105 transition-transform">
                  <Zap className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold tracking-tight text-blue-700 dark:text-blue-400 font-mono">
                  {fmtKg(carbonReducedKg)}
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">12/44 stoichiometric mass fraction</p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-blue-100 dark:border-blue-900/50 pt-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                <span>View Carbon Credits</span>
                <span className="transform transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>


            {/* Verified Fuel Saved */}
            <div
              onClick={() => router.push('/fuel')}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Verified Fuel Saved
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shadow-inner group-hover:scale-105 transition-transform">
                  <Fuel className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold tracking-tight text-slate-900 font-mono">
                  {fmtL(fuelSavedLiters)}
                </div>
                <p className="mt-1 text-[11px] text-slate-500 font-medium">Realized baseline volume</p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-semibold text-blue-600">
                <span>View Fuel Records</span>
                <span className="transform transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>

            {/* Carbon Intensity Rate */}
            <div
              onClick={() => router.push('/fuel')}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Combustion Factor
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shadow-inner group-hover:scale-105 transition-transform">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold tracking-tight text-slate-900 font-mono">
                  {carbonIntensity} <span className="text-xs font-normal text-slate-500">kg/L</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 font-medium">Standard diesel emission rate</p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-semibold text-blue-600">
                <span>View Fuel Baseline</span>
                <span className="transform transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </div>

          {/* Vehicle Carbon Breakdown Table */}
          <SectionCard
            title={`Vehicle-wise Carbon & CO₂ Reduction Breakdown (${vehicleCarbonList.length})`}
            subtitle="Audited breakdown of carbon savings across each registered vehicle in the fleet."
            bodyClassName="p-0"
          >
            {vehicleCarbonList.length === 0 ? (
              <EmptyState
                icon={<Leaf className="h-10 w-10 text-slate-300" />}
                message="No vehicle decarbonization records found."
                description="Vehicle-level decarbonization will compile once trips and baseline metrics are registered."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75">
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">
                        Vehicle Plate
                      </th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">
                        Baseline Status
                      </th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">
                        Verified Fuel Saved
                      </th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">
                        CO₂ Avoided (kg CO₂)
                      </th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">
                        Carbon (C) Reduced (kg C)
                      </th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500 text-right">
                        Audit Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vehicleCarbonList.map((item) => {
                      const isCompleted = item.baselineStatus === 'completed';
                      return (
                        <tr key={item.vehicleId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            {item.vehicleId}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge
                              label={isCompleted ? 'BASELINE COMPLETED' : 'COLLECTING'}
                              variant={isCompleted ? 'success' : 'warning'}
                              dot
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700">
                            {item.fuelSavedL > 0 ? `${item.fuelSavedL.toFixed(1)} L` : '0.0 L'}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                            {item.co2Kg > 0 ? `${item.co2Kg.toFixed(2)} kg` : '0.00 kg'}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-blue-600">
                            {item.carbonKg > 0 ? `${item.carbonKg.toFixed(2)} kg C` : '0.00 kg C'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge variant={item.fuelSavedL > 0 ? 'success' : 'default'}>
                              {item.fuelSavedL > 0 ? 'Audited' : 'Pending'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
