/**
 * RecurringTasksManager Component
 *
 * Modal for viewing and managing recurring patterns.
 * Shows patterns (new system) and legacy parent tasks for migration awareness.
 */

import { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EditTaskModal } from '../../features/tasks/EditTaskModal';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectRecurringPatternsArray,
  selectRecurringParentTasks,
  selectTasksForPattern,
} from '../../features/tasks/taskSlice';
import {
  hardDeleteTask,
  updateTaskAsync,
  deleteRecurringPatternThunk,
  migrateRecurringTasksThunk,
} from '../../features/tasks/taskThunks';
import { useAuth } from '../../features/auth';
import type { Task, RecurringPattern as RecurringPatternType } from '../../types';
import { format } from 'date-fns';
import { normalizeToDateString } from '../../utils/dateUtils';

// =============================================================================
// Types
// =============================================================================

export interface RecurringTasksManagerProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Test ID for testing */
  testId?: string;
}

interface TaskGroup {
  title: string;
  tasks: Task[];
  isDuplicate: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Group recurring tasks by title to identify duplicates (legacy system)
 */
function groupTasksByTitle(tasks: Task[]): TaskGroup[] {
  const groups = new Map<string, Task[]>();

  for (const task of tasks) {
    const titleKey = task.title.toLowerCase().trim();
    const existing = groups.get(titleKey) || [];
    groups.set(titleKey, [...existing, task]);
  }

  return Array.from(groups.entries())
    .map(([_, tasks]): TaskGroup => ({
      title: tasks[0].title,
      tasks: tasks.sort((a, b) => {
        if (a.scheduledDate && b.scheduledDate) {
          return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
        }
        return 0;
      }),
      isDuplicate: tasks.length > 1,
    }))
    .sort((a, b) => {
      if (a.isDuplicate !== b.isDuplicate) {
        return a.isDuplicate ? -1 : 1;
      }
      return a.title.localeCompare(b.title);
    });
}

/**
 * Format recurrence pattern for display (new pattern system)
 */
function formatPatternRecurrence(pattern: RecurringPatternType): string {
  const { type, interval, daysOfWeek, nthWeekday, specificDatesOfMonth, daysAfterCompletion, endCondition } = pattern;

  // Handle afterCompletion type
  if (type === 'afterCompletion' && daysAfterCompletion) {
    if (daysAfterCompletion % 7 === 0) {
      const weeks = daysAfterCompletion / 7;
      return `${weeks} week${weeks > 1 ? 's' : ''} after completion`;
    }
    return `${daysAfterCompletion} days after completion`;
  }

  let desc = interval > 1 ? `Every ${interval} ` : 'Every ';

  switch (type) {
    case 'daily':
      desc += interval > 1 ? 'days' : 'day';
      break;
    case 'weekly':
      desc += interval > 1 ? 'weeks' : 'week';
      if (daysOfWeek && daysOfWeek.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        desc += ` on ${daysOfWeek.map(d => dayNames[d]).join(', ')}`;
      }
      break;
    case 'monthly':
      desc += interval > 1 ? 'months' : 'month';
      if (nthWeekday) {
        const ordinals = ['', '1st', '2nd', '3rd', '4th', 'last'];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const nth = nthWeekday.n === -1 ? 'last' : ordinals[nthWeekday.n] || `${nthWeekday.n}th`;
        desc += ` on the ${nth} ${dayNames[nthWeekday.weekday]}`;
      } else if (specificDatesOfMonth && specificDatesOfMonth.length > 0) {
        desc += ` on the ${specificDatesOfMonth.join(', ')}`;
      }
      break;
    case 'yearly':
      desc += interval > 1 ? 'years' : 'year';
      break;
    default:
      desc = 'Custom pattern';
  }

  // Add end condition
  if (endCondition.type === 'date' && endCondition.endDate) {
    desc += ` until ${format(new Date(endCondition.endDate), 'MMM d, yyyy')}`;
  } else if (endCondition.type === 'occurrences' && endCondition.maxOccurrences) {
    desc += ` for ${endCondition.maxOccurrences} occurrences`;
  }

  return desc;
}

/**
 * Format recurrence pattern for display (legacy task system)
 */
function formatRecurrence(task: Task): string {
  if (!task.recurrence) return 'None';

  const { type, interval, daysOfWeek, endCondition } = task.recurrence;

  let pattern = interval > 1 ? `Every ${interval} ` : 'Every ';

  switch (type) {
    case 'daily':
      pattern += interval > 1 ? 'days' : 'day';
      break;
    case 'weekly':
      pattern += interval > 1 ? 'weeks' : 'week';
      if (daysOfWeek && daysOfWeek.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        pattern += ` on ${daysOfWeek.map(d => dayNames[d]).join(', ')}`;
      }
      break;
    case 'monthly':
      pattern += interval > 1 ? 'months' : 'month';
      break;
    case 'yearly':
      pattern += interval > 1 ? 'years' : 'year';
      break;
    default:
      pattern = 'Custom pattern';
  }

  if (endCondition.type === 'date' && endCondition.endDate) {
    const endDate = new Date(endCondition.endDate);
    const startDate = task.scheduledDate ? new Date(task.scheduledDate) : null;
    if (startDate && endDate <= startDate) {
      pattern += ' (ENDED)';
    } else {
      pattern += ` until ${format(endDate, 'MMM d, yyyy')}`;
    }
  } else if (endCondition.type === 'occurrences' && endCondition.maxOccurrences) {
    pattern += ` for ${endCondition.maxOccurrences} occurrences`;
  }

  return pattern;
}

// =============================================================================
// Component
// =============================================================================

/**
 * RecurringTasksManager - Modal for managing recurring patterns and tasks
 *
 * Features:
 * - View recurring patterns (new system)
 * - View legacy recurring parent tasks
 * - Delete patterns and their instances
 * - Shows pattern details: priority, recurrence rule, instance count
 *
 * @example
 * ```tsx
 * <RecurringTasksManager
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 */
export function RecurringTasksManager({
  isOpen,
  onClose,
  testId,
}: RecurringTasksManagerProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  // New system: recurring patterns
  const patterns = useAppSelector(selectRecurringPatternsArray);

  // Legacy system: parent tasks with embedded recurrence
  const legacyRecurringTasks = useAppSelector(selectRecurringParentTasks);

  const [patternToDelete, setPatternToDelete] = useState<RecurringPatternType | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteInstancesToo, setDeleteInstancesToo] = useState(true);
  const [clearingExceptionsTaskId, setClearingExceptionsTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'patterns' | 'legacy'>('patterns');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Get all tasks for pattern lookup
  const allTasks = useAppSelector(state => state.tasks.tasks);

  // Group legacy tasks by title to identify duplicates
  const taskGroups = useMemo(() => {
    const tasksArray = Object.values(legacyRecurringTasks);
    return groupTasksByTitle(tasksArray);
  }, [legacyRecurringTasks]);

  const totalPatterns = patterns.length;
  const totalLegacyTasks = Object.keys(legacyRecurringTasks).length;
  const legacyDuplicateCount = taskGroups.filter(g => g.isDuplicate).length;

  // Handle delete pattern
  const handleDeletePatternClick = (pattern: RecurringPatternType) => {
    setPatternToDelete(pattern);
    setDeleteInstancesToo(true);
  };

  const handleConfirmDeletePattern = async () => {
    if (!patternToDelete || !user) return;

    setIsDeleting(true);
    try {
      await dispatch(
        deleteRecurringPatternThunk({
          patternId: patternToDelete.id,
          userId: user.id,
          deleteInstances: deleteInstancesToo,
        })
      ).unwrap();
      setPatternToDelete(null);
    } catch (error) {
      console.error('Failed to delete recurring pattern:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle delete legacy task
  const handleDeleteLegacyClick = (task: Task) => {
    setTaskToDelete(task);
  };

  const handleConfirmDeleteLegacy = async () => {
    if (!taskToDelete || !user) return;

    setIsDeleting(true);
    try {
      await dispatch(hardDeleteTask({ taskId: taskToDelete.id, userId: user.id })).unwrap();
      setTaskToDelete(null);
    } catch (error) {
      console.error('Failed to delete recurring task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle clearing exceptions for legacy task
  const handleClearExceptions = async (task: Task) => {
    if (!user || !task.recurrence) return;

    setClearingExceptionsTaskId(task.id);
    try {
      await dispatch(updateTaskAsync({
        id: task.id,
        userId: user.id,
        recurrence: {
          ...task.recurrence,
          exceptions: [],
        },
      })).unwrap();
    } catch (error) {
      console.error('Failed to clear exceptions:', error);
    } finally {
      setClearingExceptionsTaskId(null);
    }
  };

  // Handle migration of legacy tasks to new pattern system
  const handleMigrateLegacyTasks = async () => {
    if (!user || totalLegacyTasks === 0) return;

    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const result = await dispatch(
        migrateRecurringTasksThunk({ userId: user.id })
      ).unwrap();

      setMigrationResult({
        success: true,
        message: `Migrated ${result.patternsCreated} patterns, generated ${result.instancesGenerated} instances${
          result.errors.length > 0 ? ` (${result.errors.length} errors)` : ''
        }`,
      });

      // Switch to patterns tab after successful migration
      if (result.patternsCreated > 0) {
        setActiveTab('patterns');
      }
    } catch (error) {
      setMigrationResult({
        success: false,
        message: error instanceof Error ? error.message : 'Migration failed',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Handle edit pattern - find a task instance and open edit modal
  const handleEditPatternClick = (pattern: RecurringPatternType) => {
    // Find the first task instance generated from this pattern
    const patternTasks = Object.values(allTasks).filter(
      t => t.recurringPatternId === pattern.id
    );
    if (patternTasks.length > 0) {
      // Pick the nearest future task or the most recent one
      const today = new Date().toISOString().split('T')[0];
      const futureTask = patternTasks
        .filter(t => t.scheduledDate && t.scheduledDate >= today)
        .sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''))[0];
      setTaskToEdit(futureTask || patternTasks[0]);
    }
  };

  // Handle edit legacy task
  const handleEditLegacyClick = (task: Task) => {
    setTaskToEdit(task);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Recurring Tasks"
        size="xl"
        testId={testId || 'recurring-tasks-manager'}
      >
        {/* Summary */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Recurring Patterns: <span className="text-amber-600">{totalPatterns}</span>
                {totalLegacyTasks > 0 && (
                  <span className="text-gray-500 ml-2">
                    (+ {totalLegacyTasks} legacy)
                  </span>
                )}
              </p>
            </div>
            {legacyDuplicateCount > 0 && (
              <div className="flex items-center gap-2 text-orange-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="text-sm font-medium">Legacy duplicates</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation (only show if both exist) */}
        {totalLegacyTasks > 0 && (
          <div className="flex gap-2 mb-4 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('patterns')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'patterns'
                  ? 'text-amber-600 border-amber-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Patterns ({totalPatterns})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('legacy')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'legacy'
                  ? 'text-amber-600 border-amber-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Legacy ({totalLegacyTasks})
            </button>
          </div>
        )}

        {/* Patterns List (New System) */}
        {(activeTab === 'patterns' || totalLegacyTasks === 0) && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {patterns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-base">No recurring patterns</p>
                <p className="text-sm text-gray-400 mt-1">Create a recurring task to see it here</p>
              </div>
            ) : (
              patterns.map((pattern) => (
                <div key={pattern.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100 text-amber-800 font-medium text-sm">
                            {pattern.priority.letter}{pattern.priority.number}
                          </span>
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {pattern.title}
                          </h3>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Pattern:</span>{' '}
                          <span className="text-gray-600">{formatPatternRecurrence(pattern)}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Started: {format(new Date(pattern.startDate), 'MMM d, yyyy')}
                          {pattern.generatedUntil && (
                            <span className="ml-3">
                              Generated until: {format(new Date(pattern.generatedUntil), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          ID: {pattern.id}
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleEditPatternClick(pattern)}
                          className="text-sm"
                          aria-label={`Edit pattern: ${pattern.title}`}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDeletePatternClick(pattern)}
                          className="text-sm"
                          aria-label={`Delete pattern: ${pattern.title}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Legacy Tasks List */}
        {activeTab === 'legacy' && totalLegacyTasks > 0 && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Migration Banner */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    Legacy Recurring Tasks
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    These tasks use the old embedded recurrence system. Migrate them to the new pattern system for better performance and features.
                  </p>
                  {migrationResult && (
                    <p className={`text-sm mt-2 ${migrationResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {migrationResult.message}
                    </p>
                  )}
                </div>
                <Button
                  variant="primary"
                  onClick={handleMigrateLegacyTasks}
                  disabled={isMigrating}
                  className="flex-shrink-0"
                >
                  {isMigrating ? 'Migrating...' : 'Migrate All'}
                </Button>
              </div>
            </div>
            {taskGroups.map((group, groupIndex) => (
              <div
                key={groupIndex}
                className={`border rounded-lg overflow-hidden ${
                  group.isDuplicate ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className={`px-4 py-3 border-b ${
                  group.isDuplicate ? 'border-orange-200 bg-orange-100' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">{group.title}</h3>
                      {group.isDuplicate && (
                        <p className="text-sm text-orange-700 mt-1">
                          {group.tasks.length} duplicates - consider deleting extras
                        </p>
                      )}
                    </div>
                    {group.isDuplicate && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-200 text-orange-800">
                        Duplicate
                      </span>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {group.tasks.map((task) => (
                    <div key={task.id} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-3 text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100 text-amber-800 font-medium">
                              {task.priority.letter}{task.priority.number}
                            </span>
                            {task.scheduledDate && (
                              <span className="text-gray-600">
                                Starts: {format(new Date(task.scheduledDate), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Pattern:</span>{' '}
                            <span className="text-gray-600">{formatRecurrence(task)}</span>
                          </div>
                          {task.recurrence && task.recurrence.exceptions.length > 0 && (
                            <div className="text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">Skipped:</span>
                                <span className="text-orange-600 font-medium">
                                  {task.recurrence.exceptions.length}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleClearExceptions(task)}
                                  disabled={clearingExceptionsTaskId === task.id}
                                  className="px-2 py-0.5 text-xs font-medium text-orange-700 bg-orange-100 border border-orange-300 rounded hover:bg-orange-200 disabled:opacity-50"
                                >
                                  {clearingExceptionsTaskId === task.id ? 'Clearing...' : 'Clear'}
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-gray-400 font-mono">ID: {task.id}</div>
                        </div>
                        <div className="flex-shrink-0 flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => handleEditLegacyClick(task)}
                            className="text-sm"
                            aria-label={`Edit task: ${task.title}`}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleDeleteLegacyClick(task)}
                            className="text-sm"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal>

      {/* Delete Pattern Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!patternToDelete}
        onClose={() => setPatternToDelete(null)}
        onConfirm={handleConfirmDeletePattern}
        title="Delete Recurring Pattern"
        message={
          <>
            <p>Are you sure you want to delete the pattern "{patternToDelete?.title}"?</p>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                id="delete-instances"
                checked={deleteInstancesToo}
                onChange={(e) => setDeleteInstancesToo(e.target.checked)}
                className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
              />
              <label htmlFor="delete-instances" className="text-sm text-gray-700">
                Also delete all generated task instances
              </label>
            </div>
          </>
        }
        confirmText="Delete Pattern"
        cancelText="Cancel"
        variant="danger"
        isProcessing={isDeleting}
      />

      {/* Delete Legacy Task Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDeleteLegacy}
        title="Delete Recurring Task"
        message={`Are you sure you want to permanently delete "${taskToDelete?.title}"? This will remove all future occurrences. This action cannot be undone.`}
        confirmText="Delete Permanently"
        cancelText="Cancel"
        variant="danger"
        isProcessing={isDeleting}
      />

      {/* Edit Task Modal */}
      {taskToEdit && (
        <EditTaskModal
          isOpen={!!taskToEdit}
          onClose={() => setTaskToEdit(null)}
          task={taskToEdit}
          onSuccess={() => setTaskToEdit(null)}
        />
      )}
    </>
  );
}

export default RecurringTasksManager;
