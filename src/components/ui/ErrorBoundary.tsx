import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
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
    console.error('Uncaught runtime error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 max-w-lg w-full text-center">
            <h2 className="text-2xl font-bold text-stone-900 mb-3">Something went wrong</h2>
            <p className="text-stone-600 mb-6">
              An unexpected error has occurred in the application.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors font-medium mb-4"
            >
              Reload application
            </button>
            {this.state.error && (
              <div className="text-left mt-2">
                <pre className="p-4 bg-stone-100 text-stone-600 text-sm rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
