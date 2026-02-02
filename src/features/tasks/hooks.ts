/**
 * Task Hooks
 *
 * Custom hooks for task-related functionality.
 * Provides data fetching, state management, and task operations for components.
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectTasksByDate,
  selectTasksLoading,
  selectTasksError,
  selectTasksSyncStatus,
  selectTasksLoadedForDate,
  selectSelectedDate,
} from './taskSlice';
import { fetchTasksByDate, updateTaskAsync } from './taskThunks';
import { selectCategoriesMap, selectCategoriesInitialized } from '../categories/categorySlice';
import { fetchCategories } from '../categories/categoryThunks';
import type { Task, Category, TaskStatus } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface UseTasksByDateResult {
  /** Tasks for the specified date */
  tasks: Task[];
  /** Categories map for looking up category data */
  categoriesMap: Record<string, Category>;
  /** Whether tasks are currently loading */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Sync status */
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
  /** Whether tasks have been loaded for this date */
  isLoaded: boolean;
  /** Refetch tasks for the date */
  refetch: () => void;
  /** Update a task's status */
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
}

// =============================================================================
// useTasksByDate Hook
// =============================================================================

/**
 * Hook to fetch and manage tasks for a specific date.
 *
 * This hook provides a complete interface for working with tasks on a given date,
 * automatically fetching data when needed and providing helper functions for updates.
 *
 * Features:
 * - Automatic data fetching when date changes
 * - Automatic category loading if not initialized
 * - Race condition protection to prevent duplicate fetches
 * - Memoized helper functions for common operations
 *
 * Performance Considerations:
 * - Only fetches if data not already loaded (`isLoaded` check)
 * - Uses Redux state caching via memoized selectors
 * - Uses ref to track in-flight requests and prevent duplicates
 *
 * @param date - ISO date string (e.g., "2024-01-15") for which to fetch tasks
 * @param userId - User ID to fetch tasks for (null for unauthenticated)
 *
 * @returns Object containing:
 * - `tasks`: Array of tasks for the specified date
 * - `categoriesMap`: Map of category IDs to Category objects
 * - `loading`: Boolean indicating if tasks are currently being fetched
 * - `error`: Error message string if fetch failed, null otherwise
 * - `syncStatus`: Current sync status ('synced', 'syncing', 'error', 'offline')
 * - `isLoaded`: Boolean indicating if tasks have been loaded for this date
 * - `refetch`: Function to manually refetch tasks for this date
 * - `updateTaskStatus`: Function to update a task's status
 *
 * @example
 * ```tsx
 * function DailyView() {
 *   const { user } = useAuth();
 *   const date = '2024-01-15';
 *   const { tasks, loading, error, updateTaskStatus } = useTasksByDate(date, user?.id ?? null);
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage message={error} />;
 *
 *   return (
 *     <div>
 *       {tasks.map(task => (
 *         <TaskItem
 *           key={task.id}
 *           task={task}
 *           onStatusChange={() => updateTaskStatus(task.id, 'complete')}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTasksByDate(date: string, userId: string | null): UseTasksByDateResult {
  const dispatch = useAppDispatch();

  // Ref to track if a fetch is in progress to prevent race conditions
  const tasksFetchInProgressRef = useRef(false);
  const categoriesFetchInProgressRef = useRef(false);

  // Memoize selectors to prevent creating new function references on every render
  const selectTasksForDate = useMemo(
    () => (state: Parameters<typeof selectTasksByDate>[0]) => selectTasksByDate(state, date),
    [date]
  );
  const selectIsLoadedForDate = useMemo(
    () => (state: Parameters<typeof selectTasksLoadedForDate>[0]) => selectTasksLoadedForDate(state, date),
    [date]
  );

  // Selectors - using memoized selectors from taskSlice
  const tasks = useAppSelector(selectTasksForDate);
  const loading = useAppSelector(selectTasksLoading);
  const error = useAppSelector(selectTasksError);
  const syncStatus = useAppSelector(selectTasksSyncStatus);
  const isLoaded = useAppSelector(selectIsLoadedForDate);
  const categoriesMap = useAppSelector(selectCategoriesMap);
  const categoriesInitialized = useAppSelector(selectCategoriesInitialized);

  // Fetch tasks when date or userId changes - with race condition protection
  useEffect(() => {
    // Early return if conditions not met
    if (!userId || !date || isLoaded) return;

    // Use atomic flag check to prevent race condition
    if (tasksFetchInProgressRef.current) return;

    tasksFetchInProgressRef.current = true;
    let aborted = false;

    const fetchData = async () => {
      try {
        const dateObj = new Date(date + 'T00:00:00.000Z');
        await dispatch(fetchTasksByDate({ userId, date: dateObj })).unwrap();
      } catch (error) {
        if (!aborted) {
          console.error('Failed to fetch tasks:', error);
        }
      } finally {
        if (!aborted) {
          tasksFetchInProgressRef.current = false;
        }
      }
    };

    fetchData();

    return () => {
      aborted = true;
      tasksFetchInProgressRef.current = false;
    };
  }, [dispatch, userId, date, isLoaded]);

  // Fetch categories if not initialized - with race condition protection
  useEffect(() => {
    // Early return if conditions not met
    if (!userId || categoriesInitialized) return;

    // Use atomic flag check to prevent race condition
    if (categoriesFetchInProgressRef.current) return;

    categoriesFetchInProgressRef.current = true;
    let aborted = false;

    const fetchData = async () => {
      try {
        await dispatch(fetchCategories(userId)).unwrap();
      } catch (error) {
        if (!aborted) {
          console.error('Failed to fetch categories:', error);
        }
      } finally {
        if (!aborted) {
          categoriesFetchInProgressRef.current = false;
        }
      }
    };

    fetchData();

    return () => {
      aborted = true;
      categoriesFetchInProgressRef.current = false;
    };
  }, [dispatch, userId, categoriesInitialized]);

  // Memoized refetch function - allows manual refresh
  const refetch = useCallback(() => {
    if (userId && date) {
      // Convert ISO date string to Date object for the thunk
      const dateObj = new Date(date + 'T00:00:00.000Z');
      dispatch(fetchTasksByDate({ userId, date: dateObj }));
    }
  }, [dispatch, userId, date]);

  // Memoized update task status function
  const updateTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      await dispatch(updateTaskAsync({ id: taskId, status }));
    },
    [dispatch]
  );

  return {
    tasks,
    categoriesMap,
    loading,
    error,
    syncStatus,
    isLoaded,
    refetch,
    updateTaskStatus,
  };
}

// =============================================================================
// useSelectedDateTasks Hook
// =============================================================================

export interface UseSelectedDateTasksResult extends UseTasksByDateResult {
  /** Currently selected date */
  selectedDate: string;
}

/**
 * Hook to fetch and manage tasks for the currently selected date from Redux.
 *
 * This is a convenience wrapper around `useTasksByDate` that automatically
 * uses the selected date from the Redux store.
 *
 * @param userId - User ID to fetch tasks for (null for unauthenticated)
 * @returns Object containing tasks, selected date, loading state, and helper functions
 *
 * @example
 * ```tsx
 * function TasksPage() {
 *   const { user } = useAuth();
 *   const { tasks, selectedDate, loading, refetch } = useSelectedDateTasks(user?.id ?? null);
 *
 *   return (
 *     <div>
 *       <h1>Tasks for {selectedDate}</h1>
 *       <TaskList tasks={tasks} loading={loading} />
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSelectedDateTasks(userId: string | null): UseSelectedDateTasksResult {
  const selectedDate = useAppSelector(selectSelectedDate);
  const result = useTasksByDate(selectedDate, userId);

  return {
    ...result,
    selectedDate,
  };
}
