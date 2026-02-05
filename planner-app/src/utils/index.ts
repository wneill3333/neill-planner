/**
 * Utility Functions Exports
 *
 * Central export point for utility modules.
 */

// Date utilities
export {
  formatDisplayDate,
  addDays,
  isToday,
  parseISODate,
  toISODateString,
  getTodayString,
} from './dateUtils';

// Status utilities
export {
  STATUS_ORDER,
  getNextStatus,
  getPreviousStatus,
  STATUS_LABELS,
  getStatusLabel,
  getStatusSymbol,
  STATUS_COLORS,
  STATUS_COLOR_CLASSES,
  getStatusColor,
  getStatusColorClasses,
  STATUS_DESCRIPTIONS,
  getStatusDescription,
  isClosedStatus,
  isActiveStatus,
  getAllStatuses,
} from './statusUtils';

// Priority utilities
export {
  getNextPriorityNumber,
  reorderTasksInPriority,
  reorderAllTasks,
  getTasksWithChangedPriority,
  hasGapsInPriorityNumbering,
  getGapCountsByPriority,
} from './priorityUtils';

// Re-export priority labels from taskUtils
export {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_COLOR_CLASSES,
  getPriorityColor,
  getPriorityColorClasses,
} from './taskUtils';

// Task utilities
export { groupTasksByPriority, sortTasksByPriority } from './taskUtils';

// String utilities
export { capitalizeWords } from './stringUtils';

// Recurrence utilities
export {
  generateRecurringInstances,
  getNextOccurrence,
  isDateInExceptions,
  hasReachedEndCondition,
} from './recurrenceUtils';
