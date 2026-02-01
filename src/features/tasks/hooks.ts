/**
 * Task Hooks
 *
 * Custom hooks for task-related functionality.
 */

import { useEffect, useCallback } from 'react';
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
 * Automatically fetches tasks and categories when the date changes.
 *
 * @param date - ISO date string (e.g., "2024-01-15")
 * @param userId - User ID to fetch tasks for
 * @returns Object containing tasks, loading state, error, and helper functions
 */
export function useTasksByDate(date: string, userId: string | null): UseTasksByDateResult {
  const dispatch = useAppDispatch();

  // Selectors
  const tasks = useAppSelector((state) => selectTasksByDate(state, date));
  const loading = useAppSelector(selectTasksLoading);
  const error = useAppSelector(selectTasksError);
  const syncStatus = useAppSelector(selectTasksSyncStatus);
  const isLoaded = useAppSelector((state) => selectTasksLoadedForDate(state, date));
  const categoriesMap = useAppSelector(selectCategoriesMap);
  const categoriesInitialized = useAppSelector(selectCategoriesInitialized);

  // Fetch tasks when date or userId changes
  useEffect(() => {
    if (userId && date && !isLoaded) {
      // Convert ISO date string to Date object for the thunk
      const dateObj = new Date(date + 'T00:00:00.000Z');
      dispatch(fetchTasksByDate({ userId, date: dateObj }));
    }
  }, [dispatch, userId, date, isLoaded]);

  // Fetch categories if not initialized
  useEffect(() => {
    if (userId && !categoriesInitialized) {
      dispatch(fetchCategories(userId));
    }
  }, [dispatch, userId, categoriesInitialized]);

  // Refetch function
  const refetch = useCallback(() => {
    if (userId && date) {
      // Convert ISO date string to Date object for the thunk
      const dateObj = new Date(date + 'T00:00:00.000Z');
      dispatch(fetchTasksByDate({ userId, date: dateObj }));
    }
  }, [dispatch, userId, date]);

  // Update task status
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
 * Uses the selectedDate from the tasks slice.
 *
 * @param userId - User ID to fetch tasks for
 * @returns Object containing tasks, selected date, loading state, and helper functions
 */
export function useSelectedDateTasks(userId: string | null): UseSelectedDateTasksResult {
  const selectedDate = useAppSelector(selectSelectedDate);
  const result = useTasksByDate(selectedDate, userId);

  return {
    ...result,
    selectedDate,
  };
}
