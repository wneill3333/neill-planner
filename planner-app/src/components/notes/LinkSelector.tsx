/**
 * LinkSelector Component
 *
 * Modal for selecting tasks and events to link to a note.
 */

import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Modal, Tabs, Input, type Tab } from '../common';
import type { Task, Event } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface LinkSelectorProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Available tasks to link */
  tasks: Task[];
  /** Available events to link */
  events: Event[];
  /** Currently selected task IDs */
  selectedTaskIds: string[];
  /** Currently selected event IDs */
  selectedEventIds: string[];
  /** Callback when selection is confirmed */
  onConfirm: (taskIds: string[], eventIds: string[]) => void;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * LinkSelector - Modal for selecting linked items
 *
 * Features:
 * - Two tabs: Tasks and Events
 * - Search/filter by title
 * - Checkboxes to select items
 * - Shows currently linked items as checked
 * - Apply/Cancel buttons
 *
 * @example
 * ```tsx
 * <LinkSelector
 *   isOpen={isOpen}
 *   tasks={tasks}
 *   events={events}
 *   selectedTaskIds={['task-1']}
 *   selectedEventIds={[]}
 *   onConfirm={(taskIds, eventIds) => setLinks(taskIds, eventIds)}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 */
export const LinkSelector = memo(function LinkSelector({
  isOpen,
  tasks,
  events,
  selectedTaskIds,
  selectedEventIds,
  onConfirm,
  onClose,
  testId,
}: LinkSelectorProps) {
  const [activeTab, setActiveTab] = useState<string>('tasks');
  const [taskSearch, setTaskSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [tempSelectedTaskIds, setTempSelectedTaskIds] = useState<string[]>(selectedTaskIds);
  const [tempSelectedEventIds, setTempSelectedEventIds] = useState<string[]>(selectedEventIds);

  // Tab definitions
  const tabs: Tab[] = [
    { id: 'tasks', label: 'Tasks' },
    { id: 'events', label: 'Events' },
  ];

  // Filter tasks by search
  const filteredTasks = useMemo(() => {
    if (!taskSearch) return tasks;
    const search = taskSearch.toLowerCase();
    return tasks.filter(task => task.title.toLowerCase().includes(search));
  }, [tasks, taskSearch]);

  // Filter events by search
  const filteredEvents = useMemo(() => {
    if (!eventSearch) return events;
    const search = eventSearch.toLowerCase();
    return events.filter(event => event.title.toLowerCase().includes(search));
  }, [events, eventSearch]);

  // Sync temporary state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempSelectedTaskIds(selectedTaskIds);
      setTempSelectedEventIds(selectedEventIds);
      setTaskSearch('');
      setEventSearch('');
    }
  }, [isOpen, selectedTaskIds, selectedEventIds]);

  // Handle task checkbox toggle
  const handleTaskToggle = useCallback((taskId: string) => {
    setTempSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  }, []);

  // Handle event checkbox toggle
  const handleEventToggle = useCallback((eventId: string) => {
    setTempSelectedEventIds(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  }, []);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    onConfirm(tempSelectedTaskIds, tempSelectedEventIds);
    onClose();
  }, [onConfirm, tempSelectedTaskIds, tempSelectedEventIds, onClose]);

  // Handle cancel - reset temp selections
  const handleCancel = useCallback(() => {
    setTempSelectedTaskIds(selectedTaskIds);
    setTempSelectedEventIds(selectedEventIds);
    setTaskSearch('');
    setEventSearch('');
    onClose();
  }, [selectedTaskIds, selectedEventIds, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Link to Tasks/Events"
      size="lg"
      testId={testId || 'link-selector-modal'}
    >
      <div className="space-y-4">
        {/* Tabs */}
        <Tabs
          tabs={tabs}
          activeTabId={activeTab}
          onTabChange={setActiveTab}
          ariaLabel="Link type selection"
        />

        {/* Tasks Panel */}
        {activeTab === 'tasks' && (
          <div className="space-y-3" data-testid="tasks-link-panel">
            {/* Search */}
            <Input
              label="Search Tasks"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              placeholder="Filter by title..."
              testId="task-search-input"
            />

            {/* Task List */}
            <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg">
              {filteredTasks.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No tasks found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredTasks.map(task => (
                    <label
                      key={task.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                      data-testid={`task-option-${task.id}`}
                    >
                      <input
                        type="checkbox"
                        checked={tempSelectedTaskIds.includes(task.id)}
                        onChange={() => handleTaskToggle(task.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        data-testid={`task-checkbox-${task.id}`}
                      />
                      <span className="flex-1 text-sm text-gray-900">{task.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500">
              {tempSelectedTaskIds.length} task(s) selected
            </p>
          </div>
        )}

        {/* Events Panel */}
        {activeTab === 'events' && (
          <div className="space-y-3" data-testid="events-link-panel">
            {/* Search */}
            <Input
              label="Search Events"
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              placeholder="Filter by title..."
              testId="event-search-input"
            />

            {/* Event List */}
            <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg">
              {filteredEvents.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No events found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredEvents.map(event => (
                    <label
                      key={event.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                      data-testid={`event-option-${event.id}`}
                    >
                      <input
                        type="checkbox"
                        checked={tempSelectedEventIds.includes(event.id)}
                        onChange={() => handleEventToggle(event.id)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                        data-testid={`event-checkbox-${event.id}`}
                      />
                      <span className="flex-1 text-sm text-gray-900">{event.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500">
              {tempSelectedEventIds.length} event(s) selected
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            data-testid="cancel-link-button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            data-testid="confirm-link-button"
          >
            Apply
          </button>
        </div>
      </div>
    </Modal>
  );
});
