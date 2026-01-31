/**
 * Redux Store Configuration
 *
 * Central store configuration for Neill Planner application.
 * Uses Redux Toolkit for simplified setup and best practices.
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';

// =============================================================================
// Root Reducer
// =============================================================================

/**
 * Root reducer combining all feature slices.
 * Initially empty, will be populated as we add feature slices.
 */
const rootReducer = combineReducers({
  // Placeholder reducer to prevent empty reducer error
  // Will be replaced with actual reducers as they are created
  _placeholder: (state: null = null) => state,
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
        // Ignore these paths in the state
        ignoredPaths: [],
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
