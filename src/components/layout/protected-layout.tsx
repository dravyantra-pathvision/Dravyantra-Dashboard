'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Sidebar } from './sidebar';
import { Header } from './header';

export const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, onboardingStatus } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      // Check onboarding status
      if (onboardingStatus === 'Pending Review' && !pathname.startsWith('/onboarding/pending')) {
        router.push('/onboarding/pending');
      } else if (onboardingStatus === 'Rejected' && !pathname.startsWith('/onboarding/rejected')) {
        router.push('/onboarding/rejected');
      } else if (
        (onboardingStatus === 'Draft' || onboardingStatus === 'Unknown') &&
        !pathname.startsWith('/onboarding')
      ) {
        router.push('/onboarding');
      }
    }
  }, [user, loading, onboardingStatus, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-600">Loading DravYantra Fleet Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || onboardingStatus !== 'Approved') {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};
