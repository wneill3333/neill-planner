/**
 * Reminder Slice
 *
 * Redux Toolkit slice for reminder state management.
 * Handles reminders, notification permissions, device tokens, and FCM integration.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  Reminder,
  ReminderNotification,
  NotificationPermissionStatus,
  SyncStatus,
} from '../../types';
import type { RootState } from '../../store';
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
} from './reminderThunks';

// =============================================================================
// Types
// =============================================================================

/**
 * State shape for the reminders slice
 */
export interface RemindersState {
  /** Normalized reminders storage - reminders indexed by ID */
  reminders: Record<string, Reminder>;
  /** Reminders indexed by task ID */
  remindersByTaskId: Record<string, string[]>;
  /** Reminders indexed by event ID */
  remindersByEventId: Record<string, string[]>;
  /** Active notifications to be displayed in-app */
  activeNotifications: ReminderNotification[];
  /** Notification permission status */
  permissionStatus: NotificationPermissionStatus;
  /** FCM device token */
  deviceToken: string | null;
  /** Whether device is registered for push notifications */
  isRegistered: boolean;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Sync status with backend */
  syncStatus: SyncStatus;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Add a reminder ID to an item's reminder index
 */
function addReminderToItemIndex(
  index: Record<string, string[]>,
  itemId: string | null,
  reminderId: string
): void {
  if (!itemId) return;
  if (!index[itemId]) {
    index[itemId] = [];
  }
  if (!index[itemId].includes(reminderId)) {
    index[itemId].push(reminderId);
  }
}

/**
 * Remove a reminder ID from an item's reminder index
 */
function removeReminderFromItemIndex(
  index: Record<string, string[]>,
  itemId: string | null,
  reminderId: string
): void {
  if (!itemId || !index[itemId]) return;
  const idx = index[itemId].indexOf(reminderId);
  if (idx > -1) {
    index[itemId].splice(idx, 1);
  }
  // Clean up empty arrays
  if (index[itemId].length === 0) {
    delete index[itemId];
  }
}

// =============================================================================
// Initial State
// =============================================================================

export const initialState: RemindersState = {
  reminders: {},
  remindersByTaskId: {},
  remindersByEventId: {},
  activeNotifications: [],
  permissionStatus: 'default',
  deviceToken: null,
  isRegistered: false,
  loading: false,
  error: null,
  syncStatus: 'synced',
};

// =============================================================================
// Slice
// =============================================================================

export const reminderSlice = createSlice({
  name: 'reminders',
  initialState,
  reducers: {
    /**
     * Set reminders (replace all)
     */
    setReminders: (state, action: PayloadAction<Reminder[]>) => {
      // Clear existing indexes
      state.reminders = {};
      state.remindersByTaskId = {};
      state.remindersByEventId = {};

      // Add all reminders
      for (const reminder of action.payload) {
        state.reminders[reminder.id] = reminder;

        if (reminder.taskId) {
          addReminderToItemIndex(state.remindersByTaskId, reminder.taskId, reminder.id);
        }
        if (reminder.eventId) {
          addReminderToItemIndex(state.remindersByEventId, reminder.eventId, reminder.id);
        }
      }
    },

    /**
     * Add a single reminder
     */
    addReminder: (state, action: PayloadAction<Reminder>) => {
      const reminder = action.payload;
      state.reminders[reminder.id] = reminder;

      if (reminder.taskId) {
        addReminderToItemIndex(state.remindersByTaskId, reminder.taskId, reminder.id);
      }
      if (reminder.eventId) {
        addReminderToItemIndex(state.remindersByEventId, reminder.eventId, reminder.id);
      }
    },

    /**
     * Update an existing reminder
     */
    updateReminder: (state, action: PayloadAction<Partial<Reminder> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      const existingReminder = state.reminders[id];

      if (!existingReminder) return;

      // Apply updates
      state.reminders[id] = { ...existingReminder, ...updates };
    },

    /**
     * Remove a reminder
     */
    removeReminder: (state, action: PayloadAction<string>) => {
      const reminderId = action.payload;
      const reminder = state.reminders[reminderId];

      if (!reminder) return;

      // Remove from item indexes
      if (reminder.taskId) {
        removeReminderFromItemIndex(state.remindersByTaskId, reminder.taskId, reminderId);
      }
      if (reminder.eventId) {
        removeReminderFromItemIndex(state.remindersByEventId, reminder.eventId, reminderId);
      }

      // Remove reminder
      delete state.reminders[reminderId];
    },

    /**
     * Set permission status
     */
    setPermissionStatus: (state, action: PayloadAction<NotificationPermissionStatus>) => {
      state.permissionStatus = action.payload;
    },

    /**
     * Set device token
     */
    setDeviceToken: (state, action: PayloadAction<string | null>) => {
      state.deviceToken = action.payload;
      state.isRegistered = action.payload !== null;
    },

    /**
     * Add an active notification
     */
    addActiveNotification: (state, action: PayloadAction<ReminderNotification>) => {
      // Prevent duplicates
      const exists = state.activeNotifications.some(
        (n) => n.reminderId === action.payload.reminderId
      );
      if (!exists) {
        state.activeNotifications.push(action.payload);
      }
    },

    /**
     * Remove an active notification
     */
    removeActiveNotification: (state, action: PayloadAction<string>) => {
      state.activeNotifications = state.activeNotifications.filter(
        (n) => n.reminderId !== action.payload
      );
    },

    /**
     * Clear all active notifications
     */
    clearActiveNotifications: (state) => {
      state.activeNotifications = [];
    },

    /**
     * Mark an active notification as dismissed
     */
    dismissActiveNotification: (state, action: PayloadAction<string>) => {
      const notification = state.activeNotifications.find(
        (n) => n.reminderId === action.payload
      );
      if (notification) {
        notification.isDismissed = true;
      }
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Set error message
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /**
     * Set sync status
     */
    setSyncStatus: (state, action: PayloadAction<SyncStatus>) => {
      state.syncStatus = action.payload;
    },

    /**
     * Clear all reminders (useful for logout)
     */
    clearReminders: (state) => {
      state.reminders = {};
      state.remindersByTaskId = {};
      state.remindersByEventId = {};
      state.activeNotifications = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ==========================================================================
    // fetchUserReminders
    // ==========================================================================
    builder
      .addCase(fetchUserReminders.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.syncStatus = 'syncing';
      })
      .addCase(fetchUserReminders.fulfilled, (state, action) => {
        state.loading = false;
        state.syncStatus = 'synced';

        // Clear and repopulate
        state.reminders = {};
        state.remindersByTaskId = {};
        state.remindersByEventId = {};

        for (const reminder of action.payload) {
          state.reminders[reminder.id] = reminder;

          if (reminder.taskId) {
            addReminderToItemIndex(state.remindersByTaskId, reminder.taskId, reminder.id);
          }
          if (reminder.eventId) {
            addReminderToItemIndex(state.remindersByEventId, reminder.eventId, reminder.id);
          }
        }
      })
      .addCase(fetchUserReminders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch reminders';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // fetchRemindersForItem
    // ==========================================================================
    builder
      .addCase(fetchRemindersForItem.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(fetchRemindersForItem.fulfilled, (state, action) => {
        state.syncStatus = 'synced';

        for (const reminder of action.payload) {
          state.reminders[reminder.id] = reminder;

          if (reminder.taskId) {
            addReminderToItemIndex(state.remindersByTaskId, reminder.taskId, reminder.id);
          }
          if (reminder.eventId) {
            addReminderToItemIndex(state.remindersByEventId, reminder.eventId, reminder.id);
          }
        }
      })
      .addCase(fetchRemindersForItem.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to fetch reminders for item';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // createReminderAsync
    // ==========================================================================
    builder
      .addCase(createReminderAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(createReminderAsync.fulfilled, (state, action) => {
        const reminder = action.payload;
        state.reminders[reminder.id] = reminder;

        if (reminder.taskId) {
          addReminderToItemIndex(state.remindersByTaskId, reminder.taskId, reminder.id);
        }
        if (reminder.eventId) {
          addReminderToItemIndex(state.remindersByEventId, reminder.eventId, reminder.id);
        }

        state.syncStatus = 'synced';
      })
      .addCase(createReminderAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to create reminder';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // updateReminderAsync
    // ==========================================================================
    builder
      .addCase(updateReminderAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(updateReminderAsync.fulfilled, (state, action) => {
        const updatedReminder = action.payload;
        state.reminders[updatedReminder.id] = updatedReminder;
        state.syncStatus = 'synced';
      })
      .addCase(updateReminderAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to update reminder';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // deleteReminderAsync
    // ==========================================================================
    builder
      .addCase(deleteReminderAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(deleteReminderAsync.fulfilled, (state, action) => {
        const reminderId = action.payload;
        const reminder = state.reminders[reminderId];

        if (reminder) {
          if (reminder.taskId) {
            removeReminderFromItemIndex(state.remindersByTaskId, reminder.taskId, reminderId);
          }
          if (reminder.eventId) {
            removeReminderFromItemIndex(state.remindersByEventId, reminder.eventId, reminderId);
          }
          delete state.reminders[reminderId];
        }

        state.syncStatus = 'synced';
      })
      .addCase(deleteReminderAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to delete reminder';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // snoozeReminderAsync
    // ==========================================================================
    builder
      .addCase(snoozeReminderAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(snoozeReminderAsync.fulfilled, (state, action) => {
        const updatedReminder = action.payload;
        state.reminders[updatedReminder.id] = updatedReminder;

        // Remove from active notifications
        state.activeNotifications = state.activeNotifications.filter(
          (n) => n.reminderId !== updatedReminder.id
        );

        state.syncStatus = 'synced';
      })
      .addCase(snoozeReminderAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to snooze reminder';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // dismissReminderAsync
    // ==========================================================================
    builder
      .addCase(dismissReminderAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(dismissReminderAsync.fulfilled, (state, action) => {
        const updatedReminder = action.payload;
        state.reminders[updatedReminder.id] = updatedReminder;

        // Remove from active notifications
        state.activeNotifications = state.activeNotifications.filter(
          (n) => n.reminderId !== updatedReminder.id
        );

        state.syncStatus = 'synced';
      })
      .addCase(dismissReminderAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to dismiss reminder';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // requestPermissionAsync
    // ==========================================================================
    builder
      .addCase(requestPermissionAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(requestPermissionAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.permissionStatus = action.payload;
      })
      .addCase(requestPermissionAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to request permission';
      });

    // ==========================================================================
    // registerDeviceAsync
    // ==========================================================================
    builder
      .addCase(registerDeviceAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerDeviceAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.permissionStatus = action.payload.permissionStatus;
        state.deviceToken = action.payload.token;
        state.isRegistered = action.payload.token !== null;
      })
      .addCase(registerDeviceAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to register device';
      });

    // ==========================================================================
    // unregisterDeviceAsync
    // ==========================================================================
    builder
      .addCase(unregisterDeviceAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(unregisterDeviceAsync.fulfilled, (state) => {
        state.loading = false;
        state.deviceToken = null;
        state.isRegistered = false;
      })
      .addCase(unregisterDeviceAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to unregister device';
      });
  },
});

// =============================================================================
// Actions
// =============================================================================

export const {
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
} = reminderSlice.actions;

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select all reminders as an array
 */
export const selectAllReminders = (state: RootState): Reminder[] =>
  Object.values(state.reminders.reminders);

/**
 * Select a reminder by ID
 */
export const selectReminderById = (state: RootState, reminderId: string): Reminder | undefined =>
  state.reminders.reminders[reminderId];

/**
 * Select reminders for a specific task
 */
export const selectRemindersForTask = (state: RootState, taskId: string): Reminder[] => {
  const reminderIds = state.reminders.remindersByTaskId[taskId] || [];
  return reminderIds
    .map((id) => state.reminders.reminders[id])
    .filter((r): r is Reminder => !!r);
};

/**
 * Select reminders for a specific event
 */
export const selectRemindersForEvent = (state: RootState, eventId: string): Reminder[] => {
  const reminderIds = state.reminders.remindersByEventId[eventId] || [];
  return reminderIds
    .map((id) => state.reminders.reminders[id])
    .filter((r): r is Reminder => !!r);
};

/**
 * Select pending reminders
 */
export const selectPendingReminders = (state: RootState): Reminder[] =>
  Object.values(state.reminders.reminders).filter(
    (r) => r.status === 'pending' || r.status === 'snoozed'
  );

/**
 * Select active notifications
 */
export const selectActiveNotifications = (state: RootState): ReminderNotification[] =>
  state.reminders.activeNotifications;

/**
 * Select undismissed active notifications
 */
export const selectUndismissedNotifications = (state: RootState): ReminderNotification[] =>
  state.reminders.activeNotifications.filter((n) => !n.isDismissed);

/**
 * Select permission status
 */
export const selectPermissionStatus = (state: RootState): NotificationPermissionStatus =>
  state.reminders.permissionStatus;

/**
 * Select device token
 */
export const selectDeviceToken = (state: RootState): string | null =>
  state.reminders.deviceToken;

/**
 * Select whether device is registered for push notifications
 */
export const selectIsRegistered = (state: RootState): boolean =>
  state.reminders.isRegistered;

/**
 * Select loading state
 */
export const selectRemindersLoading = (state: RootState): boolean =>
  state.reminders.loading;

/**
 * Select error state
 */
export const selectRemindersError = (state: RootState): string | null =>
  state.reminders.error;

/**
 * Select sync status
 */
export const selectRemindersSyncStatus = (state: RootState): SyncStatus =>
  state.reminders.syncStatus;

/**
 * Select notification count (undismissed)
 */
export const selectNotificationCount = (state: RootState): number =>
  state.reminders.activeNotifications.filter((n) => !n.isDismissed).length;

// =============================================================================
// Reducer Export
// =============================================================================

export default reminderSlice.reducer;
