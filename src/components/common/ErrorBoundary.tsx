/**
 * Error Boundary Component
 *
 * Catches React errors in child components and displays a fallback UI.
 * Prevents the entire app from crashing due to component errors.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';

// =============================================================================
// Types
// =============================================================================

interface ErrorBoundaryProps {
  /** Child components to protect */
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
  /** Optional error handler callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// =============================================================================
// Default Fallback Component
// =============================================================================

function DefaultErrorFallback({ error, errorInfo }: { error: Error; errorInfo: ErrorInfo }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-red-100 p-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center mb-6">
          <svg
            className="w-12 h-12 text-red-500 mr-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
            <p className="text-gray-600 mt-1">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
          </div>
        </div>

        {import.meta.env.MODE === 'development' && (
          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 mb-2">
              Error Details (Development Only)
            </summary>
            <div className="bg-gray-50 rounded-lg p-4 mt-2">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Error Message:</h3>
                <pre className="text-xs text-red-600 whitespace-pre-wrap break-words">
                  {error.toString()}
                </pre>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Component Stack:</h3>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words overflow-x-auto">
                  {errorInfo.componentStack}
                </pre>
              </div>
            </div>
          </details>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-lg bg-amber-500 text-white transition-colors hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Refresh Page
          </button>
          <button
            type="button"
            onClick={() => (window.location.href = '/')}
            className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Error Boundary Component
// =============================================================================

/**
 * Error Boundary - Catches errors in child components
 *
 * This component implements React's error boundary pattern to catch
 * errors that occur during rendering, in lifecycle methods, and in
 * constructors of the whole tree below them.
 *
 * @example
 * ```tsx
 * <ErrorBoundary onError={(error, errorInfo) => logToService(error, errorInfo)}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Handle the error - log it and call optional error handler
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (import.meta.env.MODE === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call optional error handler prop
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo);
      }

      // Otherwise use default fallback
      return (
        <DefaultErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
