/**
 * Reminder Slice Tests
 *
 * Comprehensive tests for the reminder Redux slice including:
 * - Initial state
 * - All reducers
 * - All selectors
 * - Index management (remindersByTaskId, remindersByEventId)
 * - Active notifications
 * - Edge cases
 */

import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import reminderReducer, {
  initialState,
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
  type RemindersState,
} from '../reminderSlice';
import type { Reminder, ReminderNotification } from '../../../types';

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Create a test store with the reminder reducer
 */
function createTestStore(preloadedState?: Partial<RemindersState>) {
  return configureStore({
    reducer: { reminders: reminderReducer },
    preloadedState: preloadedState ? { reminders: { ...initialState, ...preloadedState } } : undefined,
  });
}

/**
 * Create a mock reminder with default values
 */
function createMockReminder(overrides: Partial<Reminder> = {}): Reminder {
  const now = new Date();
  return {
    id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: 'user-123',
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

/**
 * Create a mock notification
 */
function createMockNotification(overrides: Partial<ReminderNotification> = {}): ReminderNotification {
  return {
    reminderId: 'reminder-1',
    title: 'Test Notification',
    body: 'This is a test notification',
    itemType: 'task',
    itemId: 'task-1',
    scheduledTime: new Date(),
    triggeredAt: new Date(),
    canSnooze: true,
    isDismissed: false,
    priority: 'medium',
    ...overrides,
  };
}

// =============================================================================
// Initial State Tests
// =============================================================================

describe('Reminder Slice', () => {
  describe('Initial State', () => {
    it('should have correct initial state shape', () => {
      const store = createTestStore();
      const state = store.getState().reminders;

      expect(state.reminders).toEqual({});
      expect(state.remindersByTaskId).toEqual({});
      expect(state.remindersByEventId).toEqual({});
      expect(state.activeNotifications).toEqual([]);
      expect(state.permissionStatus).toBe('default');
      expect(state.deviceToken).toBeNull();
      expect(state.isRegistered).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.syncStatus).toBe('synced');
    });
  });

  // ===========================================================================
  // setReminders Reducer Tests
  // ===========================================================================

  describe('setReminders reducer', () => {
    it('should set reminders and build indexes', () => {
      const store = createTestStore();
      const reminders = [
        createMockReminder({ id: 'r1', taskId: 'task-1', eventId: null }),
        createMockReminder({ id: 'r2', taskId: 'task-1', eventId: null }),
        createMockReminder({ id: 'r3', taskId: null, eventId: 'event-1' }),
      ];

      store.dispatch(setReminders(reminders));

      const state = store.getState().reminders;
      expect(Object.keys(state.reminders)).toHaveLength(3);
      expect(state.remindersByTaskId['task-1']).toEqual(['r1', 'r2']);
      expect(state.remindersByEventId['event-1']).toEqual(['r3']);
    });

    it('should replace existing reminders', () => {
      const oldReminder = createMockReminder({ id: 'old', taskId: 'task-old' });
      const newReminder = createMockReminder({ id: 'new', taskId: 'task-new' });

      const store = createTestStore({
        reminders: { old: oldReminder },
        remindersByTaskId: { 'task-old': ['old'] },
      });

      store.dispatch(setReminders([newReminder]));

      const state = store.getState().reminders;
      expect(state.reminders['old']).toBeUndefined();
      expect(state.reminders['new']).toBeDefined();
      expect(state.remindersByTaskId['task-old']).toBeUndefined();
      expect(state.remindersByTaskId['task-new']).toEqual(['new']);
    });

    it('should handle empty array', () => {
      const reminder = createMockReminder({ id: 'r1', taskId: 'task-1' });
      const store = createTestStore({
        reminders: { r1: reminder },
        remindersByTaskId: { 'task-1': ['r1'] },
      });

      store.dispatch(setReminders([]));

      const state = store.getState().reminders;
      expect(state.reminders).toEqual({});
      expect(state.remindersByTaskId).toEqual({});
      expect(state.remindersByEventId).toEqual({});
    });
  });

  // ===========================================================================
  // addReminder Reducer Tests
  // ===========================================================================

  describe('addReminder reducer', () => {
    it('should add a reminder with taskId', () => {
      const store = createTestStore();
      const reminder = createMockReminder({ id: 'r1', taskId: 'task-1', eventId: null });

      store.dispatch(addReminder(reminder));

      const state = store.getState().reminders;
      expect(state.reminders['r1']).toBeDefined();
      expect(state.remindersByTaskId['task-1']).toContain('r1');
    });

    it('should add a reminder with eventId', () => {
      const store = createTestStore();
      const reminder = createMockReminder({ id: 'r1', taskId: null, eventId: 'event-1' });

      store.dispatch(addReminder(reminder));

      const state = store.getState().reminders;
      expect(state.reminders['r1']).toBeDefined();
      expect(state.remindersByEventId['event-1']).toContain('r1');
    });

    it('should not duplicate reminder ID in index', () => {
      const reminder = createMockReminder({ id: 'r1', taskId: 'task-1' });
      const store = createTestStore({
        reminders: { r1: reminder },
        remindersByTaskId: { 'task-1': ['r1'] },
      });

      store.dispatch(addReminder(reminder));

      const state = store.getState().reminders;
      expect(state.remindersByTaskId['task-1'].filter((id) => id === 'r1')).toHaveLength(1);
    });
  });

  // ===========================================================================
  // updateReminder Reducer Tests
  // ===========================================================================

  describe('updateReminder reducer', () => {
    it('should update reminder properties', () => {
      const reminder = createMockReminder({ id: 'r1', type: 'push', minutesBefore: 15 });
      const store = createTestStore({
        reminders: { r1: reminder },
      });

      store.dispatch(updateReminder({ id: 'r1', type: 'email', minutesBefore: 30 }));

      const state = store.getState().reminders;
      expect(state.reminders['r1'].type).toBe('email');
      expect(state.reminders['r1'].minutesBefore).toBe(30);
    });

    it('should update reminder status', () => {
      const reminder = createMockReminder({ id: 'r1', status: 'pending' });
      const store = createTestStore({
        reminders: { r1: reminder },
      });

      store.dispatch(updateReminder({ id: 'r1', status: 'triggered' }));

      const state = store.getState().reminders;
      expect(state.reminders['r1'].status).toBe('triggered');
    });

    it('should preserve unchanged properties', () => {
      const reminder = createMockReminder({
        id: 'r1',
        type: 'push',
        minutesBefore: 15,
        snoozeCount: 2,
      });
      const store = createTestStore({
        reminders: { r1: reminder },
      });

      store.dispatch(updateReminder({ id: 'r1', type: 'email' }));

      const state = store.getState().reminders;
      expect(state.reminders['r1'].minutesBefore).toBe(15);
      expect(state.reminders['r1'].snoozeCount).toBe(2);
    });

    it('should do nothing for non-existent reminder', () => {
      const store = createTestStore();

      store.dispatch(updateReminder({ id: 'non-existent', type: 'email' }));

      const state = store.getState().reminders;
      expect(state.reminders['non-existent']).toBeUndefined();
    });
  });

  // ===========================================================================
  // removeReminder Reducer Tests
  // ===========================================================================

  describe('removeReminder reducer', () => {
    it('should remove reminder from store', () => {
      const reminder = createMockReminder({ id: 'r1', taskId: 'task-1' });
      const store = createTestStore({
        reminders: { r1: reminder },
        remindersByTaskId: { 'task-1': ['r1'] },
      });

      store.dispatch(removeReminder('r1'));

      const state = store.getState().reminders;
      expect(state.reminders['r1']).toBeUndefined();
    });

    it('should remove from taskId index', () => {
      const reminder = createMockReminder({ id: 'r1', taskId: 'task-1' });
      const store = createTestStore({
        reminders: { r1: reminder },
        remindersByTaskId: { 'task-1': ['r1'] },
      });

      store.dispatch(removeReminder('r1'));

      const state = store.getState().reminders;
      expect(state.remindersByTaskId['task-1']).toBeUndefined();
    });

    it('should remove from eventId index', () => {
      const reminder = createMockReminder({ id: 'r1', taskId: null, eventId: 'event-1' });
      const store = createTestStore({
        reminders: { r1: reminder },
        remindersByEventId: { 'event-1': ['r1'] },
      });

      store.dispatch(removeReminder('r1'));

      const state = store.getState().reminders;
      expect(state.remindersByEventId['event-1']).toBeUndefined();
    });

    it('should clean up empty index arrays', () => {
      const r1 = createMockReminder({ id: 'r1', taskId: 'task-1' });
      const r2 = createMockReminder({ id: 'r2', taskId: 'task-1' });
      const store = createTestStore({
        reminders: { r1, r2 },
        remindersByTaskId: { 'task-1': ['r1', 'r2'] },
      });

      store.dispatch(removeReminder('r1'));

      let state = store.getState().reminders;
      expect(state.remindersByTaskId['task-1']).toEqual(['r2']);

      store.dispatch(removeReminder('r2'));

      state = store.getState().reminders;
      expect(state.remindersByTaskId['task-1']).toBeUndefined();
    });

    it('should do nothing for non-existent reminder', () => {
      const reminder = createMockReminder({ id: 'r1' });
      const store = createTestStore({
        reminders: { r1: reminder },
      });

      store.dispatch(removeReminder('non-existent'));

      const state = store.getState().reminders;
      expect(state.reminders['r1']).toBeDefined();
    });
  });

  // ===========================================================================
  // Permission and Device Token Reducers
  // ===========================================================================

  describe('setPermissionStatus reducer', () => {
    it('should update permission status', () => {
      const store = createTestStore();

      store.dispatch(setPermissionStatus('granted'));
      expect(store.getState().reminders.permissionStatus).toBe('granted');

      store.dispatch(setPermissionStatus('denied'));
      expect(store.getState().reminders.permissionStatus).toBe('denied');

      store.dispatch(setPermissionStatus('unsupported'));
      expect(store.getState().reminders.permissionStatus).toBe('unsupported');
    });
  });

  describe('setDeviceToken reducer', () => {
    it('should set device token and mark as registered', () => {
      const store = createTestStore();

      store.dispatch(setDeviceToken('fcm-token-123'));

      const state = store.getState().reminders;
      expect(state.deviceToken).toBe('fcm-token-123');
      expect(state.isRegistered).toBe(true);
    });

    it('should clear device token and mark as unregistered', () => {
      const store = createTestStore({
        deviceToken: 'old-token',
        isRegistered: true,
      });

      store.dispatch(setDeviceToken(null));

      const state = store.getState().reminders;
      expect(state.deviceToken).toBeNull();
      expect(state.isRegistered).toBe(false);
    });
  });

  // ===========================================================================
  // Active Notifications Reducers
  // ===========================================================================

  describe('addActiveNotification reducer', () => {
    it('should add a notification', () => {
      const store = createTestStore();
      const notification = createMockNotification({ reminderId: 'r1' });

      store.dispatch(addActiveNotification(notification));

      const state = store.getState().reminders;
      expect(state.activeNotifications).toHaveLength(1);
      expect(state.activeNotifications[0].reminderId).toBe('r1');
    });

    it('should not add duplicate notifications', () => {
      const notification = createMockNotification({ reminderId: 'r1' });
      const store = createTestStore({
        activeNotifications: [notification],
      });

      store.dispatch(addActiveNotification(notification));

      const state = store.getState().reminders;
      expect(state.activeNotifications).toHaveLength(1);
    });
  });

  describe('removeActiveNotification reducer', () => {
    it('should remove a notification', () => {
      const n1 = createMockNotification({ reminderId: 'r1' });
      const n2 = createMockNotification({ reminderId: 'r2' });
      const store = createTestStore({
        activeNotifications: [n1, n2],
      });

      store.dispatch(removeActiveNotification('r1'));

      const state = store.getState().reminders;
      expect(state.activeNotifications).toHaveLength(1);
      expect(state.activeNotifications[0].reminderId).toBe('r2');
    });
  });

  describe('clearActiveNotifications reducer', () => {
    it('should clear all notifications', () => {
      const n1 = createMockNotification({ reminderId: 'r1' });
      const n2 = createMockNotification({ reminderId: 'r2' });
      const store = createTestStore({
        activeNotifications: [n1, n2],
      });

      store.dispatch(clearActiveNotifications());

      const state = store.getState().reminders;
      expect(state.activeNotifications).toEqual([]);
    });
  });

  describe('dismissActiveNotification reducer', () => {
    it('should mark notification as dismissed', () => {
      const notification = createMockNotification({ reminderId: 'r1', isDismissed: false });
      const store = createTestStore({
        activeNotifications: [notification],
      });

      store.dispatch(dismissActiveNotification('r1'));

      const state = store.getState().reminders;
      expect(state.activeNotifications[0].isDismissed).toBe(true);
    });

    it('should not affect other notifications', () => {
      const n1 = createMockNotification({ reminderId: 'r1', isDismissed: false });
      const n2 = createMockNotification({ reminderId: 'r2', isDismissed: false });
      const store = createTestStore({
        activeNotifications: [n1, n2],
      });

      store.dispatch(dismissActiveNotification('r1'));

      const state = store.getState().reminders;
      expect(state.activeNotifications[0].isDismissed).toBe(true);
      expect(state.activeNotifications[1].isDismissed).toBe(false);
    });
  });

  // ===========================================================================
  // Loading, Error, and Sync Status Reducers
  // ===========================================================================

  describe('setLoading reducer', () => {
    it('should set loading to true', () => {
      const store = createTestStore();
      store.dispatch(setLoading(true));
      expect(store.getState().reminders.loading).toBe(true);
    });

    it('should set loading to false', () => {
      const store = createTestStore({ loading: true });
      store.dispatch(setLoading(false));
      expect(store.getState().reminders.loading).toBe(false);
    });
  });

  describe('setError reducer', () => {
    it('should set error message', () => {
      const store = createTestStore();
      store.dispatch(setError('Something went wrong'));
      expect(store.getState().reminders.error).toBe('Something went wrong');
    });

    it('should clear error with null', () => {
      const store = createTestStore({ error: 'Previous error' });
      store.dispatch(setError(null));
      expect(store.getState().reminders.error).toBeNull();
    });
  });

  describe('setSyncStatus reducer', () => {
    it('should update sync status', () => {
      const store = createTestStore();

      store.dispatch(setSyncStatus('syncing'));
      expect(store.getState().reminders.syncStatus).toBe('syncing');

      store.dispatch(setSyncStatus('error'));
      expect(store.getState().reminders.syncStatus).toBe('error');

      store.dispatch(setSyncStatus('synced'));
      expect(store.getState().reminders.syncStatus).toBe('synced');
    });
  });

  describe('clearReminders reducer', () => {
    it('should clear all reminders and indexes', () => {
      const reminder = createMockReminder({ id: 'r1', taskId: 'task-1' });
      const notification = createMockNotification({ reminderId: 'r1' });
      const store = createTestStore({
        reminders: { r1: reminder },
        remindersByTaskId: { 'task-1': ['r1'] },
        activeNotifications: [notification],
        error: 'Some error',
      });

      store.dispatch(clearReminders());

      const state = store.getState().reminders;
      expect(state.reminders).toEqual({});
      expect(state.remindersByTaskId).toEqual({});
      expect(state.remindersByEventId).toEqual({});
      expect(state.activeNotifications).toEqual([]);
      expect(state.error).toBeNull();
    });

    it('should preserve device registration state', () => {
      const store = createTestStore({
        deviceToken: 'token-123',
        isRegistered: true,
        permissionStatus: 'granted',
      });

      store.dispatch(clearReminders());

      const state = store.getState().reminders;
      expect(state.deviceToken).toBe('token-123');
      expect(state.isRegistered).toBe(true);
      expect(state.permissionStatus).toBe('granted');
    });
  });

  // ===========================================================================
  // Selector Tests
  // ===========================================================================

  describe('Selectors', () => {
    describe('selectAllReminders', () => {
      it('should return all reminders as array', () => {
        const r1 = createMockReminder({ id: 'r1' });
        const r2 = createMockReminder({ id: 'r2' });
        const store = createTestStore({
          reminders: { r1, r2 },
        });

        const allReminders = selectAllReminders(store.getState());
        expect(allReminders).toHaveLength(2);
        expect(allReminders.map((r) => r.id).sort()).toEqual(['r1', 'r2']);
      });

      it('should return empty array when no reminders', () => {
        const store = createTestStore();
        expect(selectAllReminders(store.getState())).toEqual([]);
      });
    });

    describe('selectReminderById', () => {
      it('should return reminder by ID', () => {
        const reminder = createMockReminder({ id: 'r1', type: 'email' });
        const store = createTestStore({ reminders: { r1: reminder } });

        expect(selectReminderById(store.getState(), 'r1')?.type).toBe('email');
      });

      it('should return undefined for non-existent ID', () => {
        const store = createTestStore();
        expect(selectReminderById(store.getState(), 'non-existent')).toBeUndefined();
      });
    });

    describe('selectRemindersForTask', () => {
      it('should return reminders for specific task', () => {
        const r1 = createMockReminder({ id: 'r1', taskId: 'task-1' });
        const r2 = createMockReminder({ id: 'r2', taskId: 'task-1' });
        const r3 = createMockReminder({ id: 'r3', taskId: 'task-2' });
        const store = createTestStore({
          reminders: { r1, r2, r3 },
          remindersByTaskId: { 'task-1': ['r1', 'r2'], 'task-2': ['r3'] },
        });

        const reminders = selectRemindersForTask(store.getState(), 'task-1');
        expect(reminders).toHaveLength(2);
        expect(reminders.map((r) => r.id).sort()).toEqual(['r1', 'r2']);
      });

      it('should return empty array for task with no reminders', () => {
        const store = createTestStore();
        expect(selectRemindersForTask(store.getState(), 'task-1')).toEqual([]);
      });

      it('should filter out undefined reminders (stale index)', () => {
        const r1 = createMockReminder({ id: 'r1', taskId: 'task-1' });
        const store = createTestStore({
          reminders: { r1 },
          remindersByTaskId: { 'task-1': ['r1', 'deleted-reminder'] },
        });

        const reminders = selectRemindersForTask(store.getState(), 'task-1');
        expect(reminders).toHaveLength(1);
        expect(reminders[0].id).toBe('r1');
      });
    });

    describe('selectRemindersForEvent', () => {
      it('should return reminders for specific event', () => {
        const r1 = createMockReminder({ id: 'r1', taskId: null, eventId: 'event-1' });
        const r2 = createMockReminder({ id: 'r2', taskId: null, eventId: 'event-1' });
        const store = createTestStore({
          reminders: { r1, r2 },
          remindersByEventId: { 'event-1': ['r1', 'r2'] },
        });

        const reminders = selectRemindersForEvent(store.getState(), 'event-1');
        expect(reminders).toHaveLength(2);
      });

      it('should return empty array for event with no reminders', () => {
        const store = createTestStore();
        expect(selectRemindersForEvent(store.getState(), 'event-1')).toEqual([]);
      });
    });

    describe('selectPendingReminders', () => {
      it('should return pending and snoozed reminders', () => {
        const pending = createMockReminder({ id: 'r1', status: 'pending' });
        const snoozed = createMockReminder({ id: 'r2', status: 'snoozed' });
        const triggered = createMockReminder({ id: 'r3', status: 'triggered' });
        const dismissed = createMockReminder({ id: 'r4', status: 'dismissed' });
        const store = createTestStore({
          reminders: { r1: pending, r2: snoozed, r3: triggered, r4: dismissed },
        });

        const pendingReminders = selectPendingReminders(store.getState());
        expect(pendingReminders).toHaveLength(2);
        expect(pendingReminders.map((r) => r.id).sort()).toEqual(['r1', 'r2']);
      });
    });

    describe('selectActiveNotifications', () => {
      it('should return all active notifications', () => {
        const n1 = createMockNotification({ reminderId: 'r1' });
        const n2 = createMockNotification({ reminderId: 'r2', isDismissed: true });
        const store = createTestStore({
          activeNotifications: [n1, n2],
        });

        const notifications = selectActiveNotifications(store.getState());
        expect(notifications).toHaveLength(2);
      });
    });

    describe('selectUndismissedNotifications', () => {
      it('should return only undismissed notifications', () => {
        const n1 = createMockNotification({ reminderId: 'r1', isDismissed: false });
        const n2 = createMockNotification({ reminderId: 'r2', isDismissed: true });
        const n3 = createMockNotification({ reminderId: 'r3', isDismissed: false });
        const store = createTestStore({
          activeNotifications: [n1, n2, n3],
        });

        const notifications = selectUndismissedNotifications(store.getState());
        expect(notifications).toHaveLength(2);
        expect(notifications.map((n) => n.reminderId).sort()).toEqual(['r1', 'r3']);
      });
    });

    describe('selectPermissionStatus', () => {
      it('should return permission status', () => {
        const store = createTestStore({ permissionStatus: 'granted' });
        expect(selectPermissionStatus(store.getState())).toBe('granted');
      });
    });

    describe('selectDeviceToken', () => {
      it('should return device token', () => {
        const store = createTestStore({ deviceToken: 'token-123' });
        expect(selectDeviceToken(store.getState())).toBe('token-123');
      });

      it('should return null when no token', () => {
        const store = createTestStore();
        expect(selectDeviceToken(store.getState())).toBeNull();
      });
    });

    describe('selectIsRegistered', () => {
      it('should return registration status', () => {
        const store = createTestStore({ isRegistered: true });
        expect(selectIsRegistered(store.getState())).toBe(true);
      });
    });

    describe('selectRemindersLoading', () => {
      it('should return loading state', () => {
        const store = createTestStore({ loading: true });
        expect(selectRemindersLoading(store.getState())).toBe(true);
      });
    });

    describe('selectRemindersError', () => {
      it('should return error message', () => {
        const store = createTestStore({ error: 'Error occurred' });
        expect(selectRemindersError(store.getState())).toBe('Error occurred');
      });
    });

    describe('selectRemindersSyncStatus', () => {
      it('should return sync status', () => {
        const store = createTestStore({ syncStatus: 'syncing' });
        expect(selectRemindersSyncStatus(store.getState())).toBe('syncing');
      });
    });

    describe('selectNotificationCount', () => {
      it('should return count of undismissed notifications', () => {
        const n1 = createMockNotification({ reminderId: 'r1', isDismissed: false });
        const n2 = createMockNotification({ reminderId: 'r2', isDismissed: true });
        const n3 = createMockNotification({ reminderId: 'r3', isDismissed: false });
        const store = createTestStore({
          activeNotifications: [n1, n2, n3],
        });

        expect(selectNotificationCount(store.getState())).toBe(2);
      });

      it('should return 0 when no notifications', () => {
        const store = createTestStore();
        expect(selectNotificationCount(store.getState())).toBe(0);
      });
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle reminder with all nullable fields set to null', () => {
      const store = createTestStore();
      const reminder = createMockReminder({
        id: 'r1',
        taskId: null,
        eventId: null,
        triggeredAt: null,
        dismissedAt: null,
        snoozedUntil: null,
      });

      store.dispatch(addReminder(reminder));

      const state = store.getState().reminders;
      expect(state.reminders['r1']).toBeDefined();
      expect(Object.keys(state.remindersByTaskId)).toHaveLength(0);
      expect(Object.keys(state.remindersByEventId)).toHaveLength(0);
    });

    it('should handle rapid successive updates', () => {
      const reminder = createMockReminder({ id: 'r1', snoozeCount: 0 });
      const store = createTestStore({
        reminders: { r1: reminder },
      });

      for (let i = 0; i < 100; i++) {
        store.dispatch(updateReminder({ id: 'r1', snoozeCount: i }));
      }

      const state = store.getState().reminders;
      expect(state.reminders['r1'].snoozeCount).toBe(99);
    });

    it('should handle multiple reminders for same task', () => {
      const store = createTestStore();
      const r1 = createMockReminder({ id: 'r1', taskId: 'task-1', type: 'push' });
      const r2 = createMockReminder({ id: 'r2', taskId: 'task-1', type: 'email' });
      const r3 = createMockReminder({ id: 'r3', taskId: 'task-1', type: 'inApp' });

      store.dispatch(addReminder(r1));
      store.dispatch(addReminder(r2));
      store.dispatch(addReminder(r3));

      const state = store.getState().reminders;
      expect(state.remindersByTaskId['task-1']).toHaveLength(3);
      expect(state.remindersByTaskId['task-1']).toEqual(['r1', 'r2', 'r3']);
    });

    it('should handle all reminder types', () => {
      const store = createTestStore();
      const pushReminder = createMockReminder({ id: 'r1', type: 'push' });
      const emailReminder = createMockReminder({ id: 'r2', type: 'email' });
      const inAppReminder = createMockReminder({ id: 'r3', type: 'inApp' });

      store.dispatch(setReminders([pushReminder, emailReminder, inAppReminder]));

      const state = store.getState().reminders;
      expect(state.reminders['r1'].type).toBe('push');
      expect(state.reminders['r2'].type).toBe('email');
      expect(state.reminders['r3'].type).toBe('inApp');
    });

    it('should handle all reminder statuses', () => {
      const store = createTestStore();
      const pending = createMockReminder({ id: 'r1', status: 'pending' });
      const triggered = createMockReminder({ id: 'r2', status: 'triggered' });
      const dismissed = createMockReminder({ id: 'r3', status: 'dismissed' });
      const snoozed = createMockReminder({ id: 'r4', status: 'snoozed' });

      store.dispatch(setReminders([pending, triggered, dismissed, snoozed]));

      const state = store.getState().reminders;
      expect(state.reminders['r1'].status).toBe('pending');
      expect(state.reminders['r2'].status).toBe('triggered');
      expect(state.reminders['r3'].status).toBe('dismissed');
      expect(state.reminders['r4'].status).toBe('snoozed');
    });
  });
});
