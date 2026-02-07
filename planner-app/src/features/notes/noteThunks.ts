/**
 * Note Async Thunks
 *
 * Redux Toolkit async thunks for note CRUD operations.
 * These thunks interact with the Firebase notes service and handle
 * loading states, errors, and optimistic updates.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Note, NoteAttachment, CreateNoteInput, UpdateNoteInput } from '../../types/note.types';
import * as notesService from '../../services/firebase/notes.service';
import * as attachmentsService from '../../services/firebase/attachments.service';
import type { RootState } from '../../store';

// =============================================================================
// Types
// =============================================================================

/**
 * Payload for fetching notes by date
 */
export interface FetchNotesByDatePayload {
  userId: string;
  date: Date;
}

/**
 * Payload for creating a note
 */
export interface CreateNotePayload {
  input: CreateNoteInput;
  userId: string;
}

/**
 * Error response from thunks
 */
export interface ThunkError {
  message: string;
  code?: string;
}

/**
 * Payload for fetching notes by date range
 */
export interface FetchNotesByDateRangePayload {
  userId: string;
  startDate: Date;
  endDate: Date;
}

// =============================================================================
// Async Thunks
// =============================================================================

/**
 * Fetch all notes for a user
 *
 * Retrieves all non-deleted notes for the given user from Firestore.
 */
export const fetchUserNotes = createAsyncThunk<
  Note[],
  { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('notes/fetchUserNotes', async ({ userId }, { rejectWithValue }) => {
  try {
    const notes = await notesService.getUserNotes(userId);
    return notes;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notes';
    return rejectWithValue({ message });
  }
});

/**
 * Fetch notes for a specific date
 *
 * Retrieves all non-deleted notes for the given user and date from Firestore.
 */
export const fetchNotesByDate = createAsyncThunk<
  { notes: Note[]; date: string },
  FetchNotesByDatePayload,
  { state: RootState; rejectValue: ThunkError }
>('notes/fetchNotesByDate', async ({ userId, date }, { rejectWithValue }) => {
  try {
    const notes = await notesService.getNotesByDate(userId, date);
    const dateString = date.toISOString().split('T')[0];
    return { notes, date: dateString };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notes';
    return rejectWithValue({ message });
  }
});

/**
 * Fetch notes for a date range
 *
 * Retrieves all non-deleted notes within a date range from Firestore.
 * Used by week and month views.
 */
export const fetchNotesByDateRange = createAsyncThunk<
  Note[],
  FetchNotesByDateRangePayload,
  { state: RootState; rejectValue: ThunkError }
>('notes/fetchNotesByDateRange', async ({ userId, startDate, endDate }, { rejectWithValue }) => {
  try {
    const notes = await notesService.getNotesByDateRange(userId, startDate, endDate);
    return notes;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notes';
    return rejectWithValue({ message });
  }
});

/**
 * Create a new note
 *
 * Creates a note in Firestore and adds it to the local state.
 * The note is immediately available in the UI after creation.
 */
export const createNoteAsync = createAsyncThunk<
  Note,
  CreateNotePayload,
  { state: RootState; rejectValue: ThunkError }
>('notes/createNote', async ({ input, userId }, { rejectWithValue }) => {
  try {
    const note = await notesService.createNote(input, userId);
    return note;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create note';
    return rejectWithValue({ message });
  }
});

/**
 * Update an existing note
 *
 * Updates a note in Firestore and reflects the changes in local state.
 */
export const updateNoteAsync = createAsyncThunk<
  Note,
  UpdateNoteInput & { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('notes/updateNoteAsync', async (input, { rejectWithValue }) => {
  try {
    const { userId, ...updateInput } = input;
    const note = await notesService.updateNote(updateInput, userId);
    return note;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update note';
    return rejectWithValue({ message });
  }
});

/**
 * Delete a note (soft delete)
 *
 * Performs a soft delete by setting the deletedAt timestamp.
 * The note is removed from the local state but remains in Firestore
 * for potential recovery.
 */
export const deleteNoteAsync = createAsyncThunk<
  string,
  { noteId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('notes/deleteNote', async ({ noteId, userId }, { rejectWithValue }) => {
  try {
    await notesService.softDeleteNote(noteId, userId);
    return noteId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete note';
    return rejectWithValue({ message });
  }
});

/**
 * Restore a soft-deleted note
 *
 * Restores a previously soft-deleted note by clearing the deletedAt timestamp.
 */
export const restoreNoteAsync = createAsyncThunk<
  Note,
  { noteId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('notes/restoreNote', async ({ noteId, userId }, { rejectWithValue }) => {
  try {
    const note = await notesService.restoreNote(noteId, userId);
    return note;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to restore note';
    return rejectWithValue({ message });
  }
});

/**
 * Permanently delete a note (hard delete)
 *
 * Permanently removes the note from Firestore.
 * Use with caution - this action cannot be undone.
 */
export const hardDeleteNoteAsync = createAsyncThunk<
  string,
  { noteId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('notes/hardDeleteNote', async ({ noteId, userId }, { rejectWithValue }) => {
  try {
    await notesService.hardDeleteNote(noteId, userId);
    return noteId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to permanently delete note';
    return rejectWithValue({ message });
  }
});

/**
 * Upload attachments to a note
 *
 * Uploads files to Firebase Storage and updates the note's attachment metadata.
 */
export const uploadAttachmentsAsync = createAsyncThunk<
  { noteId: string; attachments: NoteAttachment[] },
  { noteId: string; userId: string; files: File[] },
  { state: RootState; rejectValue: ThunkError }
>('notes/uploadAttachments', async ({ noteId, userId, files }, { rejectWithValue }) => {
  try {
    const attachments = await attachmentsService.uploadAttachments(noteId, userId, files);
    return { noteId, attachments };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload attachments';
    return rejectWithValue({ message });
  }
});

/**
 * Delete an attachment from a note
 *
 * Removes the file from Firebase Storage and updates the note's attachment metadata.
 */
export const deleteAttachmentAsync = createAsyncThunk<
  { noteId: string; attachmentId: string },
  { noteId: string; userId: string; attachmentId: string },
  { state: RootState; rejectValue: ThunkError }
>('notes/deleteAttachment', async ({ noteId, userId, attachmentId }, { rejectWithValue }) => {
  try {
    await attachmentsService.deleteAttachment(noteId, userId, attachmentId);
    return { noteId, attachmentId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete attachment';
    return rejectWithValue({ message });
  }
});
