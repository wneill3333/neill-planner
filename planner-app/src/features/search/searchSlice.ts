/**
 * Search Slice
 *
 * Redux Toolkit slice for unified search state management.
 * Handles searching across tasks, events, and notes with debouncing.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Task, Event, Note, Journal } from '../../types';
import type { RootState } from '../../store';
import { searchAll } from './searchThunks';

// =============================================================================
// Types
// =============================================================================

/**
 * Search results grouped by type
 */
export interface SearchResults {
  tasks: Task[];
  events: Event[];
  notes: Note[];
  journals: Journal[];
}

/**
 * State shape for the search slice
 */
export interface SearchState {
  /** Current search query */
  query: string;
  /** Search results grouped by type */
  results: SearchResults;
  /** Whether search is in progress */
  isSearching: boolean;
  /** Error message if search fails */
  error: string | null;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: SearchState = {
  query: '',
  results: {
    tasks: [],
    events: [],
    notes: [],
    journals: [],
  },
  isSearching: false,
  error: null,
};

// =============================================================================
// Slice
// =============================================================================

/**
 * Search slice
 *
 * Manages search query and results state.
 * Works with searchThunks for async search operations.
 */
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    /**
     * Set the search query
     * Does not trigger search - use searchAll thunk for that
     */
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
      // Clear results when query is empty
      if (!action.payload.trim()) {
        state.results = {
          tasks: [],
          events: [],
          notes: [],
          journals: [],
        };
        state.error = null;
      }
    },

    /**
     * Clear search query and results
     */
    clearSearch(state) {
      state.query = '';
      state.results = {
        tasks: [],
        events: [],
        notes: [],
        journals: [],
      };
      state.isSearching = false;
      state.error = null;
    },

    /**
     * Set error state
     */
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle searchAll thunk
      .addCase(searchAll.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchAll.fulfilled, (state, action) => {
        state.isSearching = false;
        state.results = action.payload;
        state.error = null;
      })
      .addCase(searchAll.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload?.message || 'Search failed';
      });
  },
});

// =============================================================================
// Actions
// =============================================================================

export const { setQuery, clearSearch, setError } = searchSlice.actions;

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select the current search query
 */
export const selectSearchQuery = (state: RootState): string => state.search.query;

/**
 * Select all search results
 */
export const selectSearchResults = (state: RootState): SearchResults => state.search.results;

/**
 * Select whether search is in progress
 */
export const selectIsSearching = (state: RootState): boolean => state.search.isSearching;

/**
 * Select search error
 */
export const selectSearchError = (state: RootState): string | null => state.search.error;

/**
 * Select whether there are any search results
 */
export const selectHasResults = (state: RootState): boolean => {
  const { tasks, events, notes, journals } = state.search.results;
  return tasks.length > 0 || events.length > 0 || notes.length > 0 || journals.length > 0;
};

/**
 * Select total count of search results
 */
export const selectResultsCount = (state: RootState): number => {
  const { tasks, events, notes, journals } = state.search.results;
  return tasks.length + events.length + notes.length + journals.length;
};

/**
 * Select task results
 */
export const selectTaskResults = (state: RootState): Task[] => state.search.results.tasks;

/**
 * Select event results
 */
export const selectEventResults = (state: RootState): Event[] => state.search.results.events;

/**
 * Select note results
 */
export const selectNoteResults = (state: RootState): Note[] => state.search.results.notes;

/**
 * Select journal results
 */
export const selectJournalResults = (state: RootState): Journal[] => state.search.results.journals;

// =============================================================================
// Reducer
// =============================================================================

export default searchSlice.reducer;
