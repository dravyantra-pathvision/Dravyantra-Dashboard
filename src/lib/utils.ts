// src/lib/utils.ts

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UserAccount, Organization } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Checks whether user profile and organization profile are complete.
 * Used for warning alerts/reminders in Dashboard.
 */
export function checkProfileCompletion(user?: UserAccount | null, org?: Organization | null): {
  isUserComplete: boolean;
  isOrgComplete: boolean;
  isFullyComplete: boolean;
} {
  const isUserComplete = Boolean(
    user && user.full_name && user.full_name.trim().length > 0 && user.phone && user.phone.trim().length > 0
  );

  const isOrgComplete = Boolean(
    org &&
      org.name && org.name.trim().length > 0 &&
      org.gstin && org.gstin.trim().length > 0 &&
      org.pan && org.pan.trim().length > 0 &&
      org.city && org.city.trim().length > 0
  );

  return {
    isUserComplete,
    isOrgComplete,
    isFullyComplete: isUserComplete && isOrgComplete,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatLitres(litres: number): string {
  return `${(litres || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} L`;
}

export function formatKm(km: number): string {
  return `${(km || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 1,
  })} km`;
}

export function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return '—';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr?: string | Date): string {
  if (!dateStr) return '—';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

