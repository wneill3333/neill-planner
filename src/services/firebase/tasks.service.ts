/**
 * Tasks Service
 *
 * Firestore service layer for Task CRUD operations.
 * Handles data conversion between app types and Firestore documents.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import type { Task, TaskPriority, CreateTaskInput, UpdateTaskInput } from '../../types';
import {
  validateCreateTaskInput,
  validateUpdateTaskInput,
  validateUserId,
  validateTaskId,
  validateDate,
  validateDateRange,
  sanitizeString,
  ValidationError,
} from '../../utils/validation';

/** Firestore collection name for tasks */
const TASKS_COLLECTION = 'tasks';

/** Maximum batch size for batch operations */
const MAX_BATCH_SIZE = 500;

/**
 * Convert a Task object to Firestore document format
 * Converts Date objects to Firestore Timestamps
 */
function taskToFirestore(task: Partial<Task>): DocumentData {
  const data: DocumentData = { ...task };

  // Convert Date fields to Timestamps
  if (task.scheduledDate) {
    data.scheduledDate = Timestamp.fromDate(task.scheduledDate);
  }
  if (task.createdAt) {
    data.createdAt = Timestamp.fromDate(task.createdAt);
  }
  if (task.updatedAt) {
    data.updatedAt = Timestamp.fromDate(task.updatedAt);
  }
  if (task.deletedAt) {
    data.deletedAt = Timestamp.fromDate(task.deletedAt);
  }

  // Handle recurrence pattern date conversions
  if (task.recurrence) {
    data.recurrence = {
      ...task.recurrence,
      endCondition: {
        ...task.recurrence.endCondition,
        endDate: task.recurrence?.endCondition?.endDate
          ? Timestamp.fromDate(task.recurrence.endCondition.endDate)
          : null,
      },
      exceptions: task.recurrence.exceptions.map((date) => Timestamp.fromDate(date)),
    };
  }

  // Handle recurring instance date
  if (task.instanceDate) {
    data.instanceDate = Timestamp.fromDate(task.instanceDate);
  }

  return data;
}

/**
 * Convert a Firestore document to a Task object
 * Converts Firestore Timestamps to Date objects
 */
function firestoreToTask(doc: QueryDocumentSnapshot<DocumentData>): Task {
  const data = doc.data();

  const task: Task = {
    id: doc.id,
    userId: data.userId,
    title: data.title,
    description: data.description || '',
    categoryId: data.categoryId || null,
    priority: data.priority,
    status: data.status,
    scheduledDate: data.scheduledDate?.toDate() || new Date(),
    scheduledTime: data.scheduledTime || null,
    recurrence: null,
    linkedNoteIds: data.linkedNoteIds || [],
    linkedEventId: data.linkedEventId || null,
    isRecurringInstance: data.isRecurringInstance || false,
    recurringParentId: data.recurringParentId || null,
    instanceDate: data.instanceDate?.toDate() || null,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    deletedAt: data.deletedAt?.toDate() || null,
  };

  // Handle recurrence pattern date conversions
  if (data.recurrence) {
    task.recurrence = {
      ...data.recurrence,
      endCondition: {
        ...data.recurrence.endCondition,
        endDate: data.recurrence.endCondition.endDate?.toDate() || null,
      },
      exceptions: (data.recurrence.exceptions || []).map((ts: Timestamp) => ts.toDate()),
    };
  }

  return task;
}

/**
 * Create a new task in Firestore
 * @param input - Task creation input (without auto-generated fields)
 * @param userId - The ID of the user creating the task
 * @returns The created task with generated ID
 * @throws {ValidationError} If input validation fails
 */
export async function createTask(input: CreateTaskInput, userId: string): Promise<Task> {
  // Validate user ID
  validateUserId(userId);

  // Validate input
  validateCreateTaskInput(input);

  const now = new Date();

  // Sanitize string inputs
  const sanitizedTitle = sanitizeString(input.title);
  const sanitizedDescription = input.description ? sanitizeString(input.description) : '';

  // Build priority with default number if not provided
  const priority: TaskPriority = {
    letter: input.priority.letter,
    number: input.priority.number ?? 1,
  };

  const taskData: Omit<Task, 'id'> = {
    userId,
    title: sanitizedTitle,
    description: sanitizedDescription,
    categoryId: input.categoryId ?? null,
    priority,
    status: input.status || 'in_progress',
    scheduledDate: input.scheduledDate ?? null,
    scheduledTime: input.scheduledTime ?? null,
    recurrence: input.recurrence ?? null,
    linkedNoteIds: input.linkedNoteIds || [],
    linkedEventId: input.linkedEventId ?? null,
    isRecurringInstance: input.isRecurringInstance || false,
    recurringParentId: input.recurringParentId ?? null,
    instanceDate: input.instanceDate ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  try {
    const docRef = await addDoc(
      collection(db, TASKS_COLLECTION),
      taskToFirestore(taskData)
    );

    return {
      ...taskData,
      id: docRef.id,
    };
  } catch (error) {
    console.error('Error creating task:', error);
    throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a single task by ID
 * @param taskId - The ID of the task to retrieve
 * @param userId - The ID of the user requesting the task
 * @returns The task if found, null otherwise
 * @throws {ValidationError} If taskId is invalid or user is unauthorized
 */
export async function getTask(taskId: string, userId: string): Promise<Task | null> {
  validateTaskId(taskId);
  validateUserId(userId);

  try {
    const docRef = doc(db, TASKS_COLLECTION, taskId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const task = firestoreToTask(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (task.userId !== userId) {
      throw new ValidationError('Unauthorized access to task', 'taskId', 'UNAUTHORIZED');
    }

    return task;
  } catch (error) {
    console.error('Error fetching task:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to fetch task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all tasks for a user on a specific date
 * @param userId - The user's ID
 * @param date - The date to filter by
 * @returns Array of tasks scheduled for that date
 * @throws {ValidationError} If userId or date is invalid
 */
export async function getTasksByDate(userId: string, date: Date): Promise<Task[]> {
  // Validate inputs
  validateUserId(userId);
  validateDate(date, 'date');

  try {
    // Create start and end of day timestamps
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      where('scheduledDate', '>=', Timestamp.fromDate(startOfDay)),
      where('scheduledDate', '<=', Timestamp.fromDate(endOfDay)),
      where('deletedAt', '==', null),
      orderBy('scheduledDate'),
      orderBy('priority.letter'),
      orderBy('priority.number')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToTask);
  } catch (error) {
    console.error('Error fetching tasks by date:', error);
    throw new Error(`Failed to fetch tasks by date: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all tasks for a user within a date range
 * @param userId - The user's ID
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @returns Array of tasks within the date range
 * @throws {ValidationError} If inputs are invalid
 */
export async function getTasksByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Task[]> {
  // Validate inputs
  validateUserId(userId);
  validateDateRange(startDate, endDate);

  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      where('scheduledDate', '>=', Timestamp.fromDate(startDate)),
      where('scheduledDate', '<=', Timestamp.fromDate(endDate)),
      where('deletedAt', '==', null),
      orderBy('scheduledDate'),
      orderBy('priority.letter'),
      orderBy('priority.number')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToTask);
  } catch (error) {
    console.error('Error fetching tasks by date range:', error);
    throw new Error(`Failed to fetch tasks by date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update an existing task
 * @param input - Update input with task ID and fields to update
 * @param userId - The ID of the user updating the task
 * @returns The updated task
 * @throws {ValidationError} If input validation fails or user is unauthorized
 */
export async function updateTask(input: UpdateTaskInput, userId: string): Promise<Task> {
  // Validate input
  validateUpdateTaskInput(input);
  validateUserId(userId);

  const { id, priority, title, description, ...otherUpdates } = input;

  try {
    // First, verify ownership
    const docRef = doc(db, TASKS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Task not found', 'id', 'NOT_FOUND');
    }

    const existingTask = firestoreToTask(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (existingTask.userId !== userId) {
      throw new ValidationError('Unauthorized access to task', 'id', 'UNAUTHORIZED');
    }

    // Sanitize string inputs if provided
    const updates: Record<string, unknown> = {
      ...otherUpdates,
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      updates.title = sanitizeString(title);
    }

    if (description !== undefined) {
      updates.description = sanitizeString(description);
    }

    // Handle priority separately to avoid partial type issues
    if (priority) {
      if (priority.letter !== undefined) {
        updates['priority.letter'] = priority.letter;
      }
      if (priority.number !== undefined) {
        updates['priority.number'] = priority.number;
      }
    }

    const updateData = taskToFirestore(updates as Partial<Task>);
    await updateDoc(docRef, updateData);

    // Return merged local object instead of re-fetching
    return {
      ...existingTask,
      ...(title !== undefined && { title: updates.title as string }),
      ...(description !== undefined && { description: updates.description as string }),
      ...(priority?.letter !== undefined && { priority: { ...existingTask.priority, letter: priority.letter } }),
      ...(priority?.number !== undefined && { priority: { ...existingTask.priority, number: priority.number } }),
      ...otherUpdates,
      updatedAt: updates.updatedAt as Date,
    };
  } catch (error) {
    console.error('Error updating task:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Soft delete a task (sets deletedAt timestamp)
 * @param taskId - The ID of the task to delete
 * @param userId - The ID of the user deleting the task
 * @throws {ValidationError} If taskId is invalid or user is unauthorized
 */
export async function softDeleteTask(taskId: string, userId: string): Promise<void> {
  validateTaskId(taskId);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, TASKS_COLLECTION, taskId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Task not found', 'taskId', 'NOT_FOUND');
    }

    const task = firestoreToTask(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (task.userId !== userId) {
      throw new ValidationError('Unauthorized access to task', 'taskId', 'UNAUTHORIZED');
    }

    await updateDoc(docRef, {
      deletedAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error soft deleting task:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to soft delete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Permanently delete a task from Firestore
 * @param taskId - The ID of the task to delete
 * @param userId - The ID of the user deleting the task
 * @throws {ValidationError} If taskId is invalid or user is unauthorized
 */
export async function hardDeleteTask(taskId: string, userId: string): Promise<void> {
  validateTaskId(taskId);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, TASKS_COLLECTION, taskId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Task not found', 'taskId', 'NOT_FOUND');
    }

    const task = firestoreToTask(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (task.userId !== userId) {
      throw new ValidationError('Unauthorized access to task', 'taskId', 'UNAUTHORIZED');
    }

    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error permanently deleting task:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to permanently delete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Restore a soft-deleted task
 * @param taskId - The ID of the task to restore
 * @param userId - The ID of the user restoring the task
 * @returns The restored task
 * @throws {ValidationError} If taskId is invalid or user is unauthorized
 */
export async function restoreTask(taskId: string, userId: string): Promise<Task> {
  validateTaskId(taskId);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, TASKS_COLLECTION, taskId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Task not found', 'taskId', 'NOT_FOUND');
    }

    const existingTask = firestoreToTask(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (existingTask.userId !== userId) {
      throw new ValidationError('Unauthorized access to task', 'taskId', 'UNAUTHORIZED');
    }

    await updateDoc(docRef, {
      deletedAt: null,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    // Return merged local object instead of re-fetching
    return {
      ...existingTask,
      deletedAt: null,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error restoring task:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to restore task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch update multiple tasks (for reordering, etc.)
 * @param updates - Array of task updates
 * @param userId - The ID of the user updating the tasks
 * @throws {ValidationError} If any update is invalid or user is unauthorized
 */
export async function batchUpdateTasks(updates: UpdateTaskInput[], userId: string): Promise<void> {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new ValidationError('Updates array is required and cannot be empty', 'updates', 'INVALID_UPDATES');
  }

  // Enforce batch size limit
  if (updates.length > MAX_BATCH_SIZE) {
    throw new ValidationError(
      `Batch size cannot exceed ${MAX_BATCH_SIZE} items`,
      'updates',
      'BATCH_TOO_LARGE'
    );
  }

  validateUserId(userId);

  // Validate all updates first before starting the batch
  for (const update of updates) {
    validateUpdateTaskInput(update);
  }

  try {
    // Verify ownership for all tasks
    const taskIds = updates.map(u => u.id);
    const verificationPromises = taskIds.map(async (id) => {
      const docRef = doc(db, TASKS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new ValidationError(`Task ${id} not found`, 'id', 'NOT_FOUND');
      }

      const task = firestoreToTask(docSnap as QueryDocumentSnapshot<DocumentData>);

      if (task.userId !== userId) {
        throw new ValidationError(`Unauthorized access to task ${id}`, 'id', 'UNAUTHORIZED');
      }
    });

    await Promise.all(verificationPromises);

    const batch = writeBatch(db);
    const now = Timestamp.fromDate(new Date());

    for (const update of updates) {
      const { id, priority, title, description, ...otherFields } = update;
      const docRef = doc(db, TASKS_COLLECTION, id);

      // Build update object with sanitized strings
      const fields: Record<string, unknown> = {
        ...otherFields,
        updatedAt: now.toDate(),
      };

      if (title !== undefined) {
        fields.title = sanitizeString(title);
      }

      if (description !== undefined) {
        fields.description = sanitizeString(description);
      }

      // Handle priority separately to avoid partial type issues
      if (priority) {
        if (priority.letter !== undefined) {
          fields['priority.letter'] = priority.letter;
        }
        if (priority.number !== undefined) {
          fields['priority.number'] = priority.number;
        }
      }

      const updateData = taskToFirestore(fields as Partial<Task>);
      batch.update(docRef, updateData);
    }

    await batch.commit();
  } catch (error) {
    console.error('Error batch updating tasks:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to batch update tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all tasks for a user (including soft-deleted)
 * @param userId - The user's ID
 * @returns Array of all user's tasks
 * @throws {ValidationError} If userId is invalid
 */
export async function getAllTasksForUser(userId: string): Promise<Task[]> {
  validateUserId(userId);

  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      orderBy('scheduledDate', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToTask);
  } catch (error) {
    console.error('Error fetching all tasks for user:', error);
    throw new Error(`Failed to fetch all tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
