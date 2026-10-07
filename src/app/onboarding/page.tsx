'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building,
  MapPin,
  FileCheck,
  CheckCircle2,
  Circle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  Truck,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import {
  fetchOnboardingStatus,
  updateOnboardingStep,
  submitOnboardingForApproval,
} from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/primitives';

export default function OnboardingWizardPage() {
  const router = useRouter();
  const { user, logout, refetchStatus } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [contactNumber, setContactNumber] = useState('+91 ');
  const [contactEmail, setContactEmail] = useState('');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('India');

  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');
  const [fleetSize, setFleetSize] = useState('1-10');
  const [industryType, setIndustryType] = useState('Logistics');

  // PAN Validation Checklist
  const panHas10Chars = pan.length === 10;
  const panFirst5Letters = /^[A-Z]{5}/.test(pan);
  const panEntityCode = /^.{3}[PCHTFABJLEG]/.test(pan);
  const pan4Numbers = /^.{5}[0-9]{4}/.test(pan);
  const panLastLetter = /^.{9}[A-Z]$/.test(pan);

  const isPanValid =
    panHas10Chars && panFirst5Letters && panEntityCode && pan4Numbers && panLastLetter;

  // GSTIN Validation Checklist
  const gstinHas15Chars = gstin.length === 15;
  const gstinHasStateCode = /^[0-9]{2}/.test(gstin);
  const gstinHasPan = /^.{2}[A-Z]{5}[0-9]{4}[A-Z]{1}/.test(gstin);
  const gstinHasEntityCode = /^.{12}[1-9A-Z]{1}/.test(gstin);
  const gstinHasZ = /^.{13}Z/.test(gstin);
  const gstinHasChecksum = /^.{14}[0-9A-Z]{1}$/.test(gstin);

  const isGstinValid =
    gstinHas15Chars &&
    gstinHasStateCode &&
    gstinHasPan &&
    gstinHasEntityCode &&
    gstinHasZ &&
    gstinHasChecksum;

  useEffect(() => {
    loadExistingStatus();
  }, []);

  const loadExistingStatus = async () => {
    try {
      setLoading(true);
      const data = await fetchOnboardingStatus();
      if (data) {
        if (data.status === 'Approved') {
          router.push('/dashboard');
          return;
        } else if (data.status === 'Pending Review') {
          router.push('/onboarding/pending');
          return;
        }

        setCompanyName(data.company_name || '');
        setContactNumber(data.contact_number || '+91 ');
        setContactEmail(data.contact_email || user?.email || '');
        setAddress(data.address || '');
        setCity(data.city || '');
        setStateName(data.state || '');
        setCountry(data.country || 'India');
        setPan(data.pan || '');
        setGstin(data.gstin || '');
        setFleetSize(data.fleet_size || '1-10');
        setIndustryType(data.industry_type || 'Logistics');

        const progress = data.profile_completion || 0;
        if (progress >= 75) setCurrentStep(2);
        else if (progress >= 50) setCurrentStep(1);
        else setCurrentStep(0);
      }
    } catch (err) {
      console.warn('Error loading onboarding status:', err);
      try {
        const draft = JSON.parse(localStorage.getItem('dy_onboarding_draft') || '{}');
        if (draft.company_name) setCompanyName(draft.company_name);
        if (draft.contact_number) setContactNumber(draft.contact_number);
        if (draft.contact_email) setContactEmail(draft.contact_email);
        if (draft.address) setAddress(draft.address);
        if (draft.city) setCity(draft.city);
        if (draft.state) setStateName(draft.state);
        if (draft.country) setCountry(draft.country);
        if (draft.pan) setPan(draft.pan);
        if (draft.gstin) setGstin(draft.gstin);
        if (draft.fleet_size) setFleetSize(draft.fleet_size);
        if (draft.industry_type) setIndustryType(draft.industry_type);
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation for current step
    if (currentStep === 0) {
      if (!companyName.trim()) {
        setError('Company name is required.');
        return;
      }
      if (!contactNumber.trim() || contactNumber.length < 10) {
        setError('Please enter a valid contact phone number.');
        return;
      }
      if (!contactEmail.trim() || !contactEmail.includes('@')) {
        setError('Please enter a valid contact email.');
        return;
      }
    } else if (currentStep === 1) {
      if (!address.trim()) {
        setError('Street address is required.');
        return;
      }
      if (!city.trim() || !stateName.trim()) {
        setError('City and State are required.');
        return;
      }
    }

    setSaving(true);
    try {
      let payload: Record<string, unknown> = {};
      if (currentStep === 0) {
        payload = {
          company_name: companyName.trim(),
          contact_number: contactNumber.trim(),
          contact_email: contactEmail.trim(),
        };
      } else if (currentStep === 1) {
        payload = {
          address: address.trim(),
          city: city.trim(),
          state: stateName.trim(),
          country: country.trim() || 'India',
        };
      }

      // Save to local draft backup so user never loses input
      try {
        const existing = JSON.parse(localStorage.getItem('dy_onboarding_draft') || '{}');
        localStorage.setItem('dy_onboarding_draft', JSON.stringify({ ...existing, ...payload }));
      } catch (_) {}

      try {
        await updateOnboardingStep(currentStep + 1, payload);
      } catch (apiErr: any) {
        console.warn('Backend offline or slow during step update, saved locally:', apiErr);
      }

      setCurrentStep((prev) => Math.min(prev + 1, 2));
    } catch (err: any) {
      console.error('Onboarding step error:', err);
      setCurrentStep((prev) => Math.min(prev + 1, 2));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPanValid) {
      setError('Please provide a valid 10-character PAN format.');
      return;
    }

    if (!isGstinValid) {
      setError('Please provide a valid 15-character GSTIN format.');
      return;
    }

    setSaving(true);
    try {
      const step3Payload = {
        pan: pan.trim().toUpperCase(),
        gstin: gstin.trim().toUpperCase(),
        fleet_size: fleetSize,
        industry_type: industryType,
      };

      try {
        const existing = JSON.parse(localStorage.getItem('dy_onboarding_draft') || '{}');
        localStorage.setItem('dy_onboarding_draft', JSON.stringify({ ...existing, ...step3Payload }));
      } catch (_) {}

      try {
        await updateOnboardingStep(3, step3Payload);
        await submitOnboardingForApproval();
        if (refetchStatus) await refetchStatus();
      } catch (apiErr) {
        console.warn('Backend offline during submit, advancing to pending review:', apiErr);
      }

      router.push('/onboarding/pending');
    } catch (err: any) {
      console.error('Submit onboarding error:', err);
      router.push('/onboarding/pending');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-slate-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const steps = [
    { title: 'Company Profile', icon: Building, desc: 'Basic business details' },
    { title: 'Location & Address', icon: MapPin, desc: 'Registered office coordinates' },
    { title: 'Tax & Compliance', icon: FileCheck, desc: 'PAN, GSTIN & Fleet details' },
  ];

  return (
    <div className="min-h-screen w-screen bg-slate-900 px-4 py-8 flex flex-col justify-between">
      {/* Top Navbar */}
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">DravYantra</h1>
            <p className="text-[11px] text-slate-400">Fleet Organization Registration</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/login')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Login</span>
        </button>
      </div>

      {/* Main Wizard Form Container */}
      <div className="mx-auto w-full max-w-4xl py-6">
        <div className="rounded-2xl bg-white p-6 md:p-8 shadow-2xl space-y-6">
          {/* Wizard Step Navigation Indicator */}
          <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-6">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isCurrent = currentStep === idx;
              const isDone = currentStep > idx;

              return (
                <div
                  key={s.title}
                  className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                    isCurrent
                      ? 'bg-blue-50 border border-blue-200 text-blue-700'
                      : isDone
                      ? 'text-emerald-700 bg-emerald-50/50'
                      : 'text-slate-400'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg font-bold text-xs ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold leading-tight">{s.title}</p>
                    <p className="text-[10px] text-slate-500 leading-tight">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Basic Company Profile */}
          {currentStep === 0 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h2 className="text-base font-bold text-slate-900">1. Company Profile</h2>
                <p className="text-xs text-slate-500">
                  Enter your registered transport organization or fleet operator details.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Express Logistics India Pvt Ltd"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Contact Phone * (+91 10-digits)
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full font-mono rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  <span>{saving ? 'Saving...' : 'Next: Address'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Address & Coordinates */}
          {currentStep === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h2 className="text-base font-bold text-slate-900">2. Registered Location</h2>
                <p className="text-xs text-slate-500">
                  Provide physical office or dispatch hub address for statutory compliance.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Street Address / Office Unit *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Plot 42, Transport Nagar, Phase 2"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., Pune / Mumbai / Bengaluru"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="e.g., Maharashtra / Karnataka"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    disabled
                    className="w-full bg-slate-50 cursor-not-allowed rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  <span>{saving ? 'Saving...' : 'Next: Compliance'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Compliance & Tax Details */}
          {currentStep === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h2 className="text-base font-bold text-slate-900">
                  3. Statutory Compliance & Fleet Scale
                </h2>
                <p className="text-xs text-slate-500">
                  Provide verified PAN and GSTIN records for fast enterprise fleet verification.
                </p>
              </div>

              <div className="space-y-5 pt-2">
                {/* PAN Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Permanent Account Number (PAN) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="e.g., ABCDE1234F"
                    className="w-full font-mono uppercase tracking-wider rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />

                  {/* Live PAN Validation Checklist */}
                  <div className="mt-2 space-y-1 rounded-xl bg-slate-50 p-3 text-[11px]">
                    <span className="block font-bold text-slate-700 mb-0.5">PAN Format Rules:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <div className={`flex items-center gap-1.5 ${panHas10Chars ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                        {panHas10Chars ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                        <span>Exactly 10 characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${panFirst5Letters ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                        {panFirst5Letters ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                        <span>First 5 uppercase letters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${panEntityCode ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                        {panEntityCode ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                        <span>4th char is entity code (P/C/F/H)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${pan4Numbers ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                        {pan4Numbers ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                        <span>Next 4 digits (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${panLastLetter ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                        {panLastLetter ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                        <span>Last uppercase letter</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GSTIN */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    GST Identification Number (GSTIN) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="e.g., 27ABCDE1234F1Z5"
                    className="w-full font-mono uppercase tracking-wider rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />

                  {/* Live GSTIN Validation Checklist */}
                  <div className="mt-2 space-y-1 rounded-xl bg-slate-50 p-3 text-[11px]">
                    <span className="block font-bold text-slate-700 mb-0.5">GSTIN Format Rules:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <div className={`flex items-center gap-1.5 ${gstinHas15Chars ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                        {gstinHas15Chars ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                        <span>Exactly 15 characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${gstinHasStateCode ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                        {gstinHasStateCode ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                        <span>First 2 digits are state code</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${gstinHasPan ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                        {gstinHasPan ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                        <span>Next 10 characters are PAN</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${gstinHasEntityCode ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                        {gstinHasEntityCode ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                        <span>13th char entity code</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${gstinHasZ ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                        {gstinHasZ ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                        <span>14th character is &apos;Z&apos;</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${gstinHasChecksum ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                        {gstinHasChecksum ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                        <span>15th checksum character</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fleet Scale *
                    </label>
                    <select
                      value={fleetSize}
                      onChange={(e) => setFleetSize(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="1-10">1 – 10 Vehicles (Small Fleet)</option>
                      <option value="11-50">11 – 50 Vehicles (Medium Fleet)</option>
                      <option value="51-100">51 – 100 Vehicles (Large Fleet)</option>
                      <option value="100+">100+ Vehicles (Enterprise Scale)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Primary Industry *
                    </label>
                    <select
                      value={industryType}
                      onChange={(e) => setIndustryType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="Logistics">Logistics & Freight Transport</option>
                      <option value="Construction">Construction & Heavy Machinery</option>
                      <option value="Public Transit">Public Transit & Passenger</option>
                      <option value="FMCG">FMCG & Retail Distribution</option>
                      <option value="Cold Chain">Cold Chain & Pharma</option>
                      <option value="Oil & Gas">Oil, Gas & Chemical Hauling</option>
                      <option value="Mining">Mining & Quarry Operations</option>
                      <option value="Agriculture">Agriculture & Agro Logistics</option>
                      <option value="Other">Other Specialized Fleet</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={saving || !isPanValid || !isGstinValid}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{saving ? 'Submitting Application...' : 'Submit for Verification'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 py-2">
        Protected by DravYantra Compliance Verification Engine
      </div>
    </div>
  );
}
