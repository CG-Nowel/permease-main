import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'kiosk';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-[#0B1B3D] text-white hover:bg-[#122857] active:bg-[#071128] focus:ring-[#0B1B3D] shadow-sm',
    gold: 'bg-[#D4AF37] text-[#0B1B3D] font-semibold hover:bg-[#E5C358] active:bg-[#C29D29] focus:ring-[#D4AF37] shadow-sm',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 focus:ring-slate-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 shadow-sm',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-[#D4AF37]',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-xs gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xs gap-2',
    lg: 'text-base px-6 py-2.5 rounded-xs gap-2.5',
    kiosk: 'text-xl px-10 py-5 rounded-sm gap-3 font-bold tracking-wide shadow-lg',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
