import React from 'react';
import type { FinancialStatusType, PermitStatusType } from '../../types/index.ts';
import { cn } from '../../lib/utils.ts';

export interface BadgeProps {
  status?: FinancialStatusType | PermitStatusType | 'ACTIVE' | 'INACTIVE' | 'LOST' | 'PAID' | 'CONSUMED' | string;
  label?: string;
  variant?: 'cleared' | 'balance' | 'printed' | 'gold' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, label, variant, className = '' }) => {
  let computedVariant: string = variant || 'neutral';

  if (!variant && status) {
    switch (status) {
      case 'CLEARED':
      case 'PAID':
      case 'ACTIVE':
      case 'APPROVED':
      case 'SETTLED':
        computedVariant = 'cleared';
        break;
      case 'WITH_BALANCE':
      case 'BLOCKED':
      case 'LOST':
      case 'REJECTED':
        computedVariant = 'balance';
        break;
      case 'PRINTED':
      case 'CONSUMED':
        computedVariant = 'printed';
        break;
      case 'AVAILABLE':
      case 'PENDING':
        computedVariant = 'gold';
        break;
      case 'PROMISSORY':
        computedVariant = 'purple';
        break;
      default:
        computedVariant = 'neutral';
    }
  }

  const styles = {
    cleared: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20',
    balance: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20',
    printed: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20',
    gold: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-600/20',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-600/20',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-600/10',
  };

  const dotColors = {
    cleared: 'bg-emerald-500',
    balance: 'bg-rose-500',
    printed: 'bg-blue-500',
    gold: 'bg-amber-500',
    purple: 'bg-purple-500',
    neutral: 'bg-slate-400',
  };

  const displayLabel = label || status?.replace(/_/g, ' ') || 'UNKNOWN';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[11px] font-semibold border',
        styles[computedVariant as keyof typeof styles],
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-xs',
          dotColors[computedVariant as keyof typeof dotColors]
        )}
      />
      {displayLabel}
    </span>
  );
};
