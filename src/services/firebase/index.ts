/**
 * Firebase Services Index
 *
 * Central export point for all Firebase services.
 * Import from this file rather than individual service files.
 */

// Core Firebase instances
export { app, auth, db, firebaseConfig } from './config';

// Task service functions
export {
  createTask,
  getTask,
  getTasksByDate,
  getTasksByDateRange,
  updateTask,
  softDeleteTask,
  hardDeleteTask,
  restoreTask,
  batchUpdateTasks,
  getAllTasksForUser,
} from './tasks.service';
