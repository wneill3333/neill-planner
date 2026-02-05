/**
 * Reminders Feature Index
 *
 * Central export point for reminder-related functionality.
 */

// Slice exports
export {
  reminderSlice,
  // Actions
  setReminders,
  addReminder,
  updateReminder,
  removeReminder,
  setPermissionStatus,
  setDeviceToken,
  addActiveNotification,
  removeActiveNotification,
  clearActiveNotifications,
  dismissActiveNotification,
  setLoading,
  setError,
  setSyncStatus,
  clearReminders,
  // Selectors
  selectAllReminders,
  selectReminderById,
  selectRemindersForTask,
  selectRemindersForEvent,
  selectPendingReminders,
  selectActiveNotifications,
  selectUndismissedNotifications,
  selectPermissionStatus,
  selectDeviceToken,
  selectIsRegistered,
  selectRemindersLoading,
  selectRemindersError,
  selectRemindersSyncStatus,
  selectNotificationCount,
  // Types
  type RemindersState,
} from './reminderSlice';

// Thunk exports
export {
  fetchUserReminders,
  fetchRemindersForItem,
  createReminderAsync,
  updateReminderAsync,
  deleteReminderAsync,
  snoozeReminderAsync,
  dismissReminderAsync,
  requestPermissionAsync,
  registerDeviceAsync,
  unregisterDeviceAsync,
  checkPermissionStatus,
  fetchPendingReminders,
  type ThunkError,
  type RegisterDeviceResult,
} from './reminderThunks';

// Reducer export
export { default as reminderReducer } from './reminderSlice';
