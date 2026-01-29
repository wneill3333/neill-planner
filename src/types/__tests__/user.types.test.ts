import { describe, it, expect } from 'vitest';
import {
  USER_ROLE_LABELS,
  DEFAULT_USER_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  THEME_OPTIONS,
  FONT_SIZE_OPTIONS,
  WEEK_START_OPTIONS,
} from '../user.types';
import type {
  UserRole,
  User,
  ThemeOption,
  FontSizeOption,
  WeekStartDay,
  PlatformType,
  NotificationSettings,
  UserSettings,
  UpdateUserInput,
  UpdateUserSettingsInput,
} from '../user.types';

describe('User Types', () => {
  // ===========================================================================
  // Role Types Tests
  // ===========================================================================
  describe('UserRole', () => {
    it('should accept valid roles', () => {
      const validRoles: UserRole[] = ['admin', 'standard'];
      expect(validRoles).toHaveLength(2);
    });

    it('should have labels for all roles', () => {
      expect(USER_ROLE_LABELS.admin).toBe('Administrator');
      expect(USER_ROLE_LABELS.standard).toBe('Standard User');
    });
  });

  // ===========================================================================
  // User Interface Tests
  // ===========================================================================
  describe('User', () => {
    const createValidUser = (): User => ({
      id: 'user-123',
      email: 'user@example.com',
      displayName: 'John Doe',
      role: 'standard',
      googleCalendarConnected: false,
      createdAt: new Date('2026-01-01'),
      lastLoginAt: new Date(),
    });

    it('should create a valid user with all fields', () => {
      const user = createValidUser();
      expect(user.id).toBe('user-123');
      expect(user.email).toBe('user@example.com');
      expect(user.displayName).toBe('John Doe');
      expect(user.role).toBe('standard');
    });

    it('should support admin role', () => {
      const user: User = {
        ...createValidUser(),
        role: 'admin',
      };
      expect(user.role).toBe('admin');
    });

    it('should track Google Calendar connection status', () => {
      const user: User = {
        ...createValidUser(),
        googleCalendarConnected: true,
      };
      expect(user.googleCalendarConnected).toBe(true);
    });

    it('should have timestamp fields', () => {
      const user = createValidUser();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.lastLoginAt).toBeInstanceOf(Date);
    });
  });

  // ===========================================================================
  // Settings Types Tests
  // ===========================================================================
  describe('ThemeOption', () => {
    it('should accept valid theme options', () => {
      const themes: ThemeOption[] = ['light', 'dark', 'system'];
      expect(themes).toHaveLength(3);
    });

    it('should have UI options for all themes', () => {
      expect(THEME_OPTIONS).toHaveLength(3);
      expect(THEME_OPTIONS.map(o => o.value)).toEqual(['light', 'dark', 'system']);
    });
  });

  describe('FontSizeOption', () => {
    it('should accept valid font size options', () => {
      const sizes: FontSizeOption[] = ['small', 'medium', 'large'];
      expect(sizes).toHaveLength(3);
    });

    it('should have UI options for all sizes', () => {
      expect(FONT_SIZE_OPTIONS).toHaveLength(3);
      expect(FONT_SIZE_OPTIONS.map(o => o.value)).toEqual(['small', 'medium', 'large']);
    });
  });

  describe('WeekStartDay', () => {
    it('should accept valid week start days', () => {
      const days: WeekStartDay[] = [0, 1];
      expect(days).toHaveLength(2);
    });

    it('should have UI options for week start', () => {
      expect(WEEK_START_OPTIONS).toHaveLength(2);
      expect(WEEK_START_OPTIONS[0]).toEqual({ value: 0, label: 'Sunday' });
      expect(WEEK_START_OPTIONS[1]).toEqual({ value: 1, label: 'Monday' });
    });
  });

  describe('PlatformType', () => {
    it('should accept valid platform types', () => {
      const platforms: PlatformType[] = ['desktop', 'android', 'web'];
      expect(platforms).toHaveLength(3);
    });
  });

  describe('NotificationSettings', () => {
    it('should have all notification channels', () => {
      const settings: NotificationSettings = {
        push: true,
        email: false,
        inApp: true,
      };
      expect(settings.push).toBe(true);
      expect(settings.email).toBe(false);
      expect(settings.inApp).toBe(true);
    });

    it('should have sensible defaults', () => {
      expect(DEFAULT_NOTIFICATION_SETTINGS.push).toBe(true);
      expect(DEFAULT_NOTIFICATION_SETTINGS.email).toBe(false);
      expect(DEFAULT_NOTIFICATION_SETTINGS.inApp).toBe(true);
    });
  });

  describe('UserSettings', () => {
    const createValidSettings = (): UserSettings => ({
      userId: 'user-123',
      theme: 'system',
      fontSize: 'medium',
      defaultPriorityLetter: 'B',
      defaultReminderMinutes: 15,
      timezone: 'America/New_York',
      weekStartsOn: 0,
      notifications: {
        push: true,
        email: false,
        inApp: true,
      },
      googleCalendarSyncEnabled: false,
      platform: 'web',
    });

    it('should create valid settings with all fields', () => {
      const settings = createValidSettings();
      expect(settings.userId).toBe('user-123');
      expect(settings.theme).toBe('system');
      expect(settings.fontSize).toBe('medium');
    });

    it('should support all priority letters as default', () => {
      const priorities: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
      priorities.forEach(letter => {
        const settings: UserSettings = {
          ...createValidSettings(),
          defaultPriorityLetter: letter,
        };
        expect(settings.defaultPriorityLetter).toBe(letter);
      });
    });

    it('should support different reminder times', () => {
      const settings: UserSettings = {
        ...createValidSettings(),
        defaultReminderMinutes: 30,
      };
      expect(settings.defaultReminderMinutes).toBe(30);
    });

    it('should support IANA timezone strings', () => {
      const settings: UserSettings = {
        ...createValidSettings(),
        timezone: 'Europe/London',
      };
      expect(settings.timezone).toBe('Europe/London');
    });

    it('should support week starting on Monday', () => {
      const settings: UserSettings = {
        ...createValidSettings(),
        weekStartsOn: 1,
      };
      expect(settings.weekStartsOn).toBe(1);
    });

    it('should support Google Calendar sync', () => {
      const settings: UserSettings = {
        ...createValidSettings(),
        googleCalendarSyncEnabled: true,
      };
      expect(settings.googleCalendarSyncEnabled).toBe(true);
    });

    it('should support all platforms', () => {
      const platforms: PlatformType[] = ['desktop', 'android', 'web'];
      platforms.forEach(platform => {
        const settings: UserSettings = {
          ...createValidSettings(),
          platform,
        };
        expect(settings.platform).toBe(platform);
      });
    });
  });

  // ===========================================================================
  // Input Types Tests
  // ===========================================================================
  describe('UpdateUserInput', () => {
    it('should allow updating displayName', () => {
      const input: UpdateUserInput = {
        displayName: 'Jane Doe',
      };
      expect(input.displayName).toBe('Jane Doe');
    });

    it('should allow updating role', () => {
      const input: UpdateUserInput = {
        role: 'admin',
      };
      expect(input.role).toBe('admin');
    });

    it('should allow partial updates', () => {
      const input: UpdateUserInput = {};
      expect(Object.keys(input)).toHaveLength(0);
    });
  });

  describe('UpdateUserSettingsInput', () => {
    it('should allow updating single setting', () => {
      const input: UpdateUserSettingsInput = {
        theme: 'dark',
      };
      expect(input.theme).toBe('dark');
    });

    it('should allow updating multiple settings', () => {
      const input: UpdateUserSettingsInput = {
        theme: 'light',
        fontSize: 'large',
        weekStartsOn: 1,
      };
      expect(input.theme).toBe('light');
      expect(input.fontSize).toBe('large');
      expect(input.weekStartsOn).toBe(1);
    });

    it('should allow partial notification updates', () => {
      const input: UpdateUserSettingsInput = {
        notifications: {
          email: true,
        },
      };
      expect(input.notifications?.email).toBe(true);
      expect(input.notifications?.push).toBeUndefined();
    });
  });

  // ===========================================================================
  // Default Values Tests
  // ===========================================================================
  describe('DEFAULT_USER_SETTINGS', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_USER_SETTINGS.theme).toBe('system');
      expect(DEFAULT_USER_SETTINGS.fontSize).toBe('medium');
      expect(DEFAULT_USER_SETTINGS.defaultPriorityLetter).toBe('B');
      expect(DEFAULT_USER_SETTINGS.defaultReminderMinutes).toBe(15);
      expect(DEFAULT_USER_SETTINGS.weekStartsOn).toBe(0);
      expect(DEFAULT_USER_SETTINGS.googleCalendarSyncEnabled).toBe(false);
      expect(DEFAULT_USER_SETTINGS.platform).toBe('web');
    });

    it('should have a valid timezone', () => {
      expect(DEFAULT_USER_SETTINGS.timezone).toBeDefined();
      expect(typeof DEFAULT_USER_SETTINGS.timezone).toBe('string');
    });

    it('should have default notification settings', () => {
      expect(DEFAULT_USER_SETTINGS.notifications.push).toBe(true);
      expect(DEFAULT_USER_SETTINGS.notifications.email).toBe(false);
      expect(DEFAULT_USER_SETTINGS.notifications.inApp).toBe(true);
    });
  });
});
