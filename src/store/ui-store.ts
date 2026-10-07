import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface UiState {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  customPeriodStart: string | null;
  customPeriodEnd: string | null;
  setCustomPeriod: (start: string, end: string) => void;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem('dy-theme') as ThemeMode | null;
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch (_) {
    return 'light';
  }
};

const applyThemeToDocument = (theme: ThemeMode) => {
  if (typeof window === 'undefined') return;
  try {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dy-theme', theme);
  } catch (_) {}
};

export const useUiStore = create<UiState>((set) => ({
  theme: 'light',
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      applyThemeToDocument(nextTheme);
      return { theme: nextTheme };
    }),
  setTheme: (theme) => {
    applyThemeToDocument(theme);
    set({ theme });
  },
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  selectedPeriod: 'today',
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
  customPeriodStart: null,
  customPeriodEnd: null,
  setCustomPeriod: (start, end) => set({ customPeriodStart: start, customPeriodEnd: end, selectedPeriod: 'custom' }),
}));


