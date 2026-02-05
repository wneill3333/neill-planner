/**
 * Local Database Configuration
 *
 * IndexedDB setup using Dexie for offline-first data persistence.
 * Mirrors Firestore collections for seamless offline/online switching.
 */

import Dexie, { type Table } from 'dexie';
import type { Task, Event, Note, Category, Reminder, SyncQueueItem } from '../../types';

// =============================================================================
// Database Schema
// =============================================================================

/**
 * Local database extending Dexie for IndexedDB operations.
 * Tables mirror Firestore collections for offline support.
 */
export class NeillPlannerDB extends Dexie {
  /** Tasks table */
  tasks!: Table<Task, string>;

  /** Events table */
  events!: Table<Event, string>;

  /** Notes table */
  notes!: Table<Note, string>;

  /** Categories table */
  categories!: Table<Category, string>;

  /** Reminders table */
  reminders!: Table<Reminder, string>;

  /** Sync queue for pending offline changes */
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super('neillPlannerDB');

    // Define database schema with indexes
    // Note: Dexie auto-indexes the primary key (first listed field)
    // Version 1: Initial schema
    this.version(1).stores({
      tasks: 'id, userId, scheduledDate, status, categoryId, [userId+scheduledDate], recurringParentId, deletedAt',
      events: 'id, userId, startTime, endTime, categoryId, [userId+startTime], googleCalendarId, recurringParentId, deletedAt',
      notes: 'id, userId, date, categoryId, [userId+date], deletedAt',
      categories: 'id, userId, sortOrder, [userId+sortOrder]',
      reminders: 'id, userId, taskId, eventId, status, scheduledTime, [userId+status], [userId+scheduledTime]',
      syncQueue: 'id, status, collection, timestamp, [status+timestamp]',
    });

    // Version 2: Added documentId index to syncQueue for efficient lookups
    this.version(2).stores({
      // Tasks: indexed by id, userId, scheduledDate, status, categoryId
      // Compound index on userId+scheduledDate for efficient date queries
      tasks: 'id, userId, scheduledDate, status, categoryId, [userId+scheduledDate], recurringParentId, deletedAt',

      // Events: indexed by id, userId, startTime, endTime
      // Compound index on userId+startTime for efficient time range queries
      events: 'id, userId, startTime, endTime, categoryId, [userId+startTime], googleCalendarId, recurringParentId, deletedAt',

      // Notes: indexed by id, userId, date
      // Compound index on userId+date for efficient date queries
      notes: 'id, userId, date, categoryId, [userId+date], deletedAt',

      // Categories: indexed by id, userId, sortOrder
      categories: 'id, userId, sortOrder, [userId+sortOrder]',

      // Reminders: indexed by id, userId, scheduledTime, status
      // Additional indexes for task/event lookups
      reminders: 'id, userId, taskId, eventId, status, scheduledTime, [userId+status], [userId+scheduledTime]',

      // Sync queue: indexed by id, documentId, status, collection, timestamp
      // Added documentId index for efficient duplicate checking
      syncQueue: 'id, documentId, status, collection, timestamp, [status+timestamp]',
    });

    console.log('[LocalDB] Database initialized: neillPlannerDB v2');
  }
}

// =============================================================================
// Database Instance
// =============================================================================

/**
 * Singleton database instance for the application.
 * Use this instance for all IndexedDB operations.
 */
export const localDb = new NeillPlannerDB();

// =============================================================================
// Database Utilities
// =============================================================================

/**
 * Clear all data from the local database.
 * Use with caution - this permanently deletes all local data.
 *
 * @returns Promise that resolves when all tables are cleared
 */
export async function clearAllLocalData(): Promise<void> {
  try {
    await Promise.all([
      localDb.tasks.clear(),
      localDb.events.clear(),
      localDb.notes.clear(),
      localDb.categories.clear(),
      localDb.reminders.clear(),
      localDb.syncQueue.clear(),
    ]);
    console.log('[LocalDB] All local data cleared');
  } catch (error) {
    console.error('[LocalDB] Error clearing all data:', error);
    throw new Error(`Failed to clear local database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clear data for a specific user from all tables.
 * Useful when user logs out.
 *
 * @param userId - The user's ID whose data should be cleared
 */
export async function clearUserData(userId: string): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    await Promise.all([
      localDb.tasks.where('userId').equals(userId).delete(),
      localDb.events.where('userId').equals(userId).delete(),
      localDb.notes.where('userId').equals(userId).delete(),
      localDb.categories.where('userId').equals(userId).delete(),
      localDb.reminders.where('userId').equals(userId).delete(),
    ]);
    console.log(`[LocalDB] User data cleared for userId: ${userId}`);
  } catch (error) {
    console.error('[LocalDB] Error clearing user data:', error);
    throw new Error(`Failed to clear user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get database statistics for debugging purposes.
 *
 * @returns Object containing count of items in each table
 */
export async function getDatabaseStats(): Promise<Record<string, number>> {
  try {
    const [tasks, events, notes, categories, reminders, syncQueue] = await Promise.all([
      localDb.tasks.count(),
      localDb.events.count(),
      localDb.notes.count(),
      localDb.categories.count(),
      localDb.reminders.count(),
      localDb.syncQueue.count(),
    ]);

    return {
      tasks,
      events,
      notes,
      categories,
      reminders,
      syncQueue,
    };
  } catch (error) {
    console.error('[LocalDB] Error getting database stats:', error);
    throw new Error(`Failed to get database stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if the database is accessible and working.
 *
 * @returns true if database is operational, false otherwise
 */
export async function isDatabaseReady(): Promise<boolean> {
  try {
    await localDb.tasks.count();
    return true;
  } catch (error) {
    console.error('[LocalDB] Database not ready:', error);
    return false;
  }
}

/**
 * Delete and recreate the database.
 * Use when migration fails or database is corrupted.
 */
export async function resetDatabase(): Promise<void> {
  try {
    await localDb.delete();
    console.log('[LocalDB] Database deleted');

    // Reopen to recreate with schema
    await localDb.open();
    console.log('[LocalDB] Database recreated');
  } catch (error) {
    console.error('[LocalDB] Error resetting database:', error);
    throw new Error(`Failed to reset database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
