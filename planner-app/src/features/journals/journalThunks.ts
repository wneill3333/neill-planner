/**
 * Journal Async Thunks
 *
 * Redux Toolkit async thunks for journal and journal entry CRUD operations.
 * These thunks interact with the Firebase journals service and handle
 * loading states, errors, and optimistic updates.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  Journal,
  JournalEntry,
  CreateJournalInput,
  UpdateJournalInput,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
} from '../../types/journal.types';
import type { NoteAttachment } from '../../types/note.types';
import * as journalsService from '../../services/firebase/journals.service';
import type { RootState } from '../../store';

// =============================================================================
// Types
// =============================================================================

/**
 * Error response from thunks
 */
export interface ThunkError {
  message: string;
  code?: string;
}

/**
 * Payload for creating a journal
 */
export interface CreateJournalPayload {
  input: CreateJournalInput;
  userId: string;
}

/**
 * Payload for creating a journal entry
 */
export interface CreateJournalEntryPayload {
  input: CreateJournalEntryInput;
  userId: string;
}

// =============================================================================
// Journal Async Thunks
// =============================================================================

/**
 * Fetch all journals for a user
 *
 * Retrieves all non-deleted journals for the given user from Firestore.
 */
export const fetchUserJournals = createAsyncThunk<
  Journal[],
  { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('journals/fetchUserJournals', async ({ userId }, { rejectWithValue }) => {
  try {
    const journals = await journalsService.getUserJournals(userId);
    return journals;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch journals';
    return rejectWithValue({ message });
  }
});

/**
 * Create a new journal
 *
 * Creates a journal in Firestore and adds it to the local state.
 * The journal is immediately available in the UI after creation.
 */
export const createJournalAsync = createAsyncThunk<
  Journal,
  CreateJournalPayload,
  { state: RootState; rejectValue: ThunkError }
>('journals/createJournal', async ({ input, userId }, { rejectWithValue }) => {
  try {
    const journal = await journalsService.createJournal(input, userId);
    return journal;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create journal';
    return rejectWithValue({ message });
  }
});

/**
 * Update an existing journal
 *
 * Updates a journal in Firestore and reflects the changes in local state.
 */
export const updateJournalAsync = createAsyncThunk<
  Journal,
  UpdateJournalInput & { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('journals/updateJournal', async (input, { rejectWithValue }) => {
  try {
    const { userId, ...updateInput } = input;
    const journal = await journalsService.updateJournal(updateInput, userId);
    return journal;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update journal';
    return rejectWithValue({ message });
  }
});

/**
 * Delete a journal (soft delete)
 *
 * Performs a soft delete by setting the deletedAt timestamp.
 * The journal is removed from the local state but remains in Firestore
 * for potential recovery.
 */
export const deleteJournalAsync = createAsyncThunk<
  string,
  { journalId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('journals/deleteJournal', async ({ journalId, userId }, { rejectWithValue }) => {
  try {
    await journalsService.softDeleteJournal(journalId, userId);
    return journalId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete journal';
    return rejectWithValue({ message });
  }
});

/**
 * Permanently delete a journal (hard delete)
 *
 * Permanently removes the journal from Firestore.
 * Use with caution - this action cannot be undone.
 */
export const hardDeleteJournalAsync = createAsyncThunk<
  string,
  { journalId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('journals/hardDeleteJournal', async ({ journalId, userId }, { rejectWithValue }) => {
  try {
    await journalsService.hardDeleteJournal(journalId, userId);
    return journalId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to permanently delete journal';
    return rejectWithValue({ message });
  }
});

// =============================================================================
// Journal Entry Async Thunks
// =============================================================================

/**
 * Fetch all entries for a specific journal
 *
 * Retrieves all non-deleted entries for the given journal from Firestore.
 */
export const fetchJournalEntries = createAsyncThunk<
  { journalId: string; entries: JournalEntry[] },
  { journalId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('journals/fetchJournalEntries', async ({ journalId, userId }, { rejectWithValue }) => {
  try {
    const entries = await journalsService.getEntriesByJournal(journalId, userId);
    return { journalId, entries };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch journal entries';
    return rejectWithValue({ message });
  }
});

/**
 * Create a new journal entry
 *
 * Creates an entry in Firestore and adds it to the local state.
 * The entry is immediately available in the UI after creation.
 */
export const createJournalEntryAsync = createAsyncThunk<
  JournalEntry,
  CreateJournalEntryPayload,
  { state: RootState; rejectValue: ThunkError }
>('journals/createJournalEntry', async ({ input, userId }, { rejectWithValue }) => {
  try {
    const entry = await journalsService.createJournalEntry(input, userId);
    return entry;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create journal entry';
    return rejectWithValue({ message });
  }
});

/**
 * Update an existing journal entry
 *
 * Updates an entry in Firestore and reflects the changes in local state.
 */
export const updateJournalEntryAsync = createAsyncThunk<
  JournalEntry,
  UpdateJournalEntryInput & { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('journals/updateJournalEntry', async (input, { rejectWithValue }) => {
  try {
    const { userId, ...updateInput } = input;
    const entry = await journalsService.updateJournalEntry(updateInput, userId);
    return entry;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update journal entry';
    return rejectWithValue({ message });
  }
});

/**
 * Delete a journal entry
 *
 * Permanently removes the entry from Firestore.
 */
export const deleteJournalEntryAsync = createAsyncThunk<
  { entryId: string; journalId: string },
  { entryId: string; journalId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('journals/deleteJournalEntry', async ({ entryId, journalId, userId }, { rejectWithValue }) => {
  try {
    await journalsService.deleteJournalEntry(entryId, journalId, userId);
    return { entryId, journalId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete journal entry';
    return rejectWithValue({ message });
  }
});

// =============================================================================
// Journal Entry Attachment Thunks
// =============================================================================

/**
 * Upload attachments to a journal entry
 *
 * Uploads files to Firebase Storage and updates the entry's attachment metadata.
 */
export const uploadJournalEntryAttachmentsAsync = createAsyncThunk<
  { entryId: string; attachments: NoteAttachment[] },
  { entryId: string; userId: string; files: File[] },
  { state: RootState; rejectValue: ThunkError }
>('journals/uploadJournalEntryAttachments', async ({ entryId, userId, files }, { rejectWithValue }) => {
  try {
    const attachments = await journalsService.uploadJournalEntryAttachments(entryId, userId, files);
    return { entryId, attachments };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload attachments';
    return rejectWithValue({ message });
  }
});

/**
 * Delete an attachment from a journal entry
 *
 * Removes the file from Firebase Storage and updates the entry's attachment metadata.
 */
export const deleteJournalEntryAttachmentAsync = createAsyncThunk<
  { entryId: string; attachmentId: string },
  { entryId: string; userId: string; attachmentId: string },
  { state: RootState; rejectValue: ThunkError }
>('journals/deleteJournalEntryAttachment', async ({ entryId, userId, attachmentId }, { rejectWithValue }) => {
  try {
    await journalsService.deleteJournalEntryAttachment(entryId, userId, attachmentId);
    return { entryId, attachmentId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete attachment';
    return rejectWithValue({ message });
  }
});
