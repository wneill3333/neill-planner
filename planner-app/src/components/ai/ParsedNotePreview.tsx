/**
 * ParsedNotePreview Component
 *
 * Modal showing AI-generated note data for user review and editing before creation.
 * Allows users to confirm or modify the AI's interpretation.
 */

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../../features/auth';
import {
  selectIsNotePreviewOpen,
  selectParsedNote,
  clearNoteAi,
} from '../../features/ai/aiSlice';
import { createNoteAsync } from '../../features/notes/noteThunks';
import { selectAllCategories } from '../../features/categories/categorySlice';
import { selectSelectedDate } from '../../features/tasks/taskSlice';
import { parseISODateString } from '../../utils/firestoreUtils';
import { Modal } from '../common/Modal';
import { RichTextEditor } from '../common/RichTextEditor';
import { CategorySelect } from '../categories/CategorySelect';
import type { CreateNoteInput } from '../../types';

// =============================================================================
// Component
// =============================================================================

export function ParsedNotePreview() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const isOpen = useAppSelector(selectIsNotePreviewOpen);
  const parsedNote = useAppSelector(selectParsedNote);
  const categories = useAppSelector(selectAllCategories);
  const selectedDate = useAppSelector(selectSelectedDate);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState('');

  // Initialize form data when parsedNote changes
  useEffect(() => {
    if (parsedNote) {
      setTitle(parsedNote.title || '');
      setContent(parsedNote.content || '');
      setTitleError('');

      const matchedCategory = parsedNote.categoryName
        ? categories.find((cat) => cat.name === parsedNote.categoryName)
        : null;
      setCategoryId(matchedCategory?.id || null);
    }
  }, [parsedNote, categories]);

  const handleClose = () => {
    dispatch(clearNoteAi());
    setIsSubmitting(false);
  };

  const handleCreateNote = async () => {
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    if (!user) return;

    setIsSubmitting(true);

    const input: CreateNoteInput = {
      title: title.trim(),
      content,
      date: parseISODateString(selectedDate),
      categoryId: categoryId || null,
    };

    try {
      await dispatch(createNoteAsync({ input, userId: user.id })).unwrap();
      handleClose();
    } catch (error) {
      console.error('Failed to create note:', error);
      setIsSubmitting(false);
    }
  };

  const showLowConfidenceWarning = parsedNote && parsedNote.confidence < 0.7;

  if (!isOpen || !parsedNote) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Review AI Note"
      size="lg"
    >
      <div className="space-y-4">
        {/* Low confidence warning */}
        {showLowConfidenceWarning && (
          <div
            className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200"
            role="alert"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              AI confidence is low. Please review the generated note carefully.
            </p>
          </div>
        )}

        {/* Title */}
        <div>
          <label
            htmlFor="note-title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="note-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleError('');
            }}
            className={`
              block w-full px-3 py-2 rounded-lg border transition-colors
              text-gray-900 bg-white
              focus:outline-none focus:ring-2 focus:ring-offset-1
              ${
                titleError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-violet-500 focus:ring-violet-500'
              }
            `}
            aria-invalid={Boolean(titleError)}
            data-testid="note-preview-title"
          />
          {titleError && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {titleError}
            </p>
          )}
        </div>

        {/* Category */}
        <CategorySelect
          label="Category"
          value={categoryId}
          onChange={(id) => setCategoryId(id)}
          categories={categories}
          testId="note-preview-category"
        />

        {/* Content */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Content
          </label>
          <RichTextEditor
            content={content}
            onChange={(html) => setContent(html)}
            placeholder="Note content..."
            testId="note-preview-content"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <button
            type="button"
            onClick={handleCreateNote}
            disabled={isSubmitting}
            className="
              flex-1 px-4 py-2 rounded-lg
              bg-violet-500 hover:bg-violet-600
              text-white font-medium
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
              disabled:bg-gray-300 disabled:cursor-not-allowed
            "
            data-testid="note-preview-create-button"
          >
            {isSubmitting ? 'Creating...' : 'Create Note'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="
              px-4 py-2 rounded-lg
              bg-white hover:bg-gray-100
              text-gray-700 font-medium
              border border-gray-300
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              disabled:bg-gray-100 disabled:cursor-not-allowed
            "
            data-testid="note-preview-cancel-button"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ParsedNotePreview;
