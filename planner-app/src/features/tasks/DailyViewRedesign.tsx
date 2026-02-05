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
