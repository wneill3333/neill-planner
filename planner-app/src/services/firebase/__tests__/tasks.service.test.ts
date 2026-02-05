import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../../types';

// Mock Firestore
const mockAddDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockWriteBatch = vi.fn();
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
  writeBatch: () => mockWriteBatch(),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000 }),
  },
}));

vi.mock('../config', () => ({
  db: { name: 'mock-db' },
}));

describe('Tasks Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('tasks-collection');
    mockDoc.mockReturnValue('task-doc-ref');
    mockQuery.mockReturnValue('query-ref');
    mockWhere.mockReturnValue('where-clause');
    mockOrderBy.mockReturnValue('order-clause');
  });

  describe('createTask', () => {
    it('should create a task with auto-generated fields', async () => {
      const { createTask } = await import('../tasks.service');

      mockAddDoc.mockResolvedValue({ id: 'new-task-id' });

      const input: CreateTaskInput = {
        title: 'Test Task',
        priority: { letter: 'A', number: 1 },
        status: 'in_progress',
        scheduledDate: new Date('2026-01-25'),
      };

      const result = await createTask(input, 'user-123');

      expect(mockAddDoc).toHaveBeenCalled();
      expect(result.id).toBe('new-task-id');
      expect(result.userId).toBe('user-123');
      expect(result.title).toBe('Test Task');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.deletedAt).toBeNull();
    });

    it('should set default values for optional fields', async () => {
      const { createTask } = await import('../tasks.service');

      mockAddDoc.mockResolvedValue({ id: 'new-task-id' });

      const input: CreateTaskInput = {
        title: 'Minimal Task',
        priority: { letter: 'B', number: 1 },
        status: 'in_progress',
        scheduledDate: new Date(),
      };

      const result = await createTask(input, 'user-123');

      expect(result.description).toBe('');
      expect(result.categoryId).toBeNull();
      expect(result.recurrence).toBeNull();
      expect(result.linkedNoteIds).toEqual([]);
      expect(result.linkedEventId).toBeNull();
      expect(result.isRecurringInstance).toBe(false);
    });
  });

  describe('getTask', () => {
    it('should return task when found', async () => {
      const { getTask } = await import('../tasks.service');

      const mockTask = {
        userId: 'user-123',
        title: 'Found Task',
        description: 'Test description',
        categoryId: null,
        priority: { letter: 'A', number: 1 },
        status: 'in_progress',
        scheduledDate: { toDate: () => new Date('2026-01-25') },
        scheduledTime: null,
        recurrence: null,
        linkedNoteIds: [],
        linkedEventId: null,
        isRecurringInstance: false,
        recurringParentId: null,
        instanceDate: null,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        deletedAt: null,
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'task-123',
        data: () => mockTask,
      });

      const result = await getTask('task-123', 'user-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('task-123');
      expect(result?.title).toBe('Found Task');
    });

    it('should return null when task not found', async () => {
      const { getTask } = await import('../tasks.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getTask('non-existent', 'user-123');

      expect(result).toBeNull();
    });
  });

  describe('getTasksByDate', () => {
    it('should query tasks for specific date', async () => {
      const { getTasksByDate } = await import('../tasks.service');

      const mockTasks = [
        {
          id: 'task-1',
          data: () => ({
            userId: 'user-123',
            title: 'Task 1',
            description: '',
            categoryId: null,
            priority: { letter: 'A', number: 1 },
            status: 'in_progress',
            scheduledDate: { toDate: () => new Date('2026-01-25') },
            scheduledTime: null,
            recurrence: null,
            linkedNoteIds: [],
            linkedEventId: null,
            isRecurringInstance: false,
            recurringParentId: null,
            instanceDate: null,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            deletedAt: null,
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockTasks });

      const result = await getTasksByDate('user-123', new Date('2026-01-25'));

      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Task 1');
    });

    it('should return empty array when no tasks found', async () => {
      const { getTasksByDate } = await import('../tasks.service');

      mockGetDocs.mockResolvedValue({ docs: [] });

      const result = await getTasksByDate('user-123', new Date('2026-01-25'));

      expect(result).toEqual([]);
    });
  });

  describe('getTasksByDateRange', () => {
    it('should query tasks within date range', async () => {
      const { getTasksByDateRange } = await import('../tasks.service');

      mockGetDocs.mockResolvedValue({ docs: [] });

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      await getTasksByDateRange('user-123', startDate, endDate);

      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('updateTask', () => {
    it('should update task and return updated version', async () => {
      const { updateTask } = await import('../tasks.service');

      const updatedTask: Task = {
        id: 'task-123',
        userId: 'user-123',
        title: 'Updated Task',
        description: '',
        categoryId: null,
        priority: { letter: 'A', number: 1 },
        status: 'complete',
        scheduledDate: new Date('2026-01-25'),
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

      mockUpdateDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'task-123',
        data: () => ({
          ...updatedTask,
          scheduledDate: { toDate: () => updatedTask.scheduledDate },
          createdAt: { toDate: () => updatedTask.createdAt },
          updatedAt: { toDate: () => updatedTask.updatedAt },
        }),
      });

      const input: UpdateTaskInput = {
        id: 'task-123',
        title: 'Updated Task',
        status: 'complete',
      };

      const result = await updateTask(input, 'user-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(result.title).toBe('Updated Task');
      expect(result.status).toBe('complete');
    });
  });

  describe('softDeleteTask', () => {
    it('should set deletedAt timestamp', async () => {
      const { softDeleteTask } = await import('../tasks.service');

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'task-123',
        data: () => ({
          userId: 'user-123',
          title: 'Task to Delete',
          description: '',
          categoryId: null,
          priority: { letter: 'A', number: 1 },
          status: 'in_progress',
          scheduledDate: { toDate: () => new Date() },
          scheduledTime: null,
          recurrence: null,
          linkedNoteIds: [],
          linkedEventId: null,
          isRecurringInstance: false,
          recurringParentId: null,
          instanceDate: null,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          deletedAt: null,
        }),
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      await softDeleteTask('task-123', 'user-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls[0];
      expect(updateCall[1]).toHaveProperty('deletedAt');
      expect(updateCall[1]).toHaveProperty('updatedAt');
    });
  });

  describe('hardDeleteTask', () => {
    it('should permanently delete the task', async () => {
      const { hardDeleteTask } = await import('../tasks.service');

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'task-123',
        data: () => ({
          userId: 'user-123',
          title: 'Task to Delete',
          description: '',
          categoryId: null,
          priority: { letter: 'A', number: 1 },
          status: 'in_progress',
          scheduledDate: { toDate: () => new Date() },
          scheduledTime: null,
          recurrence: null,
          linkedNoteIds: [],
          linkedEventId: null,
          isRecurringInstance: false,
          recurringParentId: null,
          instanceDate: null,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          deletedAt: null,
        }),
      });
      mockDeleteDoc.mockResolvedValue(undefined);

      await hardDeleteTask('task-123', 'user-123');

      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });

  describe('restoreTask', () => {
    it('should clear deletedAt and return restored task', async () => {
      const { restoreTask } = await import('../tasks.service');

      mockUpdateDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'task-123',
        data: () => ({
          userId: 'user-123',
          title: 'Restored Task',
          description: '',
          categoryId: null,
          priority: { letter: 'A', number: 1 },
          status: 'in_progress',
          scheduledDate: { toDate: () => new Date() },
          scheduledTime: null,
          recurrence: null,
          linkedNoteIds: [],
          linkedEventId: null,
          isRecurringInstance: false,
          recurringParentId: null,
          instanceDate: null,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          deletedAt: null,
        }),
      });

      const result = await restoreTask('task-123', 'user-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls[0];
      expect(updateCall[1].deletedAt).toBeNull();
      expect(result.deletedAt).toBeNull();
    });
  });

  describe('batchUpdateTasks', () => {
    it('should batch update multiple tasks', async () => {
      const { batchUpdateTasks } = await import('../tasks.service');

      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      mockWriteBatch.mockReturnValue(mockBatch);

      // Mock getDoc for ownership verification
      mockGetDoc.mockImplementation(() => Promise.resolve({
        exists: () => true,
        id: 'task-id',
        data: () => ({
          userId: 'user-123',
          title: 'Task',
          description: '',
          categoryId: null,
          priority: { letter: 'A', number: 1 },
          status: 'in_progress',
          scheduledDate: { toDate: () => new Date() },
          scheduledTime: null,
          recurrence: null,
          linkedNoteIds: [],
          linkedEventId: null,
          isRecurringInstance: false,
          recurringParentId: null,
          instanceDate: null,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          deletedAt: null,
        }),
      }));

      const updates: UpdateTaskInput[] = [
        { id: 'task-1', priority: { letter: 'A', number: 1 } },
        { id: 'task-2', priority: { letter: 'A', number: 2 } },
        { id: 'task-3', priority: { letter: 'A', number: 3 } },
      ];

      await batchUpdateTasks(updates, 'user-123');

      expect(mockBatch.update).toHaveBeenCalledTimes(3);
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });
});
