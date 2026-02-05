/**
 * Reminder Thunks Tests
 *
 * Comprehensive tests for async thunks in the reminders feature.
 * Tests cover all CRUD operations with mocked Firebase and FCM services.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import reminderReducer, { initialState } from '../reminderSlice';
import {
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
  fetchPendingReminders,
} from '../reminderThunks';
import type { Reminder, CreateReminderInput, UpdateReminderInput, SnoozeOption } from '../../../types';
import * as remindersService from '../../../services/firebase/reminders.service';
import * as fcmService from '../../../services/notifications/fcm.service';

// Mock the services
vi.mock('../../../services/firebase/reminders.service');
vi.mock('../../../services/notifications/fcm.service');

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a test store with reminders reducer
 */
function createTestStore(preloadedState?: Partial<typeof initialState>) {
  return configureStore({
    reducer: {
      reminders: reminderReducer,
    },
    preloadedState: preloadedState ? { reminders: { ...initialState, ...preloadedState } } : undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredPaths: ['reminders.reminders'],
        },
      }),
  });
}

/**
 * Create a mock reminder for testing
 */
function createMockReminder(overrides: Partial<Reminder> = {}): Reminder {
  const now = new Date();
  return {
    id: 'reminder-1',
    userId: 'user-1',
    taskId: 'task-1',
    eventId: null,
    type: 'push',
    minutesBefore: 15,
    status: 'pending',
    scheduledTime: now,
    triggeredAt: null,
    dismissedAt: null,
    snoozedUntil: null,
    snoozeCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('Reminder Thunks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // fetchUserReminders
  // ===========================================================================

  describe('fetchUserReminders', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(remindersService.getUserReminders).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      store.dispatch(fetchUserReminders({ userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.syncStatus).toBe('syncing');
    });

    it('should fetch reminders successfully', async () => {
      const store = createTestStore();
      const mockReminders = [
        createMockReminder({ id: 'r1', taskId: 'task-1' }),
        createMockReminder({ id: 'r2', taskId: 'task-2' }),
      ];

      vi.mocked(remindersService.getUserReminders).mockResolvedValue(mockReminders);

      await store.dispatch(fetchUserReminders({ userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.syncStatus).toBe('synced');
      expect(Object.keys(state.reminders)).toHaveLength(2);
      expect(state.reminders['r1']).toBeDefined();
      expect(state.reminders['r2']).toBeDefined();
    });

    it('should build task and event indexes', async () => {
      const store = createTestStore();
      const mockReminders = [
        createMockReminder({ id: 'r1', taskId: 'task-1', eventId: null }),
        createMockReminder({ id: 'r2', taskId: null, eventId: 'event-1' }),
      ];

      vi.mocked(remindersService.getUserReminders).mockResolvedValue(mockReminders);

      await store.dispatch(fetchUserReminders({ userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.remindersByTaskId['task-1']).toContain('r1');
      expect(state.remindersByEventId['event-1']).toContain('r2');
    });

    it('should replace existing reminders', async () => {
      const existingReminder = createMockReminder({ id: 'old', taskId: 'task-old' });
      const store = createTestStore({
        reminders: { old: existingReminder },
        remindersByTaskId: { 'task-old': ['old'] },
      });

      const newReminder = createMockReminder({ id: 'new', taskId: 'task-new' });
      vi.mocked(remindersService.getUserReminders).mockResolvedValue([newReminder]);

      await store.dispatch(fetchUserReminders({ userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.reminders['old']).toBeUndefined();
      expect(state.reminders['new']).toBeDefined();
    });

    it('should handle fetch error', async () => {
      const store = createTestStore();

      vi.mocked(remindersService.getUserReminders).mockRejectedValue(new Error('Network error'));

      await store.dispatch(fetchUserReminders({ userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
      expect(state.syncStatus).toBe('error');
    });

    it('should handle unknown error type', async () => {
      const store = createTestStore();

      vi.mocked(remindersService.getUserReminders).mockRejectedValue('Unknown error');

      await store.dispatch(fetchUserReminders({ userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.error).toBe('Failed to fetch reminders');
    });
  });

  // ===========================================================================
  // fetchRemindersForItem
  // ===========================================================================

  describe('fetchRemindersForItem', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(remindersService.getRemindersForItem).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(fetchRemindersForItem({ itemId: 'task-1', itemType: 'task', userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should fetch reminders for task successfully', async () => {
      const store = createTestStore();
      const mockReminders = [createMockReminder({ id: 'r1', taskId: 'task-1' })];

      vi.mocked(remindersService.getRemindersForItem).mockResolvedValue(mockReminders);

      await store.dispatch(
        fetchRemindersForItem({ itemId: 'task-1', itemType: 'task', userId: 'user-1' })
      );

      const state = store.getState().reminders;
      expect(state.syncStatus).toBe('synced');
      expect(state.reminders['r1']).toBeDefined();
      expect(state.remindersByTaskId['task-1']).toContain('r1');
    });

    it('should fetch reminders for event successfully', async () => {
      const store = createTestStore();
      const mockReminders = [createMockReminder({ id: 'r1', taskId: null, eventId: 'event-1' })];

      vi.mocked(remindersService.getRemindersForItem).mockResolvedValue(mockReminders);

      await store.dispatch(
        fetchRemindersForItem({ itemId: 'event-1', itemType: 'event', userId: 'user-1' })
      );

      const state = store.getState().reminders;
      expect(state.reminders['r1']).toBeDefined();
      expect(state.remindersByEventId['event-1']).toContain('r1');
    });

    it('should handle fetch error', async () => {
      const store = createTestStore();

      vi.mocked(remindersService.getRemindersForItem).mockRejectedValue(new Error('Fetch failed'));

      await store.dispatch(
        fetchRemindersForItem({ itemId: 'task-1', itemType: 'task', userId: 'user-1' })
      );

      const state = store.getState().reminders;
      expect(state.error).toBe('Fetch failed');
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // createReminderAsync
  // ===========================================================================

  describe('createReminderAsync', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(remindersService.createReminder).mockImplementation(
        () => new Promise(() => {})
      );

      const input: CreateReminderInput = {
        taskId: 'task-1',
        type: 'push',
        minutesBefore: 15,
      };

      store.dispatch(createReminderAsync({ input, userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should create reminder successfully', async () => {
      const store = createTestStore();

      const input: CreateReminderInput = {
        taskId: 'task-1',
        type: 'push',
        minutesBefore: 15,
        scheduledTime: new Date('2026-02-01T10:00:00'),
      };

      const createdReminder = createMockReminder({
        id: 'new-id',
        taskId: 'task-1',
        type: 'push',
        minutesBefore: 15,
      });

      vi.mocked(remindersService.createReminder).mockResolvedValue(createdReminder);

      await store.dispatch(createReminderAsync({ input, userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.syncStatus).toBe('synced');
      expect(state.reminders['new-id']).toBeDefined();
      expect(state.reminders['new-id'].type).toBe('push');
      expect(state.remindersByTaskId['task-1']).toContain('new-id');
    });

    it('should create reminder with eventId', async () => {
      const store = createTestStore();

      const input: CreateReminderInput = {
        eventId: 'event-1',
        type: 'email',
        minutesBefore: 30,
      };

      const createdReminder = createMockReminder({
        id: 'new-id',
        taskId: null,
        eventId: 'event-1',
        type: 'email',
        minutesBefore: 30,
      });

      vi.mocked(remindersService.createReminder).mockResolvedValue(createdReminder);

      await store.dispatch(createReminderAsync({ input, userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.reminders['new-id'].eventId).toBe('event-1');
      expect(state.remindersByEventId['event-1']).toContain('new-id');
    });

    it('should handle create error', async () => {
      const store = createTestStore();

      vi.mocked(remindersService.createReminder).mockRejectedValue(new Error('Create failed'));

      const input: CreateReminderInput = {
        taskId: 'task-1',
        type: 'push',
        minutesBefore: 15,
      };

      await store.dispatch(createReminderAsync({ input, userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.error).toBe('Create failed');
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // updateReminderAsync
  // ===========================================================================

  describe('updateReminderAsync', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(remindersService.updateReminder).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(updateReminderAsync({ input: { id: 'r1', type: 'email' }, userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should update reminder successfully', async () => {
      const existingReminder = createMockReminder({ id: 'r1', type: 'push', minutesBefore: 15 });
      const store = createTestStore({
        reminders: { r1: existingReminder },
      });

      const updatedReminder = createMockReminder({
        id: 'r1',
        type: 'email',
        minutesBefore: 30,
      });

      vi.mocked(remindersService.updateReminder).mockResolvedValue(updatedReminder);

      const input: UpdateReminderInput = {
        id: 'r1',
        type: 'email',
        minutesBefore: 30,
      };

      await store.dispatch(updateReminderAsync({ input, userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.syncStatus).toBe('synced');
      expect(state.reminders['r1'].type).toBe('email');
      expect(state.reminders['r1'].minutesBefore).toBe(30);
    });

    it('should handle update error', async () => {
      const store = createTestStore();

      vi.mocked(remindersService.updateReminder).mockRejectedValue(new Error('Update failed'));

      await store.dispatch(
        updateReminderAsync({ input: { id: 'r1', type: 'email' }, userId: 'user-1' })
      );

      const state = store.getState().reminders;
      expect(state.error).toBe('Update failed');
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // deleteReminderAsync
  // ===========================================================================

  describe('deleteReminderAsync', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(remindersService.deleteReminder).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(deleteReminderAsync({ reminderId: 'r1', userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should delete reminder successfully', async () => {
      const reminder = createMockReminder({ id: 'r1', taskId: 'task-1' });
      const store = createTestStore({
        reminders: { r1: reminder },
        remindersByTaskId: { 'task-1': ['r1'] },
      });

      vi.mocked(remindersService.deleteReminder).mockResolvedValue(undefined);

      await store.dispatch(deleteReminderAsync({ reminderId: 'r1', userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.syncStatus).toBe('synced');
      expect(state.reminders['r1']).toBeUndefined();
      expect(state.remindersByTaskId['task-1']).toBeUndefined();
    });

    it('should delete reminder with eventId', async () => {
      const reminder = createMockReminder({ id: 'r1', taskId: null, eventId: 'event-1' });
      const store = createTestStore({
        reminders: { r1: reminder },
        remindersByEventId: { 'event-1': ['r1'] },
      });

      vi.mocked(remindersService.deleteReminder).mockResolvedValue(undefined);

      await store.dispatch(deleteReminderAsync({ reminderId: 'r1', userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.reminders['r1']).toBeUndefined();
      expect(state.remindersByEventId['event-1']).toBeUndefined();
    });

    it('should handle delete error', async () => {
      const store = createTestStore();

      vi.mocked(remindersService.deleteReminder).mockRejectedValue(new Error('Delete failed'));

      await store.dispatch(deleteReminderAsync({ reminderId: 'r1', userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.error).toBe('Delete failed');
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // snoozeReminderAsync
  // ===========================================================================

  describe('snoozeReminderAsync', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(remindersService.snoozeReminder).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(
        snoozeReminderAsync({ reminderId: 'r1', snoozeMinutes: 5 as SnoozeOption, userId: 'user-1' })
      );

      const state = store.getState().reminders;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should snooze reminder for 5 minutes', async () => {
      const reminder = createMockReminder({ id: 'r1', status: 'pending', snoozeCount: 0 });
      const store = createTestStore({
        reminders: { r1: reminder },
      });

      const snoozedReminder = createMockReminder({
        id: 'r1',
        status: 'snoozed',
        snoozeCount: 1,
        snoozedUntil: new Date(Date.now() + 5 * 60 * 1000),
      });

      vi.mocked(remindersService.snoozeReminder).mockResolvedValue(snoozedReminder);

      await store.dispatch(
        snoozeReminderAsync({ reminderId: 'r1', snoozeMinutes: 5 as SnoozeOption, userId: 'user-1' })
      );

      const state = store.getState().reminders;
      expect(state.syncStatus).toBe('synced');
      expect(state.reminders['r1'].status).toBe('snoozed');
      expect(state.reminders['r1'].snoozeCount).toBe(1);
    });

    it('should snooze reminder for 15 minutes', async () => {
      const reminder = createMockReminder({ id: 'r1' });
      const store = createTestStore({
        reminders: { r1: reminder },
      });

      const snoozedReminder = createMockReminder({
        id: 'r1',
        status: 'snoozed',
        snoozeCount: 1,
      });

      vi.mocked(remindersService.snoozeReminder).mockResolvedValue(snoozedReminder);

      await store.dispatch(
        snoozeReminderAsync({ reminderId: 'r1', snoozeMinutes: 15 as SnoozeOption, userId: 'user-1' })
      );

      const state = store.getState().reminders;
      expect(state.reminders['r1'].status).toBe('snoozed');
    });

    it('should snooze reminder for 30 minutes', async () => {
      const reminder = createMockReminder({ id: 'r1' });
      const store = createTestStore({
        reminders: { r1: reminder },
      });

      const snoozedReminder = createMockReminder({
        id: 'r1',
        status: 'snoozed',
      });

      vi.mocked(remindersService.snoozeReminder).mockResolvedValue(snoozedReminder);

      await store.dispatch(
        snoozeReminderAsync({ reminderId: 'r1', snoozeMinutes: 30 as SnoozeOption, userId: 'user-1' })
      );

      const state = store.getState().reminders;
      expect(state.reminders['r1'].status).toBe('snoozed');
    });

    it('should snooze reminder for 60 minutes', async () => {
      const reminder = createMockReminder({ id: 'r1' });
      const store = createTestStore({
        reminders: { r1: reminder },
      });

      const snoozedReminder = createMockReminder({
        id: 'r1',
        status: 'snoozed',
      });

      vi.mocked(remindersService.snoozeReminder).mockResolvedValue(snoozedReminder);

      await store.dispatch(
        snoozeReminderAsync({ reminderId: 'r1', snoozeMinutes: 60 as SnoozeOption, userId: 'user-1' })
      );

      const state = store.getState().reminders;
      expect(state.reminders['r1'].status).toBe('snoozed');
    });

    it('should remove from active notifications when snoozed', async () => {
      const reminder = createMockReminder({ id: 'r1' });
      const notification = {
        reminderId: 'r1',
        title: 'Test',
        body: 'Test body',
        itemType: 'task' as const,
        itemId: 'task-1',
        scheduledTime: new Date(),
        triggeredAt: new Date(),
        canSnooze: true,
        isDismissed: false,
        priority: 'medium' as const,
      };
      const store = createTestStore({
        reminders: { r1: reminder },
        activeNotifications: [notification],
      });

      const snoozedReminder = createMockReminder({
        id: 'r1',
        status: 'snoozed',
      });

      vi.mocked(remindersService.snoozeReminder).mockResolvedValue(snoozedReminder);

      await store.dispatch(
        snoozeReminderAsync({ reminderId: 'r1', snoozeMinutes: 5 as SnoozeOption, userId: 'user-1' })
      );

      const state = store.getState().reminders;
      expect(state.activeNotifications).toHaveLength(0);
    });

    it('should handle snooze error', async () => {
      const store = createTestStore();

      vi.mocked(remindersService.snoozeReminder).mockRejectedValue(new Error('Snooze failed'));

      await store.dispatch(
        snoozeReminderAsync({ reminderId: 'r1', snoozeMinutes: 5 as SnoozeOption, userId: 'user-1' })
      );

      const state = store.getState().reminders;
      expect(state.error).toBe('Snooze failed');
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // dismissReminderAsync
  // ===========================================================================

  describe('dismissReminderAsync', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(remindersService.dismissReminder).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(dismissReminderAsync({ reminderId: 'r1', userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should dismiss reminder successfully', async () => {
      const reminder = createMockReminder({ id: 'r1', status: 'pending' });
      const store = createTestStore({
        reminders: { r1: reminder },
      });

      const dismissedReminder = createMockReminder({
        id: 'r1',
        status: 'dismissed',
        dismissedAt: new Date(),
      });

      vi.mocked(remindersService.dismissReminder).mockResolvedValue(dismissedReminder);

      await store.dispatch(dismissReminderAsync({ reminderId: 'r1', userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.syncStatus).toBe('synced');
      expect(state.reminders['r1'].status).toBe('dismissed');
      expect(state.reminders['r1'].dismissedAt).toBeDefined();
    });

    it('should remove from active notifications when dismissed', async () => {
      const reminder = createMockReminder({ id: 'r1' });
      const notification = {
        reminderId: 'r1',
        title: 'Test',
        body: 'Test body',
        itemType: 'task' as const,
        itemId: 'task-1',
        scheduledTime: new Date(),
        triggeredAt: new Date(),
        canSnooze: true,
        isDismissed: false,
        priority: 'medium' as const,
      };
      const store = createTestStore({
        reminders: { r1: reminder },
        activeNotifications: [notification],
      });

      const dismissedReminder = createMockReminder({
        id: 'r1',
        status: 'dismissed',
      });

      vi.mocked(remindersService.dismissReminder).mockResolvedValue(dismissedReminder);

      await store.dispatch(dismissReminderAsync({ reminderId: 'r1', userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.activeNotifications).toHaveLength(0);
    });

    it('should handle dismiss error', async () => {
      const store = createTestStore();

      vi.mocked(remindersService.dismissReminder).mockRejectedValue(new Error('Dismiss failed'));

      await store.dispatch(dismissReminderAsync({ reminderId: 'r1', userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.error).toBe('Dismiss failed');
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // requestPermissionAsync
  // ===========================================================================

  describe('requestPermissionAsync', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(fcmService.requestNotificationPermission).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(requestPermissionAsync());

      const state = store.getState().reminders;
      expect(state.loading).toBe(true);
    });

    it('should request permission successfully - granted', async () => {
      const store = createTestStore();

      vi.mocked(fcmService.requestNotificationPermission).mockResolvedValue('granted');

      await store.dispatch(requestPermissionAsync());

      const state = store.getState().reminders;
      expect(state.loading).toBe(false);
      expect(state.permissionStatus).toBe('granted');
    });

    it('should request permission successfully - denied', async () => {
      const store = createTestStore();

      vi.mocked(fcmService.requestNotificationPermission).mockResolvedValue('denied');

      await store.dispatch(requestPermissionAsync());

      const state = store.getState().reminders;
      expect(state.permissionStatus).toBe('denied');
    });

    it('should handle permission request error', async () => {
      const store = createTestStore();

      vi.mocked(fcmService.requestNotificationPermission).mockRejectedValue(
        new Error('Permission failed')
      );

      await store.dispatch(requestPermissionAsync());

      const state = store.getState().reminders;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Permission failed');
    });
  });

  // ===========================================================================
  // registerDeviceAsync
  // ===========================================================================

  describe('registerDeviceAsync', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(fcmService.registerForPushNotifications).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(registerDeviceAsync({ userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.loading).toBe(true);
    });

    it('should register device successfully', async () => {
      const store = createTestStore();

      vi.mocked(fcmService.registerForPushNotifications).mockResolvedValue({
        permissionStatus: 'granted',
        token: 'fcm-token-123',
      });

      await store.dispatch(registerDeviceAsync({ userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.loading).toBe(false);
      expect(state.permissionStatus).toBe('granted');
      expect(state.deviceToken).toBe('fcm-token-123');
      expect(state.isRegistered).toBe(true);
    });

    it('should handle registration when permission denied', async () => {
      const store = createTestStore();

      vi.mocked(fcmService.registerForPushNotifications).mockResolvedValue({
        permissionStatus: 'denied',
        token: null,
      });

      await store.dispatch(registerDeviceAsync({ userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.permissionStatus).toBe('denied');
      expect(state.deviceToken).toBeNull();
      expect(state.isRegistered).toBe(false);
    });

    it('should handle registration error', async () => {
      const store = createTestStore();

      vi.mocked(fcmService.registerForPushNotifications).mockRejectedValue(
        new Error('Registration failed')
      );

      await store.dispatch(registerDeviceAsync({ userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Registration failed');
    });
  });

  // ===========================================================================
  // unregisterDeviceAsync
  // ===========================================================================

  describe('unregisterDeviceAsync', () => {
    it('should handle pending state', () => {
      const store = createTestStore({
        deviceToken: 'token-123',
        isRegistered: true,
      });

      vi.mocked(fcmService.unregisterFromPushNotifications).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(unregisterDeviceAsync());

      const state = store.getState().reminders;
      expect(state.loading).toBe(true);
    });

    it('should unregister device successfully', async () => {
      const store = createTestStore({
        deviceToken: 'token-123',
        isRegistered: true,
      });

      vi.mocked(fcmService.unregisterFromPushNotifications).mockResolvedValue(undefined);

      await store.dispatch(unregisterDeviceAsync());

      const state = store.getState().reminders;
      expect(state.loading).toBe(false);
      expect(state.deviceToken).toBeNull();
      expect(state.isRegistered).toBe(false);
    });

    it('should handle unregister error', async () => {
      const store = createTestStore({
        deviceToken: 'token-123',
        isRegistered: true,
      });

      vi.mocked(fcmService.unregisterFromPushNotifications).mockRejectedValue(
        new Error('Unregister failed')
      );

      await store.dispatch(unregisterDeviceAsync());

      const state = store.getState().reminders;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Unregister failed');
    });
  });

  // ===========================================================================
  // fetchPendingReminders
  // ===========================================================================

  describe('fetchPendingReminders', () => {
    it('should fetch pending reminders successfully', async () => {
      const store = createTestStore();
      const mockReminders = [
        createMockReminder({ id: 'r1', status: 'pending' }),
        createMockReminder({ id: 'r2', status: 'snoozed' }),
      ];

      vi.mocked(remindersService.getPendingReminders).mockResolvedValue(mockReminders);

      await store.dispatch(fetchPendingReminders({ userId: 'user-1' }));

      expect(remindersService.getPendingReminders).toHaveBeenCalledWith('user-1');
    });

    it('should handle fetch error', async () => {
      const store = createTestStore();

      vi.mocked(remindersService.getPendingReminders).mockRejectedValue(
        new Error('Fetch pending failed')
      );

      const result = await store.dispatch(fetchPendingReminders({ userId: 'user-1' }));

      expect(result.type).toContain('rejected');
    });
  });

  // ===========================================================================
  // Integration Tests
  // ===========================================================================

  describe('Integration', () => {
    it('should clear error after successful operation', async () => {
      const store = createTestStore({ error: 'Previous error' });

      vi.mocked(remindersService.getUserReminders).mockResolvedValue([]);

      await store.dispatch(fetchUserReminders({ userId: 'user-1' }));

      const state = store.getState().reminders;
      expect(state.error).toBeNull();
    });

    it('should handle multiple concurrent operations', async () => {
      const store = createTestStore();

      const r1 = createMockReminder({ id: 'r1', taskId: 'task-1' });
      const r2 = createMockReminder({ id: 'r2', taskId: 'task-2' });

      vi.mocked(remindersService.getRemindersForItem)
        .mockResolvedValueOnce([r1])
        .mockResolvedValueOnce([r2]);

      await Promise.all([
        store.dispatch(fetchRemindersForItem({ itemId: 'task-1', itemType: 'task', userId: 'user-1' })),
        store.dispatch(fetchRemindersForItem({ itemId: 'task-2', itemType: 'task', userId: 'user-1' })),
      ]);

      const state = store.getState().reminders;
      expect(Object.keys(state.reminders)).toHaveLength(2);
      expect(state.reminders['r1']).toBeDefined();
      expect(state.reminders['r2']).toBeDefined();
    });

    it('should maintain state consistency through CRUD cycle', async () => {
      const store = createTestStore();

      // Create
      const createdReminder = createMockReminder({
        id: 'new-reminder',
        taskId: 'task-1',
        type: 'push',
      });
      vi.mocked(remindersService.createReminder).mockResolvedValue(createdReminder);

      await store.dispatch(
        createReminderAsync({
          input: { taskId: 'task-1', type: 'push', minutesBefore: 15 },
          userId: 'user-1',
        })
      );

      let state = store.getState().reminders;
      expect(state.reminders['new-reminder']).toBeDefined();

      // Update
      const updatedReminder = createMockReminder({
        id: 'new-reminder',
        taskId: 'task-1',
        type: 'email',
        minutesBefore: 30,
      });
      vi.mocked(remindersService.updateReminder).mockResolvedValue(updatedReminder);

      await store.dispatch(
        updateReminderAsync({
          input: { id: 'new-reminder', type: 'email', minutesBefore: 30 },
          userId: 'user-1',
        })
      );

      state = store.getState().reminders;
      expect(state.reminders['new-reminder'].type).toBe('email');
      expect(state.reminders['new-reminder'].minutesBefore).toBe(30);

      // Delete
      vi.mocked(remindersService.deleteReminder).mockResolvedValue(undefined);

      await store.dispatch(deleteReminderAsync({ reminderId: 'new-reminder', userId: 'user-1' }));

      state = store.getState().reminders;
      expect(state.reminders['new-reminder']).toBeUndefined();
    });
  });
});
