'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-[#1a1a2e] border border-red-500/20 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-3xl font-black text-white mb-4 tracking-tighter">UI CRASH DETECTED</h1>
            <p className="text-gray-400 mb-8 leading-relaxed">
              We encountered an unexpected rendering error. Your funds are safe, but the dashboard needs to be reloaded.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full h-14 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/50 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-5 h-5" /> Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
