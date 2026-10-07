'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { XCircle, LogOut, Edit3, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { fetchOnboardingStatus } from '@/lib/api';

export default function RejectedPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetchOnboardingStatus();
        if (res && res.rejection_reason) {
          setReason(res.rejection_reason);
        }
      } catch (err) {
        console.error('Failed to load rejection reason:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, []);

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-lg space-y-6 rounded-2xl bg-white p-8 shadow-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
          <XCircle className="h-10 w-10" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Application Rejected
          </h2>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Unfortunately, your DravYantra organization registration could not be approved by the Super Admin compliance team.
          </p>
        </div>

        {reason ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-left text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-red-900">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <span>Reason for Rejection:</span>
            </div>
            <p className="text-red-800 text-[11px] leading-relaxed font-medium">
              {reason}
            </p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-2">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 text-left">
            No specific reason was provided. Please review your organization details and statutory documents (PAN / GSTIN) and submit again.
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/onboarding"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
          >
            <Edit3 className="h-4 w-4" />
            <span>Update Application</span>
          </Link>
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
