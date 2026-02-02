/**
 * TaskList Component Tests
 *
 * Comprehensive tests for the TaskList component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskList } from '../TaskList';
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
// Empty State Tests
// =============================================================================

describe('TaskList', () => {
  describe('Empty State', () => {
    it('should render empty state when no tasks', () => {
      render(<TaskList tasks={[]} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should show default empty message', () => {
      render(<TaskList tasks={[]} />);

      expect(screen.getByText('No tasks for this day')).toBeInTheDocument();
    });

    it('should show hint to add new task', () => {
      render(<TaskList tasks={[]} />);

      expect(screen.getByText('Click the + button to add a new task')).toBeInTheDocument();
    });

    it('should render custom empty message', () => {
      render(<TaskList tasks={[]} emptyMessage="Nothing to do today!" />);

      expect(screen.getByText('Nothing to do today!')).toBeInTheDocument();
    });

    it('should render custom empty component', () => {
      const customEmpty = <div data-testid="custom-empty">Custom Empty State</div>;
      render(<TaskList tasks={[]} emptyComponent={customEmpty} />);

      expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('should render empty state icon', () => {
      render(<TaskList tasks={[]} />);

      const icon = screen.getByTestId('empty-state').querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Loading State Tests
  // =============================================================================

  describe('Loading State', () => {
    it('should render loading state when loading is true', () => {
      render(<TaskList tasks={[]} loading={true} />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('should show loading skeleton with animation', () => {
      render(<TaskList tasks={[]} loading={true} />);

      // The loading state uses skeleton loaders with animate-pulse class
      const skeleton = screen.getByTestId('loading-state').querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should show loading text', () => {
      render(<TaskList tasks={[]} loading={true} />);

      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
    });

    it('should show loading state instead of empty state when loading', () => {
      render(<TaskList tasks={[]} loading={true} />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('should show loading state instead of tasks when loading', () => {
      const tasks = [createMockTask()];
      render(<TaskList tasks={tasks} loading={true} />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.queryByTestId('task-list')).not.toBeInTheDocument();
    });
  });

  // =============================================================================
  // Rendering Tests
  // =============================================================================

  describe('Rendering', () => {
    it('should render task list with tasks', () => {
      const tasks = [createMockTask()];
      render(<TaskList tasks={tasks} />);

      expect(screen.getByTestId('task-list')).toBeInTheDocument();
    });

    it('should render all tasks', () => {
      const tasks = [
        createMockTask({ id: '1', title: 'Task 1' }),
        createMockTask({ id: '2', title: 'Task 2' }),
        createMockTask({ id: '3', title: 'Task 3' }),
      ];
      render(<TaskList tasks={tasks} />);

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      const tasks = [createMockTask()];
      render(<TaskList tasks={tasks} testId="custom-list" />);

      expect(screen.getByTestId('custom-list')).toBeInTheDocument();
    });

    it('should render default testId', () => {
      const tasks = [createMockTask()];
      render(<TaskList tasks={tasks} />);

      expect(screen.getByTestId('task-list')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Priority Grouping Tests
  // =============================================================================

  describe('Priority Grouping', () => {
    it('should group tasks by priority letter', () => {
      const tasks = [
        createMockTask({ id: '1', priority: { letter: 'A', number: 1 } }),
        createMockTask({ id: '2', priority: { letter: 'B', number: 1 } }),
        createMockTask({ id: '3', priority: { letter: 'C', number: 1 } }),
      ];
      render(<TaskList tasks={tasks} />);

      expect(screen.getByTestId('priority-group-A')).toBeInTheDocument();
      expect(screen.getByTestId('priority-group-B')).toBeInTheDocument();
      expect(screen.getByTestId('priority-group-C')).toBeInTheDocument();
    });

    it('should only render non-empty priority groups', () => {
      const tasks = [
        createMockTask({ id: '1', priority: { letter: 'A', number: 1 } }),
        createMockTask({ id: '2', priority: { letter: 'C', number: 1 } }),
      ];
      render(<TaskList tasks={tasks} />);

      expect(screen.getByTestId('priority-group-A')).toBeInTheDocument();
      expect(screen.queryByTestId('priority-group-B')).not.toBeInTheDocument();
      expect(screen.getByTestId('priority-group-C')).toBeInTheDocument();
      expect(screen.queryByTestId('priority-group-D')).not.toBeInTheDocument();
    });

    it('should maintain priority order (A, B, C, D)', () => {
      const tasks = [
        createMockTask({ id: '1', priority: { letter: 'D', number: 1 } }),
        createMockTask({ id: '2', priority: { letter: 'A', number: 1 } }),
        createMockTask({ id: '3', priority: { letter: 'C', number: 1 } }),
        createMockTask({ id: '4', priority: { letter: 'B', number: 1 } }),
      ];
      render(<TaskList tasks={tasks} />);

      const taskList = screen.getByTestId('task-list');
      const groups = taskList.children;

      // Check order of priority groups
      expect(groups[0]).toHaveAttribute('data-testid', 'priority-group-A');
      expect(groups[1]).toHaveAttribute('data-testid', 'priority-group-B');
      expect(groups[2]).toHaveAttribute('data-testid', 'priority-group-C');
      expect(groups[3]).toHaveAttribute('data-testid', 'priority-group-D');
    });

    it('should sort tasks within groups by priority number', () => {
      const tasks = [
        createMockTask({ id: '3', title: 'A3', priority: { letter: 'A', number: 3 } }),
        createMockTask({ id: '1', title: 'A1', priority: { letter: 'A', number: 1 } }),
        createMockTask({ id: '2', title: 'A2', priority: { letter: 'A', number: 2 } }),
      ];
      render(<TaskList tasks={tasks} />);

      const priorityGroup = screen.getByTestId('priority-group-A');
      const taskItems = priorityGroup.querySelectorAll('[data-testid^="task-item"]');

      expect(taskItems[0]).toHaveTextContent('A1');
      expect(taskItems[1]).toHaveTextContent('A2');
      expect(taskItems[2]).toHaveTextContent('A3');
    });

    it('should show correct task counts in each group', () => {
      const tasks = [
        createMockTask({ id: '1', priority: { letter: 'A', number: 1 } }),
        createMockTask({ id: '2', priority: { letter: 'A', number: 2 } }),
        createMockTask({ id: '3', priority: { letter: 'B', number: 1 } }),
      ];
      render(<TaskList tasks={tasks} />);

      expect(screen.getByText('(2 tasks)')).toBeInTheDocument();
      expect(screen.getByText('(1 task)')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Category Tests
  // =============================================================================

  describe('Category Colors', () => {
    it('should pass categories map to task items', () => {
      const category = createMockCategory({ id: 'cat-1', color: '#FF5733' });
      const tasks = [createMockTask({ id: '1', categoryId: 'cat-1' })];
      const categoriesMap = { 'cat-1': category };

      render(<TaskList tasks={tasks} categoriesMap={categoriesMap} />);

      const colorIndicator = screen.getByTestId('category-color');
      expect(colorIndicator).toHaveStyle({ backgroundColor: '#FF5733' });
    });

    it('should handle multiple categories', () => {
      const categories = {
        'cat-1': createMockCategory({ id: 'cat-1', color: '#FF0000' }),
        'cat-2': createMockCategory({ id: 'cat-2', color: '#00FF00' }),
      };
      const tasks = [
        createMockTask({ id: '1', categoryId: 'cat-1', priority: { letter: 'A', number: 1 } }),
        createMockTask({ id: '2', categoryId: 'cat-2', priority: { letter: 'A', number: 2 } }),
      ];

      render(<TaskList tasks={tasks} categoriesMap={categories} />);

      const colorIndicators = screen.getAllByTestId('category-color');
      expect(colorIndicators[0]).toHaveStyle({ backgroundColor: '#FF0000' });
      expect(colorIndicators[1]).toHaveStyle({ backgroundColor: '#00FF00' });
    });

    it('should hide category colors when showCategoryColors is false', () => {
      const tasks = [createMockTask()];

      render(<TaskList tasks={tasks} showCategoryColors={false} />);

      expect(screen.queryByTestId('category-color')).not.toBeInTheDocument();
    });
  });

  // =============================================================================
  // Interaction Tests
  // =============================================================================

  describe('Interactions', () => {
    it('should call onTaskClick when a task is clicked', () => {
      const tasks = [createMockTask({ id: '1', title: 'Clickable Task' })];
      const handleClick = vi.fn();

      render(<TaskList tasks={tasks} onTaskClick={handleClick} />);

      fireEvent.click(screen.getByTestId('task-item-1'));

      expect(handleClick).toHaveBeenCalledWith(tasks[0]);
    });

    it('should call onStatusClick when status symbol is clicked', () => {
      const tasks = [createMockTask({ id: '1' })];
      const handleStatusClick = vi.fn();

      render(<TaskList tasks={tasks} onStatusClick={handleStatusClick} />);

      fireEvent.click(screen.getByTestId('status-symbol'));

      expect(handleStatusClick).toHaveBeenCalledWith(tasks[0]);
    });

    it('should handle clicks on tasks in different priority groups', () => {
      const tasks = [
        createMockTask({ id: '1', priority: { letter: 'A', number: 1 } }),
        createMockTask({ id: '2', priority: { letter: 'B', number: 1 } }),
      ];
      const handleClick = vi.fn();

      render(<TaskList tasks={tasks} onTaskClick={handleClick} />);

      fireEvent.click(screen.getByTestId('task-item-1'));
      fireEvent.click(screen.getByTestId('task-item-2'));

      expect(handleClick).toHaveBeenCalledTimes(2);
      expect(handleClick).toHaveBeenNthCalledWith(1, tasks[0]);
      expect(handleClick).toHaveBeenNthCalledWith(2, tasks[1]);
    });

    it('should not error when onTaskClick is not provided', () => {
      const tasks = [createMockTask()];

      render(<TaskList tasks={tasks} />);

      expect(() => {
        fireEvent.click(screen.getByTestId('task-item-task-1'));
      }).not.toThrow();
    });

    it('should not error when onStatusClick is not provided', () => {
      const tasks = [createMockTask()];

      render(<TaskList tasks={tasks} />);

      expect(() => {
        fireEvent.click(screen.getByTestId('status-symbol'));
      }).not.toThrow();
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe('Edge Cases', () => {
    it('should handle single task', () => {
      const tasks = [createMockTask()];
      render(<TaskList tasks={tasks} />);

      expect(screen.getByTestId('task-list')).toBeInTheDocument();
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should handle many tasks', () => {
      const tasks = Array.from({ length: 50 }, (_, i) =>
        createMockTask({
          id: `task-${i}`,
          title: `Task ${i}`,
          priority: {
            letter: ['A', 'B', 'C', 'D'][i % 4] as 'A' | 'B' | 'C' | 'D',
            number: Math.floor(i / 4) + 1,
          },
        })
      );

      render(<TaskList tasks={tasks} />);

      expect(screen.getByTestId('priority-group-A')).toBeInTheDocument();
      expect(screen.getByTestId('priority-group-B')).toBeInTheDocument();
      expect(screen.getByTestId('priority-group-C')).toBeInTheDocument();
      expect(screen.getByTestId('priority-group-D')).toBeInTheDocument();
    });

    it('should handle tasks with missing categories', () => {
      const tasks = [createMockTask({ categoryId: 'non-existent' })];
      const categoriesMap = {}; // Empty map

      render(<TaskList tasks={tasks} categoriesMap={categoriesMap} />);

      const colorIndicator = screen.getByTestId('category-color');
      // Should fall back to default color
      expect(colorIndicator).toHaveStyle({ backgroundColor: '#E5E7EB' });
    });

    it('should handle switching from loading to tasks', () => {
      const tasks = [createMockTask()];
      const { rerender } = render(<TaskList tasks={[]} loading={true} />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();

      rerender(<TaskList tasks={tasks} loading={false} />);

      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      expect(screen.getByTestId('task-list')).toBeInTheDocument();
    });

    it('should handle switching from tasks to empty', () => {
      const tasks = [createMockTask()];
      const { rerender } = render(<TaskList tasks={tasks} />);

      expect(screen.getByTestId('task-list')).toBeInTheDocument();

      rerender(<TaskList tasks={[]} />);

      expect(screen.queryByTestId('task-list')).not.toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });
});
