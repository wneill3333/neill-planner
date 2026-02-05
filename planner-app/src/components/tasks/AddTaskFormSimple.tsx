/**
 * AddTaskFormSimple Component
 *
 * Simplified add task form with:
 * - Priority + Task Description on same row
 * - Category dropdown
 * - Simple recurrence checkbox with Daily/Weekly/Monthly radio buttons
 */

import { useState, useCallback, type FormEvent } from 'react';
import type {
  Category,
  CreateTaskInput,
  PriorityLetter,
  RecurrencePattern,
} from '../../types';
import { Input } from '../common/Input';
import { Toggle } from '../common/Toggle';
import { CategorySelect } from '../categories/CategorySelect';
import { RecurrenceFormSimple } from './RecurrenceFormSimple';
import { DatePicker } from '../common/DatePicker';

// =============================================================================
// Types
// =============================================================================

export interface AddTaskFormSimpleProps {
  /** Available categories for selection */
  categories?: Category[];
  /** Default scheduled date for new tasks */
  defaultDate?: Date | null;
  /** Default priority for new tasks (e.g., "B", "A1", "B2") */
  defaultPriority?: string;
  /** Existing task to edit (if provided, form is in edit mode) */
  task?: {
    title: string;
    priority: { letter: PriorityLetter; number: number };
    categoryId: string | null;
    recurrence: RecurrencePattern | null;
  };
  /** Callback when form is submitted */
  onSubmit: (data: CreateTaskInput) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether form is in submitting state */
  isSubmitting?: boolean;
  /** Test ID for testing */
  testId?: string;
}

interface FormData {
  priority: string;
  title: string;
  categoryId: string;
  isRecurring: boolean;
  recurrence: RecurrencePattern | null;
  /** Custom start date for recurring tasks (null = use defaultDate) */
  customStartDate: Date | null;
}

interface FormErrors {
  priority?: string;
  title?: string;
}

// =============================================================================
// Constants
// =============================================================================

const TITLE_MAX_LENGTH = 500;

const DEFAULT_RECURRENCE_PATTERN: RecurrencePattern = {
  type: 'daily',
  interval: 1,
  daysOfWeek: [],
  dayOfMonth: null,
  monthOfYear: null,
  endCondition: {
    type: 'occurrences',
    endDate: null,
    maxOccurrences: 10,
  },
  exceptions: [],
};

// =============================================================================
// Helper Functions
// =============================================================================

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  // Priority is required and must match pattern: letter (A-D) followed by optional number
  if (!data.priority.trim()) {
    errors.priority = 'Required';
  } else {
    const priorityPattern = /^[A-Da-d](\d{1,2})?$/;
    if (!priorityPattern.test(data.priority.trim())) {
      errors.priority = 'A-D + number';
    }
  }

  // Title is required
  if (!data.title.trim()) {
    errors.title = 'Task description is required';
  } else if (data.title.length > TITLE_MAX_LENGTH) {
    errors.title = `Max ${TITLE_MAX_LENGTH} characters`;
  }

  return errors;
}

function parsePriority(priorityStr: string): { letter: PriorityLetter; number?: number } {
  const match = priorityStr.trim().toUpperCase().match(/^([A-D])(\d+)?$/);
  if (!match) {
    return { letter: 'B' };
  }
  const letter = match[1] as PriorityLetter;
  const number = match[2] ? parseInt(match[2], 10) : undefined;
  return { letter, number };
}

function formDataToTaskInput(data: FormData, defaultDate: Date | null): CreateTaskInput {
  const parsedPriority = parsePriority(data.priority);

  // For recurring tasks, use custom start date if set, otherwise use default
  const scheduledDate = data.isRecurring && data.customStartDate
    ? data.customStartDate
    : defaultDate;

  return {
    title: data.title.trim(),
    description: '', // Simplified form doesn't have description
    priority: {
      letter: parsedPriority.letter,
      number: parsedPriority.number,
    },
    categoryId: data.categoryId || null,
    scheduledDate,
    recurrence: data.isRecurring ? data.recurrence : null,
  };
}

// =============================================================================
// Component
// =============================================================================

/**
 * AddTaskFormSimple - Simplified add task form
 *
 * Layout:
 * ```
 * [Priority: A1] [Task Description...............]
 * [Category: ▼ Select Category                   ]
 * [ ] Make this a recurring task
 *     ○ Daily  ● Weekly  ○ Monthly
 *     [Su] [M] [Tu] [W] [Th] [F] [Sa]
 *     Ends: ○ After [10] occurrences  ○ Until date [📅]
 * [Add Task]  [Cancel]
 * ```
 */
export function AddTaskFormSimple({
  categories = [],
  defaultDate = null,
  defaultPriority = 'B',
  task,
  onSubmit,
  onCancel,
  isSubmitting = false,
  testId,
}: AddTaskFormSimpleProps) {
  // Determine if we're in edit mode
  const isEditMode = !!task;

  // Form state - initialize from task if editing
  const [formData, setFormData] = useState<FormData>(() => {
    if (task) {
      return {
        priority: `${task.priority.letter}${task.priority.number}`,
        title: task.title,
        categoryId: task.categoryId || '',
        isRecurring: task.recurrence !== null,
        recurrence: task.recurrence,
        customStartDate: null, // Will use defaultDate if null
      };
    }
    return {
      priority: defaultPriority,
      title: '',
      categoryId: '',
      isRecurring: false,
      recurrence: null,
      customStartDate: null, // Will use defaultDate if null
    };
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Handle field changes
  const handleChange = useCallback((field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    setErrors((prev) => {
      if (prev[field as keyof FormErrors]) {
        return { ...prev, [field]: undefined };
      }
      return prev;
    });
  }, []);

  // Handle field blur
  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  }, []);

  // Handle recurrence toggle
  const handleRecurrenceToggle = useCallback(
    (checked: boolean) => {
      handleChange('isRecurring', checked);
      handleChange('recurrence', checked ? DEFAULT_RECURRENCE_PATTERN : null);
    },
    [handleChange]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate form
      const validationErrors = validateForm(formData);
      setErrors(validationErrors);

      // Mark all fields as touched
      setTouched({
        priority: true,
        title: true,
      });

      // If validation fails, don't submit
      if (Object.keys(validationErrors).length > 0) {
        return;
      }

      // Convert form data and submit
      const taskInput = formDataToTaskInput(formData, defaultDate);
      onSubmit(taskInput);
    },
    [formData, defaultDate, onSubmit]
  );

  // Get error for a field (only if touched)
  const getFieldError = (field: keyof FormErrors): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-testid={testId || 'add-task-form-simple'}
      noValidate
    >
      {/* Priority and Title Row */}
      <div className="flex gap-3">
        {/* Priority Input */}
        <div className="w-24 flex-shrink-0">
          <Input
            label="Priority"
            value={formData.priority}
            onChange={(e) => handleChange('priority', e.target.value.toUpperCase())}
            onBlur={() => handleBlur('priority')}
            error={getFieldError('priority')}
            placeholder="A1"
            required
            maxLength={3}
            disabled={isSubmitting}
            testId="priority-input"
          />
        </div>

        {/* Title Input */}
        <div className="flex-1">
          <Input
            label="Task Description"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            onBlur={() => handleBlur('title')}
            error={getFieldError('title')}
            placeholder="Enter task description"
            required
            fullWidth
            maxLength={TITLE_MAX_LENGTH}
            disabled={isSubmitting}
            autoFocus
            testId="title-input"
          />
        </div>
      </div>

      {/* Category Select */}
      <CategorySelect
        label="Category"
        categories={categories}
        value={formData.categoryId || null}
        onChange={(categoryId) => handleChange('categoryId', categoryId || '')}
        disabled={isSubmitting}
        testId="category-select"
      />

      {/* Recurrence Section */}
      <div className="space-y-3">
        <Toggle
          label="Make this a recurring task"
          checked={formData.isRecurring}
          onChange={handleRecurrenceToggle}
          disabled={isSubmitting}
          testId="recurring-toggle"
        />

        {formData.isRecurring && (
          <>
            {/* Start Date Picker */}
            <div className="pl-4 border-l-2 border-amber-200">
              <DatePicker
                label="Start Date"
                value={formData.customStartDate || defaultDate}
                onChange={(date) => handleChange('customStartDate', date)}
                disabled={isSubmitting}
                testId="start-date-picker"
              />
              <p className="mt-1 text-xs text-gray-500">
                The recurring task will begin on this date
              </p>
            </div>

            <RecurrenceFormSimple
              value={formData.recurrence}
              onChange={(pattern) => handleChange('recurrence', pattern)}
              disabled={isSubmitting}
              testId="recurrence-form"
            />
          </>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="
            px-4 py-2 text-sm font-medium rounded-lg
            bg-gray-100 text-gray-700
            hover:bg-gray-200
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
          data-testid="cancel-button"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="
            px-4 py-2 text-sm font-medium rounded-lg
            bg-amber-500 text-white
            hover:bg-amber-600
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
          data-testid="submit-button"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              {isEditMode ? 'Updating...' : 'Adding...'}
            </span>
          ) : (
            isEditMode ? 'Update Task' : 'Add Task'
          )}
        </button>
      </div>
    </form>
  );
}

export default AddTaskFormSimple;
