/**
 * Settings Slice Tests
 *
 * Test suite for settings Redux slice.
 */

import { describe, it, expect } from 'vitest';
import settingsReducer, {
  initialState,
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
  type SettingsState,
} from '../settingsSlice';
import { fetchSettings, saveSettings } from '../settingsThunks';
import type { UserSettings } from '../../../types';
import { DEFAULT_USER_SETTINGS } from '../../../types';

// =============================================================================
// Test Data
// =============================================================================

const mockSettings: UserSettings = {
  userId: 'test-user-123',
  theme: 'dark',
  fontSize: 'large',
  defaultPriorityLetter: 'A',
  defaultReminderMinutes: 30,
  timezone: 'America/Los_Angeles',
  weekStartsOn: 1,
  notifications: {
    push: true,
    email: true,
    inApp: false,
  },
  googleCalendarSyncEnabled: true,
  platform: 'web',
};

const createMockState = (overrides?: Partial<SettingsState>): SettingsState => ({
  ...initialState,
  ...overrides,
});

// =============================================================================
// Reducer Tests
// =============================================================================

describe('settingsSlice - reducers', () => {
  it('should return initial state', () => {
    expect(settingsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setTheme', () => {
    it('should set theme when settings exist', () => {
      const state = createMockState({ settings: mockSettings });
      const result = settingsReducer(state, setTheme('light'));
      expect(result.settings?.theme).toBe('light');
    });

    it('should not error when settings is null', () => {
      const state = createMockState({ settings: null });
      const result = settingsReducer(state, setTheme('light'));
      expect(result.settings).toBeNull();
    });
  });

  describe('setFontSize', () => {
    it('should set font size when settings exist', () => {
      const state = createMockState({ settings: mockSettings });
      const result = settingsReducer(state, setFontSize('small'));
      expect(result.settings?.fontSize).toBe('small');
    });

    it('should not error when settings is null', () => {
      const state = createMockState({ settings: null });
      const result = settingsReducer(state, setFontSize('small'));
      expect(result.settings).toBeNull();
    });
  });

  describe('setDefaultPriority', () => {
    it('should set default priority letter', () => {
      const state = createMockState({ settings: mockSettings });
      const result = settingsReducer(state, setDefaultPriority('C'));
      expect(result.settings?.defaultPriorityLetter).toBe('C');
    });
  });

  describe('setDefaultReminderMinutes', () => {
    it('should set default reminder minutes', () => {
      const state = createMockState({ settings: mockSettings });
      const result = settingsReducer(state, setDefaultReminderMinutes(60));
      expect(result.settings?.defaultReminderMinutes).toBe(60);
    });
  });

  describe('setTimezone', () => {
    it('should set timezone', () => {
      const state = createMockState({ settings: mockSettings });
      const result = settingsReducer(state, setTimezone('Europe/London'));
      expect(result.settings?.timezone).toBe('Europe/London');
    });
  });

  describe('setWeekStartsOn', () => {
    it('should set week starts on', () => {
      const state = createMockState({ settings: mockSettings });
      const result = settingsReducer(state, setWeekStartsOn(0));
      expect(result.settings?.weekStartsOn).toBe(0);
    });
  });

  describe('setNotificationPreferences', () => {
    it('should merge notification preferences', () => {
      const state = createMockState({ settings: mockSettings });
      const result = settingsReducer(state, setNotificationPreferences({ push: false }));
      expect(result.settings?.notifications).toEqual({
        push: false,
        email: true,
        inApp: false,
      });
    });

    it('should update multiple notification preferences', () => {
      const state = createMockState({ settings: mockSettings });
      const result = settingsReducer(state, setNotificationPreferences({ push: false, email: false }));
      expect(result.settings?.notifications).toEqual({
        push: false,
        email: false,
        inApp: false,
      });
    });
  });

  describe('setGoogleCalendarSyncEnabled', () => {
    it('should set Google Calendar sync enabled', () => {
      const state = createMockState({ settings: mockSettings });
      const result = settingsReducer(state, setGoogleCalendarSyncEnabled(false));
      expect(result.settings?.googleCalendarSyncEnabled).toBe(false);
    });
  });

  describe('updateSettings', () => {
    it('should update multiple settings at once', () => {
      const state = createMockState({ settings: mockSettings });
      const result = settingsReducer(state, updateSettings({
        theme: 'light',
        fontSize: 'medium',
        defaultPriorityLetter: 'B',
      }));
      expect(result.settings?.theme).toBe('light');
      expect(result.settings?.fontSize).toBe('medium');
      expect(result.settings?.defaultPriorityLetter).toBe('B');
      // Other settings should remain unchanged
      expect(result.settings?.timezone).toBe(mockSettings.timezone);
    });
  });

  describe('clearSettings', () => {
    it('should clear settings and reset initialized state', () => {
      const state = createMockState({
        settings: mockSettings,
        initialized: true,
        error: 'some error',
      });
      const result = settingsReducer(state, clearSettings());
      expect(result.settings).toBeNull();
      expect(result.initialized).toBe(false);
      expect(result.error).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const result = settingsReducer(initialState, setError('Test error'));
      expect(result.error).toBe('Test error');
    });

    it('should clear error message', () => {
      const state = createMockState({ error: 'existing error' });
      const result = settingsReducer(state, setError(null));
      expect(result.error).toBeNull();
    });
  });
});

// =============================================================================
// Async Thunk Tests
// =============================================================================

describe('settingsSlice - async thunks', () => {
  describe('fetchSettings', () => {
    it('should handle pending state', () => {
      const action = { type: fetchSettings.pending.type };
      const result = settingsReducer(initialState, action);
      expect(result.loading).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const action = { type: fetchSettings.fulfilled.type, payload: mockSettings };
      const result = settingsReducer(initialState, action);
      expect(result.loading).toBe(false);
      expect(result.settings).toEqual(mockSettings);
      expect(result.initialized).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle rejected state', () => {
      const action = { type: fetchSettings.rejected.type, payload: 'Failed to fetch settings' };
      const result = settingsReducer(initialState, action);
      expect(result.loading).toBe(false);
      expect(result.error).toBe('Failed to fetch settings');
    });
  });

  describe('saveSettings', () => {
    it('should handle pending state', () => {
      const action = { type: saveSettings.pending.type };
      const result = settingsReducer(initialState, action);
      expect(result.saving).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const updatedSettings = { ...mockSettings, theme: 'light' as const };
      const action = { type: saveSettings.fulfilled.type, payload: updatedSettings };
      const result = settingsReducer(initialState, action);
      expect(result.saving).toBe(false);
      expect(result.settings).toEqual(updatedSettings);
      expect(result.error).toBeNull();
    });

    it('should handle rejected state', () => {
      const action = { type: saveSettings.rejected.type, payload: 'Failed to save settings' };
      const result = settingsReducer(initialState, action);
      expect(result.saving).toBe(false);
      expect(result.error).toBe('Failed to save settings');
    });
  });
});

// =============================================================================
// Selector Tests
// =============================================================================

describe('settingsSlice - selectors', () => {
  const mockRootState = {
    settings: createMockState({ settings: mockSettings }),
  } as any;

  const nullSettingsState = {
    settings: createMockState({ settings: null }),
  } as any;

  describe('selectSettings', () => {
    it('should select settings', () => {
      expect(selectSettings(mockRootState)).toEqual(mockSettings);
    });

    it('should return null when settings is null', () => {
      expect(selectSettings(nullSettingsState)).toBeNull();
    });
  });

  describe('selectTheme', () => {
    it('should select theme', () => {
      expect(selectTheme(mockRootState)).toBe('dark');
    });

    it('should return default when settings is null', () => {
      expect(selectTheme(nullSettingsState)).toBe(DEFAULT_USER_SETTINGS.theme);
    });
  });

  describe('selectFontSize', () => {
    it('should select font size', () => {
      expect(selectFontSize(mockRootState)).toBe('large');
    });

    it('should return default when settings is null', () => {
      expect(selectFontSize(nullSettingsState)).toBe(DEFAULT_USER_SETTINGS.fontSize);
    });
  });

  describe('selectDefaultPriorityLetter', () => {
    it('should select default priority letter', () => {
      expect(selectDefaultPriorityLetter(mockRootState)).toBe('A');
    });

    it('should return default when settings is null', () => {
      expect(selectDefaultPriorityLetter(nullSettingsState)).toBe(DEFAULT_USER_SETTINGS.defaultPriorityLetter);
    });
  });

  describe('selectDefaultReminderMinutes', () => {
    it('should select default reminder minutes', () => {
      expect(selectDefaultReminderMinutes(mockRootState)).toBe(30);
    });

    it('should return default when settings is null', () => {
      expect(selectDefaultReminderMinutes(nullSettingsState)).toBe(DEFAULT_USER_SETTINGS.defaultReminderMinutes);
    });
  });

  describe('selectTimezone', () => {
    it('should select timezone', () => {
      expect(selectTimezone(mockRootState)).toBe('America/Los_Angeles');
    });

    it('should return default when settings is null', () => {
      expect(selectTimezone(nullSettingsState)).toBe(DEFAULT_USER_SETTINGS.timezone);
    });
  });

  describe('selectWeekStartsOn', () => {
    it('should select week starts on', () => {
      expect(selectWeekStartsOn(mockRootState)).toBe(1);
    });

    it('should return default when settings is null', () => {
      expect(selectWeekStartsOn(nullSettingsState)).toBe(DEFAULT_USER_SETTINGS.weekStartsOn);
    });
  });

  describe('selectNotificationPreferences', () => {
    it('should select notification preferences', () => {
      expect(selectNotificationPreferences(mockRootState)).toEqual(mockSettings.notifications);
    });

    it('should return default when settings is null', () => {
      expect(selectNotificationPreferences(nullSettingsState)).toEqual(DEFAULT_USER_SETTINGS.notifications);
    });
  });

  describe('selectGoogleCalendarSyncEnabled', () => {
    it('should select Google Calendar sync enabled', () => {
      expect(selectGoogleCalendarSyncEnabled(mockRootState)).toBe(true);
    });

    it('should return default when settings is null', () => {
      expect(selectGoogleCalendarSyncEnabled(nullSettingsState)).toBe(DEFAULT_USER_SETTINGS.googleCalendarSyncEnabled);
    });
  });

  describe('selectSettingsLoading', () => {
    it('should select loading state', () => {
      const state = { settings: createMockState({ loading: true }) } as any;
      expect(selectSettingsLoading(state)).toBe(true);
    });
  });

  describe('selectSettingsSaving', () => {
    it('should select saving state', () => {
      const state = { settings: createMockState({ saving: true }) } as any;
      expect(selectSettingsSaving(state)).toBe(true);
    });
  });

  describe('selectSettingsError', () => {
    it('should select error', () => {
      const state = { settings: createMockState({ error: 'Test error' }) } as any;
      expect(selectSettingsError(state)).toBe('Test error');
    });
  });

  describe('selectSettingsInitialized', () => {
    it('should select initialized state', () => {
      const state = { settings: createMockState({ initialized: true }) } as any;
      expect(selectSettingsInitialized(state)).toBe(true);
    });
  });
});
