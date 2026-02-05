/**
 * Sync Queue Service
 *
 * Manages the queue of offline changes pending synchronization.
 * Queued items are persisted in IndexedDB and processed when online.
 */

import { localDb } from './localDatabase';
import type { SyncQueueItem } from '../../types';

// =============================================================================
// Type Definitions
// =============================================================================

/** Operations that can be queued */
export type QueueOperation = SyncQueueItem['operation'];

/** Collections that can be queued */
export type QueueCollection = SyncQueueItem['collection'];

/** Status of a queue item */
export type QueueItemStatus = SyncQueueItem['status'];

/** Input for adding an item to the queue */
export interface AddToQueueInput {
  /** Type of operation */
  operation: QueueOperation;
  /** Collection being modified */
  collection: QueueCollection;
  /** Document ID being modified */
  documentId: string;
  /** Data payload for create/update operations */
  data?: unknown;
}

// =============================================================================
// Queue Operations
// =============================================================================

/**
 * Generate a unique ID for queue items.
 * Uses timestamp + random string for uniqueness.
 */
function generateQueueId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `queue_${timestamp}_${randomPart}`;
}

/**
 * Add an operation to the sync queue.
 * The operation will be processed when the app comes back online.
 *
 * @param input - The operation details to queue
 * @returns The created queue item
 */
export async function addToQueue(input: AddToQueueInput): Promise<SyncQueueItem> {
  const { operation, collection, documentId, data } = input;

  // Validate inputs
  if (!operation || !collection || !documentId) {
    throw new Error('Operation, collection, and documentId are required');
  }

  // For create/update operations, data is required
  if ((operation === 'create' || operation === 'update') && !data) {
    throw new Error('Data is required for create and update operations');
  }

  try {
    // Check for existing pending item for the same document
    const existingItems = await localDb.syncQueue
      .where('documentId')
      .equals(documentId)
      .filter(item => item.status === 'pending' && item.collection === collection)
      .toArray();

    // Handle operation merging/replacement
    if (existingItems.length > 0) {
      const existingItem = existingItems[0];

      // If deleting, remove any pending create/update for this document
      if (operation === 'delete') {
        // If there's a pending create, just remove it (no need to sync at all)
        if (existingItem.operation === 'create') {
          await localDb.syncQueue.delete(existingItem.id);
          console.log(`[SyncQueue] Removed pending create for ${documentId} (deleted before sync)`);
          // Return a synthetic delete item that doesn't need to sync
          return {
            id: generateQueueId(),
            operation: 'delete',
            collection,
            documentId,
            data: null,
            timestamp: Date.now(),
            retryCount: 0,
            status: 'pending',
          };
        }

        // If there's a pending update, replace it with delete
        await localDb.syncQueue.delete(existingItem.id);
        console.log(`[SyncQueue] Replacing pending update with delete for ${documentId}`);
      }

      // If updating, update the existing queue item's data
      if (operation === 'update' && existingItem.operation !== 'delete') {
        const updatedItem: SyncQueueItem = {
          ...existingItem,
          data: { ...(existingItem.data as object || {}), ...(data as object) },
          timestamp: Date.now(),
        };
        await localDb.syncQueue.put(updatedItem);
        console.log(`[SyncQueue] Merged update for ${documentId}`);
        return updatedItem;
      }

      // If creating when there's already a pending create, merge the data
      if (operation === 'create' && existingItem.operation === 'create') {
        const updatedItem: SyncQueueItem = {
          ...existingItem,
          data: { ...(existingItem.data as object || {}), ...(data as object) },
          timestamp: Date.now(),
        };
        await localDb.syncQueue.put(updatedItem);
        console.log(`[SyncQueue] Merged create for ${documentId}`);
        return updatedItem;
      }
    }

    // Create new queue item
    const queueItem: SyncQueueItem = {
      id: generateQueueId(),
      operation,
      collection,
      documentId,
      data: data ?? null,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    await localDb.syncQueue.add(queueItem);
    console.log(`[SyncQueue] Added to queue: ${operation} ${collection}/${documentId}`);

    return queueItem;
  } catch (error) {
    console.error('[SyncQueue] Error adding to queue:', error);
    throw new Error(`Failed to add to sync queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all items in the sync queue.
 * Returns items sorted by timestamp (oldest first).
 *
 * @returns Array of all queue items
 */
export async function getQueueItems(): Promise<SyncQueueItem[]> {
  try {
    const items = await localDb.syncQueue.orderBy('timestamp').toArray();
    return items;
  } catch (error) {
    console.error('[SyncQueue] Error getting queue items:', error);
    throw new Error(`Failed to get queue items: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all pending items from the sync queue.
 * Returns items sorted by timestamp (oldest first) for FIFO processing.
 *
 * @returns Array of pending queue items
 */
export async function getPendingQueueItems(): Promise<SyncQueueItem[]> {
  try {
    const items = await localDb.syncQueue
      .where('status')
      .equals('pending')
      .sortBy('timestamp');
    return items;
  } catch (error) {
    console.error('[SyncQueue] Error getting pending queue items:', error);
    throw new Error(`Failed to get pending queue items: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get items that have failed and need retry.
 * Returns items with status 'failed' sorted by timestamp.
 *
 * @param maxRetries - Maximum retry count to include (default: 3)
 * @returns Array of failed queue items eligible for retry
 */
export async function getFailedItems(maxRetries: number = 3): Promise<SyncQueueItem[]> {
  try {
    const items = await localDb.syncQueue
      .where('status')
      .equals('failed')
      .filter(item => item.retryCount < maxRetries)
      .sortBy('timestamp');
    return items;
  } catch (error) {
    console.error('[SyncQueue] Error getting failed items:', error);
    throw new Error(`Failed to get failed items: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Mark a queue item as currently syncing.
 *
 * @param id - The queue item's ID
 */
export async function markAsSyncing(id: string): Promise<void> {
  try {
    const item = await localDb.syncQueue.get(id);
    if (!item) {
      throw new Error(`Queue item not found: ${id}`);
    }

    await localDb.syncQueue.update(id, { status: 'syncing' as const });
    console.log(`[SyncQueue] Marked as syncing: ${id}`);
  } catch (error) {
    console.error('[SyncQueue] Error marking as syncing:', error);
    throw new Error(`Failed to mark as syncing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Mark a queue item as failed.
 *
 * @param id - The queue item's ID
 */
export async function markAsFailed(id: string): Promise<void> {
  try {
    const item = await localDb.syncQueue.get(id);
    if (!item) {
      throw new Error(`Queue item not found: ${id}`);
    }

    await localDb.syncQueue.update(id, { status: 'failed' as const });
    console.log(`[SyncQueue] Marked as failed: ${id}`);
  } catch (error) {
    console.error('[SyncQueue] Error marking as failed:', error);
    throw new Error(`Failed to mark as failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Reset a failed item back to pending status for retry.
 *
 * @param id - The queue item's ID
 */
export async function markAsPending(id: string): Promise<void> {
  try {
    const item = await localDb.syncQueue.get(id);
    if (!item) {
      throw new Error(`Queue item not found: ${id}`);
    }

    await localDb.syncQueue.update(id, { status: 'pending' as const });
    console.log(`[SyncQueue] Marked as pending: ${id}`);
  } catch (error) {
    console.error('[SyncQueue] Error marking as pending:', error);
    throw new Error(`Failed to mark as pending: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Remove a queue item after successful sync.
 *
 * @param id - The queue item's ID to remove
 */
export async function removeFromQueue(id: string): Promise<void> {
  try {
    await localDb.syncQueue.delete(id);
    console.log(`[SyncQueue] Removed from queue: ${id}`);
  } catch (error) {
    console.error('[SyncQueue] Error removing from queue:', error);
    throw new Error(`Failed to remove from queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Increment the retry count for a failed queue item.
 *
 * @param id - The queue item's ID
 * @returns The updated retry count
 */
export async function incrementRetryCount(id: string): Promise<number> {
  try {
    const item = await localDb.syncQueue.get(id);
    if (!item) {
      throw new Error(`Queue item not found: ${id}`);
    }

    const newRetryCount = item.retryCount + 1;
    await localDb.syncQueue.update(id, {
      retryCount: newRetryCount,
      status: 'pending' as const, // Reset to pending for retry
    });
    console.log(`[SyncQueue] Incremented retry count for ${id}: ${newRetryCount}`);
    return newRetryCount;
  } catch (error) {
    console.error('[SyncQueue] Error incrementing retry count:', error);
    throw new Error(`Failed to increment retry count: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the count of pending items in the queue.
 *
 * @returns Number of pending items
 */
export async function getPendingCount(): Promise<number> {
  try {
    return await localDb.syncQueue.where('status').equals('pending').count();
  } catch (error) {
    console.error('[SyncQueue] Error getting pending count:', error);
    return 0;
  }
}

/**
 * Get the count of all items in the queue.
 *
 * @returns Total number of items in queue
 */
export async function getQueueCount(): Promise<number> {
  try {
    return await localDb.syncQueue.count();
  } catch (error) {
    console.error('[SyncQueue] Error getting queue count:', error);
    return 0;
  }
}

/**
 * Clear all items from the sync queue.
 * Use with caution - this will discard all pending offline changes.
 */
export async function clearQueue(): Promise<void> {
  try {
    await localDb.syncQueue.clear();
    console.log('[SyncQueue] Queue cleared');
  } catch (error) {
    console.error('[SyncQueue] Error clearing queue:', error);
    throw new Error(`Failed to clear queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Remove items that have exceeded max retries.
 * These items are considered permanently failed.
 *
 * @param maxRetries - Maximum retry count (default: 3)
 * @returns Number of items removed
 */
export async function removeExceededRetries(maxRetries: number = 3): Promise<number> {
  try {
    const exceededItems = await localDb.syncQueue
      .filter(item => item.retryCount >= maxRetries)
      .toArray();

    if (exceededItems.length > 0) {
      const ids = exceededItems.map(item => item.id);
      await localDb.syncQueue.bulkDelete(ids);
      console.log(`[SyncQueue] Removed ${ids.length} items that exceeded max retries`);
    }

    return exceededItems.length;
  } catch (error) {
    console.error('[SyncQueue] Error removing exceeded retries:', error);
    throw new Error(`Failed to remove exceeded retries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get queue items for a specific collection.
 *
 * @param collection - The collection name
 * @returns Array of queue items for that collection
 */
export async function getQueueItemsByCollection(collection: QueueCollection): Promise<SyncQueueItem[]> {
  try {
    return await localDb.syncQueue
      .where('collection')
      .equals(collection)
      .sortBy('timestamp');
  } catch (error) {
    console.error(`[SyncQueue] Error getting items for ${collection}:`, error);
    throw new Error(`Failed to get queue items for ${collection}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
