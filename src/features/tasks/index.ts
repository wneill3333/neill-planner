/**
 * Tasks Feature Index
 *
 * Central export point for the tasks feature module.
 */

// Slice and reducer
export { default as taskReducer } from './taskSlice';

// Actions
export {
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
} from './taskSlice';

// Selectors
export {
  selectAllTasks,
  selectTaskById,
  selectTasksByDate,
  selectTasksForSelectedDate,
  selectSelectedDate,
  selectTasksLoading,
  selectTasksError,
  selectTasksSyncStatus,
  selectTasksByPriorityForDate,
  selectTaskCountForDate,
  selectCompletedTaskCountForDate,
  selectTasksLoadedForDate,
} from './taskSlice';

// Types
export type { TasksState, SetTasksPayload, UpdateTaskDatePayload } from './taskSlice';

// Async Thunks
export {
  fetchTasksByDate,
  createTask as createTaskAsync,
  updateTaskAsync,
  deleteTask,
  hardDeleteTask,
  restoreTask,
  batchUpdateTasksAsync,
  fetchTasksByDateRange,
} from './taskThunks';

// Thunk Types
export type {
  FetchTasksByDatePayload,
  CreateTaskPayload,
  ThunkError,
} from './taskThunks';
