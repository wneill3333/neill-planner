/**
 * Reminder Async Thunks
 *
 * Redux Toolkit async thunks for reminder CRUD operations,
 * notification permission handling, and device registration.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  Reminder,
  CreateReminderInput,
  UpdateReminderInput,
  SnoozeOption,
  NotificationPermissionStatus,
} from '../../types';
import * as remindersService from '../../services/firebase/reminders.service';
import * as fcmService from '../../services/notifications/fcm.service';
import type { RootState } from '../../store';

// =============================================================================
// Types
// =============================================================================

/**
 * Error response from thunks
 */
export interface ThunkError {
  message: string;
  code?: string;
}

/**
 * Result from device registration
 */
export interface RegisterDeviceResult {
  permissionStatus: NotificationPermissionStatus;
  token: string | null;
}

// =============================================================================
// Reminder CRUD Thunks
// =============================================================================

/**
 * Fetch all reminders for a user
 */
export const fetchUserReminders = createAsyncThunk<
  Reminder[],
  { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('reminders/fetchUserReminders', async ({ userId }, { rejectWithValue }) => {
  try {
    const reminders = await remindersService.getUserReminders(userId);
    return reminders;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch reminders';
    return rejectWithValue({ message });
  }
});

/**
 * Fetch reminders for a specific task or event
 */
export const fetchRemindersForItem = createAsyncThunk<
  Reminder[],
  { itemId: string; itemType: 'task' | 'event'; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('reminders/fetchRemindersForItem', async ({ itemId, itemType, userId }, { rejectWithValue }) => {
  try {
    const reminders = await remindersService.getRemindersForItem(itemId, itemType, userId);
    return reminders;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch reminders for item';
    return rejectWithValue({ message });
  }
});

/**
 * Create a new reminder
 */
export const createReminderAsync = createAsyncThunk<
  Reminder,
  { input: CreateReminderInput; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('reminders/createReminder', async ({ input, userId }, { rejectWithValue }) => {
  try {
    const reminder = await remindersService.createReminder(input, userId);
    return reminder;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create reminder';
    return rejectWithValue({ message });
  }
});

/**
 * Update an existing reminder
 */
export const updateReminderAsync = createAsyncThunk<
  Reminder,
  { input: UpdateReminderInput; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('reminders/updateReminder', async ({ input, userId }, { rejectWithValue }) => {
  try {
    const reminder = await remindersService.updateReminder(input, userId);
    return reminder;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update reminder';
    return rejectWithValue({ message });
  }
});

/**
 * Delete a reminder
 */
export const deleteReminderAsync = createAsyncThunk<
  string,
  { reminderId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('reminders/deleteReminder', async ({ reminderId, userId }, { rejectWithValue }) => {
  try {
    await remindersService.deleteReminder(reminderId, userId);
    return reminderId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete reminder';
    return rejectWithValue({ message });
  }
});

// =============================================================================
// Snooze and Dismiss Thunks
// =============================================================================

/**
 * Snooze a reminder
 */
export const snoozeReminderAsync = createAsyncThunk<
  Reminder,
  { reminderId: string; snoozeMinutes: SnoozeOption; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('reminders/snoozeReminder', async ({ reminderId, snoozeMinutes, userId }, { rejectWithValue }) => {
  try {
    const reminder = await remindersService.snoozeReminder(reminderId, snoozeMinutes, userId);
    return reminder;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to snooze reminder';
    return rejectWithValue({ message });
  }
});

/**
 * Dismiss a reminder
 */
export const dismissReminderAsync = createAsyncThunk<
  Reminder,
  { reminderId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('reminders/dismissReminder', async ({ reminderId, userId }, { rejectWithValue }) => {
  try {
    const reminder = await remindersService.dismissReminder(reminderId, userId);
    return reminder;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to dismiss reminder';
    return rejectWithValue({ message });
  }
});

// =============================================================================
// FCM / Push Notification Thunks
// =============================================================================

/**
 * Request notification permission
 */
export const requestPermissionAsync = createAsyncThunk<
  NotificationPermissionStatus,
  void,
  { state: RootState; rejectValue: ThunkError }
>('reminders/requestPermission', async (_, { rejectWithValue }) => {
  try {
    const status = await fcmService.requestNotificationPermission();
    return status;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to request permission';
    return rejectWithValue({ message });
  }
});

/**
 * Register device for push notifications
 *
 * This performs the complete registration flow:
 * 1. Request notification permission
 * 2. Get FCM device token
 * 3. Save token to Firestore
 */
export const registerDeviceAsync = createAsyncThunk<
  RegisterDeviceResult,
  { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('reminders/registerDevice', async ({ userId }, { rejectWithValue }) => {
  try {
    const result = await fcmService.registerForPushNotifications(userId);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to register device';
    return rejectWithValue({ message });
  }
});

/**
 * Unregister device from push notifications
 *
 * Called when user logs out or disables notifications.
 */
export const unregisterDeviceAsync = createAsyncThunk<
  void,
  void,
  { state: RootState; rejectValue: ThunkError }
>('reminders/unregisterDevice', async (_, { rejectWithValue }) => {
  try {
    await fcmService.unregisterFromPushNotifications();
    return; // Explicit void return for clarity
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to unregister device';
    return rejectWithValue({ message });
  }
});

/**
 * Get current permission status (synchronous check)
 */
export const checkPermissionStatus = createAsyncThunk<
  NotificationPermissionStatus,
  void,
  { state: RootState; rejectValue: ThunkError }
>('reminders/checkPermissionStatus', async () => {
  return fcmService.getPermissionStatus();
});

// =============================================================================
// Bulk Operations
// =============================================================================

/**
 * Fetch pending reminders for a user
 */
export const fetchPendingReminders = createAsyncThunk<
  Reminder[],
  { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('reminders/fetchPendingReminders', async ({ userId }, { rejectWithValue }) => {
  try {
    const reminders = await remindersService.getPendingReminders(userId);
    return reminders;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch pending reminders';
    return rejectWithValue({ message });
  }
});
