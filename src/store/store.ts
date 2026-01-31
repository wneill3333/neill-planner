/**
 * Redux Store Configuration
 *
 * Central store configuration for Neill Planner application.
 * Uses Redux Toolkit for simplified setup and best practices.
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import taskReducer from '../features/tasks/taskSlice';

// =============================================================================
// Root Reducer
// =============================================================================

/**
 * Root reducer combining all feature slices.
 */
const rootReducer = combineReducers({
  tasks: taskReducer,
});

// =============================================================================
// Store Configuration
// =============================================================================

/**
 * Configure and create the Redux store
 */
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Serializable check configuration
      serializableCheck: {
        // Ignore these action types (useful for thunks with non-serializable payloads)
        ignoredActions: [],
        // Ignore these paths in the state (Date objects in tasks)
        ignoredPaths: ['tasks.tasks'],
      },
    }),
  // Enable Redux DevTools in development
  devTools: import.meta.env.MODE !== 'production',
});

// =============================================================================
// Type Exports
// =============================================================================

/**
 * RootState type inferred from the store
 * Use this type for useSelector hooks
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * AppDispatch type inferred from the store
 * Use this type for useDispatch hooks
 */
export type AppDispatch = typeof store.dispatch;

/**
 * Store type for testing and other purposes
 */
export type AppStore = typeof store;
