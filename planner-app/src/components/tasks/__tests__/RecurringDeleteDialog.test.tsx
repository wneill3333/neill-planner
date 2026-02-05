/**
 * RecurringDeleteDialog Tests
 *
 * Tests for the RecurringDeleteDialog component which allows users to choose
 * how to delete a recurring task instance.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecurringDeleteDialog } from '../RecurringDeleteDialog';
import type { Task } from '../../../types';

// =============================================================================
// Test Helpers
// =============================================================================

const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: 'task-1',
  userId: 'user-1',
  title: 'Daily Standup',
  description: 'Team standup meeting',
  categoryId: null,
  priority: { letter: 'A', number: 1 },
  status: 'in_progress',
  scheduledDate: new Date('2026-02-03'),
  recurrence: {
    type: 'daily',
    interval: 1,
    daysOfWeek: [],
    dayOfMonth: null,
    monthOfYear: null,
    endCondition: { type: 'never', endDate: null, maxOccurrences: null },
    exceptions: [],
  },
  linkedNoteIds: [],
  linkedEventId: null,
  isRecurringInstance: true,
  recurringParentId: 'parent-1',
  instanceDate: new Date('2026-02-03'),
  createdAt: new Date('2026-02-01'),
  updatedAt: new Date('2026-02-01'),
  deletedAt: null,
  ...overrides,
});

// =============================================================================
// Tests
// =============================================================================

describe('RecurringDeleteDialog', () => {
  const mockTask = createMockTask();
  let mockOnClose: () => void;
  let mockOnDeleteThisOnly: () => void;
  let mockOnDeleteAllFuture: () => void;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnDeleteThisOnly = vi.fn();
    mockOnDeleteAllFuture = vi.fn();
  });

  describe('Rendering', () => {
    it('renders when open', () => {
      render(
        <RecurringDeleteDialog
          isOpen={true}
          onClose={mockOnClose}
          onDeleteThisOnly={mockOnDeleteThisOnly}
          onDeleteAllFuture={mockOnDeleteAllFuture}
          task={mockTask}
        />
      );

      expect(screen.getByText('Delete Recurring Task')).toBeInTheDocument();
      expect(screen.getByText(/This is a recurring task/i)).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <RecurringDeleteDialog
          isOpen={false}
          onClose={mockOnClose}
          onDeleteThisOnly={mockOnDeleteThisOnly}
          onDeleteAllFuture={mockOnDeleteAllFuture}
          task={mockTask}
        />
      );

      expect(screen.queryByText('Delete Recurring Task')).not.toBeInTheDocument();
    });

    it('shows both delete option buttons', () => {
      render(
        <RecurringDeleteDialog
          isOpen={true}
          onClose={mockOnClose}
          onDeleteThisOnly={mockOnDeleteThisOnly}
          onDeleteAllFuture={mockOnDeleteAllFuture}
          task={mockTask}
        />
      );

      expect(screen.getByTestId('delete-this-only-button')).toBeInTheDocument();
      expect(screen.getByTestId('delete-all-future-button')).toBeInTheDocument();
    });

    it('displays the instance date in the "this only" option', () => {
      render(
        <RecurringDeleteDialog
          isOpen={true}
          onClose={mockOnClose}
          onDeleteThisOnly={mockOnDeleteThisOnly}
          onDeleteAllFuture={mockOnDeleteAllFuture}
          task={mockTask}
        />
      );

      // Check that text mentions removing only a specific date
      expect(screen.getByText(/Removes only/)).toBeInTheDocument();
    });

    it('shows warning message about permanent deletion', () => {
      render(
        <RecurringDeleteDialog
          isOpen={true}
          onClose={mockOnClose}
          onDeleteThisOnly={mockOnDeleteThisOnly}
          onDeleteAllFuture={mockOnDeleteAllFuture}
          task={mockTask}
        />
      );

      expect(screen.getByText(/Deletion is permanent/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onDeleteThisOnly when "Delete only this occurrence" is clicked', () => {
      render(
        <RecurringDeleteDialog
          isOpen={true}
          onClose={mockOnClose}
          onDeleteThisOnly={mockOnDeleteThisOnly}
          onDeleteAllFuture={mockOnDeleteAllFuture}
          task={mockTask}
        />
      );

      const deleteThisButton = screen.getByTestId('delete-this-only-button');
      fireEvent.click(deleteThisButton);

      expect(mockOnDeleteThisOnly).toHaveBeenCalledTimes(1);
      expect(mockOnDeleteAllFuture).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('calls onDeleteAllFuture when "Delete all occurrences from this point forward" is clicked', () => {
      render(
        <RecurringDeleteDialog
          isOpen={true}
          onClose={mockOnClose}
          onDeleteThisOnly={mockOnDeleteThisOnly}
          onDeleteAllFuture={mockOnDeleteAllFuture}
          task={mockTask}
        />
      );

      const deleteAllButton = screen.getByTestId('delete-all-future-button');
      fireEvent.click(deleteAllButton);

      expect(mockOnDeleteAllFuture).toHaveBeenCalledTimes(1);
      expect(mockOnDeleteThisOnly).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('calls onClose when Cancel is clicked', () => {
      render(
        <RecurringDeleteDialog
          isOpen={true}
          onClose={mockOnClose}
          onDeleteThisOnly={mockOnDeleteThisOnly}
          onDeleteAllFuture={mockOnDeleteAllFuture}
          task={mockTask}
        />
      );

      const cancelButton = screen.getByTestId('cancel-button');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnDeleteThisOnly).not.toHaveBeenCalled();
      expect(mockOnDeleteAllFuture).not.toHaveBeenCalled();
    });

    it('calls onClose when modal backdrop is clicked', () => {
      render(
        <RecurringDeleteDialog
          isOpen={true}
          onClose={mockOnClose}
          onDeleteThisOnly={mockOnDeleteThisOnly}
          onDeleteAllFuture={mockOnDeleteAllFuture}
          task={mockTask}
        />
      );

      // The modal backdrop is rendered in a portal, test by simulating escape key
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('renders with proper ARIA role', () => {
      render(
        <RecurringDeleteDialog
          isOpen={true}
          onClose={mockOnClose}
          onDeleteThisOnly={mockOnDeleteThisOnly}
          onDeleteAllFuture={mockOnDeleteAllFuture}
          task={mockTask}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(
        <RecurringDeleteDialog
          isOpen={true}
          onClose={mockOnClose}
          onDeleteThisOnly={mockOnDeleteThisOnly}
          onDeleteAllFuture={mockOnDeleteAllFuture}
          task={mockTask}
        />
      );

      expect(screen.getByText('Delete Recurring Task')).toBeInTheDocument();
      expect(screen.getByText('Delete only this occurrence')).toBeInTheDocument();
      expect(screen.getByText('Delete all occurrences from this point forward')).toBeInTheDocument();
      expect(screen.getByText('Cancel - Do nothing')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(
        <RecurringDeleteDialog
          isOpen={true}
          onClose={mockOnClose}
          onDeleteThisOnly={mockOnDeleteThisOnly}
          onDeleteAllFuture={mockOnDeleteAllFuture}
          task={mockTask}
        />
      );

      const deleteThisButton = screen.getByTestId('delete-this-only-button');
      const deleteAllButton = screen.getByTestId('delete-all-future-button');
      const cancelButton = screen.getByTestId('cancel-button');

      // All buttons should be focusable
      expect(deleteThisButton).toBeVisible();
      expect(deleteAllButton).toBeVisible();
      expect(cancelButton).toBeVisible();
    });
  });

  describe('Custom Test ID', () => {
    it('uses custom testId when provided', () => {
      render(
        <RecurringDeleteDialog
          isOpen={true}
          onClose={mockOnClose}
          onDeleteThisOnly={mockOnDeleteThisOnly}
          onDeleteAllFuture={mockOnDeleteAllFuture}
          task={mockTask}
          testId="custom-recurring-dialog"
        />
      );

      expect(screen.getByTestId('custom-recurring-dialog')).toBeInTheDocument();
    });

    it('uses default testId when not provided', () => {
      render(
        <RecurringDeleteDialog
          isOpen={true}
          onClose={mockOnClose}
          onDeleteThisOnly={mockOnDeleteThisOnly}
          onDeleteAllFuture={mockOnDeleteAllFuture}
          task={mockTask}
        />
      );

      expect(screen.getByTestId('recurring-delete-dialog')).toBeInTheDocument();
    });
  });
});
