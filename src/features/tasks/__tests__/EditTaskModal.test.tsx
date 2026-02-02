/**
 * EditTaskModal Component Tests
 *
 * Comprehensive tests for the EditTaskModal component including:
 * - Rendering tests (open/closed states, title, TaskForm rendering)
 * - Form population tests (initial values from task)
 * - Update functionality tests (dispatch action, callbacks)
 * - Delete functionality tests (ConfirmDialog, dispatch action)
 * - Loading state tests
 * - Cancel behavior tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditTaskModal } from '../EditTaskModal';
import { renderWithProviders } from '../../../test/test-utils';
import {
  createMockTask,
  createMockCategory,
  createMockTasksState,
  createMockCategoriesState,
  resetMockCounters,
} from '../../../test/mockData';
import type { Task, Category, CreateTaskInput } from '../../../types';

// =============================================================================
// Mock Setup
// =============================================================================

// Store the mock task data passed to TaskForm
let capturedTaskFormProps: {
  task: Task | null | undefined;
  categories: Category[];
  isSubmitting: boolean;
  onSubmit: (data: CreateTaskInput) => void;
  onCancel: () => void;
} | null = null;

// Mock the Modal component
vi.mock('../../../components/common/Modal', () => ({
  Modal: ({
    isOpen,
    onClose,
    children,
    title,
    closeOnBackdropClick,
  }: any) => {
    return isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button
          onClick={() => closeOnBackdropClick !== false && onClose()}
          aria-label="Close modal"
          data-testid="modal-close-button"
        >
          Close
        </button>
        <div
          data-testid="modal-backdrop"
          onClick={() => closeOnBackdropClick !== false && onClose()}
        />
        {children}
      </div>
    ) : null;
  },
}));

// Mock the ConfirmDialog component
vi.mock('../../../components/common/ConfirmDialog', () => ({
  ConfirmDialog: ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    isProcessing,
    testId,
  }: any) => {
    return isOpen ? (
      <div data-testid={testId || 'confirm-dialog'} role="dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <button
          onClick={onClose}
          disabled={isProcessing}
          data-testid="confirm-dialog-cancel"
        >
          {cancelText || 'Cancel'}
        </button>
        <button
          onClick={onConfirm}
          disabled={isProcessing}
          data-testid="confirm-dialog-confirm"
        >
          {isProcessing ? 'Processing...' : confirmText || 'Confirm'}
        </button>
      </div>
    ) : null;
  },
}));

// Mock the TaskForm component
vi.mock('../../../components/tasks/TaskForm', () => ({
  TaskForm: ({ onSubmit, onCancel, isSubmitting, categories, task }: any) => {
    // Capture props for assertions
    capturedTaskFormProps = { task, categories, isSubmitting, onSubmit, onCancel };

    const handleSubmit = () => {
      const mockData: CreateTaskInput = {
        title: 'Updated Task',
        description: 'Updated Description',
        priority: { letter: 'A' as const },
        categoryId: 'cat-1',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
        status: 'complete',
      };
      onSubmit(mockData);
    };

    return (
      <div data-testid="task-form">
        {task && (
          <>
            <p data-testid="form-task-title">Title: {task.title}</p>
            <p data-testid="form-task-description">
              Description: {task.description}
            </p>
            <p data-testid="form-task-priority">
              Priority: {task.priority.letter}
            </p>
            <p data-testid="form-task-category">
              Category: {task.categoryId || 'None'}
            </p>
            <p data-testid="form-task-status">Status: {task.status}</p>
          </>
        )}
        <p data-testid="form-categories-count">Categories: {categories.length}</p>
        <button onClick={handleSubmit} disabled={isSubmitting} data-testid="submit-button">
          {isSubmitting ? 'Updating...' : 'Update Task'}
        </button>
        <button onClick={onCancel} disabled={isSubmitting} data-testid="cancel-button">
          Cancel
        </button>
        {isSubmitting && <span data-testid="form-submitting">Submitting...</span>}
      </div>
    );
  },
}));

// Mock the auth hook with configurable user
let mockAuthUser: any = {
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'standard' as const,
  googleCalendarConnected: false,
  createdAt: new Date(),
  lastLoginAt: new Date(),
};

vi.mock('../../../features/auth', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    loading: false,
    error: null,
  }),
}));

// Mock Firebase tasks service - this is what the thunks actually call
vi.mock('../../../services/firebase/tasks.service', () => ({
  createTask: vi.fn(),
  getTasksByDate: vi.fn(),
  updateTask: vi.fn(),
  softDeleteTask: vi.fn(),
}));

import * as tasksService from '../../../services/firebase/tasks.service';
const mockUpdateTaskService = vi.mocked(tasksService.updateTask);
const mockSoftDeleteTaskService = vi.mocked(tasksService.softDeleteTask);

// =============================================================================
// Test Helpers
// =============================================================================

function createDefaultTestTask(): Task {
  return createMockTask({
    id: 'task-test-1',
    title: 'Test Task Title',
    description: 'Test Task Description',
    priorityLetter: 'B',
    priorityNumber: 1,
    categoryId: 'cat-1',
    status: 'in_progress',
    scheduledDate: new Date('2024-01-15'),
    scheduledTime: '14:00',
  });
}

function createDefaultCategories(): Category[] {
  return [
    createMockCategory({ id: 'cat-1', name: 'Work', color: '#3B82F6' }),
    createMockCategory({ id: 'cat-2', name: 'Personal', color: '#22C55E' }),
  ];
}

function getDefaultPreloadedState(categories: Category[] = createDefaultCategories()) {
  return {
    tasks: createMockTasksState(),
    categories: createMockCategoriesState({ categories }),
  };
}

// =============================================================================
// Rendering Tests
// =============================================================================

describe('EditTaskModal - Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockCounters();
    capturedTaskFormProps = null;
    mockAuthUser = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'standard' as const,
      googleCalendarConnected: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
  });

  it('should not render when isOpen is false', () => {
    const task = createDefaultTestTask();

    renderWithProviders(
      <EditTaskModal isOpen={false} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    const task = createDefaultTestTask();

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('should display "Edit Task" title', () => {
    const task = createDefaultTestTask();

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    expect(screen.getByText('Edit Task')).toBeInTheDocument();
  });

  it('should render TaskForm with task data as initialValues', () => {
    const task = createDefaultTestTask();

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    expect(screen.getByTestId('task-form')).toBeInTheDocument();
    expect(capturedTaskFormProps?.task).toEqual(task);
  });

  it('should pass isEditing={true} to TaskForm (task prop is passed)', () => {
    const task = createDefaultTestTask();

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    // The TaskForm receives task prop which indicates edit mode
    expect(capturedTaskFormProps?.task).toBeTruthy();
    expect(capturedTaskFormProps?.task?.id).toBe('task-test-1');
  });

  it('should not show error message initially', () => {
    const task = createDefaultTestTask();

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should render with custom testId', () => {
    const task = createDefaultTestTask();

    renderWithProviders(
      <EditTaskModal
        isOpen={true}
        onClose={() => {}}
        task={task}
        testId="custom-edit-modal"
      />,
      { preloadedState: getDefaultPreloadedState() }
    );

    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });
});

// =============================================================================
// Form Population Tests
// =============================================================================

describe('EditTaskModal - Form Population', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockCounters();
    capturedTaskFormProps = null;
    mockAuthUser = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'standard' as const,
      googleCalendarConnected: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
  });

  it('should populate form with task title', () => {
    const task = createMockTask({
      title: 'My Important Task',
    });

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    expect(screen.getByTestId('form-task-title')).toHaveTextContent(
      'Title: My Important Task'
    );
  });

  it('should populate form with task description', () => {
    const task = createMockTask({
      description: 'This is a detailed description',
    });

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    expect(screen.getByTestId('form-task-description')).toHaveTextContent(
      'Description: This is a detailed description'
    );
  });

  it('should populate form with task priority', () => {
    const task = createMockTask({
      priorityLetter: 'A',
      priorityNumber: 1,
    });

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    expect(screen.getByTestId('form-task-priority')).toHaveTextContent(
      'Priority: A'
    );
  });

  it('should populate form with task category (if set)', () => {
    const task = createMockTask({
      categoryId: 'cat-1',
    });

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    expect(screen.getByTestId('form-task-category')).toHaveTextContent(
      'Category: cat-1'
    );
  });

  it('should populate form with task status', () => {
    const task = createMockTask({
      status: 'complete',
    });

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    expect(screen.getByTestId('form-task-status')).toHaveTextContent(
      'Status: complete'
    );
  });

  it('should handle task with no category', () => {
    const task = createMockTask({
      categoryId: null,
    });

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    expect(screen.getByTestId('form-task-category')).toHaveTextContent(
      'Category: None'
    );
  });

  it('should pass categories from Redux store to TaskForm', () => {
    const task = createDefaultTestTask();
    const categories = [
      createMockCategory({ id: 'cat-1', name: 'Work' }),
      createMockCategory({ id: 'cat-2', name: 'Personal' }),
      createMockCategory({ id: 'cat-3', name: 'Health' }),
    ];

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState(categories) }
    );

    expect(screen.getByTestId('form-categories-count')).toHaveTextContent(
      'Categories: 3'
    );
    expect(capturedTaskFormProps?.categories).toHaveLength(3);
  });
});

// =============================================================================
// Update Functionality Tests
// =============================================================================

describe('EditTaskModal - Update Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockCounters();
    capturedTaskFormProps = null;
    mockAuthUser = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'standard' as const,
      googleCalendarConnected: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    // Default to successful update
    const updatedTask = createMockTask({
      title: 'Updated Task',
      description: 'Updated Description',
    });
    mockUpdateTaskService.mockResolvedValue(updatedTask);
  });

  it('should dispatch updateTaskAsync when form is submitted', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();
    const updatedTask = createMockTask({
      id: task.id,
      title: 'Updated Task',
    });
    mockUpdateTaskService.mockResolvedValue(updatedTask);

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(mockUpdateTaskService).toHaveBeenCalled();
    });
  });

  it('should call onSuccess after successful update', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();
    const handleSuccess = vi.fn();
    const updatedTask = createMockTask({ id: task.id, title: 'Updated Task' });
    mockUpdateTaskService.mockResolvedValue(updatedTask);

    renderWithProviders(
      <EditTaskModal
        isOpen={true}
        onClose={() => {}}
        task={task}
        onSuccess={handleSuccess}
      />,
      { preloadedState: getDefaultPreloadedState() }
    );

    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onClose after successful update', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();
    const handleClose = vi.fn();
    const updatedTask = createMockTask({ id: task.id, title: 'Updated Task' });
    mockUpdateTaskService.mockResolvedValue(updatedTask);

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={handleClose} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should show error message when update fails', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();
    mockUpdateTaskService.mockRejectedValue(new Error('Failed to update task'));

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to update task')).toBeInTheDocument();
    });
  });

  it('should not close modal when update fails', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();
    const handleClose = vi.fn();
    mockUpdateTaskService.mockRejectedValue(new Error('Network error'));

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={handleClose} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('should show error when user is not authenticated', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();

    // Set mock user to null for this test
    mockAuthUser = null;

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/must be signed in/i)).toBeInTheDocument();
    });
  });
});

// =============================================================================
// Delete Functionality Tests
// =============================================================================

describe('EditTaskModal - Delete Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockCounters();
    capturedTaskFormProps = null;
    mockAuthUser = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'standard' as const,
      googleCalendarConnected: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    // Default to successful delete
    mockSoftDeleteTaskService.mockResolvedValue(undefined);
  });

  it('should show delete button', () => {
    const task = createDefaultTestTask();

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    expect(screen.getByTestId('delete-task-button')).toBeInTheDocument();
    expect(screen.getByText('Delete Task')).toBeInTheDocument();
  });

  it('should open ConfirmDialog when delete button is clicked', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    // ConfirmDialog should not be visible initially
    expect(
      screen.queryByTestId('delete-task-confirm-dialog')
    ).not.toBeInTheDocument();

    await user.click(screen.getByTestId('delete-task-button'));

    // ConfirmDialog should now be visible
    const confirmDialog = screen.getByTestId('delete-task-confirm-dialog');
    expect(confirmDialog).toBeInTheDocument();
    // Check that the dialog contains the title (use within to scope the query)
    expect(confirmDialog).toHaveTextContent('Delete Task');
    expect(
      screen.getByText(/Are you sure you want to delete/i)
    ).toBeInTheDocument();
  });

  it('should dispatch deleteTask when delete is confirmed', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();
    mockSoftDeleteTaskService.mockResolvedValue(undefined);

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    // Open confirm dialog
    await user.click(screen.getByTestId('delete-task-button'));

    // Click confirm
    await user.click(screen.getByTestId('confirm-dialog-confirm'));

    await waitFor(() => {
      expect(mockSoftDeleteTaskService).toHaveBeenCalledWith(
        task.id,
        'user-123'
      );
    });
  });

  it('should close ConfirmDialog when delete is cancelled', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    // Open confirm dialog
    await user.click(screen.getByTestId('delete-task-button'));

    expect(
      screen.getByTestId('delete-task-confirm-dialog')
    ).toBeInTheDocument();

    // Click cancel
    await user.click(screen.getByTestId('confirm-dialog-cancel'));

    // ConfirmDialog should be closed
    expect(
      screen.queryByTestId('delete-task-confirm-dialog')
    ).not.toBeInTheDocument();
  });

  it('should call onClose after successful delete', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();
    const handleClose = vi.fn();
    mockSoftDeleteTaskService.mockResolvedValue(undefined);

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={handleClose} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    // Open confirm dialog
    await user.click(screen.getByTestId('delete-task-button'));

    // Click confirm
    await user.click(screen.getByTestId('confirm-dialog-confirm'));

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onSuccess after successful delete', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();
    const handleSuccess = vi.fn();
    mockSoftDeleteTaskService.mockResolvedValue(undefined);

    renderWithProviders(
      <EditTaskModal
        isOpen={true}
        onClose={() => {}}
        task={task}
        onSuccess={handleSuccess}
      />,
      { preloadedState: getDefaultPreloadedState() }
    );

    // Open confirm dialog
    await user.click(screen.getByTestId('delete-task-button'));

    // Click confirm
    await user.click(screen.getByTestId('confirm-dialog-confirm'));

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('should show error when delete fails', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();
    mockSoftDeleteTaskService.mockRejectedValue(
      new Error('Failed to delete task')
    );

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    // Open confirm dialog
    await user.click(screen.getByTestId('delete-task-button'));

    // Click confirm
    await user.click(screen.getByTestId('confirm-dialog-confirm'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to delete task')).toBeInTheDocument();
    });
  });

  it('should show error when deleting without authentication', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();

    // Set mock user to null
    mockAuthUser = null;

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    // Open confirm dialog
    await user.click(screen.getByTestId('delete-task-button'));

    // Click confirm
    await user.click(screen.getByTestId('confirm-dialog-confirm'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/must be signed in/i)).toBeInTheDocument();
    });
  });
});

// =============================================================================
// Loading States Tests
// =============================================================================

describe('EditTaskModal - Loading States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockCounters();
    capturedTaskFormProps = null;
    mockAuthUser = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'standard' as const,
      googleCalendarConnected: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
  });

  it('should disable form during update', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();
    const updatedTask = createMockTask({ id: task.id });

    // Mock a slow service call
    mockUpdateTaskService.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(updatedTask), 100))
    );

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    await user.click(screen.getByTestId('submit-button'));

    // Should show submitting state
    expect(screen.getByTestId('form-submitting')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeDisabled();

    // Wait for completion
    await waitFor(
      () => {
        expect(
          screen.queryByTestId('form-submitting')
        ).not.toBeInTheDocument();
      },
      { timeout: 200 }
    );
  });

  it('should show loading state during delete', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();

    // Mock a slow delete service call
    mockSoftDeleteTaskService.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
    );

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    // Open confirm dialog
    await user.click(screen.getByTestId('delete-task-button'));

    // Click confirm
    await user.click(screen.getByTestId('confirm-dialog-confirm'));

    // Should show processing state in confirm dialog
    expect(screen.getByText('Processing...')).toBeInTheDocument();

    // Wait for completion
    await waitFor(
      () => {
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      },
      { timeout: 200 }
    );
  });

  it('should prevent modal close during processing (update)', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();
    const handleClose = vi.fn();
    const updatedTask = createMockTask({ id: task.id });

    // Mock a slow service call
    mockUpdateTaskService.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(updatedTask), 100))
    );

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={handleClose} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    await user.click(screen.getByTestId('submit-button'));

    // Try to close during submission
    await user.click(screen.getByTestId('modal-close-button'));

    // Should not close (because closeOnBackdropClick is false during processing)
    // The mock Modal checks closeOnBackdropClick, but handleClose prevention is in the component
    // We verify submit is still in progress
    expect(screen.getByTestId('form-submitting')).toBeInTheDocument();
  });

  it('should disable delete button during update', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();
    const updatedTask = createMockTask({ id: task.id });

    // Mock a slow service call
    mockUpdateTaskService.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(updatedTask), 100))
    );

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    await user.click(screen.getByTestId('submit-button'));

    // Delete button should be disabled during update
    expect(screen.getByTestId('delete-task-button')).toBeDisabled();

    // Wait for completion
    await waitFor(
      () => {
        expect(screen.getByTestId('delete-task-button')).not.toBeDisabled();
      },
      { timeout: 200 }
    );
  });
});

// =============================================================================
// Cancel Behavior Tests
// =============================================================================

describe('EditTaskModal - Cancel Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockCounters();
    capturedTaskFormProps = null;
    mockAuthUser = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'standard' as const,
      googleCalendarConnected: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    const updatedTask = createMockTask();
    mockUpdateTaskService.mockResolvedValue(updatedTask);
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();
    const handleClose = vi.fn();

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={handleClose} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    await user.click(screen.getByTestId('cancel-button'));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when modal backdrop is clicked', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();
    const handleClose = vi.fn();

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={handleClose} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    await user.click(screen.getByTestId('modal-backdrop'));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when modal close button is clicked', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();
    const handleClose = vi.fn();

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={handleClose} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    await user.click(screen.getByTestId('modal-close-button'));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should not allow close via cancel button during submission', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();
    const handleClose = vi.fn();
    const updatedTask = createMockTask({ id: task.id });

    // Mock a slow service call
    mockUpdateTaskService.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(updatedTask), 100))
    );

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={handleClose} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    await user.click(screen.getByTestId('submit-button'));

    // Cancel button should be disabled during submission
    expect(screen.getByTestId('cancel-button')).toBeDisabled();
  });

  it('should clear error state on subsequent render', async () => {
    const user = userEvent.setup();
    const task = createDefaultTestTask();

    // Mock service to reject
    mockUpdateTaskService.mockRejectedValue(new Error('Test error'));

    const { unmount } = renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    // Trigger an error
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Unmount and remount to simulate a fresh open
    unmount();

    // Reset mock for successful update
    const updatedTask = createMockTask({ id: task.id });
    mockUpdateTaskService.mockResolvedValue(updatedTask);

    renderWithProviders(
      <EditTaskModal isOpen={true} onClose={() => {}} task={task} />,
      { preloadedState: getDefaultPreloadedState() }
    );

    // Error should be cleared after remount
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
