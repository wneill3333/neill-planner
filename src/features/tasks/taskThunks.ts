/**
 * Task Async Thunks
 *
 * Redux Toolkit async thunks for task CRUD operations.
 * These thunks interact with the Firebase tasks service and handle
 * loading states, errors, and optimistic updates.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../types';
import * as tasksService from '../../services/firebase/tasks.service';
import type { RootState } from '../../store';

// =============================================================================
// Types
// =============================================================================

/**
 * Payload for fetching tasks by date
 */
export interface FetchTasksByDatePayload {
  userId: string;
  date: Date;
}

/**
 * Payload for creating a task
 */
export interface CreateTaskPayload {
  input: CreateTaskInput;
  userId: string;
}

/**
 * Error response from thunks
 */
export interface ThunkError {
  message: string;
  code?: string;
}

// =============================================================================
// Async Thunks
// =============================================================================

/**
 * Fetch tasks for a specific date
 *
 * Retrieves all non-deleted tasks for the given user and date from Firestore.
 * Updates the tasks state with the fetched tasks, indexed by the date.
 */
export const fetchTasksByDate = createAsyncThunk<
  { tasks: Task[]; date: string },
  FetchTasksByDatePayload,
  { state: RootState; rejectValue: ThunkError }
>('tasks/fetchTasksByDate', async ({ userId, date }, { rejectWithValue }) => {
  try {
    const tasks = await tasksService.getTasksByDate(userId, date);
    const dateString = date.toISOString().split('T')[0];
    return { tasks, date: dateString };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
    return rejectWithValue({ message });
  }
});

/**
 * Create a new task
 *
 * Creates a task in Firestore and adds it to the local state.
 * The task is immediately available in the UI after creation.
 */
export const createTask = createAsyncThunk<
  Task,
  CreateTaskPayload,
  { state: RootState; rejectValue: ThunkError }
>('tasks/createTask', async ({ input, userId }, { rejectWithValue }) => {
  try {
    const task = await tasksService.createTask(input, userId);
    return task;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create task';
    return rejectWithValue({ message });
  }
});

/**
 * Update an existing task
 *
 * Updates a task in Firestore and reflects the changes in local state.
 * Handles date changes by updating the date index appropriately.
 */
export const updateTaskAsync = createAsyncThunk<
  Task,
  UpdateTaskInput,
  { state: RootState; rejectValue: ThunkError }
>('tasks/updateTaskAsync', async (input, { rejectWithValue }) => {
  try {
    const task = await tasksService.updateTask(input);
    return task;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update task';
    return rejectWithValue({ message });
  }
});

/**
 * Delete a task (soft delete)
 *
 * Performs a soft delete by setting the deletedAt timestamp.
 * The task is removed from the local state but remains in Firestore
 * for potential recovery.
 */
export const deleteTask = createAsyncThunk<
  string,
  string,
  { state: RootState; rejectValue: ThunkError }
>('tasks/deleteTask', async (taskId, { rejectWithValue }) => {
  try {
    await tasksService.softDeleteTask(taskId);
    return taskId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete task';
    return rejectWithValue({ message });
  }
});

/**
 * Permanently delete a task (hard delete)
 *
 * Permanently removes the task from Firestore.
 * Use with caution - this action cannot be undone.
 */
export const hardDeleteTask = createAsyncThunk<
  string,
  string,
  { state: RootState; rejectValue: ThunkError }
>('tasks/hardDeleteTask', async (taskId, { rejectWithValue }) => {
  try {
    await tasksService.hardDeleteTask(taskId);
    return taskId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to permanently delete task';
    return rejectWithValue({ message });
  }
});

/**
 * Restore a soft-deleted task
 *
 * Restores a previously soft-deleted task by clearing the deletedAt timestamp.
 * The task is added back to the local state.
 */
export const restoreTask = createAsyncThunk<
  Task,
  string,
  { state: RootState; rejectValue: ThunkError }
>('tasks/restoreTask', async (taskId, { rejectWithValue }) => {
  try {
    const task = await tasksService.restoreTask(taskId);
    return task;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to restore task';
    return rejectWithValue({ message });
  }
});

/**
 * Batch update multiple tasks
 *
 * Updates multiple tasks atomically in Firestore.
 * Useful for reordering tasks or bulk status updates.
 */
export const batchUpdateTasksAsync = createAsyncThunk<
  UpdateTaskInput[],
  UpdateTaskInput[],
  { state: RootState; rejectValue: ThunkError }
>('tasks/batchUpdateTasksAsync', async (updates, { rejectWithValue }) => {
  try {
    await tasksService.batchUpdateTasks(updates);
    return updates;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to batch update tasks';
    return rejectWithValue({ message });
  }
});

/**
 * Fetch tasks for a date range
 *
 * Retrieves all tasks within a date range for calendar/week views.
 */
export const fetchTasksByDateRange = createAsyncThunk<
  Task[],
  { userId: string; startDate: Date; endDate: Date },
  { state: RootState; rejectValue: ThunkError }
>('tasks/fetchTasksByDateRange', async ({ userId, startDate, endDate }, { rejectWithValue }) => {
  try {
    const tasks = await tasksService.getTasksByDateRange(userId, startDate, endDate);
    return tasks;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tasks for date range';
    return rejectWithValue({ message });
  }
});
