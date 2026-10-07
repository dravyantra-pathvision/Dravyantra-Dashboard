'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building,
  User,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Gauge,
  Timer,
  Fuel,
  Lock,
  Trash2,
  CreditCard,
  Radio,
  Sliders,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  SectionCard,
  Badge,
  LoadingSpinner,
} from '@/components/ui/primitives';
import {
  fetchOrgProfile,
  updateOrgProfile,
  fetchUserProfile,
  updateUserProfile,
  fetchAlertSettings,
  updateAlertSettings,
  requestAccountDeletion,
  fetchAccountDeletionStatus,
} from '@/lib/api';
import { QUERY_KEYS } from '@/lib/query-keys';
import { useAuth } from '@/providers/auth-provider';
import type {
  Organization,
  UserAccount,
  AlertSettings,
  AccountDeletionStatus,
} from '@/types';

type SettingsTab = 'organization' | 'user' | 'alerts' | 'security';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('organization');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState('');
  const queryClient = useQueryClient();
  const { user: authUser, logout } = useAuth();

  // Queries
  const { data: orgData, isLoading: isOrgLoading } = useQuery<Organization>({
    queryKey: QUERY_KEYS.orgProfile(),
    queryFn: fetchOrgProfile,
  });

  const { data: userData, isLoading: isUserLoading } = useQuery<UserAccount>({
    queryKey: QUERY_KEYS.userProfile(),
    queryFn: fetchUserProfile,
  });

  const { data: alertSettings, isLoading: isAlertsLoading } = useQuery<AlertSettings>({
    queryKey: QUERY_KEYS.alertSettings(),
    queryFn: fetchAlertSettings,
  });

  const { data: deletionStatus } = useQuery<AccountDeletionStatus>({
    queryKey: QUERY_KEYS.accountDeletionStatus(),
    queryFn: fetchAccountDeletionStatus,
    enabled: activeTab === 'security',
  });

  // Local Form States
  const [orgForm, setOrgForm] = useState<Partial<Organization>>({
    company_name: '',
    name: '',
    gstin: '',
    pan: '',
    city: '',
    state: '',
    contact_number: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    country: 'India',
    fleet_size: '',
    industry_type: '',
  });

  const [userForm, setUserForm] = useState<Partial<UserAccount>>({
    full_name: '',
    phone: '',
    timezone: 'Asia/Kolkata',
    employee_id: '',
    department: '',
    language_pref: 'en',
    email_notif: true,
    sms_notif: false,
    push_notif: true,
  });

  const [alertsForm, setAlertsForm] = useState<AlertSettings>({
    speedThreshold: 80,
    speedingThreshold: 80,
    overspeedThresholdKmh: 80,
    fuelDropThreshold: 5.0,
    fuelTheftThresholdLiters: 3.0,
    idleLimit: 15,
    idleTimeMinutes: 15,
    idleWarningSeconds: 300,
    lowFuelPercent: 15,
    theftAlertEnabled: true,
    fastagThreshold: 500,
    mileageThreshold: 4.0,
    whatsappEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    emailEnabled: true,
    perTypeToggles: {
      overSpeed: true,
      excessIdle: true,
      fuelDrop: true,
      geoFence: true,
      harshBraking: true,
      eWayBill: true,
      fastag: true,
      gpsLost: true,
    },
  });

  useEffect(() => {
    if (orgData) {
      setOrgForm({
        company_name: orgData.company_name || orgData.name || '',
        name: orgData.name || orgData.company_name || '',
        gstin: orgData.gstin || '',
        pan: orgData.pan || '',
        city: orgData.city || '',
        state: orgData.state || '',
        contact_number: orgData.contact_number || orgData.contact_phone || '',
        contact_phone: orgData.contact_phone || orgData.contact_number || '',
        contact_email: orgData.contact_email || '',
        address: orgData.address || '',
        country: orgData.country || 'India',
        fleet_size: orgData.fleet_size || '',
        industry_type: orgData.industry_type || '',
      });
    }
  }, [orgData]);

  useEffect(() => {
    if (userData) {
      setUserForm({
        full_name: userData.full_name || '',
        phone: userData.phone || '',
        timezone: userData.timezone || 'Asia/Kolkata',
        employee_id: userData.employee_id || '',
        department: userData.department || '',
        language_pref: userData.language_pref || 'en',
        email_notif: userData.email_notif ?? true,
        sms_notif: userData.sms_notif ?? false,
        push_notif: userData.push_notif ?? true,
      });
    }
  }, [userData]);

  useEffect(() => {
    if (alertSettings) {
      setAlertsForm({
        speedThreshold: alertSettings.speedThreshold ?? alertSettings.overspeedThresholdKmh ?? 80,
        speedingThreshold: alertSettings.speedingThreshold ?? alertSettings.speedThreshold ?? 80,
        overspeedThresholdKmh: alertSettings.overspeedThresholdKmh ?? alertSettings.speedThreshold ?? 80,
        fuelDropThreshold: alertSettings.fuelDropThreshold ?? 5.0,
        fuelTheftThresholdLiters: alertSettings.fuelTheftThresholdLiters ?? 3.0,
        idleLimit: alertSettings.idleLimit ?? 15,
        idleTimeMinutes: alertSettings.idleTimeMinutes ?? alertSettings.idleLimit ?? 15,
        idleWarningSeconds: alertSettings.idleWarningSeconds ?? 300,
        lowFuelPercent: alertSettings.lowFuelPercent ?? 15,
        theftAlertEnabled: alertSettings.theftAlertEnabled ?? true,
        fastagThreshold: alertSettings.fastagThreshold ?? 500,
        mileageThreshold: alertSettings.mileageThreshold ?? 4.0,
        whatsappEnabled: alertSettings.whatsappEnabled ?? true,
        smsEnabled: alertSettings.smsEnabled ?? false,
        pushEnabled: alertSettings.pushEnabled ?? true,
        emailEnabled: alertSettings.emailEnabled ?? true,
        perTypeToggles: alertSettings.perTypeToggles ?? {
          overSpeed: true,
          excessIdle: true,
          fuelDrop: true,
          geoFence: true,
          harshBraking: true,
          eWayBill: true,
          fastag: true,
          gpsLost: true,
        },
      });
    }
  }, [alertSettings]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Mutations
  const updateOrgMutation = useMutation({
    mutationFn: (data: Partial<Organization>) =>
      updateOrgProfile({
        company_name: data.company_name || data.name,
        gstin: data.gstin,
        pan: data.pan,
        contact_number: data.contact_number || data.contact_phone,
        contact_email: data.contact_email,
        city: data.city,
        state: data.state,
        address: data.address,
        country: data.country,
        fleet_size: data.fleet_size,
        industry_type: data.industry_type,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgProfile() });
      showToast('Organization profile saved and persisted to database');
    },
    onError: () => {
      showToast('Failed to update organization profile', 'error');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: Partial<UserAccount>) => updateUserProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userProfile() });
      showToast('User profile updated successfully');
    },
    onError: () => {
      showToast('Failed to update user profile', 'error');
    },
  });

  const updateAlertsMutation = useMutation({
    mutationFn: (data: AlertSettings) =>
      updateAlertSettings({
        ...data,
        speedThreshold: data.speedThreshold,
        overspeedThresholdKmh: data.speedThreshold,
        fuelTheftThresholdLiters: data.fuelTheftThresholdLiters,
        idleLimit: data.idleLimit,
        idleWarningSeconds: (data.idleLimit ?? 15) * 60,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alertSettings() });
      showToast('Alert preferences and fleet thresholds saved successfully');
    },
    onError: () => {
      showToast('Failed to save alert preferences', 'error');
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: requestAccountDeletion,
    onSuccess: (data) => {
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountDeletionStatus() });
      showToast(data.message || 'Account deletion request submitted successfully');
      setTimeout(() => {
        logout();
      }, 2500);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      showToast(
        err?.response?.data?.error || 'Failed to submit account deletion request',
        'error'
      );
    },
  });

  const isLoading = isOrgLoading || isUserLoading || isAlertsLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Settings & Fleet Preferences
          </h1>
          <p className="text-sm text-slate-500">
            Manage organization legal registry, user profile credentials, and operational alert thresholds.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-sm font-semibold shadow-sm transition-all ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-2 rounded-t-xl overflow-x-auto">
        {[
          { id: 'organization', label: 'Organization Profile', icon: Building },
          { id: 'user', label: 'User Account', icon: User },
          { id: 'alerts', label: 'Alert Thresholds', icon: Bell },
          { id: 'security', label: 'Security & Governance', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: Organization Profile */}
          {activeTab === 'organization' && (
            <SectionCard
              title="Organization Legal Entity"
              description="Official company registry, GSTIN, PAN, and primary fleet contact coordinates."
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateOrgMutation.mutate(orgForm);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Organization / Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={orgForm.company_name || orgForm.name || ''}
                      onChange={(e) =>
                        setOrgForm({ ...orgForm, company_name: e.target.value, name: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GSTIN *
                    </label>
                    <input
                      type="text"
                      required
                      value={orgForm.gstin || ''}
                      onChange={(e) => setOrgForm({ ...orgForm, gstin: e.target.value })}
                      className="w-full font-mono uppercase rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PAN *
                    </label>
                    <input
                      type="text"
                      required
                      value={orgForm.pan || ''}
                      onChange={(e) => setOrgForm({ ...orgForm, pan: e.target.value })}
                      className="w-full font-mono uppercase rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={orgForm.contact_email || ''}
                      onChange={(e) => setOrgForm({ ...orgForm, contact_email: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={orgForm.contact_number || orgForm.contact_phone || ''}
                      onChange={(e) =>
                        setOrgForm({
                          ...orgForm,
                          contact_number: e.target.value,
                          contact_phone: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={orgForm.city || ''}
                      onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={orgForm.state || ''}
                      onChange={(e) => setOrgForm({ ...orgForm, state: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fleet Size
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 10-50 vehicles"
                      value={String(orgForm.fleet_size || '')}
                      onChange={(e) => setOrgForm({ ...orgForm, fleet_size: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Address
                    </label>
                    <input
                      type="text"
                      value={orgForm.address || ''}
                      onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={updateOrgMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {updateOrgMutation.isPending ? 'Saving...' : 'Save Organization Profile'}
                  </button>
                </div>
              </form>
            </SectionCard>
          )}

          {/* TAB 2: User Account */}
          {activeTab === 'user' && (
            <SectionCard
              title="Personal Account & Coordinates"
              description="Update your administrator profile details and notifications."
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateUserMutation.mutate(userForm);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={userForm.full_name || ''}
                      onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address (Auth Identity)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={userData?.email || authUser?.email || ''}
                      className="w-full bg-slate-50 text-slate-500 cursor-not-allowed rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={userForm.phone || ''}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Timezone
                    </label>
                    <select
                      value={userForm.timezone || 'Asia/Kolkata'}
                      onChange={(e) => setUserForm({ ...userForm, timezone: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                      <option value="UTC">UTC (GMT +00:00)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Role / Permissions
                    </label>
                    <div className="pt-1">
                      <Badge variant="info" className="uppercase font-mono">
                        {userData?.role || 'fleet_owner'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Notification Preferences</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-xs text-slate-700 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={userForm.email_notif ?? true}
                        onChange={(e) => setUserForm({ ...userForm, email_notif: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Email Alerts</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-xs text-slate-700 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={userForm.push_notif ?? true}
                        onChange={(e) => setUserForm({ ...userForm, push_notif: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>In-App Push</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-xs text-slate-700 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={userForm.sms_notif ?? false}
                        onChange={(e) => setUserForm({ ...userForm, sms_notif: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>SMS Alerts</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {updateUserMutation.isPending ? 'Saving...' : 'Save User Profile'}
                  </button>
                </div>
              </form>
            </SectionCard>
          )}

          {/* TAB 3: Alert Thresholds */}
          {activeTab === 'alerts' && (
            <SectionCard
              title="Operational & Telemetry Alert Thresholds"
              description="Configure automatic threshold triggers and telemetry alert sensitivities."
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateAlertsMutation.mutate(alertsForm);
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {/* Speeding */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Gauge className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">Speeding Limit</span>
                    </div>
                    <label className="block text-[11px] text-slate-500 mb-2">
                      Alert triggered when vehicle speed exceeds (km/h)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="40"
                        max="140"
                        value={alertsForm.speedThreshold ?? 80}
                        onChange={(e) =>
                          setAlertsForm({
                            ...alertsForm,
                            speedThreshold: parseInt(e.target.value) || 80,
                            overspeedThresholdKmh: parseInt(e.target.value) || 80,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-xs font-semibold text-slate-500">km/h</span>
                    </div>
                  </div>

                  {/* Idling */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Timer className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">Excess Idling Limit</span>
                    </div>
                    <label className="block text-[11px] text-slate-500 mb-2">
                      Alert triggered when stationary engine runs beyond
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="3"
                        max="120"
                        value={alertsForm.idleLimit ?? 15}
                        onChange={(e) =>
                          setAlertsForm({
                            ...alertsForm,
                            idleLimit: parseInt(e.target.value) || 15,
                            idleTimeMinutes: parseInt(e.target.value) || 15,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-xs font-semibold text-slate-500">min</span>
                    </div>
                  </div>

                  {/* Fuel Theft Drop */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                        <Fuel className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">Theft Drop Threshold</span>
                    </div>
                    <label className="block text-[11px] text-slate-500 mb-2">
                      Abrupt fuel level decrease while stationary (Liters)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="30"
                        value={alertsForm.fuelTheftThresholdLiters ?? 3.0}
                        onChange={(e) =>
                          setAlertsForm({
                            ...alertsForm,
                            fuelTheftThresholdLiters: parseFloat(e.target.value) || 3.0,
                            fuelDropThreshold: parseFloat(e.target.value) || 3.0,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-xs font-semibold text-slate-500">L</span>
                    </div>
                  </div>
                </div>

                {/* Notification Delivery Channels */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">
                    Fleet Notification Channels
                  </h4>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertsForm.whatsappEnabled ?? true}
                        onChange={(e) =>
                          setAlertsForm({ ...alertsForm, whatsappEnabled: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>WhatsApp Alert</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertsForm.pushEnabled ?? true}
                        onChange={(e) =>
                          setAlertsForm({ ...alertsForm, pushEnabled: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Push Notification</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertsForm.emailEnabled ?? true}
                        onChange={(e) =>
                          setAlertsForm({ ...alertsForm, emailEnabled: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Email Digest</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertsForm.smsEnabled ?? false}
                        onChange={(e) =>
                          setAlertsForm({ ...alertsForm, smsEnabled: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>SMS Dispatch</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={updateAlertsMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {updateAlertsMutation.isPending ? 'Saving...' : 'Save Thresholds'}
                  </button>
                </div>
              </form>
            </SectionCard>
          )}

          {/* TAB 4: Security & Governance */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <SectionCard
                title="Account Security & Compliance Standards"
                description="Review security posture, cryptographic tokens, and data privacy governance."
              >
                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p>
                      <strong>Firebase JWT Authentication:</strong> Session tokens are cryptographically validated on every API request.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p>
                      <strong>Multi-Tenant Isolation:</strong> PostgreSQL row-level security segregates fleet records strictly by UID.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p>
                      <strong>Immutable Audit Logging:</strong> Settings adjustments, alert resolutions, and fuel logs are recorded in audit logs.
                    </p>
                  </div>
                </div>
              </SectionCard>

              {/* Account Deletion Status Banner if active */}
              {deletionStatus?.hasDeletionRequest && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h4 className="text-xs font-bold text-amber-900">
                      Account Deletion Request Active
                    </h4>
                  </div>
                  <p className="text-xs text-amber-800 mt-1">
                    An account deletion job ({deletionStatus.deletionRequest?.status}) was submitted on{' '}
                    {deletionStatus.deletionRequest?.requested_at}.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-rose-900">Delete Fleet Owner Account</h3>
                    <p className="text-xs text-rose-700 mt-1 max-w-xl">
                      Permanently delete this organization account, registered vehicles, driver profiles, and historical telemetry data. This action is irreversible.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmPhrase('');
                      setIsDeleteModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-xs hover:bg-rose-50 transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Request Account Deletion
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900">Confirm Account Deletion</h3>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                This will initiate backend account deletion. All registered vehicles, trips, drivers, fuel logs, and organization profiles will be disabled and queued for purge.
              </p>

              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                Please type <strong className="font-mono text-rose-900">DELETE MY ACCOUNT</strong> below to confirm.
              </div>

              <input
                type="text"
                placeholder="DELETE MY ACCOUNT"
                value={deleteConfirmPhrase}
                onChange={(e) => setDeleteConfirmPhrase(e.target.value)}
                className="w-full font-mono rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    deleteConfirmPhrase.trim() !== 'DELETE MY ACCOUNT' ||
                    deleteAccountMutation.isPending
                  }
                  onClick={() => deleteAccountMutation.mutate(deleteConfirmPhrase)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleteAccountMutation.isPending ? 'Submitting...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
