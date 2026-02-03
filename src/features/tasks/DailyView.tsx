/**
 * DailyView Component
 *
 * Main daily view layout with tabs for Tasks, Calendar, and Notes.
 * Integrates date navigation and provides unified daily planning interface.
 */

import { useState, useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectSelectedDate, selectTasksForSelectedDate, selectTasksSyncStatus } from './taskSlice';
import { reorderTasks } from './taskThunks';
import { DateNavigationContainer } from './DateNavigationContainer';
import { TaskListContainer } from './TaskListContainer';
import { CreateTaskModal } from './CreateTaskModal';
import { EditTaskModal } from './EditTaskModal';
import { Tabs, TabPanel, type Tab, FloatingActionButton } from '../../components/common';
import { CheckIcon, CalendarIcon, NoteIcon } from '../../components/icons';
import { hasGapsInPriorityNumbering } from '../../utils/priorityUtils';
import { useAuth } from '../auth';
import type { Task } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface DailyViewProps {
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

type TabValue = 'tasks' | 'calendar' | 'notes';

// =============================================================================
// Component
// =============================================================================

/**
 * DailyView - Main daily planning view
 *
 * Layout structure:
 * - Date navigation at top
 * - Tab bar for switching between Tasks/Calendar/Notes
 * - Tab content area
 * - Footer with action buttons
 * - FloatingActionButton for adding tasks (Tasks tab only)
 *
 * Features:
 * - Task list integration
 * - Calendar view (placeholder)
 * - Notes view (placeholder)
 * - Reorder tasks functionality
 * - FloatingActionButton for quick task creation
 *
 * @example
 * ```tsx
 * <DailyView />
 * ```
 */
export function DailyView({ className, testId }: DailyViewProps = {}) {
  const [activeTab, setActiveTab] = useState<TabValue>('tasks');
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
   * Tab definitions for DailyView
   * Using useMemo to avoid creating new icon instances on every render
   */
  const dailyViewTabs = useMemo<Tab[]>(
    () => [
      {
        id: 'tasks',
        label: 'Tasks',
        icon: <CheckIcon />,
      },
      {
        id: 'calendar',
        label: 'Calendar',
        icon: <CalendarIcon />,
      },
      {
        id: 'notes',
        label: 'Notes',
        icon: <NoteIcon />,
      },
    ],
    []
  );

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
   * Handle FAB click - opens create task modal
   */
  const handleOpenCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
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

  /**
   * Handle tab change with runtime validation
   */
  const handleTabChange = useCallback((tabId: string) => {
    // Runtime validation to ensure type safety
    if (tabId === 'tasks' || tabId === 'calendar' || tabId === 'notes') {
      setActiveTab(tabId);
    } else {
      console.warn(`Invalid tab ID: ${tabId}`);
    }
  }, []);

  return (
    <div className={className} data-testid={testId || 'daily-view'}>
      {/* Date Navigation */}
      <section
        className="mb-6"
        aria-label="Date navigation"
      >
        <DateNavigationContainer />
      </section>

      {/* Tab Bar */}
      <section
        className="bg-white rounded-t-lg shadow-md"
        aria-label="View selection"
      >
        <Tabs
          tabs={dailyViewTabs}
          activeTabId={activeTab}
          onTabChange={handleTabChange}
          ariaLabel="Daily view tabs"
        />

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* Tasks Panel */}
          <TabPanel tabId="tasks" isActive={activeTab === 'tasks'}>
            <TaskListContainer
              onTaskClick={handleTaskClick}
              testId="daily-view-task-list"
            />
          </TabPanel>

          {/* Calendar Panel - Placeholder */}
          <TabPanel
            tabId="calendar"
            isActive={activeTab === 'calendar'}
            className="p-8 text-center"
          >
            <p className="text-gray-600">
              Calendar view coming soon...
            </p>
          </TabPanel>

          {/* Notes Panel - Placeholder */}
          <TabPanel
            tabId="notes"
            isActive={activeTab === 'notes'}
            className="p-8 text-center"
          >
            <p className="text-gray-600">
              Notes view coming soon...
            </p>
          </TabPanel>
        </div>
      </section>

      {/* Footer Actions - Only show for Tasks tab when reorder is needed */}
      {activeTab === 'tasks' && needsReorder && tasks.length > 0 && (
        <section
          className="mt-4 bg-white rounded-b-lg shadow-md p-4"
          aria-label="Task actions"
        >
          <div className="flex items-center justify-start gap-4">
            {/* Reorder All Button - only shows when there are gaps in numbering */}
            <button
              type="button"
              onClick={handleReorderAll}
              disabled={isReordering || syncStatus === 'syncing'}
              className="
                px-4 py-2 text-sm font-medium
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
          </div>
        </section>
      )}

      {/*
       * FloatingActionButton for quick task creation
       * Only visible on Tasks tab - hidden on Calendar/Notes tabs
       * as those views will have their own contextual actions
       */}
      {activeTab === 'tasks' && (
        <FloatingActionButton
          icon="plus"
          ariaLabel="Add new task"
          onClick={handleOpenCreateModal}
          testId="daily-view-fab"
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => setIsCreateModalOpen(false)}
        testId="daily-view-create-modal"
      />

      {/* Edit Task Modal */}
      {isEditModalOpen && selectedTask && (
        <EditTaskModal
          isOpen={isEditModalOpen}
          task={selectedTask}
          onClose={handleEditModalClose}
          onSuccess={handleEditModalClose}
          testId="daily-view-edit-modal"
        />
      )}
    </div>
  );
}

export default DailyView;
