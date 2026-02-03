/**
 * Task Async Thunks
 *
 * Redux Toolkit async thunks for task CRUD operations.
 * These thunks interact with the Firebase tasks service and handle
 * loading states, errors, and optimistic updates.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Task, CreateTaskInput, UpdateTaskInput, PriorityLetter } from '../../types';
import * as tasksService from '../../services/firebase/tasks.service';
import type { RootState } from '../../store';
import { selectTasksByDate } from './taskSlice';
import { getNextPriorityNumber, reorderAllTasks, getTasksWithChangedPriority } from '../../utils/priorityUtils';

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
 *
 * Auto-assigns the next priority number for the task's priority letter
 * if not explicitly provided.
 */
export const createTask = createAsyncThunk<
  Task,
  CreateTaskPayload,
  { state: RootState; rejectValue: ThunkError }
>('tasks/createTask', async ({ input, userId }, { getState, rejectWithValue }) => {
  try {
    // Get the scheduled date string for looking up existing tasks
    const dateString = input.scheduledDate
      ? input.scheduledDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Get current tasks for the scheduled date
    const state = getState();
    const tasksForDate = selectTasksByDate(state, dateString);

    // Calculate next priority number if not explicitly provided
    const priorityNumber =
      input.priority.number ?? getNextPriorityNumber(tasksForDate, input.priority.letter);

    // Create the task input with the calculated priority number
    const taskInput: CreateTaskInput = {
      ...input,
      priority: {
        letter: input.priority.letter,
        number: priorityNumber,
      },
    };

    const task = await tasksService.createTask(taskInput, userId);
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
  UpdateTaskInput & { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('tasks/updateTaskAsync', async (input, { rejectWithValue }) => {
  try {
    const { userId, ...updateInput } = input;
    const task = await tasksService.updateTask(updateInput, userId);
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
  { taskId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('tasks/deleteTask', async ({ taskId, userId }, { rejectWithValue }) => {
  try {
    await tasksService.softDeleteTask(taskId, userId);
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
  { taskId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('tasks/hardDeleteTask', async ({ taskId, userId }, { rejectWithValue }) => {
  try {
    await tasksService.hardDeleteTask(taskId, userId);
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
  { taskId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('tasks/restoreTask', async ({ taskId, userId }, { rejectWithValue }) => {
  try {
    const task = await tasksService.restoreTask(taskId, userId);
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
  { updates: UpdateTaskInput[]; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('tasks/batchUpdateTasksAsync', async ({ updates, userId }, { rejectWithValue }) => {
  try {
    await tasksService.batchUpdateTasks(updates, userId);
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

/**
 * Payload for reordering tasks
 */
export interface ReorderTasksPayload {
  /** ISO date string for the date to reorder */
  date: string;
  /** User ID for authorization */
  userId: string;
}

/**
 * Result from reordering tasks
 */
export interface ReorderTasksResult {
  /** Update inputs that were applied */
  updates: UpdateTaskInput[];
  /** Whether any changes were made */
  hasChanges: boolean;
}

/**
 * Reorder tasks to fill gaps in priority numbering
 *
 * Renumbers all tasks for the given date so that priority numbers
 * are sequential within each priority letter group (A1, A2, A3, etc.).
 *
 * Only tasks that actually changed are updated in Firestore.
 */
export const reorderTasks = createAsyncThunk<
  ReorderTasksResult,
  ReorderTasksPayload,
  { state: RootState; rejectValue: ThunkError }
>('tasks/reorderTasks', async ({ date, userId }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const tasksForDate = selectTasksByDate(state, date);

    // Calculate reordered tasks
    const reorderResult = reorderAllTasks(tasksForDate);

    if (!reorderResult.hasChanges) {
      return { updates: [], hasChanges: false };
    }

    // Find tasks that actually changed
    const changedTasks = getTasksWithChangedPriority(tasksForDate, reorderResult.tasks);

    // Convert to update inputs
    const updates: UpdateTaskInput[] = changedTasks.map((task) => ({
      id: task.id,
      priority: task.priority,
    }));

    // Only call service if there are changes
    if (updates.length > 0) {
      await tasksService.batchUpdateTasks(updates, userId);
    }

    return { updates, hasChanges: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reorder tasks';
    return rejectWithValue({ message });
  }
});

/**
 * Payload for reordering tasks via drag-and-drop
 */
export interface ReorderTasksDragPayload {
  /** Task IDs in new order */
  taskIds: string[];
  /** Priority letter of the group being reordered */
  priorityLetter: PriorityLetter;
  /** User ID for authorization */
  userId: string;
}

/**
 * Reorder tasks after drag-and-drop operation
 *
 * Recalculates priority numbers based on the new order and persists
 * changes to Firestore. This is the persistence layer for drag-and-drop.
 *
 * The slice will handle optimistic updates via reorderTasksLocal before
 * this thunk is called, so on success we just confirm the state.
 */
export const reorderTasksAsync = createAsyncThunk<
  UpdateTaskInput[],
  ReorderTasksDragPayload,
  { state: RootState; rejectValue: ThunkError }
>('tasks/reorderTasksAsync', async ({ taskIds, priorityLetter, userId }, { getState, rejectWithValue }) => {
  try {
    // Early return for empty input
    if (taskIds.length === 0) {
      return [];
    }

    const state = getState();

    // Build update inputs with new priority numbers
    const updates: UpdateTaskInput[] = taskIds.map((taskId, index) => {
      const task = state.tasks.tasks[taskId];

      // Verify task exists and belongs to the right priority group
      if (!task || task.priority.letter !== priorityLetter) {
        throw new Error(`Invalid task in reorder: ${taskId}`);
      }

      return {
        id: taskId,
        priority: {
          letter: priorityLetter,
          number: index + 1, // 1-based numbering
        },
      };
    });

    // Only call service if there are changes
    if (updates.length > 0) {
      await tasksService.batchUpdateTasks(updates, userId);
    }

    return updates;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reorder tasks';
    return rejectWithValue({ message });
  }
});

// Alias for backward compatibility
export const createTaskAsync = createTask;
