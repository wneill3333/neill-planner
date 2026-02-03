/**
 * Mock Data Utilities
 *
 * Helper functions to create mock data for testing.
 * Provides consistent, typed mock objects for tasks, categories, users, and events.
 */

import type {
  Task,
  Category,
  User,
  Event,
  TaskStatus,
  PriorityLetter,
  UserSettings,
  RecurrencePattern,
} from '../types';

// =============================================================================
// Counter for unique IDs
// =============================================================================

let taskCounter = 0;
let categoryCounter = 0;
let userCounter = 0;
let eventCounter = 0;

/**
 * Reset all counters (useful between test suites)
 */
export function resetMockCounters(): void {
  taskCounter = 0;
  categoryCounter = 0;
  userCounter = 0;
  eventCounter = 0;
}

// =============================================================================
// Task Mock
// =============================================================================

export interface CreateMockTaskOptions {
  id?: string;
  userId?: string;
  title?: string;
  description?: string;
  scheduledDate?: Date | null;
  scheduledTime?: string | null;
  priorityLetter?: PriorityLetter;
  priorityNumber?: number;
  status?: TaskStatus;
  categoryId?: string | null;
  recurrence?: RecurrencePattern | null;
  isRecurring?: boolean;
  isRecurringInstance?: boolean;
  recurringParentId?: string | null;
  instanceDate?: Date | null;
  linkedNoteIds?: string[];
  linkedEventId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Create a mock task with sensible defaults
 * Matches the actual Task type from types/task.types.ts
 */
export function createMockTask(options: CreateMockTaskOptions = {}): Task {
  taskCounter++;
  const id = options.id ?? `task-${taskCounter}`;
  const now = new Date();
  const defaultDate = new Date('2024-01-15T00:00:00.000Z');

  // Build recurrence if isRecurring is true
  let recurrence: RecurrencePattern | null = options.recurrence ?? null;
  if (options.isRecurring && !recurrence) {
    recurrence = {
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
  }

  return {
    id,
    userId: options.userId ?? 'user-1',
    title: options.title ?? `Test Task ${taskCounter}`,
    description: options.description ?? '',
    categoryId: options.categoryId ?? null,
    priority: {
      letter: options.priorityLetter ?? 'A',
      number: options.priorityNumber ?? taskCounter,
    },
    status: options.status ?? 'in_progress',
    scheduledDate: options.scheduledDate !== undefined ? options.scheduledDate : defaultDate,
    scheduledTime: options.scheduledTime ?? null,
    recurrence,
    linkedNoteIds: options.linkedNoteIds ?? [],
    linkedEventId: options.linkedEventId ?? null,
    isRecurringInstance: options.isRecurringInstance ?? false,
    recurringParentId: options.recurringParentId ?? null,
    instanceDate: options.instanceDate ?? null,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
    deletedAt: options.deletedAt ?? null,
  };
}

/**
 * Create multiple mock tasks at once
 */
export function createMockTasks(count: number, options: CreateMockTaskOptions = {}): Task[] {
  return Array.from({ length: count }, (_, index) =>
    createMockTask({
      ...options,
      priorityNumber: options.priorityNumber ?? index + 1,
    })
  );
}

/**
 * Create mock tasks for all priority letters
 */
export function createMockTasksAllPriorities(
  tasksPerPriority: number = 2,
  options: Omit<CreateMockTaskOptions, 'priorityLetter'> = {}
): Task[] {
  const priorities: PriorityLetter[] = ['A', 'B', 'C', 'D'];
  const tasks: Task[] = [];

  for (const letter of priorities) {
    for (let i = 1; i <= tasksPerPriority; i++) {
      tasks.push(
        createMockTask({
          ...options,
          priorityLetter: letter,
          priorityNumber: i,
          title: `${letter}${i} Task`,
        })
      );
    }
  }

  return tasks;
}

// =============================================================================
// Category Mock
// =============================================================================

export interface CreateMockCategoryOptions {
  id?: string;
  userId?: string;
  name?: string;
  color?: string;
  icon?: string | null;
  isDefault?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create a mock category with sensible defaults
 */
export function createMockCategory(options: CreateMockCategoryOptions = {}): Category {
  categoryCounter++;
  const id = options.id ?? `cat-${categoryCounter}`;
  const now = new Date();

  return {
    id,
    userId: options.userId ?? 'user-1',
    name: options.name ?? `Category ${categoryCounter}`,
    color: options.color ?? '#3B82F6',
    icon: options.icon ?? null,
    isDefault: options.isDefault ?? false,
    sortOrder: options.sortOrder ?? categoryCounter,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Create multiple mock categories at once
 */
export function createMockCategories(count: number, options: CreateMockCategoryOptions = {}): Category[] {
  return Array.from({ length: count }, () => createMockCategory(options));
}

/**
 * Create a set of default categories (Work, Personal, Health, etc.)
 */
export function createDefaultCategories(userId: string = 'user-1'): Category[] {
  const defaults = [
    { name: 'Work', color: '#3B82F6' },
    { name: 'Personal', color: '#22C55E' },
    { name: 'Health', color: '#EF4444' },
    { name: 'Finance', color: '#F97316' },
    { name: 'Learning', color: '#8B5CF6' },
  ];

  return defaults.map((cat, index) =>
    createMockCategory({
      userId,
      name: cat.name,
      color: cat.color,
      sortOrder: index,
    })
  );
}

/**
 * Create a categories map (Record<string, Category>) from an array
 */
export function createCategoriesMap(categories: Category[]): Record<string, Category> {
  return categories.reduce(
    (map, category) => {
      map[category.id] = category;
      return map;
    },
    {} as Record<string, Category>
  );
}

// =============================================================================
// User Mock
// =============================================================================

export interface CreateMockUserOptions {
  id?: string;
  email?: string;
  displayName?: string | null;
  photoURL?: string | null;
  role?: 'admin' | 'standard';
  settings?: Partial<UserSettings>;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date | null;
}

/**
 * Create mock user settings with sensible defaults
 */
export function createMockUserSettings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    theme: 'system',
    defaultPriorityLetter: 'B',
    showCompletedTasks: true,
    showDeletedTasks: false,
    weekStartsOn: 0,
    timeFormat: '12h',
    dateFormat: 'MM/dd/yyyy',
    defaultTaskDuration: 30,
    enableNotifications: true,
    reminderDefaultMinutes: 15,
    googleCalendarSync: false,
    googleCalendarId: null,
    ...overrides,
  };
}

/**
 * Create a mock user with sensible defaults
 */
export function createMockUser(options: CreateMockUserOptions = {}): User {
  userCounter++;
  const id = options.id ?? `user-${userCounter}`;
  const now = new Date();

  return {
    id,
    email: options.email ?? `user${userCounter}@example.com`,
    displayName: options.displayName ?? `Test User ${userCounter}`,
    photoURL: options.photoURL ?? null,
    role: options.role ?? 'standard',
    settings: createMockUserSettings(options.settings),
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
    lastLoginAt: options.lastLoginAt ?? now,
  };
}

// =============================================================================
// Event Mock
// =============================================================================

export interface CreateMockEventOptions {
  id?: string;
  userId?: string;
  title?: string;
  description?: string | null;
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: string | null;
  categoryId?: string | null;
  isConfidential?: boolean;
  alternateTitle?: string | null;
  googleEventId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Create a mock event with sensible defaults
 */
export function createMockEvent(options: CreateMockEventOptions = {}): Event {
  eventCounter++;
  const id = options.id ?? `event-${eventCounter}`;
  const now = new Date();

  return {
    id,
    userId: options.userId ?? 'user-1',
    title: options.title ?? `Test Event ${eventCounter}`,
    description: options.description ?? null,
    date: options.date ?? '2024-01-15',
    startTime: options.startTime ?? '09:00',
    endTime: options.endTime ?? '10:00',
    location: options.location ?? null,
    categoryId: options.categoryId ?? null,
    isAllDay: false,
    recurrence: null,
    linkedTaskIds: [],
    linkedNoteIds: [],
    isConfidential: options.isConfidential ?? false,
    alternateTitle: options.alternateTitle ?? null,
    googleEventId: options.googleEventId ?? null,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
    deletedAt: options.deletedAt ?? null,
  };
}

// =============================================================================
// Redux State Mocks
// =============================================================================

import type { TasksState } from '../features/tasks/taskSlice';
import type { CategoriesState } from '../features/categories/categorySlice';

/**
 * Get ISO date string from a Date object
 */
function getDateString(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

/**
 * Create a mock tasks state
 */
export function createMockTasksState(options: {
  tasks?: Task[];
  selectedDate?: string;
  loading?: boolean;
  error?: string | null;
  syncStatus?: 'synced' | 'syncing' | 'error' | 'offline';
} = {}): TasksState {
  const tasks = options.tasks ?? [];
  const tasksRecord: Record<string, Task> = {};
  const taskIdsByDate: Record<string, string[]> = {};

  for (const task of tasks) {
    tasksRecord[task.id] = task;
    const dateKey = getDateString(task.scheduledDate);
    if (dateKey) {
      if (!taskIdsByDate[dateKey]) {
        taskIdsByDate[dateKey] = [];
      }
      taskIdsByDate[dateKey].push(task.id);
    }
  }

  return {
    tasks: tasksRecord,
    taskIdsByDate,
    selectedDate: options.selectedDate ?? '2024-01-15',
    loading: options.loading ?? false,
    error: options.error ?? null,
    syncStatus: options.syncStatus ?? 'synced',
    reorderRollbackState: null,
  };
}

/**
 * Create a mock categories state
 */
export function createMockCategoriesState(options: {
  categories?: Category[];
  loading?: boolean;
  error?: string | null;
  syncStatus?: 'synced' | 'syncing' | 'error' | 'offline';
  initialized?: boolean;
} = {}): CategoriesState {
  const categories = options.categories ?? [];
  const categoriesRecord: Record<string, Category> = {};
  const categoryIds: string[] = [];

  for (const category of categories) {
    categoriesRecord[category.id] = category;
    categoryIds.push(category.id);
  }

  return {
    categories: categoriesRecord,
    categoryIds,
    loading: options.loading ?? false,
    error: options.error ?? null,
    syncStatus: options.syncStatus ?? 'synced',
    initialized: options.initialized ?? true,
  };
}
