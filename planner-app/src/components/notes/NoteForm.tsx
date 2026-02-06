/**
 * NoteForm Component - Form for creating/editing notes
 */

import { useState, useEffect, memo, useCallback, type FormEvent } from 'react';
import type { Note, Category, CreateNoteInput, Task, Event } from '../../types';
import type { NoteAttachment } from '../../types/note.types';
import { Input, DatePicker, RichTextEditor } from '../common';
import { CategorySelect } from '../categories/CategorySelect';
import { LinkSelector } from './LinkSelector';
import { LinkedItemsDisplay } from './LinkedItemsDisplay';
import { AttachmentUploader } from './AttachmentUploader';

export interface NoteFormProps {
  note?: Note | null;
  categories?: Category[];
  tasks?: Task[];
  events?: Event[];
  defaultDate?: Date | null;
  onSubmit: (data: CreateNoteInput, pendingFiles?: File[]) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  existingAttachments?: NoteAttachment[];
  onRemoveAttachment?: (attachmentId: string) => void;
  onViewAttachment?: (attachment: NoteAttachment) => void;
  isUploadingAttachments?: boolean;
  testId?: string;
}

interface FormData {
  title: string;
  content: string;
  date: Date | null;
  categoryId: string;
  linkedTaskIds: string[];
  linkedEventIds: string[];
}

interface FormErrors {
  title?: string;
  date?: string;
}

const TITLE_MAX_LENGTH = 500;

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.title.trim()) {
    errors.title = 'Title is required';
  } else if (data.title.length > TITLE_MAX_LENGTH) {
    errors.title = `Title must be ${TITLE_MAX_LENGTH} characters or less`;
  }

  if (!data.date) {
    errors.date = 'Date is required';
  }

  return errors;
}

export const NoteForm = memo(function NoteForm({
  note,
  categories = [],
  tasks = [],
  events = [],
  defaultDate,
  onSubmit,
  onCancel,
  isSubmitting = false,
  existingAttachments = [],
  onRemoveAttachment,
  onViewAttachment,
  isUploadingAttachments = false,
  testId,
}: NoteFormProps) {
  const isEditMode = !!note;

  const [formData, setFormData] = useState<FormData>({
    title: note?.title || '',
    content: note?.content || '',
    date: note?.date || defaultDate || new Date(),
    categoryId: note?.categoryId || '',
    linkedTaskIds: note?.linkedTaskIds || [],
    linkedEventIds: note?.linkedEventIds || [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Update form when note changes (edit mode)
  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content,
        date: note.date,
        categoryId: note.categoryId || '',
        linkedTaskIds: note.linkedTaskIds || [],
        linkedEventIds: note.linkedEventIds || [],
      });
    }
  }, [note]);

  // Get linked items with titles for display
  const linkedTasks = formData.linkedTaskIds
    .map(id => tasks.find(t => t.id === id))
    .filter((t): t is Task => !!t)
    .map(t => ({ id: t.id, title: t.title }));

  const linkedEvents = formData.linkedEventIds
    .map(id => events.find(e => e.id === id))
    .filter((e): e is Event => !!e)
    .map(e => ({ id: e.id, title: e.title }));

  const handleAddFiles = useCallback((files: File[]) => {
    setPendingFiles(prev => [...prev, ...files]);
  }, []);

  const handleRemovePendingFile = useCallback((index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    onSubmit({
      title: formData.title.trim(),
      content: formData.content,
      date: formData.date!,
      categoryId: formData.categoryId || null,
      linkedTaskIds: formData.linkedTaskIds,
      linkedEventIds: formData.linkedEventIds,
    }, pendingFiles.length > 0 ? pendingFiles : undefined);
  };

  const handleLinksConfirm = (taskIds: string[], eventIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      linkedTaskIds: taskIds,
      linkedEventIds: eventIds,
    }));
  };

  const handleRemoveTask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      linkedTaskIds: prev.linkedTaskIds.filter(id => id !== taskId),
    }));
  };

  const handleRemoveEvent = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      linkedEventIds: prev.linkedEventIds.filter(id => id !== eventId),
    }));
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        data-testid={testId || 'note-form'}
      >
        {/* Title */}
        <Input
          label="Title"
          value={formData.title}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, title: e.target.value }));
            if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
          }}
          placeholder="Enter note title"
          error={errors.title}
          required
          maxLength={TITLE_MAX_LENGTH}
          testId="note-title-input"
          disabled={isSubmitting}
        />

        {/* Content */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <RichTextEditor
            content={formData.content}
            onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
            placeholder="Write your note here..."
            testId="note-content-editor"
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
          testId="note-form-attachments"
        />

        {/* Linked Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Linked Items
            </label>
            <button
              type="button"
              onClick={() => setIsLinkSelectorOpen(true)}
              className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
              data-testid="open-link-selector-button"
            >
              + Link to Tasks/Events
            </button>
          </div>
          <LinkedItemsDisplay
            linkedTasks={linkedTasks}
            linkedEvents={linkedEvents}
            onRemoveTask={handleRemoveTask}
            onRemoveEvent={handleRemoveEvent}
            testId="note-form-linked-items"
          />
        </div>

        {/* Date */}
        <DatePicker
          label="Date"
          value={formData.date}
          onChange={(value) => {
            setFormData(prev => ({ ...prev, date: value }));
            if (errors.date) setErrors(prev => ({ ...prev, date: undefined }));
          }}
          error={errors.date}
          required
          testId="note-date-picker"
          disabled={isSubmitting}
        />

        {/* Category */}
        <CategorySelect
          label="Category (Optional)"
          value={formData.categoryId}
          onChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
          categories={categories}
          includeNone
          testId="note-category-select"
        />

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="cancel-button"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="submit-button"
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Note'}
          </button>
        </div>
      </form>

      {/* Link Selector Modal */}
      <LinkSelector
        isOpen={isLinkSelectorOpen}
        tasks={tasks}
        events={events}
        selectedTaskIds={formData.linkedTaskIds}
        selectedEventIds={formData.linkedEventIds}
        onConfirm={handleLinksConfirm}
        onClose={() => setIsLinkSelectorOpen(false)}
        testId="note-form-link-selector"
      />
    </>
  );
});
