/**
 * Test Utilities
 *
 * Custom render function and utilities for testing React components
 * with all necessary providers (Redux, Router, etc.).
 */

import { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import taskReducer from '../features/tasks/taskSlice';
import categoryReducer from '../features/categories/categorySlice';
import type { RootState, AppStore } from '../store';

// =============================================================================
// Store Factory for Testing
// =============================================================================

/**
 * Root reducer for test store
 * This should match the production store reducer structure
 */
const rootReducer = combineReducers({
  tasks: taskReducer,
  categories: categoryReducer,
});

/**
 * Create a test store with optional preloaded state
 */
export function createTestStore(preloadedState?: Partial<RootState>): AppStore {
  return configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState as RootState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for easier testing
      }),
  });
}

// =============================================================================
// Test Wrapper Component
// =============================================================================

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
}

interface RenderWithProvidersResult extends RenderResult {
  store: AppStore;
}

/**
 * All-in-one wrapper component for testing
 * Includes all necessary providers (Redux, Router in future, etc.)
 */
function AllProviders({
  children,
  store,
}: {
  children: ReactNode;
  store: AppStore;
}): ReactElement {
  return <Provider store={store}>{children}</Provider>;
}

// =============================================================================
// Custom Render Function
// =============================================================================

/**
 * Custom render function that wraps component with all providers
 *
 * @param ui - The component to render
 * @param options - Extended render options including preloaded state and custom store
 * @returns Render result plus the store for assertions
 *
 * @example
 * // Basic usage
 * const { getByText } = renderWithProviders(<MyComponent />);
 *
 * @example
 * // With preloaded state
 * const { getByText, store } = renderWithProviders(<MyComponent />, {
 *   preloadedState: {
 *     tasks: { tasks: {...}, taskIdsByDate: {...}, ... }
 *   }
 * });
 *
 * @example
 * // With custom store
 * const customStore = createTestStore();
 * const { getByText } = renderWithProviders(<MyComponent />, {
 *   store: customStore
 * });
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
): RenderWithProvidersResult {
  function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return <AllProviders store={store}>{children}</AllProviders>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// =============================================================================
// Test Data Factories
// =============================================================================

/**
 * Generate a unique test ID
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a mock date string in ISO format
 */
export function createMockDateString(daysFromNow = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

/**
 * Create a mock timestamp
 */
export function createMockTimestamp(daysFromNow = 0): number {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.getTime();
}

// =============================================================================
// Async Test Utilities
// =============================================================================

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for the next tick
 */
export function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// =============================================================================
// Re-exports from Testing Library
// =============================================================================

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Don't override the built-in render, export custom render separately
// Users can import { render } for basic tests or { renderWithProviders } for provider tests
