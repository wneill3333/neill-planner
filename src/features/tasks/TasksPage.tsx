/**
 * TasksPage Component
 *
 * Main page for viewing and managing tasks.
 * Displays the task list, selected date, and provides a floating action button
 * to create new tasks.
 */

import { useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectSelectedDate, selectTasksForSelectedDate, selectTasksSyncStatus } from './taskSlice';
import { reorderTasks } from './taskThunks';
import { TaskListContainer } from './TaskListContainer';
import { CreateTaskModal } from './CreateTaskModal';
import { EditTaskModal } from './EditTaskModal';
import { FloatingActionButton } from '../../components/common/FloatingActionButton';
import { hasGapsInPriorityNumbering } from '../../utils/priorityUtils';
import { useAuth } from '../auth';
import type { Task } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface TasksPageProps {
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format date for display
 */
function formatDateForDisplay(dateString: string): string {
  try {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if date is today
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    // Check if date is tomorrow
    const isTomorrow =
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear();

    if (isToday) {
      return 'Today';
    } else if (isTomorrow) {
      return 'Tomorrow';
    } else {
      // Format as "Day, Month Date, Year" (e.g., "Monday, January 15, 2024")
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

// =============================================================================
// Component
// =============================================================================

/**
 * TasksPage - Main tasks view page
 *
 * Features:
 * - Header with app title
 * - Selected date display
 * - TaskListContainer for displaying tasks
 * - FloatingActionButton for creating new tasks
 * - CreateTaskModal integration
 *
 * @example
 * ```tsx
 * <TasksPage />
 * ```
 */
export function TasksPage({ testId }: TasksPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const selectedDate = useAppSelector(selectSelectedDate);
  const tasks = useAppSelector(selectTasksForSelectedDate);
  const syncStatus = useAppSelector(selectTasksSyncStatus);

  // Check if there are gaps in priority numbering that can be cleaned up
  const needsReorder = hasGapsInPriorityNumbering(tasks);

  /**
   * Handle task click - opens edit modal with selected task
   */
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  }, []);

  /**
   * Handle edit modal close - clears selected task and closes modal
   */
  const handleEditModalClose = useCallback(() => {
    setSelectedTask(null);
    setIsEditModalOpen(false);
  }, []);

  /**
   * Handle reorder all tasks - fills gaps in priority numbering
   */
  const handleReorderAll = useCallback(async () => {
    if (!user || isReordering) return;

    setIsReordering(true);
    try {
      await dispatch(reorderTasks({ date: selectedDate, userId: user.id })).unwrap();
    } catch (error) {
      // Error is handled by the slice
      console.error('Failed to reorder tasks:', error);
    } finally {
      setIsReordering(false);
    }
  }, [dispatch, selectedDate, user, isReordering]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      {/* Skip to main content link for keyboard accessibility */}
      <a
        href="#main-content"
        className="
          sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
          bg-amber-500 text-white px-4 py-2 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2
          z-50
        "
      >
        Skip to main content
      </a>

      {/* Header */}
      <header
        className="shadow-lg bg-gradient-to-r from-amber-700 to-amber-600"
        role="banner"
      >
        <div className="max-w-4xl px-4 py-4 mx-auto sm:py-6">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Neill Planner
          </h1>
          <p className="mt-1 text-sm text-amber-100 sm:text-base">
            Franklin-Covey Productivity System
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        className="max-w-4xl px-4 py-6 mx-auto sm:py-8"
        role="main"
        data-testid={testId || 'tasks-page'}
      >
        {/* Date Header */}
        <section
          className="mb-6"
          aria-labelledby="selected-date-heading"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                id="selected-date-heading"
                className="text-xl font-semibold text-gray-800 sm:text-2xl"
              >
                {formatDateForDisplay(selectedDate)}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Tasks scheduled for {selectedDate}
              </p>
            </div>

            {/* Reorder All Button - only shows when there are gaps in numbering */}
            {needsReorder && tasks.length > 0 && (
              <button
                type="button"
                onClick={handleReorderAll}
                disabled={isReordering || syncStatus === 'syncing'}
                className="
                  px-3 py-1.5 text-sm font-medium
                  text-amber-700 bg-amber-100
                  border border-amber-300 rounded-md
                  hover:bg-amber-200 hover:text-amber-800
                  focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-150
                "
                aria-label="Reorder all tasks to fill gaps in priority numbering"
                data-testid="reorder-all-button"
              >
                {isReordering ? 'Reordering...' : 'Reorder All'}
              </button>
            )}
          </div>
        </section>

        {/* Tasks Section */}
        <section
          className="bg-white rounded-lg shadow-md"
          aria-labelledby="tasks-heading"
        >
          <div className="sr-only">
            <h2 id="tasks-heading">Your Tasks</h2>
          </div>
          <TaskListContainer
            emptyMessage="No tasks scheduled for this date. Click the + button to create a task."
            onTaskClick={handleTaskClick}
            testId="tasks-page-list"
          />
        </section>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon="plus"
        ariaLabel="Create new task"
        onClick={() => setIsCreateModalOpen(true)}
        testId="create-task-fab"
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => setIsCreateModalOpen(false)}
        testId="tasks-page-create-modal"
      />

      {/* Edit Task Modal */}
      {isEditModalOpen && selectedTask && (
        <EditTaskModal
          isOpen={isEditModalOpen}
          task={selectedTask}
          onClose={handleEditModalClose}
          onSuccess={handleEditModalClose}
          testId="tasks-page-edit-modal"
        />
      )}
    </div>
  );
}

export default TasksPage;
