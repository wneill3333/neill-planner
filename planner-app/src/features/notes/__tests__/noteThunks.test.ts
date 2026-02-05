/**
 * Note Thunks Tests
 *
 * Tests for async thunk operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import noteReducer from '../noteSlice';
import {
  fetchNotesByDate,
  // fetchUserNotes, // Not used in current tests
  createNoteAsync,
  updateNoteAsync,
  deleteNoteAsync,
  restoreNoteAsync,
  hardDeleteNoteAsync,
} from '../noteThunks';
import type { CreateNoteInput, UpdateNoteInput, Note } from '../../../types';

// Mock the notes service
vi.mock('../../../services/firebase/notes.service', () => ({
  getNotesByDate: vi.fn(),
  getUserNotes: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  softDeleteNote: vi.fn(),
  hardDeleteNote: vi.fn(),
  restoreNote: vi.fn(),
}));

describe('Note Thunks', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: { notes: noteReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
    });
    vi.clearAllMocks();
  });

  describe('fetchNotesByDate', () => {
    it('should fetch notes successfully', async () => {
      const mockNotes: Note[] = [
        {
          id: 'note-1',
          userId: 'user-1',
          title: 'Test Note',
          content: 'Content',
          date: new Date('2024-01-15'),
          categoryId: null,
          linkedTaskIds: [],
          linkedEventIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      const { getNotesByDate } = await import('../../../services/firebase/notes.service');
      vi.mocked(getNotesByDate).mockResolvedValue(mockNotes);

      const result = await store.dispatch(
        fetchNotesByDate({ userId: 'user-1', date: new Date('2024-01-15') })
      );

      expect(result.type).toBe(fetchNotesByDate.fulfilled.type);
      expect(result.payload.notes).toEqual(mockNotes);
    });

    it('should handle errors', async () => {
      const { getNotesByDate } = await import('../../../services/firebase/notes.service');
      vi.mocked(getNotesByDate).mockRejectedValue(new Error('Fetch failed'));

      const result = await store.dispatch(
        fetchNotesByDate({ userId: 'user-1', date: new Date('2024-01-15') })
      );

      expect(result.type).toBe(fetchNotesByDate.rejected.type);
    });
  });

  describe('createNoteAsync', () => {
    it('should create note successfully', async () => {
      const mockNote: Note = {
        id: 'new-note',
        userId: 'user-1',
        title: 'New Note',
        content: 'Content',
        date: new Date('2024-01-15'),
        categoryId: null,
        linkedTaskIds: [],
        linkedEventIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const { createNote } = await import('../../../services/firebase/notes.service');
      vi.mocked(createNote).mockResolvedValue(mockNote);

      const input: CreateNoteInput = {
        title: 'New Note',
        content: 'Content',
        date: new Date('2024-01-15'),
      };

      const result = await store.dispatch(createNoteAsync({ input, userId: 'user-1' }));

      expect(result.type).toBe(createNoteAsync.fulfilled.type);
      expect(result.payload).toEqual(mockNote);
    });
  });

  describe('updateNoteAsync', () => {
    it('should update note successfully', async () => {
      const mockNote: Note = {
        id: 'note-1',
        userId: 'user-1',
        title: 'Updated Note',
        content: 'Updated Content',
        date: new Date('2024-01-15'),
        categoryId: null,
        linkedTaskIds: [],
        linkedEventIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const { updateNote } = await import('../../../services/firebase/notes.service');
      vi.mocked(updateNote).mockResolvedValue(mockNote);

      const input: UpdateNoteInput & { userId: string } = {
        id: 'note-1',
        title: 'Updated Note',
        content: 'Updated Content',
        userId: 'user-1',
      };

      const result = await store.dispatch(updateNoteAsync(input));

      expect(result.type).toBe(updateNoteAsync.fulfilled.type);
      expect(result.payload).toEqual(mockNote);
    });
  });

  describe('deleteNoteAsync', () => {
    it('should delete note successfully', async () => {
      const { softDeleteNote } = await import('../../../services/firebase/notes.service');
      vi.mocked(softDeleteNote).mockResolvedValue(undefined);

      const result = await store.dispatch(deleteNoteAsync({ noteId: 'note-1', userId: 'user-1' }));

      expect(result.type).toBe(deleteNoteAsync.fulfilled.type);
      expect(result.payload).toBe('note-1');
    });
  });

  describe('restoreNoteAsync', () => {
    it('should restore note successfully', async () => {
      const mockNote: Note = {
        id: 'note-1',
        userId: 'user-1',
        title: 'Restored Note',
        content: 'Content',
        date: new Date('2024-01-15'),
        categoryId: null,
        linkedTaskIds: [],
        linkedEventIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const { restoreNote } = await import('../../../services/firebase/notes.service');
      vi.mocked(restoreNote).mockResolvedValue(mockNote);

      const result = await store.dispatch(restoreNoteAsync({ noteId: 'note-1', userId: 'user-1' }));

      expect(result.type).toBe(restoreNoteAsync.fulfilled.type);
      expect(result.payload).toEqual(mockNote);
    });
  });

  describe('hardDeleteNoteAsync', () => {
    it('should permanently delete note successfully', async () => {
      const { hardDeleteNote } = await import('../../../services/firebase/notes.service');
      vi.mocked(hardDeleteNote).mockResolvedValue(undefined);

      const result = await store.dispatch(hardDeleteNoteAsync({ noteId: 'note-1', userId: 'user-1' }));

      expect(result.type).toBe(hardDeleteNoteAsync.fulfilled.type);
      expect(result.payload).toBe('note-1');
    });
  });
});
