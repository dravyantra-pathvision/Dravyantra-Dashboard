'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ShieldAlert, LogOut, RefreshCw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { fetchOnboardingStatus } from '@/lib/api';

export default function PendingApprovalPage() {
  const router = useRouter();
  const { logout, refetchStatus } = useAuth();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const checkStatus = async (silent = false) => {
    if (!silent) {
      setChecking(true);
      setMessage(null);
    }
    try {
      const res = await fetchOnboardingStatus();
      const status = res?.status;

      if (status === 'Approved') {
        if (refetchStatus) await refetchStatus();
        router.push('/dashboard');
      } else if (status === 'Rejected') {
        if (refetchStatus) await refetchStatus();
        router.push('/onboarding/rejected');
      } else if (!silent) {
        setMessage('Your application is still pending review. Please check back shortly.');
      }
    } catch (err) {
      console.error('Error polling onboarding status:', err);
      if (!silent) {
        setMessage('Unable to fetch status. Please try again.');
      }
    } finally {
      if (!silent) setChecking(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkStatus(true);

    // Auto-polling every 5 seconds matching Flutter pending_approval_screen.dart
    const interval = setInterval(() => {
      checkStatus(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-lg space-y-6 rounded-2xl bg-white p-8 shadow-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <Clock className="h-10 w-10 animate-pulse" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Organization Under Review
          </h2>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Your DravYantra organization profile and statutory tax details have been submitted and are currently pending compliance approval.
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-left text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Verification Status: Pending Review</span>
          </div>
          <p className="text-amber-800 text-[11px] leading-relaxed">
            Full access to live fleet tracking, vehicles, drivers, trips, fuel metrics, and savings analytics will be automatically unlocked once approved.
          </p>
        </div>

        {message && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-700">
            {message}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => checkStatus(false)}
            disabled={checking}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{checking ? 'Checking...' : 'Check Status'}</span>
          </button>
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
