'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Truck, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/firebase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess('Password reset link sent! Check your email inbox.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-slate-950">
      {/* Left Feature & Branding Hero Panel (Desktop) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-12 text-white lg:flex">
        {/* Background glow effects */}
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-cyan-600/10 blur-3xl" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-xl shadow-blue-500/30">
            <Truck className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">DravYantra</h1>
            <p className="text-xs font-semibold tracking-wider uppercase text-blue-400">
              Fleet Management Suite
            </p>
          </div>
        </div>

        {/* Hero Pitch */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-300 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
            Account Security & Recovery
          </div>

          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white">
            Secure Access Recovery for Your Fleet Operations
          </h2>

          <p className="text-sm font-medium leading-relaxed text-slate-300">
            Forgot your password? DravYantra uses enterprise-grade encrypted authentication. Enter your registered email address and we will immediately send a secure password reset link.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-6 text-xs text-slate-400">
          <span>&copy; 2026 DravYantra Technologies</span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            256-Bit SSL Encrypted
          </span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex w-full flex-col justify-center bg-white px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 lg:hidden mb-4">
              <Truck className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Reset Your Password
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Enter your registered fleet owner email address to receive password reset instructions.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fleetowner@dravyantra.com"
                  required
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <span>Send Password Reset Link</span>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 font-medium">
            Remembered your password?{' '}
            <Link href="/login" className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline">
              <ArrowLeft className="h-3 w-3" />
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
