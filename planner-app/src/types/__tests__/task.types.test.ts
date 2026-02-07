import { describe, it, expect } from 'vitest';
import {
  TaskStatusSymbols,
  TaskStatusLabels,
  DEFAULT_TASK_VALUES,
  PRIORITY_LETTERS,
} from '../task.types';
import { PRIORITY_COLORS } from '../../utils/taskUtils';
import type {
  PriorityLetter,
  TaskPriority,
  TaskStatus,
  RecurrenceType,
  RecurrenceEndType,
  RecurrenceEndCondition,
  RecurrencePattern,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TasksByPriority,
} from '../task.types';

describe('Task Types', () => {
  // ===========================================================================
  // Priority Types Tests
  // ===========================================================================
  describe('PriorityLetter', () => {
    it('should accept valid priority letters', () => {
      const validLetters: PriorityLetter[] = ['A', 'B', 'C', 'D'];
      validLetters.forEach(letter => {
        const priority: TaskPriority = { letter, number: 1 };
        expect(priority.letter).toBe(letter);
      });
    });

    it('should have correct priority colors defined', () => {
      expect(PRIORITY_COLORS.A).toBe('#EF4444'); // Red
      expect(PRIORITY_COLORS.B).toBe('#F97316'); // Orange
      expect(PRIORITY_COLORS.C).toBe('#EAB308'); // Yellow
      expect(PRIORITY_COLORS.D).toBe('#6B7280'); // Gray
    });

    it('should have PRIORITY_LETTERS constant defined', () => {
      expect(PRIORITY_LETTERS).toEqual(['A', 'B', 'C', 'D']);
    });
  });

  describe('TaskPriority', () => {
    it('should create valid task priority with letter and number', () => {
      const priority: TaskPriority = { letter: 'A', number: 1 };
      expect(priority.letter).toBe('A');
      expect(priority.number).toBe(1);
    });

    it('should allow any positive number for priority number', () => {
      const priorities: TaskPriority[] = [
        { letter: 'A', number: 1 },
        { letter: 'A', number: 10 },
        { letter: 'B', number: 99 },
      ];
      priorities.forEach(p => {
        expect(p.number).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================================================
  // Status Types Tests
  // ===========================================================================
  describe('TaskStatus', () => {
    it('should have all status symbols defined', () => {
      expect(TaskStatusSymbols.in_progress).toBe('●');
      expect(TaskStatusSymbols.forward).toBe('➜');
      expect(TaskStatusSymbols.complete).toBe('✔');
      expect(TaskStatusSymbols.cancelled).toBe('✘');
      expect(TaskStatusSymbols.delegate).toBe('◯');
    });

    it('should have all status labels defined', () => {
      expect(TaskStatusLabels.in_progress).toBe('In Progress');
      expect(TaskStatusLabels.forward).toBe('Forward');
      expect(TaskStatusLabels.complete).toBe('Complete');
      expect(TaskStatusLabels.cancelled).toBe('Cancelled');
      expect(TaskStatusLabels.delegate).toBe('Delegate');
    });

    it('should have matching keys between symbols and labels', () => {
      const symbolKeys = Object.keys(TaskStatusSymbols);
      const labelKeys = Object.keys(TaskStatusLabels);
      expect(symbolKeys).toEqual(labelKeys);
    });
  });

  // ===========================================================================
  // Recurrence Types Tests
  // ===========================================================================
  describe('RecurrencePattern', () => {
    it('should create valid daily recurrence pattern', () => {
      const pattern: RecurrencePattern = {
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
      };
      expect(pattern.type).toBe('daily');
      expect(pattern.interval).toBe(1);
    });

    it('should create valid weekly recurrence pattern', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: {
          type: 'never',
          endDate: null,
          maxOccurrences: null,
        },
        exceptions: [],
      };
      expect(pattern.type).toBe('weekly');
      expect(pattern.daysOfWeek).toEqual([1, 3, 5]);
    });

    it('should create valid monthly recurrence pattern', () => {
      const pattern: RecurrencePattern = {
        type: 'monthly',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: 15,
        monthOfYear: null,
        endCondition: {
          type: 'never',
          endDate: null,
          maxOccurrences: null,
        },
        exceptions: [],
      };
      expect(pattern.type).toBe('monthly');
      expect(pattern.dayOfMonth).toBe(15);
    });

    it('should create valid yearly recurrence pattern', () => {
      const pattern: RecurrencePattern = {
        type: 'yearly',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: 25,
        monthOfYear: 12,
        endCondition: {
          type: 'never',
          endDate: null,
          maxOccurrences: null,
        },
        exceptions: [],
      };
      expect(pattern.type).toBe('yearly');
      expect(pattern.dayOfMonth).toBe(25);
      expect(pattern.monthOfYear).toBe(12);
    });

    it('should support end condition with specific date', () => {
      const endDate = new Date('2026-12-31');
      const endCondition: RecurrenceEndCondition = {
        type: 'date',
        endDate,
        maxOccurrences: null,
      };
      expect(endCondition.type).toBe('date');
      expect(endCondition.endDate).toEqual(endDate);
    });

    it('should support end condition with max occurrences', () => {
      const endCondition: RecurrenceEndCondition = {
        type: 'occurrences',
        endDate: null,
        maxOccurrences: 10,
      };
      expect(endCondition.type).toBe('occurrences');
      expect(endCondition.maxOccurrences).toBe(10);
    });

    it('should support exceptions array', () => {
      const exceptions = [new Date('2026-01-01'), new Date('2026-07-04')];
      const pattern: RecurrencePattern = {
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
        exceptions,
      };
      expect(pattern.exceptions).toHaveLength(2);
    });
  });

  // ===========================================================================
  // Task Interface Tests
  // ===========================================================================
  describe('Task', () => {
    const createValidTask = (): Task => ({
      id: 'task-123',
      userId: 'user-456',
      title: 'Complete quarterly report',
      description: 'Finish and submit the Q1 report',
      categoryId: 'category-789',
      priority: { letter: 'A', number: 1 },
      status: 'in_progress',
      scheduledDate: new Date('2026-01-25'),
      scheduledTime: '09:00',
      recurrence: null,
      linkedNoteIds: ['note-1', 'note-2'],
      linkedEventId: 'event-123',
      isRecurringInstance: false,
      recurringParentId: null,
      instanceDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    it('should create a valid task with all required fields', () => {
      const task = createValidTask();
      expect(task.id).toBe('task-123');
      expect(task.userId).toBe('user-456');
      expect(task.title).toBe('Complete quarterly report');
      expect(task.priority.letter).toBe('A');
      expect(task.priority.number).toBe(1);
      expect(task.status).toBe('in_progress');
    });

    it('should allow null for optional fields', () => {
      const task: Task = {
        ...createValidTask(),
        categoryId: null,
        scheduledDate: null,
        scheduledTime: null,
        recurrence: null,
        linkedEventId: null,
        recurringParentId: null,
        instanceDate: null,
        deletedAt: null,
      };
      expect(task.categoryId).toBeNull();
      expect(task.scheduledDate).toBeNull();
      expect(task.recurrence).toBeNull();
    });

    it('should support recurring instance fields', () => {
      const task: Task = {
        ...createValidTask(),
        isRecurringInstance: true,
        recurringParentId: 'parent-task-123',
        instanceDate: new Date('2026-01-25'),
      };
      expect(task.isRecurringInstance).toBe(true);
      expect(task.recurringParentId).toBe('parent-task-123');
      expect(task.instanceDate).toEqual(new Date('2026-01-25'));
    });

    it('should support soft delete with deletedAt timestamp', () => {
      const deletedAt = new Date();
      const task: Task = {
        ...createValidTask(),
        deletedAt,
      };
      expect(task.deletedAt).toEqual(deletedAt);
    });

    it('should allow empty linkedNoteIds array', () => {
      const task: Task = {
        ...createValidTask(),
        linkedNoteIds: [],
      };
      expect(task.linkedNoteIds).toEqual([]);
    });
  });

  // ===========================================================================
  // Input Types Tests
  // ===========================================================================
  describe('CreateTaskInput', () => {
    it('should require only title and priority letter', () => {
      const input: CreateTaskInput = {
        title: 'New Task',
        priority: { letter: 'B' },
      };
      expect(input.title).toBe('New Task');
      expect(input.priority.letter).toBe('B');
    });

    it('should allow optional fields', () => {
      const input: CreateTaskInput = {
        title: 'New Task',
        priority: { letter: 'A', number: 5 },
        description: 'Task description',
        categoryId: 'cat-123',
        status: 'in_progress',
        scheduledDate: new Date('2026-01-25'),
        scheduledTime: '14:30',
        linkedNoteIds: ['note-1'],
      };
      expect(input.description).toBe('Task description');
      expect(input.priority.number).toBe(5);
    });
  });

  describe('UpdateTaskInput', () => {
    it('should require only id', () => {
      const input: UpdateTaskInput = {
        id: 'task-123',
      };
      expect(input.id).toBe('task-123');
    });

    it('should allow partial priority update', () => {
      const input: UpdateTaskInput = {
        id: 'task-123',
        priority: { letter: 'B' },
      };
      expect(input.priority?.letter).toBe('B');
      expect(input.priority?.number).toBeUndefined();
    });

    it('should allow updating any combination of fields', () => {
      const input: UpdateTaskInput = {
        id: 'task-123',
        title: 'Updated Title',
        status: 'complete',
      };
      expect(input.title).toBe('Updated Title');
      expect(input.status).toBe('complete');
    });
  });

  // ===========================================================================
  // Utility Types Tests
  // ===========================================================================
  describe('TasksByPriority', () => {
    it('should organize tasks by priority letter', () => {
      const tasksByPriority: TasksByPriority = {
        A: [],
        B: [],
        C: [],
        D: [],
      };
      expect(Object.keys(tasksByPriority)).toEqual(['A', 'B', 'C', 'D']);
    });
  });

  describe('DEFAULT_TASK_VALUES', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_TASK_VALUES.description).toBe('');
      expect(DEFAULT_TASK_VALUES.categoryId).toBeNull();
      expect(DEFAULT_TASK_VALUES.status).toBe('in_progress');
      expect(DEFAULT_TASK_VALUES.recurrence).toBeNull();
      expect(DEFAULT_TASK_VALUES.linkedNoteIds).toEqual([]);
      expect(DEFAULT_TASK_VALUES.isRecurringInstance).toBe(false);
      expect(DEFAULT_TASK_VALUES.deletedAt).toBeNull();
    });
  });
});

// ===========================================================================
// Type Compilation Tests (these verify TypeScript catches errors)
// ===========================================================================
describe('Type Safety', () => {
  it('should enforce PriorityLetter type', () => {
    // Valid
    const validPriority: TaskPriority = { letter: 'A', number: 1 };
    expect(validPriority).toBeDefined();

    // Invalid priority letters like 'E' would cause TypeScript compile errors
  });

  it('should enforce TaskStatus type', () => {
    // Valid statuses
    const validStatuses: TaskStatus[] = [
      'in_progress',
      'forward',
      'complete',
      'cancelled',
      'delegate',
    ];
    expect(validStatuses).toHaveLength(5);

    // Invalid statuses like 'pending' would cause TypeScript compile errors
  });

  it('should enforce RecurrenceType', () => {
    const validTypes: RecurrenceType[] = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];
    expect(validTypes).toHaveLength(5);

    // Invalid types like 'hourly' would cause TypeScript compile errors
  });

  it('should enforce RecurrenceEndType', () => {
    const validEndTypes: RecurrenceEndType[] = ['never', 'date', 'occurrences'];
    expect(validEndTypes).toHaveLength(3);
  });
});
