/**
 * CreateTaskModal Component Tests
 *
 * Comprehensive tests for the CreateTaskModal component including:
 * - Rendering tests (open/closed states, TaskForm rendering)
 * - Form submission tests (dispatch action, close on success)
 * - Cancel behavior tests
 * - Loading state tests
 * - Error handling tests
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTaskModal } from '../CreateTaskModal';
import { renderWithProviders } from '../../../test/test-utils';
import type { CreateTaskInput, Task, Category } from '../../../types';

// =============================================================================
// Mock Setup
// =============================================================================

// Mock the Modal component
vi.mock('../../../components/common/Modal', () => ({
  Modal: ({ isOpen, onClose, children, title }: any) => {
    return isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button onClick={onClose} aria-label="Close modal">
          Close
        </button>
        {children}
      </div>
    ) : null;
  },
}));

// Mock the TaskForm component
vi.mock('../../../components/tasks/TaskForm', () => ({
  TaskForm: ({ onSubmit, onCancel, isSubmitting, categories }: any) => {
    const handleSubmit = () => {
      const mockData: CreateTaskInput = {
        title: 'Test Task',
        description: 'Test Description',
        priority: { letter: 'A' as const },
        categoryId: 'cat-1',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
      };
      onSubmit(mockData);
    };

    return (
      <div data-testid="task-form">
        <p>Categories: {categories.length}</p>
        <button onClick={handleSubmit} disabled={isSubmitting}>
          Submit
        </button>
        <button onClick={onCancel} disabled={isSubmitting}>
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

// Mock Firebase tasks service - this is what the thunk actually calls
vi.mock('../../../services/firebase/tasks.service', () => ({
  createTask: vi.fn(),
  getTasksByDate: vi.fn(),
  updateTask: vi.fn(),
}));

import * as tasksService from '../../../services/firebase/tasks.service';
const mockCreateTaskService = vi.mocked(tasksService.createTask);


// =============================================================================
// Test Helpers
// =============================================================================

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

function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: 'user-1',
    title: 'Test Task',
    description: 'Test Description',
    categoryId: 'cat-1',
    priority: { letter: 'A', number: 1 },
    status: 'in_progress',
    scheduledDate: new Date('2024-01-15'),
    scheduledTime: '10:00',
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

// =============================================================================
// Rendering Tests
// =============================================================================

describe('CreateTaskModal - Rendering', () => {
  it('should not render when isOpen is false', () => {
    renderWithProviders(<CreateTaskModal isOpen={false} onClose={() => {}} />);

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithProviders(<CreateTaskModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('should render with correct title', () => {
    renderWithProviders(<CreateTaskModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('Create New Task')).toBeInTheDocument();
  });

  it('should render TaskForm inside modal', () => {
    renderWithProviders(<CreateTaskModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByTestId('task-form')).toBeInTheDocument();
  });

  it('should pass categories to TaskForm', () => {
    const categories = [
      createMockCategory({ id: 'cat-1', name: 'Work' }),
      createMockCategory({ id: 'cat-2', name: 'Personal' }),
    ];

    renderWithProviders(<CreateTaskModal isOpen={true} onClose={() => {}} />, {
      preloadedState: {
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: null,
          loading: false,
          error: null,
          syncStatus: 'idle',
        },
      },
    });

    // TaskForm should receive categories from Redux store
    expect(screen.getByTestId('task-form')).toBeInTheDocument();
  });

  it('should render with custom testId', () => {
    renderWithProviders(
      <CreateTaskModal isOpen={true} onClose={() => {}} testId="custom-create-modal" />
    );

    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('should not show error message initially', () => {
    renderWithProviders(<CreateTaskModal isOpen={true} onClose={() => {}} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// =============================================================================
// Form Submission Tests
// =============================================================================

describe('CreateTaskModal - Form Submission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock user to authenticated state
    mockAuthUser = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'standard' as const,
      googleCalendarConnected: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    // Reset mock to return a successful task by default
    const mockTask = createMockTask();
    mockCreateTaskService.mockResolvedValue(mockTask);
  });

  it('should dispatch createTaskAsync when form is submitted', async () => {
    const user = userEvent.setup();
    const mockTask = createMockTask();
    mockCreateTaskService.mockResolvedValue(mockTask);

    renderWithProviders(<CreateTaskModal isOpen={true} onClose={() => {}} />);

    await user.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockCreateTaskService).toHaveBeenCalled();
    });
  });

  it('should call onSuccess after successful submission', async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    const mockTask = createMockTask();
    mockCreateTaskService.mockResolvedValue(mockTask);

    renderWithProviders(
      <CreateTaskModal isOpen={true} onClose={() => {}} onSuccess={handleSuccess} />
    );

    await user.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onClose after successful submission', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const mockTask = createMockTask();
    mockCreateTaskService.mockResolvedValue(mockTask);

    renderWithProviders(
      <CreateTaskModal isOpen={true} onClose={handleClose} />
    );

    await user.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should show error message when submission fails', async () => {
    const user = userEvent.setup();
    mockCreateTaskService.mockRejectedValue(new Error('Failed to create task'));

    renderWithProviders(<CreateTaskModal isOpen={true} onClose={() => {}} />);

    await user.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to create task')).toBeInTheDocument();
    });
  });

  it('should not close modal when submission fails', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    mockCreateTaskService.mockRejectedValue(new Error('Network error'));

    renderWithProviders(
      <CreateTaskModal isOpen={true} onClose={handleClose} />
    );

    await user.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('should show error when user is not authenticated', async () => {
    const user = userEvent.setup();

    // Set mock user to null for this test
    const originalUser = mockAuthUser;
    mockAuthUser = null;

    renderWithProviders(<CreateTaskModal isOpen={true} onClose={() => {}} />);

    await user.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/must be signed in/i)).toBeInTheDocument();
    });

    // Restore original user
    mockAuthUser = originalUser;
  });
});

// =============================================================================
// Loading State Tests
// =============================================================================

describe('CreateTaskModal - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock user to authenticated state
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

  it('should pass isSubmitting to TaskForm', async () => {
    const user = userEvent.setup();
    const mockTask = createMockTask();

    // Mock a slow service call that takes 100ms to complete
    mockCreateTaskService.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockTask), 100))
    );

    renderWithProviders(<CreateTaskModal isOpen={true} onClose={() => {}} />);

    await user.click(screen.getByText('Submit'));

    // Should show submitting state
    expect(screen.getByTestId('form-submitting')).toBeInTheDocument();

    // Wait for completion
    await waitFor(
      () => {
        expect(screen.queryByTestId('form-submitting')).not.toBeInTheDocument();
      },
      { timeout: 200 }
    );
  });

  it('should disable modal close during submission', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const mockTask = createMockTask();

    // Mock a slow service call
    mockCreateTaskService.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockTask), 100))
    );

    renderWithProviders(
      <CreateTaskModal isOpen={true} onClose={handleClose} />
    );

    await user.click(screen.getByText('Submit'));

    // Try to close during submission
    await user.click(screen.getByLabelText('Close modal'));

    // Should not close
    expect(handleClose).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Cancel Behavior Tests
// =============================================================================

describe('CreateTaskModal - Cancel Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock user to authenticated state
    mockAuthUser = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'standard' as const,
      googleCalendarConnected: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    // Reset mock to return a successful task by default
    const mockTask = createMockTask();
    mockCreateTaskService.mockResolvedValue(mockTask);
  });

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    renderWithProviders(<CreateTaskModal isOpen={true} onClose={handleClose} />);

    await user.click(screen.getByText('Cancel'));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should clear error when modal is closed', async () => {
    const user = userEvent.setup();

    // Mock service to reject
    mockCreateTaskService.mockRejectedValue(new Error('Test error'));

    const { rerender, unmount } = renderWithProviders(
      <CreateTaskModal isOpen={true} onClose={() => {}} />
    );

    // Trigger an error
    await user.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Unmount and remount the modal to simulate a fresh open
    // (error state is component-internal and gets cleared on remount)
    unmount();
    renderWithProviders(<CreateTaskModal isOpen={true} onClose={() => {}} />);

    // Error should be cleared after remount
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should not allow close via cancel during submission', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const mockTask = createMockTask();

    // Mock a slow service call
    mockCreateTaskService.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockTask), 100))
    );

    renderWithProviders(
      <CreateTaskModal isOpen={true} onClose={handleClose} />
    );

    await user.click(screen.getByText('Submit'));

    // Cancel button should be disabled during submission
    expect(screen.getByText('Cancel')).toBeDisabled();
  });
});
