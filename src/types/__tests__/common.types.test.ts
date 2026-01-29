import { describe, it, expect } from 'vitest';
import {
  SYNC_STATUS_INFO,
  createTaskId,
  createEventId,
  createNoteId,
  createCategoryId,
  createUserId,
} from '../common.types';
import type {
  SyncStatus,
  SyncQueueItem,
  DateRange,
  TimeString,
  ISODateString,
  ApiResponse,
  PaginatedResponse,
  SortDirection,
  SortOption,
  TaskSortField,
  EventSortField,
  NoteSortField,
  LoadingState,
  ModalState,
  ToastType,
  Toast,
  ConflictChoice,
  ConflictResolution,
  ValidationError,
  ValidationResult,
  TaskId,
  EventId,
  NoteId,
  CategoryId,
  UserId,
} from '../common.types';

describe('Common Types', () => {
  // ===========================================================================
  // Sync Types Tests
  // ===========================================================================
  describe('SyncStatus', () => {
    it('should accept all valid sync statuses', () => {
      const statuses: SyncStatus[] = ['synced', 'syncing', 'pending', 'offline', 'error'];
      expect(statuses).toHaveLength(5);
    });

    it('should have info for all statuses', () => {
      const statuses: SyncStatus[] = ['synced', 'syncing', 'pending', 'offline', 'error'];
      statuses.forEach(status => {
        expect(SYNC_STATUS_INFO[status]).toBeDefined();
        expect(SYNC_STATUS_INFO[status].icon).toBeDefined();
        expect(SYNC_STATUS_INFO[status].label).toBeDefined();
        expect(SYNC_STATUS_INFO[status].color).toBeDefined();
      });
    });

    it('should have correct sync status info', () => {
      expect(SYNC_STATUS_INFO.synced).toEqual({ icon: '✓', label: 'Synced', color: '#22C55E' });
      expect(SYNC_STATUS_INFO.syncing).toEqual({ icon: '↻', label: 'Syncing', color: '#3B82F6' });
      expect(SYNC_STATUS_INFO.pending).toEqual({ icon: '●', label: 'Pending', color: '#EAB308' });
      expect(SYNC_STATUS_INFO.offline).toEqual({ icon: '○', label: 'Offline', color: '#9CA3AF' });
      expect(SYNC_STATUS_INFO.error).toEqual({ icon: '⚠', label: 'Error', color: '#EF4444' });
    });
  });

  describe('SyncQueueItem', () => {
    it('should create valid sync queue item', () => {
      const item: SyncQueueItem = {
        id: 'sync-123',
        operation: 'create',
        collection: 'tasks',
        documentId: 'task-456',
        data: { title: 'New Task' },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };
      expect(item.operation).toBe('create');
      expect(item.collection).toBe('tasks');
      expect(item.status).toBe('pending');
    });

    it('should support all operations', () => {
      const operations: Array<'create' | 'update' | 'delete'> = ['create', 'update', 'delete'];
      operations.forEach(op => {
        const item: SyncQueueItem = {
          id: 'sync-123',
          operation: op,
          collection: 'tasks',
          documentId: 'task-456',
          data: {},
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending',
        };
        expect(item.operation).toBe(op);
      });
    });

    it('should support all collections', () => {
      const collections: Array<'tasks' | 'events' | 'notes' | 'categories'> = [
        'tasks',
        'events',
        'notes',
        'categories',
      ];
      collections.forEach(collection => {
        const item: SyncQueueItem = {
          id: 'sync-123',
          operation: 'create',
          collection,
          documentId: 'doc-456',
          data: {},
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending',
        };
        expect(item.collection).toBe(collection);
      });
    });

    it('should track retry count', () => {
      const item: SyncQueueItem = {
        id: 'sync-123',
        operation: 'update',
        collection: 'tasks',
        documentId: 'task-456',
        data: {},
        timestamp: Date.now(),
        retryCount: 3,
        status: 'failed',
      };
      expect(item.retryCount).toBe(3);
      expect(item.status).toBe('failed');
    });
  });

  // ===========================================================================
  // Date/Time Types Tests
  // ===========================================================================
  describe('DateRange', () => {
    it('should create valid date range', () => {
      const range: DateRange = {
        start: new Date('2026-01-01'),
        end: new Date('2026-01-31'),
      };
      expect(range.start).toBeInstanceOf(Date);
      expect(range.end).toBeInstanceOf(Date);
    });
  });

  describe('TimeString', () => {
    it('should accept HH:MM format', () => {
      const time: TimeString = '14:30';
      expect(time).toBe('14:30');
    });
  });

  describe('ISODateString', () => {
    it('should accept ISO date format', () => {
      const date: ISODateString = '2026-01-25';
      expect(date).toBe('2026-01-25');
    });
  });

  // ===========================================================================
  // API Response Types Tests
  // ===========================================================================
  describe('ApiResponse', () => {
    it('should create successful response', () => {
      const response: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: 'task-123' },
      };
      expect(response.success).toBe(true);
      expect(response.data?.id).toBe('task-123');
    });

    it('should create error response', () => {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      };
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('PaginatedResponse', () => {
    it('should create paginated response', () => {
      const response: PaginatedResponse<{ id: string }> = {
        items: [{ id: '1' }, { id: '2' }],
        total: 100,
        page: 1,
        pageSize: 10,
        hasMore: true,
      };
      expect(response.items).toHaveLength(2);
      expect(response.total).toBe(100);
      expect(response.hasMore).toBe(true);
    });
  });

  // ===========================================================================
  // Filter & Sort Types Tests
  // ===========================================================================
  describe('SortOption', () => {
    it('should create task sort option', () => {
      const sort: SortOption<TaskSortField> = {
        field: 'priority',
        direction: 'asc',
      };
      expect(sort.field).toBe('priority');
      expect(sort.direction).toBe('asc');
    });

    it('should create event sort option', () => {
      const sort: SortOption<EventSortField> = {
        field: 'startTime',
        direction: 'desc',
      };
      expect(sort.field).toBe('startTime');
    });

    it('should create note sort option', () => {
      const sort: SortOption<NoteSortField> = {
        field: 'date',
        direction: 'asc',
      };
      expect(sort.field).toBe('date');
    });
  });

  describe('SortDirection', () => {
    it('should accept valid directions', () => {
      const directions: SortDirection[] = ['asc', 'desc'];
      expect(directions).toHaveLength(2);
    });
  });

  // ===========================================================================
  // UI State Types Tests
  // ===========================================================================
  describe('LoadingState', () => {
    it('should accept all loading states', () => {
      const states: LoadingState[] = ['idle', 'loading', 'succeeded', 'failed'];
      expect(states).toHaveLength(4);
    });
  });

  describe('ModalState', () => {
    it('should create closed modal state', () => {
      const modal: ModalState = {
        isOpen: false,
        type: null,
      };
      expect(modal.isOpen).toBe(false);
    });

    it('should create open modal state with data', () => {
      const modal: ModalState = {
        isOpen: true,
        type: 'editTask',
        data: { taskId: 'task-123' },
      };
      expect(modal.isOpen).toBe(true);
      expect(modal.type).toBe('editTask');
    });
  });

  describe('Toast', () => {
    it('should create toast notification', () => {
      const toast: Toast = {
        id: 'toast-123',
        type: 'success',
        message: 'Task saved successfully',
        duration: 3000,
      };
      expect(toast.type).toBe('success');
      expect(toast.message).toBe('Task saved successfully');
    });

    it('should accept all toast types', () => {
      const types: ToastType[] = ['success', 'error', 'warning', 'info'];
      expect(types).toHaveLength(4);
    });
  });

  // ===========================================================================
  // Conflict Resolution Types Tests
  // ===========================================================================
  describe('ConflictResolution', () => {
    it('should create conflict resolution record', () => {
      const resolution: ConflictResolution = {
        localVersion: { title: 'Local Title' },
        serverVersion: { title: 'Server Title' },
        userChoice: 'local',
        timestamp: Date.now(),
      };
      expect(resolution.userChoice).toBe('local');
    });

    it('should support merge with merged version', () => {
      const resolution: ConflictResolution = {
        localVersion: { title: 'Local' },
        serverVersion: { title: 'Server' },
        userChoice: 'merge',
        mergedVersion: { title: 'Merged Title' },
        timestamp: Date.now(),
      };
      expect(resolution.userChoice).toBe('merge');
      expect(resolution.mergedVersion).toBeDefined();
    });

    it('should accept all conflict choices', () => {
      const choices: ConflictChoice[] = ['local', 'server', 'merge'];
      expect(choices).toHaveLength(3);
    });
  });

  // ===========================================================================
  // Validation Types Tests
  // ===========================================================================
  describe('ValidationResult', () => {
    it('should create valid result', () => {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
      };
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should create invalid result with errors', () => {
      const errors: ValidationError[] = [
        { field: 'title', message: 'Title is required' },
        { field: 'startTime', message: 'Start time must be before end time' },
      ];
      const result: ValidationResult = {
        isValid: false,
        errors,
      };
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  // ===========================================================================
  // Branded ID Types Tests
  // ===========================================================================
  describe('Branded ID Types', () => {
    it('should create TaskId', () => {
      const taskId: TaskId = createTaskId('task-123');
      expect(taskId).toBe('task-123');
    });

    it('should create EventId', () => {
      const eventId: EventId = createEventId('event-456');
      expect(eventId).toBe('event-456');
    });

    it('should create NoteId', () => {
      const noteId: NoteId = createNoteId('note-789');
      expect(noteId).toBe('note-789');
    });

    it('should create CategoryId', () => {
      const categoryId: CategoryId = createCategoryId('category-101');
      expect(categoryId).toBe('category-101');
    });

    it('should create UserId', () => {
      const userId: UserId = createUserId('user-202');
      expect(userId).toBe('user-202');
    });
  });
});
