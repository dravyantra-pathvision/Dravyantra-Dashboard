'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import Cookies from 'js-cookie';
import {
  Truck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Compass,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { apiClient } from '@/lib/api-client';
import { fetchOnboardingStatus } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationNeeded, setVerificationNeeded] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [unverifiedUser, setUnverifiedUser] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter Email');
      return;
    }
    if (!password) {
      setError('Please enter password');
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationNeeded(false);
    setResendStatus(null);

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      let user = cred.user;

      if (user) {
        await user.reload();
        const refreshedUser = auth.currentUser || user;

        if (refreshedUser && !refreshedUser.emailVerified) {
          setUnverifiedUser(refreshedUser);
          setVerificationNeeded(true);
          setError('Please verify your email address before logging in.');
          await signOut(auth);
          setLoading(false);
          return;
        }

        if (refreshedUser) {
          await handleSuccessfulLogin(refreshedUser, 'fleet_owner');
        }
      }
    } catch (err: any) {
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (err.code === 'auth/too-many-requests') {
        setError(
          'Access temporarily blocked due to repeated failed attempts. Please reset your password or try again later.'
        );
      } else {
        console.warn('Login notice:', err.message || err);
        setError(err.message || 'Login failed. Please check your network and credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;
      if (user) {
        await handleSuccessfulLogin(user, 'fleet_owner');
      }
    } catch (err: any) {
      if (
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request'
      ) {
        console.warn('Google Sign-In popup was closed or cancelled by user.');
      } else {
        console.error('Google sign in error:', err);
        if (err.code === 'auth/unauthorized-domain') {
          setError(
            'Google Sign-In: This network IP/domain is not authorized in Firebase Console. Please access via http://localhost:3000 or authorize this IP in Firebase Console.'
          );
        } else if (err.code === 'auth/popup-blocked') {
          setError('Popup was blocked by your browser. Please allow popups for localhost:3000.');
        } else {
          setError(err.message || 'Google Sign-In failed.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessfulLogin = async (user: any, userRole: string = 'fleet_owner') => {
    Cookies.set('dy_session_role', userRole, { expires: 7 });

    try {
      const token = await user.getIdToken();
      Cookies.set('dy_session_token', token, { expires: 7 });

      // Sync user to PostgreSQL backend
      await apiClient.post('/api/users/sync', {
        full_name: user.displayName || 'Fleet Owner',
        role: userRole,
      });
    } catch (syncErr) {
      console.warn('Backend sync warning:', syncErr);
    }

    // Verify Organization Onboarding Status
    try {
      const statusData = await fetchOnboardingStatus();
      const orgStatus = statusData?.status;

      if (orgStatus === 'Approved') {
        router.push('/dashboard');
      } else if (orgStatus === 'Pending Review') {
        router.push('/onboarding/pending');
      } else if (orgStatus === 'Rejected') {
        router.push('/onboarding/rejected');
      } else {
        // Draft or new user -> Onboarding Wizard
        router.push('/onboarding');
      }
    } catch (err) {
      console.warn('Onboarding check error, redirecting to onboarding wizard:', err);
      router.push('/onboarding');
    }
  };

  const handleResendVerification = async () => {
    try {
      let currentUser = auth.currentUser;
      if (!currentUser && email.trim() && password) {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        currentUser = cred.user;
      }
      
      const targetEmail = currentUser?.email || email.trim();
      if (!targetEmail) {
        setError('Please enter your email address to resend verification.');
        return;
      }

      // 1. Try native Firebase verification
      if (currentUser) {
        try {
          await sendEmailVerification(currentUser);
        } catch (fbErr) {
          console.warn('Firebase client verification notice:', fbErr);
        }
      }

      // 2. Dispatch custom high-deliverability SMTP email via DravYantra backend
      try {
        await apiClient.post('/api/auth/send-verification', {
          email: targetEmail,
        });
      } catch (backendErr) {
        console.warn('Backend SMTP verification notice:', backendErr);
      }

      setResendStatus('Verification email resent! Please check your inbox and spam folder.');
      if (currentUser) {
        await signOut(auth);
      }
    } catch (err: any) {
      console.error('Failed to resend verification:', err);
      if (err.code === 'auth/too-many-requests') {
        setError('Too many email requests sent. Please wait a few minutes before trying again.');
      } else {
        setError(err.message || 'Failed to resend verification email. Please try again shortly.');
      }
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-white">
      {/* LEFT SIDE: Enterprise Hero & Feature Showcase (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-12 text-white relative overflow-hidden border-r border-slate-800">
        {/* Subtle background glow */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        {/* Top Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/30">
              <Truck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">DravYantra</h1>
              <p className="text-xs font-semibold text-blue-400">Enterprise Fleet Owner Portal</p>
            </div>
          </div>
        </div>

        {/* Center Feature Highlights */}
        <div className="relative z-10 space-y-6 my-auto max-w-lg">
          <div>
            <span className="inline-block rounded-full bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-400 border border-blue-500/20 mb-3">
              Fleet Operations & Telemetry
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight leading-snug">
              Intelligent Telemetry & Fleet Management
            </h2>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Log in to monitor live fleet telemetry, fuel analytics, vehicle baselines, driver performance, and financial savings in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5 pt-2">
            <div className="flex items-start gap-3 rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 backdrop-blur-xs">
              <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400 shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Live Vehicle Tracking & Map Replay</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Sub-second telemetry updates, ignition detection, and route tracing.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 backdrop-blur-xs">
              <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Automated Savings & Carbon Accounting</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Dynamic rupee savings wallet vs OEM baselines and ESG carbon emissions.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 backdrop-blur-xs">
              <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Super Admin Compliance Verified</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Secure multi-organization data segregation and compliance gating.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Security Note */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>Protected by 256-Bit SSL Encryption</span>
          <span>Pathvision Innovations © 2026</span>
        </div>
      </div>

      {/* RIGHT SIDE: Full Desktop Form View */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-20 py-10 overflow-y-auto bg-white">
        <div className="w-full max-w-xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 lg:hidden mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">DravYantra</h1>
                <p className="text-[10px] text-slate-500 font-semibold">Fleet Owner Portal</p>
              </div>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              Welcome Back
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
              Sign in to manage your transport fleet, vehicles, and live telemetry.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {verificationNeeded && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline"
                    >
                      <Send className="h-3 w-3" />
                      Resend Verification Email
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Alert */}
          {resendStatus && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{resendStatus}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fleetowner@company.com"
                  required
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-10 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute bg-white px-2 text-[10px] font-bold text-slate-400 uppercase">
              OR
            </span>
          </div>

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <p className="text-center text-xs text-slate-500 font-medium">
            Don&apos;t have an account yet?{' '}
            <Link href="/signup" className="font-bold text-blue-600 hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
