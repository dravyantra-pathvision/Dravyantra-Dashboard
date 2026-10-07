'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Moon,
  Sun,
  User as UserIcon,
  LogOut,
  Settings,
  Building2,
  CheckCircle2,
  AlertCircle,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { navItems } from './sidebar';
import { useUiStore } from '@/store/ui-store';
import { apiClient } from '@/lib/api-client';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const { toggleSidebar, toggleMobileMenu, theme, toggleTheme } = useUiStore();

  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  // Ping backend server connectivity status
  useEffect(() => {
    const checkConnectivity = async () => {
      try {
        await apiClient.get('/health', { timeout: 4000 });
        setIsConnected(true);
      } catch (_) {
        setIsConnected(false);
      }
    };
    checkConnectivity();
    const interval = setInterval(checkConnectivity, 30000);
    return () => clearInterval(interval);
  }, []);

  // Determine current page title
  const currentNavItem = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const pageTitle = currentNavItem ? currentNavItem.title : 'Fleet Management';

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 md:px-6 backdrop-blur-md">
        {/* Left Section: Mobile Menu & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileMenu}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
              {pageTitle}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span>Overview</span>
              <span>/</span>
              <span className="text-blue-600 font-semibold">{pageTitle}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Connection Status, Notifications, Profile */}
        <div className="flex items-center gap-3">
          {/* Server Connection Status Badge */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={
              isConnected
                ? 'Connected to DravYantra AWS Backend'
                : 'Server Unreachable: Operating with Cached Data'
            }
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="hidden sm:inline">{isConnected ? 'ONLINE' : 'OFFLINE MODE'}</span>
          </div>

          {/* Theme Toggle (Night Mode / Day Mode) — Exactly Left to Alert Icon */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-xs active:scale-95"
            title={theme === 'dark' ? 'Switch to Light Day Theme' : 'Switch to Dark Night Theme (Easy on eyes)'}
            aria-label="Toggle Night Theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600 transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>

          {/* Notifications Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg z-50 animate-in fade-in-50 zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <span className="font-bold text-xs text-slate-800">Notifications & Alerts</span>
                  <span className="text-[10px] text-blue-600 font-medium cursor-pointer hover:underline">
                    Mark all read
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex gap-2.5 p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800">KA 33 W 1234 — Idle Alert</p>
                      <p className="text-slate-500 text-[11px]">Vehicle idling for 25 mins</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800">Trip Completed</p>
                      <p className="text-slate-500 text-[11px]">Trip #TRIP-8812 delivered</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 font-bold text-white text-xs">
                {user?.email ? user.email[0].toUpperCase() : 'D'}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.displayName || user?.email?.split('@')[0] || 'Fleet Owner'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium capitalize">
                  {role.replace('_', ' ')}
                </span>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-50 animate-in fade-in-50 zoom-in-95 text-xs">
                <div className="p-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900 truncate">{user?.email}</p>
                  <p className="text-[11px] text-blue-600 font-semibold capitalize mt-0.5">
                    Role: {role}
                  </p>
                </div>
                <div className="py-1">
                  <a
                    href="/settings/organization"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span>Organization Profile</span>
                  </a>
                  <a
                    href="/settings"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    <span>System Settings</span>
                  </a>
                </div>
                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-red-600 hover:bg-red-50 font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Confirm Sign Out</h3>
            <p className="mt-2 text-xs text-slate-600">
              Are you sure you want to log out of your DravYantra Fleet Owner dashboard?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-sm"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
