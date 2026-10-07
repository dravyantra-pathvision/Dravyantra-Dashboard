'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  Map,
  Fuel,
  AlertTriangle,
  Wallet,
  Leaf,
  FileText,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useUiStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'core' | 'analytics' | 'management';
}

export const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'core' },
  { title: 'Vehicles', href: '/vehicles', icon: Truck, category: 'core' },
  { title: 'Drivers', href: '/drivers', icon: Users, category: 'core' },
  { title: 'Trips', href: '/trips', icon: MapPin, category: 'core' },
  { title: 'Live Tracking', href: '/live-tracking', icon: Map, category: 'core' },
  { title: 'Fuel', href: '/fuel', icon: Fuel, category: 'analytics' },
  { title: 'Alerts', href: '/alerts', icon: AlertTriangle, category: 'analytics' },
  { title: 'Savings', href: '/savings', icon: Wallet, category: 'analytics' },
  { title: 'Carbon', href: '/carbon', icon: Leaf, category: 'analytics' },
  { title: 'Reports', href: '/reports', icon: FileText, category: 'management' },
  { title: 'Settings', href: '/settings', icon: Settings, category: 'management' },
  { title: 'Support', href: '/support', icon: HelpCircle, category: 'management' },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar, isMobileMenuOpen, closeMobileMenu } = useUiStore();

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden animate-in fade-in-50 duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={cn(
          'flex flex-col border-r border-slate-200 bg-white text-slate-800 transition-all duration-300 ease-in-out select-none shadow-sm z-50 md:z-30',
          // Desktop behavior
          'hidden md:relative md:flex',
          isSidebarCollapsed ? 'md:w-16' : 'md:w-64',
          // Mobile overlay behavior
          isMobileMenuOpen && 'fixed inset-y-0 left-0 flex w-64 shadow-2xl animate-in slide-in-from-left duration-200'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
          <Link
            href="/dashboard"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-md shadow-blue-500/20">
              <Truck className="h-5 w-5" />
            </div>
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-slate-900 leading-tight">
                  DravYantra
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-blue-600 uppercase">
                  Fleet Dashboard
                </span>
              </div>
            )}
          </Link>

          {/* Desktop collapse toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Mobile close toggle */}
          <button
            onClick={closeMobileMenu}
            className="flex md:hidden h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title="Close menu"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  isSidebarCollapsed && !isMobileMenuOpen && 'justify-center px-0'
                )}
                title={isSidebarCollapsed && !isMobileMenuOpen ? item.title : undefined}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-700'
                  )}
                />
                {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </div>

        {/* Footer Info Badge */}
        {(!isSidebarCollapsed || isMobileMenuOpen) && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 m-2 rounded-xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col text-[11px]">
                <span className="font-semibold text-slate-700">DravYantra v1.0</span>
                <span className="text-slate-500">Pathvision Innovations</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

