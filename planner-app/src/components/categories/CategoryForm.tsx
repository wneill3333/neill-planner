/**
 * CategoryForm Component
 *
 * Form for creating and editing categories.
 * Includes name input and color picker with validation.
 */

import { useState, useCallback, type FormEvent } from 'react';
import type { CreateCategoryInput } from '../../types';
import { CATEGORY_COLORS } from '../../types';
import { Input } from '../common/Input';
import { ColorPicker } from './ColorPicker';

// =============================================================================
// Types
// =============================================================================

export interface CategoryFormProps {
  /** Initial values for editing (null for create mode) */
  initialValues?: {
    name: string;
    color: string;
  } | null;
  /** Callback when form is submitted */
  onSubmit: (data: CreateCategoryInput) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether form is in submitting state */
  isSubmitting?: boolean;
  /** Error message from async operations */
  error?: string | null;
  /** Existing category names for duplicate validation */
  existingNames?: string[];
  /** Test ID for testing */
  testId?: string;
}

interface FormData {
  name: string;
  color: string;
}

interface FormErrors {
  name?: string;
  color?: string;
}

// =============================================================================
// Constants
// =============================================================================

const NAME_MAX_LENGTH = 50;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validate form data
 */
function validateForm(
  data: FormData,
  existingNames: string[] = [],
  currentName?: string
): FormErrors {
  const errors: FormErrors = {};

  // Name validation
  const trimmedName = data.name.trim();
  if (!trimmedName) {
    errors.name = 'Category name is required';
  } else if (trimmedName.length > NAME_MAX_LENGTH) {
    errors.name = `Name must be ${NAME_MAX_LENGTH} characters or less`;
  } else {
    // Check for duplicate names (case-insensitive)
    const isDuplicate = existingNames.some(
      (existingName) =>
        existingName.toLowerCase() === trimmedName.toLowerCase() &&
        existingName !== currentName // Allow keeping the same name when editing
    );
    if (isDuplicate) {
      errors.name = 'A category with this name already exists';
    }
  }

  // Color validation
  if (!data.color) {
    errors.color = 'Please select a color';
  }

  return errors;
}

// =============================================================================
// Component
// =============================================================================

/**
 * CategoryForm - Form for creating and editing categories
 *
 * Handles form validation, state management, and submission.
 * Supports both create and edit modes based on initialValues prop.
 *
 * @example
 * ```tsx
 * <CategoryForm
 *   onSubmit={(data) => createCategory(data)}
 *   onCancel={() => setShowForm(false)}
 *   existingNames={categories.map(c => c.name)}
 * />
 * ```
 */
export function CategoryForm({
  initialValues = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = null,
  existingNames = [],
  testId,
}: CategoryFormProps) {
  // Determine if we're in edit mode
  const isEditing = Boolean(initialValues);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: initialValues?.name || '',
    color: initialValues?.color || CATEGORY_COLORS[0],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Handle field changes - memoized to prevent unnecessary re-renders
  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user changes it
    setErrors((prev) => {
      if (prev[field as keyof FormErrors]) {
        return { ...prev, [field]: undefined };
      }
      return prev;
    });
  }, []);

  // Handle field blur (mark as touched) - memoized
  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  }, []);

  // Handle form submission - memoized
  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate form
      const validationErrors = validateForm(
        formData,
        existingNames,
        initialValues?.name
      );
      setErrors(validationErrors);

      // Mark all fields as touched
      setTouched({
        name: true,
        color: true,
      });

      // If validation fails, don't submit
      if (Object.keys(validationErrors).length > 0) {
        return;
      }

      // Submit the form data
      const categoryInput: CreateCategoryInput = {
        name: formData.name.trim(),
        color: formData.color,
      };

      onSubmit(categoryInput);
    },
    [formData, existingNames, initialValues?.name, onSubmit]
  );

  // Show errors only for touched fields
  const getFieldError = (field: keyof FormErrors): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      data-testid={testId || 'category-form'}
      noValidate
    >
      {/* Form Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Category' : 'Create New Category'}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {isEditing
            ? 'Update category details below'
            : 'Create a category to organize your tasks'}
        </p>
      </div>

      {/* Server Error Message */}
      {error && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Name Field */}
      <Input
        label="Category Name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        onBlur={() => handleBlur('name')}
        error={getFieldError('name')}
        placeholder="Enter category name"
        required
        fullWidth
        maxLength={NAME_MAX_LENGTH}
        disabled={isSubmitting}
        autoFocus
        testId="category-name-input"
      />

      {/* Color Picker */}
      <ColorPicker
        label="Category Color"
        value={formData.color}
        onChange={(color) => handleChange('color', color)}
        error={getFieldError('color')}
        required
        disabled={isSubmitting}
        testId="category-color-picker"
      />

      {/* Form Actions */}
      <div className="flex flex-col gap-3 pt-6 border-t border-gray-200 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="
            w-full sm:w-auto px-6 py-2 rounded-lg
            bg-gray-200 text-gray-700 font-medium
            transition-colors
            hover:bg-gray-300
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          data-testid="category-form-cancel"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="
            w-full sm:w-auto px-6 py-2 rounded-lg
            bg-amber-500 text-white font-medium
            transition-colors
            hover:bg-amber-600
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          data-testid="category-form-submit"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
              {isEditing ? 'Saving...' : 'Creating...'}
            </span>
          ) : (
            <span>{isEditing ? 'Save Changes' : 'Create Category'}</span>
          )}
        </button>
      </div>
    </form>
  );
}

export default CategoryForm;
