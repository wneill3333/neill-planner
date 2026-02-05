import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UserSettings } from '../../../types';
import { DEFAULT_USER_SETTINGS } from '../../../types';

// Mock Firestore
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000 }),
  },
}));

vi.mock('../config', () => ({
  db: { name: 'mock-db' },
}));

describe('Users Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue('user-doc-ref');
    mockSetDoc.mockResolvedValue(undefined);
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  describe('getUser', () => {
    it('should return user when found', async () => {
      const { getUser } = await import('../users.service');

      const mockUserData = {
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'standard',
        googleCalendarConnected: false,
        createdAt: { toDate: () => new Date('2026-01-01') },
        lastLoginAt: { toDate: () => new Date('2026-01-25') },
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'user-123',
        data: () => mockUserData,
      });

      const result = await getUser('user-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('user-123');
      expect(result?.email).toBe('test@example.com');
      expect(result?.displayName).toBe('Test User');
      expect(result?.role).toBe('standard');
    });

    it('should return null when user not found', async () => {
      const { getUser } = await import('../users.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getUser('non-existent');

      expect(result).toBeNull();
    });

    it('should handle missing googleCalendarConnected field', async () => {
      const { getUser } = await import('../users.service');

      const mockUserData = {
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'standard',
        // googleCalendarConnected is missing
        createdAt: { toDate: () => new Date() },
        lastLoginAt: { toDate: () => new Date() },
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'user-123',
        data: () => mockUserData,
      });

      const result = await getUser('user-123');

      expect(result?.googleCalendarConnected).toBe(false);
    });
  });

  describe('createUser', () => {
    it('should create user with correct defaults', async () => {
      const { createUser } = await import('../users.service');

      const firebaseUser = {
        uid: 'firebase-123',
        email: 'new@example.com',
        displayName: 'New User',
      };

      const result = await createUser(firebaseUser);

      expect(mockSetDoc).toHaveBeenCalledTimes(2); // User and settings
      expect(result.id).toBe('firebase-123');
      expect(result.email).toBe('new@example.com');
      expect(result.displayName).toBe('New User');
      expect(result.role).toBe('standard'); // Default role
      expect(result.googleCalendarConnected).toBe(false);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.lastLoginAt).toBeInstanceOf(Date);
    });

    it('should use email as displayName if displayName is null', async () => {
      const { createUser } = await import('../users.service');

      const firebaseUser = {
        uid: 'firebase-123',
        email: 'user@example.com',
        displayName: null,
      };

      const result = await createUser(firebaseUser);

      expect(result.displayName).toBe('user@example.com');
    });

    it('should use "User" as displayName if both are null', async () => {
      const { createUser } = await import('../users.service');

      const firebaseUser = {
        uid: 'firebase-123',
        email: null,
        displayName: null,
      };

      const result = await createUser(firebaseUser);

      expect(result.displayName).toBe('User');
      expect(result.email).toBe('');
    });

    it('should create default settings for new user', async () => {
      const { createUser } = await import('../users.service');

      const firebaseUser = {
        uid: 'firebase-123',
        email: 'new@example.com',
        displayName: 'New User',
      };

      await createUser(firebaseUser);

      // Should have called setDoc twice - once for user, once for settings
      expect(mockSetDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateLastLogin', () => {
    it('should update lastLoginAt timestamp', async () => {
      const { updateLastLogin } = await import('../users.service');

      await updateLastLogin('user-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls[0];
      expect(updateCall[1]).toHaveProperty('lastLoginAt');
    });
  });

  describe('getUserSettings', () => {
    it('should return settings when found', async () => {
      const { getUserSettings } = await import('../users.service');

      const mockSettingsData = {
        userId: 'user-123',
        theme: 'dark',
        fontSize: 'large',
        defaultPriorityLetter: 'A',
        defaultReminderMinutes: 30,
        timezone: 'America/New_York',
        weekStartsOn: 1,
        notifications: { push: true, email: true, inApp: false },
        googleCalendarSyncEnabled: true,
        platform: 'desktop',
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockSettingsData,
      });

      const result = await getUserSettings('user-123');

      expect(result).not.toBeNull();
      expect(result?.theme).toBe('dark');
      expect(result?.fontSize).toBe('large');
      expect(result?.defaultPriorityLetter).toBe('A');
    });

    it('should return null when settings not found', async () => {
      const { getUserSettings } = await import('../users.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getUserSettings('user-123');

      expect(result).toBeNull();
    });

    it('should use defaults for missing fields', async () => {
      const { getUserSettings } = await import('../users.service');

      const mockSettingsData = {
        userId: 'user-123',
        // Most fields missing - should use defaults
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockSettingsData,
      });

      const result = await getUserSettings('user-123');

      expect(result?.theme).toBe(DEFAULT_USER_SETTINGS.theme);
      expect(result?.fontSize).toBe(DEFAULT_USER_SETTINGS.fontSize);
      expect(result?.defaultPriorityLetter).toBe(DEFAULT_USER_SETTINGS.defaultPriorityLetter);
    });
  });

  describe('updateUserSettings', () => {
    it('should update settings and return updated values', async () => {
      const { updateUserSettings } = await import('../users.service');

      // Mock getUserSettings for the return value
      const updatedSettings: UserSettings = {
        userId: 'user-123',
        theme: 'dark',
        fontSize: 'medium',
        defaultPriorityLetter: 'B',
        defaultReminderMinutes: 15,
        timezone: 'America/New_York',
        weekStartsOn: 0,
        notifications: { push: true, email: false, inApp: true },
        googleCalendarSyncEnabled: false,
        platform: 'web',
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => updatedSettings,
      });

      const result = await updateUserSettings('user-123', { theme: 'dark' });

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(result.theme).toBe('dark');
    });

    it('should merge notification settings', async () => {
      const { updateUserSettings } = await import('../users.service');

      const existingSettings: UserSettings = {
        userId: 'user-123',
        theme: 'light',
        fontSize: 'medium',
        defaultPriorityLetter: 'B',
        defaultReminderMinutes: 15,
        timezone: 'America/New_York',
        weekStartsOn: 0,
        notifications: { push: true, email: false, inApp: true },
        googleCalendarSyncEnabled: false,
        platform: 'web',
      };

      // First call for merge, second for return
      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => existingSettings,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ...existingSettings,
            notifications: { push: true, email: true, inApp: true },
          }),
        });

      await updateUserSettings('user-123', {
        notifications: { email: true },
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls[0];
      // Should merge: existing { push: true, email: false, inApp: true } + { email: true }
      expect(updateCall[1].notifications).toEqual({
        push: true,
        email: true,
        inApp: true,
      });
    });
  });

  describe('getOrCreateUser', () => {
    it('should return existing user and update lastLogin', async () => {
      const { getOrCreateUser } = await import('../users.service');

      const existingUser = {
        email: 'existing@example.com',
        displayName: 'Existing User',
        role: 'admin',
        googleCalendarConnected: true,
        createdAt: { toDate: () => new Date('2025-01-01') },
        lastLoginAt: { toDate: () => new Date('2026-01-01') },
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'user-123',
        data: () => existingUser,
      });

      const firebaseUser = {
        uid: 'user-123',
        email: 'existing@example.com',
        displayName: 'Existing User',
      };

      const result = await getOrCreateUser(firebaseUser);

      expect(result.id).toBe('user-123');
      expect(result.role).toBe('admin'); // Preserved from existing
      expect(mockUpdateDoc).toHaveBeenCalled(); // lastLogin updated
    });

    it('should create new user if not exists', async () => {
      const { getOrCreateUser } = await import('../users.service');

      // First call for getUser returns not found
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const firebaseUser = {
        uid: 'new-user-123',
        email: 'new@example.com',
        displayName: 'New User',
      };

      const result = await getOrCreateUser(firebaseUser);

      expect(result.id).toBe('new-user-123');
      expect(result.role).toBe('standard'); // Default for new user
      expect(mockSetDoc).toHaveBeenCalled(); // User created
    });
  });
});
