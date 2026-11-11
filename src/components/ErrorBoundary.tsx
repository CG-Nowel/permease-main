import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PermEase Kiosk Uncaught Error:', error, errorInfo);
  }

  private handleRecover = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/kiosk';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-[#07132B] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-[#D4AF37] border border-amber-400/40 flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-black font-serif-brand text-[#FFF2B2] mb-2">
            PermEase Terminal Self-Recovery
          </h2>
          <p className="text-sm text-slate-300 max-w-md mb-6">
            The kiosk interface encountered an unexpected interruption. Automatic recovery is ready.
          </p>
          <button
            type="button"
            onClick={this.handleRecover}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-300 hover:from-amber-400 hover:to-amber-200 text-slate-950 font-black text-sm tracking-wide shadow-lg inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <RotateCcw size={16} />
            <span>Reset Kiosk to Tap Screen</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
