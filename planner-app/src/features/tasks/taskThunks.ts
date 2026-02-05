/**
 * Task Async Thunks
 *
 * Redux Toolkit async thunks for task CRUD operations.
 * These thunks interact with the Firebase tasks service and handle
 * loading states, errors, and optimistic updates.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { startOfDay, subDays } from 'date-fns';
import type { Task, CreateTaskInput, UpdateTaskInput, PriorityLetter } from '../../types';
import * as tasksService from '../../services/firebase/tasks.service';
import type { RootState } from '../../store';
import { selectTasksByDate } from './taskSlice';
import { getNextPriorityNumber, reorderAllTasks, getTasksWithChangedPriority } from '../../utils/priorityUtils';
import { normalizeToDateString, toDateObject, isSameDateString } from '../../utils/dateUtils';
import { addExceptionWithDedup } from '../../utils/recurrenceUtils';

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
 * Fetch recurring tasks (tasks with recurrence patterns)
 *
 * Retrieves all recurring parent tasks for a user. These are tasks that have
 * a recurrence pattern defined and will be used to generate instances for display.
 */
export const fetchRecurringTasks = createAsyncThunk<
  Task[],
  { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('tasks/fetchRecurringTasks', async ({ userId }, { rejectWithValue }) => {
  try {
    const tasks = await tasksService.getRecurringTasks(userId);

    // DEBUG: Log all recurring tasks loaded from Firebase
    console.log(`%c[LOAD] Loaded ${tasks.length} recurring tasks from Firebase`, 'color: blue; font-weight: bold');
    tasks.forEach((task) => {
      if (task.recurrence && task.recurrence.exceptions.length > 0) {
        const exceptionDates = task.recurrence.exceptions.map((e: Date | string) => normalizeToDateString(e)).join(', ');
        console.log(`  "${task.title}" exceptions: [${exceptionDates}]`);
      }
    });

    return tasks;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch recurring tasks';
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

// =============================================================================
// Forward Task Thunk
// =============================================================================

/**
 * Payload for forwarding a task
 */
export interface ForwardTaskPayload {
  /** The task to forward */
  task: Task;
  /** The new date to forward the task to */
  newDate: Date;
  /** User ID for authorization */
  userId: string;
}

/**
 * Result from forwarding a task
 */
export interface ForwardTaskResult {
  /** The original task (now with status 'forward') */
  originalTask: Task;
  /** The new task copy on the new date */
  newTask: Task;
}

/**
 * Forward a task to a new date
 *
 * Creates a copy of the task on the new date with status 'in_progress',
 * then updates the original task to status 'forward'.
 */
export const forwardTaskAsync = createAsyncThunk<
  ForwardTaskResult,
  ForwardTaskPayload,
  { state: RootState; rejectValue: ThunkError }
>('tasks/forwardTaskAsync', async ({ task, newDate, userId }, { getState, rejectWithValue }) => {
  try {
    // Get the new date string for looking up existing tasks
    const newDateString = newDate.toISOString().split('T')[0];

    // Get current tasks for the new date to calculate priority number
    const state = getState();
    const tasksForNewDate = selectTasksByDate(state, newDateString);

    // Calculate next priority number for the new date
    const priorityNumber = getNextPriorityNumber(tasksForNewDate, task.priority.letter);

    // Create the new task input for the copy
    const newTaskInput: CreateTaskInput = {
      title: task.title,
      description: task.description,
      categoryId: task.categoryId,
      priority: {
        letter: task.priority.letter,
        number: priorityNumber,
      },
      status: 'in_progress', // New task starts as in_progress
      scheduledDate: newDate,
      recurrence: null, // Forward task doesn't inherit recurrence
    };

    // Create the new task
    const newTask = await tasksService.createTask(newTaskInput, userId);

    // Update the original task to status 'forward'
    const originalTask = await tasksService.updateTask(
      {
        id: task.id,
        status: 'forward',
      },
      userId
    );

    return { originalTask, newTask };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to forward task';
    return rejectWithValue({ message });
  }
});

// =============================================================================
// Recurring Task Edit Thunks
// =============================================================================

/**
 * Payload for editing a single recurring instance
 */
export interface EditRecurringInstanceOnlyPayload {
  userId: string;
  parentTaskId: string;
  instanceDate: Date;
  updates: Partial<CreateTaskInput>;
}

/**
 * Payload for editing all future recurring instances
 */
export interface EditRecurringFuturePayload {
  userId: string;
  parentTaskId: string;
  updates: Omit<Partial<UpdateTaskInput>, 'id'>;
}

/**
 * Edit a single occurrence of a recurring task
 *
 * Creates a materialized instance that overrides the generated virtual instance
 * for the specific date. The parent task's exception list is updated to skip
 * this date in future generation.
 */
export const editRecurringInstanceOnly = createAsyncThunk<
  Task,
  EditRecurringInstanceOnlyPayload,
  { state: RootState; rejectValue: ThunkError }
>('tasks/editRecurringInstanceOnly', async ({ userId, parentTaskId, instanceDate, updates }, { getState, rejectWithValue }) => {
  let newTask: Task | null = null;

  try {
    const state = getState();

    // Get the parent task from recurringParentTasks or regular tasks
    const parentTask = state.tasks.recurringParentTasks[parentTaskId] || state.tasks.tasks[parentTaskId];

    if (!parentTask) {
      throw new Error('Parent recurring task not found');
    }

    if (!parentTask.recurrence) {
      throw new Error('Task is not a recurring task');
    }

    // Create a materialized instance with the updates
    const dateString = instanceDate.toISOString().split('T')[0];
    const tasksForDate = selectTasksByDate(state, dateString);

    // Calculate next priority number if not provided in updates
    const priorityNumber = updates.priority?.number ??
      getNextPriorityNumber(tasksForDate, updates.priority?.letter ?? parentTask.priority.letter);

    const materializedInstance: CreateTaskInput = {
      title: updates.title ?? parentTask.title,
      description: updates.description ?? parentTask.description,
      categoryId: updates.categoryId ?? parentTask.categoryId,
      priority: {
        letter: updates.priority?.letter ?? parentTask.priority.letter,
        number: priorityNumber,
      },
      status: parentTask.status,
      scheduledDate: instanceDate,
      recurrence: null, // Materialized instances don't have recurrence patterns
      isRecurringInstance: true,
      recurringParentId: parentTaskId,
      instanceDate: instanceDate,
    };

    // Create the materialized instance
    newTask = await tasksService.createTask(materializedInstance, userId);

    // Update the parent task to add this date to exceptions (with deduplication)
    try {
      const updatedExceptions = addExceptionWithDedup(parentTask.recurrence.exceptions, instanceDate);
      await tasksService.updateTask(
        {
          id: parentTaskId,
          recurrence: {
            ...parentTask.recurrence,
            exceptions: updatedExceptions,
          },
        },
        userId
      );
    } catch (parentUpdateError) {
      // Rollback: delete the created instance if parent update fails
      if (newTask) {
        await tasksService.hardDeleteTask(newTask.id, userId);
      }
      throw parentUpdateError;
    }

    return newTask;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to edit recurring instance';
    return rejectWithValue({ message });
  }
});

/**
 * Edit all future occurrences of a recurring task
 *
 * Updates the parent recurring task directly. Changes will automatically
 * propagate to all future generated instances through the selector.
 */
export const editRecurringFuture = createAsyncThunk<
  Task,
  EditRecurringFuturePayload,
  { state: RootState; rejectValue: ThunkError }
>('tasks/editRecurringFuture', async ({ userId, parentTaskId, updates }, { rejectWithValue }) => {
  try {
    // Update the parent task with the new values
    const updatedTask = await tasksService.updateTask(
      {
        id: parentTaskId,
        ...updates,
      },
      userId
    );

    return updatedTask;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to edit recurring future instances';
    return rejectWithValue({ message });
  }
});

// =============================================================================
// Recurring Task Status Update Thunks
// =============================================================================

/**
 * Payload for updating status of a single recurring instance
 */
export interface UpdateRecurringInstanceStatusPayload {
  userId: string;
  task: Task;
  newStatus: Task['status'];
}

/**
 * Update status of a single recurring instance
 *
 * Handles three cases:
 * 1. Parent task on its original date - stores modification in instanceModifications
 * 2. Virtual instances (not yet materialized) - stores modification in parent's instanceModifications
 * 3. Already-materialized instances - updates the status directly
 */
export const updateRecurringInstanceStatus = createAsyncThunk<
  Task,
  UpdateRecurringInstanceStatusPayload,
  { state: RootState; rejectValue: ThunkError }
>('tasks/updateRecurringInstanceStatus', async ({ userId, task, newStatus }, { getState, rejectWithValue }) => {
  try {
    const state = getState();

    // Case 1: This is a recurring PARENT task (on its original scheduled date)
    // The task has recurrence but is NOT a recurring instance
    if (task.recurrence && !task.isRecurringInstance) {
      // Get the date for this instance (the original scheduled date)
      const instanceDate = task.scheduledDate;
      if (!instanceDate) {
        throw new Error('Parent task has no scheduled date');
      }

      // Use normalizeToDateString for consistent date handling (handles Date objects and ISO strings)
      const dateString = normalizeToDateString(instanceDate);

      // Update the parent task's instanceModifications to store this status
      const currentModifications = task.recurrence.instanceModifications || {};
      const updatedModifications = {
        ...currentModifications,
        [dateString]: {
          ...currentModifications[dateString],
          status: newStatus,
        },
      };

      // Update the parent task with the new instanceModifications
      const updatedTask = await tasksService.updateTask(
        {
          id: task.id,
          recurrence: {
            ...task.recurrence,
            instanceModifications: updatedModifications,
          },
        },
        userId
      );

      // Return the task with the new status for UI purposes
      // The actual status on the parent task document remains unchanged
      // but the UI should show the modified status for this date
      return {
        ...updatedTask,
        status: newStatus, // Override for UI display
      };
    }

    // Case 2 & 3: This is a recurring instance (virtual or materialized)
    if (!task.recurringParentId) {
      throw new Error('Task is not a valid recurring instance');
    }

    // Get the instance date
    const instanceDate = task.instanceDate || task.scheduledDate;
    if (!instanceDate) {
      throw new Error('Task has no instance date');
    }

    // Try to find this task in the regular tasks store
    // If it exists there, it's already materialized
    const existingMaterializedTask = state.tasks.tasks[task.id];

    if (existingMaterializedTask) {
      // Case 3: Already materialized - just update the status
      const updatedTask = await tasksService.updateTask(
        { id: task.id, status: newStatus },
        userId
      );
      return updatedTask;
    }

    // Case 2: Virtual instance - store modification in parent's instanceModifications
    const parentTask = state.tasks.recurringParentTasks[task.recurringParentId] ||
                       state.tasks.tasks[task.recurringParentId];

    if (!parentTask) {
      throw new Error('Parent recurring task not found');
    }

    if (!parentTask.recurrence) {
      throw new Error('Parent task is not a recurring task');
    }

    // Use normalizeToDateString for consistent date handling (handles Date objects and ISO strings)
    const dateString = normalizeToDateString(instanceDate);

    // Update the parent task's instanceModifications
    const currentModifications = parentTask.recurrence.instanceModifications || {};
    const updatedModifications = {
      ...currentModifications,
      [dateString]: {
        ...currentModifications[dateString],
        status: newStatus,
      },
    };

    // Update the parent task with the new instanceModifications
    await tasksService.updateTask(
      {
        id: task.recurringParentId,
        recurrence: {
          ...parentTask.recurrence,
          instanceModifications: updatedModifications,
        },
      },
      userId
    );

    // Return the task with the new status for UI display
    return {
      ...task,
      status: newStatus,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update recurring instance status';
    return rejectWithValue({ message });
  }
});

// =============================================================================
// Recurring Task Delete Thunks
// =============================================================================

/**
 * Payload for deleting a single recurring instance
 */
export interface DeleteRecurringInstanceOnlyPayload {
  userId: string;
  parentTaskId: string;
  instanceDate: Date;
}

/**
 * Payload for deleting all future recurring instances
 */
export interface DeleteRecurringFuturePayload {
  userId: string;
  parentTaskId: string;
  instanceDate: Date;
}

/**
 * Delete a single occurrence of a recurring task
 *
 * Adds the instance date to the parent task's exception list to skip
 * this date in future generation. The virtual instance will no longer appear.
 */
export const deleteRecurringInstanceOnly = createAsyncThunk<
  Task,
  DeleteRecurringInstanceOnlyPayload,
  { state: RootState; rejectValue: ThunkError }
>('tasks/deleteRecurringInstanceOnly', async ({ userId, parentTaskId, instanceDate }, { getState, rejectWithValue }) => {
  try {
    const state = getState();

    // Get the parent task from recurringParentTasks or regular tasks
    const parentTask = state.tasks.recurringParentTasks[parentTaskId] || state.tasks.tasks[parentTaskId];

    if (!parentTask) {
      throw new Error('Parent recurring task not found');
    }

    if (!parentTask.recurrence) {
      throw new Error('Task is not a recurring task');
    }

    // Normalize dates using consistent string format to avoid timezone issues
    const instanceDateString = normalizeToDateString(instanceDate);
    const parentDateString = normalizeToDateString(parentTask.scheduledDate);

    if (!instanceDateString) {
      throw new Error('Invalid instance date');
    }

    // Convert parent date to Date object for operations that need it
    const normalizedParentDate = toDateObject(parentDateString);

    // Check if we're deleting the first occurrence using string comparison
    const isDeletingFirstOccurrence = isSameDateString(instanceDate, parentTask.scheduledDate);

    // Add the new exception with deduplication (handles Date objects and ISO strings consistently)
    const updatedExceptions = addExceptionWithDedup(parentTask.recurrence.exceptions, instanceDate);

    // DEBUG: Log exception being added
    console.log(`%c[DELETE] Adding exception for "${parentTask.title}"`, 'color: red; font-weight: bold');
    console.log(`  Instance date: ${instanceDateString}`);
    console.log(`  Before: [${parentTask.recurrence.exceptions.map((e: Date | string) => normalizeToDateString(e)).join(', ')}]`);
    console.log(`  After:  [${updatedExceptions.map((e: Date) => normalizeToDateString(e)).join(', ')}]`);

    // Import getNextOccurrence dynamically to calculate next occurrence
    const { getNextOccurrence } = await import('../../utils/recurrenceUtils');

    let updatePayload: Parameters<typeof tasksService.updateTask>[0];

    if (isDeletingFirstOccurrence) {
      // Deleting the first occurrence: move scheduledDate to next occurrence
      const nextOccurrence = getNextOccurrence(parentTask.recurrence, normalizedParentDate);

      if (nextOccurrence) {
        updatePayload = {
          id: parentTaskId,
          scheduledDate: nextOccurrence,
          recurrence: {
            ...parentTask.recurrence,
            exceptions: updatedExceptions, // Still add exception in case user scrolls back
          },
        };
      } else {
        // No next occurrence (e.g., end condition reached) - just add exception
        updatePayload = {
          id: parentTaskId,
          recurrence: {
            ...parentTask.recurrence,
            exceptions: updatedExceptions,
          },
        };
      }
    } else {
      // Deleting a later occurrence: just add exception
      updatePayload = {
        id: parentTaskId,
        recurrence: {
          ...parentTask.recurrence,
          exceptions: updatedExceptions,
        },
      };
    }

    // Also check for and delete any materialized instance for this date
    // Materialized instances have ID format: {parentTaskId}_{YYYY-MM-DD}
    const materializedInstanceId = `${parentTaskId}_${instanceDateString}`;
    const materializedInstance = state.tasks.tasks[materializedInstanceId];

    // If there's a materialized instance, soft-delete it
    if (materializedInstance) {
      try {
        await tasksService.softDeleteTask(materializedInstanceId, userId);
      } catch {
        // Continue even if this fails - the instance might only exist in local state
      }
    }

    const updatedTask = await tasksService.updateTask(updatePayload, userId);

    // DEBUG: Log the result
    console.log(`%c[DELETE] Saved to Firebase successfully`, 'color: green; font-weight: bold');
    console.log(`  Exceptions now: [${updatedTask.recurrence?.exceptions?.map((e: Date | string) => normalizeToDateString(e)).join(', ') || 'none'}]`);

    return updatedTask;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete recurring instance';
    return rejectWithValue({ message });
  }
});

/**
 * Delete all future occurrences of a recurring task
 *
 * Sets the parent task's recurrence end date to the day before the instance date,
 * effectively ending the series from this occurrence forward.
 */
export const deleteRecurringFuture = createAsyncThunk<
  Task,
  DeleteRecurringFuturePayload,
  { state: RootState; rejectValue: ThunkError }
>('tasks/deleteRecurringFuture', async ({ userId, parentTaskId, instanceDate }, { getState, rejectWithValue }) => {
  try {
    const state = getState();

    // Get the parent task from recurringParentTasks or regular tasks
    const parentTask = state.tasks.recurringParentTasks[parentTaskId] || state.tasks.tasks[parentTaskId];

    if (!parentTask) {
      throw new Error('Parent recurring task not found');
    }

    if (!parentTask.recurrence) {
      throw new Error('Task is not a recurring task');
    }

    // Calculate the day before the instance date using consistent date handling
    const instanceDateObj = toDateObject(normalizeToDateString(instanceDate) || '');
    if (isNaN(instanceDateObj.getTime())) {
      throw new Error('Invalid instance date');
    }
    const normalizedEndDate = startOfDay(subDays(instanceDateObj, 1));

    // Update the parent task to set the end date
    const updatedTask = await tasksService.updateTask(
      {
        id: parentTaskId,
        recurrence: {
          ...parentTask.recurrence,
          endCondition: {
            type: 'date',
            endDate: normalizedEndDate,
            maxOccurrences: null,
          },
        },
      },
      userId
    );

    return updatedTask;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete future recurring instances';
    return rejectWithValue({ message });
  }
});

// =============================================================================
// Cleanup Thunk for Duplicate Exceptions
// =============================================================================

/**
 * Clean up duplicate exception dates in all recurring tasks
 *
 * This fixes corrupted data where the same date appears multiple times
 * in a recurring task's exceptions array.
 */
export const cleanupDuplicateExceptions = createAsyncThunk<
  { tasksChecked: number; tasksCleaned: number; totalDuplicatesRemoved: number },
  { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('tasks/cleanupDuplicateExceptions', async ({ userId }, { rejectWithValue }) => {
  try {
    const result = await tasksService.cleanupAllDuplicateExceptions(userId);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cleanup duplicate exceptions';
    return rejectWithValue({ message });
  }
});

// =============================================================================
// NEW: Recurring Pattern Thunks (Materialized Instance System)
// =============================================================================

import * as patternsService from '../../services/firebase/patterns.service';
import type { MigrationResult } from '../../services/firebase/patterns.service';
import type {
  RecurringPattern,
  CreateRecurringPatternInput,
  UpdateRecurringPatternInput,
} from '../../types';

/**
 * Fetch all recurring patterns for a user
 */
export const fetchRecurringPatterns = createAsyncThunk<
  RecurringPattern[],
  { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('tasks/fetchRecurringPatterns', async ({ userId }, { rejectWithValue }) => {
  try {
    const patterns = await patternsService.getRecurringPatterns(userId);
    console.log(`[LOAD] Loaded ${patterns.length} recurring patterns`);
    return patterns;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch recurring patterns';
    return rejectWithValue({ message });
  }
});

/**
 * Create a new recurring pattern and generate initial instances
 */
export const createRecurringPatternThunk = createAsyncThunk<
  { pattern: RecurringPattern; instances: Task[] },
  { input: CreateRecurringPatternInput; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('tasks/createRecurringPattern', async ({ input, userId }, { rejectWithValue }) => {
  try {
    const result = await patternsService.createRecurringPattern(input, userId);
    console.log(`[CREATE] Created recurring pattern "${result.pattern.title}" with ${result.instances.length} instances`);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create recurring pattern';
    return rejectWithValue({ message });
  }
});

/**
 * Update a recurring pattern
 */
export const updateRecurringPatternThunk = createAsyncThunk<
  RecurringPattern,
  { input: UpdateRecurringPatternInput; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('tasks/updateRecurringPattern', async ({ input, userId }, { rejectWithValue }) => {
  try {
    const pattern = await patternsService.updateRecurringPattern(input, userId);
    console.log(`[UPDATE] Updated recurring pattern "${pattern.title}"`);
    return pattern;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update recurring pattern';
    return rejectWithValue({ message });
  }
});

/**
 * Delete a recurring pattern (optionally with instances)
 */
export const deleteRecurringPatternThunk = createAsyncThunk<
  { patternId: string; deleteInstances: boolean; deletedTaskIds?: string[] },
  { patternId: string; userId: string; deleteInstances?: boolean },
  { state: RootState; rejectValue: ThunkError }
>('tasks/deleteRecurringPattern', async ({ patternId, userId, deleteInstances = false }, { getState, rejectWithValue }) => {
  try {
    // Get task IDs before deletion if we're deleting instances
    let deletedTaskIds: string[] | undefined;
    if (deleteInstances) {
      const state = getState();
      deletedTaskIds = Object.values(state.tasks.tasks)
        .filter((task) => task.recurringPatternId === patternId)
        .map((task) => task.id);
    }

    await patternsService.deleteRecurringPattern(patternId, userId, deleteInstances);
    console.log(`[DELETE] Deleted recurring pattern ${patternId} (deleteInstances: ${deleteInstances})`);

    return { patternId, deleteInstances, deletedTaskIds };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete recurring pattern';
    return rejectWithValue({ message });
  }
});

/**
 * Ensure task instances exist for a given date
 *
 * This is called when navigating to a future date to generate
 * on-demand instances if they don't exist yet.
 */
export const ensureInstancesForDateThunk = createAsyncThunk<
  Task[],
  { patternId: string; userId: string; targetDate: Date },
  { state: RootState; rejectValue: ThunkError }
>('tasks/ensureInstancesForDate', async ({ patternId, userId, targetDate }, { rejectWithValue }) => {
  try {
    const instances = await patternsService.ensureInstancesForDate(patternId, userId, targetDate);
    if (instances.length > 0) {
      console.log(`[GENERATE] Generated ${instances.length} on-demand instances for pattern ${patternId}`);
    }
    return instances;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to ensure instances for date';
    return rejectWithValue({ message });
  }
});

/**
 * Handle completion of an 'afterCompletion' recurring task
 *
 * When a task with 'afterCompletion' pattern is completed,
 * this creates the next instance.
 */
export const completeAfterCompletionTask = createAsyncThunk<
  { completedTask: Task; nextInstance: Task | null },
  { taskId: string; patternId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('tasks/completeAfterCompletionTask', async ({ taskId, patternId, userId }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const task = state.tasks.tasks[taskId];

    if (!task) {
      throw new Error('Task not found');
    }

    // Mark the task as complete with completedAt timestamp
    const completedAt = new Date();
    const completedTask = await tasksService.updateTask(
      {
        id: taskId,
        status: 'complete',
        completedAt,
      },
      userId
    );

    // Create the next instance
    const nextInstance = await patternsService.handleAfterCompletionComplete(
      taskId,
      patternId,
      userId,
      completedAt
    );

    console.log(`[COMPLETE] Completed afterCompletion task, next instance on ${nextInstance?.scheduledDate}`);

    return { completedTask, nextInstance };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to complete task';
    return rejectWithValue({ message });
  }
});

// =============================================================================
// Migration Thunk
// =============================================================================

/**
 * Migrate all legacy recurring tasks to the new pattern system
 *
 * This converts tasks with embedded `recurrence` field to
 * separate RecurringPattern documents with materialized instances.
 */
export const migrateRecurringTasksThunk = createAsyncThunk<
  MigrationResult,
  { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('tasks/migrateRecurringTasks', async ({ userId }, { rejectWithValue }) => {
  try {
    console.log('[MIGRATE] Starting migration of legacy recurring tasks...');
    const result = await patternsService.migrateAllLegacyRecurringTasks(userId);
    console.log('[MIGRATE] Migration complete:', result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to migrate recurring tasks';
    return rejectWithValue({ message });
  }
});
