/**
 * RecurringEventsManager Component
 *
 * Modal for viewing and managing recurring events.
 * Events use the legacy/virtual recurrence system with embedded RecurrencePattern.
 */

import { useState, useMemo, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EventForm } from './EventForm';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectRecurringParentEvents } from '../../features/events/eventSlice';
import {
  deleteEventAsync,
  updateEventAsync,
  fetchRecurringEvents,
} from '../../features/events/eventThunks';
import { selectCategoriesMap } from '../../features/categories/categorySlice';
import { useAuth } from '../../features/auth';
import type { Event, CreateEventInput } from '../../types';
import { format } from 'date-fns';

// =============================================================================
// Types
// =============================================================================

export interface RecurringEventsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  testId?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format an event's recurrence pattern for display
 */
function formatEventRecurrence(event: Event): string {
  if (!event.recurrence) return 'None';

  const { type, interval, daysOfWeek, endCondition } = event.recurrence;

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
    if (endDate <= new Date(event.startTime)) {
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

export function RecurringEventsManager({
  isOpen,
  onClose,
  testId,
}: RecurringEventsManagerProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const recurringParentEvents = useAppSelector(selectRecurringParentEvents);
  const categoriesMap = useAppSelector(selectCategoriesMap);

  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [clearingExceptionsEventId, setClearingExceptionsEventId] = useState<string | null>(null);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Convert record to sorted array
  const recurringEvents = useMemo(() => {
    return Object.values(recurringParentEvents).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [recurringParentEvents]);

  // Convert categories map to array for EventForm
  const categoriesArray = useMemo(() => {
    return Object.values(categoriesMap);
  }, [categoriesMap]);

  const totalCount = recurringEvents.length;

  // Fetch recurring events when modal opens
  useEffect(() => {
    if (isOpen && user) {
      dispatch(fetchRecurringEvents({ userId: user.id }));
    }
  }, [isOpen, user, dispatch]);

  // Handle delete
  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete || !user) return;

    setIsDeleting(true);
    try {
      await dispatch(
        deleteEventAsync({ eventId: eventToDelete.id, userId: user.id })
      ).unwrap();
      setEventToDelete(null);
    } catch (error) {
      console.error('Failed to delete recurring event:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle clearing exceptions
  const handleClearExceptions = async (event: Event) => {
    if (!user || !event.recurrence) return;

    setClearingExceptionsEventId(event.id);
    try {
      await dispatch(
        updateEventAsync({
          id: event.id,
          userId: user.id,
          recurrence: {
            ...event.recurrence,
            exceptions: [],
          },
        })
      ).unwrap();
    } catch (error) {
      console.error('Failed to clear exceptions:', error);
    } finally {
      setClearingExceptionsEventId(null);
    }
  };

  // Handle edit
  const handleEditClick = (event: Event) => {
    setEventToEdit(event);
  };

  const handleEditEventModalClose = () => {
    setEventToEdit(null);
    setIsEditSubmitting(false);
  };

  const handleEventUpdate = async (data: CreateEventInput) => {
    if (!user || !eventToEdit) return;
    setIsEditSubmitting(true);
    try {
      await dispatch(
        updateEventAsync({
          id: eventToEdit.id,
          userId: user.id,
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
          startTime: data.startTime,
          endTime: data.endTime,
          location: data.location,
          isConfidential: data.isConfidential,
          alternateTitle: data.alternateTitle,
          recurrence: data.recurrence,
        })
      ).unwrap();
      setEventToEdit(null);
    } catch (error) {
      console.error('Failed to update recurring event:', error);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Recurring Events"
        size="xl"
        testId={testId || 'recurring-events-manager'}
      >
        {/* Summary */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">
            Recurring Events: <span className="text-amber-600">{totalCount}</span>
          </p>
        </div>

        {/* Events List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {recurringEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-base">No recurring events</p>
              <p className="text-sm text-gray-400 mt-1">Create a recurring event to see it here</p>
            </div>
          ) : (
            recurringEvents.map((event) => {
              const category = event.categoryId ? categoriesMap[event.categoryId] : null;

              return (
                <div key={event.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-3">
                          {category && (
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category.color }}
                              title={category.name}
                            />
                          )}
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {event.title}
                          </h3>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Pattern:</span>{' '}
                          <span className="text-gray-600">{formatEventRecurrence(event)}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Starts: {format(new Date(event.startTime), 'MMM d, yyyy h:mm a')}
                        </div>
                        {event.recurrence && event.recurrence.exceptions.length > 0 && (
                          <div className="text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Exceptions:</span>
                              <span className="text-orange-600 font-medium">
                                {event.recurrence.exceptions.length}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleClearExceptions(event)}
                                disabled={clearingExceptionsEventId === event.id}
                                className="px-2 py-0.5 text-xs font-medium text-orange-700 bg-orange-100 border border-orange-300 rounded hover:bg-orange-200 disabled:opacity-50"
                              >
                                {clearingExceptionsEventId === event.id ? 'Clearing...' : 'Clear'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleEditClick(event)}
                          className="text-sm"
                          aria-label={`Edit event: ${event.title}`}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDeleteClick(event)}
                          className="text-sm"
                          aria-label={`Delete event: ${event.title}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Recurring Event"
        message={`Are you sure you want to delete "${eventToDelete?.title}"? This will remove the recurring event and all future occurrences. This action cannot be undone.`}
        confirmText="Delete Event"
        cancelText="Cancel"
        variant="danger"
        isProcessing={isDeleting}
      />

      {/* Edit Event Modal */}
      {eventToEdit && (
        <Modal
          isOpen={!!eventToEdit}
          onClose={handleEditEventModalClose}
          title="Edit Recurring Event"
          size="lg"
        >
          <EventForm
            event={eventToEdit}
            categories={categoriesArray}
            onSubmit={handleEventUpdate}
            onCancel={handleEditEventModalClose}
            isSubmitting={isEditSubmitting}
          />
        </Modal>
      )}
    </>
  );
}

export default RecurringEventsManager;
