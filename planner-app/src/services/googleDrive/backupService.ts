/**
 * Backup Service
 *
 * Orchestrates backup and restore operations by collecting data from
 * Firebase services and uploading/downloading via Google Drive.
 */

import type {
  BackupData,
  BackupFileInfo,
  BackupResult,
  RestoreResult,
  BackupFrequency,
} from '../../types/googleDrive.types';
import { BACKUP_FORMAT_VERSION, APP_VERSION } from '../../types/googleDrive.types';
import { getAllTasksForUser } from '../firebase/tasks.service';
import { getAllEventsForUser } from '../firebase/events.service';
import { getUserNotes } from '../firebase/notes.service';
import { getCategories } from '../firebase/categories.service';
import { getUserReminders } from '../firebase/reminders.service';
import { getRecurringPatterns } from '../firebase/patterns.service';
import { getUserSettings } from '../firebase/users.service';
import {
  findOrCreateBackupFolder,
  uploadBackupFile,
  listBackupFiles,
  downloadBackupFile,
  deleteBackupFile,
} from './googleDriveService';

/**
 * Date replacer for JSON.stringify - converts Date objects to ISO strings
 */
function dateReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

/**
 * Generate a backup file name with timestamp
 */
export function generateBackupFileName(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  return `neill-planner-backup-${timestamp}.json`;
}

/**
 * Calculate the next backup time based on the last backup and frequency
 */
export function calculateNextBackupTime(
  lastBackupAt: string | null,
  frequency: BackupFrequency
): string | null {
  if (frequency === 'manual') {
    return null;
  }

  const base = lastBackupAt ? new Date(lastBackupAt) : new Date();
  const intervalMs: Record<Exclude<BackupFrequency, 'manual'>, number> = {
    daily: 24 * 60 * 60 * 1000,
    every3days: 3 * 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
  };

  const nextTime = new Date(base.getTime() + intervalMs[frequency]);
  return nextTime.toISOString();
}

/**
 * Create a full backup and upload to Google Drive
 */
export async function createBackup(userId: string): Promise<BackupResult> {
  try {
    // Collect all data in parallel
    const [tasks, events, notes, categories, reminders, recurringPatterns, userSettings] =
      await Promise.all([
        getAllTasksForUser(userId),
        getAllEventsForUser(userId),
        getUserNotes(userId),
        getCategories(userId),
        getUserReminders(userId),
        getRecurringPatterns(userId),
        getUserSettings(userId),
      ]);

    const counts = {
      tasks: tasks.length,
      events: events.length,
      notes: notes.length,
      categories: categories.length,
      reminders: reminders.length,
      recurringPatterns: recurringPatterns.length,
    };

    // Build backup data
    const backupData: BackupData = {
      version: BACKUP_FORMAT_VERSION,
      createdAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      userId,
      data: {
        tasks,
        events,
        notes,
        categories,
        reminders,
        recurringPatterns,
        userSettings,
      },
      metadata: {
        counts,
        backupSizeBytes: 0, // Will be calculated after stringify
      },
    };

    // Serialize to JSON
    const jsonContent = JSON.stringify(backupData, dateReplacer, 2);
    backupData.metadata.backupSizeBytes = new Blob([jsonContent]).size;

    // Re-serialize with updated size
    const finalContent = JSON.stringify(backupData, dateReplacer, 2);

    // Upload to Google Drive
    const folderId = await findOrCreateBackupFolder();
    const fileName = generateBackupFileName();
    const file = await uploadBackupFile(folderId, fileName, finalContent);

    return {
      success: true,
      fileId: file.id,
      fileName: file.name,
      completedAt: new Date().toISOString(),
      error: null,
      counts,
    };
  } catch (error) {
    return {
      success: false,
      fileId: null,
      fileName: null,
      completedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown backup error',
      counts: null,
    };
  }
}

/**
 * List all backups from Google Drive
 */
export async function listBackups(): Promise<BackupFileInfo[]> {
  const folderId = await findOrCreateBackupFolder();
  return listBackupFiles(folderId);
}

/**
 * Restore from a backup file
 *
 * Downloads the backup, validates it, then uses Firestore batch writes
 * to replace all existing data.
 */
export async function restoreFromBackup(
  userId: string,
  fileId: string
): Promise<RestoreResult> {
  try {
    // Download and parse backup
    const content = await downloadBackupFile(fileId);
    const backupData: BackupData = JSON.parse(content);

    // Validate backup format
    if (!backupData.version || backupData.version > BACKUP_FORMAT_VERSION) {
      throw new Error(
        `Unsupported backup version: ${backupData.version}. Current version: ${BACKUP_FORMAT_VERSION}`
      );
    }

    if (backupData.userId !== userId) {
      throw new Error('This backup belongs to a different user and cannot be restored.');
    }

    if (!backupData.data) {
      throw new Error('Backup data is missing or corrupted.');
    }

    // Import Firestore for batch operations
    const { collection, getDocs, query, where, writeBatch, doc, Timestamp } = await import(
      'firebase/firestore'
    );
    const { db } = await import('../firebase/config');

    // Delete existing data for this user
    const collections = ['tasks', 'events', 'notes', 'categories', 'reminders', 'recurringPatterns'];
    for (const collectionName of collections) {
      const q = query(collection(db, collectionName), where('userId', '==', userId));
      const snapshot = await getDocs(q);

      // Delete in batches of 500
      let batch = writeBatch(db);
      let batchCount = 0;

      for (const docSnap of snapshot.docs) {
        batch.delete(docSnap.ref);
        batchCount++;

        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }
    }

    // Known date field names across all collections
    const DATE_FIELDS = new Set([
      'createdAt', 'updatedAt', 'deletedAt', 'completedAt',
      'date', 'dueDate', 'startDate', 'endDate',
      'reminderTime', 'snoozedUntil', 'dismissedAt', 'triggeredAt',
      'lastLoginAt', 'addedAt', 'expiresAt',
      'lastGeneratedAt', 'nextGenerationDate',
    ]);

    // Helper to convert ISO date strings back to Timestamps for Firestore
    function convertDatesToTimestamps(obj: Record<string, unknown>): Record<string, unknown> {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (
          DATE_FIELDS.has(key) &&
          typeof value === 'string' &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
        ) {
          try {
            result[key] = Timestamp.fromDate(new Date(value));
          } catch {
            result[key] = value; // Keep original if conversion fails
          }
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = convertDatesToTimestamps(value as Record<string, unknown>);
        } else {
          result[key] = value;
        }
      }
      return result;
    }

    // Write backup data to Firestore
    const collectionDataMap: { collectionName: string; items: unknown[] }[] = [
      { collectionName: 'tasks', items: backupData.data.tasks || [] },
      { collectionName: 'events', items: backupData.data.events || [] },
      { collectionName: 'notes', items: backupData.data.notes || [] },
      { collectionName: 'categories', items: backupData.data.categories || [] },
      { collectionName: 'reminders', items: backupData.data.reminders || [] },
      { collectionName: 'recurringPatterns', items: backupData.data.recurringPatterns || [] },
    ];

    const counts = {
      tasks: 0,
      events: 0,
      notes: 0,
      categories: 0,
      reminders: 0,
      recurringPatterns: 0,
    };

    for (const { collectionName, items } of collectionDataMap) {
      let batch = writeBatch(db);
      let batchCount = 0;

      for (const item of items) {
        const record = item as Record<string, unknown>;
        const itemId = record.id as string;

        // Remove the 'id' field from the document data (it's the doc ID, not a field)
        const { id: _id, ...dataWithoutId } = record;

        // Ensure userId is set
        const docData = convertDatesToTimestamps({ ...dataWithoutId, userId });
        const docRef = itemId ? doc(db, collectionName, itemId) : doc(collection(db, collectionName));

        batch.set(docRef, docData);
        batchCount++;

        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      counts[collectionName as keyof typeof counts] = items.length;
    }

    // Restore user settings if present
    if (backupData.data.userSettings) {
      const settingsData = convertDatesToTimestamps(
        backupData.data.userSettings as unknown as Record<string, unknown>
      );
      const settingsRef = doc(db, 'userSettings', userId);
      const settingsBatch = writeBatch(db);
      settingsBatch.set(settingsRef, { ...settingsData, userId });
      await settingsBatch.commit();
    }

    return {
      success: true,
      completedAt: new Date().toISOString(),
      error: null,
      counts,
    };
  } catch (error) {
    return {
      success: false,
      completedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown restore error',
      counts: null,
    };
  }
}

/**
 * Enforce retention policy by deleting oldest backups that exceed the limit
 *
 * @param retentionCount - Maximum number of backups to keep (0 = unlimited)
 * @returns Number of backups deleted
 */
export async function enforceRetention(retentionCount: number): Promise<number> {
  if (retentionCount === 0) {
    return 0; // Unlimited
  }

  const folderId = await findOrCreateBackupFolder();
  const backups = await listBackupFiles(folderId);

  if (backups.length <= retentionCount) {
    return 0;
  }

  // Backups are already sorted newest first, delete the oldest ones
  const toDelete = backups.slice(retentionCount);
  let deletedCount = 0;

  for (const backup of toDelete) {
    try {
      await deleteBackupFile(backup.id);
      deletedCount++;
    } catch (error) {
      console.error(`Failed to delete old backup ${backup.name}:`, error);
    }
  }

  return deletedCount;
}
