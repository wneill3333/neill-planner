/**
 * Events Service
 *
 * Firestore service layer for Event CRUD operations.
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
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import type { Event, CreateEventInput, UpdateEventInput } from '../../types';
import { DEFAULT_EVENT_VALUES } from '../../types';
import {
  validateUserId,
  validateDate,
  validateDateRange,
  sanitizeString,
  ValidationError,
} from '../../utils/validation';

/** Firestore collection name for events */
const EVENTS_COLLECTION = 'events';

/**
 * Validate event ID
 */
function validateEventId(eventId: string, fieldName: string = 'eventId'): void {
  if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
    throw new ValidationError(
      `${fieldName} is required and must be a non-empty string`,
      fieldName,
      'INVALID_EVENT_ID'
    );
  }
  if (eventId.length > 1500) {
    throw new ValidationError(`${fieldName} exceeds maximum length`, fieldName, 'EVENT_ID_TOO_LONG');
  }
}

/**
 * Validate CreateEventInput
 */
function validateCreateEventInput(input: CreateEventInput): void {
  // Validate title
  const title = sanitizeString(input.title);
  if (!title || title.length === 0) {
    throw new ValidationError('Title is required', 'title', 'MISSING_TITLE');
  }
  if (title.length > 500) {
    throw new ValidationError('Title must be at most 500 characters', 'title', 'TOO_LONG');
  }

  // Validate description if provided
  if (input.description !== undefined && input.description !== '') {
    const description = sanitizeString(input.description);
    if (description.length > 5000) {
      throw new ValidationError('Description must be at most 5000 characters', 'description', 'TOO_LONG');
    }
  }

  // Validate start and end times
  validateDate(input.startTime, 'startTime');
  validateDate(input.endTime, 'endTime');

  // Validate end time is after start time
  if (input.endTime <= input.startTime) {
    throw new ValidationError(
      'End time must be after start time',
      'endTime',
      'INVALID_TIME_RANGE'
    );
  }

  // Validate location if provided
  if (input.location !== undefined && input.location !== '') {
    const location = sanitizeString(input.location);
    if (location.length > 500) {
      throw new ValidationError('Location must be at most 500 characters', 'location', 'TOO_LONG');
    }
  }

  // Validate alternateTitle if provided
  if (input.alternateTitle !== undefined && input.alternateTitle !== null) {
    const alternateTitle = sanitizeString(input.alternateTitle);
    if (alternateTitle.length > 500) {
      throw new ValidationError('Alternate title must be at most 500 characters', 'alternateTitle', 'TOO_LONG');
    }
  }

  // Validate categoryId if provided
  if (input.categoryId !== undefined && input.categoryId !== null) {
    if (typeof input.categoryId !== 'string' || input.categoryId.trim().length === 0) {
      throw new ValidationError('Category ID must be a non-empty string', 'categoryId', 'INVALID_CATEGORY_ID');
    }
  }
}

/**
 * Validate UpdateEventInput
 */
function validateUpdateEventInput(input: UpdateEventInput): void {
  // Validate ID
  if (!input.id || typeof input.id !== 'string' || input.id.trim().length === 0) {
    throw new ValidationError('Event ID is required', 'id', 'MISSING_ID');
  }

  // Validate title if provided
  if (input.title !== undefined) {
    const title = sanitizeString(input.title);
    if (!title || title.length === 0) {
      throw new ValidationError('Title cannot be empty', 'title', 'EMPTY_TITLE');
    }
    if (title.length > 500) {
      throw new ValidationError('Title must be at most 500 characters', 'title', 'TOO_LONG');
    }
  }

  // Validate description if provided
  if (input.description !== undefined && input.description !== '') {
    const description = sanitizeString(input.description);
    if (description.length > 5000) {
      throw new ValidationError('Description must be at most 5000 characters', 'description', 'TOO_LONG');
    }
  }

  // Validate start time if provided
  if (input.startTime !== undefined) {
    validateDate(input.startTime, 'startTime');
  }

  // Validate end time if provided
  if (input.endTime !== undefined) {
    validateDate(input.endTime, 'endTime');
  }

  // Validate time range if both are provided
  if (input.startTime !== undefined && input.endTime !== undefined) {
    if (input.endTime <= input.startTime) {
      throw new ValidationError(
        'End time must be after start time',
        'endTime',
        'INVALID_TIME_RANGE'
      );
    }
  }

  // Validate location if provided
  if (input.location !== undefined && input.location !== '') {
    const location = sanitizeString(input.location);
    if (location.length > 500) {
      throw new ValidationError('Location must be at most 500 characters', 'location', 'TOO_LONG');
    }
  }

  // Validate alternateTitle if provided
  if (input.alternateTitle !== undefined && input.alternateTitle !== null) {
    const alternateTitle = sanitizeString(input.alternateTitle);
    if (alternateTitle.length > 500) {
      throw new ValidationError('Alternate title must be at most 500 characters', 'alternateTitle', 'TOO_LONG');
    }
  }

  // Validate categoryId if provided
  if (input.categoryId !== undefined && input.categoryId !== null) {
    if (typeof input.categoryId !== 'string' || input.categoryId.trim().length === 0) {
      throw new ValidationError('Category ID must be a non-empty string', 'categoryId', 'INVALID_CATEGORY_ID');
    }
  }
}

/**
 * Convert an Event object to Firestore document format
 * Converts Date objects to Firestore Timestamps
 */
function eventToFirestore(event: Partial<Event>): DocumentData {
  const data: DocumentData = { ...event };

  // Convert Date fields to Timestamps
  if (event.startTime) {
    data.startTime = Timestamp.fromDate(event.startTime);
  }
  if (event.endTime) {
    data.endTime = Timestamp.fromDate(event.endTime);
  }
  if (event.createdAt) {
    data.createdAt = Timestamp.fromDate(event.createdAt);
  }
  if (event.updatedAt) {
    data.updatedAt = Timestamp.fromDate(event.updatedAt);
  }
  if (event.deletedAt) {
    data.deletedAt = Timestamp.fromDate(event.deletedAt);
  }

  // Handle recurrence pattern date conversions
  if (event.recurrence) {
    data.recurrence = {
      ...event.recurrence,
      endCondition: {
        ...event.recurrence.endCondition,
        endDate: event.recurrence?.endCondition?.endDate
          ? Timestamp.fromDate(event.recurrence.endCondition.endDate)
          : null,
      },
      exceptions: event.recurrence.exceptions.map((date) => Timestamp.fromDate(date)),
    };
  }

  // Handle recurring instance date
  if (event.instanceDate) {
    data.instanceDate = Timestamp.fromDate(event.instanceDate);
  }

  return data;
}

/**
 * Convert a Firestore document to an Event object
 * Converts Firestore Timestamps to Date objects
 */
function firestoreToEvent(doc: QueryDocumentSnapshot<DocumentData>): Event {
  const data = doc.data();

  const event: Event = {
    id: doc.id,
    userId: data.userId,
    title: data.title,
    description: data.description || '',
    categoryId: data.categoryId || null,
    startTime: data.startTime?.toDate() || new Date(),
    endTime: data.endTime?.toDate() || new Date(),
    location: data.location || '',
    isConfidential: data.isConfidential || false,
    alternateTitle: data.alternateTitle || null,
    recurrence: null,
    linkedNoteIds: data.linkedNoteIds || [],
    linkedTaskIds: data.linkedTaskIds || [],
    googleCalendarId: data.googleCalendarId || null,
    isRecurringInstance: data.isRecurringInstance || false,
    recurringParentId: data.recurringParentId || null,
    instanceDate: data.instanceDate?.toDate() || null,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    deletedAt: data.deletedAt?.toDate() || null,
    reminderIds: data.reminderIds || [],
  };

  // Handle recurrence pattern date conversions
  if (data.recurrence) {
    event.recurrence = {
      ...data.recurrence,
      endCondition: {
        ...data.recurrence.endCondition,
        endDate: data.recurrence.endCondition.endDate?.toDate() || null,
      },
      exceptions: (data.recurrence.exceptions || []).map((ts: Timestamp) => ts.toDate()),
    };
  }

  return event;
}

/**
 * Create a new event in Firestore
 * @param input - Event creation input (without auto-generated fields)
 * @param userId - The ID of the user creating the event
 * @returns The created event with generated ID
 * @throws {ValidationError} If input validation fails
 */
export async function createEvent(input: CreateEventInput, userId: string): Promise<Event> {
  // Validate user ID
  validateUserId(userId);

  // Validate input
  validateCreateEventInput(input);

  const now = new Date();

  // Sanitize string inputs
  const sanitizedTitle = sanitizeString(input.title);
  const sanitizedDescription = input.description ? sanitizeString(input.description) : '';
  const sanitizedLocation = input.location ? sanitizeString(input.location) : '';
  const sanitizedAlternateTitle = input.alternateTitle ? sanitizeString(input.alternateTitle) : null;

  const eventData: Omit<Event, 'id'> = {
    userId,
    title: sanitizedTitle,
    description: sanitizedDescription,
    categoryId: input.categoryId ?? DEFAULT_EVENT_VALUES.categoryId ?? null,
    startTime: input.startTime,
    endTime: input.endTime,
    location: sanitizedLocation,
    isConfidential: input.isConfidential ?? DEFAULT_EVENT_VALUES.isConfidential ?? false,
    alternateTitle: sanitizedAlternateTitle,
    recurrence: input.recurrence ?? DEFAULT_EVENT_VALUES.recurrence ?? null,
    linkedNoteIds: input.linkedNoteIds ?? DEFAULT_EVENT_VALUES.linkedNoteIds ?? [],
    linkedTaskIds: input.linkedTaskIds ?? DEFAULT_EVENT_VALUES.linkedTaskIds ?? [],
    googleCalendarId: DEFAULT_EVENT_VALUES.googleCalendarId ?? null,
    isRecurringInstance: DEFAULT_EVENT_VALUES.isRecurringInstance ?? false,
    recurringParentId: DEFAULT_EVENT_VALUES.recurringParentId ?? null,
    instanceDate: DEFAULT_EVENT_VALUES.instanceDate ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: DEFAULT_EVENT_VALUES.deletedAt ?? null,
    reminderIds: input.reminderIds ?? DEFAULT_EVENT_VALUES.reminderIds ?? [],
  };

  try {
    const docRef = await addDoc(
      collection(db, EVENTS_COLLECTION),
      eventToFirestore(eventData)
    );

    return {
      ...eventData,
      id: docRef.id,
    };
  } catch (error) {
    console.error('Error creating event:', error);
    throw new Error(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a single event by ID
 * @param eventId - The ID of the event to retrieve
 * @param userId - The ID of the user requesting the event
 * @returns The event if found, null otherwise
 * @throws {ValidationError} If eventId is invalid or user is unauthorized
 */
export async function getEvent(eventId: string, userId: string): Promise<Event | null> {
  validateEventId(eventId);
  validateUserId(userId);

  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const event = firestoreToEvent(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (event.userId !== userId) {
      throw new ValidationError('Unauthorized access to event', 'eventId', 'UNAUTHORIZED');
    }

    return event;
  } catch (error) {
    console.error('Error fetching event:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to fetch event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all events for a user
 * @param userId - The user's ID
 * @returns Array of all user's events (excluding soft-deleted)
 * @throws {ValidationError} If userId is invalid
 */
export async function getUserEvents(userId: string): Promise<Event[]> {
  validateUserId(userId);

  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('userId', '==', userId),
      where('deletedAt', '==', null),
      orderBy('startTime', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToEvent);
  } catch (error) {
    console.error('Error fetching user events:', error);
    throw new Error(`Failed to fetch user events: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get events for a specific date range
 * @param userId - The user's ID
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @returns Array of events within the date range
 * @throws {ValidationError} If inputs are invalid
 */
export async function getEventsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Event[]> {
  // Validate inputs
  validateUserId(userId);
  validateDateRange(startDate, endDate);

  try {
    // Query events where startTime is within the range
    // This catches events that start within the range
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('userId', '==', userId),
      where('startTime', '>=', Timestamp.fromDate(startDate)),
      where('startTime', '<=', Timestamp.fromDate(endDate)),
      where('deletedAt', '==', null),
      orderBy('startTime', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const eventsStartingInRange = querySnapshot.docs.map(firestoreToEvent);

    // Also query events that span into the range (started before startDate but end after startDate)
    // Firestore doesn't support multiple range queries on different fields, so we need a separate query
    const spanningQuery = query(
      collection(db, EVENTS_COLLECTION),
      where('userId', '==', userId),
      where('startTime', '<', Timestamp.fromDate(startDate)),
      where('deletedAt', '==', null),
      orderBy('startTime', 'asc')
    );

    const spanningSnapshot = await getDocs(spanningQuery);
    const spanningEvents = spanningSnapshot.docs
      .map(firestoreToEvent)
      .filter(event => event.endTime > startDate);

    // Combine and deduplicate by ID
    const allEvents = [...spanningEvents, ...eventsStartingInRange];
    const uniqueEvents = allEvents.filter(
      (event, index, self) => index === self.findIndex(e => e.id === event.id)
    );

    // Sort by startTime
    return uniqueEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  } catch (error) {
    console.error('Error fetching events by date range:', error);
    throw new Error(`Failed to fetch events by date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get events for a single day
 * @param userId - The user's ID
 * @param date - The date to filter by
 * @returns Array of events that overlap with the given date
 * @throws {ValidationError} If userId or date is invalid
 */
export async function getEventsByDate(userId: string, date: Date): Promise<Event[]> {
  // Validate inputs
  validateUserId(userId);
  validateDate(date, 'date');

  // Create start and end of day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return getEventsByDateRange(userId, startOfDay, endOfDay);
}

/**
 * Update an existing event
 * @param input - Update input with event ID and fields to update
 * @param userId - The ID of the user updating the event
 * @returns The updated event
 * @throws {ValidationError} If input validation fails or user is unauthorized
 */
export async function updateEvent(input: UpdateEventInput, userId: string): Promise<Event> {
  // Validate input
  validateUpdateEventInput(input);
  validateUserId(userId);

  const { id, title, description, location, alternateTitle, ...otherUpdates } = input;

  try {
    // First, verify ownership
    const docRef = doc(db, EVENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Event not found', 'id', 'NOT_FOUND');
    }

    const existingEvent = firestoreToEvent(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (existingEvent.userId !== userId) {
      throw new ValidationError('Unauthorized access to event', 'id', 'UNAUTHORIZED');
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

    if (location !== undefined) {
      updates.location = sanitizeString(location);
    }

    if (alternateTitle !== undefined) {
      updates.alternateTitle = alternateTitle === null ? null : sanitizeString(alternateTitle);
    }

    const updateData = eventToFirestore(updates as Partial<Event>);
    await updateDoc(docRef, updateData);

    // Return merged local object instead of re-fetching
    return {
      ...existingEvent,
      ...(title !== undefined && { title: updates.title as string }),
      ...(description !== undefined && { description: updates.description as string }),
      ...(location !== undefined && { location: updates.location as string }),
      ...(alternateTitle !== undefined && { alternateTitle: updates.alternateTitle as string | null }),
      ...otherUpdates,
      updatedAt: updates.updatedAt as Date,
    };
  } catch (error) {
    console.error('Error updating event:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Soft delete an event (sets deletedAt timestamp)
 * @param eventId - The ID of the event to delete
 * @param userId - The ID of the user deleting the event
 * @throws {ValidationError} If eventId is invalid or user is unauthorized
 */
export async function deleteEvent(eventId: string, userId: string): Promise<void> {
  validateEventId(eventId);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Event not found', 'eventId', 'NOT_FOUND');
    }

    const event = firestoreToEvent(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (event.userId !== userId) {
      throw new ValidationError('Unauthorized access to event', 'eventId', 'UNAUTHORIZED');
    }

    await updateDoc(docRef, {
      deletedAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error soft deleting event:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to soft delete event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Permanently delete an event from Firestore
 * @param eventId - The ID of the event to delete
 * @param userId - The ID of the user deleting the event
 * @throws {ValidationError} If eventId is invalid or user is unauthorized
 */
export async function hardDeleteEvent(eventId: string, userId: string): Promise<void> {
  validateEventId(eventId);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Event not found', 'eventId', 'NOT_FOUND');
    }

    const event = firestoreToEvent(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (event.userId !== userId) {
      throw new ValidationError('Unauthorized access to event', 'eventId', 'UNAUTHORIZED');
    }

    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error permanently deleting event:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to permanently delete event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Restore a soft-deleted event
 * @param eventId - The ID of the event to restore
 * @param userId - The ID of the user restoring the event
 * @returns The restored event
 * @throws {ValidationError} If eventId is invalid or user is unauthorized
 */
export async function restoreEvent(eventId: string, userId: string): Promise<Event> {
  validateEventId(eventId);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Event not found', 'eventId', 'NOT_FOUND');
    }

    const existingEvent = firestoreToEvent(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (existingEvent.userId !== userId) {
      throw new ValidationError('Unauthorized access to event', 'eventId', 'UNAUTHORIZED');
    }

    await updateDoc(docRef, {
      deletedAt: null,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    // Return merged local object instead of re-fetching
    return {
      ...existingEvent,
      deletedAt: null,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error restoring event:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to restore event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all recurring events (tasks with recurrence patterns) for a user
 * @param userId - The user's ID
 * @returns Array of recurring parent events (events with recurrence !== null)
 * @throws {ValidationError} If userId is invalid
 */
export async function getRecurringEvents(userId: string): Promise<Event[]> {
  validateUserId(userId);

  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('userId', '==', userId),
      where('deletedAt', '==', null),
      orderBy('startTime', 'asc')
    );

    const querySnapshot = await getDocs(q);

    // Filter for events with recurrence patterns (client-side filtering since Firestore
    // doesn't support != null queries combined with other where clauses efficiently)
    return querySnapshot.docs
      .map(firestoreToEvent)
      .filter(event => event.recurrence !== null);
  } catch (error) {
    console.error('Error fetching recurring events:', error);
    throw new Error(`Failed to fetch recurring events: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all events for a user (including soft-deleted)
 * @param userId - The user's ID
 * @returns Array of all user's events
 * @throws {ValidationError} If userId is invalid
 */
export async function getAllEventsForUser(userId: string): Promise<Event[]> {
  validateUserId(userId);

  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('startTime', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToEvent);
  } catch (error) {
    console.error('Error fetching all events for user:', error);
    throw new Error(`Failed to fetch all events: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
