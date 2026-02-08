/**
 * Journal Slice
 *
 * Redux Toolkit slice for journal state management.
 * Handles normalized journal and entry storage, and CRUD operations.
 */

import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { Journal, JournalEntry, SyncStatus } from '../../types';
import type { RootState } from '../../store';
import {
  fetchUserJournals,
  createJournalAsync,
  updateJournalAsync,
  deleteJournalAsync,
  hardDeleteJournalAsync,
  fetchJournalEntries,
  createJournalEntryAsync,
  updateJournalEntryAsync,
  deleteJournalEntryAsync,
  uploadJournalEntryAttachmentsAsync,
  deleteJournalEntryAttachmentAsync,
} from './journalThunks';

// =============================================================================
// Types
// =============================================================================

/**
 * State shape for the journals slice
 */
export interface JournalsState {
  /** Normalized journals storage - journals indexed by ID */
  journals: Record<string, Journal>;
  /** Journal IDs ordered for display (sorted by updatedAt desc) */
  journalIds: string[];
  /** Normalized entries storage - entries indexed by ID */
  entries: Record<string, JournalEntry>;
  /** Entry IDs indexed by journal ID for quick lookup */
  entryIdsByJournal: Record<string, string[]>;
  /** Currently selected journal ID */
  selectedJournalId: string | null;
  /** Loading state for journals */
  loading: boolean;
  /** Loading state for entries */
  entriesLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Sync status with backend */
  syncStatus: SyncStatus;
}

// =============================================================================
// Initial State
// =============================================================================

export const initialState: JournalsState = {
  journals: {},
  journalIds: [],
  entries: {},
  entryIdsByJournal: {},
  selectedJournalId: null,
  loading: false,
  entriesLoading: false,
  error: null,
  syncStatus: 'synced',
};

// =============================================================================
// Slice
// =============================================================================

export const journalSlice = createSlice({
  name: 'journals',
  initialState,
  reducers: {
    /**
     * Set the currently selected journal
     */
    setSelectedJournal: (state, action: PayloadAction<string | null>) => {
      state.selectedJournalId = action.payload;
    },

    /**
     * Clear all journals (useful for logout)
     */
    clearJournals: (state) => {
      state.journals = {};
      state.journalIds = [];
      state.entries = {};
      state.entryIdsByJournal = {};
      state.selectedJournalId = null;
      state.error = null;
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
  },
  extraReducers: (builder) => {
    // ==========================================================================
    // fetchUserJournals
    // ==========================================================================
    builder
      .addCase(fetchUserJournals.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.syncStatus = 'syncing';
      })
      .addCase(fetchUserJournals.fulfilled, (state, action) => {
        state.loading = false;
        state.syncStatus = 'synced';

        // Sort journals by updatedAt descending
        const sortedJournals = [...action.payload].sort((a, b) => {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        // Populate journals and journalIds
        state.journals = {};
        state.journalIds = [];
        for (const journal of sortedJournals) {
          state.journals[journal.id] = journal;
          state.journalIds.push(journal.id);
        }
      })
      .addCase(fetchUserJournals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch journals';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // createJournalAsync
    // ==========================================================================
    builder
      .addCase(createJournalAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(createJournalAsync.fulfilled, (state, action) => {
        const journal = action.payload;
        state.journals[journal.id] = journal;
        // Prepend to journalIds (newest first)
        state.journalIds.unshift(journal.id);
        state.syncStatus = 'synced';
      })
      .addCase(createJournalAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to create journal';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // updateJournalAsync
    // ==========================================================================
    builder
      .addCase(updateJournalAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(updateJournalAsync.fulfilled, (state, action) => {
        const updatedJournal = action.payload;
        state.journals[updatedJournal.id] = updatedJournal;
        state.syncStatus = 'synced';
      })
      .addCase(updateJournalAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to update journal';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // deleteJournalAsync
    // ==========================================================================
    builder
      .addCase(deleteJournalAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(deleteJournalAsync.fulfilled, (state, action) => {
        const journalId = action.payload;

        // Remove from journals
        delete state.journals[journalId];

        // Remove from journalIds
        const index = state.journalIds.indexOf(journalId);
        if (index > -1) {
          state.journalIds.splice(index, 1);
        }

        // Clear selectedJournalId if it matches
        if (state.selectedJournalId === journalId) {
          state.selectedJournalId = null;
        }

        state.syncStatus = 'synced';
      })
      .addCase(deleteJournalAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to delete journal';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // hardDeleteJournalAsync
    // ==========================================================================
    builder
      .addCase(hardDeleteJournalAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(hardDeleteJournalAsync.fulfilled, (state, action) => {
        const journalId = action.payload;

        // Remove from journals
        delete state.journals[journalId];

        // Remove from journalIds
        const index = state.journalIds.indexOf(journalId);
        if (index > -1) {
          state.journalIds.splice(index, 1);
        }

        // Clear selectedJournalId if it matches
        if (state.selectedJournalId === journalId) {
          state.selectedJournalId = null;
        }

        state.syncStatus = 'synced';
      })
      .addCase(hardDeleteJournalAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to permanently delete journal';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // fetchJournalEntries
    // ==========================================================================
    builder
      .addCase(fetchJournalEntries.pending, (state) => {
        state.entriesLoading = true;
        state.error = null;
      })
      .addCase(fetchJournalEntries.fulfilled, (state, action) => {
        const { journalId, entries } = action.payload;
        state.entriesLoading = false;

        // Populate entries and entryIdsByJournal
        state.entryIdsByJournal[journalId] = [];
        for (const entry of entries) {
          state.entries[entry.id] = entry;
          state.entryIdsByJournal[journalId].push(entry.id);
        }
      })
      .addCase(fetchJournalEntries.rejected, (state, action) => {
        state.entriesLoading = false;
        state.error = action.payload?.message || 'Failed to fetch journal entries';
      });

    // ==========================================================================
    // createJournalEntryAsync
    // ==========================================================================
    builder
      .addCase(createJournalEntryAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(createJournalEntryAsync.fulfilled, (state, action) => {
        const entry = action.payload;
        const { journalId } = entry;

        // Add to entries
        state.entries[entry.id] = entry;

        // Prepend to entryIdsByJournal (newest first)
        if (!state.entryIdsByJournal[journalId]) {
          state.entryIdsByJournal[journalId] = [];
        }
        state.entryIdsByJournal[journalId].unshift(entry.id);

        // Update parent journal's entryCount and lastEntryAt
        const journal = state.journals[journalId];
        if (journal) {
          journal.entryCount = (journal.entryCount || 0) + 1;
          journal.lastEntryAt = entry.createdAt;
        }

        state.syncStatus = 'synced';
      })
      .addCase(createJournalEntryAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to create journal entry';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // updateJournalEntryAsync
    // ==========================================================================
    builder
      .addCase(updateJournalEntryAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(updateJournalEntryAsync.fulfilled, (state, action) => {
        const updatedEntry = action.payload;
        state.entries[updatedEntry.id] = updatedEntry;
        state.syncStatus = 'synced';
      })
      .addCase(updateJournalEntryAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to update journal entry';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // deleteJournalEntryAsync
    // ==========================================================================
    builder
      .addCase(deleteJournalEntryAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(deleteJournalEntryAsync.fulfilled, (state, action) => {
        const { entryId, journalId } = action.payload;

        // Remove from entries
        delete state.entries[entryId];

        // Remove from entryIdsByJournal
        if (state.entryIdsByJournal[journalId]) {
          const index = state.entryIdsByJournal[journalId].indexOf(entryId);
          if (index > -1) {
            state.entryIdsByJournal[journalId].splice(index, 1);
          }
        }

        // Update parent journal's entryCount
        const journal = state.journals[journalId];
        if (journal) {
          journal.entryCount = Math.max(0, (journal.entryCount || 0) - 1);
        }

        state.syncStatus = 'synced';
      })
      .addCase(deleteJournalEntryAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to delete journal entry';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // uploadJournalEntryAttachmentsAsync
    // ==========================================================================
    builder
      .addCase(uploadJournalEntryAttachmentsAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(uploadJournalEntryAttachmentsAsync.fulfilled, (state, action) => {
        const { entryId, attachments } = action.payload;
        const entry = state.entries[entryId];
        if (entry) {
          entry.attachments = [...(entry.attachments || []), ...attachments];
        }
        state.syncStatus = 'synced';
      })
      .addCase(uploadJournalEntryAttachmentsAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to upload attachments';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // deleteJournalEntryAttachmentAsync
    // ==========================================================================
    builder
      .addCase(deleteJournalEntryAttachmentAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(deleteJournalEntryAttachmentAsync.fulfilled, (state, action) => {
        const { entryId, attachmentId } = action.payload;
        const entry = state.entries[entryId];
        if (entry) {
          entry.attachments = (entry.attachments || []).filter(a => a.id !== attachmentId);
        }
        state.syncStatus = 'synced';
      })
      .addCase(deleteJournalEntryAttachmentAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to delete attachment';
        state.syncStatus = 'error';
      });
  },
});

// =============================================================================
// Actions
// =============================================================================

export const {
  setSelectedJournal,
  clearJournals,
  setError,
  clearError,
} = journalSlice.actions;

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select all journals as an array
 */
export const selectAllJournals = (state: RootState): Journal[] =>
  state.journals.journalIds.map(id => state.journals.journals[id]).filter((j): j is Journal => !!j);

/**
 * Select a journal by ID
 */
export const selectJournalById = (state: RootState, journalId: string): Journal | undefined =>
  state.journals.journals[journalId];

/**
 * Select the currently selected journal ID
 */
export const selectSelectedJournalId = (state: RootState): string | null =>
  state.journals.selectedJournalId;

/**
 * Select the currently selected journal
 */
export const selectSelectedJournal = createSelector(
  [
    (state: RootState) => state.journals.journals,
    (state: RootState) => state.journals.selectedJournalId,
  ],
  (journals, selectedJournalId): Journal | undefined => {
    if (!selectedJournalId) return undefined;
    return journals[selectedJournalId];
  }
);

/**
 * Select entries for a specific journal
 */
export const selectEntriesByJournal = createSelector(
  [
    (state: RootState) => state.journals.entries,
    (state: RootState) => state.journals.entryIdsByJournal,
    (_state: RootState, journalId: string) => journalId,
  ],
  (entries, entryIdsByJournal, journalId): JournalEntry[] => {
    const entryIds = entryIdsByJournal[journalId] || [];
    return entryIds.map(id => entries[id]).filter((e): e is JournalEntry => !!e);
  }
);

/**
 * Select journals loading state
 */
export const selectJournalsLoading = (state: RootState): boolean => state.journals.loading;

/**
 * Select entries loading state
 */
export const selectEntriesLoading = (state: RootState): boolean => state.journals.entriesLoading;

/**
 * Select error state
 */
export const selectJournalsError = (state: RootState): string | null => state.journals.error;

/**
 * Select sync status
 */
export const selectJournalsSyncStatus = (state: RootState): SyncStatus => state.journals.syncStatus;

// =============================================================================
// Reducer Export
// =============================================================================

export default journalSlice.reducer;
