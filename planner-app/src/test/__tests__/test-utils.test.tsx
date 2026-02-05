/**
 * Test Utilities Tests
 *
 * Tests for the custom test utilities and render functions.
 */

import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import {
  renderWithProviders,
  createTestStore,
  generateTestId,
  createMockDateString,
  createMockTimestamp,
  wait,
  nextTick,
} from '../test-utils';
import { useAppDispatch, useAppSelector } from '../../store';

// =============================================================================
// Test Components
// =============================================================================

function TestComponent(): ReactElement {
  return <div data-testid="test-component">Test Component</div>;
}

function ReduxTestComponent(): ReactElement {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.tasks.loading);

  return (
    <div data-testid="redux-test-component">
      <span data-testid="loading-value">{loading ? 'loading' : 'not loading'}</span>
      <button onClick={() => dispatch({ type: 'test' })} data-testid="dispatch-button">
        Dispatch
      </button>
    </div>
  );
}

// =============================================================================
// renderWithProviders Tests
// =============================================================================

describe('renderWithProviders', () => {
  it('should render a basic component', () => {
    const { getByTestId } = renderWithProviders(<TestComponent />);
    expect(getByTestId('test-component')).toBeInTheDocument();
  });

  it('should provide Redux store to components', () => {
    const { getByTestId } = renderWithProviders(<ReduxTestComponent />);

    expect(getByTestId('redux-test-component')).toBeInTheDocument();
    expect(getByTestId('loading-value')).toHaveTextContent('not loading');
  });

  it('should return the store instance', () => {
    const { store } = renderWithProviders(<TestComponent />);

    expect(store).toBeDefined();
    expect(typeof store.getState).toBe('function');
    expect(typeof store.dispatch).toBe('function');
  });

  it('should allow dispatching actions through the returned store', () => {
    const { store } = renderWithProviders(<TestComponent />);

    // This should not throw
    expect(() => store.dispatch({ type: 'test/action' })).not.toThrow();
  });

  it('should accept a custom store', () => {
    const customStore = createTestStore();
    const { store } = renderWithProviders(<TestComponent />, {
      store: customStore,
    });

    expect(store).toBe(customStore);
  });

  it('should render component with all Testing Library queries available', async () => {
    const { getByTestId, queryByTestId, findByTestId, container } = renderWithProviders(
      <TestComponent />
    );

    expect(getByTestId('test-component')).toBeDefined();
    expect(queryByTestId('test-component')).not.toBeNull();
    await expect(findByTestId('test-component')).resolves.toBeDefined();
    expect(container).toBeDefined();
  });
});

// =============================================================================
// createTestStore Tests
// =============================================================================

describe('createTestStore', () => {
  it('should create a valid Redux store', () => {
    const store = createTestStore();

    expect(store).toBeDefined();
    expect(typeof store.getState).toBe('function');
    expect(typeof store.dispatch).toBe('function');
    expect(typeof store.subscribe).toBe('function');
  });

  it('should have initial state with tasks slice', () => {
    const store = createTestStore();
    const state = store.getState();

    expect(state).toHaveProperty('tasks');
    expect(state.tasks).toHaveProperty('tasks');
    expect(state.tasks).toHaveProperty('taskIdsByDate');
    expect(state.tasks).toHaveProperty('loading');
    expect(state.tasks).toHaveProperty('error');
  });

  it('should create independent store instances', () => {
    const store1 = createTestStore();
    const store2 = createTestStore();

    expect(store1).not.toBe(store2);
  });

  it('should dispatch actions without errors', () => {
    const store = createTestStore();

    expect(() => {
      store.dispatch({ type: 'TEST_ACTION' });
    }).not.toThrow();
  });
});

// =============================================================================
// generateTestId Tests
// =============================================================================

describe('generateTestId', () => {
  it('should generate a string ID', () => {
    const id = generateTestId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should use default prefix "test"', () => {
    const id = generateTestId();
    expect(id.startsWith('test-')).toBe(true);
  });

  it('should use custom prefix when provided', () => {
    const id = generateTestId('custom');
    expect(id.startsWith('custom-')).toBe(true);
  });

  it('should generate unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateTestId());
    }
    expect(ids.size).toBe(100);
  });
});

// =============================================================================
// createMockDateString Tests
// =============================================================================

describe('createMockDateString', () => {
  it('should return a string in YYYY-MM-DD format', () => {
    const dateString = createMockDateString();
    expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should default to today when no argument provided', () => {
    const dateString = createMockDateString();
    const today = new Date().toISOString().split('T')[0];
    expect(dateString).toBe(today);
  });

  it('should add days when positive number provided', () => {
    const tomorrow = createMockDateString(1);
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 1);
    const expected = expectedDate.toISOString().split('T')[0];
    expect(tomorrow).toBe(expected);
  });

  it('should subtract days when negative number provided', () => {
    const yesterday = createMockDateString(-1);
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - 1);
    const expected = expectedDate.toISOString().split('T')[0];
    expect(yesterday).toBe(expected);
  });

  it('should handle larger offsets', () => {
    const nextWeek = createMockDateString(7);
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 7);
    const expected = expectedDate.toISOString().split('T')[0];
    expect(nextWeek).toBe(expected);
  });
});

// =============================================================================
// createMockTimestamp Tests
// =============================================================================

describe('createMockTimestamp', () => {
  it('should return a number', () => {
    const timestamp = createMockTimestamp();
    expect(typeof timestamp).toBe('number');
  });

  it('should return a valid timestamp (milliseconds since epoch)', () => {
    const timestamp = createMockTimestamp();
    expect(timestamp).toBeGreaterThan(0);
    expect(timestamp).toBeLessThan(Date.now() + 1000); // Allow 1 second buffer
  });

  it('should return approximately today when no argument', () => {
    const timestamp = createMockTimestamp();
    const now = Date.now();
    // Within 1 second
    expect(Math.abs(timestamp - now)).toBeLessThan(1000);
  });

  it('should add days when positive number provided', () => {
    const tomorrowTimestamp = createMockTimestamp(1);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    // Should be approximately 1 day in the future (within 1 second)
    expect(Math.abs(tomorrowTimestamp - (now + oneDayMs))).toBeLessThan(1000);
  });

  it('should subtract days when negative number provided', () => {
    const yesterdayTimestamp = createMockTimestamp(-1);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    // Should be approximately 1 day in the past (within 1 second)
    expect(Math.abs(yesterdayTimestamp - (now - oneDayMs))).toBeLessThan(1000);
  });
});

// =============================================================================
// Async Utility Tests
// =============================================================================

describe('wait', () => {
  it('should wait for the specified time', async () => {
    const start = Date.now();
    await wait(50);
    const elapsed = Date.now() - start;

    // Should be at least 50ms, allowing some tolerance
    expect(elapsed).toBeGreaterThanOrEqual(45);
    expect(elapsed).toBeLessThan(100);
  });

  it('should resolve with undefined', async () => {
    const result = await wait(10);
    expect(result).toBeUndefined();
  });
});

describe('nextTick', () => {
  it('should resolve on the next event loop tick', async () => {
    let flag = false;

    const promise = nextTick().then(() => {
      flag = true;
    });

    // Flag should still be false synchronously
    expect(flag).toBe(false);

    await promise;

    // Now it should be true
    expect(flag).toBe(true);
  });

  it('should resolve with undefined', async () => {
    const result = await nextTick();
    expect(result).toBeUndefined();
  });

  it('should execute callbacks in order', async () => {
    const order: number[] = [];

    nextTick().then(() => order.push(1));
    nextTick().then(() => order.push(2));
    nextTick().then(() => order.push(3));

    await wait(10); // Wait for all to resolve

    expect(order).toEqual([1, 2, 3]);
  });
});
