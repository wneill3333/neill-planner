/**
 * TaskItem Component Tests
 *
 * Comprehensive tests for the TaskItem component.
 *
 * New layout: Status Symbol | Priority (with category color background) | Title
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskItem } from '../TaskItem';
import type { Task, Category } from '../../../types';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: 'user-1',
    title: 'Test Task',
    description: '',
    categoryId: null,
    priority: { letter: 'A', number: 1 },
    status: 'in_progress',
    scheduledDate: new Date('2024-01-15'),
    scheduledTime: null,
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

describe('TaskItem', () => {
  describe('Rendering', () => {
    it('should render task title', () => {
      const task = createMockTask({ title: 'My Important Task' });
      render(<TaskItem task={task} />);

      expect(screen.getByText('My Important Task')).toBeInTheDocument();
    });

    it('should render priority label', () => {
      const task = createMockTask({ priority: { letter: 'B', number: 3 } });
      render(<TaskItem task={task} />);

      expect(screen.getByTestId('priority-label')).toHaveTextContent('B3');
    });

    it('should render status symbol', () => {
      const task = createMockTask({ status: 'in_progress' });
      render(<TaskItem task={task} />);

      expect(screen.getByTestId('status-symbol')).toHaveTextContent('●');
    });

    it('should render different status symbols', () => {
      const statuses = [
        { status: 'in_progress' as const, symbol: '●' },
        { status: 'forward' as const, symbol: '➜' },
        { status: 'complete' as const, symbol: '✔' },
        { status: 'delete' as const, symbol: '✘' },
        { status: 'delegate' as const, symbol: '◯' },
      ];

      for (const { status, symbol } of statuses) {
        const { unmount } = render(<TaskItem task={createMockTask({ status })} />);
        expect(screen.getByTestId('status-symbol')).toHaveTextContent(symbol);
        unmount();
      }
    });

    it('should render category color on priority label background when provided', () => {
      const task = createMockTask({ categoryId: 'cat-1' });
      const category = createMockCategory({ color: '#FF5733' });
      render(<TaskItem task={task} category={category} />);

      const priorityLabel = screen.getByTestId('priority-label');
      expect(priorityLabel).toHaveStyle({ backgroundColor: '#FF5733' });
    });

    it('should render default gray color on priority label when no category', () => {
      const task = createMockTask({ categoryId: null });
      render(<TaskItem task={task} />);

      const priorityLabel = screen.getByTestId('priority-label');
      expect(priorityLabel).toHaveStyle({ backgroundColor: '#9CA3AF' });
    });

    it('should use contrasting text color on priority label for light background', () => {
      const task = createMockTask({ categoryId: 'cat-1' });
      const category = createMockCategory({ color: '#FFFF00' }); // Yellow (light)
      render(<TaskItem task={task} category={category} />);

      const priorityLabel = screen.getByTestId('priority-label');
      expect(priorityLabel).toHaveStyle({ color: '#000000' }); // Black text
    });

    it('should use contrasting text color on priority label for dark background', () => {
      const task = createMockTask({ categoryId: 'cat-1' });
      const category = createMockCategory({ color: '#000080' }); // Navy (dark)
      render(<TaskItem task={task} category={category} />);

      const priorityLabel = screen.getByTestId('priority-label');
      expect(priorityLabel).toHaveStyle({ color: '#FFFFFF' }); // White text
    });

    it('should show recurrence icon for recurring tasks', () => {
      const task = createMockTask({
        recurrence: {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
      });
      render(<TaskItem task={task} />);

      expect(screen.getByTestId('recurrence-icon')).toBeInTheDocument();
    });

    it('should show recurrence icon for recurring instances', () => {
      const task = createMockTask({ isRecurringInstance: true });
      render(<TaskItem task={task} />);

      expect(screen.getByTestId('recurrence-icon')).toBeInTheDocument();
    });

    it('should not show recurrence icon for non-recurring tasks', () => {
      const task = createMockTask({ recurrence: null, isRecurringInstance: false });
      render(<TaskItem task={task} />);

      expect(screen.queryByTestId('recurrence-icon')).not.toBeInTheDocument();
    });

    it('should apply completed styling for complete tasks', () => {
      const task = createMockTask({ status: 'complete' });
      render(<TaskItem task={task} />);

      const title = screen.getByTestId('task-title');
      expect(title).toHaveClass('line-through');
    });

    it('should not apply completed styling for in_progress tasks', () => {
      const task = createMockTask({ status: 'in_progress' });
      render(<TaskItem task={task} />);

      const title = screen.getByTestId('task-title');
      expect(title).not.toHaveClass('line-through');
    });

    it('should render with custom testId', () => {
      const task = createMockTask();
      render(<TaskItem task={task} testId="custom-task" />);

      expect(screen.getByTestId('custom-task')).toBeInTheDocument();
    });

    it('should render with default testId based on task id', () => {
      const task = createMockTask({ id: 'my-task-id' });
      render(<TaskItem task={task} />);

      expect(screen.getByTestId('task-item-my-task-id')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Interaction Tests
  // =============================================================================

  describe('Interactions', () => {
    it('should call onClick when task is clicked', () => {
      const task = createMockTask();
      const handleClick = vi.fn();
      render(<TaskItem task={task} onClick={handleClick} />);

      fireEvent.click(screen.getByTestId('task-item-task-1'));

      expect(handleClick).toHaveBeenCalledWith(task);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onStatusClick when status symbol is clicked', () => {
      const task = createMockTask();
      const handleStatusClick = vi.fn();
      render(<TaskItem task={task} onStatusClick={handleStatusClick} />);

      fireEvent.click(screen.getByTestId('status-symbol'));

      expect(handleStatusClick).toHaveBeenCalledWith(task);
      expect(handleStatusClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when status symbol is clicked', () => {
      const task = createMockTask();
      const handleClick = vi.fn();
      const handleStatusClick = vi.fn();
      render(<TaskItem task={task} onClick={handleClick} onStatusClick={handleStatusClick} />);

      fireEvent.click(screen.getByTestId('status-symbol'));

      expect(handleStatusClick).toHaveBeenCalledTimes(1);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should call onClick on Enter key press', () => {
      const task = createMockTask();
      const handleClick = vi.fn();
      render(<TaskItem task={task} onClick={handleClick} />);

      const taskItem = screen.getByTestId('task-item-task-1');
      fireEvent.keyDown(taskItem, { key: 'Enter' });

      expect(handleClick).toHaveBeenCalledWith(task);
    });

    it('should call onClick on Space key press', () => {
      const task = createMockTask();
      const handleClick = vi.fn();
      render(<TaskItem task={task} onClick={handleClick} />);

      const taskItem = screen.getByTestId('task-item-task-1');
      fireEvent.keyDown(taskItem, { key: ' ' });

      expect(handleClick).toHaveBeenCalledWith(task);
    });

    it('should not call onClick on other key presses', () => {
      const task = createMockTask();
      const handleClick = vi.fn();
      render(<TaskItem task={task} onClick={handleClick} />);

      const taskItem = screen.getByTestId('task-item-task-1');
      fireEvent.keyDown(taskItem, { key: 'Tab' });

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not error when onClick is not provided', () => {
      const task = createMockTask();
      render(<TaskItem task={task} />);

      expect(() => {
        fireEvent.click(screen.getByTestId('task-item-task-1'));
      }).not.toThrow();
    });

    it('should not error when onStatusClick is not provided', () => {
      const task = createMockTask();
      render(<TaskItem task={task} />);

      expect(() => {
        fireEvent.click(screen.getByTestId('status-symbol'));
      }).not.toThrow();
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('Accessibility', () => {
    it('should have role="button"', () => {
      const task = createMockTask();
      render(<TaskItem task={task} />);

      expect(screen.getByRole('button', { name: /Task:/ })).toBeInTheDocument();
    });

    it('should be focusable with tabIndex', () => {
      const task = createMockTask();
      render(<TaskItem task={task} />);

      const taskItem = screen.getByTestId('task-item-task-1');
      expect(taskItem).toHaveAttribute('tabindex', '0');
    });

    it('should have descriptive aria-label', () => {
      const task = createMockTask({
        title: 'Important Meeting',
        priority: { letter: 'A', number: 1 },
        status: 'in_progress',
      });
      render(<TaskItem task={task} />);

      const taskItem = screen.getByTestId('task-item-task-1');
      // aria-label format: Task: {title}. Priority {label}. Status: {status}...
      expect(taskItem).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Task: Important Meeting')
      );
      expect(taskItem).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Priority A1')
      );
      expect(taskItem).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Status: In Progress')
      );
    });

    it('should have accessible status button', () => {
      const task = createMockTask({ status: 'forward' });
      render(<TaskItem task={task} />);

      const statusButton = screen.getByTestId('status-symbol');
      expect(statusButton).toHaveAttribute('aria-label', 'Status: Forwarded. Click to change.');
    });

    it('should have aria-label on recurrence icon', () => {
      const task = createMockTask({ isRecurringInstance: true });
      render(<TaskItem task={task} />);

      const recurrenceIcon = screen.getByTestId('recurrence-icon');
      expect(recurrenceIcon).toHaveAttribute('aria-label', 'This is a recurring task');
    });
  });

  // =============================================================================
  // Category Color Tests
  // =============================================================================

  describe('Category Colors', () => {
    it('should apply category color as priority label background', () => {
      const task = createMockTask({ categoryId: 'cat-1' });
      const category = createMockCategory({ color: '#EF4444' }); // Red
      render(<TaskItem task={task} category={category} />);

      const priorityLabel = screen.getByTestId('priority-label');
      expect(priorityLabel).toHaveStyle({ backgroundColor: '#EF4444' });
    });

    it('should apply different category colors correctly', () => {
      const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6'];

      for (const color of colors) {
        const task = createMockTask({ categoryId: 'cat-1' });
        const category = createMockCategory({ color });
        const { unmount } = render(<TaskItem task={task} category={category} />);

        const priorityLabel = screen.getByTestId('priority-label');
        expect(priorityLabel).toHaveStyle({ backgroundColor: color });
        unmount();
      }
    });

    it('should apply default gray when category is null', () => {
      const task = createMockTask({ categoryId: null });
      render(<TaskItem task={task} category={null} />);

      const priorityLabel = screen.getByTestId('priority-label');
      expect(priorityLabel).toHaveStyle({ backgroundColor: '#9CA3AF' });
    });

    it('should apply default gray when category is undefined', () => {
      const task = createMockTask({ categoryId: 'cat-1' });
      render(<TaskItem task={task} />);

      const priorityLabel = screen.getByTestId('priority-label');
      expect(priorityLabel).toHaveStyle({ backgroundColor: '#9CA3AF' });
    });
  });
});
