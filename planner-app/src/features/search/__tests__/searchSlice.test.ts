/**
 * Tests for searchSlice
 *
 * Tests Redux slice for search state management.
 */

import { describe, it, expect } from 'vitest';
import searchReducer, {
  setQuery,
  clearSearch,
  setError,
  selectSearchQuery,
  selectSearchResults,
  selectIsSearching,
  selectSearchError,
  selectHasResults,
  selectResultsCount,
  selectTaskResults,
  selectEventResults,
  selectNoteResults,
  type SearchState,
} from '../searchSlice';
import { searchAll } from '../searchThunks';
import type { Task, Event, Note } from '../../../types';

// =============================================================================
// Test Data
// =============================================================================

const mockTask: Task = {
  id: 'task-1',
  userId: 'user-1',
  title: 'Test Task',
  description: 'Test Description',
  priority: { letter: 'A', number: 1 },
  status: 'in_progress',
  categoryId: null,
  scheduledDate: new Date('2026-02-01'),
  scheduledTime: null,
  recurrence: null,
  linkedNoteIds: [],
  linkedEventId: null,
  isRecurringInstance: false,
  recurringParentId: null,
  instanceDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockEvent: Event = {
  id: 'event-1',
  userId: 'user-1',
  title: 'Test Event',
  description: 'Test Description',
  categoryId: null,
  startTime: new Date('2026-02-01T10:00:00'),
  endTime: new Date('2026-02-01T11:00:00'),
  location: 'Test Location',
  isConfidential: false,
  alternateTitle: null,
  recurrence: null,
  linkedNoteIds: [],
  linkedTaskIds: [],
  googleCalendarId: null,
  isRecurringInstance: false,
  recurringParentId: null,
  instanceDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockNote: Note = {
  id: 'note-1',
  userId: 'user-1',
  title: 'Test Note',
  content: 'Test Content',
  date: new Date('2026-02-01'),
  categoryId: null,
  linkedTaskIds: [],
  linkedEventIds: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

// =============================================================================
// Tests - Initial State
// =============================================================================

describe('searchSlice - Initial State', () => {
  it('should return the initial state', () => {
    const state = searchReducer(undefined, { type: 'unknown' });

    expect(state).toEqual({
      query: '',
      results: {
        tasks: [],
        events: [],
        notes: [],
      },
      isSearching: false,
      error: null,
    });
  });
});

// =============================================================================
// Tests - Reducers
// =============================================================================

describe('searchSlice - Reducers', () => {
  it('should handle setQuery', () => {
    const initialState: SearchState = {
      query: '',
      results: { tasks: [], events: [], notes: [] },
      isSearching: false,
      error: null,
    };

    const state = searchReducer(initialState, setQuery('test query'));

    expect(state.query).toBe('test query');
  });

  it('should clear results when query is empty', () => {
    const initialState: SearchState = {
      query: 'old query',
      results: { tasks: [mockTask], events: [mockEvent], notes: [mockNote] },
      isSearching: false,
      error: 'some error',
    };

    const state = searchReducer(initialState, setQuery(''));

    expect(state.query).toBe('');
    expect(state.results).toEqual({ tasks: [], events: [], notes: [] });
    expect(state.error).toBe(null);
  });

  it('should handle clearSearch', () => {
    const initialState: SearchState = {
      query: 'test query',
      results: { tasks: [mockTask], events: [mockEvent], notes: [mockNote] },
      isSearching: true,
      error: 'some error',
    };

    const state = searchReducer(initialState, clearSearch());

    expect(state.query).toBe('');
    expect(state.results).toEqual({ tasks: [], events: [], notes: [] });
    expect(state.isSearching).toBe(false);
    expect(state.error).toBe(null);
  });

  it('should handle setError', () => {
    const initialState: SearchState = {
      query: '',
      results: { tasks: [], events: [], notes: [] },
      isSearching: false,
      error: null,
    };

    const state = searchReducer(initialState, setError('Test error'));

    expect(state.error).toBe('Test error');
  });

  it('should clear error with setError(null)', () => {
    const initialState: SearchState = {
      query: '',
      results: { tasks: [], events: [], notes: [] },
      isSearching: false,
      error: 'existing error',
    };

    const state = searchReducer(initialState, setError(null));

    expect(state.error).toBe(null);
  });
});

// =============================================================================
// Tests - Thunk Handling
// =============================================================================

describe('searchSlice - Thunk Handling', () => {
  it('should handle searchAll.pending', () => {
    const initialState: SearchState = {
      query: 'test',
      results: { tasks: [], events: [], notes: [] },
      isSearching: false,
      error: 'old error',
    };

    const state = searchReducer(initialState, searchAll.pending('', { query: 'test', userId: 'user-1' }));

    expect(state.isSearching).toBe(true);
    expect(state.error).toBe(null);
  });

  it('should handle searchAll.fulfilled', () => {
    const initialState: SearchState = {
      query: 'test',
      results: { tasks: [], events: [], notes: [] },
      isSearching: true,
      error: null,
    };

    const results = {
      tasks: [mockTask],
      events: [mockEvent],
      notes: [mockNote],
    };

    const state = searchReducer(
      initialState,
      searchAll.fulfilled(results, '', { query: 'test', userId: 'user-1' })
    );

    expect(state.isSearching).toBe(false);
    expect(state.results).toEqual(results);
    expect(state.error).toBe(null);
  });

  it('should handle searchAll.rejected', () => {
    const initialState: SearchState = {
      query: 'test',
      results: { tasks: [], events: [], notes: [] },
      isSearching: true,
      error: null,
    };

    const state = searchReducer(
      initialState,
      searchAll.rejected(
        new Error('Search failed'),
        '',
        { query: 'test', userId: 'user-1' },
        { message: 'Search failed' }
      )
    );

    expect(state.isSearching).toBe(false);
    expect(state.error).toBe('Search failed');
  });

  it('should handle searchAll.rejected with default error message', () => {
    const initialState: SearchState = {
      query: 'test',
      results: { tasks: [], events: [], notes: [] },
      isSearching: true,
      error: null,
    };

    const state = searchReducer(
      initialState,
      searchAll.rejected(
        new Error('Unknown error'),
        '',
        { query: 'test', userId: 'user-1' },
        undefined
      )
    );

    expect(state.isSearching).toBe(false);
    expect(state.error).toBe('Search failed');
  });
});

// =============================================================================
// Tests - Selectors
// =============================================================================

describe('searchSlice - Selectors', () => {
  const mockState = {
    search: {
      query: 'test query',
      results: {
        tasks: [mockTask],
        events: [mockEvent],
        notes: [mockNote],
      },
      isSearching: true,
      error: 'test error',
    },
  } as any;

  it('selectSearchQuery should return query', () => {
    expect(selectSearchQuery(mockState)).toBe('test query');
  });

  it('selectSearchResults should return results', () => {
    expect(selectSearchResults(mockState)).toEqual({
      tasks: [mockTask],
      events: [mockEvent],
      notes: [mockNote],
    });
  });

  it('selectIsSearching should return isSearching', () => {
    expect(selectIsSearching(mockState)).toBe(true);
  });

  it('selectSearchError should return error', () => {
    expect(selectSearchError(mockState)).toBe('test error');
  });

  it('selectHasResults should return true when there are results', () => {
    expect(selectHasResults(mockState)).toBe(true);
  });

  it('selectHasResults should return false when there are no results', () => {
    const emptyState = {
      search: {
        query: 'test',
        results: { tasks: [], events: [], notes: [] },
        isSearching: false,
        error: null,
      },
    } as any;

    expect(selectHasResults(emptyState)).toBe(false);
  });

  it('selectResultsCount should return total count', () => {
    expect(selectResultsCount(mockState)).toBe(3);
  });

  it('selectResultsCount should return 0 when no results', () => {
    const emptyState = {
      search: {
        query: 'test',
        results: { tasks: [], events: [], notes: [] },
        isSearching: false,
        error: null,
      },
    } as any;

    expect(selectResultsCount(emptyState)).toBe(0);
  });

  it('selectTaskResults should return task results', () => {
    expect(selectTaskResults(mockState)).toEqual([mockTask]);
  });

  it('selectEventResults should return event results', () => {
    expect(selectEventResults(mockState)).toEqual([mockEvent]);
  });

  it('selectNoteResults should return note results', () => {
    expect(selectNoteResults(mockState)).toEqual([mockNote]);
  });
});
