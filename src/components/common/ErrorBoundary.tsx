import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Qsmart Uncaught Runtime Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetCache = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070A10] text-slate-100 flex items-center justify-center p-6 font-mono">
          <div className="max-w-xl w-full bg-[#0E131F] border border-red-500/40 rounded-xl p-6 shadow-2xl shadow-red-950/20">
            <div className="flex items-center space-x-3 mb-4 text-red-400">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100">Qsmart • Runtime Error Recovered</h1>
                <p className="text-xs text-red-400 font-medium">An unexpected exception occurred during application execution</p>
              </div>
            </div>

            <div className="bg-[#070A10] border border-slate-800 rounded-lg p-4 mb-5 text-xs text-red-300 overflow-x-auto">
              <div className="font-semibold text-slate-400 mb-1">Error Message:</div>
              <div className="text-red-400 font-bold mb-3">{this.state.error?.message || 'Unknown runtime exception'}</div>
              {this.state.error?.stack && (
                <div>
                  <div className="font-semibold text-slate-500 mb-1">Stack Trace:</div>
                  <pre className="text-[10px] text-slate-400 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {this.state.error.stack}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-1/2 flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
              <button
                onClick={this.handleResetCache}
                className="w-full sm:w-1/2 flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-semibold rounded-lg border border-red-500/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Stale Storage & Reset</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
