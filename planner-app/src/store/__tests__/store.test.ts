/**
 * Redux Store Tests
 *
 * Tests for store configuration, initialization, and basic functionality.
 */

import { describe, it, expect } from 'vitest';
import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { store, type RootState, type AppDispatch, type AppStore } from '../store';

// =============================================================================
// Store Initialization Tests
// =============================================================================

describe('Redux Store', () => {
  describe('Store Initialization', () => {
    it('should initialize without errors', () => {
      expect(store).toBeDefined();
      expect(typeof store.getState).toBe('function');
      expect(typeof store.dispatch).toBe('function');
      expect(typeof store.subscribe).toBe('function');
    });

    it('should have getState method that returns state', () => {
      const state = store.getState();
      expect(state).toBeDefined();
      expect(typeof state).toBe('object');
    });

    it('should have dispatch method that accepts actions', () => {
      // Test dispatching a basic action
      const action = { type: 'test/action' };
      expect(() => store.dispatch(action)).not.toThrow();
    });

    it('should have subscribe method for state changes', () => {
      let callCount = 0;
      const unsubscribe = store.subscribe(() => {
        callCount++;
      });

      // Dispatch an action
      store.dispatch({ type: 'test/action' });

      // Unsubscribe
      unsubscribe();

      // Dispatch another action - should not increment
      store.dispatch({ type: 'test/action2' });

      expect(callCount).toBe(1);
    });
  });

  describe('State Shape', () => {
    it('should return expected initial state shape', () => {
      const state = store.getState();

      // Initial state should have tasks slice
      expect(state).toHaveProperty('tasks');
      expect(state.tasks).toHaveProperty('tasks');
      expect(state.tasks).toHaveProperty('taskIdsByDate');
      expect(state.tasks).toHaveProperty('loading');
      expect(state.tasks).toHaveProperty('error');
      expect(state.tasks).toHaveProperty('syncStatus');
    });

    it('should have RootState type that matches actual state', () => {
      const state: RootState = store.getState();
      expect(state).toBeDefined();
    });
  });

  describe('Dispatch Typing', () => {
    it('should accept standard actions', () => {
      const dispatch: AppDispatch = store.dispatch;
      const result = dispatch({ type: 'test/standardAction' });
      expect(result).toBeDefined();
    });

    it('should handle unknown actions gracefully', () => {
      expect(() => {
        store.dispatch({ type: 'UNKNOWN_ACTION_TYPE_12345' });
      }).not.toThrow();
    });
  });
});

// =============================================================================
// Store Configuration Tests
// =============================================================================

describe('Store Configuration', () => {
  it('should be able to create a new store with the same configuration pattern', () => {
    const testStore = configureStore({
      reducer: {
        _placeholder: (state: null = null) => state,
      },
    });

    expect(testStore).toBeDefined();
    expect(testStore.getState()).toHaveProperty('_placeholder');
  });

  it('should support adding new reducers dynamically', () => {
    // Create a test slice
    const testSlice = createSlice({
      name: 'test',
      initialState: { value: 0 },
      reducers: {
        increment: (state) => {
          state.value += 1;
        },
        setValue: (state, action: PayloadAction<number>) => {
          state.value = action.payload;
        },
      },
    });

    // Create a new store with the test slice
    const testStore = configureStore({
      reducer: {
        test: testSlice.reducer,
      },
    });

    // Verify initial state
    expect(testStore.getState().test.value).toBe(0);

    // Dispatch action and verify state change
    testStore.dispatch(testSlice.actions.increment());
    expect(testStore.getState().test.value).toBe(1);

    // Test setValue action
    testStore.dispatch(testSlice.actions.setValue(42));
    expect(testStore.getState().test.value).toBe(42);
  });
});

// =============================================================================
// Type Safety Tests
// =============================================================================

describe('Type Safety', () => {
  it('RootState should be correctly inferred', () => {
    // This is a compile-time test - if it compiles, types are correct
    const state: RootState = store.getState();
    // Verify tasks slice structure is correctly typed
    expect(state.tasks).toBeDefined();
    expect(typeof state.tasks.loading).toBe('boolean');
    expect(state.tasks.error).toBeNull();
  });

  it('AppDispatch should be correctly typed', () => {
    // This is a compile-time test - if it compiles, types are correct
    const dispatch: AppDispatch = store.dispatch;
    expect(dispatch).toBe(store.dispatch);
  });

  it('AppStore type should match store type', () => {
    // This is a compile-time test
    const typedStore: AppStore = store;
    expect(typedStore).toBe(store);
  });
});

// =============================================================================
// Middleware Tests
// =============================================================================

describe('Middleware', () => {
  it('should include default middleware', () => {
    // The store should be functional with default middleware
    // We can verify by testing thunk support
    const testStore = configureStore({
      reducer: {
        _placeholder: (state: null = null) => state,
      },
    });

    // Thunks should be supported by default
    const thunkAction = (dispatch: AppDispatch) => {
      dispatch({ type: 'thunk/completed' });
      return 'thunk result';
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = testStore.dispatch(thunkAction as any);
    expect(result).toBe('thunk result');
  });

  it('should not throw on non-serializable check for standard actions', () => {
    expect(() => {
      store.dispatch({
        type: 'test/withSerializableData',
        payload: {
          string: 'test',
          number: 123,
          boolean: true,
          array: [1, 2, 3],
          object: { nested: 'value' },
        },
      });
    }).not.toThrow();
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Store Integration', () => {
  it('should maintain state across multiple dispatches', () => {
    const counterSlice = createSlice({
      name: 'counter',
      initialState: { count: 0 },
      reducers: {
        increment: (state) => {
          state.count += 1;
        },
        decrement: (state) => {
          state.count -= 1;
        },
        incrementBy: (state, action: PayloadAction<number>) => {
          state.count += action.payload;
        },
      },
    });

    const testStore = configureStore({
      reducer: {
        counter: counterSlice.reducer,
      },
    });

    // Initial state
    expect(testStore.getState().counter.count).toBe(0);

    // Multiple increments
    testStore.dispatch(counterSlice.actions.increment());
    testStore.dispatch(counterSlice.actions.increment());
    testStore.dispatch(counterSlice.actions.increment());
    expect(testStore.getState().counter.count).toBe(3);

    // Decrement
    testStore.dispatch(counterSlice.actions.decrement());
    expect(testStore.getState().counter.count).toBe(2);

    // Increment by specific amount
    testStore.dispatch(counterSlice.actions.incrementBy(10));
    expect(testStore.getState().counter.count).toBe(12);
  });

  it('should handle multiple slices correctly', () => {
    const userSlice = createSlice({
      name: 'user',
      initialState: { name: '', isLoggedIn: false },
      reducers: {
        login: (state, action: PayloadAction<string>) => {
          state.name = action.payload;
          state.isLoggedIn = true;
        },
        logout: (state) => {
          state.name = '';
          state.isLoggedIn = false;
        },
      },
    });

    const settingsSlice = createSlice({
      name: 'settings',
      initialState: { theme: 'light', language: 'en' },
      reducers: {
        setTheme: (state, action: PayloadAction<string>) => {
          state.theme = action.payload;
        },
        setLanguage: (state, action: PayloadAction<string>) => {
          state.language = action.payload;
        },
      },
    });

    const testStore = configureStore({
      reducer: {
        user: userSlice.reducer,
        settings: settingsSlice.reducer,
      },
    });

    // Verify initial state
    expect(testStore.getState().user.isLoggedIn).toBe(false);
    expect(testStore.getState().settings.theme).toBe('light');

    // Dispatch to different slices
    testStore.dispatch(userSlice.actions.login('John'));
    testStore.dispatch(settingsSlice.actions.setTheme('dark'));

    // Verify both slices updated independently
    expect(testStore.getState().user.name).toBe('John');
    expect(testStore.getState().user.isLoggedIn).toBe(true);
    expect(testStore.getState().settings.theme).toBe('dark');
    expect(testStore.getState().settings.language).toBe('en'); // Unchanged
  });

  it('should notify subscribers on state changes', () => {
    const slice = createSlice({
      name: 'test',
      initialState: { value: 0 },
      reducers: {
        setValue: (state, action: PayloadAction<number>) => {
          state.value = action.payload;
        },
      },
    });

    const testStore = configureStore({
      reducer: { test: slice.reducer },
    });

    const stateHistory: number[] = [];
    testStore.subscribe(() => {
      stateHistory.push(testStore.getState().test.value);
    });

    testStore.dispatch(slice.actions.setValue(1));
    testStore.dispatch(slice.actions.setValue(2));
    testStore.dispatch(slice.actions.setValue(3));

    expect(stateHistory).toEqual([1, 2, 3]);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('should handle empty payloads', () => {
    const slice = createSlice({
      name: 'test',
      initialState: { items: [] as string[] },
      reducers: {
        reset: (state) => {
          state.items = [];
        },
        addItem: (state, action: PayloadAction<string>) => {
          state.items.push(action.payload);
        },
      },
    });

    const testStore = configureStore({
      reducer: { test: slice.reducer },
    });

    testStore.dispatch(slice.actions.addItem('item1'));
    expect(testStore.getState().test.items).toEqual(['item1']);

    testStore.dispatch(slice.actions.reset());
    expect(testStore.getState().test.items).toEqual([]);
  });

  it('should handle deeply nested state updates', () => {
    interface DeepState {
      level1: {
        level2: {
          level3: {
            value: string;
          };
        };
      };
    }

    const deepSlice = createSlice({
      name: 'deep',
      initialState: {
        level1: {
          level2: {
            level3: {
              value: 'initial',
            },
          },
        },
      } as DeepState,
      reducers: {
        updateDeepValue: (state, action: PayloadAction<string>) => {
          state.level1.level2.level3.value = action.payload;
        },
      },
    });

    const testStore = configureStore({
      reducer: { deep: deepSlice.reducer },
    });

    expect(testStore.getState().deep.level1.level2.level3.value).toBe('initial');

    testStore.dispatch(deepSlice.actions.updateDeepValue('updated'));
    expect(testStore.getState().deep.level1.level2.level3.value).toBe('updated');
  });

  it('should handle array mutations with Immer', () => {
    const slice = createSlice({
      name: 'array',
      initialState: { items: [1, 2, 3] },
      reducers: {
        addItem: (state, action: PayloadAction<number>) => {
          state.items.push(action.payload);
        },
        removeItem: (state, action: PayloadAction<number>) => {
          const index = state.items.indexOf(action.payload);
          if (index > -1) {
            state.items.splice(index, 1);
          }
        },
        sortItems: (state) => {
          state.items.sort((a, b) => a - b);
        },
      },
    });

    const testStore = configureStore({
      reducer: { array: slice.reducer },
    });

    testStore.dispatch(slice.actions.addItem(4));
    expect(testStore.getState().array.items).toEqual([1, 2, 3, 4]);

    testStore.dispatch(slice.actions.removeItem(2));
    expect(testStore.getState().array.items).toEqual([1, 3, 4]);

    testStore.dispatch(slice.actions.addItem(0));
    testStore.dispatch(slice.actions.sortItems());
    expect(testStore.getState().array.items).toEqual([0, 1, 3, 4]);
  });
});
