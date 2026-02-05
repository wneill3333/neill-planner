/**
 * Task Slice
 *
 * Redux Toolkit slice for task state management.
 * Handles normalized task storage, date-based indexing, and CRUD operations.
 */

import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import { startOfDay } from 'date-fns';
import type { Task, SyncStatus, PriorityLetter } from '../../types';
import { NONE_CATEGORY_ID } from '../../types';
import type { RootState } from '../../store';
import { generateRecurringInstances } from '../../utils/recurrenceUtils';
import { sortTasksByPriority } from '../../utils/taskUtils';
import { getNextPriorityNumber } from '../../utils/priorityUtils';
import { normalizeToDateString } from '../../utils/dateUtils';
import {
  fetchTasksByDate,
  createTask as createTaskThunk,
  updateTaskAsync,
  deleteTask,
  hardDeleteTask,
  restoreTask,
  batchUpdateTasksAsync,
  fetchTasksByDateRange,
  fetchRecurringTasks,
  reorderTasks,
  reorderTasksAsync,
  editRecurringInstanceOnly,
  editRecurringFuture,
  deleteRecurringInstanceOnly,
  deleteRecurringFuture,
  forwardTaskAsync,
  updateRecurringInstanceStatus,
} from './taskThunks';

// =============================================================================
// Types
// =============================================================================

/**
 * State shape for the tasks slice
 */
export interface TasksState {
  /** Normalized tasks storage - tasks indexed by ID */
  tasks: Record<string, Task>;
  /** Task IDs indexed by date (ISO date string) for quick lookup */
  taskIdsByDate: Record<string, string[]>;
  /** Recurring parent tasks (tasks with recurrence patterns) indexed by ID */
  recurringParentTasks: Record<string, Task>;
  /** Whether recurring parent tasks have been loaded */
  recurringTasksLoaded: boolean;
  /** Currently selected date (ISO date string) */
  selectedDate: string;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Sync status with backend */
  syncStatus: SyncStatus;
  /** Previous priority numbers for rollback on reorder failure */
  reorderRollbackState: Record<string, { letter: PriorityLetter; number: number }> | null;
}

/**
 * Payload for setting multiple tasks at once
 */
export interface SetTasksPayload {
  tasks: Task[];
  date: string;
}

/**
 * Payload for updating a task's date (handles index updates)
 */
export interface UpdateTaskDatePayload {
  taskId: string;
  oldDate: string | null;
  newDate: string | null;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get ISO date string from a Date object or return null
 */
function getDateString(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date as ISO string
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Add a task ID to the date index
 */
function addTaskToDateIndex(
  taskIdsByDate: Record<string, string[]>,
  date: string | null,
  taskId: string
): void {
  if (!date) return;
  if (!taskIdsByDate[date]) {
    taskIdsByDate[date] = [];
  }
  if (!taskIdsByDate[date].includes(taskId)) {
    taskIdsByDate[date].push(taskId);
  }
}

/**
 * Remove a task ID from the date index
 */
function removeTaskFromDateIndex(
  taskIdsByDate: Record<string, string[]>,
  date: string | null,
  taskId: string
): void {
  if (!date || !taskIdsByDate[date]) return;
  const index = taskIdsByDate[date].indexOf(taskId);
  if (index > -1) {
    taskIdsByDate[date].splice(index, 1);
  }
  // Clean up empty arrays
  if (taskIdsByDate[date].length === 0) {
    delete taskIdsByDate[date];
  }
}

// =============================================================================
// Initial State
// =============================================================================

export const initialState: TasksState = {
  tasks: {},
  taskIdsByDate: {},
  recurringParentTasks: {},
  recurringTasksLoaded: false,
  selectedDate: getTodayString(),
  loading: false,
  error: null,
  syncStatus: 'synced',
  reorderRollbackState: null,
};

// =============================================================================
// Slice
// =============================================================================

export const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    /**
     * Set tasks for a specific date (replaces existing tasks for that date)
     */
    setTasks: (state, action: PayloadAction<SetTasksPayload>) => {
      const { tasks, date } = action.payload;

      // Clear existing task IDs for this date
      if (state.taskIdsByDate[date]) {
        // Remove old tasks that are only indexed under this date
        for (const taskId of state.taskIdsByDate[date]) {
          const task = state.tasks[taskId];
          if (task) {
            const taskDate = getDateString(task.scheduledDate);
            // Only delete if this is the only date reference
            if (taskDate === date) {
              delete state.tasks[taskId];
            }
          }
        }
        state.taskIdsByDate[date] = [];
      }

      // Add new tasks
      for (const task of tasks) {
        state.tasks[task.id] = task;
        const taskDate = getDateString(task.scheduledDate);
        addTaskToDateIndex(state.taskIdsByDate, taskDate, task.id);
      }
    },

    /**
     * Add a single task
     */
    addTask: (state, action: PayloadAction<Task>) => {
      const task = action.payload;
      state.tasks[task.id] = task;
      const dateString = getDateString(task.scheduledDate);
      addTaskToDateIndex(state.taskIdsByDate, dateString, task.id);
    },

    /**
     * Update an existing task
     */
    updateTask: (state, action: PayloadAction<Partial<Task> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      const existingTask = state.tasks[id];

      if (!existingTask) return;

      // Handle date change
      if ('scheduledDate' in updates) {
        const oldDate = getDateString(existingTask.scheduledDate);
        const newDate = getDateString(updates.scheduledDate);

        if (oldDate !== newDate) {
          removeTaskFromDateIndex(state.taskIdsByDate, oldDate, id);
          addTaskToDateIndex(state.taskIdsByDate, newDate, id);
        }
      }

      // Apply updates
      state.tasks[id] = { ...existingTask, ...updates };
    },

    /**
     * Remove a task
     */
    removeTask: (state, action: PayloadAction<string>) => {
      const taskId = action.payload;
      const task = state.tasks[taskId];

      if (!task) return;

      // Remove from date index
      const dateString = getDateString(task.scheduledDate);
      removeTaskFromDateIndex(state.taskIdsByDate, dateString, taskId);

      // Remove task
      delete state.tasks[taskId];
    },

    /**
     * Set the currently selected date
     */
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Set error message
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /**
     * Set sync status
     */
    setSyncStatus: (state, action: PayloadAction<SyncStatus>) => {
      state.syncStatus = action.payload;
    },

    /**
     * Clear all tasks (useful for logout)
     */
    clearTasks: (state) => {
      state.tasks = {};
      state.taskIdsByDate = {};
      state.recurringParentTasks = {};
      state.recurringTasksLoaded = false;
      state.error = null;
    },

    /**
     * Reorder tasks within a priority group (optimistic update)
     *
     * @param taskIds - Array of task IDs in the new order
     * @param priorityLetter - The priority letter of the group being reordered
     */
    reorderTasksLocal: (
      state,
      action: PayloadAction<{ taskIds: string[]; priorityLetter: PriorityLetter }>
    ) => {
      const { taskIds, priorityLetter } = action.payload;

      // Store previous state for potential rollback
      const rollbackState: Record<string, { letter: PriorityLetter; number: number }> = {};
      taskIds.forEach((taskId) => {
        const task = state.tasks[taskId];
        if (task && task.priority.letter === priorityLetter) {
          rollbackState[taskId] = {
            letter: task.priority.letter,
            number: task.priority.number,
          };
        }
      });
      state.reorderRollbackState = rollbackState;

      // Update priority numbers based on new order
      taskIds.forEach((taskId, index) => {
        const task = state.tasks[taskId];
        if (task && task.priority.letter === priorityLetter) {
          task.priority.number = index + 1;
          task.updatedAt = new Date();
        }
      });
    },

    /**
     * Batch update multiple tasks (for sync operations)
     */
    batchUpdateTasks: (state, action: PayloadAction<Task[]>) => {
      for (const task of action.payload) {
        const existingTask = state.tasks[task.id];

        if (existingTask) {
          // Handle date change
          const oldDate = getDateString(existingTask.scheduledDate);
          const newDate = getDateString(task.scheduledDate);

          if (oldDate !== newDate) {
            removeTaskFromDateIndex(state.taskIdsByDate, oldDate, task.id);
            addTaskToDateIndex(state.taskIdsByDate, newDate, task.id);
          }
        } else {
          // New task, add to index
          const dateString = getDateString(task.scheduledDate);
          addTaskToDateIndex(state.taskIdsByDate, dateString, task.id);
        }

        state.tasks[task.id] = task;
      }
    },
  },
  extraReducers: (builder) => {
    // ==========================================================================
    // fetchTasksByDate
    // ==========================================================================
    builder
      .addCase(fetchTasksByDate.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.syncStatus = 'syncing';
      })
      .addCase(fetchTasksByDate.fulfilled, (state, action) => {
        const { tasks, date } = action.payload;
        state.loading = false;
        state.syncStatus = 'synced';

        // Clear existing task IDs for this date
        if (state.taskIdsByDate[date]) {
          // Remove old tasks that are only indexed under this date
          for (const taskId of state.taskIdsByDate[date]) {
            const task = state.tasks[taskId];
            if (task) {
              const taskDate = getDateString(task.scheduledDate);
              if (taskDate === date) {
                delete state.tasks[taskId];
              }
            }
          }
        }
        state.taskIdsByDate[date] = [];

        // Add new tasks
        for (const task of tasks) {
          state.tasks[task.id] = task;
          const taskDate = getDateString(task.scheduledDate);
          addTaskToDateIndex(state.taskIdsByDate, taskDate, task.id);
        }
      })
      .addCase(fetchTasksByDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch tasks';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // createTask
    // ==========================================================================
    builder
      .addCase(createTaskThunk.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(createTaskThunk.fulfilled, (state, action) => {
        const task = action.payload;
        state.tasks[task.id] = task;
        const dateString = getDateString(task.scheduledDate);
        addTaskToDateIndex(state.taskIdsByDate, dateString, task.id);

        // If task has recurrence, also add to recurringParentTasks
        // so it's immediately available for instance generation
        if (task.recurrence) {
          state.recurringParentTasks[task.id] = task;
        }

        state.syncStatus = 'synced';
      })
      .addCase(createTaskThunk.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to create task';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // updateTaskAsync
    // ==========================================================================
    builder
      .addCase(updateTaskAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(updateTaskAsync.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        const existingTask = state.tasks[updatedTask.id];

        if (existingTask) {
          // Handle date change
          const oldDate = getDateString(existingTask.scheduledDate);
          const newDate = getDateString(updatedTask.scheduledDate);

          if (oldDate !== newDate) {
            removeTaskFromDateIndex(state.taskIdsByDate, oldDate, updatedTask.id);
            addTaskToDateIndex(state.taskIdsByDate, newDate, updatedTask.id);
          }
        }

        state.tasks[updatedTask.id] = updatedTask;

        // Handle recurrence changes:
        // If task now has recurrence, add to recurringParentTasks
        // If task no longer has recurrence, remove from recurringParentTasks
        if (updatedTask.recurrence) {
          state.recurringParentTasks[updatedTask.id] = updatedTask;
        } else if (state.recurringParentTasks[updatedTask.id]) {
          delete state.recurringParentTasks[updatedTask.id];
        }

        state.syncStatus = 'synced';
      })
      .addCase(updateTaskAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to update task';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // deleteTask (soft delete)
    // ==========================================================================
    builder
      .addCase(deleteTask.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        const taskId = action.payload;
        const task = state.tasks[taskId];

        if (task) {
          const dateString = getDateString(task.scheduledDate);
          removeTaskFromDateIndex(state.taskIdsByDate, dateString, taskId);
          delete state.tasks[taskId];
        }

        state.syncStatus = 'synced';
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to delete task';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // hardDeleteTask (permanent delete)
    // ==========================================================================
    builder
      .addCase(hardDeleteTask.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(hardDeleteTask.fulfilled, (state, action) => {
        const taskId = action.payload;
        const task = state.tasks[taskId];

        if (task) {
          const dateString = getDateString(task.scheduledDate);
          removeTaskFromDateIndex(state.taskIdsByDate, dateString, taskId);
          delete state.tasks[taskId];
        }

        state.syncStatus = 'synced';
      })
      .addCase(hardDeleteTask.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to permanently delete task';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // restoreTask
    // ==========================================================================
    builder
      .addCase(restoreTask.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(restoreTask.fulfilled, (state, action) => {
        const task = action.payload;
        state.tasks[task.id] = task;
        const dateString = getDateString(task.scheduledDate);
        addTaskToDateIndex(state.taskIdsByDate, dateString, task.id);
        state.syncStatus = 'synced';
      })
      .addCase(restoreTask.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to restore task';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // batchUpdateTasksAsync
    // ==========================================================================
    builder
      .addCase(batchUpdateTasksAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(batchUpdateTasksAsync.fulfilled, (state, action) => {
        // Apply the updates to local state
        for (const update of action.payload) {
          const existingTask = state.tasks[update.id];
          if (existingTask) {
            // Merge updates into existing task
            state.tasks[update.id] = {
              ...existingTask,
              ...update,
              updatedAt: new Date(),
            } as Task;
          }
        }
        state.syncStatus = 'synced';
      })
      .addCase(batchUpdateTasksAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to batch update tasks';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // fetchTasksByDateRange
    // ==========================================================================
    builder
      .addCase(fetchTasksByDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.syncStatus = 'syncing';
      })
      .addCase(fetchTasksByDateRange.fulfilled, (state, action) => {
        state.loading = false;
        state.syncStatus = 'synced';

        // Add all fetched tasks to state
        for (const task of action.payload) {
          state.tasks[task.id] = task;
          const dateString = getDateString(task.scheduledDate);
          addTaskToDateIndex(state.taskIdsByDate, dateString, task.id);
        }
      })
      .addCase(fetchTasksByDateRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch tasks for date range';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // fetchRecurringTasks
    // ==========================================================================
    builder
      .addCase(fetchRecurringTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecurringTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.recurringTasksLoaded = true;

        // Store recurring parent tasks
        for (const task of action.payload) {
          state.recurringParentTasks[task.id] = task;
        }
      })
      .addCase(fetchRecurringTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch recurring tasks';
      });

    // ==========================================================================
    // reorderTasks
    // ==========================================================================
    builder
      .addCase(reorderTasks.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(reorderTasks.fulfilled, (state, action) => {
        // Apply the priority updates to local state
        for (const update of action.payload.updates) {
          const existingTask = state.tasks[update.id];
          if (existingTask && update.priority) {
            state.tasks[update.id] = {
              ...existingTask,
              priority: {
                ...existingTask.priority,
                ...update.priority,
              },
              updatedAt: new Date(),
            };
          }
        }
        state.syncStatus = 'synced';
      })
      .addCase(reorderTasks.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to reorder tasks';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // reorderTasksAsync (drag-and-drop persistence)
    // ==========================================================================
    builder
      .addCase(reorderTasksAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(reorderTasksAsync.fulfilled, (state) => {
        // Optimistic update already applied via reorderTasksLocal
        // Just confirm sync status and clear rollback state
        state.syncStatus = 'synced';
        state.reorderRollbackState = null;
      })
      .addCase(reorderTasksAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to save task order';
        state.syncStatus = 'error';

        // Rollback to previous state on failure
        if (state.reorderRollbackState) {
          for (const [taskId, previousPriority] of Object.entries(state.reorderRollbackState)) {
            const task = state.tasks[taskId];
            if (task) {
              task.priority = previousPriority;
            }
          }
          state.reorderRollbackState = null;
        }
      });

    // ==========================================================================
    // editRecurringInstanceOnly
    // ==========================================================================
    builder
      .addCase(editRecurringInstanceOnly.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(editRecurringInstanceOnly.fulfilled, (state, action) => {
        const materializedInstance = action.payload;

        // Add the new materialized instance to tasks
        state.tasks[materializedInstance.id] = materializedInstance;
        const dateString = getDateString(materializedInstance.scheduledDate);
        addTaskToDateIndex(state.taskIdsByDate, dateString, materializedInstance.id);

        // Update parent task's exceptions in local state to prevent duplicate virtual instance
        const parentId = materializedInstance.recurringParentId;
        if (parentId) {
          const parentInRecurring = state.recurringParentTasks[parentId];
          const parentInTasks = state.tasks[parentId];
          const instanceDate = materializedInstance.instanceDate;

          if (parentInRecurring?.recurrence && instanceDate) {
            state.recurringParentTasks[parentId] = {
              ...parentInRecurring,
              recurrence: {
                ...parentInRecurring.recurrence,
                exceptions: [...parentInRecurring.recurrence.exceptions, instanceDate],
              },
              updatedAt: new Date(),
            };
          }

          // Also update in regular tasks if present
          if (parentInTasks?.recurrence && instanceDate) {
            state.tasks[parentId] = {
              ...parentInTasks,
              recurrence: {
                ...parentInTasks.recurrence,
                exceptions: [...parentInTasks.recurrence.exceptions, instanceDate],
              },
              updatedAt: new Date(),
            };
          }
        }

        state.syncStatus = 'synced';
      })
      .addCase(editRecurringInstanceOnly.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to edit recurring instance';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // updateRecurringInstanceStatus
    // ==========================================================================
    builder
      .addCase(updateRecurringInstanceStatus.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(updateRecurringInstanceStatus.fulfilled, (state, action) => {
        const updatedTask = action.payload;

        // Determine the parent task ID
        // If the task has recurrence, it IS the parent task
        // Otherwise, use recurringParentId
        const isParentTask = updatedTask.recurrence !== null && !updatedTask.isRecurringInstance;
        const parentId = isParentTask ? updatedTask.id : updatedTask.recurringParentId;

        if (isParentTask) {
          // Update the parent task itself (with the new instanceModifications in recurrence)
          state.tasks[updatedTask.id] = updatedTask;
          if (state.recurringParentTasks[updatedTask.id]) {
            state.recurringParentTasks[updatedTask.id] = updatedTask;
          }
        } else if (parentId) {
          // Update the parent's instanceModifications in local state
          const instanceDate = updatedTask.instanceDate || updatedTask.scheduledDate;
          const dateString = instanceDate ? getDateString(instanceDate) : null;

          if (dateString) {
            const parentInRecurring = state.recurringParentTasks[parentId];
            const parentInTasks = state.tasks[parentId];

            // Update in recurringParentTasks
            if (parentInRecurring?.recurrence) {
              const currentModifications = parentInRecurring.recurrence.instanceModifications || {};
              state.recurringParentTasks[parentId] = {
                ...parentInRecurring,
                recurrence: {
                  ...parentInRecurring.recurrence,
                  instanceModifications: {
                    ...currentModifications,
                    [dateString]: {
                      ...currentModifications[dateString],
                      status: updatedTask.status,
                    },
                  },
                },
                updatedAt: new Date(),
              };
            }

            // Also update in regular tasks if present
            if (parentInTasks?.recurrence) {
              const currentModifications = parentInTasks.recurrence.instanceModifications || {};
              state.tasks[parentId] = {
                ...parentInTasks,
                recurrence: {
                  ...parentInTasks.recurrence,
                  instanceModifications: {
                    ...currentModifications,
                    [dateString]: {
                      ...currentModifications[dateString],
                      status: updatedTask.status,
                    },
                  },
                },
                updatedAt: new Date(),
              };
            }
          }

          // If this is a materialized instance (exists in tasks store), update it
          if (state.tasks[updatedTask.id]) {
            state.tasks[updatedTask.id] = updatedTask;
          }
        }

        state.syncStatus = 'synced';
      })
      .addCase(updateRecurringInstanceStatus.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to update recurring instance status';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // editRecurringFuture
    // ==========================================================================
    builder
      .addCase(editRecurringFuture.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(editRecurringFuture.fulfilled, (state, action) => {
        // Update the parent recurring task
        const updatedParentTask = action.payload;
        state.recurringParentTasks[updatedParentTask.id] = updatedParentTask;
        // Also update in regular tasks if it exists there
        if (state.tasks[updatedParentTask.id]) {
          state.tasks[updatedParentTask.id] = updatedParentTask;
        }
        state.syncStatus = 'synced';
      })
      .addCase(editRecurringFuture.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to edit future recurring instances';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // deleteRecurringInstanceOnly
    // ==========================================================================
    builder
      .addCase(deleteRecurringInstanceOnly.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(deleteRecurringInstanceOnly.fulfilled, (state, action) => {
        // Update the parent recurring task with new exceptions
        const updatedParentTask = action.payload;
        state.recurringParentTasks[updatedParentTask.id] = updatedParentTask;
        // Also update in regular tasks if it exists there
        if (state.tasks[updatedParentTask.id]) {
          state.tasks[updatedParentTask.id] = updatedParentTask;
        }

        // Also remove any materialized instance for this date
        // The thunk may have soft-deleted it in Firestore, we need to remove from local state too
        const { parentTaskId, instanceDate } = action.meta.arg;
        // Use normalizeToDateString for consistent date handling
        const dateString = normalizeToDateString(instanceDate);
        const materializedInstanceId = `${parentTaskId}_${dateString}`;

        if (state.tasks[materializedInstanceId]) {
          // Remove from date index
          const task = state.tasks[materializedInstanceId];
          const taskDate = getDateString(task.scheduledDate);
          removeTaskFromDateIndex(state.taskIdsByDate, taskDate, materializedInstanceId);
          // Remove from tasks
          delete state.tasks[materializedInstanceId];
        }

        state.syncStatus = 'synced';
      })
      .addCase(deleteRecurringInstanceOnly.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to delete recurring instance';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // deleteRecurringFuture
    // ==========================================================================
    builder
      .addCase(deleteRecurringFuture.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(deleteRecurringFuture.fulfilled, (state, action) => {
        // Update the parent recurring task with new end condition
        const updatedParentTask = action.payload;
        state.recurringParentTasks[updatedParentTask.id] = updatedParentTask;
        // Also update in regular tasks if it exists there
        if (state.tasks[updatedParentTask.id]) {
          state.tasks[updatedParentTask.id] = updatedParentTask;
        }
        state.syncStatus = 'synced';
      })
      .addCase(deleteRecurringFuture.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to delete future recurring instances';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // forwardTaskAsync
    // ==========================================================================
    builder
      .addCase(forwardTaskAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(forwardTaskAsync.fulfilled, (state, action) => {
        const { originalTask, newTask } = action.payload;

        // Update the original task to forward status
        state.tasks[originalTask.id] = originalTask;

        // Add the new task to the state
        state.tasks[newTask.id] = newTask;
        const newDateString = getDateString(newTask.scheduledDate);
        addTaskToDateIndex(state.taskIdsByDate, newDateString, newTask.id);

        state.syncStatus = 'synced';
      })
      .addCase(forwardTaskAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to forward task';
        state.syncStatus = 'error';
      });
  },
});

// =============================================================================
// Actions
// =============================================================================

export const {
  setTasks,
  addTask,
  updateTask,
  removeTask,
  setSelectedDate,
  setLoading,
  setError,
  setSyncStatus,
  clearTasks,
  reorderTasksLocal,
  batchUpdateTasks,
} = taskSlice.actions;

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select all tasks as an array
 */
export const selectAllTasks = (state: RootState): Task[] => Object.values(state.tasks.tasks);

/**
 * Select a task by ID
 */
export const selectTaskById = (state: RootState, taskId: string): Task | undefined =>
  state.tasks.tasks[taskId];

/**
 * Select tasks for a specific date.
 *
 * Uses createSelector for memoization to prevent unnecessary re-renders.
 * Only recomputes when tasks or taskIdsByDate changes.
 *
 * @param state - Redux state
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Array of tasks for the specified date
 */
export const selectTasksByDate = createSelector(
  [
    (state: RootState) => state.tasks.tasks,
    (state: RootState) => state.tasks.taskIdsByDate,
    (_state: RootState, date: string) => date,
  ],
  (tasks, taskIdsByDate, date): Task[] => {
    const taskIds = taskIdsByDate[date] || [];
    return taskIds.map((id) => tasks[id]).filter((task): task is Task => !!task);
  }
);

/**
 * Select tasks for a specific date, including recurring task instances.
 *
 * Combines regular tasks with generated instances from recurring parent tasks.
 * Uses createSelector for memoization to prevent unnecessary re-renders.
 *
 * @param state - Redux state
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Array of tasks including both regular tasks and recurring instances, sorted by priority
 */
export const selectTasksWithRecurringInstances = createSelector(
  [
    (state: RootState) => state.tasks.tasks,
    (state: RootState) => state.tasks.taskIdsByDate,
    (state: RootState) => state.tasks.recurringParentTasks,
    (_state: RootState, date: string) => date,
  ],
  (tasks, taskIdsByDate, recurringParentTasks, date): Task[] => {
    // Get regular tasks for the date
    const taskIds = taskIdsByDate[date] || [];
    const rawRegularTasks = taskIds.map((id) => tasks[id]).filter((task): task is Task => !!task);

    // Parse the date string first (needed for filtering)
    const [year, month, day] = date.split('-').map(Number);
    const isValidDate = !isNaN(year) && !isNaN(month) && !isNaN(day);
    const dateObj = isValidDate ? startOfDay(new Date(year, month - 1, day)) : null;

    // Filter out recurring parent tasks that are incorrectly indexed under this date
    // A recurring parent should only appear on its original scheduled date, not on other dates
    // (Other dates should show generated instances, not the parent itself)
    const filteredRegularTasks = rawRegularTasks.filter((task) => {
      // Non-recurring tasks or recurring instances can stay
      if (!task.recurrence || task.isRecurringInstance) {
        return true;
      }

      // This is a recurring parent task - check if this is its original scheduled date
      // Use normalizeToDateString for consistent comparison regardless of serialization format
      const taskDateString = normalizeToDateString(task.scheduledDate);

      // If the task's scheduled date matches the requested date, keep it
      if (taskDateString === date) {
        // But also check if it's in the exceptions list for this date
        if (task.recurrence.exceptions && task.recurrence.exceptions.length > 0) {
          // Use normalizeToDateString for consistent exception date comparison
          const exceptionDates = new Set(
            task.recurrence.exceptions.map((e: Date | string) => normalizeToDateString(e))
          );
          if (exceptionDates.has(date)) {
            return false;
          }
        }
        return true;
      }

      // The parent task is indexed under the wrong date - filter it out
      // (It will be shown via generated instances if appropriate)
      return false;
    });

    // Apply instance modifications to parent tasks displayed on their original date
    const regularTasks = filteredRegularTasks.map((task) => {
      // Check if this is a recurring parent task with modifications for this date
      if (task.recurrence && !task.isRecurringInstance) {
        const modifications = task.recurrence.instanceModifications?.[date];
        if (modifications) {
          return {
            ...task,
            ...(modifications.status && { status: modifications.status }),
            ...(modifications.title && { title: modifications.title }),
            ...(modifications.description && { description: modifications.description }),
          };
        }
      }
      return task;
    });

    // Validate date (dateObj already created above)
    if (!isValidDate || !dateObj) {
      console.warn(`Invalid date format in selector: ${date}`);
      return sortTasksByPriority(regularTasks);
    }

    // Track which recurring parent IDs already have materialized instances OR
    // the parent task itself is already in regular tasks for this date
    const materializedParentIds = new Set(
      regularTasks
        .filter((task) => task.isRecurringInstance && task.recurringParentId)
        .map((task) => task.recurringParentId as string)
    );

    // Also track parent tasks that are directly in regular tasks (original scheduled date)
    const parentTaskIdsInRegularTasks = new Set(
      regularTasks
        .filter((task) => task.recurrence !== null)
        .map((task) => task.id)
    );

    // Generate instances for all recurring parent tasks
    const recurringInstances: Task[] = [];
    // Defensive check for undefined/null recurringParentTasks (e.g., in tests with incomplete state)
    if (!recurringParentTasks) {
      return sortTasksByPriority(regularTasks);
    }
    for (const parentTask of Object.values(recurringParentTasks)) {
      // Skip if this parent already has a materialized instance on this date
      if (materializedParentIds.has(parentTask.id)) {
        continue;
      }

      // Skip if the parent task itself is already in regular tasks for this date
      // (this happens on the original creation date)
      if (parentTaskIdsInRegularTasks.has(parentTask.id)) {
        continue;
      }

      // Skip tasks that definitely won't have instances on this date
      // (e.g., start date is after requested date)
      // Handle scheduledDate that could be a Date object or ISO string (Redux serialization)
      if (parentTask.scheduledDate) {
        const parentScheduledDate = parentTask.scheduledDate instanceof Date
          ? parentTask.scheduledDate
          : new Date(parentTask.scheduledDate);
        if (startOfDay(parentScheduledDate) > dateObj) {
          continue;
        }
      }

      // Generate instances for this single date
      const instances = generateRecurringInstances(parentTask, dateObj, dateObj);
      recurringInstances.push(...instances);
    }

    // Auto-assign priority numbers to recurring instances
    // Track the next available number for each priority letter
    const nextNumbers: Record<PriorityLetter, number> = {
      A: getNextPriorityNumber(regularTasks, 'A'),
      B: getNextPriorityNumber(regularTasks, 'B'),
      C: getNextPriorityNumber(regularTasks, 'C'),
      D: getNextPriorityNumber(regularTasks, 'D'),
    };

    // Assign numbers to recurring instances
    const numberedInstances = recurringInstances.map((instance) => {
      const letter = instance.priority.letter;
      const number = nextNumbers[letter];
      nextNumbers[letter] = number + 1;
      return {
        ...instance,
        priority: {
          letter,
          number,
        },
      };
    });

    // Combine regular tasks and numbered instances
    const allTasks = [...regularTasks, ...numberedInstances];

    // Filter out tasks with 'delete' status - they should not be displayed
    const visibleTasks = allTasks.filter((task) => task.status !== 'delete');

    // Deduplicate by task ID (prefer first occurrence - regular tasks over generated instances)
    const seenIds = new Set<string>();
    const uniqueTasks = visibleTasks.filter((task) => {
      if (seenIds.has(task.id)) {
        return false;
      }
      seenIds.add(task.id);
      return true;
    });

    // Sort by priority (letter then number)
    return sortTasksByPriority(uniqueTasks);
  }
);

/**
 * Select tasks for the currently selected date.
 *
 * Uses createSelector for memoization to prevent unnecessary re-renders.
 *
 * @param state - Redux state
 * @returns Array of tasks for the selected date
 */
export const selectTasksForSelectedDate = createSelector(
  [
    (state: RootState) => state.tasks.tasks,
    (state: RootState) => state.tasks.taskIdsByDate,
    (state: RootState) => state.tasks.selectedDate,
  ],
  (tasks, taskIdsByDate, selectedDate): Task[] => {
    const taskIds = taskIdsByDate[selectedDate] || [];
    return taskIds.map((id) => tasks[id]).filter((task): task is Task => !!task);
  }
);

/**
 * Select the currently selected date
 */
export const selectSelectedDate = (state: RootState): string => state.tasks.selectedDate;

/**
 * Select loading state
 */
export const selectTasksLoading = (state: RootState): boolean => state.tasks.loading;

/**
 * Select error state
 */
export const selectTasksError = (state: RootState): string | null => state.tasks.error;

/**
 * Select sync status
 */
export const selectTasksSyncStatus = (state: RootState): SyncStatus => state.tasks.syncStatus;

/**
 * Select tasks grouped by priority letter for a specific date.
 *
 * Uses createSelector for memoization to prevent unnecessary re-renders.
 * Only recomputes when tasks or taskIdsByDate for the given date changes.
 *
 * @param state - Redux state
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Record with priority letters as keys and sorted task arrays as values
 */
export const selectTasksByPriorityForDate = createSelector(
  [
    (state: RootState) => state.tasks.tasks,
    (state: RootState) => state.tasks.taskIdsByDate,
    (_state: RootState, date: string) => date,
  ],
  (tasks, taskIdsByDate, date): Record<string, Task[]> => {
    const taskIds = taskIdsByDate[date] || [];
    const dateTasks = taskIds
      .map((id) => tasks[id])
      .filter((task): task is Task => !!task);

    const grouped: Record<string, Task[]> = { A: [], B: [], C: [], D: [] };

    for (const task of dateTasks) {
      const letter = task.priority.letter;
      if (grouped[letter]) {
        grouped[letter].push(task);
      }
    }

    // Sort each group by priority number
    for (const letter of Object.keys(grouped)) {
      grouped[letter].sort((a, b) => a.priority.number - b.priority.number);
    }

    return grouped;
  }
);

/**
 * Select task count for a specific date
 */
export const selectTaskCountForDate = (state: RootState, date: string): number => {
  return (state.tasks.taskIdsByDate[date] || []).length;
};

/**
 * Select completed task count for a specific date
 */
export const selectCompletedTaskCountForDate = (state: RootState, date: string): number => {
  const tasks = selectTasksByDate(state, date);
  return tasks.filter((task) => task.status === 'complete').length;
};

/**
 * Select if tasks are loaded for a specific date
 */
export const selectTasksLoadedForDate = (state: RootState, date: string): boolean => {
  return date in state.tasks.taskIdsByDate;
};

/**
 * Select whether recurring parent tasks have been loaded
 */
export const selectRecurringTasksLoaded = (state: RootState): boolean =>
  state.tasks.recurringTasksLoaded ?? false;

/**
 * Select all recurring parent tasks
 */
export const selectRecurringParentTasks = (state: RootState): Record<string, Task> =>
  state.tasks.recurringParentTasks;

/**
 * Select filtered tasks for a specific date.
 *
 * Applies active filters (status, category, priority) with AND logic.
 * Filters combine: task must match ALL active filters.
 *
 * Uses createSelector for memoization to prevent unnecessary re-renders.
 *
 * @param state - Redux state
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Array of filtered tasks for the specified date
 */
export const selectFilteredTasks = createSelector(
  [
    // Input selectors
    (state: RootState, date: string) => selectTasksWithRecurringInstances(state, date),
    (state: RootState) => state.filters?.statusFilter || null,
    (state: RootState) => state.filters?.categoryFilter || null,
    (state: RootState) => state.filters?.priorityFilter || null,
  ],
  (tasks, statusFilter, categoryFilter, priorityFilter): Task[] => {
    // If no filters active, return all tasks
    const hasStatusFilter = statusFilter !== null && statusFilter.length > 0;
    const hasCategoryFilter = categoryFilter !== null && categoryFilter.length > 0;
    const hasPriorityFilter = priorityFilter !== null && priorityFilter.length > 0;

    if (!hasStatusFilter && !hasCategoryFilter && !hasPriorityFilter) {
      return tasks;
    }

    // Apply filters with AND logic
    return tasks.filter((task) => {
      // Status filter
      if (hasStatusFilter && !statusFilter.includes(task.status)) {
        return false;
      }

      // Category filter (include tasks with matching categoryId OR null if "None" is selected)
      if (hasCategoryFilter) {
        // Check if task's category is in the filter list
        // Also include tasks with null categoryId if NONE_CATEGORY_ID is in the filter
        const categoryMatch = task.categoryId
          ? categoryFilter.includes(task.categoryId)
          : categoryFilter.includes(NONE_CATEGORY_ID); // Special handling for uncategorized

        if (!categoryMatch) {
          return false;
        }
      }

      // Priority filter
      if (hasPriorityFilter && !priorityFilter.includes(task.priority.letter)) {
        return false;
      }

      // Task matches all active filters
      return true;
    });
  }
);

// =============================================================================
// Reducer Export
// =============================================================================

export default taskSlice.reducer;
