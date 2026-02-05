/**
 * ConflictItem Component
 *
 * Display component for a single conflict item.
 * Shows side-by-side comparison of local vs server versions with resolution options.
 */

import type { ConflictItem as ConflictItemType, ConflictChoice } from '../../types/sync.types';
import type { Task } from '../../types/task.types';
import type { Event } from '../../types/event.types';
import type { Note } from '../../types/note.types';
import type { Category } from '../../types/category.types';
import type { Reminder } from '../../types/reminder.types';

// =============================================================================
// Types
// =============================================================================

export interface ConflictItemProps {
  /** The conflict to display */
  conflict: ConflictItemType;
  /** Callback when resolution choice changes */
  onChoiceChange: (conflictId: string, choice: ConflictChoice) => void;
  /** Currently selected choice */
  selectedChoice: ConflictChoice;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format timestamp to readable string
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format conflict data for display based on collection type
 */
function formatConflictData(data: unknown, collection: string): Record<string, string> {
  if (!data || typeof data !== 'object') {
    return { value: String(data) };
  }

  switch (collection) {
    case 'tasks': {
      const task = data as Task;
      return {
        Title: task.title || '',
        Description: task.description || '(none)',
        Status: task.status || '',
        Priority: task.priority ? `${task.priority.letter}${task.priority.number}` : '',
        Category: task.categoryId || '(none)',
      };
    }
    case 'events': {
      const event = data as Event;
      return {
        Title: event.title || '',
        Description: event.description || '(none)',
        'Start Time': event.startTime ? new Date(event.startTime).toLocaleString() : '',
        'End Time': event.endTime ? new Date(event.endTime).toLocaleString() : '',
        Location: event.location || '(none)',
      };
    }
    case 'notes': {
      const note = data as Note;
      return {
        Title: note.title || '',
        Content: note.content ? note.content.substring(0, 100) + '...' : '(empty)',
        Category: note.categoryId || '(none)',
      };
    }
    case 'categories': {
      const category = data as Category;
      return {
        Name: category.name || '',
        Color: category.color || '',
      };
    }
    case 'reminders': {
      const reminder = data as Reminder;
      return {
        'Task ID': reminder.taskId || 'N/A',
        'Event ID': reminder.eventId || 'N/A',
        'Time': reminder.scheduledTime ? new Date(reminder.scheduledTime).toLocaleString() : 'N/A',
        'Status': reminder.status,
        'Type': reminder.type,
        'Minutes Before': String(reminder.minutesBefore ?? 'N/A'),
      };
    }
    default:
      return { value: JSON.stringify(data, null, 2) };
  }
}

/**
 * Get collection display name
 */
function getCollectionName(collection: string): string {
  return collection.charAt(0).toUpperCase() + collection.slice(1, -1);
}

// =============================================================================
// Component
// =============================================================================

/**
 * ConflictItem - Single conflict display with resolution options
 *
 * Features:
 * - Side-by-side comparison of local vs server versions
 * - Highlights field differences
 * - Radio button selection for resolution choice
 * - Formatted data based on collection type
 * - Timestamps for both versions
 *
 * @example
 * ```tsx
 * <ConflictItem
 *   conflict={conflict}
 *   selectedChoice="local"
 *   onChoiceChange={(id, choice) => handleChoiceChange(id, choice)}
 * />
 * ```
 */
export function ConflictItem({
  conflict,
  onChoiceChange,
  selectedChoice,
  testId,
}: ConflictItemProps) {
  const localData = formatConflictData(conflict.localVersion, conflict.collection);
  const serverData = formatConflictData(conflict.serverVersion, conflict.collection);
  const allFields = new Set([...Object.keys(localData), ...Object.keys(serverData)]);

  return (
    <div
      className="border border-gray-300 rounded-lg p-4 bg-white"
      data-testid={testId || 'conflict-item'}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {getCollectionName(conflict.collection)} Conflict
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Choose which version to keep or merge them manually
        </p>
      </div>

      {/* Comparison Table */}
      <div className="mb-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-medium text-gray-700 w-1/3">Field</th>
              <th className="text-left py-2 px-3 font-medium text-gray-700 w-1/3">
                Local Version
                <div className="text-xs font-normal text-gray-500 mt-1">
                  {formatTimestamp(conflict.localTimestamp)}
                </div>
              </th>
              <th className="text-left py-2 px-3 font-medium text-gray-700 w-1/3">
                Server Version
                <div className="text-xs font-normal text-gray-500 mt-1">
                  {formatTimestamp(conflict.serverTimestamp)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from(allFields).map((field) => {
              const localValue = localData[field] || '';
              const serverValue = serverData[field] || '';
              const isDifferent = localValue !== serverValue;

              return (
                <tr
                  key={field}
                  className={`border-b border-gray-100 ${isDifferent ? 'bg-yellow-50' : ''}`}
                >
                  <td className="py-2 px-3 font-medium text-gray-700">{field}</td>
                  <td
                    className={`py-2 px-3 ${isDifferent ? 'text-orange-700 font-medium' : 'text-gray-600'}`}
                  >
                    {localValue}
                  </td>
                  <td
                    className={`py-2 px-3 ${isDifferent ? 'text-blue-700 font-medium' : 'text-gray-600'}`}
                  >
                    {serverValue}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Resolution Options */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Choose Resolution:
        </label>

        {/* Keep Local */}
        <label
          className={`
            flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors
            ${selectedChoice === 'local' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}
          `}
        >
          <input
            type="radio"
            name={`conflict-${conflict.id}`}
            value="local"
            checked={selectedChoice === 'local'}
            onChange={() => onChoiceChange(conflict.id, 'local')}
            className="w-4 h-4 text-orange-600 focus:ring-orange-500"
          />
          <span className="ml-3 text-sm font-medium text-gray-900">
            Keep Local Version
            <span className="block text-xs text-gray-500 mt-0.5">
              Use your local changes
            </span>
          </span>
        </label>

        {/* Keep Server */}
        <label
          className={`
            flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors
            ${selectedChoice === 'server' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
          `}
        >
          <input
            type="radio"
            name={`conflict-${conflict.id}`}
            value="server"
            checked={selectedChoice === 'server'}
            onChange={() => onChoiceChange(conflict.id, 'server')}
            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-3 text-sm font-medium text-gray-900">
            Keep Server Version
            <span className="block text-xs text-gray-500 mt-0.5">
              Use the server's version
            </span>
          </span>
        </label>

        {/* Merge (placeholder for future implementation) */}
        <label
          className={`
            flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors opacity-50
            ${selectedChoice === 'merge' ? 'border-green-500 bg-green-50' : 'border-gray-200'}
          `}
          title="Merge functionality coming soon"
        >
          <input
            type="radio"
            name={`conflict-${conflict.id}`}
            value="merge"
            checked={selectedChoice === 'merge'}
            onChange={() => onChoiceChange(conflict.id, 'merge')}
            disabled
            className="w-4 h-4 text-green-600 focus:ring-green-500"
          />
          <span className="ml-3 text-sm font-medium text-gray-900">
            Merge Manually
            <span className="block text-xs text-gray-500 mt-0.5">
              (Coming soon)
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}

export default ConflictItem;
