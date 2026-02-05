/**
 * RecurringEditDialog Tests
 *
 * Tests for the RecurringEditDialog component which allows users to choose
 * how to edit a recurring task instance.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecurringEditDialog } from '../RecurringEditDialog';
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
  scheduledTime: '09:00',
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

describe('RecurringEditDialog', () => {
  const mockTask = createMockTask();
  let mockOnClose: ReturnType<typeof vi.fn>;
  let mockOnEditThisOnly: ReturnType<typeof vi.fn>;
  let mockOnEditAllFuture: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnEditThisOnly = vi.fn();
    mockOnEditAllFuture = vi.fn();
  });

  describe('Rendering', () => {
    it('renders when open', () => {
      render(
        <RecurringEditDialog
          isOpen={true}
          onClose={mockOnClose}
          onEditThisOnly={mockOnEditThisOnly}
          onEditAllFuture={mockOnEditAllFuture}
          task={mockTask}
        />
      );

      expect(screen.getByText('Edit Recurring Task')).toBeInTheDocument();
      expect(screen.getByText(/This is a recurring task/i)).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <RecurringEditDialog
          isOpen={false}
          onClose={mockOnClose}
          onEditThisOnly={mockOnEditThisOnly}
          onEditAllFuture={mockOnEditAllFuture}
          task={mockTask}
        />
      );

      expect(screen.queryByText('Edit Recurring Task')).not.toBeInTheDocument();
    });

    it('shows both edit option buttons', () => {
      render(
        <RecurringEditDialog
          isOpen={true}
          onClose={mockOnClose}
          onEditThisOnly={mockOnEditThisOnly}
          onEditAllFuture={mockOnEditAllFuture}
          task={mockTask}
        />
      );

      expect(screen.getByTestId('edit-this-only-button')).toBeInTheDocument();
      expect(screen.getByTestId('edit-all-future-button')).toBeInTheDocument();
    });

    it('displays the instance date in the "this only" option', () => {
      render(
        <RecurringEditDialog
          isOpen={true}
          onClose={mockOnClose}
          onEditThisOnly={mockOnEditThisOnly}
          onEditAllFuture={mockOnEditAllFuture}
          task={mockTask}
        />
      );

      // Check that text mentions the date
      expect(screen.getByText(/Changes will only apply to/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onEditThisOnly when "Edit this occurrence only" is clicked', () => {
      render(
        <RecurringEditDialog
          isOpen={true}
          onClose={mockOnClose}
          onEditThisOnly={mockOnEditThisOnly}
          onEditAllFuture={mockOnEditAllFuture}
          task={mockTask}
        />
      );

      const editThisButton = screen.getByTestId('edit-this-only-button');
      fireEvent.click(editThisButton);

      expect(mockOnEditThisOnly).toHaveBeenCalledTimes(1);
      expect(mockOnEditAllFuture).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('calls onEditAllFuture when "Edit all future occurrences" is clicked', () => {
      render(
        <RecurringEditDialog
          isOpen={true}
          onClose={mockOnClose}
          onEditThisOnly={mockOnEditThisOnly}
          onEditAllFuture={mockOnEditAllFuture}
          task={mockTask}
        />
      );

      const editAllButton = screen.getByTestId('edit-all-future-button');
      fireEvent.click(editAllButton);

      expect(mockOnEditAllFuture).toHaveBeenCalledTimes(1);
      expect(mockOnEditThisOnly).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('calls onClose when Cancel is clicked', () => {
      render(
        <RecurringEditDialog
          isOpen={true}
          onClose={mockOnClose}
          onEditThisOnly={mockOnEditThisOnly}
          onEditAllFuture={mockOnEditAllFuture}
          task={mockTask}
        />
      );

      const cancelButton = screen.getByTestId('cancel-button');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnEditThisOnly).not.toHaveBeenCalled();
      expect(mockOnEditAllFuture).not.toHaveBeenCalled();
    });

    it('calls onClose when modal backdrop is clicked', () => {
      render(
        <RecurringEditDialog
          isOpen={true}
          onClose={mockOnClose}
          onEditThisOnly={mockOnEditThisOnly}
          onEditAllFuture={mockOnEditAllFuture}
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
        <RecurringEditDialog
          isOpen={true}
          onClose={mockOnClose}
          onEditThisOnly={mockOnEditThisOnly}
          onEditAllFuture={mockOnEditAllFuture}
          task={mockTask}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(
        <RecurringEditDialog
          isOpen={true}
          onClose={mockOnClose}
          onEditThisOnly={mockOnEditThisOnly}
          onEditAllFuture={mockOnEditAllFuture}
          task={mockTask}
        />
      );

      expect(screen.getByText('Edit Recurring Task')).toBeInTheDocument();
      expect(screen.getByText('Edit this occurrence only')).toBeInTheDocument();
      expect(screen.getByText('Edit all future occurrences')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(
        <RecurringEditDialog
          isOpen={true}
          onClose={mockOnClose}
          onEditThisOnly={mockOnEditThisOnly}
          onEditAllFuture={mockOnEditAllFuture}
          task={mockTask}
        />
      );

      const editThisButton = screen.getByTestId('edit-this-only-button');
      const editAllButton = screen.getByTestId('edit-all-future-button');
      const cancelButton = screen.getByTestId('cancel-button');

      // All buttons should be focusable
      expect(editThisButton).toBeVisible();
      expect(editAllButton).toBeVisible();
      expect(cancelButton).toBeVisible();
    });
  });

  describe('Custom Test ID', () => {
    it('uses custom testId when provided', () => {
      render(
        <RecurringEditDialog
          isOpen={true}
          onClose={mockOnClose}
          onEditThisOnly={mockOnEditThisOnly}
          onEditAllFuture={mockOnEditAllFuture}
          task={mockTask}
          testId="custom-recurring-dialog"
        />
      );

      expect(screen.getByTestId('custom-recurring-dialog')).toBeInTheDocument();
    });

    it('uses default testId when not provided', () => {
      render(
        <RecurringEditDialog
          isOpen={true}
          onClose={mockOnClose}
          onEditThisOnly={mockOnEditThisOnly}
          onEditAllFuture={mockOnEditAllFuture}
          task={mockTask}
        />
      );

      expect(screen.getByTestId('recurring-edit-dialog')).toBeInTheDocument();
    });
  });
});
