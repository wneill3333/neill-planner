/**
 * Sync Feature Exports
 *
 * Central export point for sync-related functionality
 */

export {
  setOnlineStatus,
  addConflicts,
  clearConflicts,
  removeConflicts,
  setSyncStatus,
  selectIsOnline,
  selectConflicts,
  selectSyncStatus,
  selectHasConflicts,
  selectConflictCount,
} from './syncSlice';

export type { SyncState } from './syncSlice';
