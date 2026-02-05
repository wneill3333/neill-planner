/**
 * Sync Services Index
 *
 * Central export point for all offline sync functionality.
 * Provides IndexedDB-based local storage and sync queue management.
 */

// =============================================================================
// Local Database
// =============================================================================
export {
  NeillPlannerDB,
  localDb,
  clearAllLocalData,
  clearUserData,
  getDatabaseStats,
  isDatabaseReady,
  resetDatabase,
} from './localDatabase';

// =============================================================================
// Sync Helpers
// =============================================================================
export type {
  SyncCollection,
  CollectionDataType,
  LocalQueryOptions,
} from './syncHelpers';

export {
  isOnline,
  checkConnectivity,
  saveToLocal,
  saveMultipleToLocal,
  getFromLocal,
  getAllFromLocal,
  queryFromLocal,
  deleteFromLocal,
  deleteMultipleFromLocal,
  clearLocalData,
  clearUserDataFromCollection,
  getLastSyncTime,
  setLastSyncTime,
  clearSyncTimestamps,
} from './syncHelpers';

// =============================================================================
// Sync Queue
// =============================================================================
export type {
  QueueOperation,
  QueueCollection,
  QueueItemStatus,
  AddToQueueInput,
} from './syncQueue';

export {
  addToQueue,
  getQueueItems,
  getPendingQueueItems,
  getFailedItems,
  markAsSyncing,
  markAsFailed,
  markAsPending,
  removeFromQueue,
  incrementRetryCount,
  getPendingCount,
  getQueueCount,
  clearQueue,
  removeExceededRetries,
  getQueueItemsByCollection,
} from './syncQueue';

// =============================================================================
// Sync Manager
// =============================================================================
export type {
  SyncProgress,
  SyncItemResult,
  SyncResult,
  SyncHandler,
} from './syncManager';

export {
  registerSyncHandler,
  unregisterSyncHandler,
  detectOnlineStatus,
  onStatusChange,
  getSyncProgress,
  onSyncProgress,
  initializeSyncManager,
  cleanupSyncManager,
  processQueue,
  forceSync,
  isSyncInProgress,
  isSyncManagerInitialized,
} from './syncManager';
