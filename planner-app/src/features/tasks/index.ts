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
  reorderTasks,
  forwardTaskAsync,
} from './taskThunks';

// Thunk Types
export type {
  FetchTasksByDatePayload,
  CreateTaskPayload,
  ReorderTasksPayload,
  ReorderTasksResult,
  ForwardTaskPayload,
  ForwardTaskResult,
  ThunkError,
} from './taskThunks';

// Hooks
export { useTasksByDate, useSelectedDateTasks } from './hooks';
export type { UseTasksByDateResult, UseSelectedDateTasksResult } from './hooks';

// Container Components
export { TaskListContainer, type TaskListContainerProps } from './TaskListContainer';
export { DateNavigationContainer, type DateNavigationContainerProps } from './DateNavigationContainer';
export { FlatTaskListContainer, type FlatTaskListContainerProps } from './FlatTaskListContainer';

// Page Components
export { CreateTaskModal, type CreateTaskModalProps } from './CreateTaskModal';
export { EditTaskModal, type EditTaskModalProps } from './EditTaskModal';
export { TasksPage, type TasksPageProps } from './TasksPage';

// Redesigned Components
export { DailyViewRedesign, type DailyViewRedesignProps } from './DailyViewRedesign';
