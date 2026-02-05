/**
 * Mock Data Utilities Tests
 *
 * Tests for the mock data creation functions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetMockCounters,
  createMockTask,
  createMockTasks,
  createMockTasksAllPriorities,
  createMockCategory,
  createMockCategories,
  createDefaultCategories,
  createCategoriesMap,
  createMockUser,
  createMockUserSettings,
  createMockEvent,
  createMockTasksState,
  createMockCategoriesState,
} from '../mockData';

// Reset counters before each test to ensure predictable IDs
beforeEach(() => {
  resetMockCounters();
});

// =============================================================================
// Task Mock Tests
// =============================================================================

describe('createMockTask', () => {
  it('should create a task with default values', () => {
    const task = createMockTask();

    expect(task.id).toBe('task-1');
    expect(task.userId).toBe('user-1');
    expect(task.title).toBe('Test Task 1');
    expect(task.status).toBe('in_progress');
    expect(task.priority.letter).toBe('A');
    expect(task.priority.number).toBe(1);
    expect(task.scheduledDate).toEqual(new Date('2024-01-15T00:00:00.000Z'));
    expect(task.categoryId).toBeNull();
    expect(task.recurrence).toBeNull();
    expect(task.isRecurringInstance).toBe(false);
    expect(task.linkedNoteIds).toEqual([]);
    expect(task.linkedEventId).toBeNull();
    expect(task.recurringParentId).toBeNull();
    expect(task.instanceDate).toBeNull();
  });

  it('should create a task with custom values', () => {
    const customDate = new Date('2024-02-01T00:00:00.000Z');
    const task = createMockTask({
      id: 'custom-id',
      title: 'Custom Task',
      priorityLetter: 'B',
      priorityNumber: 3,
      status: 'complete',
      categoryId: 'cat-1',
      scheduledDate: customDate,
    });

    expect(task.id).toBe('custom-id');
    expect(task.title).toBe('Custom Task');
    expect(task.priority.letter).toBe('B');
    expect(task.priority.number).toBe(3);
    expect(task.status).toBe('complete');
    expect(task.categoryId).toBe('cat-1');
    expect(task.scheduledDate).toEqual(customDate);
  });

  it('should create a recurring task when isRecurring is true', () => {
    const task = createMockTask({ isRecurring: true });

    expect(task.recurrence).not.toBeNull();
    expect(task.recurrence?.type).toBe('daily');
    expect(task.recurrence?.interval).toBe(1);
    expect(task.recurrence?.daysOfWeek).toEqual([]);
    expect(task.recurrence?.endCondition.type).toBe('never');
  });

  it('should increment counter for each task', () => {
    const task1 = createMockTask();
    const task2 = createMockTask();
    const task3 = createMockTask();

    expect(task1.id).toBe('task-1');
    expect(task2.id).toBe('task-2');
    expect(task3.id).toBe('task-3');
  });

  it('should allow null scheduledDate', () => {
    const task = createMockTask({ scheduledDate: null });

    expect(task.scheduledDate).toBeNull();
  });

  it('should create task with linked notes and events', () => {
    const task = createMockTask({
      linkedNoteIds: ['note-1', 'note-2'],
      linkedEventId: 'event-1',
    });

    expect(task.linkedNoteIds).toEqual(['note-1', 'note-2']);
    expect(task.linkedEventId).toBe('event-1');
  });

  it('should create recurring instance task', () => {
    const instanceDate = new Date('2024-01-20T00:00:00.000Z');
    const task = createMockTask({
      isRecurringInstance: true,
      recurringParentId: 'parent-task-1',
      instanceDate,
    });

    expect(task.isRecurringInstance).toBe(true);
    expect(task.recurringParentId).toBe('parent-task-1');
    expect(task.instanceDate).toEqual(instanceDate);
  });
});

describe('createMockTasks', () => {
  it('should create multiple tasks', () => {
    const tasks = createMockTasks(3);

    expect(tasks).toHaveLength(3);
    expect(tasks[0].id).toBe('task-1');
    expect(tasks[1].id).toBe('task-2');
    expect(tasks[2].id).toBe('task-3');
  });

  it('should apply options to all tasks', () => {
    const customDate = new Date('2024-03-01T00:00:00.000Z');
    const tasks = createMockTasks(2, { priorityLetter: 'C', scheduledDate: customDate });

    expect(tasks[0].priority.letter).toBe('C');
    expect(tasks[0].scheduledDate).toEqual(customDate);
    expect(tasks[1].priority.letter).toBe('C');
    expect(tasks[1].scheduledDate).toEqual(customDate);
  });

  it('should assign sequential priority numbers', () => {
    const tasks = createMockTasks(3);

    expect(tasks[0].priority.number).toBe(1);
    expect(tasks[1].priority.number).toBe(2);
    expect(tasks[2].priority.number).toBe(3);
  });
});

describe('createMockTasksAllPriorities', () => {
  it('should create tasks for all priority letters', () => {
    const tasks = createMockTasksAllPriorities(1);

    expect(tasks).toHaveLength(4);
    expect(tasks[0].priority.letter).toBe('A');
    expect(tasks[1].priority.letter).toBe('B');
    expect(tasks[2].priority.letter).toBe('C');
    expect(tasks[3].priority.letter).toBe('D');
  });

  it('should create multiple tasks per priority', () => {
    const tasks = createMockTasksAllPriorities(2);

    expect(tasks).toHaveLength(8);
    expect(tasks.filter((t) => t.priority.letter === 'A')).toHaveLength(2);
    expect(tasks.filter((t) => t.priority.letter === 'B')).toHaveLength(2);
    expect(tasks.filter((t) => t.priority.letter === 'C')).toHaveLength(2);
    expect(tasks.filter((t) => t.priority.letter === 'D')).toHaveLength(2);
  });

  it('should name tasks with priority letter and number', () => {
    const tasks = createMockTasksAllPriorities(2);

    expect(tasks[0].title).toBe('A1 Task');
    expect(tasks[1].title).toBe('A2 Task');
    expect(tasks[2].title).toBe('B1 Task');
    expect(tasks[3].title).toBe('B2 Task');
  });
});

// =============================================================================
// Category Mock Tests
// =============================================================================

describe('createMockCategory', () => {
  it('should create a category with default values', () => {
    const category = createMockCategory();

    expect(category.id).toBe('cat-1');
    expect(category.userId).toBe('user-1');
    expect(category.name).toBe('Category 1');
    expect(category.color).toBe('#3B82F6');
    expect(category.isDefault).toBe(false);
  });

  it('should create a category with custom values', () => {
    const category = createMockCategory({
      id: 'custom-cat',
      name: 'Work',
      color: '#FF0000',
      isDefault: true,
    });

    expect(category.id).toBe('custom-cat');
    expect(category.name).toBe('Work');
    expect(category.color).toBe('#FF0000');
    expect(category.isDefault).toBe(true);
  });

  it('should increment counter for each category', () => {
    const cat1 = createMockCategory();
    const cat2 = createMockCategory();

    expect(cat1.id).toBe('cat-1');
    expect(cat2.id).toBe('cat-2');
  });
});

describe('createMockCategories', () => {
  it('should create multiple categories', () => {
    const categories = createMockCategories(3);

    expect(categories).toHaveLength(3);
  });
});

describe('createDefaultCategories', () => {
  it('should create default categories with correct names', () => {
    const categories = createDefaultCategories();

    expect(categories).toHaveLength(5);
    expect(categories.map((c) => c.name)).toEqual([
      'Work',
      'Personal',
      'Health',
      'Finance',
      'Learning',
    ]);
  });

  it('should assign correct colors', () => {
    const categories = createDefaultCategories();

    expect(categories[0].color).toBe('#3B82F6'); // Work - blue
    expect(categories[1].color).toBe('#22C55E'); // Personal - green
    expect(categories[2].color).toBe('#EF4444'); // Health - red
  });

  it('should use provided userId', () => {
    const categories = createDefaultCategories('my-user');

    expect(categories[0].userId).toBe('my-user');
    expect(categories[1].userId).toBe('my-user');
  });
});

describe('createCategoriesMap', () => {
  it('should create a map from categories array', () => {
    const categories = [
      createMockCategory({ id: 'cat-a', name: 'A' }),
      createMockCategory({ id: 'cat-b', name: 'B' }),
    ];

    const map = createCategoriesMap(categories);

    expect(map['cat-a'].name).toBe('A');
    expect(map['cat-b'].name).toBe('B');
  });

  it('should return empty object for empty array', () => {
    const map = createCategoriesMap([]);
    expect(map).toEqual({});
  });
});

// =============================================================================
// User Mock Tests
// =============================================================================

describe('createMockUser', () => {
  it('should create a user with default values', () => {
    const user = createMockUser();

    expect(user.id).toBe('user-1');
    expect(user.email).toBe('user1@example.com');
    expect(user.displayName).toBe('Test User 1');
    expect(user.role).toBe('standard');
  });

  it('should create a user with custom values', () => {
    const user = createMockUser({
      id: 'custom-user',
      email: 'custom@example.com',
      role: 'admin',
    });

    expect(user.id).toBe('custom-user');
    expect(user.email).toBe('custom@example.com');
    expect(user.role).toBe('admin');
  });

  it('should include settings', () => {
    const user = createMockUser();

    expect(user.settings).toBeDefined();
    expect(user.settings.theme).toBe('system');
  });
});

describe('createMockUserSettings', () => {
  it('should create settings with defaults', () => {
    const settings = createMockUserSettings();

    expect(settings.theme).toBe('system');
    expect(settings.defaultPriorityLetter).toBe('B');
    expect(settings.showCompletedTasks).toBe(true);
  });

  it('should allow overriding settings', () => {
    const settings = createMockUserSettings({
      theme: 'dark',
      defaultPriorityLetter: 'A',
    });

    expect(settings.theme).toBe('dark');
    expect(settings.defaultPriorityLetter).toBe('A');
    expect(settings.showCompletedTasks).toBe(true); // Unchanged
  });
});

// =============================================================================
// Event Mock Tests
// =============================================================================

describe('createMockEvent', () => {
  it('should create an event with default values', () => {
    const event = createMockEvent();

    expect(event.id).toBe('event-1');
    expect(event.userId).toBe('user-1');
    expect(event.title).toBe('Test Event 1');
    expect(event.startTime).toBeInstanceOf(Date);
    expect(event.endTime).toBeInstanceOf(Date);
    expect(event.isConfidential).toBe(false);
    expect(event.recurrence).toBeNull();
    expect(event.linkedTaskIds).toEqual([]);
    expect(event.linkedNoteIds).toEqual([]);
  });

  it('should create an event with custom values', () => {
    const customStart = new Date('2024-02-15T14:00:00.000Z');
    const customEnd = new Date('2024-02-15T15:30:00.000Z');

    const event = createMockEvent({
      title: 'Meeting',
      startTime: customStart,
      endTime: customEnd,
      isConfidential: true,
      alternateTitle: 'Private Event',
    });

    expect(event.title).toBe('Meeting');
    expect(event.startTime).toEqual(customStart);
    expect(event.endTime).toEqual(customEnd);
    expect(event.isConfidential).toBe(true);
    expect(event.alternateTitle).toBe('Private Event');
  });
});

// =============================================================================
// Redux State Mock Tests
// =============================================================================

describe('createMockTasksState', () => {
  it('should create empty state by default', () => {
    const state = createMockTasksState();

    expect(state.tasks).toEqual({});
    expect(state.taskIdsByDate).toEqual({});
    expect(state.selectedDate).toBe('2024-01-15');
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.syncStatus).toBe('synced');
  });

  it('should normalize provided tasks', () => {
    const tasks = [
      createMockTask({ id: 'task-1', scheduledDate: new Date('2024-01-15T00:00:00.000Z') }),
      createMockTask({ id: 'task-2', scheduledDate: new Date('2024-01-15T00:00:00.000Z') }),
      createMockTask({ id: 'task-3', scheduledDate: new Date('2024-01-16T00:00:00.000Z') }),
    ];

    const state = createMockTasksState({ tasks });

    expect(state.tasks['task-1']).toBeDefined();
    expect(state.tasks['task-2']).toBeDefined();
    expect(state.tasks['task-3']).toBeDefined();
    expect(state.taskIdsByDate['2024-01-15']).toEqual(['task-1', 'task-2']);
    expect(state.taskIdsByDate['2024-01-16']).toEqual(['task-3']);
  });

  it('should handle tasks with null scheduledDate', () => {
    const tasks = [
      createMockTask({ id: 'task-1', scheduledDate: null }),
    ];

    const state = createMockTasksState({ tasks });

    expect(state.tasks['task-1']).toBeDefined();
    expect(Object.keys(state.taskIdsByDate)).toHaveLength(0);
  });

  it('should set loading and error states', () => {
    const state = createMockTasksState({
      loading: true,
      error: 'Something went wrong',
      syncStatus: 'error',
    });

    expect(state.loading).toBe(true);
    expect(state.error).toBe('Something went wrong');
    expect(state.syncStatus).toBe('error');
  });
});

describe('createMockCategoriesState', () => {
  it('should create empty state by default', () => {
    const state = createMockCategoriesState();

    expect(state.categories).toEqual({});
    expect(state.categoryIds).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.syncStatus).toBe('synced');
    expect(state.initialized).toBe(true);
  });

  it('should normalize provided categories', () => {
    const categories = [
      createMockCategory({ id: 'cat-1' }),
      createMockCategory({ id: 'cat-2' }),
    ];

    const state = createMockCategoriesState({ categories });

    expect(state.categories['cat-1']).toBeDefined();
    expect(state.categories['cat-2']).toBeDefined();
    expect(state.categoryIds).toEqual(['cat-1', 'cat-2']);
  });

  it('should set initialized to false', () => {
    const state = createMockCategoriesState({ initialized: false });

    expect(state.initialized).toBe(false);
  });
});
