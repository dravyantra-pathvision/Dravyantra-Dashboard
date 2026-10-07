'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth-provider';
import { useUiStore, ThemeMode } from '@/store/ui-store';

function ThemeInitializer() {
  const { setTheme } = useUiStore();

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('dy-theme') as ThemeMode | null;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    } catch (_) {}
  }, [setTheme]);

  return null;
}

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 10, // 10 seconds
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

