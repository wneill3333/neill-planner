/**
 * Tests for searchThunks
 *
 * Tests async search operations and helper functions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { searchAll, searchHelpers } from '../searchThunks';
import type { Task, Event, Note } from '../../../types';
import { configureStore } from '@reduxjs/toolkit';
import searchReducer from '../searchSlice';
import taskReducer from '../../tasks/taskSlice';
import eventReducer from '../../events/eventSlice';
import noteReducer from '../../notes/noteSlice';
import journalReducer from '../../journals/journalSlice';

// =============================================================================
// Test Data
// =============================================================================

const mockTasks: Task[] = [
  {
    id: 'task-1',
    userId: 'user-1',
    title: 'Meeting with John',
    description: 'Discuss project details',
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
  },
  {
    id: 'task-2',
    userId: 'user-1',
    title: 'Complete report',
    description: 'Quarterly financial report',
    priority: { letter: 'B', number: 1 },
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
  },
  {
    id: 'task-3',
    userId: 'user-1',
    title: 'Call Sarah',
    description: 'Follow up on proposal',
    priority: { letter: 'C', number: 1 },
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
    deletedAt: new Date(), // Soft deleted
  },
];

const mockEvents: Event[] = [
  {
    id: 'event-1',
    userId: 'user-1',
    title: 'Team Meeting',
    description: 'Weekly standup',
    categoryId: null,
    startTime: new Date('2026-02-01T10:00:00'),
    endTime: new Date('2026-02-01T11:00:00'),
    location: 'Conference Room A',
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
  },
];

const mockNotes: Note[] = [
  {
    id: 'note-1',
    userId: 'user-1',
    title: 'Meeting Notes',
    content: 'Important discussion points',
    date: new Date('2026-02-01'),
    categoryId: null,
    linkedTaskIds: [],
    linkedEventIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
];

// =============================================================================
// Tests - Helper Functions
// =============================================================================

describe('searchHelpers - normalizeText', () => {
  it('should convert to lowercase', () => {
    expect(searchHelpers.normalizeText('HELLO')).toBe('hello');
    expect(searchHelpers.normalizeText('HeLLo')).toBe('hello');
  });

  it('should trim whitespace', () => {
    expect(searchHelpers.normalizeText('  hello  ')).toBe('hello');
    expect(searchHelpers.normalizeText('hello   ')).toBe('hello');
  });

  it('should handle empty string', () => {
    expect(searchHelpers.normalizeText('')).toBe('');
  });
});

describe('searchHelpers - matchesQuery', () => {
  it('should match case-insensitively', () => {
    expect(searchHelpers.matchesQuery('Hello World', 'hello')).toBe(true);
    expect(searchHelpers.matchesQuery('Hello World', 'WORLD')).toBe(true);
  });

  it('should match partial text', () => {
    expect(searchHelpers.matchesQuery('Meeting with John', 'meet')).toBe(true);
    expect(searchHelpers.matchesQuery('Meeting with John', 'john')).toBe(true);
  });

  it('should return false when no match', () => {
    expect(searchHelpers.matchesQuery('Hello World', 'goodbye')).toBe(false);
  });

  it('should return false for null/undefined text', () => {
    expect(searchHelpers.matchesQuery(null, 'test')).toBe(false);
    expect(searchHelpers.matchesQuery(undefined, 'test')).toBe(false);
  });

  it('should return false for empty query', () => {
    expect(searchHelpers.matchesQuery('Hello World', '')).toBe(false);
  });
});

describe('searchHelpers - searchTasks', () => {
  it('should find tasks by title', () => {
    const results = searchHelpers.searchTasks(mockTasks, 'meeting');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('task-1');
  });

  it('should find tasks by description', () => {
    const results = searchHelpers.searchTasks(mockTasks, 'quarterly');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('task-2');
  });

  it('should be case-insensitive', () => {
    const results = searchHelpers.searchTasks(mockTasks, 'MEETING');
    expect(results).toHaveLength(1);
  });

  it('should exclude soft-deleted tasks', () => {
    const results = searchHelpers.searchTasks(mockTasks, 'sarah');
    expect(results).toHaveLength(0); // task-3 is soft deleted
  });

  it('should return empty array for empty query', () => {
    const results = searchHelpers.searchTasks(mockTasks, '');
    expect(results).toHaveLength(0);
  });

  it('should return empty array when no matches', () => {
    const results = searchHelpers.searchTasks(mockTasks, 'nonexistent');
    expect(results).toHaveLength(0);
  });
});

describe('searchHelpers - searchEvents', () => {
  it('should find events by title', () => {
    const results = searchHelpers.searchEvents(mockEvents, 'team');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('event-1');
  });

  it('should find events by description', () => {
    const results = searchHelpers.searchEvents(mockEvents, 'standup');
    expect(results).toHaveLength(1);
  });

  it('should find events by location', () => {
    const results = searchHelpers.searchEvents(mockEvents, 'conference');
    expect(results).toHaveLength(1);
  });

  it('should be case-insensitive', () => {
    const results = searchHelpers.searchEvents(mockEvents, 'TEAM');
    expect(results).toHaveLength(1);
  });

  it('should return empty array for empty query', () => {
    const results = searchHelpers.searchEvents(mockEvents, '');
    expect(results).toHaveLength(0);
  });
});

describe('searchHelpers - searchNotes', () => {
  it('should find notes by title', () => {
    const results = searchHelpers.searchNotes(mockNotes, 'meeting');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('note-1');
  });

  it('should find notes by content', () => {
    const results = searchHelpers.searchNotes(mockNotes, 'discussion');
    expect(results).toHaveLength(1);
  });

  it('should be case-insensitive', () => {
    const results = searchHelpers.searchNotes(mockNotes, 'MEETING');
    expect(results).toHaveLength(1);
  });

  it('should return empty array for empty query', () => {
    const results = searchHelpers.searchNotes(mockNotes, '');
    expect(results).toHaveLength(0);
  });
});

// =============================================================================
// Tests - searchAll Thunk
// =============================================================================

describe('searchAll thunk', () => {
  let store: any;

  beforeEach(() => {
    // Create a test store with initial data
    store = configureStore({
      reducer: {
        search: searchReducer,
        tasks: taskReducer,
        events: eventReducer,
        notes: noteReducer,
        journals: journalReducer,
      },
      preloadedState: {
        tasks: {
          tasks: {
            'task-1': mockTasks[0],
            'task-2': mockTasks[1],
          },
          taskIdsByDate: {},
          recurringParentTasks: {},
          recurringTasksLoaded: false,
          selectedDate: '2026-02-01',
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
        events: {
          events: {
            'event-1': mockEvents[0],
          },
          eventIdsByDate: {},
          recurringParentEvents: {},
          recurringEventsLoaded: false,
          selectedDate: '2026-02-01',
          loading: false,
          error: null,
        },
        notes: {
          notes: {
            'note-1': mockNotes[0],
          },
          noteIdsByDate: {},
          selectedDate: '2026-02-01',
          loading: false,
          error: null,
        },
      },
    });
  });

  it('should search across all collections', async () => {
    const result = await store.dispatch(
      searchAll({ query: 'meeting', userId: 'user-1' })
    );

    expect(result.type).toBe('search/searchAll/fulfilled');
    expect(result.payload.tasks).toHaveLength(1);
    expect(result.payload.events).toHaveLength(1);
    expect(result.payload.notes).toHaveLength(1);
  });

  it('should return empty results for empty query', async () => {
    const result = await store.dispatch(
      searchAll({ query: '', userId: 'user-1' })
    );

    expect(result.type).toBe('search/searchAll/fulfilled');
    expect(result.payload.tasks).toHaveLength(0);
    expect(result.payload.events).toHaveLength(0);
    expect(result.payload.notes).toHaveLength(0);
  });

  it('should handle whitespace-only query', async () => {
    const result = await store.dispatch(
      searchAll({ query: '   ', userId: 'user-1' })
    );

    expect(result.type).toBe('search/searchAll/fulfilled');
    expect(result.payload.tasks).toHaveLength(0);
  });

  it('should return only matching results', async () => {
    const result = await store.dispatch(
      searchAll({ query: 'report', userId: 'user-1' })
    );

    expect(result.type).toBe('search/searchAll/fulfilled');
    expect(result.payload.tasks).toHaveLength(1);
    expect(result.payload.tasks[0].id).toBe('task-2');
    expect(result.payload.events).toHaveLength(0);
    expect(result.payload.notes).toHaveLength(0);
  });

  it('should be case-insensitive', async () => {
    const result = await store.dispatch(
      searchAll({ query: 'TEAM', userId: 'user-1' })
    );

    expect(result.type).toBe('search/searchAll/fulfilled');
    expect(result.payload.events).toHaveLength(1);
  });

  it('should support partial matches', async () => {
    const result = await store.dispatch(
      searchAll({ query: 'meet', userId: 'user-1' })
    );

    expect(result.type).toBe('search/searchAll/fulfilled');
    expect(result.payload.tasks.length + result.payload.events.length + result.payload.notes.length).toBeGreaterThan(0);
  });
});
