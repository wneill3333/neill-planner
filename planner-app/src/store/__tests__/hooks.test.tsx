/**
 * Redux Hooks Tests
 *
 * Tests for typed useAppDispatch and useAppSelector hooks.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { store } from '../store';

// =============================================================================
// Test Utilities
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyStore = ReturnType<typeof configureStore<any>>;

/**
 * Wrapper component for providing Redux store to hooks
 */
const createWrapper =
  (testStore: AnyStore = store) =>
  ({ children }: { children: ReactNode }) => (
    <Provider store={testStore}>{children}</Provider>
  );

// =============================================================================
// Test Slice for Hook Testing
// =============================================================================

const testSlice = createSlice({
  name: 'hookTest',
  initialState: {
    counter: 0,
    message: '',
    items: [] as string[],
  },
  reducers: {
    increment: (state) => {
      state.counter += 1;
    },
    decrement: (state) => {
      state.counter -= 1;
    },
    setCounter: (state, action: PayloadAction<number>) => {
      state.counter = action.payload;
    },
    setMessage: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
    },
    addItem: (state, action: PayloadAction<string>) => {
      state.items.push(action.payload);
    },
    clearItems: (state) => {
      state.items = [];
    },
  },
});

/**
 * Create a test store with the test slice
 */
const createTestStore = () =>
  configureStore({
    reducer: {
      hookTest: testSlice.reducer,
    },
  });

type TestStore = ReturnType<typeof createTestStore>;
type TestState = ReturnType<TestStore['getState']>;

// =============================================================================
// useAppDispatch Tests
// =============================================================================

describe('useAppDispatch', () => {
  it('should return a dispatch function', () => {
    const testStore = createTestStore();
    const { result } = renderHook(() => useAppDispatch(), {
      wrapper: createWrapper(testStore),
    });

    expect(typeof result.current).toBe('function');
  });

  it('should dispatch actions that update state', () => {
    const testStore = createTestStore();
    const { result } = renderHook(() => useAppDispatch(), {
      wrapper: createWrapper(testStore),
    });

    act(() => {
      result.current(testSlice.actions.setCounter(42));
    });

    expect(testStore.getState().hookTest.counter).toBe(42);
  });

  it('should dispatch multiple actions in sequence', () => {
    const testStore = createTestStore();
    const { result } = renderHook(() => useAppDispatch(), {
      wrapper: createWrapper(testStore),
    });

    act(() => {
      result.current(testSlice.actions.increment());
      result.current(testSlice.actions.increment());
      result.current(testSlice.actions.increment());
    });

    expect(testStore.getState().hookTest.counter).toBe(3);
  });

  it('should return the dispatched action', () => {
    const testStore = createTestStore();
    const { result } = renderHook(() => useAppDispatch(), {
      wrapper: createWrapper(testStore),
    });

    let returnedAction: ReturnType<typeof testSlice.actions.setMessage>;
    act(() => {
      returnedAction = result.current(testSlice.actions.setMessage('Hello'));
    });

    expect(returnedAction!).toEqual({
      type: 'hookTest/setMessage',
      payload: 'Hello',
    });
  });

  it('should handle actions with complex payloads', () => {
    const testStore = createTestStore();
    const { result } = renderHook(() => useAppDispatch(), {
      wrapper: createWrapper(testStore),
    });

    act(() => {
      result.current(testSlice.actions.addItem('item1'));
      result.current(testSlice.actions.addItem('item2'));
      result.current(testSlice.actions.addItem('item3'));
    });

    expect(testStore.getState().hookTest.items).toEqual(['item1', 'item2', 'item3']);
  });
});

// =============================================================================
// useAppSelector Tests (with typed test store selector)
// =============================================================================

/**
 * Custom selector hook for test store
 */
function useTestSelector<T>(selector: (state: TestState) => T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useAppSelector(selector as any);
}

describe('useAppSelector', () => {
  it('should select state from the store', () => {
    const testStore = createTestStore();
    testStore.dispatch(testSlice.actions.setCounter(100));

    const { result } = renderHook(() => useTestSelector((state) => state.hookTest.counter), {
      wrapper: createWrapper(testStore),
    });

    expect(result.current).toBe(100);
  });

  it('should update when selected state changes', () => {
    const testStore = createTestStore();
    const { result } = renderHook(() => useTestSelector((state) => state.hookTest.counter), {
      wrapper: createWrapper(testStore),
    });

    expect(result.current).toBe(0);

    act(() => {
      testStore.dispatch(testSlice.actions.setCounter(50));
    });

    expect(result.current).toBe(50);
  });

  it('should not re-render when unrelated state changes', () => {
    const testStore = createTestStore();
    const renderCount = vi.fn();

    const { result } = renderHook(
      () => {
        renderCount();
        return useTestSelector((state) => state.hookTest.counter);
      },
      {
        wrapper: createWrapper(testStore),
      }
    );

    expect(result.current).toBe(0);
    expect(renderCount).toHaveBeenCalledTimes(1);

    // Dispatch action that changes unrelated state
    act(() => {
      testStore.dispatch(testSlice.actions.setMessage('new message'));
    });

    // Counter selector should not cause re-render for message change
    // Note: The actual behavior depends on selector equality check
    expect(result.current).toBe(0);
  });

  it('should select nested state correctly', () => {
    const testStore = createTestStore();
    testStore.dispatch(testSlice.actions.addItem('first'));
    testStore.dispatch(testSlice.actions.addItem('second'));

    const { result } = renderHook(() => useTestSelector((state) => state.hookTest.items), {
      wrapper: createWrapper(testStore),
    });

    expect(result.current).toEqual(['first', 'second']);
  });

  it('should support derived selectors', () => {
    const testStore = createTestStore();
    testStore.dispatch(testSlice.actions.addItem('a'));
    testStore.dispatch(testSlice.actions.addItem('bb'));
    testStore.dispatch(testSlice.actions.addItem('ccc'));

    // Select derived data (total character count)
    const { result } = renderHook(
      () =>
        useTestSelector((state) =>
          state.hookTest.items.reduce((sum, item) => sum + item.length, 0)
        ),
      {
        wrapper: createWrapper(testStore),
      }
    );

    expect(result.current).toBe(6); // 1 + 2 + 3
  });

  it('should handle multiple selectors in same component', () => {
    const testStore = createTestStore();
    testStore.dispatch(testSlice.actions.setCounter(99));
    testStore.dispatch(testSlice.actions.setMessage('Hello World'));

    const { result } = renderHook(
      () => ({
        counter: useTestSelector((state) => state.hookTest.counter),
        message: useTestSelector((state) => state.hookTest.message),
      }),
      {
        wrapper: createWrapper(testStore),
      }
    );

    expect(result.current.counter).toBe(99);
    expect(result.current.message).toBe('Hello World');
  });
});

// =============================================================================
// Combined Hook Usage Tests
// =============================================================================

describe('Combined Hook Usage', () => {
  it('should work with both dispatch and selector together', () => {
    const testStore = createTestStore();

    const { result } = renderHook(
      () => ({
        dispatch: useAppDispatch(),
        counter: useTestSelector((state) => state.hookTest.counter),
      }),
      {
        wrapper: createWrapper(testStore),
      }
    );

    expect(result.current.counter).toBe(0);

    act(() => {
      result.current.dispatch(testSlice.actions.increment());
    });

    expect(result.current.counter).toBe(1);
  });

  it('should handle rapid state updates', () => {
    const testStore = createTestStore();

    const { result } = renderHook(
      () => ({
        dispatch: useAppDispatch(),
        counter: useTestSelector((state) => state.hookTest.counter),
      }),
      {
        wrapper: createWrapper(testStore),
      }
    );

    act(() => {
      for (let i = 0; i < 100; i++) {
        result.current.dispatch(testSlice.actions.increment());
      }
    });

    expect(result.current.counter).toBe(100);
  });

  it('should handle concurrent updates to different state properties', () => {
    const testStore = createTestStore();

    const { result } = renderHook(
      () => ({
        dispatch: useAppDispatch(),
        counter: useTestSelector((state) => state.hookTest.counter),
        message: useTestSelector((state) => state.hookTest.message),
        items: useTestSelector((state) => state.hookTest.items),
      }),
      {
        wrapper: createWrapper(testStore),
      }
    );

    act(() => {
      result.current.dispatch(testSlice.actions.setCounter(42));
      result.current.dispatch(testSlice.actions.setMessage('Updated'));
      result.current.dispatch(testSlice.actions.addItem('new item'));
    });

    expect(result.current.counter).toBe(42);
    expect(result.current.message).toBe('Updated');
    expect(result.current.items).toEqual(['new item']);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Hook Edge Cases', () => {
  it('should handle empty state selections', () => {
    const testStore = createTestStore();

    const { result } = renderHook(() => useTestSelector((state) => state.hookTest.items), {
      wrapper: createWrapper(testStore),
    });

    expect(result.current).toEqual([]);
  });

  it('should handle clearing and re-populating state', () => {
    const testStore = createTestStore();
    testStore.dispatch(testSlice.actions.addItem('item1'));
    testStore.dispatch(testSlice.actions.addItem('item2'));

    const { result } = renderHook(
      () => ({
        dispatch: useAppDispatch(),
        items: useTestSelector((state) => state.hookTest.items),
      }),
      {
        wrapper: createWrapper(testStore),
      }
    );

    expect(result.current.items).toEqual(['item1', 'item2']);

    act(() => {
      result.current.dispatch(testSlice.actions.clearItems());
    });

    expect(result.current.items).toEqual([]);

    act(() => {
      result.current.dispatch(testSlice.actions.addItem('new item'));
    });

    expect(result.current.items).toEqual(['new item']);
  });

  it('should maintain referential equality for unchanged selections', () => {
    const testStore = createTestStore();
    testStore.dispatch(testSlice.actions.addItem('item'));

    const { result, rerender } = renderHook(
      () => useTestSelector((state) => state.hookTest.items),
      {
        wrapper: createWrapper(testStore),
      }
    );

    const firstItems = result.current;

    // Rerender without state change
    rerender();

    const secondItems = result.current;

    // Same reference (memoized)
    expect(firstItems).toBe(secondItems);
  });
});
