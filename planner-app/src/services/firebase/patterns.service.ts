/**
 * Recurring Patterns Service
 *
 * Firestore service layer for RecurringPattern CRUD operations.
 * Handles pattern management and instance generation for the new
 * materialized recurring task system.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import type {
  RecurringPattern,
  CreateRecurringPatternInput,
  UpdateRecurringPatternInput,
  TaskPriority,
  Task,
  CreateTaskInput,
} from '../../types';
import {
  validateUserId,
  sanitizeString,
  ValidationError,
} from '../../utils/validation';
import { createTask } from './tasks.service';
import { generateOccurrenceDates } from '../../utils/recurrenceUtils';
import { addDays } from 'date-fns';

/** Firestore collection name for recurring patterns */
const PATTERNS_COLLECTION = 'recurringPatterns';

/** Default number of days to generate instances for */
const DEFAULT_GENERATION_DAYS = 90;

/** Maximum batch size for batch operations */
const MAX_BATCH_SIZE = 500;

/**
 * Convert a RecurringPattern object to Firestore document format
 */
function patternToFirestore(pattern: Partial<RecurringPattern>): DocumentData {
  const data: DocumentData = { ...pattern };

  // Convert Date fields to Timestamps
  if (pattern.startDate) {
    data.startDate = Timestamp.fromDate(pattern.startDate);
  }
  if (pattern.generatedUntil) {
    data.generatedUntil = Timestamp.fromDate(pattern.generatedUntil);
  }
  if (pattern.createdAt) {
    data.createdAt = Timestamp.fromDate(pattern.createdAt);
  }
  if (pattern.updatedAt) {
    data.updatedAt = Timestamp.fromDate(pattern.updatedAt);
  }
  if (pattern.deletedAt) {
    data.deletedAt = Timestamp.fromDate(pattern.deletedAt);
  }

  // Handle end condition date
  if (pattern.endCondition?.endDate) {
    data.endCondition = {
      ...pattern.endCondition,
      endDate: Timestamp.fromDate(
        pattern.endCondition.endDate instanceof Date
          ? pattern.endCondition.endDate
          : new Date(pattern.endCondition.endDate)
      ),
    };
  }

  return data;
}

/**
 * Convert a Firestore document to a RecurringPattern object
 */
function firestoreToPattern(doc: QueryDocumentSnapshot<DocumentData>): RecurringPattern {
  const data = doc.data();

  return {
    id: doc.id,
    userId: data.userId,
    title: data.title,
    description: data.description || '',
    categoryId: data.categoryId || null,
    priority: data.priority,
    startTime: data.startTime || null,
    duration: data.duration || null,
    type: data.type,
    interval: data.interval || 1,
    daysOfWeek: data.daysOfWeek || [],
    dayOfMonth: data.dayOfMonth || null,
    monthOfYear: data.monthOfYear || null,
    nthWeekday: data.nthWeekday || null,
    specificDatesOfMonth: data.specificDatesOfMonth || null,
    daysAfterCompletion: data.daysAfterCompletion || null,
    endCondition: {
      type: data.endCondition?.type || 'never',
      endDate: data.endCondition?.endDate?.toDate() || null,
      maxOccurrences: data.endCondition?.maxOccurrences || null,
    },
    startDate: data.startDate?.toDate() || new Date(),
    generatedUntil: data.generatedUntil?.toDate() || new Date(),
    activeInstanceId: data.activeInstanceId || null,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    deletedAt: data.deletedAt?.toDate() || null,
  };
}

/**
 * Create a new recurring pattern and generate initial instances
 *
 * @param input - Pattern creation input
 * @param userId - The ID of the user creating the pattern
 * @returns The created pattern with generated instances
 */
export async function createRecurringPattern(
  input: CreateRecurringPatternInput,
  userId: string
): Promise<{ pattern: RecurringPattern; instances: Task[] }> {
  validateUserId(userId);

  const now = new Date();
  // Normalize startDate to local midnight to avoid timezone issues
  const rawStartDate = input.startDate || now;
  const startDate = new Date(rawStartDate.getFullYear(), rawStartDate.getMonth(), rawStartDate.getDate());
  const generatedUntil = addDays(startDate, DEFAULT_GENERATION_DAYS);

  // Build priority with default number if not provided
  const priority: TaskPriority = {
    letter: input.priority.letter,
    number: input.priority.number ?? 1,
  };

  // Build the pattern data
  const patternData: Omit<RecurringPattern, 'id'> = {
    userId,
    title: sanitizeString(input.title),
    description: input.description ? sanitizeString(input.description) : '',
    categoryId: input.categoryId ?? null,
    priority,
    startTime: input.startTime ?? null,
    duration: input.duration ?? null,
    type: input.type,
    interval: input.interval ?? 1,
    daysOfWeek: input.daysOfWeek ?? [],
    dayOfMonth: input.dayOfMonth ?? null,
    monthOfYear: input.monthOfYear ?? null,
    nthWeekday: input.nthWeekday ?? null,
    specificDatesOfMonth: input.specificDatesOfMonth ?? null,
    daysAfterCompletion: input.daysAfterCompletion ?? null,
    endCondition: input.endCondition ?? { type: 'never', endDate: null, maxOccurrences: null },
    startDate,
    generatedUntil,
    activeInstanceId: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  try {
    // DEBUG: Log pattern data being saved
    console.log(
      '%c[PATTERN] Creating pattern with data:',
      'color: purple; font-weight: bold',
      {
        title: patternData.title,
        type: patternData.type,
        dayOfMonth: patternData.dayOfMonth,
        daysOfWeek: patternData.daysOfWeek,
        nthWeekday: patternData.nthWeekday,
        interval: patternData.interval,
        startDate: patternData.startDate.toISOString(),
        generatedUntil: patternData.generatedUntil.toISOString(),
      }
    );

    // Create the pattern document
    const docRef = await addDoc(
      collection(db, PATTERNS_COLLECTION),
      patternToFirestore(patternData)
    );

    const pattern: RecurringPattern = {
      ...patternData,
      id: docRef.id,
    };

    // Generate instances for the pattern
    const instances = await generateInstancesForPattern(pattern, userId, startDate, generatedUntil);

    // For 'afterCompletion' type, only create one instance and track it
    if (input.type === 'afterCompletion' && instances.length > 0) {
      await updateDoc(docRef, {
        activeInstanceId: instances[0].id,
        updatedAt: Timestamp.fromDate(new Date()),
      });
      pattern.activeInstanceId = instances[0].id;
    }

    return { pattern, instances };
  } catch (error) {
    console.error('Error creating recurring pattern:', error);
    throw new Error(`Failed to create recurring pattern: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate task instances for a recurring pattern
 *
 * @param pattern - The recurring pattern
 * @param userId - User ID for ownership
 * @param fromDate - Start date for generation
 * @param toDate - End date for generation
 * @returns Array of created task instances
 */
export async function generateInstancesForPattern(
  pattern: RecurringPattern,
  userId: string,
  fromDate: Date,
  toDate: Date
): Promise<Task[]> {
  // For 'afterCompletion' type, only generate one instance at a time
  if (pattern.type === 'afterCompletion') {
    const taskInput: CreateTaskInput = {
      title: pattern.title,
      description: pattern.description,
      categoryId: pattern.categoryId,
      priority: pattern.priority,
      status: 'in_progress',
      scheduledDate: fromDate,
      startTime: pattern.startTime,
      duration: pattern.duration,
      showOnCalendar: !!pattern.startTime,
      recurringPatternId: pattern.id,
    };

    const task = await createTask(taskInput, userId);
    return [task];
  }

  // Generate occurrence dates for standard recurrence types
  const dates = generateOccurrenceDates(pattern, fromDate, toDate);

  // DEBUG: Log generated dates
  console.log(
    `%c[PATTERN] generateInstancesForPattern: Generated ${dates.length} dates from ${fromDate.toISOString()} to ${toDate.toISOString()}`,
    'color: purple; font-weight: bold'
  );
  console.log('[PATTERN] Pattern config:', {
    type: pattern.type,
    interval: pattern.interval,
    dayOfMonth: pattern.dayOfMonth,
    daysOfWeek: pattern.daysOfWeek,
    startDate: pattern.startDate,
  });
  if (dates.length > 0) {
    console.log('[PATTERN] First 5 dates:', dates.slice(0, 5).map(d => d.toISOString()));
  }

  if (dates.length === 0) {
    console.warn('[PATTERN] No dates generated - returning empty array');
    return [];
  }

  // Create task instances in batches
  const instances: Task[] = [];

  for (const date of dates) {
    // Normalize date to local midnight to ensure consistent date handling
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const taskInput: CreateTaskInput = {
      title: pattern.title,
      description: pattern.description,
      categoryId: pattern.categoryId,
      priority: pattern.priority,
      status: 'in_progress',
      scheduledDate: localDate,
      startTime: pattern.startTime,
      duration: pattern.duration,
      showOnCalendar: !!pattern.startTime,
      recurringPatternId: pattern.id,
    };

    try {
      const task = await createTask(taskInput, userId);
      console.log(`[PATTERN] Created task instance: ${task.id} for date ${localDate.toISOString()} (local: ${localDate.toLocaleDateString()})`);
      instances.push(task);
    } catch (error) {
      console.error(`[PATTERN] Error creating instance for date ${localDate}:`, error);
      // Continue with other instances
    }
  }

  return instances;
}

/**
 * Get a recurring pattern by ID
 *
 * @param patternId - The pattern ID
 * @param userId - The user ID for authorization
 * @returns The pattern if found, null otherwise
 */
export async function getRecurringPattern(
  patternId: string,
  userId: string
): Promise<RecurringPattern | null> {
  validateUserId(userId);

  try {
    const docRef = doc(db, PATTERNS_COLLECTION, patternId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const pattern = firestoreToPattern(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (pattern.userId !== userId) {
      throw new ValidationError('Unauthorized access to pattern', 'patternId', 'UNAUTHORIZED');
    }

    return pattern;
  } catch (error) {
    console.error('Error fetching recurring pattern:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to fetch pattern: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all recurring patterns for a user
 *
 * @param userId - The user ID
 * @returns Array of patterns
 */
export async function getRecurringPatterns(userId: string): Promise<RecurringPattern[]> {
  validateUserId(userId);

  try {
    const q = query(
      collection(db, PATTERNS_COLLECTION),
      where('userId', '==', userId),
      where('deletedAt', '==', null),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToPattern);
  } catch (error) {
    console.error('Error fetching recurring patterns:', error);
    throw new Error(`Failed to fetch patterns: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update a recurring pattern
 *
 * @param input - Update input with pattern ID and fields to update
 * @param userId - The user ID for authorization
 * @returns The updated pattern
 */
export async function updateRecurringPattern(
  input: UpdateRecurringPatternInput,
  userId: string
): Promise<RecurringPattern> {
  validateUserId(userId);

  const { id, regenerateFutureInstances, ...updates } = input;

  try {
    const docRef = doc(db, PATTERNS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Pattern not found', 'id', 'NOT_FOUND');
    }

    const existingPattern = firestoreToPattern(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (existingPattern.userId !== userId) {
      throw new ValidationError('Unauthorized access to pattern', 'id', 'UNAUTHORIZED');
    }

    // Build update object - only include defined values
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Only add fields that are explicitly provided (not undefined)
    if (updates.title !== undefined) {
      updateData.title = sanitizeString(updates.title);
    }
    if (updates.description !== undefined) {
      updateData.description = sanitizeString(updates.description);
    }
    if (updates.categoryId !== undefined) {
      updateData.categoryId = updates.categoryId;
    }
    if (updates.startTime !== undefined) {
      updateData.startTime = updates.startTime;
    }
    if (updates.duration !== undefined) {
      updateData.duration = updates.duration;
    }
    if (updates.type !== undefined) {
      updateData.type = updates.type;
    }
    if (updates.interval !== undefined) {
      updateData.interval = updates.interval;
    }
    if (updates.daysOfWeek !== undefined) {
      updateData.daysOfWeek = updates.daysOfWeek;
    }
    if (updates.dayOfMonth !== undefined) {
      updateData.dayOfMonth = updates.dayOfMonth;
    }
    if (updates.monthOfYear !== undefined) {
      updateData.monthOfYear = updates.monthOfYear;
    }
    if (updates.nthWeekday !== undefined) {
      updateData.nthWeekday = updates.nthWeekday;
    }
    if (updates.specificDatesOfMonth !== undefined) {
      updateData.specificDatesOfMonth = updates.specificDatesOfMonth;
    }
    if (updates.daysAfterCompletion !== undefined) {
      updateData.daysAfterCompletion = updates.daysAfterCompletion;
    }
    if (updates.endCondition !== undefined) {
      updateData.endCondition = updates.endCondition;
    }

    // Handle priority separately (nested updates)
    if (updates.priority) {
      if (updates.priority.letter !== undefined) {
        updateData['priority.letter'] = updates.priority.letter;
      }
      if (updates.priority.number !== undefined) {
        updateData['priority.number'] = updates.priority.number;
      }
    }

    const firestoreData = patternToFirestore(updateData as Partial<RecurringPattern>);
    await updateDoc(docRef, firestoreData);

    // Build updated pattern
    const updatedPattern: RecurringPattern = {
      ...existingPattern,
      ...(updates.title !== undefined && { title: updateData.title as string }),
      ...(updates.description !== undefined && { description: updateData.description as string }),
      ...(updates.categoryId !== undefined && { categoryId: updates.categoryId }),
      ...(updates.priority && {
        priority: {
          letter: updates.priority.letter ?? existingPattern.priority.letter,
          number: updates.priority.number ?? existingPattern.priority.number,
        },
      }),
      ...(updates.startTime !== undefined && { startTime: updates.startTime }),
      ...(updates.duration !== undefined && { duration: updates.duration }),
      ...(updates.type !== undefined && { type: updates.type }),
      ...(updates.interval !== undefined && { interval: updates.interval }),
      ...(updates.daysOfWeek !== undefined && { daysOfWeek: updates.daysOfWeek }),
      ...(updates.dayOfMonth !== undefined && { dayOfMonth: updates.dayOfMonth }),
      ...(updates.monthOfYear !== undefined && { monthOfYear: updates.monthOfYear }),
      ...(updates.nthWeekday !== undefined && { nthWeekday: updates.nthWeekday }),
      ...(updates.specificDatesOfMonth !== undefined && { specificDatesOfMonth: updates.specificDatesOfMonth }),
      ...(updates.daysAfterCompletion !== undefined && { daysAfterCompletion: updates.daysAfterCompletion }),
      ...(updates.endCondition && { endCondition: updates.endCondition }),
      updatedAt: updateData.updatedAt as Date,
    };

    // Handle instance regeneration when end date is extended
    if (updates.endCondition) {
      const oldEndDate = existingPattern.endCondition.endDate;
      const newEndDate = updates.endCondition.endDate
        ? (updates.endCondition.endDate instanceof Date
          ? updates.endCondition.endDate
          : new Date(updates.endCondition.endDate))
        : null;
      const oldEndType = existingPattern.endCondition.type;
      const newEndType = updates.endCondition.type;

      // Case 1: End date extended or changed from 'date' to 'never' - generate new instances
      const isExtended =
        (newEndType === 'never' && oldEndType === 'date') ||
        (newEndType === 'date' && newEndDate && oldEndDate && newEndDate > oldEndDate) ||
        (newEndType === 'date' && newEndDate && !oldEndDate);

      if (isExtended) {
        const now = new Date();
        const fromDate = existingPattern.generatedUntil > now ? existingPattern.generatedUntil : now;
        const newGeneratedUntil = newEndDate
          ? (newEndDate < addDays(now, DEFAULT_GENERATION_DAYS) ? newEndDate : addDays(now, DEFAULT_GENERATION_DAYS))
          : addDays(now, DEFAULT_GENERATION_DAYS);

        if (newGeneratedUntil > fromDate) {
          console.log(`[PATTERN] Extending instances from ${fromDate.toISOString()} to ${newGeneratedUntil.toISOString()}`);
          await generateInstancesForPattern(updatedPattern, userId, fromDate, newGeneratedUntil);

          // Update generatedUntil in Firestore
          await updateDoc(docRef, {
            generatedUntil: Timestamp.fromDate(newGeneratedUntil),
          });
          updatedPattern.generatedUntil = newGeneratedUntil;
        }
      }

      // Case 2: End date shortened - soft-delete instances beyond new end date
      if (newEndType === 'date' && newEndDate) {
        const isShortened =
          (oldEndType === 'never') ||
          (oldEndDate && newEndDate < oldEndDate);

        if (isShortened) {
          console.log(`[PATTERN] Shortening: deleting instances after ${newEndDate.toISOString()}`);
          const tasksCollection = collection(db, 'tasks');
          const q = query(
            tasksCollection,
            where('userId', '==', userId),
            where('recurringPatternId', '==', id),
            where('deletedAt', '==', null),
            where('scheduledDate', '>', Timestamp.fromDate(newEndDate))
          );

          const snapshot = await getDocs(q);
          if (snapshot.docs.length > 0) {
            const batch = writeBatch(db);
            const deleteNow = new Date();
            for (const taskDoc of snapshot.docs) {
              batch.update(taskDoc.ref, {
                deletedAt: Timestamp.fromDate(deleteNow),
                updatedAt: Timestamp.fromDate(deleteNow),
              });
            }
            await batch.commit();
            console.log(`[PATTERN] Deleted ${snapshot.docs.length} instances beyond new end date`);
          }
        }
      }
    }

    // Handle full regeneration if requested
    if (regenerateFutureInstances) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      console.log(`[PATTERN] Regenerating future instances from ${today.toISOString()}`);

      // Delete all future instances (from today onward)
      const tasksCollection = collection(db, 'tasks');
      const q = query(
        tasksCollection,
        where('userId', '==', userId),
        where('recurringPatternId', '==', id),
        where('deletedAt', '==', null),
        where('scheduledDate', '>=', Timestamp.fromDate(today))
      );

      const snapshot = await getDocs(q);
      if (snapshot.docs.length > 0) {
        const batch = writeBatch(db);
        for (const taskDoc of snapshot.docs) {
          // Only delete tasks that haven't been completed or modified
          const data = taskDoc.data();
          if (data.status === 'in_progress') {
            batch.update(taskDoc.ref, {
              deletedAt: Timestamp.fromDate(now),
              updatedAt: Timestamp.fromDate(now),
            });
          }
        }
        await batch.commit();
        console.log(`[PATTERN] Deleted ${snapshot.docs.length} future instances for regeneration`);
      }

      // Regenerate instances
      const endDate = updatedPattern.endCondition.endDate;
      const newGeneratedUntil = endDate
        ? (endDate < addDays(now, DEFAULT_GENERATION_DAYS) ? endDate : addDays(now, DEFAULT_GENERATION_DAYS))
        : addDays(now, DEFAULT_GENERATION_DAYS);

      await generateInstancesForPattern(updatedPattern, userId, today, newGeneratedUntil);

      // Update generatedUntil
      await updateDoc(docRef, {
        generatedUntil: Timestamp.fromDate(newGeneratedUntil),
      });
      updatedPattern.generatedUntil = newGeneratedUntil;
    }

    return updatedPattern;
  } catch (error) {
    console.error('Error updating recurring pattern:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to update pattern: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a recurring pattern (soft delete)
 *
 * @param patternId - The pattern ID to delete
 * @param userId - The user ID for authorization
 * @param deleteInstances - If true, also soft-delete all task instances
 */
export async function deleteRecurringPattern(
  patternId: string,
  userId: string,
  deleteInstances: boolean = false
): Promise<void> {
  validateUserId(userId);

  try {
    const docRef = doc(db, PATTERNS_COLLECTION, patternId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Pattern not found', 'patternId', 'NOT_FOUND');
    }

    const pattern = firestoreToPattern(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (pattern.userId !== userId) {
      throw new ValidationError('Unauthorized access to pattern', 'patternId', 'UNAUTHORIZED');
    }

    const now = new Date();

    // Soft delete the pattern
    await updateDoc(docRef, {
      deletedAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });

    // Optionally delete all instances
    if (deleteInstances) {
      // Import tasks collection to delete instances
      const tasksCollection = collection(db, 'tasks');
      const q = query(
        tasksCollection,
        where('userId', '==', userId),
        where('recurringPatternId', '==', patternId),
        where('deletedAt', '==', null)
      );

      const snapshot = await getDocs(q);

      // Delete in batches
      const batch = writeBatch(db);
      let batchCount = 0;

      for (const taskDoc of snapshot.docs) {
        batch.update(taskDoc.ref, {
          deletedAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
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
    }
  } catch (error) {
    console.error('Error deleting recurring pattern:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to delete pattern: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Ensure instances exist for a given date range
 *
 * This is called when navigating to a future date to generate
 * on-demand instances if they don't exist yet.
 *
 * @param patternId - The pattern ID
 * @param userId - The user ID
 * @param targetDate - The date to ensure instances exist for
 */
export async function ensureInstancesForDate(
  patternId: string,
  userId: string,
  targetDate: Date
): Promise<Task[]> {
  validateUserId(userId);

  try {
    const pattern = await getRecurringPattern(patternId, userId);

    if (!pattern) {
      throw new ValidationError('Pattern not found', 'patternId', 'NOT_FOUND');
    }

    // Check if we need to generate more instances
    if (targetDate <= pattern.generatedUntil) {
      // Already generated up to this date
      return [];
    }

    // Generate instances from current generatedUntil to 90 days beyond targetDate
    const newGeneratedUntil = addDays(targetDate, DEFAULT_GENERATION_DAYS);
    const instances = await generateInstancesForPattern(
      pattern,
      userId,
      pattern.generatedUntil,
      newGeneratedUntil
    );

    // Update the pattern's generatedUntil
    const docRef = doc(db, PATTERNS_COLLECTION, patternId);
    await updateDoc(docRef, {
      generatedUntil: Timestamp.fromDate(newGeneratedUntil),
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return instances;
  } catch (error) {
    console.error('Error ensuring instances for date:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to ensure instances: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle completion of an 'afterCompletion' recurring task
 *
 * When a task with 'afterCompletion' pattern is completed,
 * this creates the next instance.
 *
 * @param taskId - The completed task ID
 * @param patternId - The recurring pattern ID
 * @param userId - The user ID
 * @param completedAt - When the task was completed
 */
export async function handleAfterCompletionComplete(
  taskId: string,
  patternId: string,
  userId: string,
  completedAt: Date
): Promise<Task | null> {
  validateUserId(userId);

  try {
    const pattern = await getRecurringPattern(patternId, userId);

    if (!pattern) {
      throw new ValidationError('Pattern not found', 'patternId', 'NOT_FOUND');
    }

    if (pattern.type !== 'afterCompletion' || !pattern.daysAfterCompletion) {
      console.warn('Pattern is not afterCompletion type');
      return null;
    }

    // Calculate next occurrence date
    const nextDate = addDays(completedAt, pattern.daysAfterCompletion);

    // Create the next instance
    const taskInput: CreateTaskInput = {
      title: pattern.title,
      description: pattern.description,
      categoryId: pattern.categoryId,
      priority: pattern.priority,
      status: 'in_progress',
      scheduledDate: nextDate,
      startTime: pattern.startTime,
      duration: pattern.duration,
      showOnCalendar: !!pattern.startTime,
      recurringPatternId: pattern.id,
    };

    const newTask = await createTask(taskInput, userId);

    // Update the pattern's activeInstanceId
    const docRef = doc(db, PATTERNS_COLLECTION, patternId);
    await updateDoc(docRef, {
      activeInstanceId: newTask.id,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return newTask;
  } catch (error) {
    console.error('Error handling after-completion:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to create next instance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all task instances for a recurring pattern
 *
 * @param patternId - The pattern ID
 * @param userId - The user ID
 * @returns Array of tasks generated from this pattern
 */
export async function getInstancesForPattern(
  patternId: string,
  userId: string
): Promise<Task[]> {
  validateUserId(userId);

  try {
    // Verify pattern access
    const pattern = await getRecurringPattern(patternId, userId);
    if (!pattern) {
      throw new ValidationError('Pattern not found', 'patternId', 'NOT_FOUND');
    }

    // Query tasks with this pattern ID
    const tasksCollection = collection(db, 'tasks');
    const q = query(
      tasksCollection,
      where('userId', '==', userId),
      where('recurringPatternId', '==', patternId),
      where('deletedAt', '==', null),
      orderBy('scheduledDate')
    );

    const snapshot = await getDocs(q);

    // Import firestoreToTask from tasks.service to convert
    // For now, return basic task data
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        description: data.description || '',
        categoryId: data.categoryId || null,
        priority: data.priority,
        status: data.status,
        scheduledDate: data.scheduledDate?.toDate() || new Date(),
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        duration: data.duration || null,
        showOnCalendar: data.showOnCalendar || false,
        recurringPatternId: data.recurringPatternId || null,
        recurrence: null,
        isRecurringInstance: false,
        recurringParentId: null,
        instanceDate: null,
        scheduledTime: null,
        linkedNoteIds: data.linkedNoteIds || [],
        linkedEventId: data.linkedEventId || null,
        reminderIds: data.reminderIds || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        deletedAt: data.deletedAt?.toDate() || null,
        completedAt: data.completedAt?.toDate() || null,
      } as Task;
    });
  } catch (error) {
    console.error('Error fetching instances for pattern:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to fetch instances: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// Migration Functions
// =============================================================================

/**
 * Result of migrating legacy recurring tasks
 */
export interface MigrationResult {
  tasksProcessed: number;
  patternsCreated: number;
  instancesGenerated: number;
  instancesUpdated: number;
  errors: string[];
}

/**
 * Migrate a single legacy recurring task to the new pattern system
 *
 * @param legacyTask - The legacy task with embedded recurrence
 * @param userId - The user ID
 * @returns The created pattern ID, or null if failed
 */
export async function migrateLegacyRecurringTask(
  legacyTask: Task,
  userId: string
): Promise<{ patternId: string; instancesGenerated: number } | null> {
  validateUserId(userId);

  if (!legacyTask.recurrence) {
    console.warn('Task has no recurrence to migrate');
    return null;
  }

  // Authorization check
  if (legacyTask.userId !== userId) {
    throw new ValidationError('Unauthorized access to task', 'taskId', 'UNAUTHORIZED');
  }

  const now = new Date();
  const recurrence = legacyTask.recurrence;
  const startDate = legacyTask.scheduledDate ? new Date(legacyTask.scheduledDate) : now;
  const generatedUntil = addDays(now, DEFAULT_GENERATION_DAYS);

  try {
    // Build the pattern data from the legacy task
    const patternData: Omit<RecurringPattern, 'id'> = {
      userId,
      title: legacyTask.title,
      description: legacyTask.description || '',
      categoryId: legacyTask.categoryId,
      priority: legacyTask.priority,
      startTime: legacyTask.scheduledTime || null,
      duration: null,
      type: recurrence.type as RecurringPattern['type'],
      interval: recurrence.interval || 1,
      daysOfWeek: recurrence.daysOfWeek || [],
      dayOfMonth: recurrence.dayOfMonth,
      monthOfYear: recurrence.monthOfYear,
      nthWeekday: recurrence.nthWeekday || null,
      specificDatesOfMonth: recurrence.specificDatesOfMonth || null,
      daysAfterCompletion: recurrence.daysAfterCompletion || null,
      endCondition: {
        type: recurrence.endCondition.type as RecurringPattern['endCondition']['type'],
        endDate: recurrence.endCondition.endDate
          ? new Date(recurrence.endCondition.endDate as Date | string)
          : null,
        maxOccurrences: recurrence.endCondition.maxOccurrences,
      },
      startDate,
      generatedUntil,
      activeInstanceId: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    // Create the pattern document
    const docRef = await addDoc(
      collection(db, PATTERNS_COLLECTION),
      patternToFirestore(patternData)
    );

    const pattern: RecurringPattern = {
      ...patternData,
      id: docRef.id,
    };

    console.log(`[MIGRATE] Created pattern ${docRef.id} from task ${legacyTask.id}`);

    // Update existing materialized instances to reference the new pattern
    const tasksCollection = collection(db, 'tasks');
    const instancesQuery = query(
      tasksCollection,
      where('userId', '==', userId),
      where('recurringParentId', '==', legacyTask.id),
      where('deletedAt', '==', null)
    );

    const instancesSnapshot = await getDocs(instancesQuery);
    let updatedCount = 0;

    if (instancesSnapshot.docs.length > 0) {
      const batch = writeBatch(db);
      for (const instanceDoc of instancesSnapshot.docs) {
        batch.update(instanceDoc.ref, {
          recurringPatternId: docRef.id,
          recurringParentId: null,
          isRecurringInstance: false,
          updatedAt: Timestamp.fromDate(now),
        });
        updatedCount++;
      }
      await batch.commit();
      console.log(`[MIGRATE] Updated ${updatedCount} existing instances`);
    }

    // Generate new instances for the next 90 days
    const instances = await generateInstancesForPattern(pattern, userId, now, generatedUntil);
    console.log(`[MIGRATE] Generated ${instances.length} new instances`);

    // Mark the original task as migrated
    const taskRef = doc(db, 'tasks', legacyTask.id);
    await updateDoc(taskRef, {
      deletedAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      // Store reference for potential rollback
      migratedToPatternId: docRef.id,
    });
    console.log(`[MIGRATE] Marked original task as migrated`);

    return {
      patternId: docRef.id,
      instancesGenerated: instances.length + updatedCount,
    };
  } catch (error) {
    console.error('Error migrating legacy task:', error);
    throw new Error(`Failed to migrate task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Migrate all legacy recurring tasks for a user to the new pattern system
 *
 * @param userId - The user ID
 * @returns Migration result summary
 */
export async function migrateAllLegacyRecurringTasks(
  userId: string
): Promise<MigrationResult> {
  validateUserId(userId);

  const result: MigrationResult = {
    tasksProcessed: 0,
    patternsCreated: 0,
    instancesGenerated: 0,
    instancesUpdated: 0,
    errors: [],
  };

  try {
    // Find all legacy recurring tasks (parent tasks with recurrence)
    const tasksCollection = collection(db, 'tasks');
    const q = query(
      tasksCollection,
      where('userId', '==', userId),
      where('deletedAt', '==', null)
    );

    const snapshot = await getDocs(q);

    // Filter to only parent recurring tasks
    const legacyTasks = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          title: data.title,
          description: data.description || '',
          categoryId: data.categoryId || null,
          priority: data.priority,
          status: data.status,
          scheduledDate: data.scheduledDate?.toDate() || null,
          scheduledTime: data.scheduledTime || null,
          recurrence: data.recurrence || null,
          isRecurringInstance: data.isRecurringInstance || false,
          recurringParentId: data.recurringParentId || null,
          instanceDate: data.instanceDate?.toDate() || null,
          linkedNoteIds: data.linkedNoteIds || [],
          linkedEventId: data.linkedEventId || null,
          reminderIds: data.reminderIds || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          deletedAt: null,
          // New fields with defaults
          startTime: null,
          endTime: null,
          duration: null,
          showOnCalendar: false,
          recurringPatternId: null,
          completedAt: null,
        } as Task;
      })
      .filter((task) => {
        // Only migrate parent tasks with recurrence that haven't been migrated
        return (
          task.recurrence !== null &&
          !task.isRecurringInstance &&
          !task.recurringParentId
        );
      });

    console.log(`[MIGRATE] Found ${legacyTasks.length} legacy recurring tasks to migrate`);
    result.tasksProcessed = legacyTasks.length;

    // Migrate each task
    for (const task of legacyTasks) {
      try {
        const migrationResult = await migrateLegacyRecurringTask(task, userId);
        if (migrationResult) {
          result.patternsCreated++;
          result.instancesGenerated += migrationResult.instancesGenerated;
        }
      } catch (error) {
        const errorMsg = `Failed to migrate "${task.title}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[MIGRATE] ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    console.log(`[MIGRATE] Migration complete:`, result);
    return result;
  } catch (error) {
    console.error('Error during migration:', error);
    throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
