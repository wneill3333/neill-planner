/**
 * JournalDetailContainer Component
 *
 * Container component for JournalDetail that connects to Redux store.
 * Handles journal entry CRUD operations and displays journal details.
 */

import { useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectJournalById, selectEntriesByJournal } from './journalSlice';
import { selectCategoryById } from '../categories/categorySlice';
import { deleteJournalEntryAsync } from './journalThunks';
import { useJournalEntries } from './hooks';
import { useAuth } from '../auth';
import { Modal } from '../../components/common';
import { JournalDetail } from '../../components/journals/JournalDetail';
import { JournalEntryFormModal } from './JournalEntryFormModal';
import type { JournalEntry } from '../../types';
import type { RootState } from '../../store';

// =============================================================================
// Types
// =============================================================================

export interface JournalDetailContainerProps {
  /** Journal ID to display */
  journalId: string;
  /** Callback to navigate back to journal list */
  onBack: () => void;
  /** Callback to edit the journal */
  onEdit: () => void;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * JournalDetailContainer - Connected journal detail component
 *
 * Responsibilities:
 * - Display journal details and entries
 * - Handle entry creation and editing
 * - Handle entry deletion with confirmation
 * - Show loading and error states
 *
 * @example
 * ```tsx
 * <JournalDetailContainer
 *   journalId={selectedJournalId}
 *   onBack={() => setSelectedJournal(null)}
 *   onEdit={() => setEditingJournal(true)}
 * />
 * ```
 */
export function JournalDetailContainer({
  journalId,
  onBack,
  onEdit,
  className,
  testId,
}: JournalDetailContainerProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  // Get journal from Redux
  const journal = useAppSelector((state: RootState) => selectJournalById(state, journalId));

  // Resolve category for color indicator
  const category = useAppSelector((state: RootState) =>
    journal?.categoryId ? selectCategoryById(state, journal.categoryId) : undefined
  );

  // Get entries from Redux
  const entries = useAppSelector((state: RootState) => selectEntriesByJournal(state, journalId));

  // Fetch entries for this journal (hook handles useEffect)
  const { error: entriesError } = useJournalEntries(journalId, user?.id || '');

  // Local state
  const [isCreateEntryModalOpen, setIsCreateEntryModalOpen] = useState(false);
  const [isEditEntryModalOpen, setIsEditEntryModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);

  /**
   * Handle add entry button click
   */
  const handleAddEntry = useCallback(() => {
    setSelectedEntry(null);
    setIsCreateEntryModalOpen(true);
  }, []);

  /**
   * Handle entry edit click
   */
  const handleEditEntry = useCallback((entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsEditEntryModalOpen(true);
  }, []);

  /**
   * Handle entry delete click - show confirmation dialog
   */
  const handleDeleteEntry = useCallback((entry: JournalEntry) => {
    setEntryToDelete(entry);
    setShowDeleteConfirm(true);
  }, []);

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!user || !entryToDelete) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteJournalEntryAsync({
        entryId: entryToDelete.id,
        journalId,
        userId: user.id,
      })).unwrap();

      setShowDeleteConfirm(false);
      setEntryToDelete(null);
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, user, entryToDelete, journalId]);

  /**
   * Handle successful entry creation/update
   */
  const handleEntrySuccess = useCallback(() => {
    setIsCreateEntryModalOpen(false);
    setIsEditEntryModalOpen(false);
    setSelectedEntry(null);
  }, []);

  // Journal not found
  if (!journal) {
    return (
      <div
        className={`flex items-center justify-center py-12 ${className || ''}`}
        data-testid={testId ? `${testId}-not-found` : 'journal-not-found'}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Journal not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The journal you're looking for doesn't exist or has been deleted.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <JournalDetail
        journal={journal}
        entries={entries}
        categoryColor={category?.color}
        categoryName={category?.name}
        onBack={onBack}
        onEdit={onEdit}
        onAddEntry={handleAddEntry}
        onEditEntry={handleEditEntry}
        onDeleteEntry={handleDeleteEntry}
        className={className}
        testId={testId}
      />

      {/* Create Entry Modal */}
      <JournalEntryFormModal
        isOpen={isCreateEntryModalOpen}
        journalId={journalId}
        entry={null}
        onClose={() => setIsCreateEntryModalOpen(false)}
        onSuccess={handleEntrySuccess}
        testId="create-entry-modal"
      />

      {/* Edit Entry Modal */}
      <JournalEntryFormModal
        isOpen={isEditEntryModalOpen}
        journalId={journalId}
        entry={selectedEntry}
        onClose={() => {
          setIsEditEntryModalOpen(false);
          setSelectedEntry(null);
        }}
        onSuccess={handleEntrySuccess}
        testId="edit-entry-modal"
      />

      {/* Delete Entry Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Entry"
        size="sm"
        testId="delete-entry-confirmation-modal"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this journal entry? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="cancel-delete-entry-button"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="confirm-delete-entry-button"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
