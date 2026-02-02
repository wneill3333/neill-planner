/**
 * Task Slice
 *
 * Redux Toolkit slice for task state management.
 * Handles normalized task storage, date-based indexing, and CRUD operations.
 */

import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { Task, SyncStatus, PriorityLetter } from '../../types';
import type { RootState } from '../../store';
import {
  fetchTasksByDate,
  createTask as createTaskThunk,
  updateTaskAsync,
  deleteTask,
  hardDeleteTask,
  restoreTask,
  batchUpdateTasksAsync,
  fetchTasksByDateRange,
  reorderTasks,
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
  /** Currently selected date (ISO date string) */
  selectedDate: string;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Sync status with backend */
  syncStatus: SyncStatus;
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
  selectedDate: getTodayString(),
  loading: false,
  error: null,
  syncStatus: 'synced',
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

// =============================================================================
// Reducer Export
// =============================================================================

export default taskSlice.reducer;
