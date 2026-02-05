/**
 * Sync Manager Service
 *
 * Orchestrates synchronization between local IndexedDB and Firebase.
 * Handles online/offline detection, queue processing, and retry logic.
 */

import {
  getPendingQueueItems,
  getFailedItems,
  markAsSyncing,
  markAsFailed,
  removeFromQueue,
  incrementRetryCount,
  getPendingCount,
} from './syncQueue';
import { isOnline, checkConnectivity } from './syncHelpers';
import type { SyncQueueItem } from '../../types';

// =============================================================================
// Configuration
// =============================================================================

/** Maximum number of retry attempts for failed sync operations */
const MAX_RETRIES = 3;

/** Initial delay for exponential backoff (in ms) */
const INITIAL_BACKOFF_DELAY = 1000;

/** Maximum delay for exponential backoff (in ms) */
const MAX_BACKOFF_DELAY = 30000;

/** Interval for periodic sync checks when online (in ms) */
const SYNC_CHECK_INTERVAL = 30000;

// =============================================================================
// State Management
// =============================================================================

/** Current online status */
let currentOnlineStatus = true;

/** Whether the sync manager is initialized */
let isInitialized = false;

/** Whether a sync operation is currently in progress */
let isSyncing = false;

/** Promise for current sync operation (used to serialize forceSync calls) */
let syncPromise: Promise<SyncResult> | null = null;

/** Interval ID for periodic sync checks */
let syncIntervalId: ReturnType<typeof setInterval> | null = null;

/** Event listeners for online/offline status changes */
type StatusChangeCallback = (isOnline: boolean) => void;
const statusChangeListeners: Set<StatusChangeCallback> = new Set();

/** Event listeners for sync progress updates */
type SyncProgressCallback = (progress: SyncProgress) => void;
const syncProgressListeners: Set<SyncProgressCallback> = new Set();

// =============================================================================
// Type Definitions
// =============================================================================

/** Progress information for sync operations */
export interface SyncProgress {
  /** Total items to sync */
  total: number;
  /** Items successfully synced */
  synced: number;
  /** Items that failed to sync */
  failed: number;
  /** Whether sync is in progress */
  inProgress: boolean;
  /** Last sync timestamp */
  lastSyncTime: Date | null;
}

/** Result of a single item sync operation */
export interface SyncItemResult {
  /** The queue item that was processed */
  item: SyncQueueItem;
  /** Whether the sync was successful */
  success: boolean;
  /** Error message if sync failed */
  error?: string;
}

/** Result of a full queue processing operation */
export interface SyncResult {
  /** Total items processed */
  total: number;
  /** Items successfully synced */
  synced: number;
  /** Items that failed to sync */
  failed: number;
  /** Individual results for each item */
  results: SyncItemResult[];
}

/** Handler function for syncing individual items to Firebase */
export type SyncHandler = (item: SyncQueueItem) => Promise<boolean>;

// =============================================================================
// Sync Handlers Registry
// =============================================================================

/** Registry of sync handlers by collection */
const syncHandlers: Map<string, SyncHandler> = new Map();

/**
 * Register a sync handler for a collection.
 * The handler will be called to sync items from that collection to Firebase.
 *
 * @param collection - The collection name
 * @param handler - The handler function
 */
export function registerSyncHandler(collection: string, handler: SyncHandler): void {
  syncHandlers.set(collection, handler);
  console.log(`[SyncManager] Registered sync handler for ${collection}`);
}

/**
 * Unregister a sync handler for a collection.
 *
 * @param collection - The collection name
 */
export function unregisterSyncHandler(collection: string): void {
  syncHandlers.delete(collection);
  console.log(`[SyncManager] Unregistered sync handler for ${collection}`);
}

// =============================================================================
// Online/Offline Detection
// =============================================================================

/**
 * Get the current online status.
 *
 * @returns true if online, false if offline
 */
export function detectOnlineStatus(): boolean {
  return currentOnlineStatus;
}

/**
 * Handle browser online event.
 */
function handleOnline(): void {
  console.log('[SyncManager] Browser went online');
  currentOnlineStatus = true;
  notifyStatusChange(true);

  // Trigger sync when coming back online
  processQueue().catch((error) => {
    console.error('[SyncManager] Error processing queue on reconnect:', error);
  });
}

/**
 * Handle browser offline event.
 */
function handleOffline(): void {
  console.log('[SyncManager] Browser went offline');
  currentOnlineStatus = false;
  notifyStatusChange(false);
}

/**
 * Notify all status change listeners.
 */
function notifyStatusChange(isOnline: boolean): void {
  statusChangeListeners.forEach((callback) => {
    try {
      callback(isOnline);
    } catch (error) {
      console.error('[SyncManager] Error in status change callback:', error);
    }
  });
}

/**
 * Subscribe to online/offline status changes.
 *
 * @param callback - Function to call when status changes
 * @returns Unsubscribe function
 */
export function onStatusChange(callback: StatusChangeCallback): () => void {
  statusChangeListeners.add(callback);
  return () => {
    statusChangeListeners.delete(callback);
  };
}

// =============================================================================
// Sync Progress Tracking
// =============================================================================

/** Current sync progress state */
let currentProgress: SyncProgress = {
  total: 0,
  synced: 0,
  failed: 0,
  inProgress: false,
  lastSyncTime: null,
};

/**
 * Get the current sync progress.
 *
 * @returns Current sync progress
 */
export function getSyncProgress(): SyncProgress {
  return { ...currentProgress };
}

/**
 * Update and notify sync progress.
 */
function updateProgress(updates: Partial<SyncProgress>): void {
  currentProgress = { ...currentProgress, ...updates };
  notifySyncProgress(currentProgress);
}

/**
 * Notify all sync progress listeners.
 */
function notifySyncProgress(progress: SyncProgress): void {
  syncProgressListeners.forEach((callback) => {
    try {
      callback(progress);
    } catch (error) {
      console.error('[SyncManager] Error in sync progress callback:', error);
    }
  });
}

/**
 * Subscribe to sync progress updates.
 *
 * @param callback - Function to call when progress updates
 * @returns Unsubscribe function
 */
export function onSyncProgress(callback: SyncProgressCallback): () => void {
  syncProgressListeners.add(callback);
  return () => {
    syncProgressListeners.delete(callback);
  };
}

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize the sync manager.
 * Sets up online/offline listeners and starts periodic sync checks.
 */
export function initializeSyncManager(): void {
  if (isInitialized) {
    console.log('[SyncManager] Already initialized');
    return;
  }

  // Set initial online status
  currentOnlineStatus = isOnline();
  console.log(`[SyncManager] Initial online status: ${currentOnlineStatus}`);

  // Add event listeners for online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    console.log('[SyncManager] Online/offline listeners attached');
  }

  // Start periodic sync checks
  startPeriodicSyncChecks();

  isInitialized = true;
  console.log('[SyncManager] Initialized');

  // If online, process any pending queue items
  if (currentOnlineStatus) {
    processQueue().catch((error) => {
      console.error('[SyncManager] Error processing initial queue:', error);
    });
  }
}

/**
 * Cleanup the sync manager.
 * Removes event listeners and stops periodic checks.
 */
export function cleanupSyncManager(): void {
  if (!isInitialized) {
    return;
  }

  // Remove event listeners
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  }

  // Stop periodic sync checks
  stopPeriodicSyncChecks();

  // Clear listeners
  statusChangeListeners.clear();
  syncProgressListeners.clear();

  isInitialized = false;
  console.log('[SyncManager] Cleaned up');
}

/**
 * Start periodic sync checks.
 * Checks for pending items and processes them when online.
 */
function startPeriodicSyncChecks(): void {
  if (syncIntervalId) {
    return;
  }

  syncIntervalId = setInterval(async () => {
    if (!currentOnlineStatus || isSyncing) {
      return;
    }

    const pendingCount = await getPendingCount();
    if (pendingCount > 0) {
      console.log(`[SyncManager] Periodic check: ${pendingCount} pending items`);
      processQueue().catch((error) => {
        console.error('[SyncManager] Error in periodic sync:', error);
      });
    }
  }, SYNC_CHECK_INTERVAL);

  console.log(`[SyncManager] Started periodic sync checks (every ${SYNC_CHECK_INTERVAL}ms)`);
}

/**
 * Stop periodic sync checks.
 */
function stopPeriodicSyncChecks(): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    console.log('[SyncManager] Stopped periodic sync checks');
  }
}

// =============================================================================
// Queue Processing
// =============================================================================

/**
 * Calculate backoff delay using exponential backoff with jitter.
 *
 * @param retryCount - Number of previous retry attempts
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(retryCount: number): number {
  // Exponential backoff: 2^retryCount * initialDelay
  const exponentialDelay = Math.pow(2, retryCount) * INITIAL_BACKOFF_DELAY;

  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, MAX_BACKOFF_DELAY);

  // Add jitter (random variation of +/- 10%)
  const jitter = cappedDelay * 0.1 * (Math.random() * 2 - 1);

  return Math.round(cappedDelay + jitter);
}

/**
 * Sleep for a specified duration.
 *
 * @param ms - Duration in milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process a single queue item.
 *
 * @param item - The queue item to process
 * @returns Result of the sync operation
 */
async function processQueueItem(item: SyncQueueItem): Promise<SyncItemResult> {
  const handler = syncHandlers.get(item.collection);

  if (!handler) {
    console.warn(`[SyncManager] No handler registered for collection: ${item.collection}`);
    return {
      item,
      success: false,
      error: `No sync handler for collection: ${item.collection}`,
    };
  }

  try {
    // Mark item as syncing
    await markAsSyncing(item.id);

    // Execute the sync handler
    const success = await handler(item);

    if (success) {
      // Remove from queue on success
      await removeFromQueue(item.id);
      console.log(`[SyncManager] Successfully synced: ${item.operation} ${item.collection}/${item.documentId}`);
      return { item, success: true };
    } else {
      // Mark as failed and handle retry
      await markAsFailed(item.id);
      return {
        item,
        success: false,
        error: 'Sync handler returned false',
      };
    }
  } catch (error) {
    console.error(`[SyncManager] Error syncing item ${item.id}:`, error);
    await markAsFailed(item.id);
    return {
      item,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process all pending items in the sync queue.
 * Implements exponential backoff for failed items.
 *
 * @returns Result of the sync operation
 */
export async function processQueue(): Promise<SyncResult> {
  // Check if already syncing or offline
  if (isSyncing) {
    console.log('[SyncManager] Sync already in progress');
    return { total: 0, synced: 0, failed: 0, results: [] };
  }

  if (!currentOnlineStatus) {
    console.log('[SyncManager] Offline, skipping queue processing');
    return { total: 0, synced: 0, failed: 0, results: [] };
  }

  // Verify actual connectivity
  const isConnected = await checkConnectivity();
  if (!isConnected) {
    console.log('[SyncManager] No actual connectivity, skipping queue processing');
    currentOnlineStatus = false;
    notifyStatusChange(false);
    return { total: 0, synced: 0, failed: 0, results: [] };
  }

  isSyncing = true;
  const results: SyncItemResult[] = [];

  try {
    // Get pending items
    const pendingItems = await getPendingQueueItems();

    // Also get failed items that can be retried
    const failedItems = await getFailedItems(MAX_RETRIES);

    // Combine and process all items
    const allItems = [...pendingItems, ...failedItems];

    if (allItems.length === 0) {
      console.log('[SyncManager] No items to sync');
      return { total: 0, synced: 0, failed: 0, results: [] };
    }

    console.log(`[SyncManager] Processing ${allItems.length} items`);

    // Update progress
    updateProgress({
      total: allItems.length,
      synced: 0,
      failed: 0,
      inProgress: true,
    });

    let syncedCount = 0;
    let failedCount = 0;

    // Process items one at a time to maintain order
    for (const item of allItems) {
      // Check if still online
      if (!currentOnlineStatus) {
        console.log('[SyncManager] Went offline during sync, stopping');
        break;
      }

      // Apply backoff delay for retries
      if (item.retryCount > 0) {
        const delay = calculateBackoffDelay(item.retryCount);
        console.log(`[SyncManager] Retry ${item.retryCount} for ${item.id}, waiting ${delay}ms`);
        await sleep(delay);
      }

      const result = await processQueueItem(item);
      results.push(result);

      if (result.success) {
        syncedCount++;
      } else {
        failedCount++;
        // Increment retry count for failed items
        if (item.retryCount < MAX_RETRIES) {
          await incrementRetryCount(item.id);
        }
      }

      // Update progress
      updateProgress({
        synced: syncedCount,
        failed: failedCount,
      });
    }

    // Update final progress
    updateProgress({
      inProgress: false,
      lastSyncTime: new Date(),
    });

    console.log(`[SyncManager] Sync complete: ${syncedCount} synced, ${failedCount} failed`);

    return {
      total: allItems.length,
      synced: syncedCount,
      failed: failedCount,
      results,
    };
  } catch (error) {
    console.error('[SyncManager] Error processing queue:', error);
    updateProgress({ inProgress: false });
    throw error;
  } finally {
    isSyncing = false;
  }
}

/**
 * Force a sync attempt, even if one is in progress.
 * Useful for user-initiated sync requests.
 * Uses Promise-based serialization to prevent race conditions.
 *
 * @returns Result of the sync operation
 */
export async function forceSync(): Promise<SyncResult> {
  // If already syncing, wait for current sync to complete and return its result
  if (syncPromise) {
    console.log('[SyncManager] Sync already in progress, waiting for completion');
    return syncPromise;
  }

  if (!isInitialized) {
    console.warn('[SyncManager] Not initialized, initializing now');
    initializeSyncManager();
  }

  // Refresh online status
  currentOnlineStatus = isOnline();

  // Start new sync and store the promise
  syncPromise = processQueue();

  try {
    const result = await syncPromise;
    return result;
  } finally {
    syncPromise = null;
  }
}

/**
 * Check if the sync manager is currently syncing.
 *
 * @returns true if syncing, false otherwise
 */
export function isSyncInProgress(): boolean {
  return isSyncing;
}

/**
 * Check if the sync manager is initialized.
 *
 * @returns true if initialized, false otherwise
 */
export function isSyncManagerInitialized(): boolean {
  return isInitialized;
}
