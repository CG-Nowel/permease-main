import React from 'react';
import { cn } from '../../lib/utils.ts';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'goldAccent' | 'kiosk';
  rounded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  variant = 'default',
  rounded = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-slate-200/80 shadow-xs rounded-none',
    goldAccent: 'bg-white border-t-4 border-t-[#D4AF37] border-x border-b border-slate-200 shadow-xs rounded-none',
    kiosk: 'bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md rounded-none',
  };

  return (
    <div className={cn(variantStyles[variant], 'overflow-hidden transition-all duration-200', className)} {...props}>
      {header && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100">
          {footer}
        </div>
      )}
    </div>
  );
};
