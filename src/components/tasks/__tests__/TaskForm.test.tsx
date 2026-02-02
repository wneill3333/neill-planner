/**
 * TaskForm Component Tests
 *
 * Comprehensive tests for the TaskForm component including:
 * - Rendering tests (all fields, create vs edit mode)
 * - Validation tests (required fields, max length)
 * - Submission tests (valid data, trimming, null values)
 * - Cancel tests
 * - Loading state tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '../TaskForm';
import type { CreateTaskInput, Task, Category } from '../../../types';

// Helper to get a future date string in YYYY-MM-DD format
function getFutureDateString(): string {
  const future = new Date();
  future.setDate(future.getDate() + 7); // 7 days in the future
  return future.toISOString().split('T')[0];
}

// =============================================================================
// Test Helpers
// =============================================================================

function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: 'user-1',
    title: 'Existing Task',
    description: 'Existing Description',
    categoryId: 'cat-1',
    priority: { letter: 'B', number: 2 },
    status: 'in_progress',
    scheduledDate: new Date('2024-01-15'),
    scheduledTime: '14:00',
    recurrence: null,
    linkedNoteIds: [],
    linkedEventId: null,
    isRecurringInstance: false,
    recurringParentId: null,
    instanceDate: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ...overrides,
  };
}

function createMockCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    userId: 'user-1',
    name: 'Work',
    color: '#3B82F6',
    icon: null,
    isDefault: false,
    sortOrder: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// =============================================================================
// Rendering Tests
// =============================================================================

describe('TaskForm - Rendering', () => {
  it('should render all form fields', () => {
    const categories = [createMockCategory()];
    render(<TaskForm categories={categories} onSubmit={() => {}} onCancel={() => {}} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/scheduled date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/scheduled time/i)).toBeInTheDocument();
  });

  it('should render submit and cancel buttons', () => {
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

    expect(screen.getByText(/create task/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
  });

  it('should render with default testId', () => {
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

    expect(screen.getByTestId('task-form')).toBeInTheDocument();
  });

  it('should render with custom testId', () => {
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} testId="custom-form" />);

    expect(screen.getByTestId('custom-form')).toBeInTheDocument();
  });

  it('should render title field with required attribute', () => {
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toBeRequired();
  });

  it('should render priority field with required attribute', () => {
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

    const prioritySelect = screen.getByLabelText(/priority/i);
    expect(prioritySelect).toBeRequired();
  });

  it('should render scheduled date field with required attribute', () => {
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

    const dateInput = screen.getByLabelText(/scheduled date/i);
    expect(dateInput).toBeRequired();
  });

  it('should render category options', () => {
    const categories = [
      createMockCategory({ id: 'cat-1', name: 'Work' }),
      createMockCategory({ id: 'cat-2', name: 'Personal' }),
    ];

    render(<TaskForm categories={categories} onSubmit={() => {}} onCancel={() => {}} />);

    const categorySelect = screen.getByLabelText(/category/i);
    expect(categorySelect).toBeInTheDocument();
  });
});

// =============================================================================
// Create vs Edit Mode Tests
// =============================================================================

describe('TaskForm - Create vs Edit Mode', () => {
  it('should show "Create New Task" heading in create mode', () => {
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

    expect(screen.getByText(/create new task/i)).toBeInTheDocument();
  });

  it('should show "Edit Task" heading in edit mode', () => {
    const task = createMockTask();
    render(<TaskForm task={task} onSubmit={() => {}} onCancel={() => {}} />);

    expect(screen.getByText(/edit task/i)).toBeInTheDocument();
  });

  it('should show "Create Task" button text in create mode', () => {
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

    expect(screen.getByText(/^create task$/i)).toBeInTheDocument();
  });

  it('should show "Update Task" button text in edit mode', () => {
    const task = createMockTask();
    render(<TaskForm task={task} onSubmit={() => {}} onCancel={() => {}} />);

    expect(screen.getByText(/^update task$/i)).toBeInTheDocument();
  });

  it('should populate form fields with task data in edit mode', () => {
    const task = createMockTask({
      title: 'Edit This Task',
      description: 'Task to edit',
      priority: { letter: 'A', number: 1 },
    });

    render(<TaskForm task={task} onSubmit={() => {}} onCancel={() => {}} />);

    expect(screen.getByDisplayValue('Edit This Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Task to edit')).toBeInTheDocument();
  });

  it('should update form when task prop changes', () => {
    const task1 = createMockTask({ id: 'task-1', title: 'First Task' });
    const { rerender } = render(<TaskForm task={task1} onSubmit={() => {}} onCancel={() => {}} />);

    expect(screen.getByDisplayValue('First Task')).toBeInTheDocument();

    const task2 = createMockTask({ id: 'task-2', title: 'Second Task' });
    rerender(<TaskForm task={task2} onSubmit={() => {}} onCancel={() => {}} />);

    expect(screen.getByDisplayValue('Second Task')).toBeInTheDocument();
  });
});

// =============================================================================
// Validation Tests
// =============================================================================

describe('TaskForm - Validation', () => {
  it('should show error when title is empty on submit', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<TaskForm onSubmit={handleSubmit} onCancel={() => {}} />);

    const submitButton = screen.getByText(/create task/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should show error when title exceeds max length', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<TaskForm onSubmit={handleSubmit} onCancel={() => {}} />);

    const titleInput = screen.getByLabelText(/title/i);
    const longTitle = 'a'.repeat(501); // Exceeds 500 character limit

    // Use fireEvent to set value directly instead of typing character by character
    await user.clear(titleInput);
    // Directly set the value to avoid timeout from typing 501 characters
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(titleInput, longTitle);
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));

    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(screen.getByText(/title must be 500 characters or less/i)).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should clear error when user starts typing in title field', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

    // Trigger error
    await user.click(screen.getByText(/create task/i));
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });

    // Start typing - just type one character to trigger the clear
    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'N');

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
    });
  });

  it('should only show errors for touched fields after submit', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

    const titleInput = screen.getByLabelText(/title/i);

    // No errors initially
    expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();

    // Submit to show errors (fields become touched on submit)
    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it('should validate that priority is required', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<TaskForm onSubmit={handleSubmit} onCancel={() => {}} />);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Valid Title');

    // Priority should have a default value, so this test verifies the form accepts it
    await user.click(screen.getByText(/create task/i));

    // No priority error should appear as it defaults to 'B'
    expect(screen.queryByText(/priority is required/i)).not.toBeInTheDocument();
  });

  it('should validate that scheduled date is required', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<TaskForm onSubmit={handleSubmit} onCancel={() => {}} />);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Valid Title');

    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(screen.getByText(/scheduled date is required/i)).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Submission Tests
// =============================================================================

describe('TaskForm - Submission', () => {
  it('should call onSubmit with valid form data', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<TaskForm onSubmit={handleSubmit} onCancel={() => {}} />);

    // Fill in required fields
    await user.type(screen.getByLabelText(/title/i), 'New Task');
    await user.type(screen.getByLabelText(/description/i), 'Task description');

    // Set date using fireEvent.change with a future date
    const dateInput = screen.getByLabelText(/scheduled date/i);
    fireEvent.change(dateInput, { target: { value: getFutureDateString() } });

    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it('should trim title and description values on submit', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<TaskForm onSubmit={handleSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText(/title/i), '  Task with spaces  ');
    await user.type(screen.getByLabelText(/description/i), '  Description with spaces  ');

    // Set date using fireEvent.change with a future date
    const dateInput = screen.getByLabelText(/scheduled date/i);
    fireEvent.change(dateInput, { target: { value: getFutureDateString() } });

    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
      const callArgs = handleSubmit.mock.calls[0][0] as CreateTaskInput;
      expect(callArgs.title).toBe('Task with spaces');
      expect(callArgs.description).toBe('Description with spaces');
    });
  });

  it('should convert empty categoryId to null', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    const categories = [createMockCategory()];

    render(<TaskForm categories={categories} onSubmit={handleSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText(/title/i), 'Task');

    // Set date using fireEvent.change with a future date
    const dateInput = screen.getByLabelText(/scheduled date/i);
    fireEvent.change(dateInput, { target: { value: getFutureDateString() } });

    // Select "None (Uncategorized)" option
    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, '');

    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
      const callArgs = handleSubmit.mock.calls[0][0] as CreateTaskInput;
      expect(callArgs.categoryId).toBeNull();
    });
  });

  it('should convert empty scheduledTime to null', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<TaskForm onSubmit={handleSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText(/title/i), 'Task');

    // Set date using fireEvent.change with a future date
    const dateInput = screen.getByLabelText(/scheduled date/i);
    fireEvent.change(dateInput, { target: { value: getFutureDateString() } });

    // Leave time empty
    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
      const callArgs = handleSubmit.mock.calls[0][0] as CreateTaskInput;
      expect(callArgs.scheduledTime).toBeNull();
    });
  });

  it('should include priority in submission data', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<TaskForm onSubmit={handleSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText(/title/i), 'Task');

    // Set date using fireEvent.change with a future date
    const dateInput = screen.getByLabelText(/scheduled date/i);
    fireEvent.change(dateInput, { target: { value: getFutureDateString() } });

    const prioritySelect = screen.getByLabelText(/priority/i);
    await user.selectOptions(prioritySelect, 'A');

    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
      const callArgs = handleSubmit.mock.calls[0][0] as CreateTaskInput;
      expect(callArgs.priority.letter).toBe('A');
    });
  });

  it('should not call onSubmit when validation fails', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<TaskForm onSubmit={handleSubmit} onCancel={() => {}} />);

    // Don't fill required fields
    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Cancel Tests
// =============================================================================

describe('TaskForm - Cancel', () => {
  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();

    render(<TaskForm onSubmit={() => {}} onCancel={handleCancel} />);

    await user.click(screen.getByText(/cancel/i));

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('should not call onSubmit when cancel is clicked', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    const handleCancel = vi.fn();

    render(<TaskForm onSubmit={handleSubmit} onCancel={handleCancel} />);

    await user.click(screen.getByText(/cancel/i));

    expect(handleCancel).toHaveBeenCalledTimes(1);
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Loading State Tests
// =============================================================================

describe('TaskForm - Loading State', () => {
  it('should disable submit button when isSubmitting is true', () => {
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} isSubmitting={true} />);

    // Find the submit button by role - it contains "Creating..." text when submitting
    const submitButton = screen.getByRole('button', { name: /creating/i });
    expect(submitButton).toBeDisabled();
  });

  it('should disable cancel button when isSubmitting is true', () => {
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} isSubmitting={true} />);

    const cancelButton = screen.getByText(/cancel/i);
    expect(cancelButton).toBeDisabled();
  });

  it('should disable all form inputs when isSubmitting is true', () => {
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} isSubmitting={true} />);

    expect(screen.getByLabelText(/title/i)).toBeDisabled();
    expect(screen.getByLabelText(/description/i)).toBeDisabled();
    expect(screen.getByLabelText(/priority/i)).toBeDisabled();
    expect(screen.getByLabelText(/category/i)).toBeDisabled();
    expect(screen.getByLabelText(/scheduled date/i)).toBeDisabled();
    expect(screen.getByLabelText(/scheduled time/i)).toBeDisabled();
  });

  it('should show "Creating..." text when submitting in create mode', () => {
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} isSubmitting={true} />);

    expect(screen.getByText(/creating/i)).toBeInTheDocument();
  });

  it('should show "Updating..." text when submitting in edit mode', () => {
    const task = createMockTask();
    render(<TaskForm task={task} onSubmit={() => {}} onCancel={() => {}} isSubmitting={true} />);

    expect(screen.getByText(/updating/i)).toBeInTheDocument();
  });

  it('should enable all controls when isSubmitting is false', () => {
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} isSubmitting={false} />);

    expect(screen.getByLabelText(/title/i)).not.toBeDisabled();
    expect(screen.getByLabelText(/description/i)).not.toBeDisabled();
    expect(screen.getByText(/create task/i)).not.toBeDisabled();
    expect(screen.getByText(/cancel/i)).not.toBeDisabled();
  });
});

// =============================================================================
// Form Field Interaction Tests
// =============================================================================

describe('TaskForm - Field Interactions', () => {
  it('should update title field on user input', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'My new task');

    expect(titleInput).toHaveValue('My new task');
  });

  it('should update description field on user input', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'Task details');

    expect(descriptionInput).toHaveValue('Task details');
  });

  it('should update priority select on user selection', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

    const prioritySelect = screen.getByLabelText(/priority/i) as HTMLSelectElement;
    await user.selectOptions(prioritySelect, 'C');

    expect(prioritySelect.value).toBe('C');
  });

  it('should have default priority of B', () => {
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

    const prioritySelect = screen.getByLabelText(/priority/i) as HTMLSelectElement;
    expect(prioritySelect.value).toBe('B');
  });

  it('should allow selecting category', async () => {
    const user = userEvent.setup();
    const categories = [
      createMockCategory({ id: 'cat-1', name: 'Work' }),
      createMockCategory({ id: 'cat-2', name: 'Personal' }),
    ];

    render(<TaskForm categories={categories} onSubmit={() => {}} onCancel={() => {}} />);

    const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
    await user.selectOptions(categorySelect, 'cat-2');

    expect(categorySelect.value).toBe('cat-2');
  });
});
