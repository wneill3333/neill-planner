/**
 * LoginPage Component
 *
 * Displays the login screen with Google Sign-In option.
 * Shown when user is not authenticated.
 */

import { useAuth } from './useAuth';
import { Button, Spinner } from '../../components/common';

// =============================================================================
// Types
// =============================================================================

export interface LoginPageProps {
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * LoginPage - Authentication screen
 *
 * Features:
 * - App branding and tagline
 * - Google Sign-In button
 * - Loading state during sign-in
 * - Error display
 *
 * @example
 * ```tsx
 * <LoginPage />
 * ```
 */
export function LoginPage({ testId = 'login-page' }: LoginPageProps) {
  const { signInWithGoogle, loading, error, clearError, isAccessDenied } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // Error is already set in context
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 px-4"
      data-testid={testId}
    >
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Logo/Title */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Neill Planner</h1>
            <p className="mt-2 text-gray-600">
              Franklin-Covey Productivity System
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Description */}
          <p className="text-center text-sm text-gray-500">
            Prioritize your tasks using the A-B-C-D method. Focus on what
            matters most.
          </p>

          {/* Access Denied Banner */}
          {isAccessDenied && (
            <div
              className="bg-red-100 border border-red-300 rounded-lg p-4 text-center"
              data-testid="access-denied-banner"
            >
              <div className="flex justify-center mb-2">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-800">
                Access Denied
              </h3>
              <p className="mt-1 text-sm text-red-700">
                Your email is not authorized to access this application. Contact
                an administrator for access.
              </p>
              <button
                onClick={() => {
                  clearError();
                }}
                className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try a different account
              </button>
            </div>
          )}

          {/* Error Message (hidden when access denied banner is showing) */}
          {error && !isAccessDenied && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              role="alert"
              data-testid="login-error"
            >
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Sign In Button */}
          <Button
            onClick={handleSignIn}
            disabled={loading}
            variant="primary"
            className="w-full flex items-center justify-center gap-3 py-3"
            data-testid="google-sign-in-button"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                {/* Google Icon */}
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </Button>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400">
            Your data is securely stored and synced across devices.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
