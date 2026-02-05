/**
 * Redux Typed Hooks
 *
 * Custom hooks with proper TypeScript typing for Redux store access.
 * Use these throughout the app instead of plain `useDispatch` and `useSelector`.
 */

import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// =============================================================================
// Typed Dispatch Hook
// =============================================================================

/**
 * Typed version of useDispatch hook.
 * Use this throughout the app to dispatch actions with proper typing.
 *
 * @example
 * const dispatch = useAppDispatch();
 * dispatch(someAction(payload)); // Fully typed
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

// =============================================================================
// Typed Selector Hook
// =============================================================================

/**
 * Typed version of useSelector hook.
 * Use this throughout the app to select state with proper typing.
 *
 * @example
 * const tasks = useAppSelector(state => state.tasks.items);
 * // `tasks` is properly typed based on RootState
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
