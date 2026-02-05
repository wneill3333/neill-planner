/**
 * Note Slice
 *
 * Redux Toolkit slice for note state management.
 * Handles normalized note storage, date-based indexing, and CRUD operations.
 */

import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { Note, SyncStatus } from '../../types';
import type { RootState } from '../../store';
import {
  fetchNotesByDate,
  fetchUserNotes,
  createNoteAsync,
  updateNoteAsync,
  deleteNoteAsync,
  restoreNoteAsync,
  hardDeleteNoteAsync,
} from './noteThunks';

// =============================================================================
// Types
// =============================================================================

/**
 * State shape for the notes slice
 */
export interface NotesState {
  /** Normalized notes storage - notes indexed by ID */
  notes: Record<string, Note>;
  /** Note IDs indexed by date (ISO date string) for quick lookup */
  noteIdsByDate: Record<string, string[]>;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Sync status with backend */
  syncStatus: SyncStatus;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get ISO date string from a Date object or return null
 */
function getDateString(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

/**
 * Add a note ID to the date index
 */
function addNoteToDateIndex(
  noteIdsByDate: Record<string, string[]>,
  date: string | null,
  noteId: string
): void {
  if (!date) return;
  if (!noteIdsByDate[date]) {
    noteIdsByDate[date] = [];
  }
  if (!noteIdsByDate[date].includes(noteId)) {
    noteIdsByDate[date].push(noteId);
  }
}

/**
 * Remove a note ID from the date index
 */
function removeNoteFromDateIndex(
  noteIdsByDate: Record<string, string[]>,
  date: string | null,
  noteId: string
): void {
  if (!date || !noteIdsByDate[date]) return;
  const index = noteIdsByDate[date].indexOf(noteId);
  if (index > -1) {
    noteIdsByDate[date].splice(index, 1);
  }
  // Clean up empty arrays
  if (noteIdsByDate[date].length === 0) {
    delete noteIdsByDate[date];
  }
}

// =============================================================================
// Initial State
// =============================================================================

export const initialState: NotesState = {
  notes: {},
  noteIdsByDate: {},
  loading: false,
  error: null,
  syncStatus: 'synced',
};

// =============================================================================
// Slice
// =============================================================================

export const noteSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    /**
     * Set notes for a specific date (replaces existing notes for that date)
     */
    setNotes: (state, action: PayloadAction<{ notes: Note[]; date: string }>) => {
      const { notes, date } = action.payload;

      // Clear existing note IDs for this date
      if (state.noteIdsByDate[date]) {
        for (const noteId of state.noteIdsByDate[date]) {
          const note = state.notes[noteId];
          if (note) {
            const noteDate = getDateString(note.date);
            if (noteDate === date) {
              delete state.notes[noteId];
            }
          }
        }
        state.noteIdsByDate[date] = [];
      }

      // Add new notes
      for (const note of notes) {
        state.notes[note.id] = note;
        const noteDate = getDateString(note.date);
        addNoteToDateIndex(state.noteIdsByDate, noteDate, note.id);
      }
    },

    /**
     * Add a single note
     */
    addNote: (state, action: PayloadAction<Note>) => {
      const note = action.payload;
      state.notes[note.id] = note;
      const dateString = getDateString(note.date);
      addNoteToDateIndex(state.noteIdsByDate, dateString, note.id);
    },

    /**
     * Update an existing note
     */
    updateNote: (state, action: PayloadAction<Partial<Note> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      const existingNote = state.notes[id];

      if (!existingNote) return;

      // Handle date change
      if ('date' in updates) {
        const oldDate = getDateString(existingNote.date);
        const newDate = getDateString(updates.date);

        if (oldDate !== newDate) {
          removeNoteFromDateIndex(state.noteIdsByDate, oldDate, id);
          addNoteToDateIndex(state.noteIdsByDate, newDate, id);
        }
      }

      // Apply updates
      state.notes[id] = { ...existingNote, ...updates };
    },

    /**
     * Remove a note
     */
    removeNote: (state, action: PayloadAction<string>) => {
      const noteId = action.payload;
      const note = state.notes[noteId];

      if (!note) return;

      // Remove from date index
      const dateString = getDateString(note.date);
      removeNoteFromDateIndex(state.noteIdsByDate, dateString, noteId);

      // Remove note
      delete state.notes[noteId];
    },

    /**
     * Set error message
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /**
     * Clear error message
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Clear all notes (useful for logout)
     */
    clearNotes: (state) => {
      state.notes = {};
      state.noteIdsByDate = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ==========================================================================
    // fetchNotesByDate
    // ==========================================================================
    builder
      .addCase(fetchNotesByDate.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.syncStatus = 'syncing';
      })
      .addCase(fetchNotesByDate.fulfilled, (state, action) => {
        const { notes, date } = action.payload;
        state.loading = false;
        state.syncStatus = 'synced';

        // Clear existing note IDs for this date
        if (state.noteIdsByDate[date]) {
          for (const noteId of state.noteIdsByDate[date]) {
            const note = state.notes[noteId];
            if (note) {
              const noteDate = getDateString(note.date);
              if (noteDate === date) {
                delete state.notes[noteId];
              }
            }
          }
        }
        state.noteIdsByDate[date] = [];

        // Add new notes
        for (const note of notes) {
          state.notes[note.id] = note;
          const noteDate = getDateString(note.date);
          addNoteToDateIndex(state.noteIdsByDate, noteDate, note.id);
        }
      })
      .addCase(fetchNotesByDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch notes';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // fetchUserNotes
    // ==========================================================================
    builder
      .addCase(fetchUserNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.syncStatus = 'syncing';
      })
      .addCase(fetchUserNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.syncStatus = 'synced';

        // Add all notes to state
        for (const note of action.payload) {
          state.notes[note.id] = note;
          const dateString = getDateString(note.date);
          addNoteToDateIndex(state.noteIdsByDate, dateString, note.id);
        }
      })
      .addCase(fetchUserNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch notes';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // createNoteAsync
    // ==========================================================================
    builder
      .addCase(createNoteAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(createNoteAsync.fulfilled, (state, action) => {
        const note = action.payload;
        state.notes[note.id] = note;
        const dateString = getDateString(note.date);
        addNoteToDateIndex(state.noteIdsByDate, dateString, note.id);
        state.syncStatus = 'synced';
      })
      .addCase(createNoteAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to create note';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // updateNoteAsync
    // ==========================================================================
    builder
      .addCase(updateNoteAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(updateNoteAsync.fulfilled, (state, action) => {
        const updatedNote = action.payload;
        const existingNote = state.notes[updatedNote.id];

        if (existingNote) {
          // Handle date change
          const oldDate = getDateString(existingNote.date);
          const newDate = getDateString(updatedNote.date);

          if (oldDate !== newDate) {
            removeNoteFromDateIndex(state.noteIdsByDate, oldDate, updatedNote.id);
            addNoteToDateIndex(state.noteIdsByDate, newDate, updatedNote.id);
          }
        }

        state.notes[updatedNote.id] = updatedNote;
        state.syncStatus = 'synced';
      })
      .addCase(updateNoteAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to update note';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // deleteNoteAsync
    // ==========================================================================
    builder
      .addCase(deleteNoteAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(deleteNoteAsync.fulfilled, (state, action) => {
        const noteId = action.payload;
        const note = state.notes[noteId];

        if (note) {
          const dateString = getDateString(note.date);
          removeNoteFromDateIndex(state.noteIdsByDate, dateString, noteId);
          delete state.notes[noteId];
        }

        state.syncStatus = 'synced';
      })
      .addCase(deleteNoteAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to delete note';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // restoreNoteAsync
    // ==========================================================================
    builder
      .addCase(restoreNoteAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(restoreNoteAsync.fulfilled, (state, action) => {
        const note = action.payload;
        state.notes[note.id] = note;
        const dateString = getDateString(note.date);
        addNoteToDateIndex(state.noteIdsByDate, dateString, note.id);
        state.syncStatus = 'synced';
      })
      .addCase(restoreNoteAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to restore note';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // hardDeleteNoteAsync
    // ==========================================================================
    builder
      .addCase(hardDeleteNoteAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(hardDeleteNoteAsync.fulfilled, (state, action) => {
        const noteId = action.payload;
        const note = state.notes[noteId];

        if (note) {
          const dateString = getDateString(note.date);
          removeNoteFromDateIndex(state.noteIdsByDate, dateString, noteId);
          delete state.notes[noteId];
        }

        state.syncStatus = 'synced';
      })
      .addCase(hardDeleteNoteAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to permanently delete note';
        state.syncStatus = 'error';
      });
  },
});

// =============================================================================
// Actions
// =============================================================================

export const {
  setNotes,
  addNote,
  updateNote,
  removeNote,
  setError,
  clearError,
  clearNotes,
} = noteSlice.actions;

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select all notes as an array
 */
export const selectAllNotes = (state: RootState): Note[] => Object.values(state.notes.notes);

/**
 * Select a note by ID
 */
export const selectNoteById = (state: RootState, noteId: string): Note | undefined =>
  state.notes.notes[noteId];

/**
 * Select notes for a specific date
 */
export const selectNotesByDate = createSelector(
  [
    (state: RootState) => state.notes.notes,
    (state: RootState) => state.notes.noteIdsByDate,
    (_state: RootState, date: string) => date,
  ],
  (notes, noteIdsByDate, date): Note[] => {
    const noteIds = noteIdsByDate[date] || [];
    return noteIds.map((id) => notes[id]).filter((note): note is Note => !!note);
  }
);

/**
 * Select notes for the currently selected date (from task slice)
 */
export const selectNotesForSelectedDate = createSelector(
  [
    (state: RootState) => state.notes.notes,
    (state: RootState) => state.notes.noteIdsByDate,
    (state: RootState) => state.tasks.selectedDate,
  ],
  (notes, noteIdsByDate, selectedDate): Note[] => {
    const noteIds = noteIdsByDate[selectedDate] || [];
    return noteIds.map((id) => notes[id]).filter((note): note is Note => !!note);
  }
);

/**
 * Select loading state
 */
export const selectNotesLoading = (state: RootState): boolean => state.notes.loading;

/**
 * Select error state
 */
export const selectNotesError = (state: RootState): string | null => state.notes.error;

/**
 * Select sync status
 */
export const selectNotesSyncStatus = (state: RootState): SyncStatus => state.notes.syncStatus;

/**
 * Select note count for a specific date
 */
export const selectNoteCountForDate = (state: RootState, date: string): number => {
  return (state.notes.noteIdsByDate[date] || []).length;
};

// =============================================================================
// Reducer Export
// =============================================================================

export default noteSlice.reducer;
