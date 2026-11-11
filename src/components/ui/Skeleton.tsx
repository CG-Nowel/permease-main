import React from 'react';
import { cn } from '../../lib/utils.ts';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={cn('animate-pulse bg-slate-200/80 rounded-lg', className)} />
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => (
  <div className="w-full space-y-3">
    <div className="flex gap-4 pb-2 border-b border-slate-200">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={`head-${i}`} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={`row-${r}`} className="flex gap-4 py-2 border-b border-slate-100">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={`cell-${r}-${c}`} className="h-5 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="p-6 rounded-[16px] border border-slate-200 bg-white shadow-xs space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    <Skeleton className="h-8 w-20" />
    <Skeleton className="h-3 w-36" />
  </div>
);
