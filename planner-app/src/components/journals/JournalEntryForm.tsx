/**
 * JournalEntryForm Component
 *
 * Form for creating or editing a journal entry (rich text + attachments).
 */

import { useState, useEffect, memo, useCallback, type FormEvent } from 'react';
import type { JournalEntry } from '../../types';
import type { NoteAttachment } from '../../types/note.types';
import { RichTextEditor } from '../common';
import { AttachmentUploader } from '../notes/AttachmentUploader';

// =============================================================================
// Types
// =============================================================================

export interface JournalEntryFormProps {
  /** Entry to edit (null for create mode) */
  entry?: JournalEntry | null;
  /** Submit handler */
  onSubmit: (data: { content: string }, pendingFiles?: File[]) => void;
  /** Cancel handler */
  onCancel: () => void;
  /** Submitting state */
  isSubmitting?: boolean;
  /** Existing attachments */
  existingAttachments?: NoteAttachment[];
  /** Handler to remove existing attachment */
  onRemoveAttachment?: (attachmentId: string) => void;
  /** Handler to view attachment */
  onViewAttachment?: (attachment: NoteAttachment) => void;
  /** Upload in progress */
  isUploadingAttachments?: boolean;
  /** Test ID for testing */
  testId?: string;
}

interface FormData {
  content: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * JournalEntryForm - Create/edit journal entry form
 *
 * Features:
 * - Rich text editor for content
 * - Attachment uploader
 * - Cancel and Submit buttons
 *
 * @example
 * ```tsx
 * <JournalEntryForm
 *   entry={entry}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export const JournalEntryForm = memo(function JournalEntryForm({
  entry,
  onSubmit,
  onCancel,
  isSubmitting = false,
  existingAttachments = [],
  onRemoveAttachment,
  onViewAttachment,
  isUploadingAttachments = false,
  testId,
}: JournalEntryFormProps) {
  const isEditMode = !!entry;

  const [formData, setFormData] = useState<FormData>({
    content: entry?.content || '',
  });

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Update form when entry changes (edit mode)
  useEffect(() => {
    if (entry) {
      setFormData({
        content: entry.content,
      });
    }
  }, [entry]);

  const handleAddFiles = useCallback((files: File[]) => {
    setPendingFiles(prev => [...prev, ...files]);
  }, []);

  const handleRemovePendingFile = useCallback((index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    onSubmit(
      {
        content: formData.content,
      },
      pendingFiles.length > 0 ? pendingFiles : undefined
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-testid={testId || 'journal-entry-form'}
    >
      {/* Content */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Content
        </label>
        <RichTextEditor
          content={formData.content}
          onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
          placeholder="Write your journal entry here..."
          testId="entry-content-editor"
        />
      </div>

      {/* Attachments */}
      <AttachmentUploader
        existingAttachments={existingAttachments}
        pendingFiles={pendingFiles}
        onAddFiles={handleAddFiles}
        onRemovePendingFile={handleRemovePendingFile}
        onRemoveExistingAttachment={onRemoveAttachment}
        onViewAttachment={onViewAttachment}
        isUploading={isUploadingAttachments}
        disabled={isSubmitting}
        testId="entry-form-attachments"
      />

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          data-testid="cancel-button"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          data-testid="submit-button"
        >
          {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Entry'}
        </button>
      </div>
    </form>
  );
});
