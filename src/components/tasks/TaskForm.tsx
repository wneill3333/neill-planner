/**
 * TaskForm Component
 *
 * Main form for creating and editing tasks.
 * Includes title, description, priority, category, date, and time inputs.
 */

import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import type { Task, PriorityLetter, Category, CreateTaskInput, TaskStatus } from '../../types';
import { TaskStatusSymbols, TaskStatusLabels } from '../../types';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';
import { Select, type SelectOption } from '../common/Select';
import { DatePicker } from '../common/DatePicker';
import { TimePicker } from '../common/TimePicker';
import { CategorySelect } from '../categories/CategorySelect';

// =============================================================================
// Types
// =============================================================================

export interface TaskFormProps {
  /** Existing task to edit (null for create mode) */
  task?: Task | null;
  /** Available categories for selection */
  categories?: Category[];
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
  title: string;
  description: string;
  priority: string;
  categoryId: string;
  scheduledDate: Date | null;
  scheduledTime: string;
  status: TaskStatus;
}

interface FormErrors {
  title?: string;
  priority?: string;
  scheduledDate?: string;
}

// =============================================================================
// Constants
// =============================================================================

// Priority options removed - now using text input

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'in_progress', label: `${TaskStatusSymbols.in_progress} ${TaskStatusLabels.in_progress}` },
  { value: 'complete', label: `${TaskStatusSymbols.complete} ${TaskStatusLabels.complete}` },
  { value: 'forward', label: `${TaskStatusSymbols.forward} ${TaskStatusLabels.forward}` },
  { value: 'delete', label: `${TaskStatusSymbols.delete} ${TaskStatusLabels.delete}` },
  { value: 'delegate', label: `${TaskStatusSymbols.delegate} ${TaskStatusLabels.delegate}` },
];

// Validation constants
const TITLE_MAX_LENGTH = 500;
const DESCRIPTION_MAX_LENGTH = 5000;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validate form data
 */
function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  // Title is required
  if (!data.title.trim()) {
    errors.title = 'Title is required';
  } else if (data.title.length > TITLE_MAX_LENGTH) {
    errors.title = `Title must be ${TITLE_MAX_LENGTH} characters or less`;
  }

  // Priority is required and must match pattern: letter (A-D) followed by optional number (1-99)
  if (!data.priority.trim()) {
    errors.priority = 'Priority is required';
  } else {
    // Match letter followed by optional digits (allow 1-3 digits for better validation error messages)
    const priorityPattern = /^[A-Da-d](\d{1,3})?$/;
    const match = data.priority.trim().match(priorityPattern);

    if (!match) {
      errors.priority = 'Priority must be a letter (A-D) optionally followed by a number (1-99)';
    } else if (match[1]) {
      // Check if number is in valid range (1-99)
      const num = parseInt(match[1], 10);
      if (num < 1 || num > 99) {
        errors.priority = 'Priority number must be between 1 and 99';
      }
    }
  }

  // Scheduled date is required
  if (!data.scheduledDate) {
    errors.scheduledDate = 'Scheduled date is required';
  }

  return errors;
}

/**
 * Format date for display (e.g., "Jan 15, 2026")
 */
function formatCreatedDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Parse priority string into letter and optional number
 * @param priorityStr - Priority string (e.g., "A1", "B", "C3")
 * @returns Object with letter (A-D) and optional number (1-99)
 * @example
 * parsePriority("A1") // { letter: 'A', number: 1 }
 * parsePriority("B") // { letter: 'B', number: undefined }
 * parsePriority("invalid") // { letter: 'B' } (fallback)
 */
function parsePriority(priorityStr: string): { letter: PriorityLetter; number?: number } {
  const match = priorityStr.trim().toUpperCase().match(/^([A-D])(\d+)?$/);
  if (!match) {
    // Fallback to B if invalid
    return { letter: 'B' };
  }
  const letter = match[1] as PriorityLetter;
  const number = match[2] ? parseInt(match[2], 10) : undefined;
  return { letter, number };
}

/**
 * Convert form data to CreateTaskInput
 */
function formDataToTaskInput(data: FormData, isEditMode: boolean): CreateTaskInput {
  const parsedPriority = parsePriority(data.priority);

  const input: CreateTaskInput = {
    title: data.title.trim(),
    description: data.description.trim(),
    priority: {
      letter: parsedPriority.letter,
      number: parsedPriority.number, // undefined if not provided, thunk will auto-generate
    },
    categoryId: data.categoryId || null,
    scheduledDate: data.scheduledDate,
    scheduledTime: data.scheduledTime || null,
  };

  // Include status only in edit mode
  if (isEditMode) {
    input.status = data.status;
  }

  return input;
}

// =============================================================================
// Component
// =============================================================================

/**
 * TaskForm - Form for creating and editing tasks
 *
 * Handles form validation, state management, and submission.
 * Supports both create and edit modes based on the task prop.
 *
 * @example
 * ```tsx
 * <TaskForm
 *   categories={categories}
 *   onSubmit={(data) => createTask(data)}
 *   onCancel={() => setShowForm(false)}
 * />
 * ```
 */
export function TaskForm({
  task = null,
  categories = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
  testId,
}: TaskFormProps) {
  // Track previous task ID to detect when task prop changes
  const prevTaskIdRef = useRef<string | null>(task?.id ?? null);

  // Helper to create form data from task
  const createFormDataFromTask = (t: Task | null): FormData => ({
    title: t?.title || '',
    description: t?.description || '',
    priority: t ? `${t.priority.letter}${t.priority.number || ''}` : 'B',
    categoryId: t?.categoryId || '',
    scheduledDate: t?.scheduledDate || null,
    scheduledTime: t?.scheduledTime || '',
    status: t?.status || 'in_progress',
  });

  // Form state
  const [formData, setFormData] = useState<FormData>(() => createFormDataFromTask(task));
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Determine if we're in edit mode
  const isEditMode = Boolean(task);

  // Update form when task changes (edit mode) - sync props to state
  // This is a legitimate pattern for responding to prop changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (task && task.id !== prevTaskIdRef.current) {
      prevTaskIdRef.current = task.id;
      setFormData(createFormDataFromTask(task));
      setErrors({});
      setTouched({});
    }
  }, [task]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Handle field changes - memoized to prevent unnecessary child re-renders
  const handleChange = useCallback((field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
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
  const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    // Mark all fields as touched
    setTouched({
      title: true,
      priority: true,
      scheduledDate: true,
    });

    // If validation fails, don't submit
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // Convert form data and submit
    const taskInput = formDataToTaskInput(formData, isEditMode);
    onSubmit(taskInput);
  }, [formData, isEditMode, onSubmit]);

  // Show errors only for touched fields
  const getFieldError = (field: keyof FormErrors): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      data-testid={testId || 'task-form'}
      noValidate
    >
      {/* Form Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Task' : 'Create New Task'}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {isEditMode
            ? 'Update task details below'
            : 'Fill in the details to create a new task'}
        </p>
      </div>

      {/* Title Field */}
      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        onBlur={() => handleBlur('title')}
        error={getFieldError('title')}
        placeholder="Enter task title"
        required
        fullWidth
        maxLength={TITLE_MAX_LENGTH}
        disabled={isSubmitting}
        autoFocus
      />

      {/* Description Field */}
      <TextArea
        label="Description"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        placeholder="Enter task description (optional)"
        helperText="Optional details about the task"
        rows={4}
        fullWidth
        maxLength={DESCRIPTION_MAX_LENGTH}
        disabled={isSubmitting}
      />

      {/* Priority and Category Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Priority Input */}
        <Input
          label="Priority"
          value={formData.priority}
          onChange={(e) => handleChange('priority', e.target.value.toUpperCase())}
          onBlur={() => handleBlur('priority')}
          error={getFieldError('priority')}
          placeholder="e.g., A1, B2, C"
          required
          fullWidth
          maxLength={3}
          disabled={isSubmitting}
        />

        {/* Category Select */}
        <CategorySelect
          label="Category"
          categories={categories}
          value={formData.categoryId || null}
          onChange={(categoryId) => handleChange('categoryId', categoryId || '')}
          helperText="Optional category for organization"
          disabled={isSubmitting}
          testId="category-select"
        />
      </div>

      {/* Date and Time Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Scheduled Date */}
        <DatePicker
          label="Scheduled Date"
          value={formData.scheduledDate}
          onChange={(date) => handleChange('scheduledDate', date)}
          onBlur={() => handleBlur('scheduledDate')}
          error={getFieldError('scheduledDate')}
          minDate={new Date()}
          required
          fullWidth
          disabled={isSubmitting}
        />

        {/* Scheduled Time */}
        <TimePicker
          label="Scheduled Time"
          value={formData.scheduledTime}
          onChange={(time) => handleChange('scheduledTime', time)}
          helperText="Optional specific time"
          fullWidth
          disabled={isSubmitting}
        />
      </div>

      {/* Edit Mode Only: Status and Created Date */}
      {isEditMode && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Status Select */}
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value as TaskStatus)}
            fullWidth
            disabled={isSubmitting}
          />

          {/* Created Date (Read-only) */}
          {task?.createdAt && (
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600">
                {formatCreatedDate(new Date(task.createdAt))}
              </div>
            </div>
          )}
        </div>
      )}

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
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
              {isEditMode ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            <span>{isEditMode ? 'Update Task' : 'Create Task'}</span>
          )}
        </button>
      </div>
    </form>
  );
}

export default TaskForm;
