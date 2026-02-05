/**
 * Sync Slice
 *
 * Redux Toolkit slice for sync state management.
 * Handles online/offline status, conflicts, and sync status.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SyncStatus } from '../../types/common.types';
import type { ConflictItem } from '../../types/sync.types';
import type { RootState } from '../../store/store';

// =============================================================================
// Types
// =============================================================================

/**
 * State shape for the sync slice
 */
export interface SyncState {
  /** Whether the app is currently online */
  isOnline: boolean;
  /** Current sync conflicts awaiting resolution */
  conflicts: ConflictItem[];
  /** Current sync status */
  syncStatus: SyncStatus;
}

// =============================================================================
// Initial State
// =============================================================================

export const initialState: SyncState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  conflicts: [],
  syncStatus: 'synced',
};

// =============================================================================
// Slice
// =============================================================================

export const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    /**
     * Set online/offline status
     */
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      // Update sync status based on online state
      if (!action.payload) {
        state.syncStatus = 'offline';
      } else if (state.syncStatus === 'offline') {
        state.syncStatus = 'pending';
      }
    },

    /**
     * Add conflicts to the queue
     */
    addConflicts: (state, action: PayloadAction<ConflictItem[]>) => {
      // Avoid duplicates by checking conflict IDs
      const existingIds = new Set(state.conflicts.map((c) => c.id));
      const newConflicts = action.payload.filter((c) => !existingIds.has(c.id));
      state.conflicts.push(...newConflicts);

      // Update sync status if we have conflicts
      if (state.conflicts.length > 0) {
        state.syncStatus = 'error';
      }
    },

    /**
     * Clear all conflicts (after resolution)
     */
    clearConflicts: (state) => {
      state.conflicts = [];
      // Reset sync status if we're online
      if (state.isOnline) {
        state.syncStatus = 'synced';
      }
    },

    /**
     * Remove specific conflicts by ID
     */
    removeConflicts: (state, action: PayloadAction<string[]>) => {
      const idsToRemove = new Set(action.payload);
      state.conflicts = state.conflicts.filter((c) => !idsToRemove.has(c.id));

      // Update sync status if all conflicts are resolved
      if (state.conflicts.length === 0 && state.isOnline) {
        state.syncStatus = 'synced';
      }
    },

    /**
     * Set sync status
     */
    setSyncStatus: (state, action: PayloadAction<SyncStatus>) => {
      state.syncStatus = action.payload;
    },
  },
});

// =============================================================================
// Actions
// =============================================================================

export const {
  setOnlineStatus,
  addConflicts,
  clearConflicts,
  removeConflicts,
  setSyncStatus,
} = syncSlice.actions;

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select online status
 */
export const selectIsOnline = (state: RootState): boolean => state.sync.isOnline;

/**
 * Select all conflicts
 */
export const selectConflicts = (state: RootState): ConflictItem[] => state.sync.conflicts;

/**
 * Select sync status
 */
export const selectSyncStatus = (state: RootState): SyncStatus => state.sync.syncStatus;

/**
 * Select whether there are any conflicts
 */
export const selectHasConflicts = (state: RootState): boolean => state.sync.conflicts.length > 0;

/**
 * Select conflict count
 */
export const selectConflictCount = (state: RootState): number => state.sync.conflicts.length;

// =============================================================================
// Reducer Export
// =============================================================================

export default syncSlice.reducer;
