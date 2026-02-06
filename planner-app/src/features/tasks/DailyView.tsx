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
import { FlatTaskListContainer } from './FlatTaskListContainer';
import { CreateTaskModal } from './CreateTaskModal';
import { StatusLegend } from '../../components/tasks';
import { EditTaskModal } from './EditTaskModal';
import { NoteListContainer } from '../notes/NoteListContainer';
import { NoteFormModal } from '../notes/NoteFormModal';
import { Tabs, TabPanel, Modal, type Tab } from '../../components/common';
import { CheckIcon, CalendarIcon, NoteIcon } from '../../components/icons';
import { hasGapsInPriorityNumbering } from '../../utils/priorityUtils';
import { parseISODateString } from '../../utils/firestoreUtils';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { selectHideCompletedTasks, toggleHideCompletedTasks } from '../filters/filterSlice';
import { useAuth } from '../auth';
import { useEventsByDate, useEventsByRange, createEventAsync, updateEventAsync, deleteEventAsync } from '../events';
import { selectCategoriesMap, selectAllCategories } from '../categories/categorySlice';
import { setSelectedDate } from './taskSlice';
import { TimeBlockCalendar, EventForm, WeekView, MonthView } from '../../components/events';
import { normalizeToDateString } from '../../utils/dateUtils';
import type { Task, Note, Event, CreateEventInput } from '../../types';

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
type CalendarViewType = 'day' | 'week' | 'month';

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
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Event modal state
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [defaultEventStartTime, setDefaultEventStartTime] = useState<Date | null>(null);
  const [isEventSubmitting, setIsEventSubmitting] = useState(false);

  // Calendar view type state (day/week/month)
  const [calendarViewType, setCalendarViewType] = useState<CalendarViewType>('day');

  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const selectedDate = useAppSelector(selectSelectedDate);
  const tasks = useAppSelector(selectTasksForSelectedDate);
  const syncStatus = useAppSelector(selectTasksSyncStatus);
  const hideCompleted = useAppSelector(selectHideCompletedTasks);

  // Event and category selectors
  // Use parseISODateString to create local midnight (new Date("2026-02-05") would be UTC midnight!)
  const selectedDateObj = useMemo(() => parseISODateString(selectedDate), [selectedDate]);
  const { events } = useEventsByDate(selectedDateObj, user?.id ?? null);
  const categoriesMap = useAppSelector(selectCategoriesMap);
  const categoriesArray = useAppSelector(selectAllCategories);

  // Calculate date ranges for week and month views
  const weekRange = useMemo(() => ({
    start: startOfWeek(selectedDateObj),
    end: endOfWeek(selectedDateObj),
  }), [selectedDateObj]);

  const monthRange = useMemo(() => ({
    start: startOfMonth(selectedDateObj),
    end: endOfMonth(selectedDateObj),
  }), [selectedDateObj]);

  // Fetch events for range (used by week and month views)
  const { events: rangeEvents } = useEventsByRange(
    calendarViewType === 'week' ? weekRange.start : monthRange.start,
    calendarViewType === 'week' ? weekRange.end : monthRange.end,
    user?.id ?? null
  );

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
   * Handle note click - opens edit note modal with selected note
   */
  const handleNoteClick = useCallback((note: Note) => {
    setSelectedNote(note);
    setIsEditNoteModalOpen(true);
  }, []);

  /**
   * Handle edit note modal close - clears selected note and closes modal
   */
  const handleEditNoteModalClose = useCallback(() => {
    setSelectedNote(null);
    setIsEditNoteModalOpen(false);
  }, []);

  /**
   * Handle create note button click - opens create note modal
   */
  const handleOpenCreateNoteModal = useCallback(() => {
    setIsCreateNoteModalOpen(true);
  }, []);

  /**
   * Handle create event from calendar click
   */
  const handleCreateEvent = useCallback((startTime: Date, _endTime: Date) => {
    setDefaultEventStartTime(startTime);
    setSelectedEvent(null);
    setIsCreateEventModalOpen(true);
  }, []);

  /**
   * Handle event click - opens edit modal with selected event
   */
  const handleEventClick = useCallback((event: Event) => {
    setSelectedEvent(event);
    setIsEditEventModalOpen(true);
  }, []);

  /**
   * Handle edit event modal close
   */
  const handleEditEventModalClose = useCallback(() => {
    setSelectedEvent(null);
    setIsEditEventModalOpen(false);
  }, []);

  /**
   * Handle create event modal close
   */
  const handleCreateEventModalClose = useCallback(() => {
    setDefaultEventStartTime(null);
    setIsCreateEventModalOpen(false);
  }, []);

  /**
   * Handle event form submit (create)
   */
  const handleEventCreate = useCallback(async (data: CreateEventInput) => {
    if (!user) return;

    setIsEventSubmitting(true);
    try {
      await dispatch(createEventAsync({ input: data, userId: user.id })).unwrap();
      setIsCreateEventModalOpen(false);
      setDefaultEventStartTime(null);
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsEventSubmitting(false);
    }
  }, [dispatch, user]);

  /**
   * Handle event form submit (update)
   */
  const handleEventUpdate = useCallback(async (data: CreateEventInput) => {
    if (!user || !selectedEvent) return;

    setIsEventSubmitting(true);
    try {
      await dispatch(updateEventAsync({
        id: selectedEvent.id,
        userId: user.id,
        ...data,
      })).unwrap();
      setIsEditEventModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to update event:', error);
    } finally {
      setIsEventSubmitting(false);
    }
  }, [dispatch, user, selectedEvent]);

  /**
   * Handle event delete
   */
  const handleEventDelete = useCallback(async () => {
    if (!user || !selectedEvent) return;

    setIsEventSubmitting(true);
    try {
      await dispatch(deleteEventAsync({ eventId: selectedEvent.id, userId: user.id })).unwrap();
      setIsEditEventModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to delete event:', error);
    } finally {
      setIsEventSubmitting(false);
    }
  }, [dispatch, user, selectedEvent]);

  /**
   * Handle event time change from drag-and-drop
   */
  const handleEventTimeChange = useCallback(async (event: Event, newStartTime: Date, newEndTime: Date) => {
    if (!user) return;

    try {
      await dispatch(updateEventAsync({
        id: event.id,
        userId: user.id,
        title: event.title,
        description: event.description,
        startTime: newStartTime,
        endTime: newEndTime,
        categoryId: event.categoryId,
        location: event.location,
        isConfidential: event.isConfidential,
        alternateTitle: event.alternateTitle,
        recurrence: event.recurrence,
        linkedNoteIds: event.linkedNoteIds,
        linkedTaskIds: event.linkedTaskIds,
      })).unwrap();
    } catch (error) {
      console.error('Failed to update event time:', error);
    }
  }, [dispatch, user]);

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

  /**
   * Handle calendar navigation (prev/next/today buttons in week/month views)
   * Updates the selected date but stays in the current view
   */
  const handleCalendarNavigation = useCallback((date: Date) => {
    dispatch(setSelectedDate(normalizeToDateString(date)));
  }, [dispatch]);

  /**
   * Handle clicking a specific day in week/month views
   * Updates the selected date AND switches to day view
   */
  const handleCalendarDayClick = useCallback((date: Date) => {
    dispatch(setSelectedDate(normalizeToDateString(date)));
    setCalendarViewType('day');
  }, [dispatch]);

  return (
    <div className={className} data-testid={testId || 'daily-view'}>
      {/* Date Navigation */}
      <section
        className="mb-6"
        aria-label="Date navigation"
      >
        <DateNavigationContainer
          navigationStep={activeTab === 'calendar' ? calendarViewType : 'day'}
        />
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
            {/* Action Buttons Row - Top of task panel */}
            <div className="flex items-center justify-between gap-2 p-4 pb-2 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Daily Tasks</h2>
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

                {/* Add Task Button */}
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="
                    flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                    text-white bg-green-600
                    border border-green-700 rounded-md
                    hover:bg-green-700
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                    transition-colors duration-150
                  "
                  aria-label="Add new task"
                  data-testid="add-task-button"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Task
                </button>
              </div>
            </div>

            {/* Task List */}
            <div className="p-4 pt-2">
              <FlatTaskListContainer
                onTaskClick={handleTaskClick}
                testId="daily-view-task-list"
              />
            </div>
          </TabPanel>

          {/* Calendar Panel */}
          <TabPanel
            tabId="calendar"
            isActive={activeTab === 'calendar'}
          >
            {/* Action Buttons Row - Top of calendar panel */}
            <div className="flex items-center justify-between gap-2 p-4 pb-2 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                {calendarViewType === 'day' ? 'Daily' : calendarViewType === 'week' ? 'Weekly' : 'Monthly'} Calendar
              </h2>
              <div className="flex items-center gap-2">
                {/* View Switcher - Segmented Button Group */}
                <div className="flex rounded-lg bg-gray-100 p-0.5" role="group" aria-label="Calendar view">
                  <button
                    type="button"
                    onClick={() => setCalendarViewType('day')}
                    className={`
                      px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                      ${calendarViewType === 'day'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                      }
                    `}
                    aria-pressed={calendarViewType === 'day'}
                    data-testid="calendar-view-day"
                  >
                    Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarViewType('week')}
                    className={`
                      px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                      ${calendarViewType === 'week'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                      }
                    `}
                    aria-pressed={calendarViewType === 'week'}
                    data-testid="calendar-view-week"
                  >
                    Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarViewType('month')}
                    className={`
                      px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                      ${calendarViewType === 'month'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                      }
                    `}
                    aria-pressed={calendarViewType === 'month'}
                    data-testid="calendar-view-month"
                  >
                    Month
                  </button>
                </div>

                {/* Add Event Button - only show in day view */}
                {calendarViewType === 'day' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDefaultEventStartTime(null);
                      setIsCreateEventModalOpen(true);
                    }}
                    className="
                      flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                      text-white bg-amber-600
                      border border-amber-700 rounded-md
                      hover:bg-amber-700
                      focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                      transition-colors duration-150
                    "
                    aria-label="Add new event"
                    data-testid="add-event-button"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Event
                  </button>
                )}
              </div>
            </div>

            {/* Calendar View Content */}
            <div className="h-[600px] overflow-hidden">
              {/* Day View - TimeBlockCalendar */}
              {calendarViewType === 'day' && (
                <TimeBlockCalendar
                  events={events}
                  selectedDate={selectedDateObj}
                  categories={categoriesMap}
                  onCreateEvent={handleCreateEvent}
                  onEventClick={handleEventClick}
                  onEventTimeChange={handleEventTimeChange}
                />
              )}

              {/* Week View */}
              {calendarViewType === 'week' && (
                <WeekView
                  events={rangeEvents}
                  selectedDate={selectedDateObj}
                  categories={categoriesMap}
                  onDateSelect={handleCalendarNavigation}
                  onDayClick={handleCalendarDayClick}
                  onEventClick={handleEventClick}
                />
              )}

              {/* Month View */}
              {calendarViewType === 'month' && (
                <MonthView
                  events={rangeEvents}
                  selectedDate={selectedDateObj}
                  categories={categoriesMap}
                  onDateSelect={handleCalendarNavigation}
                  onDayClick={handleCalendarDayClick}
                  onEventClick={handleEventClick}
                />
              )}
            </div>
          </TabPanel>

          {/* Notes Panel */}
          <TabPanel tabId="notes" isActive={activeTab === 'notes'}>
            {/* Action Buttons Row - Top of notes panel */}
            <div className="flex items-center justify-between gap-2 p-4 pb-2 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Daily Notes</h2>
              <div className="flex items-center gap-2">
                {/* Add Note Button */}
                <button
                  type="button"
                  onClick={handleOpenCreateNoteModal}
                  className="
                    flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                    text-white bg-blue-600
                    border border-blue-700 rounded-md
                    hover:bg-blue-700
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    transition-colors duration-150
                  "
                  aria-label="Add new note"
                  data-testid="add-note-button"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Note
                </button>
              </div>
            </div>

            {/* Notes List */}
            <div className="p-4 pt-2">
              <NoteListContainer
                onNoteClick={handleNoteClick}
                testId="daily-view-note-list"
              />
            </div>
          </TabPanel>
        </div>
      </section>

      {/* Footer - Status Legend */}
      {activeTab === 'tasks' && (
        <section
          className="mt-4 bg-white rounded-b-lg shadow-md p-4"
          aria-label="Task status legend"
        >
          <StatusLegend compact testId="status-legend" />
        </section>
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

      {/* Create Note Modal */}
      <NoteFormModal
        isOpen={isCreateNoteModalOpen}
        onClose={() => setIsCreateNoteModalOpen(false)}
        onSuccess={() => setIsCreateNoteModalOpen(false)}
        testId="daily-view-create-note-modal"
      />

      {/* Edit Note Modal */}
      {isEditNoteModalOpen && selectedNote && (
        <NoteFormModal
          isOpen={isEditNoteModalOpen}
          note={selectedNote}
          onClose={handleEditNoteModalClose}
          onSuccess={handleEditNoteModalClose}
          testId="daily-view-edit-note-modal"
        />
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={isCreateEventModalOpen}
        onClose={handleCreateEventModalClose}
        title="Create Event"
        size="lg"
        testId="daily-view-create-event-modal"
      >
        <EventForm
          categories={categoriesArray}
          defaultStartTime={defaultEventStartTime}
          onSubmit={handleEventCreate}
          onCancel={handleCreateEventModalClose}
          isSubmitting={isEventSubmitting}
          testId="create-event-form"
        />
      </Modal>

      {/* Edit Event Modal */}
      {isEditEventModalOpen && selectedEvent && (
        <Modal
          isOpen={isEditEventModalOpen}
          onClose={handleEditEventModalClose}
          title="Edit Event"
          size="lg"
          testId="daily-view-edit-event-modal"
        >
          <div className="space-y-4">
            <EventForm
              event={selectedEvent}
              categories={categoriesArray}
              onSubmit={handleEventUpdate}
              onCancel={handleEditEventModalClose}
              isSubmitting={isEventSubmitting}
              testId="edit-event-form"
            />
            {/* Delete button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleEventDelete}
                disabled={isEventSubmitting}
                className="
                  w-full px-4 py-2 text-sm font-medium
                  text-red-600 bg-red-50
                  border border-red-200 rounded-md
                  hover:bg-red-100 hover:text-red-700
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-150
                "
              >
                {isEventSubmitting ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DailyView;
