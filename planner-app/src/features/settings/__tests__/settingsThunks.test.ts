/**
 * Settings Thunks Tests
 *
 * Test suite for settings async operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSettings, saveSettings } from '../settingsThunks';
import * as usersService from '../../../services/firebase/users.service';
import type { UserSettings } from '../../../types';
import { DEFAULT_USER_SETTINGS } from '../../../types';

// =============================================================================
// Mocks
// =============================================================================

vi.mock('../../../services/firebase/users.service');

// =============================================================================
// Test Data
// =============================================================================

const mockUserId = 'test-user-123';

const mockSettings: UserSettings = {
  userId: mockUserId,
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

// =============================================================================
// Tests
// =============================================================================

describe('settingsThunks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchSettings', () => {
    it('should fetch settings successfully', async () => {
      vi.spyOn(usersService, 'getUserSettings').mockResolvedValue(mockSettings);

      const result = await fetchSettings(mockUserId)(
        vi.fn(),
        vi.fn(),
        undefined
      );

      expect(usersService.getUserSettings).toHaveBeenCalledWith(mockUserId);
      expect(result.type).toBe('settings/fetchSettings/fulfilled');
      expect(result.payload).toEqual(mockSettings);
    });

    it('should return defaults when no settings found', async () => {
      vi.spyOn(usersService, 'getUserSettings').mockResolvedValue(null);

      const result = await fetchSettings(mockUserId)(
        vi.fn(),
        vi.fn(),
        undefined
      );

      expect(result.type).toBe('settings/fetchSettings/fulfilled');
      expect(result.payload).toEqual({
        ...DEFAULT_USER_SETTINGS,
        userId: mockUserId,
      });
    });

    it('should handle errors', async () => {
      const errorMessage = 'Failed to fetch settings';
      vi.spyOn(usersService, 'getUserSettings').mockRejectedValue(new Error(errorMessage));

      const result = await fetchSettings(mockUserId)(
        vi.fn(),
        vi.fn(),
        undefined
      );

      expect(result.type).toBe('settings/fetchSettings/rejected');
      expect(result.payload).toBe(errorMessage);
    });

    it('should handle non-Error rejections', async () => {
      vi.spyOn(usersService, 'getUserSettings').mockRejectedValue('string error');

      const result = await fetchSettings(mockUserId)(
        vi.fn(),
        vi.fn(),
        undefined
      );

      expect(result.type).toBe('settings/fetchSettings/rejected');
      expect(result.payload).toBe('Failed to fetch settings');
    });
  });

  describe('saveSettings', () => {
    it('should save settings successfully', async () => {
      const updates = {
        theme: 'light' as const,
        fontSize: 'medium' as const,
      };

      const updatedSettings = {
        ...mockSettings,
        ...updates,
      };

      vi.spyOn(usersService, 'updateUserSettings').mockResolvedValue(updatedSettings);

      const result = await saveSettings({ userId: mockUserId, updates })(
        vi.fn(),
        vi.fn(),
        undefined
      );

      expect(usersService.updateUserSettings).toHaveBeenCalledWith(mockUserId, updates);
      expect(result.type).toBe('settings/saveSettings/fulfilled');
      expect(result.payload).toEqual(updatedSettings);
    });

    it('should save notification preferences', async () => {
      const updates = {
        notifications: {
          push: false,
          email: false,
        },
      };

      const updatedSettings = {
        ...mockSettings,
        notifications: {
          ...mockSettings.notifications,
          ...updates.notifications,
        },
      };

      vi.spyOn(usersService, 'updateUserSettings').mockResolvedValue(updatedSettings);

      const result = await saveSettings({ userId: mockUserId, updates })(
        vi.fn(),
        vi.fn(),
        undefined
      );

      expect(result.type).toBe('settings/saveSettings/fulfilled');
      expect(result.payload.notifications.push).toBe(false);
      expect(result.payload.notifications.email).toBe(false);
    });

    it('should handle errors', async () => {
      const errorMessage = 'Failed to save settings';
      const updates = { theme: 'light' as const };

      vi.spyOn(usersService, 'updateUserSettings').mockRejectedValue(new Error(errorMessage));

      const result = await saveSettings({ userId: mockUserId, updates })(
        vi.fn(),
        vi.fn(),
        undefined
      );

      expect(result.type).toBe('settings/saveSettings/rejected');
      expect(result.payload).toBe(errorMessage);
    });

    it('should handle non-Error rejections', async () => {
      const updates = { theme: 'light' as const };

      vi.spyOn(usersService, 'updateUserSettings').mockRejectedValue('string error');

      const result = await saveSettings({ userId: mockUserId, updates })(
        vi.fn(),
        vi.fn(),
        undefined
      );

      expect(result.type).toBe('settings/saveSettings/rejected');
      expect(result.payload).toBe('Failed to save settings');
    });
  });
});
