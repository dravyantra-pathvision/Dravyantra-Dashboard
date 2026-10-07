'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan' | 'slate' | 'neutral';
  className?: string;
  onClick?: () => void;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  actionText?: string;
}

const accentMap = {
  blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-600',    text: 'text-blue-700',    border: 'border-blue-100', hover: 'hover:border-blue-300 hover:ring-2 hover:ring-blue-500/10' },
  green:   { bg: 'bg-emerald-50', icon: 'bg-emerald-600', text: 'text-emerald-700', border: 'border-emerald-100', hover: 'hover:border-emerald-300 hover:ring-2 hover:ring-emerald-500/10' },
  amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-500',   text: 'text-amber-700',   border: 'border-amber-100', hover: 'hover:border-amber-300 hover:ring-2 hover:ring-amber-500/10' },
  red:     { bg: 'bg-red-50',     icon: 'bg-red-600',     text: 'text-red-700',     border: 'border-red-100', hover: 'hover:border-red-300 hover:ring-2 hover:ring-red-500/10' },
  purple:  { bg: 'bg-purple-50',  icon: 'bg-purple-600',  text: 'text-purple-700',  border: 'border-purple-100', hover: 'hover:border-purple-300 hover:ring-2 hover:ring-purple-500/10' },
  cyan:    { bg: 'bg-cyan-50',    icon: 'bg-cyan-600',    text: 'text-cyan-700',    border: 'border-cyan-100', hover: 'hover:border-cyan-300 hover:ring-2 hover:ring-cyan-500/10' },
  slate:   { bg: 'bg-slate-50',   icon: 'bg-slate-600',   text: 'text-slate-700',   border: 'border-slate-200', hover: 'hover:border-slate-300 hover:ring-2 hover:ring-slate-500/10' },
  neutral: { bg: 'bg-slate-50',   icon: 'bg-slate-600',   text: 'text-slate-700',   border: 'border-slate-200', hover: 'hover:border-slate-300 hover:ring-2 hover:ring-slate-500/10' },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accent = 'blue',
  className,
  onClick,
  trend,
  actionText,
}) => {
  const a = accentMap[accent];
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm transition-all duration-200',
        a.border,
        onClick && cn('cursor-pointer hover:shadow-md hover:-translate-y-0.5', a.hover),
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-normal">
              {title}
            </p>
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold shrink-0',
                  trend.isPositive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
          <p className={cn('text-2xl font-black tracking-tight leading-tight', a.text)}>{value}</p>
          {subtitle && (
            <p className="text-[11px] text-slate-500 font-medium whitespace-normal">{subtitle}</p>
          )}
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-200 group-hover:scale-105', a.icon)}>
          {icon}
        </div>
      </div>

      {onClick && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
          <span>{actionText || 'View details'}</span>
          <span className="transform transition-transform group-hover:translate-x-1">→</span>
        </div>
      )}
    </div>
  );
};

// ─── SectionCard ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  description,
  actions,
  children,
  className,
  bodyClassName,
}) => {
  const sub = subtitle || description;
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900', className)}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 px-5 py-4">
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{title}</h2>
            )}
            {sub && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </div>
  );
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const badgeVariantMap: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger:  'bg-red-50 text-red-700 border-red-200',
  info:    'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
};

const dotVariantMap: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  info:    'bg-blue-500',
  neutral: 'bg-slate-400',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  dot = false,
  className,
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
      badgeVariantMap[variant],
      className
    )}
  >
    {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotVariantMap[variant])} />}
    {label}
  </span>
);

// ─── LoadingSpinner ───────────────────────────────────────────────────────────

export const LoadingSpinner: React.FC<{ label?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  label,
  size = 'md',
}) => {
  const sizeClass = size === 'sm' ? 'h-5 w-5 border-2' : size === 'lg' ? 'h-10 w-10 border-4' : 'h-8 w-8 border-4';
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className={cn('animate-spin rounded-full border-blue-600 border-t-transparent', sizeClass)} />
      {label && <p className="text-xs font-medium text-slate-500">{label}</p>}
    </div>
  );
};

// ─── ErrorState ───────────────────────────────────────────────────────────────

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'Failed to load data.',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
    <p className="text-sm text-slate-700 font-medium">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        Retry
      </button>
    )}
  </div>
);

// ─── EmptyState ───────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  title?: string;
  message?: string;
  description?: string;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  description,
  icon: IconOrElement,
  action,
}) => {
  const displayTitle = title || message || 'No data available.';
  const displayDesc = description;

  const renderIcon = () => {
    if (!IconOrElement) return null;
    if (React.isValidElement(IconOrElement)) return IconOrElement;
    const Comp = IconOrElement as React.ComponentType<{ className?: string }>;
    return <Comp className="h-10 w-10 text-slate-300 dark:text-slate-600" />;
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-slate-500 dark:text-slate-400">
      {renderIcon()}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{displayTitle}</p>
        {displayDesc && <p className="text-xs text-slate-400 dark:text-slate-400 max-w-sm">{displayDesc}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};


// ─── PageHeader ───────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <div className="mb-6 flex items-start justify-between gap-4">
    <div>
      <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

// ─── PeriodSelector ───────────────────────────────────────────────────────────

const PERIODS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
];

interface PeriodSelectorProps {
  value: string;
  onChange: (v: string) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ value, onChange }) => (
  <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
    {PERIODS.map((p) => (
      <button
        key={p.value}
        onClick={() => onChange(p.value)}
        className={cn(
          'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
          value === p.value
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        )}
      >
        {p.label}
      </button>
    ))}
  </div>
);

// ─── DataTable ────────────────────────────────────────────────────────────────

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ columns, data, rowKey, onRowClick }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-slate-50 transition-colors last:border-0',
                onRowClick && 'cursor-pointer hover:bg-slate-50/80'
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3 text-slate-700', col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Table Primitives ────────────────────────────────────────────────────────


export const TableWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs', className)}>
    <table className="w-full text-left text-sm">{children}</table>
  </div>
);

export const TableHeaderCell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <th
    className={cn(
      'whitespace-nowrap px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/80 border-b border-slate-200',
      className
    )}
  >
    {children}
  </th>
);

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <td className={cn('whitespace-nowrap px-4 py-3.5 text-sm text-slate-700', className)}>
    {children}
  </td>
);

export const TableRow: React.FC<{
  children: React.ReactNode;
  isHeader?: boolean;
  className?: string;
  onClick?: () => void;
}> = ({ children, isHeader, className, onClick }) => (
  <tr
    onClick={onClick}
    className={cn(
      isHeader ? 'border-b border-slate-200' : 'border-b border-slate-100 hover:bg-slate-50/60 transition-colors',
      onClick && 'cursor-pointer',
      className
    )}
  >
    {children}
  </tr>
);

// ─── Badge ────────────────────────────────────────────────────────────────────

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
}) => {
  const map: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold',
        map[variant] || map.default,
        className
      )}
    >
      {children}
    </span>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden',
          maxWidthMap[maxWidth]
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// ─── Drawer ───────────────────────────────────────────────────────────────────

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

const drawerWidthMap = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'lg',
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 flex pl-10 max-w-full">
        <div
          className={cn(
            'w-screen bg-white shadow-2xl border-l border-slate-200 flex flex-col',
            drawerWidthMap[width]
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60 shrink-0">
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
};

// ─── ConfirmDialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const displayDescription = description || message || 'Are you sure you want to proceed?';
  const displayConfirm = confirmLabel || confirmText || 'Confirm';
  const displayCancel = cancelLabel || cancelText || 'Cancel';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{displayDescription}</p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {displayCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50',
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700'
                : variant === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            {isLoading ? 'Processing…' : displayConfirm}
          </button>
        </div>
      </div>
    </Modal>
  );
};


