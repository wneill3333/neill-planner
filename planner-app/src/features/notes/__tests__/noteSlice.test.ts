/**
 * Note Slice Tests
 *
 * Tests for the note Redux slice reducers, actions, and selectors.
 */

import { describe, it, expect } from 'vitest';
import noteReducer, {
  initialState,
  setNotes,
  addNote,
  updateNote,
  removeNote,
  setError,
  clearError,
  clearNotes,
  selectAllNotes,
  selectNoteById,
  selectNotesByDate,
  selectNotesForSelectedDate,
  selectNotesLoading,
  selectNotesError,
  selectNotesSyncStatus,
  selectNoteCountForDate,
  type NotesState,
} from '../noteSlice';
import {
  fetchNotesByDate,
  // fetchUserNotes, // Not used in current tests
  createNoteAsync,
  updateNoteAsync,
  deleteNoteAsync,
  restoreNoteAsync,
} from '../noteThunks';
import type { Note } from '../../../types';
import type { RootState } from '../../../store';

// =============================================================================
// Test Helpers
// =============================================================================

const mockNote: Note = {
  id: 'note-1',
  userId: 'user-1',
  title: 'Test Note',
  content: 'Test content',
  date: new Date('2024-01-15'),
  categoryId: null,
  linkedTaskIds: [],
  linkedEventIds: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
};

const mockNote2: Note = {
  ...mockNote,
  id: 'note-2',
  title: 'Test Note 2',
  content: 'Test content 2',
  date: new Date('2024-01-16'),
};

function createMockRootState(notesState: Partial<NotesState> = {}): RootState {
  return {
    notes: {
      ...initialState,
      ...notesState,
    },
    tasks: {
      tasks: {},
      taskIdsByDate: {},
      recurringParentTasks: {},
      recurringTasksLoaded: false,
      selectedDate: '2024-01-15',
      loading: false,
      error: null,
      syncStatus: 'synced',
      reorderRollbackState: null,
    },
    categories: {
      categories: {},
      initialized: false,
      loading: false,
      error: null,
      syncStatus: 'synced',
    },
    events: {
      events: {},
      eventIdsByDate: {},
      recurringParentEvents: {},
      recurringEventsLoaded: false,
      loading: false,
      error: null,
      syncStatus: 'synced',
    },
  } as RootState;
}

// =============================================================================
// Reducer Tests
// =============================================================================

describe('noteSlice reducer', () => {
  it('should return the initial state', () => {
    expect(noteReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setNotes', () => {
    it('should set notes for a specific date', () => {
      const state = noteReducer(
        initialState,
        setNotes({ notes: [mockNote, mockNote2], date: '2024-01-15' })
      );

      expect(state.notes['note-1']).toEqual(mockNote);
      expect(state.notes['note-2']).toEqual(mockNote2);
      expect(state.noteIdsByDate['2024-01-15']).toContain('note-1');
    });

    it('should replace existing notes for the same date', () => {
      const initialStateWithNote: NotesState = {
        ...initialState,
        notes: { 'old-note': { ...mockNote, id: 'old-note' } },
        noteIdsByDate: { '2024-01-15': ['old-note'] },
      };

      const state = noteReducer(
        initialStateWithNote,
        setNotes({ notes: [mockNote], date: '2024-01-15' })
      );

      expect(state.notes['old-note']).toBeUndefined();
      expect(state.notes['note-1']).toEqual(mockNote);
    });
  });

  describe('addNote', () => {
    it('should add a single note', () => {
      const state = noteReducer(initialState, addNote(mockNote));

      expect(state.notes['note-1']).toEqual(mockNote);
      expect(state.noteIdsByDate['2024-01-15']).toContain('note-1');
    });
  });

  describe('updateNote', () => {
    it('should update an existing note', () => {
      const initialStateWithNote: NotesState = {
        ...initialState,
        notes: { 'note-1': mockNote },
        noteIdsByDate: { '2024-01-15': ['note-1'] },
      };

      const state = noteReducer(
        initialStateWithNote,
        updateNote({ id: 'note-1', title: 'Updated Title', content: 'Updated content' })
      );

      expect(state.notes['note-1'].title).toBe('Updated Title');
      expect(state.notes['note-1'].content).toBe('Updated content');
    });

    it('should handle date changes', () => {
      const initialStateWithNote: NotesState = {
        ...initialState,
        notes: { 'note-1': mockNote },
        noteIdsByDate: { '2024-01-15': ['note-1'] },
      };

      const newDate = new Date('2024-01-20');
      const state = noteReducer(
        initialStateWithNote,
        updateNote({ id: 'note-1', date: newDate })
      );

      expect(state.noteIdsByDate['2024-01-15']).toBeUndefined();
      expect(state.noteIdsByDate['2024-01-20']).toContain('note-1');
    });
  });

  describe('removeNote', () => {
    it('should remove a note', () => {
      const initialStateWithNote: NotesState = {
        ...initialState,
        notes: { 'note-1': mockNote },
        noteIdsByDate: { '2024-01-15': ['note-1'] },
      };

      const state = noteReducer(initialStateWithNote, removeNote('note-1'));

      expect(state.notes['note-1']).toBeUndefined();
      expect(state.noteIdsByDate['2024-01-15']).toBeUndefined();
    });
  });

  describe('setError', () => {
    it('should set an error message', () => {
      const state = noteReducer(initialState, setError('Test error'));
      expect(state.error).toBe('Test error');
    });
  });

  describe('clearError', () => {
    it('should clear the error message', () => {
      const stateWithError: NotesState = { ...initialState, error: 'Test error' };
      const state = noteReducer(stateWithError, clearError());
      expect(state.error).toBeNull();
    });
  });

  describe('clearNotes', () => {
    it('should clear all notes', () => {
      const stateWithNotes: NotesState = {
        ...initialState,
        notes: { 'note-1': mockNote },
        noteIdsByDate: { '2024-01-15': ['note-1'] },
      };

      const state = noteReducer(stateWithNotes, clearNotes());
      expect(state.notes).toEqual({});
      expect(state.noteIdsByDate).toEqual({});
    });
  });
});

// =============================================================================
// Async Thunk Tests
// =============================================================================

describe('noteSlice async thunks', () => {
  describe('fetchNotesByDate', () => {
    it('should handle pending state', () => {
      const action = { type: fetchNotesByDate.pending.type };
      const state = noteReducer(initialState, action);

      expect(state.loading).toBe(true);
      expect(state.syncStatus).toBe('syncing');
    });

    it('should handle fulfilled state', () => {
      const action = {
        type: fetchNotesByDate.fulfilled.type,
        payload: { notes: [mockNote], date: '2024-01-15' },
      };
      const state = noteReducer(initialState, action);

      expect(state.loading).toBe(false);
      expect(state.syncStatus).toBe('synced');
      expect(state.notes['note-1']).toEqual(mockNote);
    });

    it('should handle rejected state', () => {
      const action = {
        type: fetchNotesByDate.rejected.type,
        payload: { message: 'Failed to fetch notes' },
      };
      const state = noteReducer(initialState, action);

      expect(state.loading).toBe(false);
      expect(state.syncStatus).toBe('error');
      expect(state.error).toBe('Failed to fetch notes');
    });
  });

  describe('createNoteAsync', () => {
    it('should add note on fulfilled', () => {
      const action = {
        type: createNoteAsync.fulfilled.type,
        payload: mockNote,
      };
      const state = noteReducer(initialState, action);

      expect(state.notes['note-1']).toEqual(mockNote);
      expect(state.syncStatus).toBe('synced');
    });
  });

  describe('updateNoteAsync', () => {
    it('should update note on fulfilled', () => {
      const initialStateWithNote: NotesState = {
        ...initialState,
        notes: { 'note-1': mockNote },
        noteIdsByDate: { '2024-01-15': ['note-1'] },
      };

      const updatedNote = { ...mockNote, title: 'Updated Title' };
      const action = {
        type: updateNoteAsync.fulfilled.type,
        payload: updatedNote,
      };
      const state = noteReducer(initialStateWithNote, action);

      expect(state.notes['note-1'].title).toBe('Updated Title');
    });
  });

  describe('deleteNoteAsync', () => {
    it('should remove note on fulfilled', () => {
      const initialStateWithNote: NotesState = {
        ...initialState,
        notes: { 'note-1': mockNote },
        noteIdsByDate: { '2024-01-15': ['note-1'] },
      };

      const action = {
        type: deleteNoteAsync.fulfilled.type,
        payload: 'note-1',
      };
      const state = noteReducer(initialStateWithNote, action);

      expect(state.notes['note-1']).toBeUndefined();
    });
  });

  describe('restoreNoteAsync', () => {
    it('should restore note on fulfilled', () => {
      const action = {
        type: restoreNoteAsync.fulfilled.type,
        payload: mockNote,
      };
      const state = noteReducer(initialState, action);

      expect(state.notes['note-1']).toEqual(mockNote);
    });
  });
});

// =============================================================================
// Selector Tests
// =============================================================================

describe('noteSlice selectors', () => {
  const stateWithNotes = createMockRootState({
    notes: {
      'note-1': mockNote,
      'note-2': mockNote2,
    },
    noteIdsByDate: {
      '2024-01-15': ['note-1'],
      '2024-01-16': ['note-2'],
    },
    loading: false,
    error: null,
    syncStatus: 'synced',
  });

  describe('selectAllNotes', () => {
    it('should return all notes', () => {
      const notes = selectAllNotes(stateWithNotes);
      expect(notes).toHaveLength(2);
      expect(notes).toContainEqual(mockNote);
      expect(notes).toContainEqual(mockNote2);
    });
  });

  describe('selectNoteById', () => {
    it('should return note by id', () => {
      const note = selectNoteById(stateWithNotes, 'note-1');
      expect(note).toEqual(mockNote);
    });

    it('should return undefined for non-existent note', () => {
      const note = selectNoteById(stateWithNotes, 'nonexistent');
      expect(note).toBeUndefined();
    });
  });

  describe('selectNotesByDate', () => {
    it('should return notes for a specific date', () => {
      const notes = selectNotesByDate(stateWithNotes, '2024-01-15');
      expect(notes).toHaveLength(1);
      expect(notes[0]).toEqual(mockNote);
    });

    it('should return empty array for date with no notes', () => {
      const notes = selectNotesByDate(stateWithNotes, '2024-01-20');
      expect(notes).toEqual([]);
    });
  });

  describe('selectNotesForSelectedDate', () => {
    it('should return notes for the selected date from tasks slice', () => {
      const notes = selectNotesForSelectedDate(stateWithNotes);
      expect(notes).toHaveLength(1);
      expect(notes[0]).toEqual(mockNote);
    });
  });

  describe('selectNotesLoading', () => {
    it('should return loading state', () => {
      const loading = selectNotesLoading(stateWithNotes);
      expect(loading).toBe(false);
    });
  });

  describe('selectNotesError', () => {
    it('should return error state', () => {
      const error = selectNotesError(stateWithNotes);
      expect(error).toBeNull();
    });
  });

  describe('selectNotesSyncStatus', () => {
    it('should return sync status', () => {
      const syncStatus = selectNotesSyncStatus(stateWithNotes);
      expect(syncStatus).toBe('synced');
    });
  });

  describe('selectNoteCountForDate', () => {
    it('should return note count for a date', () => {
      const count = selectNoteCountForDate(stateWithNotes, '2024-01-15');
      expect(count).toBe(1);
    });

    it('should return 0 for date with no notes', () => {
      const count = selectNoteCountForDate(stateWithNotes, '2024-01-20');
      expect(count).toBe(0);
    });
  });
});
