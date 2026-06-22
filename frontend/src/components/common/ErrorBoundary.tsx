import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorId: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Generate a unique reference ID for logs tracking
    const errorId = `ERR-TA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught React boundary error [${this.state.errorId}]:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: null });
    // Attempt to refresh the page route
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorId: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6 w-full">
          <div className="glass-panel p-8 rounded-2xl shadow-xl flex flex-col items-center gap-5 max-w-md text-center border border-slate-200/10 dark:border-slate-800/60 bg-slate-100/70 dark:bg-slate-900/60">
            {/* Error Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-500 shadow-sm shrink-0">
              <AlertTriangle size={28} />
            </div>

            {/* Error Text Details */}
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Component Render Crash
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                An unexpected error occurred during rendering this module. Technical stack traces have been routed to the console.
              </p>
              
              {/* Error Incident Reference ID */}
              <div className="mt-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 self-center">
                <span>Incident Reference:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-250 select-all">{this.state.errorId}</span>
              </div>

              {this.state.error && (
                <pre className="p-3.5 rounded bg-slate-900/95 text-rose-400 text-[10px] font-mono overflow-x-auto text-left whitespace-pre-wrap max-h-24 select-text">
                  {this.state.error.message}
                </pre>
              )}
            </div>

            {/* Action Toggles */}
            <div className="flex flex-wrap gap-3.5 justify-center w-full mt-2">
              <button
                onClick={this.handleRetry}
                className="px-4.5 py-2.5 rounded-xl border border-slate-350 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-900 transition-all outline-none focus-ring"
              >
                <RefreshCw size={13} />
                <span>Retry Reload</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all outline-none focus-ring"
              >
                <Home size={13} />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
