/**
 * Notes Service
 *
 * Firestore service layer for Note CRUD operations.
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
import type { Note, CreateNoteInput, UpdateNoteInput } from '../../types';
import {
  validateUserId,
  validateDate,
  validateDateRange,
  sanitizeString,
  ValidationError,
} from '../../utils/validation';

/** Firestore collection name for notes */
const NOTES_COLLECTION = 'notes';

/**
 * Validate note ID
 */
function validateNoteId(noteId: string, fieldName: string = 'noteId'): void {
  if (!noteId || typeof noteId !== 'string' || noteId.trim().length === 0) {
    throw new ValidationError(
      `${fieldName} is required and must be a non-empty string`,
      fieldName,
      'INVALID_NOTE_ID'
    );
  }
  if (noteId.length > 1500) {
    throw new ValidationError(`${fieldName} exceeds maximum length`, fieldName, 'NOTE_ID_TOO_LONG');
  }
}

/**
 * Validate CreateNoteInput
 */
function validateCreateNoteInput(input: CreateNoteInput): void {
  // Validate title
  const title = sanitizeString(input.title);
  if (!title || title.length === 0) {
    throw new ValidationError('Title is required', 'title', 'MISSING_TITLE');
  }
  if (title.length > 500) {
    throw new ValidationError('Title must be at most 500 characters', 'title', 'TOO_LONG');
  }

  // Validate content if provided (can be empty, rich text can be long)
  if (input.content !== undefined && input.content !== '') {
    const content = sanitizeString(input.content);
    if (content.length > 50000) {
      throw new ValidationError('Content must be at most 50000 characters', 'content', 'TOO_LONG');
    }
  }

  // Validate date
  validateDate(input.date, 'date');

  // Validate categoryId if provided
  if (input.categoryId !== undefined && input.categoryId !== null) {
    if (typeof input.categoryId !== 'string' || input.categoryId.trim().length === 0) {
      throw new ValidationError('Category ID must be a non-empty string', 'categoryId', 'INVALID_CATEGORY_ID');
    }
  }

  // Validate linkedTaskIds if provided
  if (input.linkedTaskIds !== undefined) {
    if (!Array.isArray(input.linkedTaskIds)) {
      throw new ValidationError('linkedTaskIds must be an array', 'linkedTaskIds', 'INVALID_TYPE');
    }
  }

  // Validate linkedEventIds if provided
  if (input.linkedEventIds !== undefined) {
    if (!Array.isArray(input.linkedEventIds)) {
      throw new ValidationError('linkedEventIds must be an array', 'linkedEventIds', 'INVALID_TYPE');
    }
  }
}

/**
 * Validate UpdateNoteInput
 */
function validateUpdateNoteInput(input: UpdateNoteInput): void {
  // Validate ID
  if (!input.id || typeof input.id !== 'string' || input.id.trim().length === 0) {
    throw new ValidationError('Note ID is required', 'id', 'MISSING_ID');
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

  // Validate content if provided
  if (input.content !== undefined && input.content !== '') {
    const content = sanitizeString(input.content);
    if (content.length > 50000) {
      throw new ValidationError('Content must be at most 50000 characters', 'content', 'TOO_LONG');
    }
  }

  // Validate date if provided
  if (input.date !== undefined) {
    validateDate(input.date, 'date');
  }

  // Validate categoryId if provided
  if (input.categoryId !== undefined && input.categoryId !== null) {
    if (typeof input.categoryId !== 'string' || input.categoryId.trim().length === 0) {
      throw new ValidationError('Category ID must be a non-empty string', 'categoryId', 'INVALID_CATEGORY_ID');
    }
  }

  // Validate linkedTaskIds if provided
  if (input.linkedTaskIds !== undefined) {
    if (!Array.isArray(input.linkedTaskIds)) {
      throw new ValidationError('linkedTaskIds must be an array', 'linkedTaskIds', 'INVALID_TYPE');
    }
  }

  // Validate linkedEventIds if provided
  if (input.linkedEventIds !== undefined) {
    if (!Array.isArray(input.linkedEventIds)) {
      throw new ValidationError('linkedEventIds must be an array', 'linkedEventIds', 'INVALID_TYPE');
    }
  }
}

/**
 * Convert a Note object to Firestore document format
 * Converts Date objects to Firestore Timestamps
 */
function noteToFirestore(note: Partial<Note>): DocumentData {
  const data: DocumentData = { ...note };

  // Convert Date fields to Timestamps
  if (note.date) {
    data.date = Timestamp.fromDate(note.date);
  }
  if (note.createdAt) {
    data.createdAt = Timestamp.fromDate(note.createdAt);
  }
  if (note.updatedAt) {
    data.updatedAt = Timestamp.fromDate(note.updatedAt);
  }
  if (note.deletedAt) {
    data.deletedAt = Timestamp.fromDate(note.deletedAt);
  }

  return data;
}

/**
 * Convert a Firestore document to a Note object
 * Converts Firestore Timestamps to Date objects
 */
function firestoreToNote(doc: QueryDocumentSnapshot<DocumentData>): Note {
  const data = doc.data();

  return {
    id: doc.id,
    userId: data.userId,
    title: data.title,
    content: data.content || '',
    date: data.date?.toDate() || new Date(),
    categoryId: data.categoryId || null,
    linkedTaskIds: data.linkedTaskIds || [],
    linkedEventIds: data.linkedEventIds || [],
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    deletedAt: data.deletedAt?.toDate() || null,
  };
}

/**
 * Create a new note in Firestore
 * @param input - Note creation input (without auto-generated fields)
 * @param userId - The ID of the user creating the note
 * @returns The created note with generated ID
 * @throws {ValidationError} If input validation fails
 */
export async function createNote(input: CreateNoteInput, userId: string): Promise<Note> {
  // Validate user ID
  validateUserId(userId);

  // Validate input
  validateCreateNoteInput(input);

  const now = new Date();

  // Sanitize string inputs
  const sanitizedTitle = sanitizeString(input.title);
  const sanitizedContent = input.content ? sanitizeString(input.content) : '';

  const noteData: Omit<Note, 'id'> = {
    userId,
    title: sanitizedTitle,
    content: sanitizedContent,
    date: input.date,
    categoryId: input.categoryId ?? null,
    linkedTaskIds: input.linkedTaskIds || [],
    linkedEventIds: input.linkedEventIds || [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  try {
    const docRef = await addDoc(
      collection(db, NOTES_COLLECTION),
      noteToFirestore(noteData)
    );

    return {
      ...noteData,
      id: docRef.id,
    };
  } catch (error) {
    console.error('Error creating note:', error);
    throw new Error(`Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a single note by ID
 * @param noteId - The ID of the note to retrieve
 * @param userId - The ID of the user requesting the note
 * @returns The note if found, null otherwise
 * @throws {ValidationError} If noteId is invalid or user is unauthorized
 */
export async function getNote(noteId: string, userId: string): Promise<Note | null> {
  validateNoteId(noteId);
  validateUserId(userId);

  try {
    const docRef = doc(db, NOTES_COLLECTION, noteId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const note = firestoreToNote(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (note.userId !== userId) {
      throw new ValidationError('Unauthorized access to note', 'noteId', 'UNAUTHORIZED');
    }

    return note;
  } catch (error) {
    console.error('Error fetching note:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to fetch note: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all notes for a user on a specific date
 * @param userId - The user's ID
 * @param date - The date to filter by
 * @returns Array of notes for that date
 * @throws {ValidationError} If userId or date is invalid
 */
export async function getNotesByDate(userId: string, date: Date): Promise<Note[]> {
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
      collection(db, NOTES_COLLECTION),
      where('userId', '==', userId),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay)),
      where('deletedAt', '==', null),
      orderBy('date'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToNote);
  } catch (error) {
    console.error('Error fetching notes by date:', error);
    throw new Error(`Failed to fetch notes by date: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all notes for a user within a date range
 * @param userId - The user's ID
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @returns Array of notes within the date range
 * @throws {ValidationError} If inputs are invalid
 */
export async function getNotesByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Note[]> {
  // Validate inputs
  validateUserId(userId);
  validateDateRange(startDate, endDate);

  try {
    const q = query(
      collection(db, NOTES_COLLECTION),
      where('userId', '==', userId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      where('deletedAt', '==', null),
      orderBy('date'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToNote);
  } catch (error) {
    console.error('Error fetching notes by date range:', error);
    throw new Error(`Failed to fetch notes by date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all notes for a user (including soft-deleted)
 * @param userId - The user's ID
 * @returns Array of all user's notes
 * @throws {ValidationError} If userId is invalid
 */
export async function getUserNotes(userId: string): Promise<Note[]> {
  validateUserId(userId);

  try {
    const q = query(
      collection(db, NOTES_COLLECTION),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToNote);
  } catch (error) {
    console.error('Error fetching all notes for user:', error);
    throw new Error(`Failed to fetch all notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update an existing note
 * @param input - Update input with note ID and fields to update
 * @param userId - The ID of the user updating the note
 * @returns The updated note
 * @throws {ValidationError} If input validation fails or user is unauthorized
 */
export async function updateNote(input: UpdateNoteInput, userId: string): Promise<Note> {
  // Validate input
  validateUpdateNoteInput(input);
  validateUserId(userId);

  const { id, title, content, ...otherUpdates } = input;

  try {
    // First, verify ownership
    const docRef = doc(db, NOTES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Note not found', 'id', 'NOT_FOUND');
    }

    const existingNote = firestoreToNote(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (existingNote.userId !== userId) {
      throw new ValidationError('Unauthorized access to note', 'id', 'UNAUTHORIZED');
    }

    // Sanitize string inputs if provided
    const updates: Record<string, unknown> = {
      ...otherUpdates,
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      updates.title = sanitizeString(title);
    }

    if (content !== undefined) {
      updates.content = sanitizeString(content);
    }

    const updateData = noteToFirestore(updates as Partial<Note>);
    await updateDoc(docRef, updateData);

    // Return merged local object instead of re-fetching
    return {
      ...existingNote,
      ...(title !== undefined && { title: updates.title as string }),
      ...(content !== undefined && { content: updates.content as string }),
      ...otherUpdates,
      updatedAt: updates.updatedAt as Date,
    };
  } catch (error) {
    console.error('Error updating note:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to update note: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Soft delete a note (sets deletedAt timestamp)
 * @param noteId - The ID of the note to delete
 * @param userId - The ID of the user deleting the note
 * @throws {ValidationError} If noteId is invalid or user is unauthorized
 */
export async function softDeleteNote(noteId: string, userId: string): Promise<void> {
  validateNoteId(noteId);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, NOTES_COLLECTION, noteId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Note not found', 'noteId', 'NOT_FOUND');
    }

    const note = firestoreToNote(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (note.userId !== userId) {
      throw new ValidationError('Unauthorized access to note', 'noteId', 'UNAUTHORIZED');
    }

    await updateDoc(docRef, {
      deletedAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error soft deleting note:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to soft delete note: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Permanently delete a note from Firestore
 * @param noteId - The ID of the note to delete
 * @param userId - The ID of the user deleting the note
 * @throws {ValidationError} If noteId is invalid or user is unauthorized
 */
export async function hardDeleteNote(noteId: string, userId: string): Promise<void> {
  validateNoteId(noteId);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, NOTES_COLLECTION, noteId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Note not found', 'noteId', 'NOT_FOUND');
    }

    const note = firestoreToNote(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (note.userId !== userId) {
      throw new ValidationError('Unauthorized access to note', 'noteId', 'UNAUTHORIZED');
    }

    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error permanently deleting note:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to permanently delete note: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Restore a soft-deleted note
 * @param noteId - The ID of the note to restore
 * @param userId - The ID of the user restoring the note
 * @returns The restored note
 * @throws {ValidationError} If noteId is invalid or user is unauthorized
 */
export async function restoreNote(noteId: string, userId: string): Promise<Note> {
  validateNoteId(noteId);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, NOTES_COLLECTION, noteId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Note not found', 'noteId', 'NOT_FOUND');
    }

    const existingNote = firestoreToNote(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (existingNote.userId !== userId) {
      throw new ValidationError('Unauthorized access to note', 'noteId', 'UNAUTHORIZED');
    }

    await updateDoc(docRef, {
      deletedAt: null,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    // Return merged local object instead of re-fetching
    return {
      ...existingNote,
      deletedAt: null,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error restoring note:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to restore note: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
