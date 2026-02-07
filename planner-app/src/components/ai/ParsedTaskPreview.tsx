/**
 * ParsedTaskPreview Component
 *
 * Modal showing AI-parsed task data for user review and editing before creation.
 * Allows users to confirm or modify the AI's interpretation.
 */

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../../features/auth';
import {
  selectIsPreviewOpen,
  selectParsedTask,
  clearAi,
} from '../../features/ai/aiSlice';
import { createTask } from '../../features/tasks/taskThunks';
import { selectAllCategories } from '../../features/categories/categorySlice';
import { Modal } from '../common/Modal';
import { DatePicker } from '../common/DatePicker';
import { TimePicker } from '../common/TimePicker';
import { CategorySelect } from '../categories/CategorySelect';
import type { PriorityLetter, CreateTaskInput } from '../../types';

// =============================================================================
// Types
// =============================================================================

interface FormData {
  title: string;
  priority: string;
  date: Date | null;
  startTime: string;
  categoryId: string | null;
  duration: number;
}

interface FormErrors {
  title?: string;
  priority?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function parsePriority(priorityStr: string): { letter: PriorityLetter; number?: number } | null {
  const trimmed = priorityStr.trim().toUpperCase();
  const match = trimmed.match(/^([A-D])(\d{1,2})?$/);

  if (!match) return null;

  const letter = match[1] as PriorityLetter;
  const number = match[2] ? parseInt(match[2], 10) : undefined;

  if (number !== undefined && (number < 1 || number > 99)) {
    return null;
  }

  return { letter, number };
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.title.trim()) {
    errors.title = 'Title is required';
  } else if (data.title.length > 500) {
    errors.title = 'Title must be 500 characters or less';
  }

  if (!data.priority.trim()) {
    errors.priority = 'Priority is required';
  } else if (!parsePriority(data.priority)) {
    errors.priority = 'Priority must be a letter (A-D) optionally followed by a number (1-99)';
  }

  return errors;
}

// =============================================================================
// Component
// =============================================================================

export function ParsedTaskPreview() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const isOpen = useAppSelector(selectIsPreviewOpen);
  const parsedTask = useAppSelector(selectParsedTask);
  const categories = useAppSelector(selectAllCategories);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    priority: '',
    date: null,
    startTime: '',
    categoryId: null,
    duration: 0,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when parsedTask changes
  useEffect(() => {
    if (parsedTask) {
      const matchedCategory = parsedTask.categoryName
        ? categories.find((cat) => cat.name === parsedTask.categoryName)
        : null;

      setFormData({
        title: parsedTask.title,
        priority: parsedTask.priority,
        date: parsedTask.date
          ? (() => {
              const [y, m, d] = parsedTask.date.split('-').map(Number);
              return new Date(y, m - 1, d);
            })()
          : null,
        startTime: parsedTask.startTime || '',
        categoryId: matchedCategory?.id || null,
        duration: parsedTask.duration || 0,
      });
      setErrors({});
    }
  }, [parsedTask, categories]);

  const handleClose = () => {
    dispatch(clearAi());
    setIsSubmitting(false);
  };

  const handleCreateTask = async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const parsedPriority = parsePriority(formData.priority);
    if (!parsedPriority || !user) return;

    setIsSubmitting(true);

    const input: CreateTaskInput = {
      title: formData.title.trim(),
      priority: parsedPriority,
      scheduledDate: formData.date,
      startTime: formData.startTime || null,
      duration: formData.duration > 0 ? formData.duration : null,
      categoryId: formData.categoryId,
      showOnCalendar: Boolean(formData.startTime),
    };

    try {
      await dispatch(createTask({ input, userId: user.id })).unwrap();
      handleClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      setIsSubmitting(false);
    }
  };

  const showLowConfidenceWarning = parsedTask && parsedTask.confidence < 0.7;

  if (!isOpen || !parsedTask) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Review AI Task"
      size="md"
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
              AI confidence is low. Please review carefully.
            </p>
          </div>
        )}

        {/* Title */}
        <div>
          <label
            htmlFor="task-title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              setErrors({ ...errors, title: undefined });
            }}
            className={`
              block w-full px-3 py-2 rounded-lg border transition-colors
              text-gray-900 bg-white
              focus:outline-none focus:ring-2 focus:ring-offset-1
              ${
                errors.title
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }
            `}
            aria-invalid={Boolean(errors.title)}
            data-testid="preview-title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.title}
            </p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label
            htmlFor="task-priority"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Priority <span className="text-red-500">*</span>
          </label>
          <input
            id="task-priority"
            type="text"
            value={formData.priority}
            onChange={(e) => {
              setFormData({ ...formData, priority: e.target.value.toUpperCase() });
              setErrors({ ...errors, priority: undefined });
            }}
            placeholder="e.g., A1, B, C3"
            className={`
              block w-full px-3 py-2 rounded-lg border transition-colors
              text-gray-900 bg-white uppercase
              focus:outline-none focus:ring-2 focus:ring-offset-1
              ${
                errors.priority
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }
            `}
            aria-invalid={Boolean(errors.priority)}
            data-testid="preview-priority"
          />
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.priority}
            </p>
          )}
        </div>

        {/* Date */}
        <DatePicker
          label="Scheduled Date"
          value={formData.date}
          onChange={(date) => setFormData({ ...formData, date })}
          fullWidth
          testId="preview-date"
        />

        {/* Time */}
        <TimePicker
          label="Start Time"
          value={formData.startTime}
          onChange={(time) => setFormData({ ...formData, startTime: time })}
          fullWidth
          helperText="Optional specific time"
          testId="preview-time"
        />

        {/* Category */}
        <CategorySelect
          label="Category"
          value={formData.categoryId}
          onChange={(categoryId) => setFormData({ ...formData, categoryId })}
          categories={categories}
          testId="preview-category"
        />

        {/* Duration */}
        <div>
          <label
            htmlFor="task-duration"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Duration (minutes)
          </label>
          <input
            id="task-duration"
            type="number"
            min="0"
            step="5"
            value={formData.duration}
            onChange={(e) =>
              setFormData({ ...formData, duration: Math.max(0, parseInt(e.target.value, 10) || 0) })
            }
            className="
              block w-full px-3 py-2 rounded-lg border border-gray-300
              text-gray-900 bg-white
              focus:outline-none focus:ring-2 focus:ring-offset-1
              focus:border-blue-500 focus:ring-blue-500
            "
            data-testid="preview-duration"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <button
            type="button"
            onClick={handleCreateTask}
            disabled={isSubmitting}
            className="
              flex-1 px-4 py-2 rounded-lg
              bg-amber-500 hover:bg-amber-600
              text-white font-medium
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
              disabled:bg-gray-300 disabled:cursor-not-allowed
            "
            data-testid="preview-create-button"
          >
            {isSubmitting ? 'Creating...' : 'Create Task'}
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
            data-testid="preview-cancel-button"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ParsedTaskPreview;
