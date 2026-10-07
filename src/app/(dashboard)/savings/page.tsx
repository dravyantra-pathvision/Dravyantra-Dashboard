'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  ShieldCheck,
  AlertTriangle,
  Info,
  Timer,
  Gauge,
  AlertOctagon,
  CheckCircle2,
  Loader2,
  TrendingUp,
  RotateCw,
  Clock,
  Flame,
  ShieldAlert,
  Truck,
  IndianRupee,
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
import { fetchSavingsWallet } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useUiStore } from '@/store/ui-store';
import type { SavingsWallet } from '@/types';
import { cn } from '@/lib/utils';

function fmtINR(r?: number): string {
  if (r == null || isNaN(r)) return '₹0';
  return `₹${Math.round(r).toLocaleString('en-IN')}`;
}

function fmtL(l?: number): string {
  if (l == null || isNaN(l)) return '0.0 L';
  return `${l.toFixed(1)} L`;
}

export default function SavingsPage() {
  const router = useRouter();
  const { selectedPeriod, setSelectedPeriod } = useUiStore();

  const { data: wallet, isLoading, isFetching, isError, refetch } = useQuery<SavingsWallet>({
    queryKey: queryKeys.savingsWallet(selectedPeriod),
    queryFn: () => fetchSavingsWallet(selectedPeriod),
    staleTime: 60_000,
    retry: 2,
  });

  const breakdown = wallet?.vehicleBreakdown ?? [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Savings Wallet & Financial Audit"
        subtitle="Audited baseline savings, prevented loss recovery, and categorized fuel waste breakdown."
        actions={
          <div className="flex items-center gap-3">
            <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh Savings Data"
              className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 shadow-2xs transition-colors disabled:opacity-50"
            >
              <RotateCw className={cn('h-4 w-4', isFetching && 'animate-spin text-blue-600')} />
            </button>
          </div>
        }
      />

      {/* Audit Standard Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/40 p-4 text-xs text-blue-900 dark:text-blue-200 shadow-2xs">
        <Info className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-blue-950 dark:text-blue-100">DravYantra Financial Audit Standard</p>
          <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
            <strong className="text-emerald-700 dark:text-emerald-400">Verified Savings</strong> represents cost reduction measured against completed vehicle mileage baselines.
            <strong className="text-amber-700 dark:text-amber-400"> Identified Fuel Waste</strong> represents operational inefficiency (excess idling, overspeeding drag, unprevented drops) and is strictly categorized as unrecovered loss.
          </p>
        </div>
      </div>

      {isLoading && <LoadingSpinner label="Compiling audited savings wallet…" />}
      {isError && (
        <ErrorState
          message="Could not load savings wallet data from the backend."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && wallet && (
        <>
          {/* Primary Savings & Losses Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Verified Realized Savings */}
            <div
              onClick={() => router.push('/fuel')}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900/90 p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Verified Savings (Realized)
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-inner group-hover:scale-105 transition-transform">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400 font-mono">
                  {fmtINR(wallet.verifiedSavings.rupees)}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{fmtL(wallet.verifiedSavings.fuelLiters)} saved vs completed baseline</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-emerald-100 dark:border-emerald-900/50 pt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span>View Fuel Intelligence</span>
                <span className="transform transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>

            {/* Fuel Loss Prevented */}
            <div
              onClick={() => router.push('/alerts')}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-900/90 p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Fuel Loss Prevented
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-inner group-hover:scale-105 transition-transform">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-blue-700 dark:text-blue-400 font-mono">
                  {fmtINR(wallet.fuelLossPrevented.rupees)}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <span>
                    {fmtL(wallet.fuelLossPrevented.liters)} across {wallet.fuelLossPrevented.events} averted theft/siphon alarms
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-blue-100 dark:border-blue-900/50 pt-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                <span>Investigate Saved Alarms</span>
                <span className="transform transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>

            {/* Identified Fuel Waste */}
            <div
              onClick={() => router.push('/fuel')}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900/90 p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Identified Fuel Waste
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 shadow-inner group-hover:scale-105 transition-transform">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-amber-700 dark:text-amber-400 font-mono">
                  {fmtINR(wallet.identifiedWaste.totalRupees)}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <span>{fmtL(wallet.identifiedWaste.totalLiters)} unrecovered driver & operational loss</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-amber-100 dark:border-amber-900/50 pt-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <span>View Loss Diagnostics</span>
                <span className="transform transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </div>


          {/* Waste Breakdown Panels */}
          <SectionCard
            title="Identified Waste Attribution"
            subtitle="Categorical loss attribution calculated directly from vehicle IoT sensors."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Excess Idling */}
              <div
                onClick={() => router.push('/vehicles')}
                className="group cursor-pointer flex items-center justify-between rounded-xl border border-slate-200 bg-white hover:bg-amber-50/50 p-4 shadow-2xs hover:border-amber-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 group-hover:text-amber-900 transition-colors">Excess Idling Waste</h4>
                    <p className="text-base font-bold text-amber-600 font-mono">
                      {fmtL(wallet.identifiedWaste.idling.liters)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {fmtINR(wallet.identifiedWaste.idling.rupees)}
                  </span>
                  <p className="text-[11px] text-slate-400">Stationary ignition →</p>
                </div>
              </div>

              {/* Speeding Waste */}
              <div
                onClick={() => router.push('/alerts')}
                className="group cursor-pointer flex items-center justify-between rounded-xl border border-slate-200 bg-white hover:bg-rose-50/50 p-4 shadow-2xs hover:border-rose-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 group-hover:text-rose-900 transition-colors">Overspeeding Waste</h4>
                    <p className="text-base font-bold text-rose-600 font-mono">
                      {fmtL(wallet.identifiedWaste.overspeeding.liters)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {fmtINR(wallet.identifiedWaste.overspeeding.rupees)}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {wallet.identifiedWaste.overspeeding.events} events →
                  </p>
                </div>
              </div>

              {/* Unprevented Fuel Drops */}
              <div
                onClick={() => router.push('/alerts')}
                className="group cursor-pointer flex items-center justify-between rounded-xl border border-slate-200 bg-white hover:bg-red-50/50 p-4 shadow-2xs hover:border-red-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 group-hover:scale-105 transition-transform">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 group-hover:text-red-900 transition-colors">Unprevented Theft / Drops</h4>
                    <p className="text-base font-bold text-red-600 font-mono">
                      {fmtL(wallet.identifiedWaste.fuelTheft.liters)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {fmtINR(wallet.identifiedWaste.fuelTheft.rupees)}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {wallet.identifiedWaste.fuelTheft.events} drop events →
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Vehicle-wise Baseline & Savings Breakdown */}
          <SectionCard
            title={`Vehicle Baseline & Savings Breakdown (${breakdown.length})`}
            subtitle="Individual vehicle mileage baselines and verified savings derived from backend trip records."
            bodyClassName="p-0"
          >
            {breakdown.length === 0 ? (
              <EmptyState
                icon={<Truck className="h-10 w-10 text-slate-300" />}
                message="No vehicle baseline records found."
                description="Vehicle baseline and savings records will be compiled once vehicles complete baseline trips."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75">
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">
                        Vehicle
                      </th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">
                        Baseline Status
                      </th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">
                        Baseline Mileage
                      </th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">
                        Period Mileage
                      </th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">
                        Distance / Fuel
                      </th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">
                        Verified Savings
                      </th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">
                        Identified Waste
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {breakdown.map((v) => {
                      const isCompleted = v.baselineStatus === 'completed';
                      return (
                        <tr key={v.vehicleId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            {v.vehicleId || v.registrationNumber || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge
                              label={isCompleted ? 'BASELINE COMPLETED' : 'COLLECTING BASELINE'}
                              variant={isCompleted ? 'success' : 'warning'}
                              dot
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700">
                            {v.baselineEfficiency > 0 ? `${v.baselineEfficiency.toFixed(1)} km/L` : '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700">
                            {v.currentEfficiency > 0 ? `${v.currentEfficiency.toFixed(1)} km/L` : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {v.distance > 0 ? `${v.distance.toFixed(0)} km` : '0 km'} • {v.fuelConsumed > 0 ? `${v.fuelConsumed.toFixed(0)} L` : '0 L'}
                          </td>
                          <td className="px-4 py-3">
                            {v.fuelSavedRupees > 0 ? (
                              <span className="font-bold text-emerald-600 font-mono">
                                {fmtINR(v.fuelSavedRupees)}{' '}
                                <span className="text-[10px] font-normal text-slate-400">
                                  ({fmtL(v.fuelSavedLiters)})
                                </span>
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono">
                                {isCompleted ? '₹0 (On baseline)' : '—'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-rose-600 font-medium">
                            {v.identifiedWasteRupees > 0 ? fmtINR(v.identifiedWasteRupees) : '₹0'}
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
