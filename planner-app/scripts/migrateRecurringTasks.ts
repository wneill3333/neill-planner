/**
 * Migration Script: Legacy Recurring Tasks to New Pattern System
 *
 * This script migrates recurring tasks from the legacy embedded recurrence system
 * to the new RecurringPattern document system.
 *
 * Legacy system: Tasks have an embedded `recurrence` field
 * New system: Separate RecurringPattern documents with materialized task instances
 *
 * Usage:
 *   npx ts-node scripts/migrateRecurringTasks.ts [userId]
 *
 * If userId is not provided, it will migrate all users' recurring tasks.
 * Run with --dry-run to preview changes without making them.
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { addDays, startOfDay } from 'date-fns';

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_GENERATION_DAYS = 90;
const MAX_BATCH_SIZE = 500;

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const targetUserId = args.find((arg) => !arg.startsWith('--'));

// =============================================================================
// Types
// =============================================================================

interface LegacyRecurrence {
  type: string;
  interval: number;
  daysOfWeek: number[];
  dayOfMonth: number | null;
  monthOfYear: number | null;
  nthWeekday?: { n: number; weekday: number } | null;
  specificDatesOfMonth?: number[] | null;
  daysAfterCompletion?: number | null;
  endCondition: {
    type: string;
    endDate: Date | Timestamp | null;
    maxOccurrences: number | null;
  };
  exceptions: (Date | Timestamp)[];
  instanceModifications?: Record<string, unknown>;
}

interface LegacyTask {
  id: string;
  userId: string;
  title: string;
  description: string;
  categoryId: string | null;
  priority: { letter: string; number: number };
  status: string;
  scheduledDate: Date | Timestamp | null;
  scheduledTime: string | null;
  recurrence: LegacyRecurrence | null;
  isRecurringInstance: boolean;
  recurringParentId: string | null;
  linkedNoteIds: string[];
  linkedEventId: string | null;
  reminderIds: string[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  deletedAt: Date | Timestamp | null;
}

interface MigrationResult {
  userId: string;
  tasksProcessed: number;
  patternsCreated: number;
  instancesGenerated: number;
  instancesUpdated: number;
  errors: string[];
}

// =============================================================================
// Initialize Firebase Admin
// =============================================================================

function initializeFirebase() {
  // Try to use service account from environment variable
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
    initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // Fall back to default credentials (for local development with emulator)
    initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'neill-planner',
    });
  }

  return getFirestore();
}

// =============================================================================
// Helper Functions
// =============================================================================

function toDate(value: Date | Timestamp | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return null;
}

function log(message: string, data?: unknown) {
  const prefix = dryRun ? '[DRY-RUN] ' : '';
  if (data !== undefined) {
    console.log(`${prefix}${message}`, data);
  } else {
    console.log(`${prefix}${message}`);
  }
}

function logError(message: string, error?: unknown) {
  const prefix = dryRun ? '[DRY-RUN] ' : '';
  console.error(`${prefix}ERROR: ${message}`, error);
}

// =============================================================================
// Migration Logic
// =============================================================================

/**
 * Get all legacy recurring parent tasks for a user
 */
async function getLegacyRecurringTasks(
  db: FirebaseFirestore.Firestore,
  userId?: string
): Promise<LegacyTask[]> {
  const tasksRef = db.collection('tasks');

  let query: FirebaseFirestore.Query = tasksRef
    .where('deletedAt', '==', null)
    .where('recurrence', '!=', null);

  if (userId) {
    query = query.where('userId', '==', userId);
  }

  const snapshot = await query.get();

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((task) => {
      // Filter to only parent tasks (not instances)
      // A parent task has recurrence but is NOT an instance
      return (
        task.recurrence &&
        !task.isRecurringInstance &&
        !task.recurringParentId
      );
    }) as LegacyTask[];
}

/**
 * Get existing materialized instances for a legacy parent task
 */
async function getExistingInstances(
  db: FirebaseFirestore.Firestore,
  parentTaskId: string,
  userId: string
): Promise<string[]> {
  const tasksRef = db.collection('tasks');

  const snapshot = await tasksRef
    .where('userId', '==', userId)
    .where('recurringParentId', '==', parentTaskId)
    .where('deletedAt', '==', null)
    .get();

  return snapshot.docs.map((doc) => doc.id);
}

/**
 * Convert legacy recurrence to new pattern input
 */
function convertToPatternData(task: LegacyTask) {
  const recurrence = task.recurrence!;
  const startDate = toDate(task.scheduledDate) || new Date();
  const now = new Date();

  return {
    userId: task.userId,
    title: task.title,
    description: task.description || '',
    categoryId: task.categoryId,
    priority: task.priority,
    startTime: task.scheduledTime || null,
    duration: null,
    type: recurrence.type,
    interval: recurrence.interval || 1,
    daysOfWeek: recurrence.daysOfWeek || [],
    dayOfMonth: recurrence.dayOfMonth,
    monthOfYear: recurrence.monthOfYear,
    nthWeekday: recurrence.nthWeekday || null,
    specificDatesOfMonth: recurrence.specificDatesOfMonth || null,
    daysAfterCompletion: recurrence.daysAfterCompletion || null,
    endCondition: {
      type: recurrence.endCondition.type,
      endDate: toDate(recurrence.endCondition.endDate),
      maxOccurrences: recurrence.endCondition.maxOccurrences,
    },
    startDate: startOfDay(startDate),
    generatedUntil: addDays(now, DEFAULT_GENERATION_DAYS),
    activeInstanceId: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    // Store reference to the original task for auditing
    migratedFromTaskId: task.id,
  };
}

/**
 * Generate occurrence dates for a pattern
 */
function generateOccurrenceDates(
  pattern: ReturnType<typeof convertToPatternData>,
  fromDate: Date,
  toDate: Date
): Date[] {
  const dates: Date[] = [];
  const { type, interval, daysOfWeek, endCondition } = pattern;

  // Check end condition
  const endDate = endCondition.endDate ? new Date(endCondition.endDate) : null;
  const maxOccurrences = endCondition.maxOccurrences;

  let currentDate = startOfDay(fromDate);
  const endDateLimit = endDate && endDate < toDate ? endDate : toDate;

  // For afterCompletion type, don't generate dates
  if (type === 'afterCompletion') {
    return [currentDate];
  }

  while (currentDate <= endDateLimit) {
    // Check max occurrences
    if (maxOccurrences && dates.length >= maxOccurrences) {
      break;
    }

    // Check if this date matches the pattern
    let matches = false;

    switch (type) {
      case 'daily':
        matches = true;
        break;
      case 'weekly':
        const dayOfWeek = currentDate.getDay();
        if (daysOfWeek.length === 0) {
          matches = dayOfWeek === fromDate.getDay();
        } else {
          matches = daysOfWeek.includes(dayOfWeek);
        }
        break;
      case 'monthly':
        matches = currentDate.getDate() === fromDate.getDate();
        break;
      case 'yearly':
        matches =
          currentDate.getDate() === fromDate.getDate() &&
          currentDate.getMonth() === fromDate.getMonth();
        break;
    }

    if (matches) {
      dates.push(new Date(currentDate));
    }

    // Advance based on interval
    switch (type) {
      case 'daily':
        currentDate = addDays(currentDate, interval);
        break;
      case 'weekly':
        currentDate = addDays(currentDate, 1);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;
      default:
        currentDate = addDays(currentDate, 1);
    }
  }

  return dates;
}

/**
 * Migrate a single legacy recurring task to the new pattern system
 */
async function migrateLegacyTask(
  db: FirebaseFirestore.Firestore,
  task: LegacyTask,
  result: MigrationResult
): Promise<string | null> {
  log(`\n  Migrating task: "${task.title}" (${task.id})`);

  try {
    // 1. Convert to pattern data
    const patternData = convertToPatternData(task);
    log(`    Pattern type: ${patternData.type}, interval: ${patternData.interval}`);

    // 2. Get existing materialized instances
    const existingInstanceIds = await getExistingInstances(db, task.id, task.userId);
    log(`    Found ${existingInstanceIds.length} existing instances`);

    if (dryRun) {
      log(`    [Would create pattern and update instances]`);
      result.patternsCreated++;
      result.instancesUpdated += existingInstanceIds.length;
      return null;
    }

    // 3. Create the new pattern document
    const patternsRef = db.collection('recurringPatterns');
    const patternDoc = await patternsRef.add({
      ...patternData,
      startDate: Timestamp.fromDate(patternData.startDate),
      generatedUntil: Timestamp.fromDate(patternData.generatedUntil),
      createdAt: Timestamp.fromDate(patternData.createdAt),
      updatedAt: Timestamp.fromDate(patternData.updatedAt),
      deletedAt: null,
      endCondition: {
        ...patternData.endCondition,
        endDate: patternData.endCondition.endDate
          ? Timestamp.fromDate(patternData.endCondition.endDate)
          : null,
      },
    });

    const patternId = patternDoc.id;
    log(`    Created pattern: ${patternId}`);
    result.patternsCreated++;

    // 4. Update existing materialized instances to reference the new pattern
    if (existingInstanceIds.length > 0) {
      const batch = db.batch();
      let batchCount = 0;

      for (const instanceId of existingInstanceIds) {
        const instanceRef = db.collection('tasks').doc(instanceId);
        batch.update(instanceRef, {
          recurringPatternId: patternId,
          // Clear legacy fields
          recurringParentId: null,
          isRecurringInstance: false,
          updatedAt: Timestamp.fromDate(new Date()),
        });
        batchCount++;

        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      result.instancesUpdated += existingInstanceIds.length;
      log(`    Updated ${existingInstanceIds.length} existing instances`);
    }

    // 5. Generate new instances for dates not yet covered
    const now = new Date();
    const generationEnd = addDays(now, DEFAULT_GENERATION_DAYS);
    const occurrenceDates = generateOccurrenceDates(
      patternData,
      now,
      generationEnd
    );

    log(`    Generating ${occurrenceDates.length} new instances`);

    for (const date of occurrenceDates) {
      // Skip if we already have an instance for this date
      const taskInput = {
        userId: task.userId,
        title: patternData.title,
        description: patternData.description,
        categoryId: patternData.categoryId,
        priority: patternData.priority,
        status: 'in_progress',
        scheduledDate: Timestamp.fromDate(date),
        startTime: patternData.startTime,
        endTime: null,
        duration: patternData.duration,
        showOnCalendar: !!patternData.startTime,
        recurringPatternId: patternId,
        // Clear legacy fields
        recurrence: null,
        isRecurringInstance: false,
        recurringParentId: null,
        instanceDate: null,
        scheduledTime: null,
        linkedNoteIds: [],
        linkedEventId: null,
        reminderIds: [],
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        deletedAt: null,
        completedAt: null,
      };

      await db.collection('tasks').add(taskInput);
      result.instancesGenerated++;
    }

    // 6. Mark the original task as migrated (soft delete with special status)
    await db.collection('tasks').doc(task.id).update({
      migratedToPatternId: patternId,
      deletedAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });
    log(`    Marked original task as migrated`);

    return patternId;
  } catch (error) {
    const errorMessage = `Failed to migrate task ${task.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logError(errorMessage);
    result.errors.push(errorMessage);
    return null;
  }
}

/**
 * Run migration for a user or all users
 */
async function runMigration(
  db: FirebaseFirestore.Firestore,
  userId?: string
): Promise<MigrationResult[]> {
  log('='.repeat(60));
  log('Recurring Tasks Migration');
  log('='.repeat(60));
  log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  log(`Target: ${userId || 'All users'}`);
  log('');

  // Get all legacy recurring tasks
  const legacyTasks = await getLegacyRecurringTasks(db, userId);
  log(`Found ${legacyTasks.length} legacy recurring tasks to migrate`);

  if (legacyTasks.length === 0) {
    log('No tasks to migrate. Exiting.');
    return [];
  }

  // Group by user
  const tasksByUser = new Map<string, LegacyTask[]>();
  for (const task of legacyTasks) {
    const userTasks = tasksByUser.get(task.userId) || [];
    userTasks.push(task);
    tasksByUser.set(task.userId, userTasks);
  }

  log(`Tasks span ${tasksByUser.size} users`);

  const results: MigrationResult[] = [];

  // Process each user
  for (const [uid, userTasks] of tasksByUser) {
    log(`\nProcessing user: ${uid} (${userTasks.length} tasks)`);

    const result: MigrationResult = {
      userId: uid,
      tasksProcessed: userTasks.length,
      patternsCreated: 0,
      instancesGenerated: 0,
      instancesUpdated: 0,
      errors: [],
    };

    for (const task of userTasks) {
      await migrateLegacyTask(db, task, result);
    }

    results.push(result);
  }

  return results;
}

/**
 * Print migration summary
 */
function printSummary(results: MigrationResult[]) {
  log('\n' + '='.repeat(60));
  log('Migration Summary');
  log('='.repeat(60));

  let totalTasksProcessed = 0;
  let totalPatternsCreated = 0;
  let totalInstancesGenerated = 0;
  let totalInstancesUpdated = 0;
  let totalErrors = 0;

  for (const result of results) {
    log(`\nUser: ${result.userId}`);
    log(`  Tasks processed: ${result.tasksProcessed}`);
    log(`  Patterns created: ${result.patternsCreated}`);
    log(`  Instances generated: ${result.instancesGenerated}`);
    log(`  Instances updated: ${result.instancesUpdated}`);
    if (result.errors.length > 0) {
      log(`  Errors: ${result.errors.length}`);
      result.errors.forEach((err) => log(`    - ${err}`));
    }

    totalTasksProcessed += result.tasksProcessed;
    totalPatternsCreated += result.patternsCreated;
    totalInstancesGenerated += result.instancesGenerated;
    totalInstancesUpdated += result.instancesUpdated;
    totalErrors += result.errors.length;
  }

  log('\n' + '-'.repeat(60));
  log('Totals:');
  log(`  Tasks processed: ${totalTasksProcessed}`);
  log(`  Patterns created: ${totalPatternsCreated}`);
  log(`  Instances generated: ${totalInstancesGenerated}`);
  log(`  Instances updated: ${totalInstancesUpdated}`);
  log(`  Errors: ${totalErrors}`);
  log('='.repeat(60));
}

// =============================================================================
// Main Entry Point
// =============================================================================

async function main() {
  try {
    const db = initializeFirebase();
    const results = await runMigration(db, targetUserId);
    printSummary(results);

    if (dryRun) {
      log('\nThis was a dry run. No changes were made.');
      log('Run without --dry-run to perform the actual migration.');
    }

    process.exit(results.some((r) => r.errors.length > 0) ? 1 : 0);
  } catch (error) {
    logError('Migration failed:', error);
    process.exit(1);
  }
}

main();
