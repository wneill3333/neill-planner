/**
 * Settings Slice
 *
 * Redux Toolkit slice for user settings state management.
 * Handles theme, font size, and other user preferences.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserSettings, ThemeOption, FontSizeOption, WeekStartDay, NotificationSettings } from '../../types';
import type { RootState } from '../../store';
import { fetchSettings, saveSettings } from './settingsThunks';
import { DEFAULT_USER_SETTINGS } from '../../types';

// =============================================================================
// Types
// =============================================================================

/**
 * State shape for the settings slice
 */
export interface SettingsState {
  /** Current user settings */
  settings: UserSettings | null;
  /** Loading state */
  loading: boolean;
  /** Saving state */
  saving: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether settings have been loaded */
  initialized: boolean;
}

// =============================================================================
// Initial State
// =============================================================================

export const initialState: SettingsState = {
  settings: null,
  loading: false,
  saving: false,
  error: null,
  initialized: false,
};

// =============================================================================
// Slice
// =============================================================================

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    /**
     * Set theme preference
     */
    setTheme: (state, action: PayloadAction<ThemeOption>) => {
      if (state.settings) {
        state.settings.theme = action.payload;
      }
    },

    /**
     * Set font size preference
     */
    setFontSize: (state, action: PayloadAction<FontSizeOption>) => {
      if (state.settings) {
        state.settings.fontSize = action.payload;
      }
    },

    /**
     * Set default priority letter
     */
    setDefaultPriority: (state, action: PayloadAction<'A' | 'B' | 'C' | 'D'>) => {
      if (state.settings) {
        state.settings.defaultPriorityLetter = action.payload;
      }
    },

    /**
     * Set default reminder minutes
     */
    setDefaultReminderMinutes: (state, action: PayloadAction<number>) => {
      if (state.settings) {
        state.settings.defaultReminderMinutes = action.payload;
      }
    },

    /**
     * Set timezone
     */
    setTimezone: (state, action: PayloadAction<string>) => {
      if (state.settings) {
        state.settings.timezone = action.payload;
      }
    },

    /**
     * Set week start day
     */
    setWeekStartsOn: (state, action: PayloadAction<WeekStartDay>) => {
      if (state.settings) {
        state.settings.weekStartsOn = action.payload;
      }
    },

    /**
     * Set notification preferences
     */
    setNotificationPreferences: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      if (state.settings) {
        state.settings.notifications = {
          ...state.settings.notifications,
          ...action.payload,
        };
      }
    },

    /**
     * Set Google Calendar sync enabled
     */
    setGoogleCalendarSyncEnabled: (state, action: PayloadAction<boolean>) => {
      if (state.settings) {
        state.settings.googleCalendarSyncEnabled = action.payload;
      }
    },

    /**
     * Update multiple settings at once
     */
    updateSettings: (state, action: PayloadAction<Partial<Omit<UserSettings, 'userId'>>>) => {
      if (state.settings) {
        Object.assign(state.settings, action.payload);
      }
    },

    /**
     * Clear settings (on logout)
     */
    clearSettings: (state) => {
      state.settings = null;
      state.initialized = false;
      state.error = null;
    },

    /**
     * Set error
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Settings
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
        state.initialized = true;
        state.error = null;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Save Settings
      .addCase(saveSettings.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.saving = false;
        state.settings = action.payload;
        state.error = null;
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

// =============================================================================
// Actions Export
// =============================================================================

export const {
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
} = settingsSlice.actions;

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select all settings
 */
export const selectSettings = (state: RootState): UserSettings | null =>
  state.settings.settings;

/**
 * Select theme preference
 */
export const selectTheme = (state: RootState): ThemeOption =>
  state.settings.settings?.theme ?? DEFAULT_USER_SETTINGS.theme;

/**
 * Select font size preference
 */
export const selectFontSize = (state: RootState): FontSizeOption =>
  state.settings.settings?.fontSize ?? DEFAULT_USER_SETTINGS.fontSize;

/**
 * Select default priority letter
 */
export const selectDefaultPriorityLetter = (state: RootState): 'A' | 'B' | 'C' | 'D' =>
  state.settings.settings?.defaultPriorityLetter ?? DEFAULT_USER_SETTINGS.defaultPriorityLetter;

/**
 * Select default reminder minutes
 */
export const selectDefaultReminderMinutes = (state: RootState): number =>
  state.settings.settings?.defaultReminderMinutes ?? DEFAULT_USER_SETTINGS.defaultReminderMinutes;

/**
 * Select timezone
 */
export const selectTimezone = (state: RootState): string =>
  state.settings.settings?.timezone ?? DEFAULT_USER_SETTINGS.timezone;

/**
 * Select week start day
 */
export const selectWeekStartsOn = (state: RootState): WeekStartDay =>
  state.settings.settings?.weekStartsOn ?? DEFAULT_USER_SETTINGS.weekStartsOn;

/**
 * Select notification preferences
 */
export const selectNotificationPreferences = (state: RootState): NotificationSettings =>
  state.settings.settings?.notifications ?? DEFAULT_USER_SETTINGS.notifications;

/**
 * Select Google Calendar sync enabled
 */
export const selectGoogleCalendarSyncEnabled = (state: RootState): boolean =>
  state.settings.settings?.googleCalendarSyncEnabled ?? DEFAULT_USER_SETTINGS.googleCalendarSyncEnabled;

/**
 * Select loading state
 */
export const selectSettingsLoading = (state: RootState): boolean =>
  state.settings.loading;

/**
 * Select saving state
 */
export const selectSettingsSaving = (state: RootState): boolean =>
  state.settings.saving;

/**
 * Select error
 */
export const selectSettingsError = (state: RootState): string | null =>
  state.settings.error;

/**
 * Select initialized state
 */
export const selectSettingsInitialized = (state: RootState): boolean =>
  state.settings.initialized;

// =============================================================================
// Reducer Export
// =============================================================================

export default settingsSlice.reducer;
