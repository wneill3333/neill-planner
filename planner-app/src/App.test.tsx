import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from './App';
import taskReducer from './features/tasks/taskSlice';
import categoryReducer from './features/categories/categorySlice';
import noteReducer from './features/notes/noteSlice';
import eventReducer from './features/events/eventSlice';
import { AuthProvider } from './features/auth/AuthContext';

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

vi.mock('./services/firebase/config', () => ({
  auth: { name: 'mock-auth' },
}));

// Mock users service
const mockGetOrCreateUser = vi.fn();

vi.mock('./services/firebase/users.service', () => ({
  getOrCreateUser: (...args: unknown[]) => mockGetOrCreateUser(...args),
}));

// Create a test store with all required reducers
function createTestStore() {
  return configureStore({
    reducer: {
      tasks: taskReducer,
      categories: categoryReducer,
      notes: noteReducer,
      events: eventReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
}

// Wrapper component with Redux provider and Auth provider
function renderWithProviders(ui: React.ReactElement) {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <AuthProvider>{ui}</AuthProvider>
    </Provider>
  );
}

describe('App', () => {
  let authStateCallback: ((user: unknown) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    authStateCallback = null;

    // Setup onAuthStateChanged mock
    const unsubscribeMock = vi.fn();
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      authStateCallback = callback;
      return unsubscribeMock;
    });

    // Default mock for getOrCreateUser (for authenticated tests)
    mockGetOrCreateUser.mockResolvedValue({
      id: 'user-123',
      firebaseUid: 'firebase-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('Unauthenticated State', () => {
    it('renders login page when not authenticated', async () => {
      renderWithProviders(<App />);
      // Simulate auth state (not authenticated)
      await act(async () => {
        authStateCallback?.(null);
      });
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('displays the "Neill Planner" heading on login page', async () => {
      renderWithProviders(<App />);
      await act(async () => {
        authStateCallback?.(null);
      });
      const heading = screen.getByRole('heading', { name: /neill planner/i, level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('displays the Franklin-Covey tagline on login page', async () => {
      renderWithProviders(<App />);
      await act(async () => {
        authStateCallback?.(null);
      });
      const tagline = screen.getByText(/franklin-covey productivity system/i);
      expect(tagline).toBeInTheDocument();
    });

    it('displays Google sign-in button', async () => {
      renderWithProviders(<App />);
      await act(async () => {
        authStateCallback?.(null);
      });
      const signInButton = screen.getByTestId('google-sign-in-button');
      expect(signInButton).toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    const mockFirebaseUser = {
      uid: 'firebase-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
    };

    it('displays the tasks page when authenticated', async () => {
      renderWithProviders(<App />);
      // Simulate authenticated state
      await act(async () => {
        authStateCallback?.(mockFirebaseUser);
      });
      // TasksPage should show the daily view with tabs
      const tasksTab = screen.getByRole('tab', { name: /tasks/i });
      expect(tasksTab).toBeInTheDocument();
    });

    it('displays the add task button when authenticated', async () => {
      renderWithProviders(<App />);
      await act(async () => {
        authStateCallback?.(mockFirebaseUser);
      });
      // The add task button has aria-label "Add new task"
      const addButton = screen.getByLabelText(/add new task/i);
      expect(addButton).toBeInTheDocument();
    });

    it('has proper semantic structure with header and main elements', async () => {
      renderWithProviders(<App />);
      await act(async () => {
        authStateCallback?.(mockFirebaseUser);
      });
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      expect(header).toBeInTheDocument();
      expect(main).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner while auth is loading', () => {
      renderWithProviders(<App />);
      // Before auth callback fires, should show loading spinner
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });
  });
});
