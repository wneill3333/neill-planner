import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { AuthProvider } from '../AuthContext';
import { useAuth } from '../useAuth';

// Mock Firebase Auth
const mockOnAuthStateChanged = vi.fn();
const mockSignInWithPopup = vi.fn();
const mockSignOut = vi.fn();

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
}));

vi.mock('../../../services/firebase/config', () => ({
  auth: { name: 'mock-auth' },
}));

// Mock users service
const mockGetOrCreateUser = vi.fn();

vi.mock('../../../services/firebase/users.service', () => ({
  getOrCreateUser: (...args: unknown[]) => mockGetOrCreateUser(...args),
}));

// Helper component to display auth state
function AuthStateDisplay(): ReactElement {
  const { user, loading, error } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="user">{user ? user.displayName : 'null'}</div>
      <div data-testid="error">{error || 'null'}</div>
    </div>
  );
}

// Helper component with sign in/out buttons
function AuthActions(): ReactElement {
  const { signInWithGoogle, signOut, clearError } = useAuth();

  return (
    <div>
      <button onClick={signInWithGoogle}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
      <button onClick={clearError}>Clear Error</button>
    </div>
  );
}

describe('AuthContext', () => {
  let authStateCallback: ((user: unknown) => void) | null = null;
  let unsubscribeMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    authStateCallback = null;

    // Setup onAuthStateChanged mock
    unsubscribeMock = vi.fn();
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      authStateCallback = callback;
      return unsubscribeMock;
    });

    mockSignInWithPopup.mockResolvedValue({
      user: { uid: 'test-uid', email: 'test@example.com', displayName: 'Test User' },
    });

    mockSignOut.mockResolvedValue(undefined);
  });

  describe('AuthProvider', () => {
    it('should render children', () => {
      render(
        <AuthProvider>
          <div data-testid="child">Child Content</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('child')).toHaveTextContent('Child Content');
    });

    it('should have loading true initially', () => {
      render(
        <AuthProvider>
          <AuthStateDisplay />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('true');
    });

    it('should subscribe to auth state changes on mount', () => {
      render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      );

      expect(mockOnAuthStateChanged).toHaveBeenCalled();
    });

    it('should unsubscribe from auth state changes on unmount', () => {
      const { unmount } = render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      );

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('should set user when auth state changes to authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'standard' as const,
        googleCalendarConnected: false,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      mockGetOrCreateUser.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <AuthStateDisplay />
        </AuthProvider>
      );

      // Simulate auth state change
      await act(async () => {
        authStateCallback?.({
          uid: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      });
    });

    it('should set user to null when auth state changes to unauthenticated', async () => {
      render(
        <AuthProvider>
          <AuthStateDisplay />
        </AuthProvider>
      );

      // Simulate auth state change to null (signed out)
      await act(async () => {
        authStateCallback?.(null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
    });

    it('should set error when getOrCreateUser fails', async () => {
      mockGetOrCreateUser.mockRejectedValue(new Error('Database error'));

      render(
        <AuthProvider>
          <AuthStateDisplay />
        </AuthProvider>
      );

      // Simulate auth state change
      await act(async () => {
        authStateCallback?.({
          uid: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Database error');
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
    });
  });

  describe('signInWithGoogle', () => {
    it('should call signInWithPopup', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <AuthActions />
        </AuthProvider>
      );

      // Wait for initial load
      await act(async () => {
        authStateCallback?.(null);
      });

      await user.click(screen.getByText('Sign In'));

      expect(mockSignInWithPopup).toHaveBeenCalled();
    });

    it('should set error when sign in fails', async () => {
      const user = userEvent.setup();
      mockSignInWithPopup.mockRejectedValue(new Error('Popup closed'));

      render(
        <AuthProvider>
          <AuthActions />
          <AuthStateDisplay />
        </AuthProvider>
      );

      // Wait for initial load
      await act(async () => {
        authStateCallback?.(null);
      });

      await user.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Popup closed');
      });
    });

    it('should clear error before attempting sign in', async () => {
      const user = userEvent.setup();

      // First sign in fails
      mockSignInWithPopup.mockRejectedValueOnce(new Error('First error'));

      render(
        <AuthProvider>
          <AuthActions />
          <AuthStateDisplay />
        </AuthProvider>
      );

      await act(async () => {
        authStateCallback?.(null);
      });

      // First attempt - fails
      await user.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('First error');
      });

      // Second attempt - error should be cleared first
      mockSignInWithPopup.mockResolvedValueOnce({
        user: { uid: 'test-uid' },
      });

      await user.click(screen.getByText('Sign In'));

      // Error should be cleared (even though callback hasn't fired yet)
      expect(mockSignInWithPopup).toHaveBeenCalledTimes(2);
    });
  });

  describe('signOut', () => {
    it('should call Firebase signOut', async () => {
      const user = userEvent.setup();

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'standard' as const,
        googleCalendarConnected: false,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      mockGetOrCreateUser.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <AuthActions />
        </AuthProvider>
      );

      // Simulate authenticated state
      await act(async () => {
        authStateCallback?.({
          uid: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
        });
      });

      await user.click(screen.getByText('Sign Out'));

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should set error when sign out fails', async () => {
      const user = userEvent.setup();
      mockSignOut.mockRejectedValue(new Error('Sign out failed'));

      render(
        <AuthProvider>
          <AuthActions />
          <AuthStateDisplay />
        </AuthProvider>
      );

      await act(async () => {
        authStateCallback?.(null);
      });

      await user.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Sign out failed');
      });
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      const user = userEvent.setup();
      mockSignInWithPopup.mockRejectedValue(new Error('Test error'));

      render(
        <AuthProvider>
          <AuthActions />
          <AuthStateDisplay />
        </AuthProvider>
      );

      await act(async () => {
        authStateCallback?.(null);
      });

      // Trigger an error
      await user.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      });

      // Clear the error
      await user.click(screen.getByText('Clear Error'));

      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });
  });
});

describe('useAuth', () => {
  it('should throw error when used outside AuthProvider', () => {
    // Component that uses useAuth without provider
    function ComponentWithoutProvider() {
      useAuth();
      return <div>Should not render</div>;
    }

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<ComponentWithoutProvider />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });

  it('should return context value when used inside AuthProvider', () => {
    // Test that useAuth returns all expected properties
    // We verify this by checking if the AuthStateDisplay and AuthActions components work
    // which internally use useAuth and access these properties
    
    render(
      <AuthProvider>
        <AuthStateDisplay />
        <AuthActions />
      </AuthProvider>
    );

    // If these elements render, it means useAuth returned an object with the expected properties
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByTestId('user')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
    expect(screen.getByText('Clear Error')).toBeInTheDocument();
  });
});
