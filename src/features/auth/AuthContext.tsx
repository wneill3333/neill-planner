/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the app.
 * Uses Firebase Auth with Google Sign-In.
 */

import {
  createContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  type ReactElement,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User as FirebaseAuthUser,
} from 'firebase/auth';
import { auth } from '../../services/firebase/config';
import { getOrCreateUser } from '../../services/firebase/users.service';
import type { User } from '../../types';

// =============================================================================
// Types
// =============================================================================

/**
 * Authentication context value type
 */
export interface AuthContextType {
  /** Current authenticated user, null if not authenticated */
  user: User | null;
  /** True while checking authentication state */
  loading: boolean;
  /** Error message if authentication failed */
  error: string | null;
  /** Sign in with Google */
  signInWithGoogle: () => Promise<void>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Clear any authentication errors */
  clearError: () => void;
}

/**
 * Props for AuthProvider component
 */
export interface AuthProviderProps {
  children: ReactNode;
}

// =============================================================================
// Context
// =============================================================================

/**
 * Authentication context
 * Default value is undefined - must be used within AuthProvider
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// Provider Component
// =============================================================================

/**
 * Google Auth Provider instance
 */
const googleProvider = new GoogleAuthProvider();

/**
 * Authentication Provider Component
 *
 * Wraps the application to provide authentication state and methods.
 * Subscribes to Firebase Auth state changes and manages user data.
 */
export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle Firebase Auth state changes
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseAuthUser | null) => {
        try {
          if (firebaseUser) {
            // User is signed in - get or create user document
            const appUser = await getOrCreateUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
            });
            setUser(appUser);
          } else {
            // User is signed out
            setUser(null);
          }
        } catch (err) {
          console.error('Error handling auth state change:', err);
          setError(err instanceof Error ? err.message : 'Authentication error');
          setUser(null);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Auth state observer error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Sign in with Google
   */
  const signInWithGoogle = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      // User state will be updated by onAuthStateChanged
      // Note: setLoading(false) is handled by onAuthStateChanged callback
    } catch (err) {
      console.error('Google sign-in error:', err);

      // Provide more user-friendly error messages
      let errorMessage = 'Failed to sign in with Google';
      if (err instanceof Error) {
        // Handle specific Firebase auth errors
        if (err.message.includes('popup-closed-by-user')) {
          errorMessage = 'Sign in cancelled';
        } else if (err.message.includes('network-request-failed')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setLoading(false);
      throw err; // Re-throw so callers can handle if needed
    }
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      // User state will be updated by onAuthStateChanged
    } catch (err) {
      console.error('Sign out error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Clear any authentication errors
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(
    () => ({
      user,
      loading,
      error,
      signInWithGoogle,
      signOut,
      clearError,
    }),
    [user, loading, error, signInWithGoogle, signOut, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
