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

import { describe, it, expect, vi } from 'vitest';
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

  it('should render category select with color indicators', () => {
    const categories = [
      createMockCategory({ id: 'cat-1', name: 'Work' }),
      createMockCategory({ id: 'cat-2', name: 'Personal' }),
    ];

    render(<TaskForm categories={categories} onSubmit={() => {}} onCancel={() => {}} />);

    // CategorySelect component should be present
    expect(screen.getByTestId('category-select')).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
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

    const _titleInput = screen.getByLabelText(/title/i);

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

    // Clear the default priority value
    const priorityInput = screen.getByLabelText(/priority/i);
    await user.clear(priorityInput);

    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(screen.getByText(/priority is required/i)).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
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

    // Open category dropdown and select "None (Uncategorized)"
    const categoryTrigger = screen.getByTestId('category-select-trigger');
    await user.click(categoryTrigger);
    const uncategorizedOption = screen.getByTestId('category-option-uncategorized');
    await user.click(uncategorizedOption);

    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
      const callArgs = handleSubmit.mock.calls[0][0] as CreateTaskInput;
      expect(callArgs.categoryId).toBeNull();
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

    const priorityInput = screen.getByLabelText(/priority/i);
    await user.clear(priorityInput);
    await user.type(priorityInput, 'A1');

    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
      const callArgs = handleSubmit.mock.calls[0][0] as CreateTaskInput;
      expect(callArgs.priority.letter).toBe('A');
      expect(callArgs.priority.number).toBe(1);
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

  it('should update priority input on user input', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

    const priorityInput = screen.getByLabelText(/priority/i) as HTMLInputElement;
    await user.clear(priorityInput);
    await user.type(priorityInput, 'C3');

    expect(priorityInput.value).toBe('C3');
  });

  it('should have default priority of B', () => {
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

    const priorityInput = screen.getByLabelText(/priority/i) as HTMLInputElement;
    expect(priorityInput.value).toBe('B');
  });

  it('should convert priority input to uppercase', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

    const priorityInput = screen.getByLabelText(/priority/i) as HTMLInputElement;
    await user.clear(priorityInput);
    await user.type(priorityInput, 'a1');

    expect(priorityInput.value).toBe('A1');
  });

  it('should accept priority without number', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<TaskForm onSubmit={handleSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText(/title/i), 'Task');

    const dateInput = screen.getByLabelText(/scheduled date/i);
    fireEvent.change(dateInput, { target: { value: getFutureDateString() } });

    const priorityInput = screen.getByLabelText(/priority/i);
    await user.clear(priorityInput);
    await user.type(priorityInput, 'C');

    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
      const callArgs = handleSubmit.mock.calls[0][0] as CreateTaskInput;
      expect(callArgs.priority.letter).toBe('C');
      expect(callArgs.priority.number).toBeUndefined();
    });
  });

  it('should show error for invalid priority pattern', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<TaskForm onSubmit={handleSubmit} onCancel={() => {}} />);

    const priorityInput = screen.getByLabelText(/priority/i);
    await user.clear(priorityInput);
    await user.type(priorityInput, 'E1'); // Invalid letter

    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(screen.getByText(/priority must be a letter \(A-D\)/i)).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should show error for priority number too large', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<TaskForm onSubmit={handleSubmit} onCancel={() => {}} />);

    // Fill title to avoid title error
    await user.type(screen.getByLabelText(/title/i), 'Valid Title');

    const priorityInput = screen.getByLabelText(/priority/i) as HTMLInputElement;

    // Use fireEvent.change to set a value that bypasses maxLength
    fireEvent.change(priorityInput, { target: { value: 'A100' } });

    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(screen.getByText(/priority number must be between 1 and 99/i)).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should show error for priority number zero', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<TaskForm onSubmit={handleSubmit} onCancel={() => {}} />);

    // Fill title to avoid title error
    await user.type(screen.getByLabelText(/title/i), 'Valid Title');

    const priorityInput = screen.getByLabelText(/priority/i) as HTMLInputElement;

    // Use fireEvent.change to set value to A0
    fireEvent.change(priorityInput, { target: { value: 'A0' } });

    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(screen.getByText(/priority number must be between 1 and 99/i)).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should allow selecting category through custom dropdown', async () => {
    const user = userEvent.setup();
    const categories = [
      createMockCategory({ id: 'cat-1', name: 'Work', color: '#EF4444' }),
      createMockCategory({ id: 'cat-2', name: 'Personal', color: '#3B82F6' }),
    ];

    render(<TaskForm categories={categories} onSubmit={() => {}} onCancel={() => {}} />);

    // Open the category dropdown
    const categoryTrigger = screen.getByTestId('category-select-trigger');
    await user.click(categoryTrigger);

    // Select "Personal" category
    const personalOption = screen.getByTestId('category-option-cat-2');
    await user.click(personalOption);

    // Verify "Personal" is now displayed
    await waitFor(() => {
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });
  });

  it('should display category color dots in dropdown', async () => {
    const user = userEvent.setup();
    const categories = [
      createMockCategory({ id: 'cat-1', name: 'Work', color: '#EF4444' }),
      createMockCategory({ id: 'cat-2', name: 'Personal', color: '#3B82F6' }),
    ];

    render(<TaskForm categories={categories} onSubmit={() => {}} onCancel={() => {}} />);

    // Open the category dropdown
    const categoryTrigger = screen.getByTestId('category-select-trigger');
    await user.click(categoryTrigger);

    // Verify categories are listed
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();

    // Verify color dots are present (by checking for styled elements)
    const workOption = screen.getByTestId('category-option-cat-1');
    const colorDot = workOption.querySelector('[style*="background-color"]');
    expect(colorDot).toBeInTheDocument();
  });

  it('should show selected category with color dot in trigger', async () => {
    const categories = [
      createMockCategory({ id: 'cat-1', name: 'Work', color: '#EF4444' }),
    ];
    const task = createMockTask({ categoryId: 'cat-1' });

    render(<TaskForm task={task} categories={categories} onSubmit={() => {}} onCancel={() => {}} />);

    // Verify selected category is displayed
    expect(screen.getByText('Work')).toBeInTheDocument();

    // Verify color dot is shown in trigger
    const trigger = screen.getByTestId('category-select-trigger');
    const colorDot = trigger.querySelector('[style*="background-color"]');
    expect(colorDot).toBeInTheDocument();
    expect(colorDot).toHaveStyle({ backgroundColor: '#EF4444' });
  });

  it('should submit form with selected category', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    const categories = [
      createMockCategory({ id: 'cat-1', name: 'Work' }),
      createMockCategory({ id: 'cat-2', name: 'Personal' }),
    ];

    render(<TaskForm categories={categories} onSubmit={handleSubmit} onCancel={() => {}} />);

    // Fill required fields
    await user.type(screen.getByLabelText(/title/i), 'New Task');
    const dateInput = screen.getByLabelText(/scheduled date/i);
    fireEvent.change(dateInput, { target: { value: getFutureDateString() } });

    // Select a category
    const categoryTrigger = screen.getByTestId('category-select-trigger');
    await user.click(categoryTrigger);
    const workOption = screen.getByTestId('category-option-cat-1');
    await user.click(workOption);

    // Submit form
    await user.click(screen.getByText(/create task/i));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
      const callArgs = handleSubmit.mock.calls[0][0] as CreateTaskInput;
      expect(callArgs.categoryId).toBe('cat-1');
    });
  });

  // ---------------------------------------------------------------------------
  // Recurrence Integration Tests
  // ---------------------------------------------------------------------------

  describe('Recurrence Integration', () => {
    it('should render Repeat toggle', () => {
      render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

      expect(screen.getByTestId('repeat-toggle')).toBeInTheDocument();
      expect(screen.getByText('Repeat')).toBeInTheDocument();
    });

    it('should not show RecurrenceForm by default', () => {
      render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

      expect(screen.queryByTestId('task-recurrence-form')).not.toBeInTheDocument();
    });

    it('should show RecurrenceForm when Repeat toggle is enabled', async () => {
      const user = userEvent.setup();
      render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

      await user.click(screen.getByTestId('repeat-toggle'));

      await waitFor(() => {
        expect(screen.getByTestId('task-recurrence-form')).toBeInTheDocument();
      });
    });

    it('should hide RecurrenceForm when Repeat toggle is disabled', async () => {
      const user = userEvent.setup();
      render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);

      // Enable recurrence
      await user.click(screen.getByTestId('repeat-toggle'));
      expect(screen.getByTestId('task-recurrence-form')).toBeInTheDocument();

      // Disable recurrence
      await user.click(screen.getByTestId('repeat-toggle'));

      await waitFor(() => {
        expect(screen.queryByTestId('task-recurrence-form')).not.toBeInTheDocument();
      });
    });

    it('should submit with null recurrence when toggle is off', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();

      render(<TaskForm onSubmit={handleSubmit} onCancel={() => {}} />);

      // Fill required fields
      await user.type(screen.getByLabelText(/title/i), 'Non-recurring task');
      const dateInput = screen.getByLabelText(/scheduled date/i);
      fireEvent.change(dateInput, { target: { value: getFutureDateString() } });

      // Submit without enabling recurrence
      await user.click(screen.getByText(/create task/i));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
        const callArgs = handleSubmit.mock.calls[0][0] as CreateTaskInput;
        expect(callArgs.recurrence).toBeNull();
      });
    });

    it('should submit with recurrence pattern when toggle is on', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();

      render(<TaskForm onSubmit={handleSubmit} onCancel={() => {}} />);

      // Fill required fields
      await user.type(screen.getByLabelText(/title/i), 'Recurring task');
      const dateInput = screen.getByLabelText(/scheduled date/i);
      fireEvent.change(dateInput, { target: { value: getFutureDateString() } });

      // Enable recurrence
      await user.click(screen.getByTestId('repeat-toggle'));

      // Submit
      await user.click(screen.getByText(/create task/i));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
        const callArgs = handleSubmit.mock.calls[0][0] as CreateTaskInput;
        expect(callArgs.recurrence).not.toBeNull();
        expect(callArgs.recurrence?.type).toBe('daily');
        expect(callArgs.recurrence?.interval).toBe(1);
      });
    });

    it('should initialize toggle from existing task recurrence', () => {
      const task = createMockTask({
        recurrence: {
          type: 'weekly',
          interval: 1,
          daysOfWeek: [1, 3, 5],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
      });

      render(<TaskForm task={task} onSubmit={() => {}} onCancel={() => {}} />);

      // Toggle should be on
      const toggle = screen.getByTestId('repeat-toggle');
      expect(toggle).toHaveAttribute('aria-checked', 'true');

      // RecurrenceForm should be visible
      expect(screen.getByTestId('task-recurrence-form')).toBeInTheDocument();
    });

    it('should allow changing recurrence type', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();

      render(<TaskForm onSubmit={handleSubmit} onCancel={() => {}} />);

      // Fill required fields
      await user.type(screen.getByLabelText(/title/i), 'Weekly task');
      const dateInput = screen.getByLabelText(/scheduled date/i);
      fireEvent.change(dateInput, { target: { value: getFutureDateString() } });

      // Enable recurrence
      await user.click(screen.getByTestId('repeat-toggle'));

      // Change to weekly
      await user.selectOptions(screen.getByTestId('task-recurrence-form-type'), 'weekly');

      // Submit
      await user.click(screen.getByText(/create task/i));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
        const callArgs = handleSubmit.mock.calls[0][0] as CreateTaskInput;
        expect(callArgs.recurrence?.type).toBe('weekly');
      });
    });
  });
});
