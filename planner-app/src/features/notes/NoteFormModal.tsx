/**
 * NoteFormModal Component
 *
 * Modal wrapper for NoteForm with Redux integration.
 * Handles create and edit modes.
 */

import { useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectAllCategories } from '../categories/categorySlice';
import { selectSelectedDate, selectAllTasks } from '../tasks/taskSlice';
import { selectAllEvents } from '../events/eventSlice';
import { createNoteAsync, updateNoteAsync, deleteNoteAsync } from './noteThunks';
import { useAuth } from '../auth';
import { Modal } from '../../components/common';
import { NoteForm } from '../../components/notes/NoteForm';
import { parseISODateString } from '../../utils/firestoreUtils';
import type { Note, CreateNoteInput } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface NoteFormModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Note to edit (null for create mode) */
  note?: Note | null;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when operation succeeds */
  onSuccess?: () => void;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * NoteFormModal - Modal for creating/editing notes
 *
 * Features:
 * - Create mode: Empty form
 * - Edit mode: Pre-populated form with delete button
 * - Redux integration for categories and note operations
 * - Loading states during submission
 *
 * @example
 * ```tsx
 * <NoteFormModal
 *   isOpen={isOpen}
 *   note={selectedNote}
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={() => setIsOpen(false)}
 * />
 * ```
 */
export function NoteFormModal({
  isOpen,
  note = null,
  onClose,
  onSuccess,
  testId,
}: NoteFormModalProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const categories = useAppSelector(selectAllCategories);
  const selectedDate = useAppSelector(selectSelectedDate);
  const tasks = useAppSelector(selectAllTasks);
  const events = useAppSelector(selectAllEvents);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isEditMode = !!note;

  // Convert ISO date string to Date object (memoized to prevent re-creation)
  // Use parseISODateString to create local midnight (new Date("2026-02-05") would be UTC midnight!)
  const defaultDate = useMemo(() => parseISODateString(selectedDate), [selectedDate]);

  /**
   * Handle form submission - create or update note
   */
  const handleSubmit = useCallback(async (data: CreateNoteInput) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && note) {
        await dispatch(updateNoteAsync({
          id: note.id,
          ...data,
          userId: user.id,
        })).unwrap();
      } else {
        await dispatch(createNoteAsync({
          input: data,
          userId: user.id,
        })).unwrap();
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to save note:', error);
      // Error is handled by the slice
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, user, note, isEditMode, onSuccess]);

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!user || !note) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteNoteAsync({
        noteId: note.id,
        userId: user.id,
      })).unwrap();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [dispatch, user, note, onSuccess]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditMode ? 'Edit Note' : 'Create Note'}
        size="lg"
        testId={testId}
      >
        <div className="space-y-4">
          {/* Note Form */}
          <NoteForm
            note={note}
            categories={categories}
            tasks={tasks}
            events={events}
            defaultDate={defaultDate}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
            testId="note-form-modal-form"
          />

          {/* Delete Button (Edit Mode Only) */}
          {isEditMode && (
            <div className="flex items-center justify-start pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="delete-note-button"
              >
                Delete Note
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Note"
        size="sm"
        testId="delete-confirmation-modal"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this note? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="cancel-delete-button"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="confirm-delete-button"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
