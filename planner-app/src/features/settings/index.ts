/**
 * Settings Feature Exports
 *
 * Central export point for settings-related functionality.
 */

// Components
export { SettingsPage } from './SettingsPage';

// Slice
export { default as settingsReducer } from './settingsSlice';

// Actions
export {
  setTheme,
  setFontSize,
  setDefaultPriority,
  setDefaultReminderMinutes,
  setTimezone,
  setWeekStartsOn,
  setNotificationPreferences,
  setGoogleCalendarSyncEnabled,
  updateSettings,
  clearSettings,
  setError,
} from './settingsSlice';

// Selectors
export {
  selectSettings,
  selectTheme,
  selectFontSize,
  selectDefaultPriorityLetter,
  selectDefaultReminderMinutes,
  selectTimezone,
  selectWeekStartsOn,
  selectNotificationPreferences,
  selectGoogleCalendarSyncEnabled,
  selectSettingsLoading,
  selectSettingsSaving,
  selectSettingsError,
  selectSettingsInitialized,
} from './settingsSlice';

// Thunks
export { fetchSettings, saveSettings } from './settingsThunks';

// Types
export type { SettingsState } from './settingsSlice';
