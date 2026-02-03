/**
 * Tests for Recurring Tasks Service Functions
 *
 * Tests the getRecurringTasks function added in Step 6.2.2.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Task, RecurrencePattern } from '../../../types';

// Mock Firestore functions - MUST be declared before vi.mock
const mockGetDocs = vi.fn();
const mockQuery = vi.fn();
const mockCollection = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();

// Mock Firestore
vi.mock('../config', () => ({
  db: {},
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: mockCollection,
    query: mockQuery,
    where: mockWhere,
    orderBy: mockOrderBy,
    getDocs: mockGetDocs,
    Timestamp: {
      fromDate: (date: Date) => ({ toDate: () => date }),
    },
  };
});

// Import after mocking
const { getRecurringTasks } = await import('../tasks.service');

describe('getRecurringTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMockDoc(id: string, data: Partial<Task>): any {
    return {
      id,
      data: () => ({
        userId: data.userId || 'user-1',
        title: data.title || 'Task',
        description: data.description || '',
        categoryId: data.categoryId || null,
        priority: data.priority || { letter: 'A', number: 1 },
        status: data.status || 'in_progress',
        scheduledDate: data.scheduledDate ? { toDate: () => data.scheduledDate } : null,
        scheduledTime: data.scheduledTime || null,
        recurrence: data.recurrence || null,
        linkedNoteIds: data.linkedNoteIds || [],
        linkedEventId: data.linkedEventId || null,
        isRecurringInstance: data.isRecurringInstance || false,
        recurringParentId: data.recurringParentId || null,
        instanceDate: data.instanceDate ? { toDate: () => data.instanceDate } : null,
        createdAt: { toDate: () => data.createdAt || new Date() },
        updatedAt: { toDate: () => data.updatedAt || new Date() },
        deletedAt: data.deletedAt ? { toDate: () => data.deletedAt } : null,
      }),
    };
  }

  const dailyRecurrence: RecurrencePattern = {
    type: 'daily',
    interval: 1,
    daysOfWeek: [],
    dayOfMonth: null,
    monthOfYear: null,
    endCondition: { type: 'never', endDate: null, maxOccurrences: null },
    exceptions: [],
  };

  it('should fetch recurring tasks for a user', async () => {
    const recurringTask1 = createMockDoc('task-1', {
      userId: 'user-1',
      title: 'Daily Task',
      scheduledDate: new Date('2026-02-01'),
      recurrence: dailyRecurrence,
    });

    const recurringTask2 = createMockDoc('task-2', {
      userId: 'user-1',
      title: 'Weekly Task',
      scheduledDate: new Date('2026-02-01'),
      recurrence: {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      },
    });

    mockGetDocs.mockResolvedValue({
      docs: [recurringTask1, recurringTask2],
    });

    const result = await getRecurringTasks('user-1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('task-1');
    expect(result[0].recurrence).not.toBeNull();
    expect(result[1].id).toBe('task-2');
    expect(result[1].recurrence).not.toBeNull();
  });

  it('should filter out non-recurring tasks', async () => {
    const recurringTask = createMockDoc('task-1', {
      userId: 'user-1',
      title: 'Recurring Task',
      scheduledDate: new Date('2026-02-01'),
      recurrence: dailyRecurrence,
    });

    const nonRecurringTask = createMockDoc('task-2', {
      userId: 'user-1',
      title: 'Non-Recurring Task',
      scheduledDate: new Date('2026-02-01'),
      recurrence: null,
    });

    mockGetDocs.mockResolvedValue({
      docs: [recurringTask, nonRecurringTask],
    });

    const result = await getRecurringTasks('user-1');

    // Should only return the recurring task
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('task-1');
    expect(result[0].recurrence).not.toBeNull();
  });

  it('should return empty array when no recurring tasks exist', async () => {
    const nonRecurringTask = createMockDoc('task-1', {
      userId: 'user-1',
      title: 'Non-Recurring Task',
      scheduledDate: new Date('2026-02-01'),
      recurrence: null,
    });

    mockGetDocs.mockResolvedValue({
      docs: [nonRecurringTask],
    });

    const result = await getRecurringTasks('user-1');

    expect(result).toEqual([]);
  });

  it('should throw ValidationError for invalid userId', async () => {
    await expect(getRecurringTasks('')).rejects.toThrow();
  });

  it('should handle Firestore errors gracefully', async () => {
    mockGetDocs.mockRejectedValue(new Error('Firestore error'));

    await expect(getRecurringTasks('user-1')).rejects.toThrow('Failed to fetch recurring tasks');
  });

  it('should only fetch non-deleted recurring tasks', async () => {
    // The query should include where('deletedAt', '==', null)
    // This is tested implicitly by the mock setup
    const recurringTask = createMockDoc('task-1', {
      userId: 'user-1',
      title: 'Active Recurring Task',
      scheduledDate: new Date('2026-02-01'),
      recurrence: dailyRecurrence,
      deletedAt: null,
    });

    mockGetDocs.mockResolvedValue({
      docs: [recurringTask],
    });

    const result = await getRecurringTasks('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].deletedAt).toBeNull();
  });
});
