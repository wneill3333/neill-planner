/**
 * Settings Thunks
 *
 * Async operations for settings management.
 * Handles fetching and saving user settings to Firestore.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { getUserSettings, updateUserSettings } from '../../services/firebase/users.service';
import type { UserSettings, UpdateUserSettingsInput } from '../../types';
import { DEFAULT_USER_SETTINGS } from '../../types';

// =============================================================================
// Thunks
// =============================================================================

/**
 * Fetch user settings from Firestore
 */
export const fetchSettings = createAsyncThunk<
  UserSettings,
  string,
  { rejectValue: string }
>(
  'settings/fetchSettings',
  async (userId: string, { rejectWithValue }) => {
    try {
      const settings = await getUserSettings(userId);

      // If no settings found, return defaults with userId
      if (!settings) {
        return {
          ...DEFAULT_USER_SETTINGS,
          userId,
        };
      }

      return settings;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch settings';
      return rejectWithValue(message);
    }
  }
);

/**
 * Save user settings to Firestore
 */
export const saveSettings = createAsyncThunk<
  UserSettings,
  { userId: string; updates: UpdateUserSettingsInput },
  { rejectValue: string }
>(
  'settings/saveSettings',
  async ({ userId, updates }, { rejectWithValue }) => {
    try {
      const updatedSettings = await updateUserSettings(userId, updates);
      return updatedSettings;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save settings';
      return rejectWithValue(message);
    }
  }
);
