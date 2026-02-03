/**
 * SortableTaskItem Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { SortableTaskItem } from '../SortableTaskItem';
import type { Task } from '../../../types';

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

/**
 * Wrapper component that provides DndContext for testing
 */
function DndWrapper({ children, items }: { children: React.ReactNode; items: string[] }) {
  return (
    <DndContext>
      <SortableContext items={items}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

// =============================================================================
// Tests
// =============================================================================

describe('SortableTaskItem', () => {
  const mockTask = createMockTask();
  const mockOnClick = vi.fn();
  const mockOnStatusClick = vi.fn();
  const mockOnStatusCycleBackward = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with sortable wrapper', () => {
      render(
        <DndWrapper items={['task-1']}>
          <SortableTaskItem
            id="task-1"
            task={mockTask}
            onClick={mockOnClick}
            onStatusClick={mockOnStatusClick}
            onStatusCycleBackward={mockOnStatusCycleBackward}
          />
        </DndWrapper>
      );

      expect(screen.getByTestId('sortable-task-task-1')).toBeInTheDocument();
    });

    it('should render drag handle', () => {
      render(
        <DndWrapper items={['task-1']}>
          <SortableTaskItem
            id="task-1"
            task={mockTask}
            onClick={mockOnClick}
            onStatusClick={mockOnStatusClick}
            onStatusCycleBackward={mockOnStatusCycleBackward}
          />
        </DndWrapper>
      );

      expect(screen.getByTestId('drag-handle-task-1')).toBeInTheDocument();
    });

    it('should render task item content', () => {
      render(
        <DndWrapper items={['task-1']}>
          <SortableTaskItem
            id="task-1"
            task={mockTask}
            onClick={mockOnClick}
            onStatusClick={mockOnStatusClick}
            onStatusCycleBackward={mockOnStatusCycleBackward}
          />
        </DndWrapper>
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should pass through all TaskItem props', () => {
      const task = createMockTask({ title: 'Custom Task', categoryId: 'cat-1' });
      const category = {
        id: 'cat-1',
        userId: 'user-1',
        name: 'Work',
        color: '#FF0000',
        icon: null,
        isDefault: false,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <DndWrapper items={['task-1']}>
          <SortableTaskItem
            id="task-1"
            task={task}
            category={category}
            showCategoryColor={true}
            onClick={mockOnClick}
            onStatusClick={mockOnStatusClick}
            onStatusCycleBackward={mockOnStatusCycleBackward}
          />
        </DndWrapper>
      );

      expect(screen.getByText('Custom Task')).toBeInTheDocument();
      expect(screen.getByTestId('category-color')).toHaveStyle({ backgroundColor: '#FF0000' });
    });
  });

  describe('Visual Feedback', () => {
    it('should have transition classes', () => {
      render(
        <DndWrapper items={['task-1']}>
          <SortableTaskItem
            id="task-1"
            task={mockTask}
            onClick={mockOnClick}
            onStatusClick={mockOnStatusClick}
            onStatusCycleBackward={mockOnStatusCycleBackward}
          />
        </DndWrapper>
      );

      const wrapper = screen.getByTestId('sortable-task-task-1');
      expect(wrapper).toHaveClass('transition-all');
      expect(wrapper).toHaveClass('duration-200');
    });

    it('should have opacity-100 and scale-100 when not dragging', () => {
      render(
        <DndWrapper items={['task-1']}>
          <SortableTaskItem
            id="task-1"
            task={mockTask}
            onClick={mockOnClick}
            onStatusClick={mockOnStatusClick}
            onStatusCycleBackward={mockOnStatusCycleBackward}
          />
        </DndWrapper>
      );

      const wrapper = screen.getByTestId('sortable-task-task-1');
      expect(wrapper).toHaveClass('opacity-100');
      expect(wrapper).toHaveClass('scale-100');
    });

    it('should not show drop indicator when not being hovered', () => {
      render(
        <DndWrapper items={['task-1']}>
          <SortableTaskItem
            id="task-1"
            task={mockTask}
            onClick={mockOnClick}
            onStatusClick={mockOnStatusClick}
            onStatusCycleBackward={mockOnStatusCycleBackward}
          />
        </DndWrapper>
      );

      expect(screen.queryByTestId('drop-indicator-task-1')).not.toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should use flex layout with items-center', () => {
      render(
        <DndWrapper items={['task-1']}>
          <SortableTaskItem
            id="task-1"
            task={mockTask}
            onClick={mockOnClick}
            onStatusClick={mockOnStatusClick}
            onStatusCycleBackward={mockOnStatusCycleBackward}
          />
        </DndWrapper>
      );

      const wrapper = screen.getByTestId('sortable-task-task-1');
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
    });

    it('should have gap between drag handle and task content', () => {
      render(
        <DndWrapper items={['task-1']}>
          <SortableTaskItem
            id="task-1"
            task={mockTask}
            onClick={mockOnClick}
            onStatusClick={mockOnStatusClick}
            onStatusCycleBackward={mockOnStatusCycleBackward}
          />
        </DndWrapper>
      );

      const wrapper = screen.getByTestId('sortable-task-task-1');
      expect(wrapper).toHaveClass('gap-1');
    });

    it('should have relative positioning for drop indicator', () => {
      render(
        <DndWrapper items={['task-1']}>
          <SortableTaskItem
            id="task-1"
            task={mockTask}
            onClick={mockOnClick}
            onStatusClick={mockOnStatusClick}
            onStatusCycleBackward={mockOnStatusCycleBackward}
          />
        </DndWrapper>
      );

      const wrapper = screen.getByTestId('sortable-task-task-1');
      expect(wrapper).toHaveClass('relative');
    });
  });

  describe('Callbacks', () => {
    it('should pass onClick to TaskItem', () => {
      render(
        <DndWrapper items={['task-1']}>
          <SortableTaskItem
            id="task-1"
            task={mockTask}
            onClick={mockOnClick}
            onStatusClick={mockOnStatusClick}
            onStatusCycleBackward={mockOnStatusCycleBackward}
          />
        </DndWrapper>
      );

      const taskItem = screen.getByTestId('task-item-task-1');
      taskItem.click();

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith(mockTask);
    });

    it('should pass onStatusClick to TaskItem', () => {
      render(
        <DndWrapper items={['task-1']}>
          <SortableTaskItem
            id="task-1"
            task={mockTask}
            onClick={mockOnClick}
            onStatusClick={mockOnStatusClick}
            onStatusCycleBackward={mockOnStatusCycleBackward}
          />
        </DndWrapper>
      );

      const statusSymbol = screen.getByTestId('status-symbol');
      statusSymbol.click();

      expect(mockOnStatusClick).toHaveBeenCalledTimes(1);
      expect(mockOnStatusClick).toHaveBeenCalledWith(mockTask);
    });
  });

  describe('Multiple Items', () => {
    it('should render multiple sortable items', () => {
      const task1 = createMockTask({ id: 'task-1', title: 'Task 1' });
      const task2 = createMockTask({ id: 'task-2', title: 'Task 2' });

      render(
        <DndWrapper items={['task-1', 'task-2']}>
          <SortableTaskItem
            id="task-1"
            task={task1}
            onClick={mockOnClick}
            onStatusClick={mockOnStatusClick}
            onStatusCycleBackward={mockOnStatusCycleBackward}
          />
          <SortableTaskItem
            id="task-2"
            task={task2}
            onClick={mockOnClick}
            onStatusClick={mockOnStatusClick}
            onStatusCycleBackward={mockOnStatusCycleBackward}
          />
        </DndWrapper>
      );

      expect(screen.getByTestId('sortable-task-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-task-task-2')).toBeInTheDocument();
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });
  });
});
