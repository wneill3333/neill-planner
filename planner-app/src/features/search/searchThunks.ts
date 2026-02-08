/**
 * Search Async Thunks
 *
 * Redux Toolkit async thunks for search operations.
 * Performs unified search across tasks, events, and notes.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Task, Event, Note, Journal } from '../../types';
import type { RootState } from '../../store';
import { selectAllTasks } from '../tasks/taskSlice';
import { selectAllEvents } from '../events/eventSlice';
import { selectAllNotes } from '../notes/noteSlice';
import { selectAllJournals } from '../journals/journalSlice';
import type { SearchResults } from './searchSlice';

// =============================================================================
// Types
// =============================================================================

/**
 * Payload for search operation
 */
export interface SearchPayload {
  query: string;
}

/**
 * Error response from search thunks
 */
export interface SearchError {
  message: string;
  code?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalize text for case-insensitive comparison
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Check if text matches query (case-insensitive, partial match)
 */
function matchesQuery(text: string | null | undefined, query: string): boolean {
  if (!text || !query) return false;
  return normalizeText(text).includes(normalizeText(query));
}

/**
 * Search tasks by title and description
 */
function searchTasks(tasks: Task[], query: string): Task[] {
  if (!query.trim()) return [];

  return tasks.filter((task) => {
    // Exclude soft-deleted tasks
    if (task.deletedAt) return false;

    // Search in title and description
    return matchesQuery(task.title, query) || matchesQuery(task.description, query);
  });
}

/**
 * Search events by title, description, and location
 */
function searchEvents(events: Event[], query: string): Event[] {
  if (!query.trim()) return [];

  return events.filter((event) => {
    // Exclude soft-deleted events
    if (event.deletedAt) return false;

    // Search in title, description, and location
    return (
      matchesQuery(event.title, query) ||
      matchesQuery(event.description, query) ||
      matchesQuery(event.location, query)
    );
  });
}

/**
 * Search notes by title and content
 */
function searchNotes(notes: Note[], query: string): Note[] {
  if (!query.trim()) return [];

  return notes.filter((note) => {
    // Exclude soft-deleted notes
    if (note.deletedAt) return false;

    // Search in title and content
    return matchesQuery(note.title, query) || matchesQuery(note.content, query);
  });
}

/**
 * Search journals by title and description
 */
function searchJournals(journals: Journal[], query: string): Journal[] {
  if (!query.trim()) return [];

  return journals.filter((journal) => {
    // Exclude soft-deleted journals
    if (journal.deletedAt) return false;

    // Search in title and description
    return matchesQuery(journal.title, query) || matchesQuery(journal.description, query);
  });
}

// =============================================================================
// Async Thunks
// =============================================================================

/**
 * Search across all tasks, events, and notes
 *
 * Performs case-insensitive partial match search in:
 * - Tasks: title, description
 * - Events: title, description, location
 * - Notes: title, content
 *
 * Returns results grouped by type.
 */
export const searchAll = createAsyncThunk<
  SearchResults,
  SearchPayload,
  { state: RootState; rejectValue: SearchError }
>('search/searchAll', async ({ query }, { getState, rejectWithValue }) => {
  try {
    // Get current state
    const state = getState();

    // If query is empty, return empty results
    if (!query.trim()) {
      return {
        tasks: [],
        events: [],
        notes: [],
        journals: [],
      };
    }

    // Get all items from state (already filtered by userId in selectors)
    const allTasks = selectAllTasks(state);
    const allEvents = selectAllEvents(state);
    const allNotes = selectAllNotes(state);
    const allJournals = selectAllJournals(state);

    // Search each collection
    const taskResults = searchTasks(allTasks, query);
    const eventResults = searchEvents(allEvents, query);
    const noteResults = searchNotes(allNotes, query);
    const journalResults = searchJournals(allJournals, query);

    return {
      tasks: taskResults,
      events: eventResults,
      notes: noteResults,
      journals: journalResults,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return rejectWithValue({ message });
  }
});

/**
 * Export helper functions for testing
 */
export const searchHelpers = {
  normalizeText,
  matchesQuery,
  searchTasks,
  searchEvents,
  searchNotes,
  searchJournals,
};
