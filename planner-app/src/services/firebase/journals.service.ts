/**
 * Journals Service
 *
 * Firestore service layer for Journal and JournalEntry CRUD operations.
 * Handles data conversion between app types and Firestore documents.
 * Journals are persistent topic containers; entries accumulate within them.
 *
 * Collections:
 *   - `journals`       (flat) - Journal container documents
 *   - `journalEntries` (flat) - Individual dated entries with journalId FK
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
  increment,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { db, storage } from './config';
import type {
  Journal,
  CreateJournalInput,
  UpdateJournalInput,
  JournalEntry,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
} from '../../types/journal.types';
import type { NoteAttachment } from '../../types/note.types';
import { ATTACHMENT_LIMITS } from '../../types/note.types';
import {
  validateUserId,
  sanitizeString,
  ValidationError,
} from '../../utils/validation';

// =============================================================================
// Constants
// =============================================================================

/** Firestore collection name for journals */
const JOURNALS_COLLECTION = 'journals';

/** Firestore collection name for journal entries */
const JOURNAL_ENTRIES_COLLECTION = 'journalEntries';

// =============================================================================
// Validation Helpers (private)
// =============================================================================

/**
 * Validate journal ID
 */
function validateJournalId(id: string, fieldName: string = 'journalId'): void {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new ValidationError(
      `${fieldName} is required and must be a non-empty string`,
      fieldName,
      'INVALID_JOURNAL_ID'
    );
  }
  if (id.length > 1500) {
    throw new ValidationError(`${fieldName} exceeds maximum length`, fieldName, 'JOURNAL_ID_TOO_LONG');
  }
}

/**
 * Validate entry ID
 */
function validateEntryId(id: string, fieldName: string = 'entryId'): void {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new ValidationError(
      `${fieldName} is required and must be a non-empty string`,
      fieldName,
      'INVALID_ENTRY_ID'
    );
  }
  if (id.length > 1500) {
    throw new ValidationError(`${fieldName} exceeds maximum length`, fieldName, 'ENTRY_ID_TOO_LONG');
  }
}

/**
 * Validate CreateJournalInput
 */
function validateCreateJournalInput(input: CreateJournalInput): void {
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
}

/**
 * Validate UpdateJournalInput
 */
function validateUpdateJournalInput(input: UpdateJournalInput): void {
  // Validate ID
  if (!input.id || typeof input.id !== 'string' || input.id.trim().length === 0) {
    throw new ValidationError('Journal ID is required', 'id', 'MISSING_ID');
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
}

/**
 * Verify journal entry ownership - returns the entry data if authorized
 */
async function verifyJournalEntryOwnership(
  entryId: string,
  userId: string
): Promise<DocumentData> {
  const docRef = doc(db, JOURNAL_ENTRIES_COLLECTION, entryId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new ValidationError('Journal entry not found', 'entryId', 'NOT_FOUND');
  }

  const data = docSnap.data();
  if (data.userId !== userId) {
    throw new ValidationError('Unauthorized access to journal entry', 'entryId', 'UNAUTHORIZED');
  }

  return data;
}

// =============================================================================
// Firestore Converters
// =============================================================================

/**
 * Convert a Journal object to Firestore document format
 * Converts Date objects to Firestore Timestamps
 */
function journalToFirestore(journal: Partial<Journal>): DocumentData {
  const data: DocumentData = { ...journal };

  // Convert Date fields to Timestamps
  if (journal.lastEntryAt) {
    data.lastEntryAt = Timestamp.fromDate(journal.lastEntryAt);
  }
  if (journal.createdAt) {
    data.createdAt = Timestamp.fromDate(journal.createdAt);
  }
  if (journal.updatedAt) {
    data.updatedAt = Timestamp.fromDate(journal.updatedAt);
  }
  if (journal.deletedAt) {
    data.deletedAt = Timestamp.fromDate(journal.deletedAt);
  }

  return data;
}

/**
 * Convert a Firestore document to a Journal object
 * Converts Firestore Timestamps to Date objects
 */
function firestoreToJournal(doc: QueryDocumentSnapshot<DocumentData>): Journal {
  const data = doc.data();

  return {
    id: doc.id,
    userId: data.userId,
    title: data.title,
    description: data.description || '',
    entryCount: data.entryCount || 0,
    lastEntryAt: data.lastEntryAt?.toDate() || null,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    categoryId: data.categoryId || null,
    deletedAt: data.deletedAt?.toDate() || null,
  };
}

/**
 * Convert a JournalEntry object to Firestore document format
 * Converts Date objects to Firestore Timestamps
 */
function journalEntryToFirestore(entry: Partial<JournalEntry>): DocumentData {
  const data: DocumentData = { ...entry };

  // Convert Date fields to Timestamps
  if (entry.createdAt) {
    data.createdAt = Timestamp.fromDate(entry.createdAt);
  }
  if (entry.updatedAt) {
    data.updatedAt = Timestamp.fromDate(entry.updatedAt);
  }
  if (entry.deletedAt) {
    data.deletedAt = Timestamp.fromDate(entry.deletedAt);
  }

  return data;
}

/**
 * Convert a Firestore document to a JournalEntry object
 * Converts Firestore Timestamps to Date objects
 */
function firestoreToJournalEntry(doc: QueryDocumentSnapshot<DocumentData>): JournalEntry {
  const data = doc.data();

  return {
    id: doc.id,
    journalId: data.journalId,
    userId: data.userId,
    content: data.content || '',
    attachments: (data.attachments || []).map((a: Record<string, unknown>) => ({
      ...a,
      uploadedAt: typeof a.uploadedAt === 'string'
        ? new Date(a.uploadedAt)
        : (a.uploadedAt as { toDate?: () => Date })?.toDate?.() || new Date(),
    })),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    deletedAt: data.deletedAt?.toDate() || null,
  };
}

// =============================================================================
// Attachment Helpers (private)
// =============================================================================

/**
 * Generate a unique ID for an attachment
 */
function generateAttachmentId(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate a single file against attachment limits
 */
function validateFile(file: File): void {
  if (file.size > ATTACHMENT_LIMITS.maxFileSizeBytes) {
    throw new ValidationError(
      `File "${file.name}" exceeds maximum size of ${ATTACHMENT_LIMITS.maxFileSizeBytes / (1024 * 1024)}MB`,
      'file',
      'FILE_TOO_LARGE'
    );
  }

  const allowedTypes: readonly string[] = ATTACHMENT_LIMITS.allowedMimeTypes;
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError(
      `File type "${file.type}" is not allowed. Allowed types: ${ATTACHMENT_LIMITS.allowedMimeTypes.join(', ')}`,
      'file',
      'INVALID_FILE_TYPE'
    );
  }
}

// =============================================================================
// Journal Operations
// =============================================================================

/**
 * Create a new journal in Firestore
 * @param input - Journal creation input (title, optional description)
 * @param userId - The ID of the user creating the journal
 * @returns The created journal with generated ID
 * @throws {ValidationError} If input validation fails
 */
export async function createJournal(input: CreateJournalInput, userId: string): Promise<Journal> {
  validateUserId(userId);
  validateCreateJournalInput(input);

  const now = new Date();

  const sanitizedTitle = sanitizeString(input.title);
  const sanitizedDescription = input.description ? sanitizeString(input.description) : '';

  const journalData: Omit<Journal, 'id'> = {
    userId,
    title: sanitizedTitle,
    description: sanitizedDescription,
    categoryId: input.categoryId || null,
    entryCount: 0,
    lastEntryAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  try {
    const docRef = await addDoc(
      collection(db, JOURNALS_COLLECTION),
      journalToFirestore(journalData)
    );

    return {
      ...journalData,
      id: docRef.id,
    };
  } catch (error) {
    console.error('Error creating journal:', error);
    throw new Error(`Failed to create journal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a single journal by ID
 * @param journalId - The ID of the journal to retrieve
 * @param userId - The ID of the user requesting the journal
 * @returns The journal if found, null otherwise
 * @throws {ValidationError} If journalId is invalid or user is unauthorized
 */
export async function getJournal(journalId: string, userId: string): Promise<Journal | null> {
  validateJournalId(journalId);
  validateUserId(userId);

  try {
    const docRef = doc(db, JOURNALS_COLLECTION, journalId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const journal = firestoreToJournal(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (journal.userId !== userId) {
      throw new ValidationError('Unauthorized access to journal', 'journalId', 'UNAUTHORIZED');
    }

    return journal;
  } catch (error) {
    console.error('Error fetching journal:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to fetch journal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all non-deleted journals for a user, ordered by most recently updated
 * @param userId - The user's ID
 * @returns Array of journals
 * @throws {ValidationError} If userId is invalid
 */
export async function getUserJournals(userId: string): Promise<Journal[]> {
  validateUserId(userId);

  try {
    const q = query(
      collection(db, JOURNALS_COLLECTION),
      where('userId', '==', userId),
      where('deletedAt', '==', null),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToJournal);
  } catch (error) {
    console.error('Error fetching user journals:', error);
    throw new Error(`Failed to fetch journals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update an existing journal
 * @param input - Update input with journal ID and fields to update
 * @param userId - The ID of the user updating the journal
 * @returns The updated journal
 * @throws {ValidationError} If input validation fails or user is unauthorized
 */
export async function updateJournal(input: UpdateJournalInput, userId: string): Promise<Journal> {
  validateUpdateJournalInput(input);
  validateUserId(userId);

  const { id, title, description, categoryId } = input;

  try {
    // Verify ownership
    const docRef = doc(db, JOURNALS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Journal not found', 'id', 'NOT_FOUND');
    }

    const existingJournal = firestoreToJournal(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (existingJournal.userId !== userId) {
      throw new ValidationError('Unauthorized access to journal', 'id', 'UNAUTHORIZED');
    }

    // Build update payload
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      updates.title = sanitizeString(title);
    }

    if (description !== undefined) {
      updates.description = sanitizeString(description);
    }

    if (categoryId !== undefined) {
      updates.categoryId = categoryId || null;
    }

    const updateData = journalToFirestore(updates as Partial<Journal>);
    await updateDoc(docRef, updateData);

    // Return merged local object instead of re-fetching
    return {
      ...existingJournal,
      ...(title !== undefined && { title: updates.title as string }),
      ...(description !== undefined && { description: updates.description as string }),
      ...(categoryId !== undefined && { categoryId: updates.categoryId as string | null }),
      updatedAt: updates.updatedAt as Date,
    };
  } catch (error) {
    console.error('Error updating journal:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to update journal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Soft delete a journal (sets deletedAt timestamp)
 * @param journalId - The ID of the journal to soft delete
 * @param userId - The ID of the user deleting the journal
 * @throws {ValidationError} If journalId is invalid or user is unauthorized
 */
export async function softDeleteJournal(journalId: string, userId: string): Promise<void> {
  validateJournalId(journalId);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, JOURNALS_COLLECTION, journalId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Journal not found', 'journalId', 'NOT_FOUND');
    }

    const journal = firestoreToJournal(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (journal.userId !== userId) {
      throw new ValidationError('Unauthorized access to journal', 'journalId', 'UNAUTHORIZED');
    }

    await updateDoc(docRef, {
      deletedAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error soft deleting journal:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to soft delete journal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Permanently delete a journal, all its entries, and all entry attachments
 * @param journalId - The ID of the journal to permanently delete
 * @param userId - The ID of the user deleting the journal
 * @throws {ValidationError} If journalId is invalid or user is unauthorized
 */
export async function hardDeleteJournal(journalId: string, userId: string): Promise<void> {
  validateJournalId(journalId);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, JOURNALS_COLLECTION, journalId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Journal not found', 'journalId', 'NOT_FOUND');
    }

    const journal = firestoreToJournal(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (journal.userId !== userId) {
      throw new ValidationError('Unauthorized access to journal', 'journalId', 'UNAUTHORIZED');
    }

    // Find all entries for this journal
    const entriesQuery = query(
      collection(db, JOURNAL_ENTRIES_COLLECTION),
      where('journalId', '==', journalId),
      where('userId', '==', userId)
    );
    const entriesSnapshot = await getDocs(entriesQuery);

    // Delete all entry attachments from Storage and then delete each entry document
    const entryDeletePromises = entriesSnapshot.docs.map(async (entryDoc) => {
      // Delete attachments from Storage for this entry
      await deleteAllJournalEntryAttachments(entryDoc.id, userId);
      // Delete the entry document
      await deleteDoc(doc(db, JOURNAL_ENTRIES_COLLECTION, entryDoc.id));
    });

    await Promise.all(entryDeletePromises);

    // Delete the journal document itself
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error permanently deleting journal:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to permanently delete journal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// Journal Entry Operations
// =============================================================================

/**
 * Create a new journal entry in Firestore.
 * Also updates the parent journal: increments entryCount, sets lastEntryAt and updatedAt.
 *
 * @param input - Entry creation input (journalId, optional content)
 * @param userId - The ID of the user creating the entry
 * @returns The created journal entry with generated ID
 * @throws {ValidationError} If input validation fails or user is unauthorized
 */
export async function createJournalEntry(
  input: CreateJournalEntryInput,
  userId: string
): Promise<JournalEntry> {
  validateUserId(userId);
  validateJournalId(input.journalId, 'journalId');

  // Verify parent journal ownership
  const journalRef = doc(db, JOURNALS_COLLECTION, input.journalId);
  const journalSnap = await getDoc(journalRef);

  if (!journalSnap.exists()) {
    throw new ValidationError('Journal not found', 'journalId', 'NOT_FOUND');
  }

  const journalData = journalSnap.data();
  if (journalData.userId !== userId) {
    throw new ValidationError('Unauthorized access to journal', 'journalId', 'UNAUTHORIZED');
  }

  const now = new Date();

  const sanitizedContent = input.content ? sanitizeString(input.content) : '';

  const entryData: Omit<JournalEntry, 'id'> = {
    journalId: input.journalId,
    userId,
    content: sanitizedContent,
    attachments: [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  try {
    // Create the entry document
    const docRef = await addDoc(
      collection(db, JOURNAL_ENTRIES_COLLECTION),
      journalEntryToFirestore(entryData)
    );

    // Update parent journal: atomic increment + timestamps
    await updateDoc(journalRef, {
      entryCount: increment(1),
      lastEntryAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });

    return {
      ...entryData,
      id: docRef.id,
    };
  } catch (error) {
    console.error('Error creating journal entry:', error);
    throw new Error(`Failed to create journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all non-deleted entries for a journal, ordered by most recent first
 * @param journalId - The ID of the journal
 * @param userId - The ID of the user requesting the entries
 * @returns Array of journal entries
 * @throws {ValidationError} If journalId or userId is invalid
 */
export async function getEntriesByJournal(
  journalId: string,
  userId: string
): Promise<JournalEntry[]> {
  validateJournalId(journalId);
  validateUserId(userId);

  try {
    const q = query(
      collection(db, JOURNAL_ENTRIES_COLLECTION),
      where('journalId', '==', journalId),
      where('userId', '==', userId),
      where('deletedAt', '==', null),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToJournalEntry);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    throw new Error(`Failed to fetch journal entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update an existing journal entry
 * @param input - Update input with entry ID, journalId, and fields to update
 * @param userId - The ID of the user updating the entry
 * @returns The updated journal entry
 * @throws {ValidationError} If input validation fails or user is unauthorized
 */
export async function updateJournalEntry(
  input: UpdateJournalEntryInput,
  userId: string
): Promise<JournalEntry> {
  validateEntryId(input.id, 'id');
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, JOURNAL_ENTRIES_COLLECTION, input.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Journal entry not found', 'id', 'NOT_FOUND');
    }

    const existingEntry = firestoreToJournalEntry(docSnap as QueryDocumentSnapshot<DocumentData>);

    // Authorization check
    if (existingEntry.userId !== userId) {
      throw new ValidationError('Unauthorized access to journal entry', 'id', 'UNAUTHORIZED');
    }

    // Build update payload
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.content !== undefined) {
      updates.content = sanitizeString(input.content);
    }

    const updateData = journalEntryToFirestore(updates as Partial<JournalEntry>);
    await updateDoc(docRef, updateData);

    // Return merged local object instead of re-fetching
    return {
      ...existingEntry,
      ...(input.content !== undefined && { content: updates.content as string }),
      updatedAt: updates.updatedAt as Date,
    };
  } catch (error) {
    console.error('Error updating journal entry:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to update journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a journal entry permanently.
 * Also deletes all attachments from Storage and decrements the parent journal's entryCount.
 *
 * @param entryId - The ID of the entry to delete
 * @param journalId - The ID of the parent journal (for counter update)
 * @param userId - The ID of the user deleting the entry
 * @throws {ValidationError} If IDs are invalid or user is unauthorized
 */
export async function deleteJournalEntry(
  entryId: string,
  journalId: string,
  userId: string
): Promise<void> {
  validateEntryId(entryId);
  validateJournalId(journalId);
  validateUserId(userId);

  try {
    // Verify ownership
    const docRef = doc(db, JOURNAL_ENTRIES_COLLECTION, entryId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new ValidationError('Journal entry not found', 'entryId', 'NOT_FOUND');
    }

    const entryData = docSnap.data();

    // Authorization check
    if (entryData.userId !== userId) {
      throw new ValidationError('Unauthorized access to journal entry', 'entryId', 'UNAUTHORIZED');
    }

    // Delete all attachments from Storage
    await deleteAllJournalEntryAttachments(entryId, userId);

    // Delete the entry document
    await deleteDoc(docRef);

    // Decrement parent journal's entryCount atomically
    const journalRef = doc(db, JOURNALS_COLLECTION, journalId);
    await updateDoc(journalRef, {
      entryCount: increment(-1),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error(`Failed to delete journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// Entry Attachment Operations
// =============================================================================

/**
 * Upload one or more files as attachments to a journal entry.
 *
 * Validates files, verifies entry ownership, uploads to Firebase Storage,
 * and appends attachment metadata to the entry's Firestore document.
 *
 * Storage path: journals/{userId}/{entryId}/{attachmentId}_{fileName}
 *
 * @param entryId - The journal entry to attach files to
 * @param userId - The authenticated user's ID
 * @param files - Array of File objects to upload
 * @returns Array of NoteAttachment metadata for the uploaded files
 */
export async function uploadJournalEntryAttachments(
  entryId: string,
  userId: string,
  files: File[]
): Promise<NoteAttachment[]> {
  validateUserId(userId);
  validateEntryId(entryId);

  if (!files.length) {
    return [];
  }

  // Validate all files first
  for (const file of files) {
    validateFile(file);
  }

  // Verify ownership and get existing attachments
  const entryData = await verifyJournalEntryOwnership(entryId, userId);
  const existingAttachments: NoteAttachment[] = entryData.attachments || [];

  // Check attachment count limit
  if (existingAttachments.length + files.length > ATTACHMENT_LIMITS.maxAttachments) {
    throw new ValidationError(
      `Cannot add ${files.length} files. Entry already has ${existingAttachments.length} attachments (max ${ATTACHMENT_LIMITS.maxAttachments})`,
      'files',
      'TOO_MANY_ATTACHMENTS'
    );
  }

  // Check total size limit
  const existingTotalSize = existingAttachments.reduce((sum, a) => sum + a.sizeBytes, 0);
  const newTotalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (existingTotalSize + newTotalSize > ATTACHMENT_LIMITS.maxTotalSizeBytes) {
    throw new ValidationError(
      `Total attachment size would exceed ${ATTACHMENT_LIMITS.maxTotalSizeBytes / (1024 * 1024)}MB limit`,
      'files',
      'TOTAL_SIZE_EXCEEDED'
    );
  }

  // Upload files and collect metadata
  const newAttachments: NoteAttachment[] = [];

  for (const file of files) {
    const attachmentId = generateAttachmentId();
    const storagePath = `journals/${userId}/${entryId}/${attachmentId}_${file.name}`;
    const storageRef = ref(storage, storagePath);

    try {
      // Upload the file
      await uploadBytes(storageRef, file, {
        contentType: file.type,
      });

      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);

      const isImage = file.type.startsWith('image/');

      const attachment: NoteAttachment = {
        id: attachmentId,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storagePath,
        downloadUrl,
        thumbnailUrl: isImage ? downloadUrl : null,
        uploadedAt: new Date(),
      };

      newAttachments.push(attachment);
    } catch (error) {
      console.error(`Error uploading file "${file.name}":`, error);
      throw new Error(
        `Failed to upload "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Append new attachments to Firestore
  try {
    const docRef = doc(db, JOURNAL_ENTRIES_COLLECTION, entryId);
    const allAttachments = [...existingAttachments, ...newAttachments];

    // Serialize for Firestore (Date -> ISO string for uploadedAt)
    const serializedAttachments = allAttachments.map((a) => ({
      ...a,
      uploadedAt: a.uploadedAt instanceof Date ? a.uploadedAt.toISOString() : a.uploadedAt,
    }));

    await updateDoc(docRef, {
      attachments: serializedAttachments,
    });
  } catch (error) {
    console.error('Error updating entry with attachments:', error);
    throw new Error(
      `Failed to update entry with attachments: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return newAttachments;
}

/**
 * Delete a single attachment from a journal entry.
 *
 * Verifies ownership, deletes the file from Storage,
 * and removes the attachment metadata from Firestore.
 *
 * @param entryId - The journal entry containing the attachment
 * @param userId - The authenticated user's ID
 * @param attachmentId - The ID of the attachment to delete
 */
export async function deleteJournalEntryAttachment(
  entryId: string,
  userId: string,
  attachmentId: string
): Promise<void> {
  validateUserId(userId);
  validateEntryId(entryId);

  if (!attachmentId || typeof attachmentId !== 'string') {
    throw new ValidationError('attachmentId is required', 'attachmentId', 'INVALID_ATTACHMENT_ID');
  }

  // Verify ownership and get existing attachments
  const entryData = await verifyJournalEntryOwnership(entryId, userId);
  const existingAttachments: NoteAttachment[] = entryData.attachments || [];

  // Find the attachment to delete
  const attachment = existingAttachments.find((a) => a.id === attachmentId);
  if (!attachment) {
    throw new ValidationError('Attachment not found', 'attachmentId', 'NOT_FOUND');
  }

  // Delete from Storage (best-effort: don't block Firestore cleanup on failure)
  try {
    const storageRef = ref(storage, attachment.storagePath);
    await deleteObject(storageRef);
  } catch (error: unknown) {
    const firebaseError = error as { code?: string };
    if (firebaseError?.code !== 'storage/object-not-found') {
      console.warn('Storage delete failed (will still remove metadata):', error);
    }
  }

  // Remove from Firestore
  try {
    const docRef = doc(db, JOURNAL_ENTRIES_COLLECTION, entryId);
    const updatedAttachments = existingAttachments
      .filter((a) => a.id !== attachmentId)
      .map((a) => ({
        ...a,
        uploadedAt: a.uploadedAt instanceof Date ? a.uploadedAt.toISOString() : a.uploadedAt,
      }));

    await updateDoc(docRef, {
      attachments: updatedAttachments,
    });
  } catch (error) {
    console.error('Error updating entry after attachment deletion:', error);
    throw new Error(
      `Failed to update entry: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete all attachments for a journal entry from Storage.
 *
 * Used when deleting an entry to clean up its Storage files.
 * Storage path: journals/{userId}/{entryId}/
 *
 * @param entryId - The journal entry whose attachments should be deleted
 * @param userId - The authenticated user's ID
 */
export async function deleteAllJournalEntryAttachments(
  entryId: string,
  userId: string
): Promise<void> {
  validateUserId(userId);

  if (!entryId || typeof entryId !== 'string') {
    return; // Silently skip if no entryId (entry may not have attachments)
  }

  try {
    // List all files in the entry's storage folder
    const folderRef = ref(storage, `journals/${userId}/${entryId}`);
    const listResult = await listAll(folderRef);

    // Delete each file
    const deletePromises = listResult.items.map((itemRef) =>
      deleteObject(itemRef).catch((error) => {
        console.warn(`Failed to delete storage object ${itemRef.fullPath}:`, error);
      })
    );

    await Promise.all(deletePromises);
  } catch (error: unknown) {
    // If folder doesn't exist, that's fine
    const firebaseError = error as { code?: string };
    if (firebaseError?.code !== 'storage/object-not-found') {
      console.warn('Error deleting entry attachments from Storage:', error);
    }
  }
}
