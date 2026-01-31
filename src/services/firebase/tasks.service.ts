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
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../types';

/** Firestore collection name for tasks */
const TASKS_COLLECTION = 'tasks';

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
        endDate: task.recurrence.endCondition.endDate
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
 */
export async function createTask(input: CreateTaskInput, userId: string): Promise<Task> {
  const now = new Date();

  const taskData: Omit<Task, 'id'> = {
    ...input,
    userId,
    description: input.description || '',
    categoryId: input.categoryId || null,
    scheduledTime: input.scheduledTime || null,
    recurrence: input.recurrence || null,
    linkedNoteIds: input.linkedNoteIds || [],
    linkedEventId: input.linkedEventId || null,
    isRecurringInstance: input.isRecurringInstance || false,
    recurringParentId: input.recurringParentId || null,
    instanceDate: input.instanceDate || null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  const docRef = await addDoc(
    collection(db, TASKS_COLLECTION),
    taskToFirestore(taskData)
  );

  return {
    ...taskData,
    id: docRef.id,
  };
}

/**
 * Get a single task by ID
 * @param taskId - The ID of the task to retrieve
 * @returns The task if found, null otherwise
 */
export async function getTask(taskId: string): Promise<Task | null> {
  const docRef = doc(db, TASKS_COLLECTION, taskId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return firestoreToTask(docSnap as QueryDocumentSnapshot<DocumentData>);
}

/**
 * Get all tasks for a user on a specific date
 * @param userId - The user's ID
 * @param date - The date to filter by
 * @returns Array of tasks scheduled for that date
 */
export async function getTasksByDate(userId: string, date: Date): Promise<Task[]> {
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
}

/**
 * Get all tasks for a user within a date range
 * @param userId - The user's ID
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @returns Array of tasks within the date range
 */
export async function getTasksByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Task[]> {
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
}

/**
 * Update an existing task
 * @param input - Update input with task ID and fields to update
 * @returns The updated task
 */
export async function updateTask(input: UpdateTaskInput): Promise<Task> {
  const { id, ...updates } = input;
  const docRef = doc(db, TASKS_COLLECTION, id);

  const updateData = taskToFirestore({
    ...updates,
    updatedAt: new Date(),
  });

  await updateDoc(docRef, updateData);

  const updatedTask = await getTask(id);
  if (!updatedTask) {
    throw new Error(`Task ${id} not found after update`);
  }

  return updatedTask;
}

/**
 * Soft delete a task (sets deletedAt timestamp)
 * @param taskId - The ID of the task to delete
 */
export async function softDeleteTask(taskId: string): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, taskId);
  await updateDoc(docRef, {
    deletedAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date()),
  });
}

/**
 * Permanently delete a task from Firestore
 * @param taskId - The ID of the task to delete
 */
export async function hardDeleteTask(taskId: string): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, taskId);
  await deleteDoc(docRef);
}

/**
 * Restore a soft-deleted task
 * @param taskId - The ID of the task to restore
 * @returns The restored task
 */
export async function restoreTask(taskId: string): Promise<Task> {
  const docRef = doc(db, TASKS_COLLECTION, taskId);
  await updateDoc(docRef, {
    deletedAt: null,
    updatedAt: Timestamp.fromDate(new Date()),
  });

  const restoredTask = await getTask(taskId);
  if (!restoredTask) {
    throw new Error(`Task ${taskId} not found after restore`);
  }

  return restoredTask;
}

/**
 * Batch update multiple tasks (for reordering, etc.)
 * @param updates - Array of task updates
 */
export async function batchUpdateTasks(updates: UpdateTaskInput[]): Promise<void> {
  const batch = writeBatch(db);
  const now = Timestamp.fromDate(new Date());

  for (const update of updates) {
    const { id, ...fields } = update;
    const docRef = doc(db, TASKS_COLLECTION, id);
    const updateData = taskToFirestore({
      ...fields,
      updatedAt: now.toDate(),
    });
    batch.update(docRef, updateData);
  }

  await batch.commit();
}

/**
 * Get all tasks for a user (including soft-deleted)
 * @param userId - The user's ID
 * @returns Array of all user's tasks
 */
export async function getAllTasksForUser(userId: string): Promise<Task[]> {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('userId', '==', userId),
    orderBy('scheduledDate', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(firestoreToTask);
}
