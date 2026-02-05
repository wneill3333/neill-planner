/**
 * Reminders Service Tests
 *
 * Comprehensive tests for the reminders Firebase service layer including:
 * - Validation functions
 * - CRUD operations
 * - Snooze functionality
 * - Dismiss functionality
 * - Query functions
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  Reminder,
  CreateReminderInput,
  UpdateReminderInput,
  SnoozeOption,
} from '../../../types';

// Mock Firestore
const mockAddDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000 }),
  },
}));

vi.mock('../config', () => ({
  db: { name: 'mock-db' },
}));

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a mock reminder for testing
 */
function createMockReminder(overrides: Partial<Reminder> = {}): Reminder {
  const now = new Date();
  return {
    id: 'reminder-1',
    userId: 'user-123',
    taskId: 'task-1',
    eventId: null,
    type: 'push',
    minutesBefore: 15,
    status: 'pending',
    scheduledTime: now,
    triggeredAt: null,
    dismissedAt: null,
    snoozedUntil: null,
    snoozeCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create mock Firestore document snapshot
 */
function createMockDocSnapshot(reminder: Reminder) {
  return {
    exists: () => true,
    id: reminder.id,
    data: () => ({
      userId: reminder.userId,
      taskId: reminder.taskId,
      eventId: reminder.eventId,
      type: reminder.type,
      minutesBefore: reminder.minutesBefore,
      status: reminder.status,
      scheduledTime: { toDate: () => reminder.scheduledTime },
      triggeredAt: reminder.triggeredAt ? { toDate: () => reminder.triggeredAt } : null,
      dismissedAt: reminder.dismissedAt ? { toDate: () => reminder.dismissedAt } : null,
      snoozedUntil: reminder.snoozedUntil ? { toDate: () => reminder.snoozedUntil } : null,
      snoozeCount: reminder.snoozeCount,
      createdAt: { toDate: () => reminder.createdAt },
      updatedAt: { toDate: () => reminder.updatedAt },
    }),
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('Reminders Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('reminders-collection');
    mockDoc.mockReturnValue('reminder-doc-ref');
    mockQuery.mockReturnValue('query-ref');
    mockWhere.mockReturnValue('where-clause');
    mockOrderBy.mockReturnValue('order-clause');
  });

  // ===========================================================================
  // createReminder Tests
  // ===========================================================================

  describe('createReminder', () => {
    it('should create a reminder with task ID', async () => {
      const { createReminder } = await import('../reminders.service');

      mockAddDoc.mockResolvedValue({ id: 'new-reminder-id' });

      const input: CreateReminderInput = {
        taskId: 'task-123',
        type: 'push',
        minutesBefore: 15,
        scheduledTime: new Date('2026-02-01T10:00:00'),
      };

      const result = await createReminder(input, 'user-123');

      expect(mockAddDoc).toHaveBeenCalled();
      expect(result.id).toBe('new-reminder-id');
      expect(result.userId).toBe('user-123');
      expect(result.taskId).toBe('task-123');
      expect(result.eventId).toBeNull();
      expect(result.type).toBe('push');
      expect(result.minutesBefore).toBe(15);
      expect(result.status).toBe('pending');
      expect(result.snoozeCount).toBe(0);
    });

    it('should create a reminder with event ID', async () => {
      const { createReminder } = await import('../reminders.service');

      mockAddDoc.mockResolvedValue({ id: 'new-reminder-id' });

      const input: CreateReminderInput = {
        eventId: 'event-456',
        type: 'email',
        minutesBefore: 30,
        scheduledTime: new Date('2026-02-01T10:00:00'),
      };

      const result = await createReminder(input, 'user-123');

      expect(result.taskId).toBeNull();
      expect(result.eventId).toBe('event-456');
      expect(result.type).toBe('email');
    });

    it('should create a reminder with inApp type', async () => {
      const { createReminder } = await import('../reminders.service');

      mockAddDoc.mockResolvedValue({ id: 'new-reminder-id' });

      const input: CreateReminderInput = {
        taskId: 'task-123',
        type: 'inApp',
        minutesBefore: 5,
      };

      const result = await createReminder(input, 'user-123');

      expect(result.type).toBe('inApp');
      expect(result.scheduledTime).toBeInstanceOf(Date);
    });

    it('should throw validation error when userId is missing', async () => {
      const { createReminder } = await import('../reminders.service');

      const input: CreateReminderInput = {
        taskId: 'task-123',
        type: 'push',
        minutesBefore: 15,
      };

      await expect(createReminder(input, '')).rejects.toThrow('userId is required');
    });

    it('should throw validation error when neither taskId nor eventId provided', async () => {
      const { createReminder } = await import('../reminders.service');

      const input: CreateReminderInput = {
        type: 'push',
        minutesBefore: 15,
      };

      await expect(createReminder(input, 'user-123')).rejects.toThrow(
        'Either taskId or eventId must be provided'
      );
    });

    it('should throw validation error when both taskId and eventId provided', async () => {
      const { createReminder } = await import('../reminders.service');

      const input: CreateReminderInput = {
        taskId: 'task-123',
        eventId: 'event-456',
        type: 'push',
        minutesBefore: 15,
      };

      await expect(createReminder(input, 'user-123')).rejects.toThrow(
        'Cannot provide both taskId and eventId'
      );
    });

    it('should throw validation error for invalid reminder type', async () => {
      const { createReminder } = await import('../reminders.service');

      const input = {
        taskId: 'task-123',
        type: 'invalid' as 'push',
        minutesBefore: 15,
      };

      await expect(createReminder(input, 'user-123')).rejects.toThrow(
        'Reminder type must be push, email, or inApp'
      );
    });

    it('should throw validation error for negative minutesBefore', async () => {
      const { createReminder } = await import('../reminders.service');

      const input: CreateReminderInput = {
        taskId: 'task-123',
        type: 'push',
        minutesBefore: -5,
      };

      await expect(createReminder(input, 'user-123')).rejects.toThrow(
        'Minutes before must be a non-negative integer'
      );
    });

    it('should throw validation error for minutesBefore exceeding 1 week', async () => {
      const { createReminder } = await import('../reminders.service');

      const oneWeekInMinutes = 60 * 24 * 7;
      const input: CreateReminderInput = {
        taskId: 'task-123',
        type: 'push',
        minutesBefore: oneWeekInMinutes + 1,
      };

      await expect(createReminder(input, 'user-123')).rejects.toThrow(
        `Minutes before cannot exceed ${oneWeekInMinutes}`
      );
    });
  });

  // ===========================================================================
  // getReminder Tests
  // ===========================================================================

  describe('getReminder', () => {
    it('should return reminder when found', async () => {
      const { getReminder } = await import('../reminders.service');

      const mockReminder = createMockReminder();
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));

      const result = await getReminder('reminder-1', 'user-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('reminder-1');
      expect(result?.userId).toBe('user-123');
      expect(result?.type).toBe('push');
    });

    it('should return null when reminder not found', async () => {
      const { getReminder } = await import('../reminders.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getReminder('non-existent', 'user-123');

      expect(result).toBeNull();
    });

    it('should throw validation error when userId does not match', async () => {
      const { getReminder } = await import('../reminders.service');

      const mockReminder = createMockReminder({ userId: 'other-user' });
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));

      await expect(getReminder('reminder-1', 'user-123')).rejects.toThrow(
        'Unauthorized access to reminder'
      );
    });

    it('should throw validation error for invalid reminderId', async () => {
      const { getReminder } = await import('../reminders.service');

      await expect(getReminder('', 'user-123')).rejects.toThrow(
        'reminderId is required and must be a non-empty string'
      );
    });

    it('should throw validation error for invalid userId', async () => {
      const { getReminder } = await import('../reminders.service');

      await expect(getReminder('reminder-1', '')).rejects.toThrow('userId is required');
    });
  });

  // ===========================================================================
  // getRemindersForTask Tests
  // ===========================================================================

  describe('getRemindersForTask', () => {
    it('should return reminders for a task', async () => {
      const { getRemindersForTask } = await import('../reminders.service');

      const mockReminder = createMockReminder({ taskId: 'task-123' });
      mockGetDocs.mockResolvedValue({
        docs: [createMockDocSnapshot(mockReminder)],
      });

      const result = await getRemindersForTask('task-123', 'user-123');

      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].taskId).toBe('task-123');
    });

    it('should return empty array when no reminders found', async () => {
      const { getRemindersForTask } = await import('../reminders.service');

      mockGetDocs.mockResolvedValue({ docs: [] });

      const result = await getRemindersForTask('task-123', 'user-123');

      expect(result).toEqual([]);
    });

    it('should throw validation error for empty taskId', async () => {
      const { getRemindersForTask } = await import('../reminders.service');

      await expect(getRemindersForTask('', 'user-123')).rejects.toThrow('Task ID is required');
    });
  });

  // ===========================================================================
  // getRemindersForEvent Tests
  // ===========================================================================

  describe('getRemindersForEvent', () => {
    it('should return reminders for an event', async () => {
      const { getRemindersForEvent } = await import('../reminders.service');

      const mockReminder = createMockReminder({ taskId: null, eventId: 'event-456' });
      mockGetDocs.mockResolvedValue({
        docs: [createMockDocSnapshot(mockReminder)],
      });

      const result = await getRemindersForEvent('event-456', 'user-123');

      expect(mockQuery).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].eventId).toBe('event-456');
    });

    it('should throw validation error for empty eventId', async () => {
      const { getRemindersForEvent } = await import('../reminders.service');

      await expect(getRemindersForEvent('', 'user-123')).rejects.toThrow('Event ID is required');
    });
  });

  // ===========================================================================
  // getPendingReminders Tests
  // ===========================================================================

  describe('getPendingReminders', () => {
    it('should return pending and snoozed reminders', async () => {
      const { getPendingReminders } = await import('../reminders.service');

      const pendingReminder = createMockReminder({ id: 'r1', status: 'pending' });
      const snoozedReminder = createMockReminder({ id: 'r2', status: 'snoozed' });
      mockGetDocs.mockResolvedValue({
        docs: [createMockDocSnapshot(pendingReminder), createMockDocSnapshot(snoozedReminder)],
      });

      const result = await getPendingReminders('user-123');

      expect(mockQuery).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no pending reminders', async () => {
      const { getPendingReminders } = await import('../reminders.service');

      mockGetDocs.mockResolvedValue({ docs: [] });

      const result = await getPendingReminders('user-123');

      expect(result).toEqual([]);
    });
  });

  // ===========================================================================
  // getUserReminders Tests
  // ===========================================================================

  describe('getUserReminders', () => {
    it('should return all reminders for a user', async () => {
      const { getUserReminders } = await import('../reminders.service');

      const mockReminders = [
        createMockReminder({ id: 'r1' }),
        createMockReminder({ id: 'r2' }),
        createMockReminder({ id: 'r3' }),
      ];
      mockGetDocs.mockResolvedValue({
        docs: mockReminders.map(createMockDocSnapshot),
      });

      const result = await getUserReminders('user-123');

      expect(mockQuery).toHaveBeenCalled();
      expect(mockOrderBy).toHaveBeenCalled();
      expect(result).toHaveLength(3);
    });

    it('should throw validation error for invalid userId', async () => {
      const { getUserReminders } = await import('../reminders.service');

      await expect(getUserReminders('')).rejects.toThrow('userId is required');
    });
  });

  // ===========================================================================
  // updateReminder Tests
  // ===========================================================================

  describe('updateReminder', () => {
    it('should update reminder and return updated version', async () => {
      const { updateReminder } = await import('../reminders.service');

      const mockReminder = createMockReminder();
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));
      mockUpdateDoc.mockResolvedValue(undefined);

      const input: UpdateReminderInput = {
        id: 'reminder-1',
        type: 'email',
        minutesBefore: 30,
      };

      const result = await updateReminder(input, 'user-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(result.type).toBe('email');
      expect(result.minutesBefore).toBe(30);
    });

    it('should update reminder status', async () => {
      const { updateReminder } = await import('../reminders.service');

      const mockReminder = createMockReminder();
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));
      mockUpdateDoc.mockResolvedValue(undefined);

      const input: UpdateReminderInput = {
        id: 'reminder-1',
        status: 'triggered',
      };

      const result = await updateReminder(input, 'user-123');

      expect(result.status).toBe('triggered');
    });

    it('should throw validation error when reminder not found', async () => {
      const { updateReminder } = await import('../reminders.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const input: UpdateReminderInput = {
        id: 'non-existent',
        type: 'email',
      };

      await expect(updateReminder(input, 'user-123')).rejects.toThrow('Reminder not found');
    });

    it('should throw validation error when userId does not match', async () => {
      const { updateReminder } = await import('../reminders.service');

      const mockReminder = createMockReminder({ userId: 'other-user' });
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));

      const input: UpdateReminderInput = {
        id: 'reminder-1',
        type: 'email',
      };

      await expect(updateReminder(input, 'user-123')).rejects.toThrow(
        'Unauthorized access to reminder'
      );
    });

    it('should throw validation error for invalid status', async () => {
      const { updateReminder } = await import('../reminders.service');

      const input = {
        id: 'reminder-1',
        status: 'invalid' as 'pending',
      };

      await expect(updateReminder(input, 'user-123')).rejects.toThrow(
        'Reminder status must be pending, triggered, dismissed, or snoozed'
      );
    });
  });

  // ===========================================================================
  // deleteReminder Tests
  // ===========================================================================

  describe('deleteReminder', () => {
    it('should delete reminder successfully', async () => {
      const { deleteReminder } = await import('../reminders.service');

      const mockReminder = createMockReminder();
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));
      mockDeleteDoc.mockResolvedValue(undefined);

      await deleteReminder('reminder-1', 'user-123');

      expect(mockDeleteDoc).toHaveBeenCalled();
    });

    it('should throw validation error when reminder not found', async () => {
      const { deleteReminder } = await import('../reminders.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(deleteReminder('non-existent', 'user-123')).rejects.toThrow(
        'Reminder not found'
      );
    });

    it('should throw validation error when userId does not match', async () => {
      const { deleteReminder } = await import('../reminders.service');

      const mockReminder = createMockReminder({ userId: 'other-user' });
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));

      await expect(deleteReminder('reminder-1', 'user-123')).rejects.toThrow(
        'Unauthorized access to reminder'
      );
    });

    it('should throw validation error for invalid reminderId', async () => {
      const { deleteReminder } = await import('../reminders.service');

      await expect(deleteReminder('', 'user-123')).rejects.toThrow(
        'reminderId is required and must be a non-empty string'
      );
    });
  });

  // ===========================================================================
  // snoozeReminder Tests
  // ===========================================================================

  describe('snoozeReminder', () => {
    it('should snooze reminder for 5 minutes', async () => {
      const { snoozeReminder } = await import('../reminders.service');

      const mockReminder = createMockReminder();
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await snoozeReminder('reminder-1', 5 as SnoozeOption, 'user-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(result.status).toBe('snoozed');
      expect(result.snoozeCount).toBe(1);
      expect(result.snoozedUntil).toBeInstanceOf(Date);
    });

    it('should snooze reminder for 15 minutes', async () => {
      const { snoozeReminder } = await import('../reminders.service');

      const mockReminder = createMockReminder();
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await snoozeReminder('reminder-1', 15 as SnoozeOption, 'user-123');

      expect(result.status).toBe('snoozed');
      expect(result.snoozeCount).toBe(1);
    });

    it('should snooze reminder for 30 minutes', async () => {
      const { snoozeReminder } = await import('../reminders.service');

      const mockReminder = createMockReminder();
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await snoozeReminder('reminder-1', 30 as SnoozeOption, 'user-123');

      expect(result.status).toBe('snoozed');
    });

    it('should snooze reminder for 60 minutes', async () => {
      const { snoozeReminder } = await import('../reminders.service');

      const mockReminder = createMockReminder();
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await snoozeReminder('reminder-1', 60 as SnoozeOption, 'user-123');

      expect(result.status).toBe('snoozed');
    });

    it('should increment snooze count on subsequent snoozes', async () => {
      const { snoozeReminder } = await import('../reminders.service');

      const mockReminder = createMockReminder({ snoozeCount: 2 });
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await snoozeReminder('reminder-1', 5 as SnoozeOption, 'user-123');

      expect(result.snoozeCount).toBe(3);
    });

    it('should throw validation error for invalid snooze option', async () => {
      const { snoozeReminder } = await import('../reminders.service');

      await expect(
        snoozeReminder('reminder-1', 10 as SnoozeOption, 'user-123')
      ).rejects.toThrow('Snooze minutes must be 5, 15, 30, or 60');
    });

    it('should throw validation error when reminder not found', async () => {
      const { snoozeReminder } = await import('../reminders.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(
        snoozeReminder('non-existent', 5 as SnoozeOption, 'user-123')
      ).rejects.toThrow('Reminder not found');
    });

    it('should throw validation error when userId does not match', async () => {
      const { snoozeReminder } = await import('../reminders.service');

      const mockReminder = createMockReminder({ userId: 'other-user' });
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));

      await expect(
        snoozeReminder('reminder-1', 5 as SnoozeOption, 'user-123')
      ).rejects.toThrow('Unauthorized access to reminder');
    });
  });

  // ===========================================================================
  // dismissReminder Tests
  // ===========================================================================

  describe('dismissReminder', () => {
    it('should dismiss reminder successfully', async () => {
      const { dismissReminder } = await import('../reminders.service');

      const mockReminder = createMockReminder();
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await dismissReminder('reminder-1', 'user-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(result.status).toBe('dismissed');
      expect(result.dismissedAt).toBeInstanceOf(Date);
    });

    it('should throw validation error when reminder not found', async () => {
      const { dismissReminder } = await import('../reminders.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(dismissReminder('non-existent', 'user-123')).rejects.toThrow(
        'Reminder not found'
      );
    });

    it('should throw validation error when userId does not match', async () => {
      const { dismissReminder } = await import('../reminders.service');

      const mockReminder = createMockReminder({ userId: 'other-user' });
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));

      await expect(dismissReminder('reminder-1', 'user-123')).rejects.toThrow(
        'Unauthorized access to reminder'
      );
    });
  });

  // ===========================================================================
  // markReminderTriggered Tests
  // ===========================================================================

  describe('markReminderTriggered', () => {
    it('should mark reminder as triggered', async () => {
      const { markReminderTriggered } = await import('../reminders.service');

      const mockReminder = createMockReminder();
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await markReminderTriggered('reminder-1', 'user-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(result.status).toBe('triggered');
      expect(result.triggeredAt).toBeInstanceOf(Date);
    });

    it('should throw validation error when reminder not found', async () => {
      const { markReminderTriggered } = await import('../reminders.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(markReminderTriggered('non-existent', 'user-123')).rejects.toThrow(
        'Reminder not found'
      );
    });

    it('should throw validation error when userId does not match', async () => {
      const { markReminderTriggered } = await import('../reminders.service');

      const mockReminder = createMockReminder({ userId: 'other-user' });
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));

      await expect(markReminderTriggered('reminder-1', 'user-123')).rejects.toThrow(
        'Unauthorized access to reminder'
      );
    });
  });

  // ===========================================================================
  // getRemindersForItem Tests
  // ===========================================================================

  describe('getRemindersForItem', () => {
    it('should call getRemindersForTask when itemType is task', async () => {
      const { getRemindersForItem } = await import('../reminders.service');

      const mockReminder = createMockReminder({ taskId: 'task-123' });
      mockGetDocs.mockResolvedValue({
        docs: [createMockDocSnapshot(mockReminder)],
      });

      const result = await getRemindersForItem('task-123', 'task', 'user-123');

      expect(result).toHaveLength(1);
      expect(result[0].taskId).toBe('task-123');
    });

    it('should call getRemindersForEvent when itemType is event', async () => {
      const { getRemindersForItem } = await import('../reminders.service');

      const mockReminder = createMockReminder({ taskId: null, eventId: 'event-456' });
      mockGetDocs.mockResolvedValue({
        docs: [createMockDocSnapshot(mockReminder)],
      });

      const result = await getRemindersForItem('event-456', 'event', 'user-123');

      expect(result).toHaveLength(1);
      expect(result[0].eventId).toBe('event-456');
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('Error Handling', () => {
    it('should handle Firestore errors on create', async () => {
      const { createReminder } = await import('../reminders.service');

      mockAddDoc.mockRejectedValue(new Error('Firestore error'));

      const input: CreateReminderInput = {
        taskId: 'task-123',
        type: 'push',
        minutesBefore: 15,
      };

      await expect(createReminder(input, 'user-123')).rejects.toThrow(
        'Failed to create reminder: Firestore error'
      );
    });

    it('should handle Firestore errors on get', async () => {
      const { getReminder } = await import('../reminders.service');

      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(getReminder('reminder-1', 'user-123')).rejects.toThrow(
        'Failed to fetch reminder: Firestore error'
      );
    });

    it('should handle Firestore errors on update', async () => {
      const { updateReminder } = await import('../reminders.service');

      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      const input: UpdateReminderInput = {
        id: 'reminder-1',
        type: 'email',
      };

      await expect(updateReminder(input, 'user-123')).rejects.toThrow(
        'Failed to update reminder: Firestore error'
      );
    });

    it('should handle Firestore errors on delete', async () => {
      const { deleteReminder } = await import('../reminders.service');

      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(deleteReminder('reminder-1', 'user-123')).rejects.toThrow(
        'Failed to delete reminder: Firestore error'
      );
    });

    it('should handle userId exceeding max length', async () => {
      const { getReminder } = await import('../reminders.service');

      const longUserId = 'a'.repeat(200);

      await expect(getReminder('reminder-1', longUserId)).rejects.toThrow(
        'userId is invalid'
      );
    });

    it('should handle reminderId exceeding max length', async () => {
      const { getReminder } = await import('../reminders.service');

      const longReminderId = 'a'.repeat(2000);

      await expect(getReminder(longReminderId, 'user-123')).rejects.toThrow(
        'reminderId exceeds maximum length'
      );
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle minutesBefore of 0', async () => {
      const { createReminder } = await import('../reminders.service');

      mockAddDoc.mockResolvedValue({ id: 'new-reminder-id' });

      const input: CreateReminderInput = {
        taskId: 'task-123',
        type: 'push',
        minutesBefore: 0,
      };

      const result = await createReminder(input, 'user-123');

      expect(result.minutesBefore).toBe(0);
    });

    it('should handle maximum valid minutesBefore (1 week)', async () => {
      const { createReminder } = await import('../reminders.service');

      mockAddDoc.mockResolvedValue({ id: 'new-reminder-id' });
      const oneWeekInMinutes = 60 * 24 * 7;

      const input: CreateReminderInput = {
        taskId: 'task-123',
        type: 'push',
        minutesBefore: oneWeekInMinutes,
      };

      const result = await createReminder(input, 'user-123');

      expect(result.minutesBefore).toBe(oneWeekInMinutes);
    });

    it('should preserve timestamps as Date objects', async () => {
      const { getReminder } = await import('../reminders.service');

      const scheduledTime = new Date('2026-02-01T10:00:00');
      const mockReminder = createMockReminder({ scheduledTime });
      mockGetDoc.mockResolvedValue(createMockDocSnapshot(mockReminder));

      const result = await getReminder('reminder-1', 'user-123');

      expect(result?.scheduledTime).toBeInstanceOf(Date);
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });
  });
});
