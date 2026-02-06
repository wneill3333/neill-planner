/**
 * DailyViewRedesign Component
 *
 * Redesigned daily view with:
 * - Flat task list (no priority group headers)
 * - Status dropdown instead of click-to-cycle
 * - Status legend at bottom
 * - Tabs for Tasks, Calendar, and Notes
 */

import { useState, useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectSelectedDate, selectTasksForSelectedDate, selectTasksSyncStatus } from './taskSlice';
import { selectHideCompletedTasks, toggleHideCompletedTasks } from '../filters/filterSlice';
import { reorderTasks } from './taskThunks';
import { DateNavigationContainer } from './DateNavigationContainer';
import { FlatTaskListContainer } from './FlatTaskListContainer';
import { CreateTaskModal } from './CreateTaskModal';
import { EditTaskModal } from './EditTaskModal';
import { Tabs, TabPanel, type Tab, FloatingActionButton } from '../../components/common';
import { CheckIcon, CalendarIcon, NoteIcon } from '../../components/icons';
import { StatusLegend } from '../../components/tasks';
import { hasGapsInPriorityNumbering } from '../../utils/priorityUtils';
import { useAuth } from '../auth';
import type { Task } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface DailyViewRedesignProps {
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
 * DailyViewRedesign - Redesigned daily planning view
 *
 * Layout structure:
 * - Date navigation at top
 * - Tab bar for switching between Tasks/Calendar/Notes
 * - Flat task list (no priority headers)
 * - Status legend at bottom
 * - FloatingActionButton for adding tasks
 */
export function DailyViewRedesign({ className, testId }: DailyViewRedesignProps = {}) {
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
  const hideCompleted = useAppSelector(selectHideCompletedTasks);

  // Check if there are gaps in priority numbering
  const needsReorder = hasGapsInPriorityNumbering(tasks);

  /**
   * Tab definitions
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
   * Handle task click - opens edit modal
   */
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  }, []);

  /**
   * Handle edit modal close
   */
  const handleEditModalClose = useCallback(() => {
    setSelectedTask(null);
    setIsEditModalOpen(false);
  }, []);

  /**
   * Handle FAB click - opens create modal
   */
  const handleOpenCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  /**
   * Handle reorder all tasks
   */
  const handleReorderAll = useCallback(async () => {
    if (!user || isReordering) return;

    setIsReordering(true);
    try {
      await dispatch(reorderTasks({ date: selectedDate, userId: user.id })).unwrap();
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
    } finally {
      setIsReordering(false);
    }
  }, [dispatch, selectedDate, user, isReordering]);

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === 'tasks' || tabId === 'calendar' || tabId === 'notes') {
      setActiveTab(tabId);
    }
  }, []);

  return (
    <div className={className} data-testid={testId || 'daily-view-redesign'}>
      {/* Date Navigation */}
      <section className="mb-6" aria-label="Date navigation">
        <DateNavigationContainer />
      </section>

      {/* Tab Bar */}
      <section className="bg-white rounded-t-lg shadow-md" aria-label="View selection">
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
            <div className="p-4">
              <FlatTaskListContainer
                onTaskClick={handleTaskClick}
                testId="daily-view-task-list"
              />
            </div>
          </TabPanel>

          {/* Calendar Panel - Placeholder */}
          <TabPanel
            tabId="calendar"
            isActive={activeTab === 'calendar'}
            className="p-8 text-center"
          >
            <p className="text-gray-600">Calendar view coming soon...</p>
          </TabPanel>

          {/* Notes Panel - Placeholder */}
          <TabPanel
            tabId="notes"
            isActive={activeTab === 'notes'}
            className="p-8 text-center"
          >
            <p className="text-gray-600">Notes view coming soon...</p>
          </TabPanel>
        </div>
      </section>

      {/* Footer - Status Legend and Actions */}
      {activeTab === 'tasks' && (
        <section
          className="mt-4 bg-white rounded-b-lg shadow-md p-4"
          aria-label="Task status legend and actions"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Status Legend */}
            <StatusLegend compact testId="status-legend" />

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Hide Completed Toggle */}
              <button
                type="button"
                onClick={() => dispatch(toggleHideCompletedTasks())}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full
                  transition-colors duration-150
                  ${hideCompleted
                    ? 'bg-amber-100 text-amber-700 border border-amber-300'
                    : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                  }
                `}
                aria-pressed={hideCompleted}
                aria-label={hideCompleted ? 'Show all tasks' : 'Hide completed tasks'}
                data-testid="hide-completed-toggle"
              >
                {hideCompleted ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
                {hideCompleted ? 'Showing Active' : 'Hide Done'}
              </button>

              {/* Reorder Button (only when needed) */}
              {needsReorder && tasks.length > 0 && (
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
                  aria-label="Reorder all tasks"
                  data-testid="reorder-all-button"
                >
                  {isReordering ? 'Reordering...' : 'Reorder All'}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FloatingActionButton */}
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

export default DailyViewRedesign;
