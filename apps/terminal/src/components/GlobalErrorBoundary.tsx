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
    console.error('Institutional UI Crash:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020205] flex flex-col items-center justify-center p-6 text-center font-sans selection:bg-red-500/30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#3d0000,transparent_50%)] pointer-events-none opacity-40" />
          
          <div className="max-w-xl w-full bg-[#0a0a0f]/80 border border-red-900/30 rounded-3xl p-12 shadow-[0_0_100px_rgba(255,0,0,0.05)] backdrop-blur-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-50" />
            
            <div className="w-20 h-20 bg-red-500/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.1)] group-hover:scale-110 transition-transform duration-500">
              <AlertTriangle className="w-10 h-10 text-red-500/80" />
            </div>
            
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight uppercase italic flex items-center justify-center gap-3">
              <span className="w-8 h-px bg-red-500/30" />
              Terminal Failure
              <span className="w-8 h-px bg-red-500/30" />
            </h1>
            
            <p className="text-gray-400 mb-10 leading-relaxed text-lg max-w-sm mx-auto">
              The RZUNA engine encountered a critical rendering exception. <span className="text-gray-200">Execution and funds remain unaffected.</span>
            </p>

            {this.state.error && (
              <div className="mb-10 text-left">
                <details className="group/details cursor-pointer">
                  <summary className="text-xs font-mono uppercase tracking-widest text-gray-600 hover:text-red-400 transition-colors flex items-center gap-2 mb-2 list-none justify-center">
                    View Hardware Diagnostics
                  </summary>
                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 font-mono text-[10px] text-red-400/70 overflow-x-auto max-h-32 leading-tight">
                    {this.state.error.stack}
                  </div>
                </details>
              </div>
            )}

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full h-16 bg-white/5 hover:bg-red-600 group-hover:bg-red-600/10 text-white border border-white/10 hover:border-red-500/50 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
            >
              <RefreshCcw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" /> 
              Re-Infiltrate Dashboard
            </button>
          </div>

          <div className="mt-12 flex items-center gap-6 text-gray-600 text-[10px] uppercase tracking-[0.3em] font-bold">
            <span>RZUNA.CORP</span>
            <span className="w-1 h-1 bg-gray-800 rounded-full" />
            <span>Institutional Grade Protection</span>
            <span className="w-1 h-1 bg-gray-800 rounded-full" />
            <span>Refiner v1.6</span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
