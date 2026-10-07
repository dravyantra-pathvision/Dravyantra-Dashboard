'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import Cookies from 'js-cookie';
import {
  Truck,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Circle,
  ArrowLeft,
  MailCheck,
  RefreshCw,
} from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { apiClient } from '@/lib/api-client';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email verification modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [modalResendStatus, setModalResendStatus] = useState<string | null>(null);

  const handleResendFromModal = async () => {
    if (!registeredEmail) return;
    setResendingVerification(true);
    setModalResendStatus(null);
    try {
      await apiClient.post('/api/auth/send-verification', {
        email: registeredEmail,
      });
      setModalResendStatus('Verification link resent successfully to your inbox!');
    } catch (err: any) {
      console.error('Failed to resend verification:', err);
      setModalResendStatus('Failed to resend. Please try again shortly.');
    } finally {
      setResendingVerification(false);
    }
  };

  // Password checklist rules
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasSpecial && hasNumber;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      setError('Please accept the Terms and Conditions & Privacy Policy to proceed.');
      return;
    }

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill all fields');
      return;
    }

    if (!isPasswordValid) {
      setError('Please meet all password requirements');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;

      if (user) {
        await updateProfile(user, { displayName: name.trim() });
        // 1. Send native Firebase verification email
        try {
          await sendEmailVerification(user);
        } catch (fbErr) {
          console.warn('Native Firebase email verification notice:', fbErr);
        }

        // 2. Sync to PostgreSQL backend
        try {
          const token = await user.getIdToken();
          Cookies.set('dy_session_token', token, { expires: 7 });
          Cookies.set('dy_session_role', 'fleet_owner', { expires: 7 });
          await apiClient.post('/api/users/sync', {
            full_name: name.trim(),
            role: 'fleet_owner',
          });
        } catch (syncErr) {
          console.warn('Backend sync warning on signup:', syncErr);
        }

        // 3. Dispatch high-deliverability transactional verification email via DravYantra SMTP backend
        try {
          await apiClient.post('/api/auth/send-verification', {
            email: email.trim(),
          });
        } catch (verifyErr) {
          console.warn('Backend SMTP verification dispatch notice:', verifyErr);
        }

        // Sign out unverified session immediately
        await signOut(auth);
        Cookies.remove('dy_session_token');
        Cookies.remove('dy_session_role');

        setRegisteredEmail(email.trim());
        setShowVerificationModal(true);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already registered. Please sign in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('The password is too weak. Please use a stronger password.');
      } else {
        console.warn('Signup notice:', err.message || err);
        setError(err.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);
    setAgreedToTerms(true);

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;

      if (user) {
        const token = await user.getIdToken();
        Cookies.set('dy_session_token', token, { expires: 7 });
        Cookies.set('dy_session_role', 'fleet_owner', { expires: 7 });

        try {
          await apiClient.post('/api/users/sync', {
            full_name: user.displayName || 'Fleet Owner',
            role: 'fleet_owner',
          });
        } catch (syncErr) {
          console.warn('Backend sync warning on Google signup:', syncErr);
        }

        router.push('/onboarding');
      }
    } catch (err: any) {
      if (
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request'
      ) {
        console.warn('Google Sign-Up popup was closed or cancelled by user.');
        // Don't show red error if user simply dismissed the popup, or show a gentle hint
      } else {
        console.error('Google sign up error:', err);
        if (err.code === 'auth/unauthorized-domain') {
          setError(
            'Google Sign-Up: This network IP/domain is not authorized in Firebase Console. Please access via http://localhost:3000 or authorize this IP in Firebase Console.'
          );
        } else if (err.code === 'auth/popup-blocked') {
          setError('Popup was blocked by your browser. Please allow popups for localhost:3000.');
        } else {
          setError(err.message || 'Google Sign-Up failed.');
        }
      }
    } finally {
      setLoading(false);
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
              Transform Your Fleet Efficiency in Real-Time
            </h2>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Join leading transport operators utilizing DravYantra’s intelligent IoT telemetry, fuel-theft detection, and dynamic savings analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5 pt-2">
            <div className="flex items-start gap-3 rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 backdrop-blur-xs">
              <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400 shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Real-Time GPS & Trip Telemetry</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">High-frequency tracking, route replay, and speed compliance monitoring.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 backdrop-blur-xs">
              <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Fuel Theft & Loss Prevention</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Instant alerts on rapid siphoning, excessive idling, and baseline deviations.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 backdrop-blur-xs">
              <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Automated Statutory Verification</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Seamless PAN & GSTIN validation with Super Admin compliance approval.</p>
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
              Create Fleet Account
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
              Register your transport organization to access the fleet dashboard.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Anand Kumar"
                    required
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    required
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-10 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-10 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Validation Checklist */}
            <div className="space-y-1.5 rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-[11px]">
              <span className="block font-bold text-slate-700 mb-1">Password Requirements:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                  {hasMinLength ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <Circle className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                  {hasUppercase ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <Circle className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                  <span>Uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                  {hasLowercase ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <Circle className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                  <span>Lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                  {hasNumber ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <Circle className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                  <span>At least one number (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-500'} sm:col-span-2`}>
                  {hasSpecial ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <Circle className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                  <span>Special character (!@#$%^&*)</span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-600 leading-relaxed">
                I agree to the{' '}
                <a
                  href="https://dravyantra-pathvision.github.io/DravYantra-Website/terms.html"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-600 hover:underline"
                >
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a
                  href="https://dravyantra-pathvision.github.io/DravYantra-Website/privacy.html"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-600 hover:underline"
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <span>Create Fleet Account</span>
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute bg-white px-2 text-[10px] font-bold text-slate-400 uppercase">
              OR
            </span>
          </div>

          {/* Google Sign-Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
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
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Email Verification Modal Popup Card */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <MailCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Verify Your Email</h3>
                <p className="text-xs text-slate-500">Account registration step 1 complete</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 leading-relaxed space-y-2">
              <p>
                A verification email has been sent to{' '}
                <strong className="font-semibold text-blue-700">{registeredEmail}</strong>.
              </p>
              <p className="text-[11px] text-slate-500">
                Please check your inbox (and spam folder if not visible within 30 seconds) and click the verification link before logging into the DravYantra fleet portal.
              </p>
            </div>

            {modalResendStatus && (
              <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-medium text-blue-800 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                <span>{modalResendStatus}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResendFromModal}
                disabled={resendingVerification}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${resendingVerification ? 'animate-spin' : ''}`} />
                <span>{resendingVerification ? 'Resending...' : 'Resend Email'}</span>
              </button>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Go back to Login</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
