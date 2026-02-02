/**
 * Priority Utility Functions
 *
 * Functions for managing task priority numbers including auto-numbering
 * and reordering functionality.
 */

import type { Task, PriorityLetter } from '../types';
import { PRIORITY_LETTERS } from '../types';

// =============================================================================
// Types
// =============================================================================

/**
 * Result of a reorder operation
 */
export interface PriorityReorderResult {
  /** Tasks with updated priority numbers */
  tasks: Task[];
  /** Whether any changes were made */
  hasChanges: boolean;
}

// =============================================================================
// Auto-numbering Functions
// =============================================================================

/**
 * Get the next priority number for a given priority letter.
 *
 * Returns the next available number (max existing + 1) for the given priority
 * letter, or 1 if no tasks exist with that priority.
 *
 * @param tasks - Array of tasks to check
 * @param priorityLetter - The priority letter to get the next number for
 * @returns The next priority number (1-based)
 *
 * @example
 * ```ts
 * // Tasks: A1, A2, A3, B1
 * getNextPriorityNumber(tasks, 'A'); // Returns 4
 * getNextPriorityNumber(tasks, 'B'); // Returns 2
 * getNextPriorityNumber(tasks, 'C'); // Returns 1
 * ```
 */
export function getNextPriorityNumber(tasks: Task[], priorityLetter: PriorityLetter): number {
  const tasksWithPriority = tasks.filter((task) => task.priority.letter === priorityLetter);

  if (tasksWithPriority.length === 0) {
    return 1;
  }

  const maxNumber = Math.max(...tasksWithPriority.map((task) => task.priority.number));
  return maxNumber + 1;
}

/**
 * Get the highest priority number for a given priority letter.
 *
 * @param tasks - Array of tasks to check
 * @param priorityLetter - The priority letter to check
 * @returns The highest priority number, or 0 if no tasks exist
 */
export function getMaxPriorityNumber(tasks: Task[], priorityLetter: PriorityLetter): number {
  const tasksWithPriority = tasks.filter((task) => task.priority.letter === priorityLetter);

  if (tasksWithPriority.length === 0) {
    return 0;
  }

  return Math.max(...tasksWithPriority.map((task) => task.priority.number));
}

// =============================================================================
// Reordering Functions
// =============================================================================

/**
 * Reorder tasks within a specific priority letter to fill gaps.
 *
 * Sorts tasks by their current priority number and renumbers them
 * sequentially starting from 1. This fills any gaps in numbering.
 *
 * @param tasks - Array of tasks to reorder (all tasks, not just one priority)
 * @param priorityLetter - The priority letter to reorder
 * @returns New task objects with updated priority numbers
 *
 * @example
 * ```ts
 * // Tasks: A1, A3, A5 -> A1, A2, A3
 * const reordered = reorderTasksInPriority(tasks, 'A');
 * ```
 */
export function reorderTasksInPriority(tasks: Task[], priorityLetter: PriorityLetter): Task[] {
  // Filter tasks for this priority letter
  const priorityTasks = tasks.filter((task) => task.priority.letter === priorityLetter);

  // Sort by current priority number to maintain relative order
  priorityTasks.sort((a, b) => a.priority.number - b.priority.number);

  // Renumber sequentially starting from 1
  return priorityTasks.map((task, index) => ({
    ...task,
    priority: {
      ...task.priority,
      number: index + 1,
    },
  }));
}

/**
 * Reorder all tasks across all priority letters to fill gaps.
 *
 * Processes each priority group independently, renumbering tasks
 * sequentially within each group.
 *
 * @param tasks - Array of all tasks to reorder
 * @returns Result containing reordered tasks and whether changes were made
 *
 * @example
 * ```ts
 * // Tasks: A1, A3, B1, B5 -> A1, A2, B1, B2
 * const result = reorderAllTasks(tasks);
 * if (result.hasChanges) {
 *   // Save the updated tasks
 * }
 * ```
 */
export function reorderAllTasks(tasks: Task[]): PriorityReorderResult {
  if (tasks.length === 0) {
    return { tasks: [], hasChanges: false };
  }

  const priorityLetters = PRIORITY_LETTERS;
  const reorderedTasks: Task[] = [];
  let hasChanges = false;

  for (const letter of priorityLetters) {
    const reordered = reorderTasksInPriority(tasks, letter);

    // Check if any task in this group changed
    for (const reorderedTask of reordered) {
      const original = tasks.find((t) => t.id === reorderedTask.id);
      if (original && original.priority.number !== reorderedTask.priority.number) {
        hasChanges = true;
      }
    }

    reorderedTasks.push(...reordered);
  }

  return { tasks: reorderedTasks, hasChanges };
}

/**
 * Get tasks that need to be updated during a reorder operation.
 *
 * Returns only tasks whose priority number actually changed,
 * useful for batch updates to avoid unnecessary writes.
 *
 * @param originalTasks - Original task list
 * @param reorderedTasks - Tasks after reordering
 * @returns Array of tasks that have changed priority numbers
 */
export function getTasksWithChangedPriority(
  originalTasks: Task[],
  reorderedTasks: Task[]
): Task[] {
  const changedTasks: Task[] = [];

  for (const reorderedTask of reorderedTasks) {
    const original = originalTasks.find((t) => t.id === reorderedTask.id);
    if (original && original.priority.number !== reorderedTask.priority.number) {
      changedTasks.push(reorderedTask);
    }
  }

  return changedTasks;
}

// =============================================================================
// Gap Detection
// =============================================================================

/**
 * Check if there are gaps in the priority numbering that need reordering.
 *
 * Returns true if any priority group has non-sequential numbers,
 * indicating that reordering could clean up the numbering.
 *
 * @param tasks - Array of tasks to check
 * @returns true if gaps exist in any priority group
 *
 * @example
 * ```ts
 * // Tasks: A1, A2, A3 -> false (no gaps)
 * // Tasks: A1, A3, A5 -> true (has gaps)
 * hasGapsInPriorityNumbering(tasks);
 * ```
 */
export function hasGapsInPriorityNumbering(tasks: Task[]): boolean {
  if (tasks.length === 0) {
    return false;
  }

  const priorityLetters = PRIORITY_LETTERS;

  for (const letter of priorityLetters) {
    const priorityTasks = tasks.filter((task) => task.priority.letter === letter);

    if (priorityTasks.length === 0) {
      continue;
    }

    // Sort by priority number
    priorityTasks.sort((a, b) => a.priority.number - b.priority.number);

    // Check if numbers are sequential starting from 1
    for (let i = 0; i < priorityTasks.length; i++) {
      if (priorityTasks[i].priority.number !== i + 1) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get count of gaps in priority numbering per priority letter.
 *
 * Useful for displaying how much cleanup is needed.
 *
 * @param tasks - Array of tasks to check
 * @returns Record with priority letters and gap counts
 */
export function getGapCountsByPriority(tasks: Task[]): Record<PriorityLetter, number> {
  const counts: Record<PriorityLetter, number> = { A: 0, B: 0, C: 0, D: 0 };

  const priorityLetters = PRIORITY_LETTERS;

  for (const letter of priorityLetters) {
    const priorityTasks = tasks.filter((task) => task.priority.letter === letter);

    if (priorityTasks.length === 0) {
      continue;
    }

    // Sort by priority number
    priorityTasks.sort((a, b) => a.priority.number - b.priority.number);

    // Count gaps
    let gaps = 0;
    for (let i = 0; i < priorityTasks.length; i++) {
      if (priorityTasks[i].priority.number !== i + 1) {
        gaps++;
      }
    }

    counts[letter] = gaps;
  }

  return counts;
}
