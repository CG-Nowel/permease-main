import React from 'react';
import { cn } from '../../lib/utils.ts';

export type StatCardVariant =
  | 'default'
  | 'neutral'
  | 'amber'
  | 'warning'
  | 'emerald'
  | 'success'
  | 'rose'
  | 'danger'
  | 'blue'
  | 'info'
  | 'purple';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  subtext?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: StatCardVariant;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  children?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  subtext,
  icon,
  variant = 'default',
  trend,
  className = '',
  children,
  ...props
}) => {
  const displaySubtitle = subtitle ?? subtext;

  // System-wide unrounded (sharp) card styling
  const variantStyles: Record<
    string,
    { card: string; title: string; value: string; subtitle: string; iconBg?: string }
  > = {
    default: {
      card: 'bg-white border border-slate-200 shadow-xs',
      title: 'text-slate-500',
      value: 'text-[#0B1B3D]',
      subtitle: 'text-slate-500',
      iconBg: 'bg-slate-100 text-slate-700',
    },
    neutral: {
      card: 'bg-white border border-slate-200 shadow-xs',
      title: 'text-slate-500',
      value: 'text-[#0B1B3D]',
      subtitle: 'text-slate-500',
      iconBg: 'bg-slate-100 text-slate-700',
    },
    amber: {
      card: 'bg-amber-50/40 border border-amber-200 shadow-xs',
      title: 'text-amber-800',
      value: 'text-amber-700',
      subtitle: 'text-amber-600',
      iconBg: 'bg-amber-100 text-amber-800',
    },
    warning: {
      card: 'bg-amber-50/40 border border-amber-200 shadow-xs',
      title: 'text-amber-800',
      value: 'text-amber-700',
      subtitle: 'text-amber-600',
      iconBg: 'bg-amber-100 text-amber-800',
    },
    emerald: {
      card: 'bg-emerald-50/40 border border-emerald-200 shadow-xs',
      title: 'text-emerald-800',
      value: 'text-emerald-700',
      subtitle: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-800',
    },
    success: {
      card: 'bg-emerald-50/40 border border-emerald-200 shadow-xs',
      title: 'text-emerald-800',
      value: 'text-emerald-700',
      subtitle: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-800',
    },
    rose: {
      card: 'bg-rose-50/40 border border-rose-200 shadow-xs',
      title: 'text-rose-800',
      value: 'text-rose-700',
      subtitle: 'text-rose-600',
      iconBg: 'bg-rose-100 text-rose-800',
    },
    danger: {
      card: 'bg-rose-50/40 border border-rose-200 shadow-xs',
      title: 'text-rose-800',
      value: 'text-rose-700',
      subtitle: 'text-rose-600',
      iconBg: 'bg-rose-100 text-rose-800',
    },
    blue: {
      card: 'bg-blue-50/40 border border-blue-200 shadow-xs',
      title: 'text-blue-800',
      value: 'text-blue-700',
      subtitle: 'text-blue-600',
      iconBg: 'bg-blue-100 text-blue-800',
    },
    info: {
      card: 'bg-blue-50/40 border border-blue-200 shadow-xs',
      title: 'text-blue-800',
      value: 'text-blue-700',
      subtitle: 'text-blue-600',
      iconBg: 'bg-blue-100 text-blue-800',
    },
    purple: {
      card: 'bg-purple-50/40 border border-purple-200 shadow-xs',
      title: 'text-purple-800',
      value: 'text-purple-700',
      subtitle: 'text-purple-600',
      iconBg: 'bg-purple-100 text-purple-800',
    },
  };

  const currentTheme = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={cn(
        'p-4 rounded-none transition-all duration-200 select-none',
        currentTheme.card,
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'text-[11px] font-semibold uppercase tracking-wider block',
            currentTheme.title
          )}
        >
          {title}
        </span>
        {icon && (
          <div className={cn('p-1.5 rounded-none shrink-0', currentTheme.iconBg)}>
            {icon}
          </div>
        )}
      </div>

      <div
        className={cn(
          'text-2xl font-black mt-1 block tracking-tight',
          currentTheme.value
        )}
      >
        {value}
      </div>

      {(displaySubtitle || trend) && (
        <div className="mt-0.5 flex items-center justify-between gap-2">
          {displaySubtitle && (
            <span className={cn('text-[10px] block', currentTheme.subtitle)}>
              {displaySubtitle}
            </span>
          )}
          {trend && (
            <span
              className={cn(
                'text-[10px] font-bold',
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value} {trend.label}
            </span>
          )}
        </div>
      )}

      {children}
    </div>
  );
};
