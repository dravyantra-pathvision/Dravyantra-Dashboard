'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onIdTokenChanged, signOut, User } from 'firebase/auth';
import Cookies from 'js-cookie';
import { auth } from '@/lib/firebase';
import { apiClient } from '@/lib/api-client';
import { OnboardingStatus, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  onboardingStatus: OnboardingStatus;
  logout: () => Promise<void>;
  refetchStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'fleet_owner',
  loading: true,
  onboardingStatus: 'Unknown',
  logout: async () => {},
  refetchStatus: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('fleet_owner');
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>('Unknown');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOnboardingStatus = async () => {
    try {
      const res = await apiClient.get('/api/onboarding/status');
      const statusData = res.data?.data || res.data;
      if (statusData && statusData.status) {
        setOnboardingStatus(statusData.status as OnboardingStatus);
      } else {
        setOnboardingStatus('Draft');
      }
    } catch (e) {
      console.warn('Onboarding status fetch error/unapproved:', e);
      setOnboardingStatus('Draft');
    }
  };

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        try {
          const token = await firebaseUser.getIdToken();
          const savedRole = (Cookies.get('dy_session_role') as UserRole) || 'fleet_owner';
          setRole(savedRole);

          Cookies.set('dy_session_token', token, { expires: 7 });
          Cookies.set('dy_session_role', savedRole, { expires: 7 });

          setUser(firebaseUser);

          // Backend sync
          try {
            await apiClient.post('/api/users/sync', {
              full_name: firebaseUser.displayName || '',
              role: savedRole,
            });
          } catch (syncErr) {
            console.warn('Backend sync warning:', syncErr);
          }

          await fetchOnboardingStatus();
        } catch (err) {
          console.error('Auth token error:', err);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        Cookies.remove('dy_session_token');
        Cookies.remove('dy_session_role');
        setOnboardingStatus('Unknown');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      Cookies.remove('dy_session_token');
      Cookies.remove('dy_session_role');
      setUser(null);
      setOnboardingStatus('Unknown');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        onboardingStatus,
        logout,
        refetchStatus: fetchOnboardingStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
