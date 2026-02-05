/**
 * Reminders Service
 *
 * Firestore service layer for Reminder CRUD operations.
 * Handles reminder creation, updates, and snooze functionality.
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
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import type {
  Reminder,
  CreateReminderInput,
  UpdateReminderInput,
  SnoozeOption,
  ReminderStatus,
  ReminderType,
} from '../../types';
import { ValidationError } from '../../utils/validation';

/** Firestore collection name for reminders */
const REMINDERS_COLLECTION = 'reminders';

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validate user ID
 */
function validateUserId(userId: string, fieldName: string = 'userId'): void {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new ValidationError(`${fieldName} is required`, fieldName, 'MISSING_USER_ID');
  }
  if (userId.length > 128) {
    throw new ValidationError(`${fieldName} is invalid`, fieldName, 'INVALID_USER_ID');
  }
}

/**
 * Validate reminder ID
 */
function validateReminderId(reminderId: string, fieldName: string = 'reminderId'): void {
  if (!reminderId || typeof reminderId !== 'string' || reminderId.trim().length === 0) {
    throw new ValidationError(
      `${fieldName} is required and must be a non-empty string`,
      fieldName,
      'INVALID_REMINDER_ID'
    );
  }
  if (reminderId.length > 1500) {
    throw new ValidationError(`${fieldName} exceeds maximum length`, fieldName, 'REMINDER_ID_TOO_LONG');
  }
}

/**
 * Validate reminder type
 */
function validateReminderType(type: unknown): asserts type is ReminderType {
  const validTypes: ReminderType[] = ['push', 'email', 'inApp'];
  if (typeof type !== 'string' || !validTypes.includes(type as ReminderType)) {
    throw new ValidationError(
      'Reminder type must be push, email, or inApp',
      'type',
      'INVALID_REMINDER_TYPE'
    );
  }
}

/**
 * Validate reminder status
 */
function validateReminderStatus(status: unknown): asserts status is ReminderStatus {
  const validStatuses: ReminderStatus[] = ['pending', 'triggered', 'dismissed', 'snoozed'];
  if (typeof status !== 'string' || !validStatuses.includes(status as ReminderStatus)) {
    throw new ValidationError(
      'Reminder status must be pending, triggered, dismissed, or snoozed',
      'status',
      'INVALID_REMINDER_STATUS'
    );
  }
}

/**
 * Validate minutes before value
 */
function validateMinutesBefore(minutes: number): void {
  if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 0) {
    throw new ValidationError(
      'Minutes before must be a non-negative integer',
      'minutesBefore',
      'INVALID_MINUTES_BEFORE'
    );
  }
  // Maximum 1 week before (in minutes)
  const maxMinutes = 60 * 24 * 7;
  if (minutes > maxMinutes) {
    throw new ValidationError(
      `Minutes before cannot exceed ${maxMinutes} (1 week)`,
      'minutesBefore',
      'MINUTES_TOO_LARGE'
    );
  }
}

/**
 * Validate snooze option
 */
function validateSnoozeOption(minutes: number): asserts minutes is SnoozeOption {
  const validOptions: SnoozeOption[] = [5, 15, 30, 60];
  if (!validOptions.includes(minutes as SnoozeOption)) {
    throw new ValidationError(
      'Snooze minutes must be 5, 15, 30, or 60',
      'snoozeMinutes',
      'INVALID_SNOOZE_OPTION'
    );
  }
}

/**
 * Validate CreateReminderInput
 */
function validateCreateReminderInput(input: CreateReminderInput): void {
  // Either taskId or eventId must be provided, but not both
  const hasTaskId = input.taskId !== undefined && input.taskId !== null;
  const hasEventId = input.eventId !== undefined && input.eventId !== null;

  if (!hasTaskId && !hasEventId) {
    throw new ValidationError(
      'Either taskId or eventId must be provided',
      'taskId/eventId',
      'MISSING_ITEM_ID'
    );
  }

  if (hasTaskId && hasEventId) {
    throw new ValidationError(
      'Cannot provide both taskId and eventId',
      'taskId/eventId',
      'BOTH_IDS_PROVIDED'
    );
  }

  // Validate type
  validateReminderType(input.type);

  // Validate minutesBefore
  validateMinutesBefore(input.minutesBefore);

  // Validate scheduledTime if provided
  if (input.scheduledTime !== undefined) {
    if (!(input.scheduledTime instanceof Date) || isNaN(input.scheduledTime.getTime())) {
      throw new ValidationError('scheduledTime must be a valid date', 'scheduledTime', 'INVALID_DATE');
    }
  }
}

/**
 * Validate UpdateReminderInput
 */
function validateUpdateReminderInput(input: UpdateReminderInput): void {
  // Validate ID
  validateReminderId(input.id);

  // Validate type if provided
  if (input.type !== undefined) {
    validateReminderType(input.type);
  }

  // Validate minutesBefore if provided
  if (input.minutesBefore !== undefined) {
    validateMinutesBefore(input.minutesBefore);
  }

  // Validate status if provided
  if (input.status !== undefined) {
    validateReminderStatus(input.status);
  }

  // Validate scheduledTime if provided
  if (input.scheduledTime !== undefined) {
    if (!(input.scheduledTime instanceof Date) || isNaN(input.scheduledTime.getTime())) {
      throw new ValidationError('scheduledTime must be a valid date', 'scheduledTime', 'INVALID_DATE');
    }
  }
}

// =============================================================================
// Conversion Functions
// =============================================================================

/**
 * Convert a Reminder object to Firestore document format
 * Converts Date objects to Firestore Timestamps
 */
function reminderToFirestore(reminder: Partial<Reminder>): DocumentData {
  const data: DocumentData = { ...reminder };

  // Convert Date fields to Timestamps
  if (reminder.scheduledTime) {
    data.scheduledTime = Timestamp.fromDate(reminder.scheduledTime);
  }
  if (reminder.triggeredAt) {
    data.triggeredAt = Timestamp.fromDate(reminder.triggeredAt);
  }
  if (reminder.dismissedAt) {
    data.dismissedAt = Timestamp.fromDate(reminder.dismissedAt);
  }
  if (reminder.snoozedUntil) {
    data.snoozedUntil = Timestamp.fromDate(reminder.snoozedUntil);
  }
  if (reminder.createdAt) {
    data.createdAt = Timestamp.fromDate(reminder.createdAt);
  }
  if (reminder.updatedAt) {
    data.updatedAt = Timestamp.fromDate(reminder.updatedAt);
  }

  return data;
}

/**
 * Convert a Firestore document to a Reminder object
 * Converts Firestore Timestamps to Date objects
 */
function firestoreToReminder(doc: QueryDocumentSnapshot<DocumentData>): Reminder {
  const data = doc.data();

  return {
    id: doc.id,
    userId: data.userId,
    taskId: data.taskId || null,
    eventId: data.eventId || null,
    type: data.type,
    minutesBefore: data.minutesBefore,
    status: data.status,
    scheduledTime: data.scheduledTime?.toDate() || new Date(),
    triggeredAt: data.triggeredAt?.toDate() || null,
    dismissedAt: data.dismissedAt?.toDate() || null,
    snoozedUntil: data.snoozedUntil?.toDate() || null,
    snoozeCount: data.snoozeCount || 0,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

// =============================================================================
// CRUD Operations
// =============================================================================

/**
 * Create a new reminder
 *
 * @param input - Reminder creation input
 * @param userId - The ID of the user creating the reminder
 * @returns The created reminder with generated ID
 * @throws {ValidationError} If input validation fails
 */
export async function createReminder(input: CreateReminderInput, userId: string): Promise<Reminder> {
  // Validate inputs
  validateUserId(userId);
  validateCreateReminderInput(input);

  const now = new Date();

  const reminderData: Omit<Reminder, 'id'> = {
    userId,
    taskId: input.taskId ?? null,
    eventId: input.eventId ?? null,
    type: input.type,
    minutesBefore: input.minutesBefore,
    status: 'pending',
    scheduledTime: input.scheduledTime ?? now,
    triggeredAt: null,
    dismissedAt: null,
    snoozedUntil: null,
    snoozeCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(
      collection(db, REMINDERS_COLLECTION),
      reminderToFirestore(reminderData)
    );

    return {
      ...reminderData,
      id: docRef.id,
    };
  } catch (error) {
    console.error('Error creating reminder:', error);
    throw new Error(`Failed to create reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a single reminder by ID
 *
 * @param reminderId - The ID of the reminder to retrieve
 * @param userId - The ID of the user requesting the reminder
 * @returns The reminder if found, null otherwise
 * @throws {ValidationError} If reminderId is invalid or user is unauthorized
 */
export async function getReminder(reminderId: string, userId: string): Promise<Reminder | null> {
  validateReminderId(reminderId);
  validateUserId(userId);

  try {
    const docRef = doc(db, REMINDERS_COLLECTION, reminderId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const reminder = firestoreToReminder(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (reminder.userId !== userId) {
      throw new ValidationError('Unauthorized access to reminder', 'reminderId', 'UNAUTHORIZED');
    }

    return reminder;
  } catch (error) {
    console.error('Error fetching reminder:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to fetch reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all reminders for a specific task
 *
 * @param taskId - The task ID to get reminders for
 * @param userId - The ID of the user requesting the reminders
 * @returns Array of reminders for the task
 * @throws {ValidationError} If taskId or userId is invalid
 */
export async function getRemindersForTask(taskId: string, userId: string): Promise<Reminder[]> {
  if (!taskId || typeof taskId !== 'string' || taskId.trim().length === 0) {
    throw new ValidationError('Task ID is required', 'taskId', 'MISSING_TASK_ID');
  }
  validateUserId(userId);

  try {
    const q = query(
      collection(db, REMINDERS_COLLECTION),
      where('userId', '==', userId),
      where('taskId', '==', taskId),
      orderBy('scheduledTime')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToReminder);
  } catch (error) {
    console.error('Error fetching reminders for task:', error);
    throw new Error(`Failed to fetch reminders for task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all reminders for a specific event
 *
 * @param eventId - The event ID to get reminders for
 * @param userId - The ID of the user requesting the reminders
 * @returns Array of reminders for the event
 * @throws {ValidationError} If eventId or userId is invalid
 */
export async function getRemindersForEvent(eventId: string, userId: string): Promise<Reminder[]> {
  if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
    throw new ValidationError('Event ID is required', 'eventId', 'MISSING_EVENT_ID');
  }
  validateUserId(userId);

  try {
    const q = query(
      collection(db, REMINDERS_COLLECTION),
      where('userId', '==', userId),
      where('eventId', '==', eventId),
      orderBy('scheduledTime')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToReminder);
  } catch (error) {
    console.error('Error fetching reminders for event:', error);
    throw new Error(`Failed to fetch reminders for event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all reminders for an item (task or event)
 *
 * @param itemId - The task or event ID
 * @param itemType - Whether this is a 'task' or 'event'
 * @param userId - The ID of the user requesting the reminders
 * @returns Array of reminders for the item
 */
export async function getRemindersForItem(
  itemId: string,
  itemType: 'task' | 'event',
  userId: string
): Promise<Reminder[]> {
  if (itemType === 'task') {
    return getRemindersForTask(itemId, userId);
  }
  return getRemindersForEvent(itemId, userId);
}

/**
 * Get all pending reminders for a user
 *
 * @param userId - The user's ID
 * @returns Array of pending reminders
 * @throws {ValidationError} If userId is invalid
 */
export async function getPendingReminders(userId: string): Promise<Reminder[]> {
  validateUserId(userId);

  try {
    const q = query(
      collection(db, REMINDERS_COLLECTION),
      where('userId', '==', userId),
      where('status', 'in', ['pending', 'snoozed']),
      orderBy('scheduledTime')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToReminder);
  } catch (error) {
    console.error('Error fetching pending reminders:', error);
    throw new Error(`Failed to fetch pending reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all reminders for a user
 *
 * @param userId - The user's ID
 * @returns Array of all reminders for the user
 * @throws {ValidationError} If userId is invalid
 */
export async function getUserReminders(userId: string): Promise<Reminder[]> {
  validateUserId(userId);

  try {
    const q = query(
      collection(db, REMINDERS_COLLECTION),
      where('userId', '==', userId),
      orderBy('scheduledTime', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToReminder);
  } catch (error) {
    console.error('Error fetching user reminders:', error);
    throw new Error(`Failed to fetch user reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update an existing reminder
 *
 * @param input - Update input with reminder ID and fields to update
 * @param userId - The ID of the user updating the reminder
 * @returns The updated reminder
 * @throws {ValidationError} If input validation fails or user is unauthorized
 */
export async function updateReminder(input: UpdateReminderInput, userId: string): Promise<Reminder> {
  validateUpdateReminderInput(input);
  validateUserId(userId);

  const { id, ...updates } = input;

  try {
    // Verify ownership
    const docRef = doc(db, REMINDERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Reminder not found', 'id', 'NOT_FOUND');
    }

    const existingReminder = firestoreToReminder(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (existingReminder.userId !== userId) {
      throw new ValidationError('Unauthorized access to reminder', 'id', 'UNAUTHORIZED');
    }

    // Build update object
    const updateData: Partial<Reminder> = {
      ...updates,
      updatedAt: new Date(),
    };

    await updateDoc(docRef, reminderToFirestore(updateData));

    return {
      ...existingReminder,
      ...updateData,
    };
  } catch (error) {
    console.error('Error updating reminder:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to update reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a reminder
 *
 * @param reminderId - The ID of the reminder to delete
 * @param userId - The ID of the user deleting the reminder
 * @throws {ValidationError} If reminderId is invalid or user is unauthorized
 */
export async function deleteReminder(reminderId: string, userId: string): Promise<void> {
  validateReminderId(reminderId);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, REMINDERS_COLLECTION, reminderId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Reminder not found', 'reminderId', 'NOT_FOUND');
    }

    const reminder = firestoreToReminder(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (reminder.userId !== userId) {
      throw new ValidationError('Unauthorized access to reminder', 'reminderId', 'UNAUTHORIZED');
    }

    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting reminder:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to delete reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// Snooze Functionality
// =============================================================================

/**
 * Snooze a reminder
 *
 * Updates the reminder's scheduled time to the current time plus snooze minutes.
 * Increments the snooze count and sets status to 'snoozed'.
 *
 * @param reminderId - The ID of the reminder to snooze
 * @param snoozeMinutes - How many minutes to snooze (5, 15, 30, or 60)
 * @param userId - The ID of the user snoozing the reminder
 * @returns The updated reminder
 * @throws {ValidationError} If inputs are invalid or user is unauthorized
 */
export async function snoozeReminder(
  reminderId: string,
  snoozeMinutes: SnoozeOption,
  userId: string
): Promise<Reminder> {
  validateReminderId(reminderId);
  validateSnoozeOption(snoozeMinutes);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, REMINDERS_COLLECTION, reminderId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Reminder not found', 'reminderId', 'NOT_FOUND');
    }

    const existingReminder = firestoreToReminder(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (existingReminder.userId !== userId) {
      throw new ValidationError('Unauthorized access to reminder', 'reminderId', 'UNAUTHORIZED');
    }

    // Calculate new scheduled time
    const now = new Date();
    const snoozedUntil = new Date(now.getTime() + snoozeMinutes * 60 * 1000);

    // Build update
    const updateData: Partial<Reminder> = {
      status: 'snoozed',
      snoozedUntil,
      snoozeCount: existingReminder.snoozeCount + 1,
      updatedAt: now,
    };

    await updateDoc(docRef, reminderToFirestore(updateData));

    return {
      ...existingReminder,
      ...updateData,
    };
  } catch (error) {
    console.error('Error snoozing reminder:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to snooze reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Dismiss a reminder
 *
 * Sets the reminder status to 'dismissed' and records the dismissed time.
 *
 * @param reminderId - The ID of the reminder to dismiss
 * @param userId - The ID of the user dismissing the reminder
 * @returns The updated reminder
 * @throws {ValidationError} If inputs are invalid or user is unauthorized
 */
export async function dismissReminder(reminderId: string, userId: string): Promise<Reminder> {
  validateReminderId(reminderId);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, REMINDERS_COLLECTION, reminderId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Reminder not found', 'reminderId', 'NOT_FOUND');
    }

    const existingReminder = firestoreToReminder(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (existingReminder.userId !== userId) {
      throw new ValidationError('Unauthorized access to reminder', 'reminderId', 'UNAUTHORIZED');
    }

    const now = new Date();

    // Build update
    const updateData: Partial<Reminder> = {
      status: 'dismissed',
      dismissedAt: now,
      updatedAt: now,
    };

    await updateDoc(docRef, reminderToFirestore(updateData));

    return {
      ...existingReminder,
      ...updateData,
    };
  } catch (error) {
    console.error('Error dismissing reminder:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to dismiss reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Mark a reminder as triggered
 *
 * Updates the reminder status to 'triggered' and records the triggered time.
 * Called when the notification is actually shown to the user.
 *
 * @param reminderId - The ID of the reminder to mark as triggered
 * @param userId - The ID of the user
 * @returns The updated reminder
 * @throws {ValidationError} If inputs are invalid or user is unauthorized
 */
export async function markReminderTriggered(reminderId: string, userId: string): Promise<Reminder> {
  validateReminderId(reminderId);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, REMINDERS_COLLECTION, reminderId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Reminder not found', 'reminderId', 'NOT_FOUND');
    }

    const existingReminder = firestoreToReminder(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (existingReminder.userId !== userId) {
      throw new ValidationError('Unauthorized access to reminder', 'reminderId', 'UNAUTHORIZED');
    }

    const now = new Date();

    // Build update
    const updateData: Partial<Reminder> = {
      status: 'triggered',
      triggeredAt: now,
      updatedAt: now,
    };

    await updateDoc(docRef, reminderToFirestore(updateData));

    return {
      ...existingReminder,
      ...updateData,
    };
  } catch (error) {
    console.error('Error marking reminder as triggered:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to mark reminder as triggered: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
