/**
 * useAuth Hook
 *
 * Custom hook to access authentication context.
 * Must be used within an AuthProvider.
 */

import { useContext } from 'react';
import { AuthContext, type AuthContextType } from './AuthContext';

/**
 * Hook to access authentication state and methods
 *
 * @returns Authentication context value
 * @throws Error if used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading, signInWithGoogle, signOut } = useAuth();
 *
 *   if (loading) return <Spinner />;
 *   if (!user) return <LoginButton onClick={signInWithGoogle} />;
 *
 *   return <div>Welcome, {user.displayName}!</div>;
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
