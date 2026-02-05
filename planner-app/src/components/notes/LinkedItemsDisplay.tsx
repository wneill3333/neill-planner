/**
 * LinkedItemsDisplay Component
 *
 * Displays linked tasks and events as removable chips.
 */

import { memo } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface LinkedItemsDisplayProps {
  /** Linked tasks with their titles */
  linkedTasks?: Array<{ id: string; title: string }>;
  /** Linked events with their titles */
  linkedEvents?: Array<{ id: string; title: string }>;
  /** Callback when a task link is removed */
  onRemoveTask?: (taskId: string) => void;
  /** Callback when an event link is removed */
  onRemoveEvent?: (eventId: string) => void;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * LinkedItemsDisplay - Show linked items as removable chips
 *
 * Features:
 * - Task chips with title and remove button
 * - Event chips with title and remove button
 * - Empty state when no links
 * - Visual differentiation (tasks = blue, events = purple)
 *
 * @example
 * ```tsx
 * <LinkedItemsDisplay
 *   linkedTasks={[{ id: 'task-1', title: 'My Task' }]}
 *   linkedEvents={[{ id: 'event-1', title: 'My Event' }]}
 *   onRemoveTask={handleRemoveTask}
 *   onRemoveEvent={handleRemoveEvent}
 * />
 * ```
 */
export const LinkedItemsDisplay = memo(function LinkedItemsDisplay({
  linkedTasks = [],
  linkedEvents = [],
  onRemoveTask,
  onRemoveEvent,
  className = '',
  testId,
}: LinkedItemsDisplayProps) {
  const hasLinks = linkedTasks.length > 0 || linkedEvents.length > 0;

  // Empty state
  if (!hasLinks) {
    return (
      <div
        className={`text-sm text-gray-500 italic ${className}`}
        data-testid={testId || 'linked-items-empty'}
      >
        No linked items
      </div>
    );
  }

  return (
    <div
      className={`space-y-2 ${className}`}
      data-testid={testId || 'linked-items-display'}
    >
      {/* Linked Tasks */}
      {linkedTasks.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-700">Linked Tasks:</p>
          <div className="flex flex-wrap gap-2">
            {linkedTasks.map((task) => (
              <div
                key={task.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                data-testid={`task-chip-${task.id}`}
              >
                <span className="max-w-[200px] truncate">{task.title}</span>
                {onRemoveTask && (
                  <button
                    type="button"
                    onClick={() => onRemoveTask(task.id)}
                    className="flex-shrink-0 ml-1 text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                    aria-label={`Remove link to ${task.title}`}
                    data-testid={`remove-task-${task.id}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Events */}
      {linkedEvents.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-700">Linked Events:</p>
          <div className="flex flex-wrap gap-2">
            {linkedEvents.map((event) => (
              <div
                key={event.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm bg-purple-100 text-purple-800 rounded-full"
                data-testid={`event-chip-${event.id}`}
              >
                <span className="max-w-[200px] truncate">{event.title}</span>
                {onRemoveEvent && (
                  <button
                    type="button"
                    onClick={() => onRemoveEvent(event.id)}
                    className="flex-shrink-0 ml-1 text-purple-600 hover:text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-full"
                    aria-label={`Remove link to ${event.title}`}
                    data-testid={`remove-event-${event.id}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
