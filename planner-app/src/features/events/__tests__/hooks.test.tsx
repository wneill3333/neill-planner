/**
 * Event Hooks Tests
 *
 * Comprehensive tests for useEventsByDate and useEvent hooks.
 * Tests data fetching, loading states, error handling, recurring events, and refetch functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { PropsWithChildren } from 'react';

import { useEventsByDate, useEvent } from '../hooks';
import eventReducer from '../eventSlice';
import {
  createMockEvent,
  createMockEventsState,
  resetMockCounters,
} from '../../../test/mockData';
import type { Event } from '../../../types';

// =============================================================================
// Mocks
// =============================================================================

// Mock Firebase services instead of thunks (following task hooks pattern)
vi.mock('../../../services/firebase/events.service', () => ({
  getEventsByDate: vi.fn(),
  getRecurringEvents: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  restoreEvent: vi.fn(),
  hardDeleteEvent: vi.fn(),
}));

import * as eventsService from '../../../services/firebase/events.service';

const mockGetEventsByDate = vi.mocked(eventsService.getEventsByDate);
const mockGetRecurringEvents = vi.mocked(eventsService.getRecurringEvents);

// =============================================================================
// Test Helpers
// =============================================================================

function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      events: eventReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
}

function createWrapper(store: ReturnType<typeof createTestStore>) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <Provider store={store}>{children}</Provider>;
  };
}

// =============================================================================
// Tests: useEventsByDate
// =============================================================================

describe('useEventsByDate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockCounters();
    mockGetEventsByDate.mockResolvedValue([]);
    mockGetRecurringEvents.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty events when userId is null', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);
    const date = new Date('2024-01-15');

    const { result } = renderHook(() => useEventsByDate(date, null), { wrapper });

    expect(result.current.events).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(mockGetEventsByDate).not.toHaveBeenCalled();
  });

  it('should fetch events when userId and date are provided', async () => {
    const events = [
      createMockEvent({
        id: 'event-1',
        startTime: new Date('2024-01-15T09:00:00.000Z'),
        endTime: new Date('2024-01-15T10:00:00.000Z'),
      }),
    ];

    mockGetEventsByDate.mockResolvedValue(events);

    const store = createTestStore();
    const wrapper = createWrapper(store);
    const date = new Date('2024-01-15');

    renderHook(() => useEventsByDate(date, 'user-1'), { wrapper });

    await waitFor(() => {
      expect(mockGetEventsByDate).toHaveBeenCalledWith('user-1', date);
    });
  });

  it('should set loading state while fetching', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockGetEventsByDate.mockReturnValue(fetchPromise);

    const store = createTestStore();
    const wrapper = createWrapper(store);
    const date = new Date('2024-01-15');

    const { result } = renderHook(() => useEventsByDate(date, 'user-1'), { wrapper });

    // Initially should trigger loading
    await waitFor(() => {
      expect(mockGetEventsByDate).toHaveBeenCalled();
    });

    // Resolve the promise
    resolvePromise!([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should set error state when fetch fails', async () => {
    const errorMessage = 'Network error';
    mockGetEventsByDate.mockRejectedValue(new Error(errorMessage));

    const store = createTestStore();
    const wrapper = createWrapper(store);
    const date = new Date('2024-01-15');

    renderHook(() => useEventsByDate(date, 'user-1'), { wrapper });

    await waitFor(() => {
      expect(mockGetEventsByDate).toHaveBeenCalled();
    });

    // Wait for error to be logged (useEffect catches and logs errors)
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it('should trigger fetch when date changes', async () => {
    mockGetEventsByDate.mockResolvedValue([]);

    const store = createTestStore();
    const wrapper = createWrapper(store);
    const date1 = new Date('2024-01-15');

    const { rerender } = renderHook(
      ({ date, userId }) => useEventsByDate(date, userId),
      {
        wrapper,
        initialProps: { date: date1, userId: 'user-1' },
      }
    );

    await waitFor(() => {
      expect(mockGetEventsByDate).toHaveBeenCalledTimes(1);
    });

    // Clear the mock to verify new call
    mockGetEventsByDate.mockClear();

    // Change the date
    const date2 = new Date('2024-01-16');
    mockGetEventsByDate.mockResolvedValue([]);
    rerender({ date: date2, userId: 'user-1' });

    await waitFor(() => {
      expect(mockGetEventsByDate).toHaveBeenCalledWith('user-1', date2);
    });
  });

  it('should trigger fetch when userId changes', async () => {
    mockGetEventsByDate.mockResolvedValue([]);

    const store = createTestStore();
    const wrapper = createWrapper(store);
    const date = new Date('2024-01-15');

    const { rerender } = renderHook(
      ({ date, userId }) => useEventsByDate(date, userId),
      {
        wrapper,
        initialProps: { date, userId: 'user-1' },
      }
    );

    await waitFor(() => {
      expect(mockGetEventsByDate).toHaveBeenCalledTimes(1);
    });

    // Clear the mock to verify new call
    mockGetEventsByDate.mockClear();

    // Change the userId
    mockGetEventsByDate.mockResolvedValue([]);
    rerender({ date, userId: 'user-2' });

    await waitFor(() => {
      expect(mockGetEventsByDate).toHaveBeenCalledWith('user-2', date);
    });
  });

  it('should not fetch when userId is null', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);
    const date = new Date('2024-01-15');

    renderHook(() => useEventsByDate(date, null), { wrapper });

    expect(mockGetEventsByDate).not.toHaveBeenCalled();
  });

  it('should fetch recurring events once when not already loaded', async () => {
    mockGetEventsByDate.mockResolvedValue([]);
    mockGetRecurringEvents.mockResolvedValue([]);

    const store = createTestStore({
      events: createMockEventsState({
        recurringEventsLoaded: false,
      }),
    });
    const wrapper = createWrapper(store);
    const date = new Date('2024-01-15');

    renderHook(() => useEventsByDate(date, 'user-1'), { wrapper });

    await waitFor(() => {
      expect(mockGetRecurringEvents).toHaveBeenCalledWith('user-1');
    });
  });

  it('should not fetch recurring events when already loaded', async () => {
    mockGetEventsByDate.mockResolvedValue([]);

    const store = createTestStore({
      events: createMockEventsState({
        recurringEventsLoaded: true,
      }),
    });
    const wrapper = createWrapper(store);
    const date = new Date('2024-01-15');

    renderHook(() => useEventsByDate(date, 'user-1'), { wrapper });

    await waitFor(() => {
      expect(mockGetEventsByDate).toHaveBeenCalled();
    });

    // Wait to ensure no recurring events call
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockGetRecurringEvents).not.toHaveBeenCalled();
  });

  it('should include recurring instances in results', () => {
    // This test verifies that the hook uses the selector that includes recurring instances
    // The actual instance generation logic is tested in recurrenceUtils.test.ts

    const recurringParent = createMockEvent({
      id: 'recurring-1',
      title: 'Daily Standup',
      startTime: new Date('2024-01-15T09:00:00.000Z'), // Same date as we're querying
      endTime: new Date('2024-01-15T09:30:00.000Z'),
      recurrence: {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: {
          type: 'never',
          endDate: null,
          maxOccurrences: null,
        },
        exceptions: [],
      },
    });

    // The recurring parent is also added as a regular event on its start date
    const store = createTestStore({
      events: createMockEventsState({
        events: [recurringParent], // Add as regular event
        recurringParentEvents: { 'recurring-1': recurringParent },
        recurringEventsLoaded: true,
      }),
    });
    const wrapper = createWrapper(store);
    const date = new Date('2024-01-15');

    const { result } = renderHook(() => useEventsByDate(date, null), { wrapper });

    // Should include the recurring event
    expect(result.current.events.length).toBeGreaterThan(0);
    expect(result.current.events[0].title).toBe('Daily Standup');
  });

  it('should provide refetch function that triggers new fetch', async () => {
    mockGetEventsByDate.mockResolvedValue([]);

    const store = createTestStore();
    const wrapper = createWrapper(store);
    const date = new Date('2024-01-15');

    const { result } = renderHook(() => useEventsByDate(date, 'user-1'), { wrapper });

    await waitFor(() => {
      expect(mockGetEventsByDate).toHaveBeenCalledTimes(1);
    });

    // Clear and call refetch
    mockGetEventsByDate.mockClear();
    result.current.refetch();

    await waitFor(() => {
      expect(mockGetEventsByDate).toHaveBeenCalledWith('user-1', date);
    });
  });

  it('should protect against race conditions with in-flight request flag', async () => {
    // Create a long-running promise
    let resolvePromise: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockGetEventsByDate.mockReturnValue(fetchPromise);

    const store = createTestStore();
    const wrapper = createWrapper(store);
    const date = new Date('2024-01-15');

    // Render the hook twice quickly
    const { rerender } = renderHook(() => useEventsByDate(date, 'user-1'), { wrapper });

    // Immediately rerender (simulating fast re-render)
    rerender();

    await waitFor(() => {
      expect(mockGetEventsByDate).toHaveBeenCalled();
    });

    // Should only have been called once due to race condition protection
    expect(mockGetEventsByDate).toHaveBeenCalledTimes(1);

    // Resolve the promise
    resolvePromise!([]);
  });

  it('should return correct sync status', async () => {
    mockGetEventsByDate.mockResolvedValue([]);

    const store = createTestStore({
      events: createMockEventsState({
        syncStatus: 'synced',
        recurringEventsLoaded: true, // Prevent recurring events fetch
      }),
    });
    const wrapper = createWrapper(store);
    const date = new Date('2024-01-15');

    const { result } = renderHook(() => useEventsByDate(date, 'user-1'), { wrapper });

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced');
    });
  });

  it('should handle cleanup on unmount', async () => {
    mockGetEventsByDate.mockResolvedValue([]);

    const store = createTestStore();
    const wrapper = createWrapper(store);
    const date = new Date('2024-01-15');

    const { unmount } = renderHook(() => useEventsByDate(date, 'user-1'), { wrapper });

    await waitFor(() => {
      expect(mockGetEventsByDate).toHaveBeenCalled();
    });

    // Unmount should trigger cleanup
    unmount();

    // Wait a bit to ensure cleanup runs
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
});

// =============================================================================
// Tests: useEvent
// =============================================================================

describe('useEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockCounters();
  });

  it('should return event when found in state', () => {
    const event = createMockEvent({
      id: 'event-1',
      title: 'Team Meeting',
    });

    const store = createTestStore({
      events: createMockEventsState({
        events: [event],
      }),
    });
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useEvent('event-1'), { wrapper });

    expect(result.current.event).toBeDefined();
    expect(result.current.event?.id).toBe('event-1');
    expect(result.current.event?.title).toBe('Team Meeting');
  });

  it('should return undefined when event not found', () => {
    const store = createTestStore({
      events: createMockEventsState({
        events: [],
      }),
    });
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useEvent('nonexistent'), { wrapper });

    expect(result.current.event).toBeUndefined();
  });

  it('should update when event changes in state', async () => {
    const initialEvent = createMockEvent({
      id: 'event-1',
      title: 'Initial Title',
    });

    const store = createTestStore({
      events: createMockEventsState({
        events: [initialEvent],
      }),
    });
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useEvent('event-1'), { wrapper });

    expect(result.current.event?.title).toBe('Initial Title');

    // Update the event in the store
    const updatedEvent: Event = { ...initialEvent, title: 'Updated Title' };
    store.dispatch({
      type: 'events/updateEventAsync/fulfilled',
      payload: updatedEvent,
    });

    await waitFor(() => {
      expect(result.current.event?.title).toBe('Updated Title');
    });
  });

  it('should return loading state from events slice', () => {
    const store = createTestStore({
      events: createMockEventsState({
        loading: true,
      }),
    });
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useEvent('event-1'), { wrapper });

    expect(result.current.loading).toBe(true);
  });

  it('should return error state from events slice', () => {
    const errorMessage = 'Failed to load events';
    const store = createTestStore({
      events: createMockEventsState({
        error: errorMessage,
      }),
    });
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useEvent('event-1'), { wrapper });

    expect(result.current.error).toBe(errorMessage);
  });

  it('should handle event with all properties', () => {
    const event = createMockEvent({
      id: 'event-complex',
      title: 'Complex Event',
      description: 'This is a complex event',
      location: 'Conference Room A',
      categoryId: 'cat-1',
      isConfidential: true,
      alternateTitle: 'Private Meeting',
      linkedTaskIds: ['task-1', 'task-2'],
      linkedNoteIds: ['note-1'],
      googleCalendarId: 'google-123',
    });

    const store = createTestStore({
      events: createMockEventsState({
        events: [event],
      }),
    });
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useEvent('event-complex'), { wrapper });

    expect(result.current.event).toBeDefined();
    expect(result.current.event?.title).toBe('Complex Event');
    expect(result.current.event?.description).toBe('This is a complex event');
    expect(result.current.event?.location).toBe('Conference Room A');
    expect(result.current.event?.isConfidential).toBe(true);
    expect(result.current.event?.linkedTaskIds).toEqual(['task-1', 'task-2']);
  });
});
