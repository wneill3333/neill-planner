/**
 * TaskItem Component Tests
 *
 * Comprehensive tests for the TaskItem component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    description: null,
    date: '2024-01-15',
    priority: { letter: 'A', number: 1 },
    status: 'in_progress',
    categoryId: null,
    estimatedMinutes: null,
    actualMinutes: null,
    notes: null,
    recurrence: null,
    parentTaskId: null,
    isRecurringInstance: false,
    originalDate: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    completedAt: null,
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

    it('should render category color when provided', () => {
      const task = createMockTask({ categoryId: 'cat-1' });
      const category = createMockCategory({ color: '#FF5733' });
      render(<TaskItem task={task} category={category} />);

      const colorIndicator = screen.getByTestId('category-color');
      expect(colorIndicator).toHaveStyle({ backgroundColor: '#FF5733' });
    });

    it('should render default color when no category', () => {
      const task = createMockTask({ categoryId: null });
      render(<TaskItem task={task} />);

      const colorIndicator = screen.getByTestId('category-color');
      expect(colorIndicator).toHaveStyle({ backgroundColor: '#E5E7EB' });
    });

    it('should hide category color when showCategoryColor is false', () => {
      const task = createMockTask();
      render(<TaskItem task={task} showCategoryColor={false} />);

      expect(screen.queryByTestId('category-color')).not.toBeInTheDocument();
    });

    it('should show recurrence icon for recurring tasks', () => {
      const task = createMockTask({
        recurrence: {
          pattern: 'daily',
          interval: 1,
          endDate: null,
          daysOfWeek: null,
          dayOfMonth: null,
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
      expect(taskItem).toHaveAttribute(
        'aria-label',
        'Task: Important Meeting, Priority A1, Status in_progress'
      );
    });

    it('should have accessible status button', () => {
      const task = createMockTask({ status: 'forward' });
      render(<TaskItem task={task} />);

      const statusButton = screen.getByTestId('status-symbol');
      expect(statusButton).toHaveAttribute('aria-label', 'Status: forward. Click to change.');
    });

    it('should have aria-hidden on category color indicator', () => {
      const task = createMockTask();
      render(<TaskItem task={task} />);

      const colorIndicator = screen.getByTestId('category-color');
      expect(colorIndicator).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have aria-label on recurrence icon', () => {
      const task = createMockTask({ isRecurringInstance: true });
      render(<TaskItem task={task} />);

      const recurrenceIcon = screen.getByTestId('recurrence-icon');
      expect(recurrenceIcon).toHaveAttribute('aria-label', 'This is a recurring task');
    });
  });

  // =============================================================================
  // Priority Color Tests
  // =============================================================================

  describe('Priority Colors', () => {
    it('should apply correct text color for priority A', () => {
      const task = createMockTask({ priority: { letter: 'A', number: 1 } });
      render(<TaskItem task={task} />);

      const priorityLabel = screen.getByTestId('priority-label');
      expect(priorityLabel).toHaveClass('text-red-600');
    });

    it('should apply correct text color for priority B', () => {
      const task = createMockTask({ priority: { letter: 'B', number: 1 } });
      render(<TaskItem task={task} />);

      const priorityLabel = screen.getByTestId('priority-label');
      expect(priorityLabel).toHaveClass('text-orange-600');
    });

    it('should apply correct text color for priority C', () => {
      const task = createMockTask({ priority: { letter: 'C', number: 1 } });
      render(<TaskItem task={task} />);

      const priorityLabel = screen.getByTestId('priority-label');
      expect(priorityLabel).toHaveClass('text-yellow-600');
    });

    it('should apply correct text color for priority D', () => {
      const task = createMockTask({ priority: { letter: 'D', number: 1 } });
      render(<TaskItem task={task} />);

      const priorityLabel = screen.getByTestId('priority-label');
      expect(priorityLabel).toHaveClass('text-gray-600');
    });
  });
});
