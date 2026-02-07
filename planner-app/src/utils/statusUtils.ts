/**
 * Status Utility Functions
 *
 * Helper functions for task status manipulation and display.
 */

import type { TaskStatus } from '../types';
import { TaskStatusSymbols } from '../types';

// =============================================================================
// Status Order and Cycling
// =============================================================================

/**
 * Defines the order in which statuses cycle when clicking
 * in_progress -> complete -> forward -> delegate -> cancelled -> in_progress
 */
export const STATUS_ORDER: TaskStatus[] = [
  'in_progress',
  'complete',
  'forward',
  'delegate',
  'cancelled',
];

/**
 * Get the next status in the cycle
 * @param currentStatus - The current task status
 * @returns The next status in the cycle
 */
export function getNextStatus(currentStatus: TaskStatus): TaskStatus {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const nextIndex = (currentIndex + 1) % STATUS_ORDER.length;
  return STATUS_ORDER[nextIndex];
}

/**
 * Get the previous status in the cycle
 * @param currentStatus - The current task status
 * @returns The previous status in the cycle
 */
export function getPreviousStatus(currentStatus: TaskStatus): TaskStatus {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const prevIndex = currentIndex === 0 ? STATUS_ORDER.length - 1 : currentIndex - 1;
  return STATUS_ORDER[prevIndex];
}

// =============================================================================
// Status Labels
// =============================================================================

/**
 * Human-readable labels for task statuses
 */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  in_progress: 'In Progress',
  forward: 'Forwarded',
  complete: 'Complete',
  cancelled: 'Cancelled',
  delegate: 'Delegated',
} as const;

/**
 * Get the human-readable label for a status
 * @param status - The task status
 * @returns The human-readable label
 */
export function getStatusLabel(status: TaskStatus): string {
  return STATUS_LABELS[status];
}

// =============================================================================
// Status Symbols
// =============================================================================

/**
 * Get the symbol for a task status
 * @param status - The task status
 * @returns The unicode symbol
 */
export function getStatusSymbol(status: TaskStatus): string {
  return TaskStatusSymbols[status];
}

// =============================================================================
// Status Colors
// =============================================================================

/**
 * Color mapping for task statuses (hex values)
 */
export const STATUS_COLORS: Record<TaskStatus, string> = {
  in_progress: '#3B82F6', // Blue
  forward: '#8B5CF6', // Purple
  complete: '#22C55E', // Green
  cancelled: '#9CA3AF', // Gray
  delegate: '#F97316', // Orange
} as const;

/**
 * Tailwind CSS classes for status colors
 */
export const STATUS_COLOR_CLASSES: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  in_progress: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500' },
  forward: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-500' },
  complete: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-500' },
  cancelled: { bg: 'bg-gray-400', text: 'text-gray-500', border: 'border-gray-400' },
  delegate: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-500' },
} as const;

/**
 * Get the color for a task status
 * @param status - The task status
 * @returns The hex color code
 */
export function getStatusColor(status: TaskStatus): string {
  return STATUS_COLORS[status];
}

/**
 * Get the Tailwind CSS classes for a task status
 * @param status - The task status
 * @returns Object with bg, text, and border class names
 */
export function getStatusColorClasses(status: TaskStatus): { bg: string; text: string; border: string } {
  return STATUS_COLOR_CLASSES[status];
}

// =============================================================================
// Status Descriptions
// =============================================================================

/**
 * Descriptions for task statuses (for tooltips, help text)
 */
export const STATUS_DESCRIPTIONS: Record<TaskStatus, string> = {
  in_progress: 'Task is active and in progress',
  forward: 'Task has been moved to another day',
  complete: 'Task has been completed',
  cancelled: 'Task has been cancelled',
  delegate: 'Task has been delegated to someone else',
} as const;

/**
 * Get the description for a task status
 * @param status - The task status
 * @returns The description text
 */
export function getStatusDescription(status: TaskStatus): string {
  return STATUS_DESCRIPTIONS[status];
}

// =============================================================================
// Status Checking
// =============================================================================

/**
 * Check if a status represents a completed/closed state
 * @param status - The task status
 * @returns true if the status is complete, delete, or delegate
 */
export function isClosedStatus(status: TaskStatus): boolean {
  return status === 'complete' || status === 'cancelled' || status === 'delegate';
}

/**
 * Check if a status represents an active state
 * @param status - The task status
 * @returns true if the status is in_progress or forward
 */
export function isActiveStatus(status: TaskStatus): boolean {
  return status === 'in_progress' || status === 'forward';
}

/**
 * Get all available statuses
 * @returns Array of all task statuses
 */
export function getAllStatuses(): TaskStatus[] {
  return [...STATUS_ORDER];
}
