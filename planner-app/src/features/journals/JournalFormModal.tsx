/**
 * JournalFormModal Component
 *
 * Modal wrapper for JournalForm with Redux integration.
 * Handles create and edit modes for journals.
 */

import { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectAllCategories } from '../categories/categorySlice';
import { createJournalAsync, updateJournalAsync, deleteJournalAsync } from './journalThunks';
import { useAuth } from '../auth';
import { Modal } from '../../components/common';
import { JournalForm } from '../../components/journals/JournalForm';
import type { Journal, CreateJournalInput } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface JournalFormModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Journal to edit (null/undefined for create mode) */
  journal?: Journal | null;
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
 * JournalFormModal - Modal for creating/editing journals
 *
 * Features:
 * - Create mode: Empty form
 * - Edit mode: Pre-populated form with delete button
 * - Redux integration for journal operations
 * - Loading states during submission
 *
 * @example
 * ```tsx
 * <JournalFormModal
 *   isOpen={isOpen}
 *   journal={selectedJournal}
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={() => setIsOpen(false)}
 * />
 * ```
 */
export function JournalFormModal({
  isOpen,
  journal = null,
  onClose,
  onSuccess,
  testId,
}: JournalFormModalProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const categories = useAppSelector(selectAllCategories);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isEditMode = !!journal;

  /**
   * Handle form submission - create or update journal
   */
  const handleSubmit = useCallback(async (data: CreateJournalInput) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && journal) {
        await dispatch(updateJournalAsync({
          id: journal.id,
          ...data,
          userId: user.id,
        })).unwrap();
      } else {
        await dispatch(createJournalAsync({
          input: data,
          userId: user.id,
        })).unwrap();
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to save journal:', error);
      // Error is handled by the slice
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, user, journal, isEditMode, onSuccess]);

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!user || !journal) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteJournalAsync({
        journalId: journal.id,
        userId: user.id,
      })).unwrap();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to delete journal:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [dispatch, user, journal, onSuccess]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditMode ? 'Edit Journal' : 'Create Journal'}
        size="md"
        testId={testId}
      >
        <div className="space-y-4">
          {/* Journal Form */}
          <JournalForm
            journal={journal}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
            testId="journal-form-modal-form"
          />

          {/* Delete Button (Edit Mode Only) */}
          {isEditMode && (
            <div className="flex items-center justify-start pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="delete-journal-button"
              >
                Delete Journal
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Journal"
        size="sm"
        testId="delete-confirmation-modal"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this journal? This action cannot be undone, and all entries in this journal will also be deleted.
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
