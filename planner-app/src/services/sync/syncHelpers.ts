/**
 * Sync Helper Utilities
 *
 * Utility functions for local database operations and network status detection.
 * Provides a unified interface for reading/writing data locally.
 */

import { localDb } from './localDatabase';
import type { Task, Event, Note, Category, Reminder } from '../../types';

// =============================================================================
// Type Definitions
// =============================================================================

/** Supported collection names for sync operations */
export type SyncCollection = 'tasks' | 'events' | 'notes' | 'categories' | 'reminders';

/** Type mapping for collection data */
export type CollectionDataType = {
  tasks: Task;
  events: Event;
  notes: Note;
  categories: Category;
  reminders: Reminder;
};

/** Query options for local database operations */
export interface LocalQueryOptions {
  /** User ID to filter by */
  userId?: string;
  /** Start date for range queries */
  startDate?: Date;
  /** End date for range queries */
  endDate?: Date;
  /** Limit number of results */
  limit?: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

// =============================================================================
// Network Status Detection
// =============================================================================

/**
 * Check if the browser is currently online.
 * Uses navigator.onLine as the primary indicator.
 *
 * @returns true if online, false if offline
 */
export function isOnline(): boolean {
  // Check if navigator.onLine is available (it should be in modern browsers)
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine;
  }
  // Default to true if we can't determine (assume online)
  return true;
}

/**
 * Perform a lightweight connectivity check by attempting to reach a known endpoint.
 * More reliable than navigator.onLine for detecting actual connectivity.
 *
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns Promise resolving to true if connected, false otherwise
 */
export async function checkConnectivity(timeoutMs: number = 5000): Promise<boolean> {
  if (!isOnline()) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Try to fetch a small resource from Google's favicon
    // This is a common approach for connectivity checks
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.type === 'opaque' || response.ok;
  } catch {
    return false;
  }
}

// =============================================================================
// Save to Local Database
// =============================================================================

/**
 * Save a single item to the local database.
 *
 * @param collection - The collection name
 * @param data - The data to save
 * @returns Promise resolving to the saved item's ID
 */
export async function saveToLocal<T extends SyncCollection>(
  collection: T,
  data: CollectionDataType[T]
): Promise<string> {
  try {
    const table = localDb[collection];
    const id = (data as { id: string }).id;

    if (!id) {
      throw new Error('Data must have an id field');
    }

    await table.put(data);
    console.log(`[SyncHelpers] Saved to ${collection}: ${id}`);
    return id;
  } catch (error) {
    console.error(`[SyncHelpers] Error saving to ${collection}:`, error);
    throw new Error(`Failed to save to ${collection}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save multiple items to the local database in a batch operation.
 *
 * @param collection - The collection name
 * @param items - Array of items to save
 * @returns Promise resolving to the number of items saved
 */
export async function saveMultipleToLocal<T extends SyncCollection>(
  collection: T,
  items: CollectionDataType[T][]
): Promise<number> {
  if (!items.length) {
    return 0;
  }

  try {
    const table = localDb[collection];
    await table.bulkPut(items);
    console.log(`[SyncHelpers] Bulk saved ${items.length} items to ${collection}`);
    return items.length;
  } catch (error) {
    console.error(`[SyncHelpers] Error bulk saving to ${collection}:`, error);
    throw new Error(`Failed to bulk save to ${collection}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// Read from Local Database
// =============================================================================

/**
 * Get a single item from the local database by ID.
 *
 * @param collection - The collection name
 * @param id - The item's ID
 * @returns Promise resolving to the item or undefined if not found
 */
export async function getFromLocal<T extends SyncCollection>(
  collection: T,
  id: string
): Promise<CollectionDataType[T] | undefined> {
  try {
    const table = localDb[collection];
    const item = await table.get(id);
    return item as CollectionDataType[T] | undefined;
  } catch (error) {
    console.error(`[SyncHelpers] Error getting ${id} from ${collection}:`, error);
    throw new Error(`Failed to get from ${collection}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all items from a collection for a specific user.
 *
 * @param collection - The collection name
 * @param userId - The user's ID
 * @returns Promise resolving to array of items
 */
export async function getAllFromLocal<T extends SyncCollection>(
  collection: T,
  userId: string
): Promise<CollectionDataType[T][]> {
  try {
    const table = localDb[collection];
    const items = await table.where('userId').equals(userId).toArray();
    return items as CollectionDataType[T][];
  } catch (error) {
    console.error(`[SyncHelpers] Error getting all from ${collection}:`, error);
    throw new Error(`Failed to get all from ${collection}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get items from local database with query options.
 *
 * @param collection - The collection name
 * @param options - Query options
 * @returns Promise resolving to array of matching items
 */
export async function queryFromLocal<T extends SyncCollection>(
  collection: T,
  options: LocalQueryOptions
): Promise<CollectionDataType[T][]> {
  try {
    const table = localDb[collection];
    let query = table.toCollection();

    // Apply userId filter if provided
    if (options.userId) {
      query = table.where('userId').equals(options.userId);
    }

    let results = await query.toArray();

    // Apply date range filter for collections that support it
    if (options.startDate || options.endDate) {
      results = results.filter((item) => {
        const dateField = getDateField(collection, item);
        if (!dateField) return true;

        const itemDate = dateField instanceof Date ? dateField : new Date(dateField);

        if (options.startDate && itemDate < options.startDate) return false;
        if (options.endDate && itemDate > options.endDate) return false;

        return true;
      });
    }

    // Apply sorting
    if (options.sortBy) {
      results.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[options.sortBy!];
        const bVal = (b as Record<string, unknown>)[options.sortBy!];

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        let comparison = 0;
        if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        }

        return options.sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    return results as CollectionDataType[T][];
  } catch (error) {
    console.error(`[SyncHelpers] Error querying ${collection}:`, error);
    throw new Error(`Failed to query ${collection}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the primary date field for a collection item.
 * Used for date range filtering.
 */
function getDateField(collection: SyncCollection, item: unknown): Date | string | null {
  const record = item as Record<string, unknown>;

  switch (collection) {
    case 'tasks':
      return record.scheduledDate as Date | null;
    case 'events':
      return record.startTime as Date | null;
    case 'notes':
      return record.date as Date | null;
    case 'reminders':
      return record.scheduledTime as Date | null;
    case 'categories':
      return null; // Categories don't have a primary date field
    default:
      return null;
  }
}

// =============================================================================
// Delete from Local Database
// =============================================================================

/**
 * Delete a single item from the local database.
 *
 * @param collection - The collection name
 * @param id - The item's ID to delete
 */
export async function deleteFromLocal<T extends SyncCollection>(
  collection: T,
  id: string
): Promise<void> {
  try {
    const table = localDb[collection];
    await table.delete(id);
    console.log(`[SyncHelpers] Deleted from ${collection}: ${id}`);
  } catch (error) {
    console.error(`[SyncHelpers] Error deleting from ${collection}:`, error);
    throw new Error(`Failed to delete from ${collection}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete multiple items from the local database.
 *
 * @param collection - The collection name
 * @param ids - Array of item IDs to delete
 * @returns Promise resolving to the number of items deleted
 */
export async function deleteMultipleFromLocal<T extends SyncCollection>(
  collection: T,
  ids: string[]
): Promise<number> {
  if (!ids.length) {
    return 0;
  }

  try {
    const table = localDb[collection];
    await table.bulkDelete(ids);
    console.log(`[SyncHelpers] Bulk deleted ${ids.length} items from ${collection}`);
    return ids.length;
  } catch (error) {
    console.error(`[SyncHelpers] Error bulk deleting from ${collection}:`, error);
    throw new Error(`Failed to bulk delete from ${collection}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// Clear Local Data
// =============================================================================

/**
 * Clear all data from a specific collection.
 *
 * @param collection - The collection name to clear
 */
export async function clearLocalData(collection: SyncCollection): Promise<void> {
  try {
    const table = localDb[collection];
    await table.clear();
    console.log(`[SyncHelpers] Cleared all data from ${collection}`);
  } catch (error) {
    console.error(`[SyncHelpers] Error clearing ${collection}:`, error);
    throw new Error(`Failed to clear ${collection}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clear data for a specific user from a collection.
 *
 * @param collection - The collection name
 * @param userId - The user's ID
 * @returns Promise resolving to the number of items deleted
 */
export async function clearUserDataFromCollection(
  collection: SyncCollection,
  userId: string
): Promise<number> {
  try {
    const table = localDb[collection];
    const count = await table.where('userId').equals(userId).delete();
    console.log(`[SyncHelpers] Cleared ${count} items for user ${userId} from ${collection}`);
    return count;
  } catch (error) {
    console.error(`[SyncHelpers] Error clearing user data from ${collection}:`, error);
    throw new Error(`Failed to clear user data from ${collection}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// Sync Status Tracking
// =============================================================================

/**
 * Get the timestamp of the last successful sync for a collection.
 * Stored in localStorage for simplicity.
 *
 * @param collection - The collection name
 * @param userId - The user's ID
 * @returns The last sync timestamp or null if never synced
 */
export function getLastSyncTime(collection: SyncCollection, userId: string): Date | null {
  const key = `lastSync_${collection}_${userId}`;
  const stored = localStorage.getItem(key);
  return stored ? new Date(stored) : null;
}

/**
 * Set the timestamp of the last successful sync for a collection.
 *
 * @param collection - The collection name
 * @param userId - The user's ID
 * @param timestamp - The sync timestamp (defaults to now)
 */
export function setLastSyncTime(
  collection: SyncCollection,
  userId: string,
  timestamp: Date = new Date()
): void {
  const key = `lastSync_${collection}_${userId}`;
  localStorage.setItem(key, timestamp.toISOString());
  console.log(`[SyncHelpers] Updated last sync time for ${collection}: ${timestamp.toISOString()}`);
}

/**
 * Clear all sync timestamps for a user.
 *
 * @param userId - The user's ID
 */
export function clearSyncTimestamps(userId: string): void {
  const collections: SyncCollection[] = ['tasks', 'events', 'notes', 'categories', 'reminders'];
  for (const collection of collections) {
    const key = `lastSync_${collection}_${userId}`;
    localStorage.removeItem(key);
  }
  console.log(`[SyncHelpers] Cleared sync timestamps for user ${userId}`);
}
