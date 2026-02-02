/**
 * TaskForm Component
 *
 * Main form for creating and editing tasks.
 * Includes title, description, priority, category, date, and time inputs.
 */

import { useState, useEffect, useRef, useCallback, useMemo, type FormEvent } from 'react';
import type { Task, PriorityLetter, Category, CreateTaskInput, TaskStatus } from '../../types';
import { TaskStatusSymbols, TaskStatusLabels } from '../../types';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';
import { Select, type SelectOption } from '../common/Select';
import { DatePicker } from '../common/DatePicker';
import { TimePicker } from '../common/TimePicker';

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
  priorityLetter: PriorityLetter;
  categoryId: string;
  scheduledDate: Date | null;
  scheduledTime: string;
  status: TaskStatus;
}

interface FormErrors {
  title?: string;
  priorityLetter?: string;
  scheduledDate?: string;
}

// =============================================================================
// Constants
// =============================================================================

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
];

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

  // Priority is required
  if (!data.priorityLetter) {
    errors.priorityLetter = 'Priority is required';
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
 * Convert form data to CreateTaskInput
 */
function formDataToTaskInput(data: FormData, isEditMode: boolean): CreateTaskInput {
  const input: CreateTaskInput = {
    title: data.title.trim(),
    description: data.description.trim(),
    priority: {
      letter: data.priorityLetter,
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
  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: task?.title || '',
    description: task?.description || '',
    priorityLetter: task?.priority.letter || 'B',
    categoryId: task?.categoryId || '',
    scheduledDate: task?.scheduledDate || null,
    scheduledTime: task?.scheduledTime || '',
    status: task?.status || 'in_progress',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Track previous task ID to avoid unnecessary form resets
  const prevTaskIdRef = useRef<string | null>(task?.id ?? null);

  // Determine if we're in edit mode
  const isEditMode = Boolean(task);

  // Update form when task changes (edit mode) - compare by ID, not object reference
  useEffect(() => {
    if (task && task.id !== prevTaskIdRef.current) {
      prevTaskIdRef.current = task.id;
      setFormData({
        title: task.title,
        description: task.description,
        priorityLetter: task.priority.letter,
        categoryId: task.categoryId || '',
        scheduledDate: task.scheduledDate,
        scheduledTime: task.scheduledTime || '',
        status: task.status,
      });
    }
  }, [task]);

  // Memoize category options to prevent recreation on every render
  const categoryOptions = useMemo<SelectOption[]>(() => [
    { value: '', label: 'None (Uncategorized)' },
    ...categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })),
  ], [categories]);

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
      priorityLetter: true,
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
        {/* Priority Select */}
        <Select
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={formData.priorityLetter}
          onChange={(e) => handleChange('priorityLetter', e.target.value as PriorityLetter)}
          onBlur={() => handleBlur('priorityLetter')}
          error={getFieldError('priorityLetter')}
          required
          fullWidth
          disabled={isSubmitting}
        />

        {/* Category Select */}
        <Select
          label="Category"
          options={categoryOptions}
          value={formData.categoryId}
          onChange={(e) => handleChange('categoryId', e.target.value)}
          helperText="Optional category for organization"
          fullWidth
          disabled={isSubmitting}
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
