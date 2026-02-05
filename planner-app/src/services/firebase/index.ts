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

// User service functions
export {
  getUser,
  createUser,
  updateLastLogin,
  getUserSettings,
  updateUserSettings,
  getOrCreateUser,
  type FirebaseUser,
} from './users.service';

// Category service functions
export {
  createCategory,
  getCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  getCategoryCount,
  categoryNameExists,
} from './categories.service';

// Event service functions
export {
  createEvent,
  getEvent,
  getUserEvents,
  getEventsByDate,
  getEventsByDateRange,
  updateEvent,
  deleteEvent,
  hardDeleteEvent,
  restoreEvent,
  getRecurringEvents,
  getAllEventsForUser,
} from './events.service';

// Note service functions
export {
  createNote,
  getNote,
  getNotesByDate,
  getNotesByDateRange,
  getUserNotes,
  updateNote,
  softDeleteNote,
  hardDeleteNote,
  restoreNote,
} from './notes.service';

// Reminder service functions
export {
  createReminder,
  getReminder,
  getRemindersForTask,
  getRemindersForEvent,
  getRemindersForItem,
  getPendingReminders,
  getUserReminders,
  updateReminder,
  deleteReminder,
  snoozeReminder,
  dismissReminder,
  markReminderTriggered,
} from './reminders.service';

// Recurring pattern service functions (new materialized instance system)
export {
  createRecurringPattern,
  getRecurringPattern,
  getRecurringPatterns,
  updateRecurringPattern,
  deleteRecurringPattern,
  ensureInstancesForDate,
  handleAfterCompletionComplete,
  getInstancesForPattern,
  generateInstancesForPattern,
  // Migration functions
  migrateLegacyRecurringTask,
  migrateAllLegacyRecurringTasks,
  type MigrationResult,
} from './patterns.service';
