/**
 * Task Slice
 *
 * Redux Toolkit slice for task state management.
 * Handles normalized task storage, date-based indexing, and CRUD operations.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Task, SyncStatus } from '../../types';
import type { RootState } from '../../store';

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
     */
    reorderTasksLocal: (
      state,
      action: PayloadAction<{ taskIds: string[]; priorityLetter: string }>
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
 * Select tasks for a specific date
 */
export const selectTasksByDate = (state: RootState, date: string): Task[] => {
  const taskIds = state.tasks.taskIdsByDate[date] || [];
  return taskIds.map((id) => state.tasks.tasks[id]).filter((task): task is Task => !!task);
};

/**
 * Select tasks for the currently selected date
 */
export const selectTasksForSelectedDate = (state: RootState): Task[] => {
  const { selectedDate, taskIdsByDate, tasks } = state.tasks;
  const taskIds = taskIdsByDate[selectedDate] || [];
  return taskIds.map((id) => tasks[id]).filter((task): task is Task => !!task);
};

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
 * Select tasks grouped by priority letter for a specific date
 */
export const selectTasksByPriorityForDate = (
  state: RootState,
  date: string
): Record<string, Task[]> => {
  const tasks = selectTasksByDate(state, date);
  const grouped: Record<string, Task[]> = { A: [], B: [], C: [], D: [] };

  for (const task of tasks) {
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
};

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
