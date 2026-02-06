/**
 * Google Drive Backup Type Definitions
 *
 * Types for Google Drive OAuth, backup/restore operations, and configuration.
 */

import type { Task } from './task.types';
import type { Event } from './event.types';
import type { Note } from './note.types';
import type { Category } from './category.types';
import type { Reminder } from './reminder.types';
import type { RecurringPattern } from './task.types';
import type { UserSettings } from './user.types';

// =============================================================================
// Credentials
// =============================================================================

/**
 * Google Drive OAuth credentials stored in Firestore
 */
export interface GoogleDriveCredentials {
  /** OAuth 2.0 access token */
  accessToken: string;
  /** OAuth 2.0 refresh token (empty for client-side GIS) */
  refreshToken: string;
  /** Token expiration timestamp */
  expiresAt: Date;
  /** OAuth scope granted by user */
  scope: string;
  /** Timestamp when credentials were last updated */
  updatedAt: Date;
}

// =============================================================================
// Backup Configuration
// =============================================================================

/**
 * Backup frequency options
 */
export type BackupFrequency = 'daily' | 'every3days' | 'weekly' | 'monthly' | 'manual';

/**
 * Backup retention count (0 = unlimited)
 */
export type BackupRetentionCount = 5 | 10 | 20 | 30 | 0;

/**
 * Backup configuration stored in UserSettings
 */
export interface BackupConfig {
  /** Whether Google Drive is connected for backups */
  googleDriveConnected: boolean;
  /** How often to auto-backup */
  backupFrequency: BackupFrequency;
  /** Number of backups to keep (0 = unlimited) */
  retentionCount: BackupRetentionCount;
  /** ISO timestamp of last successful backup */
  lastBackupAt: string | null;
  /** ISO timestamp of next scheduled backup */
  nextBackupAt: string | null;
}

/**
 * Default backup configuration
 */
export const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  googleDriveConnected: false,
  backupFrequency: 'weekly',
  retentionCount: 10,
  lastBackupAt: null,
  nextBackupAt: null,
};

// =============================================================================
// UI Option Arrays
// =============================================================================

/**
 * Backup frequency options for UI dropdowns
 */
export const BACKUP_FREQUENCY_OPTIONS: { value: BackupFrequency; label: string }[] = [
  { value: 'manual', label: 'Manual Only' },
  { value: 'daily', label: 'Daily' },
  { value: 'every3days', label: 'Every 3 Days' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

/**
 * Backup retention options for UI dropdowns
 */
export const BACKUP_RETENTION_OPTIONS: { value: BackupRetentionCount; label: string }[] = [
  { value: 5, label: 'Keep 5 backups' },
  { value: 10, label: 'Keep 10 backups' },
  { value: 20, label: 'Keep 20 backups' },
  { value: 30, label: 'Keep 30 backups' },
  { value: 0, label: 'Unlimited' },
];

// =============================================================================
// Backup Data Structure
// =============================================================================

/**
 * The complete backup JSON structure
 */
export interface BackupData {
  /** Backup format version */
  version: number;
  /** ISO timestamp when backup was created */
  createdAt: string;
  /** App version string */
  appVersion: string;
  /** User ID this backup belongs to */
  userId: string;
  /** All backed up data */
  data: {
    tasks: Task[];
    events: Event[];
    notes: Note[];
    categories: Category[];
    reminders: Reminder[];
    recurringPatterns: RecurringPattern[];
    userSettings: UserSettings | null;
  };
  /** Metadata about the backup */
  metadata: {
    counts: {
      tasks: number;
      events: number;
      notes: number;
      categories: number;
      reminders: number;
      recurringPatterns: number;
    };
    backupSizeBytes: number;
  };
}

// =============================================================================
// Drive File Info
// =============================================================================

/**
 * Google Drive file metadata for backup files
 */
export interface BackupFileInfo {
  /** Google Drive file ID */
  id: string;
  /** File name */
  name: string;
  /** ISO timestamp when file was created */
  createdAt: string;
  /** File size in bytes */
  sizeBytes: number;
}

// =============================================================================
// Operation Results
// =============================================================================

/**
 * Result of a backup operation
 */
export interface BackupResult {
  /** Whether the backup was successful */
  success: boolean;
  /** Google Drive file ID of the backup */
  fileId: string | null;
  /** File name of the backup */
  fileName: string | null;
  /** ISO timestamp when backup completed */
  completedAt: string;
  /** Error message if backup failed */
  error: string | null;
  /** Metadata about what was backed up */
  counts: {
    tasks: number;
    events: number;
    notes: number;
    categories: number;
    reminders: number;
    recurringPatterns: number;
  } | null;
}

/**
 * Result of a restore operation
 */
export interface RestoreResult {
  /** Whether the restore was successful */
  success: boolean;
  /** ISO timestamp when restore completed */
  completedAt: string;
  /** Error message if restore failed */
  error: string | null;
  /** Counts of restored items */
  counts: {
    tasks: number;
    events: number;
    notes: number;
    categories: number;
    reminders: number;
    recurringPatterns: number;
  } | null;
}

/** Current backup data format version */
export const BACKUP_FORMAT_VERSION = 1;

/** App version to include in backups */
export const APP_VERSION = '1.0.0';

/** Google Drive folder name for backups */
export const BACKUP_FOLDER_NAME = 'Neill Planner Backups';
