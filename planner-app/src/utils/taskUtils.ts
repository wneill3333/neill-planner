/**
 * Task Utility Functions
 *
 * Helper functions for task manipulation, grouping, and display.
 */

import type { Task, TaskStatus, PriorityLetter } from '../types';
import { STATUS_COLORS, getStatusSymbol } from './statusUtils';

// Re-export STATUS_COLORS and getStatusSymbol for convenience
export { STATUS_COLORS, getStatusSymbol };

// =============================================================================
// Priority Colors
// =============================================================================

/**
 * Color mapping for priority letters
 * A = Red (vital/urgent)
 * B = Orange (important)
 * C = Yellow (optional)
 * D = Gray (delegate/defer)
 */
export const PRIORITY_COLORS: Record<PriorityLetter, string> = {
  A: '#EF4444', // Red
  B: '#F97316', // Orange
  C: '#EAB308', // Yellow
  D: '#6B7280', // Gray
} as const;

/**
 * Tailwind CSS classes for priority colors
 */
export const PRIORITY_COLOR_CLASSES: Record<PriorityLetter, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-500' },
  B: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-500' },
  C: { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500' },
  D: { bg: 'bg-gray-500', text: 'text-gray-600', border: 'border-gray-500' },
} as const;

/**
 * Human-readable labels for priority letters
 */
export const PRIORITY_LABELS: Record<PriorityLetter, string> = {
  A: 'Vital',
  B: 'Important',
  C: 'Optional',
  D: 'Delegate',
} as const;

// =============================================================================
// Grouping Functions
// =============================================================================

/**
 * Group tasks by priority letter
 * @param tasks - Array of tasks to group
 * @returns Record with priority letters as keys and arrays of tasks as values
 */
export function groupTasksByPriority(tasks: Task[]): Record<PriorityLetter, Task[]> {
  const grouped: Record<PriorityLetter, Task[]> = {
    A: [],
    B: [],
    C: [],
    D: [],
  };

  for (const task of tasks) {
    const letter = task.priority.letter;
    grouped[letter].push(task);
  }

  // Sort each group by priority number
  for (const letter of Object.keys(grouped) as PriorityLetter[]) {
    grouped[letter].sort((a, b) => a.priority.number - b.priority.number);
  }

  return grouped;
}

/**
 * Sort tasks by priority (letter first, then number)
 * @param tasks - Array of tasks to sort
 * @returns New sorted array (original not modified)
 */
export function sortTasksByPriority(tasks: Task[]): Task[] {
  const priorityOrder: Record<PriorityLetter, number> = { A: 0, B: 1, C: 2, D: 3 };

  return [...tasks].sort((a, b) => {
    // First compare by letter
    const letterDiff = priorityOrder[a.priority.letter] - priorityOrder[b.priority.letter];
    if (letterDiff !== 0) return letterDiff;

    // Then by number
    return a.priority.number - b.priority.number;
  });
}

// =============================================================================
// Display Functions
// =============================================================================

/**
 * Get the color for a priority letter
 * @param letter - The priority letter
 * @returns The hex color code
 */
export function getPriorityColor(letter: PriorityLetter): string {
  return PRIORITY_COLORS[letter];
}

/**
 * Get the Tailwind CSS classes for a priority letter
 * @param letter - The priority letter
 * @returns Object with bg, text, and border class names
 */
export function getPriorityColorClasses(letter: PriorityLetter): { bg: string; text: string; border: string } {
  return PRIORITY_COLOR_CLASSES[letter];
}

/**
 * Get the color for a task status
 * @param status - The task status
 * @returns The hex color code
 */
export function getStatusColor(status: TaskStatus): string {
  return STATUS_COLORS[status];
}

/**
 * Format priority as display string (e.g., "A1", "B2")
 * @param task - The task
 * @returns Formatted priority string
 */
export function formatPriorityLabel(task: Task): string {
  return `${task.priority.letter}${task.priority.number}`;
}

/**
 * Check if a task is completed
 * @param task - The task to check
 * @returns true if the task is complete
 */
export function isTaskComplete(task: Task): boolean {
  return task.status === 'complete';
}

/**
 * Check if a task is cancelled or soft-deleted
 * @param task - The task to check
 * @returns true if the task is cancelled or has a deletedAt timestamp
 */
export function isTaskCancelled(task: Task): boolean {
  return task.status === 'cancelled' || task.deletedAt !== null;
}

/**
 * Check if a task is recurring
 * @param task - The task to check
 * @returns true if the task has a recurrence pattern (new or legacy system)
 */
export function isTaskRecurring(task: Task): boolean {
  // New system: task has a recurringPatternId
  if (task.recurringPatternId) {
    return true;
  }
  // Legacy system: task has embedded recurrence or is a recurring instance
  return task.recurrence !== null || task.isRecurringInstance;
}

/**
 * Get non-empty priority groups (groups that have tasks)
 * @param grouped - The grouped tasks record
 * @returns Array of priority letters that have tasks
 */
export function getNonEmptyPriorityGroups(grouped: Record<PriorityLetter, Task[]>): PriorityLetter[] {
  return (['A', 'B', 'C', 'D'] as PriorityLetter[]).filter((letter) => grouped[letter].length > 0);
}

/**
 * Count tasks by status
 * @param tasks - Array of tasks
 * @returns Record with status as key and count as value
 */
export function countTasksByStatus(tasks: Task[]): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = {
    in_progress: 0,
    forward: 0,
    complete: 0,
    cancelled: 0,
    delegate: 0,
  };

  for (const task of tasks) {
    counts[task.status]++;
  }

  return counts;
}

/**
 * Calculate completion percentage for a list of tasks
 * @param tasks - Array of tasks
 * @returns Percentage of completed tasks (0-100)
 */
export function getCompletionPercentage(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === 'complete').length;
  return Math.round((completed / tasks.length) * 100);
}
