/**
 * JournalEntryFormModal Component
 *
 * Modal wrapper for JournalEntryForm with Redux integration.
 * Handles create and edit modes for journal entries, including attachment management.
 */

import { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  createJournalEntryAsync,
  updateJournalEntryAsync,
  uploadJournalEntryAttachmentsAsync,
  deleteJournalEntryAttachmentAsync,
} from './journalThunks';
import { useAuth } from '../auth';
import { Modal } from '../../components/common';
import { JournalEntryForm } from '../../components/journals/JournalEntryForm';
import { AttachmentViewer } from '../../components/notes/AttachmentViewer';
import type { JournalEntry, CreateJournalEntryInput, NoteAttachment } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface JournalEntryFormModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Journal ID this entry belongs to */
  journalId: string;
  /** Entry to edit (null/undefined for create mode) */
  entry?: JournalEntry | null;
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
 * JournalEntryFormModal - Modal for creating/editing journal entries
 *
 * Features:
 * - Create mode: Empty form
 * - Edit mode: Pre-populated form
 * - Attachment upload and management
 * - Attachment viewer for previewing files
 * - Redux integration for entry operations
 * - Loading states during submission and upload
 *
 * @example
 * ```tsx
 * <JournalEntryFormModal
 *   isOpen={isOpen}
 *   journalId={journalId}
 *   entry={selectedEntry}
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={() => setIsOpen(false)}
 * />
 * ```
 */
export function JournalEntryFormModal({
  isOpen,
  journalId,
  entry: entryProp = null,
  onClose,
  onSuccess,
  testId,
}: JournalEntryFormModalProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  // Read live entry from Redux by ID so UI stays in sync after mutations
  const reduxEntry = useAppSelector((state) =>
    entryProp?.id ? state.journals.entries[entryProp.id] : undefined
  );
  const entry = reduxEntry ?? entryProp;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<NoteAttachment | null>(null);

  const isEditMode = !!entry;

  /**
   * Handle form submission - create or update entry
   */
  const handleSubmit = useCallback(async (data: CreateJournalEntryInput, pendingFiles?: File[]) => {
    if (!user) return;

    setIsSubmitting(true);
    setAttachmentError(null);
    try {
      let result;
      if (isEditMode && entry) {
        result = await dispatch(updateJournalEntryAsync({
          id: entry.id,
          journalId: entry.journalId,
          ...data,
          userId: user.id,
        })).unwrap();
      } else {
        result = await dispatch(createJournalEntryAsync({
          input: {
            ...data,
            journalId,
          },
          userId: user.id,
        })).unwrap();
      }

      // Upload pending attachments if any
      if (pendingFiles && pendingFiles.length > 0) {
        setIsUploadingAttachments(true);
        try {
          const targetEntryId = isEditMode && entry ? entry.id : result.id;
          await dispatch(uploadJournalEntryAttachmentsAsync({
            entryId: targetEntryId,
            userId: user.id,
            files: pendingFiles,
          })).unwrap();
        } catch (uploadError) {
          const msg = uploadError instanceof Error ? uploadError.message : 'Failed to upload attachments';
          console.error('Failed to upload attachments:', uploadError);
          setAttachmentError(msg);
          return; // Don't close modal so user can retry or dismiss
        } finally {
          setIsUploadingAttachments(false);
        }
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      // Error is handled by the slice
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, user, entry, isEditMode, journalId, onSuccess]);

  /**
   * Handle attachment removal
   */
  const handleRemoveAttachment = useCallback(async (attachmentId: string) => {
    if (!user || !entry) return;
    try {
      await dispatch(deleteJournalEntryAttachmentAsync({
        entryId: entry.id,
        userId: user.id,
        attachmentId,
      })).unwrap();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  }, [dispatch, user, entry]);

  /**
   * Handle attachment view
   */
  const handleViewAttachment = useCallback((attachment: NoteAttachment) => {
    setViewingAttachment(attachment);
  }, []);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditMode ? 'Edit Entry' : 'New Entry'}
        size="lg"
        testId={testId}
      >
        <div className="space-y-4">
          {/* Attachment upload error */}
          {attachmentError && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
              Entry saved, but attachment upload failed: {attachmentError}
            </div>
          )}

          {/* Journal Entry Form */}
          <JournalEntryForm
            entry={entry}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
            existingAttachments={entry?.attachments || []}
            onRemoveAttachment={handleRemoveAttachment}
            onViewAttachment={handleViewAttachment}
            isUploadingAttachments={isUploadingAttachments}
            testId="journal-entry-form-modal-form"
          />
        </div>
      </Modal>

      {/* Attachment Viewer */}
      {viewingAttachment && (
        <AttachmentViewer
          attachment={viewingAttachment}
          attachments={entry?.attachments || []}
          onClose={() => setViewingAttachment(null)}
          onNavigate={setViewingAttachment}
          onDelete={handleRemoveAttachment}
        />
      )}
    </>
  );
}
