import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from './App';
import taskReducer from './features/tasks/taskSlice';
import categoryReducer from './features/categories/categorySlice';
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
    },
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
  });

  it('renders without crashing', async () => {
    renderWithProviders(<App />);
    // Simulate auth state (not authenticated)
    await act(async () => {
      authStateCallback?.(null);
    });
    // If we get here without error, the component rendered successfully
    expect(document.body).toBeDefined();
  });

  it('displays the "Neill Planner" heading', async () => {
    renderWithProviders(<App />);
    await act(async () => {
      authStateCallback?.(null);
    });
    const heading = screen.getByRole('heading', { name: /neill planner/i, level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('displays the Franklin-Covey tagline', async () => {
    renderWithProviders(<App />);
    await act(async () => {
      authStateCallback?.(null);
    });
    const tagline = screen.getByText(/franklin-covey productivity system/i);
    expect(tagline).toBeInTheDocument();
  });

  it('displays the tasks page content', async () => {
    renderWithProviders(<App />);
    await act(async () => {
      authStateCallback?.(null);
    });
    // TasksPage should show the daily view with tabs
    const tasksTab = screen.getByRole('tab', { name: /tasks/i });
    expect(tasksTab).toBeInTheDocument();
  });

  it('displays the add task button', async () => {
    renderWithProviders(<App />);
    await act(async () => {
      authStateCallback?.(null);
    });
    // The add task button has aria-label "Add new task"
    const addButton = screen.getByLabelText(/add new task/i);
    expect(addButton).toBeInTheDocument();
  });

  it('has proper semantic structure with header and main elements', async () => {
    renderWithProviders(<App />);
    await act(async () => {
      authStateCallback?.(null);
    });
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    expect(header).toBeInTheDocument();
    expect(main).toBeInTheDocument();
  });
});
