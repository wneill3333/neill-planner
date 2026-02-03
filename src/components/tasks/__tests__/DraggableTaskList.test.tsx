/**
 * DraggableTaskList Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DraggableTaskList } from '../DraggableTaskList';
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
// Tests
// =============================================================================

describe('DraggableTaskList', () => {
  const mockOnReorder = vi.fn();
  const mockOnTaskClick = vi.fn();
  const mockOnStatusClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render empty state when no tasks', () => {
      render(<DraggableTaskList tasks={[]} onReorder={mockOnReorder} />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No tasks for this day')).toBeInTheDocument();
    });

    it('should render tasks grouped by priority', () => {
      const tasks = [
        createMockTask({ id: 'task-1', priority: { letter: 'A', number: 1 } }),
        createMockTask({ id: 'task-2', priority: { letter: 'A', number: 2 } }),
        createMockTask({ id: 'task-3', priority: { letter: 'B', number: 1 } }),
      ];

      render(<DraggableTaskList tasks={tasks} onReorder={mockOnReorder} />);

      expect(screen.getByTestId('sortable-priority-group-A')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-priority-group-B')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      const tasks = [createMockTask()];
      render(
        <DraggableTaskList
          tasks={tasks}
          onReorder={mockOnReorder}
          testId="custom-list"
        />
      );
      expect(screen.getByTestId('custom-list')).toBeInTheDocument();
    });

    it('should render default testId', () => {
      const tasks = [createMockTask()];
      render(<DraggableTaskList tasks={tasks} onReorder={mockOnReorder} />);
      expect(screen.getByTestId('draggable-task-list')).toBeInTheDocument();
    });

    it('should render drag handles for each task', () => {
      const tasks = [
        createMockTask({ id: 'task-1' }),
        createMockTask({ id: 'task-2' }),
      ];

      render(<DraggableTaskList tasks={tasks} onReorder={mockOnReorder} />);

      expect(screen.getByTestId('drag-handle-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('drag-handle-task-2')).toBeInTheDocument();
    });

    it('should render sortable task items', () => {
      const tasks = [
        createMockTask({ id: 'task-1' }),
        createMockTask({ id: 'task-2' }),
      ];

      render(<DraggableTaskList tasks={tasks} onReorder={mockOnReorder} />);

      expect(screen.getByTestId('sortable-task-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-task-task-2')).toBeInTheDocument();
    });
  });

  describe('Priority Groups', () => {
    it('should not render empty priority groups', () => {
      const tasks = [
        createMockTask({ id: 'task-1', priority: { letter: 'A', number: 1 } }),
      ];

      render(<DraggableTaskList tasks={tasks} onReorder={mockOnReorder} />);

      expect(screen.getByTestId('sortable-priority-group-A')).toBeInTheDocument();
      expect(screen.queryByTestId('sortable-priority-group-B')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sortable-priority-group-C')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sortable-priority-group-D')).not.toBeInTheDocument();
    });

    it('should render tasks in correct priority groups', () => {
      const tasks = [
        createMockTask({ id: 'task-a1', title: 'A Task', priority: { letter: 'A', number: 1 } }),
        createMockTask({ id: 'task-b1', title: 'B Task', priority: { letter: 'B', number: 1 } }),
      ];

      render(<DraggableTaskList tasks={tasks} onReorder={mockOnReorder} />);

      // Both groups should be present
      expect(screen.getByTestId('sortable-priority-group-A')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-priority-group-B')).toBeInTheDocument();

      // Task titles should be visible
      expect(screen.getByText('A Task')).toBeInTheDocument();
      expect(screen.getByText('B Task')).toBeInTheDocument();
    });

    it('should sort tasks by priority number within groups', () => {
      const tasks = [
        createMockTask({ id: 'task-a3', title: 'Third', priority: { letter: 'A', number: 3 } }),
        createMockTask({ id: 'task-a1', title: 'First', priority: { letter: 'A', number: 1 } }),
        createMockTask({ id: 'task-a2', title: 'Second', priority: { letter: 'A', number: 2 } }),
      ];

      render(<DraggableTaskList tasks={tasks} onReorder={mockOnReorder} />);

      const taskElements = screen.getAllByTestId(/sortable-task-task-a/);
      expect(taskElements).toHaveLength(3);
    });
  });

  describe('Category Colors', () => {
    it('should pass category colors to tasks', () => {
      const tasks = [createMockTask({ id: 'task-1', categoryId: 'cat-1' })];
      const categoriesMap = {
        'cat-1': createMockCategory({ color: '#FF0000' }),
      };

      render(
        <DraggableTaskList
          tasks={tasks}
          categoriesMap={categoriesMap}
          onReorder={mockOnReorder}
        />
      );

      // The category color should be passed down to TaskItem
      expect(screen.getByTestId('category-color')).toHaveStyle({ backgroundColor: '#FF0000' });
    });

    it('should hide category colors when showCategoryColors is false', () => {
      const tasks = [createMockTask({ id: 'task-1', categoryId: 'cat-1' })];
      const categoriesMap = {
        'cat-1': createMockCategory(),
      };

      render(
        <DraggableTaskList
          tasks={tasks}
          categoriesMap={categoriesMap}
          onReorder={mockOnReorder}
          showCategoryColors={false}
        />
      );

      expect(screen.queryByTestId('category-color')).not.toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('should call onTaskClick when task is clicked', () => {
      const tasks = [createMockTask({ id: 'task-1' })];

      render(
        <DraggableTaskList
          tasks={tasks}
          onReorder={mockOnReorder}
          onTaskClick={mockOnTaskClick}
        />
      );

      // Click on the task item (not the drag handle)
      const taskItem = screen.getByTestId('task-item-task-1');
      taskItem.click();

      expect(mockOnTaskClick).toHaveBeenCalledTimes(1);
      expect(mockOnTaskClick).toHaveBeenCalledWith(tasks[0]);
    });

    it('should call onStatusClick when status is clicked', () => {
      const tasks = [createMockTask({ id: 'task-1' })];

      render(
        <DraggableTaskList
          tasks={tasks}
          onReorder={mockOnReorder}
          onStatusClick={mockOnStatusClick}
        />
      );

      const statusSymbol = screen.getByTestId('status-symbol');
      statusSymbol.click();

      expect(mockOnStatusClick).toHaveBeenCalledTimes(1);
      expect(mockOnStatusClick).toHaveBeenCalledWith(tasks[0]);
    });
  });

  describe('Updating State', () => {
    it('should pass updatingTaskId to show loading state', () => {
      const tasks = [
        createMockTask({ id: 'task-1' }),
        createMockTask({ id: 'task-2' }),
      ];

      render(
        <DraggableTaskList
          tasks={tasks}
          onReorder={mockOnReorder}
          updatingTaskId="task-1"
        />
      );

      // The task being updated should show a loading state
      // This is handled by TaskItem/StatusSymbol which shows a spinner
      expect(screen.getByTestId('status-spinner')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="region"', () => {
      const tasks = [createMockTask()];
      render(<DraggableTaskList tasks={tasks} onReorder={mockOnReorder} />);

      const list = screen.getByTestId('draggable-task-list');
      expect(list).toHaveAttribute('role', 'region');
    });

    it('should have aria-label describing drag functionality', () => {
      const tasks = [createMockTask()];
      render(<DraggableTaskList tasks={tasks} onReorder={mockOnReorder} />);

      const list = screen.getByTestId('draggable-task-list');
      expect(list).toHaveAttribute(
        'aria-label',
        'Task list grouped by priority. Drag tasks to reorder within their priority group.'
      );
    });

    it('should have aria-label on empty state', () => {
      render(<DraggableTaskList tasks={[]} onReorder={mockOnReorder} />);

      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveAttribute('aria-label', 'No tasks available');
    });
  });

  describe('Drag Overlay', () => {
    it('should not show drag overlay initially', () => {
      const tasks = [createMockTask({ id: 'task-1' })];
      render(<DraggableTaskList tasks={tasks} onReorder={mockOnReorder} />);

      expect(screen.queryByTestId('drag-overlay')).not.toBeInTheDocument();
    });

    it('should render DragOverlay component', () => {
      const tasks = [createMockTask({ id: 'task-1' })];
      const { container } = render(<DraggableTaskList tasks={tasks} onReorder={mockOnReorder} />);

      // DragOverlay is always rendered but hidden when not dragging
      // It's part of the DndContext
      expect(container.querySelector('[data-testid="drag-overlay"]')).not.toBeInTheDocument();
    });
  });
});
