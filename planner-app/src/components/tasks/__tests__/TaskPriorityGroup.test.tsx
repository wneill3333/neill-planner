/**
 * TaskPriorityGroup Component Tests
 *
 * Comprehensive tests for the TaskPriorityGroup component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskPriorityGroup } from '../TaskPriorityGroup';
import type { Task, Category, PriorityLetter } from '../../../types';

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

describe('TaskPriorityGroup', () => {
  describe('Rendering', () => {
    it('should render nothing when tasks array is empty', () => {
      const { container } = render(
        <TaskPriorityGroup priorityLetter="A" tasks={[]} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('should render priority badge with correct letter', () => {
      const tasks = [createMockTask()];
      render(<TaskPriorityGroup priorityLetter="A" tasks={tasks} />);

      const badge = screen.getByTestId('priority-badge');
      expect(badge).toHaveTextContent('A');
    });

    it('should render correct priority label', () => {
      const tasks = [createMockTask()];
      render(<TaskPriorityGroup priorityLetter="A" tasks={tasks} />);

      // Format is "Priority A: Vital"
      expect(screen.getByText(/Priority A: Vital/)).toBeInTheDocument();
    });

    it('should render priority labels for all letters', () => {
      const letters: { letter: PriorityLetter; label: string }[] = [
        { letter: 'A', label: 'Priority A: Vital' },
        { letter: 'B', label: 'Priority B: Important' },
        { letter: 'C', label: 'Priority C: Optional' },
        { letter: 'D', label: 'Priority D: Delegate' },
      ];

      for (const { letter, label } of letters) {
        const { unmount } = render(
          <TaskPriorityGroup
            priorityLetter={letter}
            tasks={[createMockTask({ priority: { letter, number: 1 } })]}
          />
        );
        expect(screen.getByText(label)).toBeInTheDocument();
        unmount();
      }
    });

    it('should render task count for single task', () => {
      const tasks = [createMockTask()];
      render(<TaskPriorityGroup priorityLetter="A" tasks={tasks} />);

      expect(screen.getByText('(1 task)')).toBeInTheDocument();
    });

    it('should render task count for multiple tasks', () => {
      const tasks = [
        createMockTask({ id: '1' }),
        createMockTask({ id: '2' }),
        createMockTask({ id: '3' }),
      ];
      render(<TaskPriorityGroup priorityLetter="A" tasks={tasks} />);

      expect(screen.getByText('(3 tasks)')).toBeInTheDocument();
    });

    it('should render all tasks in the group', () => {
      const tasks = [
        createMockTask({ id: '1', title: 'First Task' }),
        createMockTask({ id: '2', title: 'Second Task' }),
        createMockTask({ id: '3', title: 'Third Task' }),
      ];
      render(<TaskPriorityGroup priorityLetter="A" tasks={tasks} />);

      expect(screen.getByText('First Task')).toBeInTheDocument();
      expect(screen.getByText('Second Task')).toBeInTheDocument();
      expect(screen.getByText('Third Task')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      const tasks = [createMockTask()];
      render(<TaskPriorityGroup priorityLetter="A" tasks={tasks} testId="custom-group" />);

      expect(screen.getByTestId('custom-group')).toBeInTheDocument();
    });

    it('should render with default testId based on priority letter', () => {
      const tasks = [createMockTask()];
      render(<TaskPriorityGroup priorityLetter="B" tasks={tasks} />);

      expect(screen.getByTestId('priority-group-B')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Priority Color Tests
  // =============================================================================

  describe('Priority Colors', () => {
    it('should apply red color classes for priority A', () => {
      const tasks = [createMockTask()];
      render(<TaskPriorityGroup priorityLetter="A" tasks={tasks} />);

      const header = screen.getByTestId('priority-header');
      expect(header).toHaveClass('bg-red-500');
      expect(header).toHaveClass('border-red-500');
    });

    it('should apply orange color classes for priority B', () => {
      const tasks = [createMockTask()];
      render(<TaskPriorityGroup priorityLetter="B" tasks={tasks} />);

      const header = screen.getByTestId('priority-header');
      expect(header).toHaveClass('bg-orange-500');
      expect(header).toHaveClass('border-orange-500');
    });

    it('should apply yellow color classes for priority C', () => {
      const tasks = [createMockTask()];
      render(<TaskPriorityGroup priorityLetter="C" tasks={tasks} />);

      const header = screen.getByTestId('priority-header');
      expect(header).toHaveClass('bg-yellow-500');
      expect(header).toHaveClass('border-yellow-500');
    });

    it('should apply gray color classes for priority D', () => {
      const tasks = [createMockTask()];
      render(<TaskPriorityGroup priorityLetter="D" tasks={tasks} />);

      const header = screen.getByTestId('priority-header');
      expect(header).toHaveClass('bg-gray-500');
      expect(header).toHaveClass('border-gray-500');
    });

    it('should apply correct badge background color for priority A', () => {
      const tasks = [createMockTask()];
      render(<TaskPriorityGroup priorityLetter="A" tasks={tasks} />);

      const badge = screen.getByTestId('priority-badge');
      expect(badge).toHaveStyle({ backgroundColor: '#EF4444' });
    });
  });

  // =============================================================================
  // Category Tests
  // =============================================================================

  describe('Category Colors', () => {
    it('should pass category to TaskItem when provided', () => {
      const category = createMockCategory({ color: '#FF5733' });
      const tasks = [createMockTask({ id: '1', categoryId: 'cat-1' })];
      const categoriesMap = { 'cat-1': category };

      render(
        <TaskPriorityGroup
          priorityLetter="A"
          tasks={tasks}
          categoriesMap={categoriesMap}
        />
      );

      // Category color is now shown as priority label background
      const priorityLabel = screen.getByTestId('priority-label');
      expect(priorityLabel).toHaveStyle({ backgroundColor: '#FF5733' });
    });

    it('should show default color for tasks without category', () => {
      const tasks = [createMockTask({ id: '1', categoryId: null })];

      render(<TaskPriorityGroup priorityLetter="A" tasks={tasks} />);

      // Default gray color on priority label background
      const priorityLabel = screen.getByTestId('priority-label');
      expect(priorityLabel).toHaveStyle({ backgroundColor: '#E5E7EB' });
    });
  });

  // =============================================================================
  // Interaction Tests
  // =============================================================================

  describe('Interactions', () => {
    it('should call onTaskClick when a task is clicked', () => {
      const tasks = [createMockTask({ id: '1', title: 'Clickable Task' })];
      const handleClick = vi.fn();

      render(
        <TaskPriorityGroup
          priorityLetter="A"
          tasks={tasks}
          onTaskClick={handleClick}
        />
      );

      fireEvent.click(screen.getByTestId('task-item-1'));

      expect(handleClick).toHaveBeenCalledWith(tasks[0]);
    });

    it('should call onStatusClick when status symbol is clicked', () => {
      const tasks = [createMockTask({ id: '1' })];
      const handleStatusClick = vi.fn();

      render(
        <TaskPriorityGroup
          priorityLetter="A"
          tasks={tasks}
          onStatusClick={handleStatusClick}
        />
      );

      fireEvent.click(screen.getByTestId('status-symbol'));

      expect(handleStatusClick).toHaveBeenCalledWith(tasks[0]);
    });

    it('should handle multiple task clicks independently', () => {
      const tasks = [
        createMockTask({ id: '1', title: 'First' }),
        createMockTask({ id: '2', title: 'Second' }),
      ];
      const handleClick = vi.fn();

      render(
        <TaskPriorityGroup
          priorityLetter="A"
          tasks={tasks}
          onTaskClick={handleClick}
        />
      );

      fireEvent.click(screen.getByTestId('task-item-1'));
      fireEvent.click(screen.getByTestId('task-item-2'));

      expect(handleClick).toHaveBeenCalledTimes(2);
      expect(handleClick).toHaveBeenNthCalledWith(1, tasks[0]);
      expect(handleClick).toHaveBeenNthCalledWith(2, tasks[1]);
    });

    it('should not error when onTaskClick is not provided', () => {
      const tasks = [createMockTask()];

      render(<TaskPriorityGroup priorityLetter="A" tasks={tasks} />);

      expect(() => {
        fireEvent.click(screen.getByTestId('task-item-task-1'));
      }).not.toThrow();
    });

    it('should not error when onStatusClick is not provided', () => {
      const tasks = [createMockTask()];

      render(<TaskPriorityGroup priorityLetter="A" tasks={tasks} />);

      expect(() => {
        fireEvent.click(screen.getByTestId('status-symbol'));
      }).not.toThrow();
    });
  });

  // =============================================================================
  // Structure Tests
  // =============================================================================

  describe('Structure', () => {
    it('should render header before tasks container', () => {
      const tasks = [createMockTask()];

      render(<TaskPriorityGroup priorityLetter="A" tasks={tasks} />);

      const group = screen.getByTestId('priority-group-A');
      const header = screen.getByTestId('priority-header');
      const tasksContainer = screen.getByTestId('tasks-container');

      expect(group.firstChild).toBe(header);
      expect(group.lastChild).toBe(tasksContainer);
    });

    it('should render tasks container with correct border styling', () => {
      const tasks = [createMockTask()];

      render(<TaskPriorityGroup priorityLetter="A" tasks={tasks} />);

      const container = screen.getByTestId('tasks-container');
      expect(container).toHaveClass('border', 'border-t-0', 'rounded-b-lg');
    });
  });
});
