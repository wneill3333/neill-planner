/**
 * JournalForm Component
 *
 * Form for creating or editing a journal (title + description).
 */

import { useState, useEffect, memo, type FormEvent } from 'react';
import type { Journal, Category } from '../../types';
import { CategorySelect } from '../categories/CategorySelect';

// =============================================================================
// Types
// =============================================================================

export interface JournalFormProps {
  /** Journal to edit (null for create mode) */
  journal?: Journal | null;
  /** Available categories */
  categories?: Category[];
  /** Submit handler */
  onSubmit: (data: { title: string; description: string; categoryId: string | null }) => void;
  /** Cancel handler */
  onCancel: () => void;
  /** Submitting state */
  isSubmitting?: boolean;
  /** Test ID for testing */
  testId?: string;
}

interface FormData {
  title: string;
  description: string;
  categoryId: string;
}

interface FormErrors {
  title?: string;
}

// =============================================================================
// Constants
// =============================================================================

const TITLE_MAX_LENGTH = 500;
const DESCRIPTION_MAX_LENGTH = 5000;

// =============================================================================
// Helpers
// =============================================================================

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.title.trim()) {
    errors.title = 'Title is required';
  } else if (data.title.length > TITLE_MAX_LENGTH) {
    errors.title = `Title must be ${TITLE_MAX_LENGTH} characters or less`;
  }

  return errors;
}

// =============================================================================
// Component
// =============================================================================

/**
 * JournalForm - Create/edit journal form
 *
 * Features:
 * - Title input (required)
 * - Description textarea (optional)
 * - Form validation
 * - Cancel and Submit buttons
 *
 * @example
 * ```tsx
 * <JournalForm
 *   journal={journal}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export const JournalForm = memo(function JournalForm({
  journal,
  categories = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
  testId,
}: JournalFormProps) {
  const isEditMode = !!journal;

  const [formData, setFormData] = useState<FormData>({
    title: journal?.title || '',
    description: journal?.description || '',
    categoryId: journal?.categoryId || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Update form when journal changes (edit mode)
  useEffect(() => {
    if (journal) {
      setFormData({
        title: journal.title,
        description: journal.description || '',
        categoryId: journal.categoryId || '',
      });
    }
  }, [journal]);

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
      description: formData.description.trim(),
      categoryId: formData.categoryId || null,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-testid={testId || 'journal-form'}
    >
      {/* Title */}
      <div className="space-y-1">
        <label htmlFor="journal-title" className="block text-sm font-medium text-gray-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="journal-title"
          type="text"
          value={formData.title}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, title: e.target.value }));
            if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
          }}
          placeholder="Enter journal title"
          maxLength={TITLE_MAX_LENGTH}
          disabled={isSubmitting}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            errors.title ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
          }`}
          data-testid="journal-title-input"
        />
        {errors.title && (
          <p className="text-sm text-red-600" data-testid="title-error">
            {errors.title}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label htmlFor="journal-description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="journal-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="What is this journal about? (optional)"
          rows={3}
          maxLength={DESCRIPTION_MAX_LENGTH}
          disabled={isSubmitting}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed resize-y"
          data-testid="journal-description-input"
        />
      </div>

      {/* Category */}
      <CategorySelect
        label="Category (Optional)"
        value={formData.categoryId || null}
        onChange={(value) => setFormData(prev => ({ ...prev, categoryId: value || '' }))}
        categories={categories}
        disabled={isSubmitting}
        testId="journal-category-select"
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
          {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Journal'}
        </button>
      </div>
    </form>
  );
});
