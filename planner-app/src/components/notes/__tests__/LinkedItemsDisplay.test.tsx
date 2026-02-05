/**
 * LinkedItemsDisplay Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkedItemsDisplay } from '../LinkedItemsDisplay';

describe('LinkedItemsDisplay', () => {
  describe('Empty State', () => {
    it('should render empty state when no linked items', () => {
      render(
        <LinkedItemsDisplay
          linkedTasks={[]}
          linkedEvents={[]}
        />
      );

      expect(screen.getByText('No linked items')).toBeInTheDocument();
      expect(screen.getByTestId('linked-items-empty')).toHaveClass('text-gray-500', 'italic');
    });

    it('should render empty state when props are undefined', () => {
      render(<LinkedItemsDisplay />);

      expect(screen.getByText('No linked items')).toBeInTheDocument();
    });

    it('should apply custom className to empty state', () => {
      render(
        <LinkedItemsDisplay
          linkedTasks={[]}
          linkedEvents={[]}
          className="my-custom-class"
        />
      );

      expect(screen.getByTestId('linked-items-empty')).toHaveClass('my-custom-class');
    });
  });

  describe('Linked Tasks Display', () => {
    it('should render linked tasks with titles', () => {
      const tasks = [
        { id: 'task-1', title: 'Task One' },
        { id: 'task-2', title: 'Task Two' },
      ];

      render(<LinkedItemsDisplay linkedTasks={tasks} />);

      expect(screen.getByText('Linked Tasks:')).toBeInTheDocument();
      expect(screen.getByText('Task One')).toBeInTheDocument();
      expect(screen.getByText('Task Two')).toBeInTheDocument();
    });

    it('should render task chips with blue styling', () => {
      const tasks = [{ id: 'task-1', title: 'Task One' }];

      render(<LinkedItemsDisplay linkedTasks={tasks} />);

      const chip = screen.getByTestId('task-chip-task-1');
      expect(chip).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('should render remove button for each task when onRemoveTask provided', () => {
      const tasks = [
        { id: 'task-1', title: 'Task One' },
        { id: 'task-2', title: 'Task Two' },
      ];
      const onRemoveTask = vi.fn();

      render(
        <LinkedItemsDisplay
          linkedTasks={tasks}
          onRemoveTask={onRemoveTask}
        />
      );

      expect(screen.getByTestId('remove-task-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('remove-task-task-2')).toBeInTheDocument();
    });

    it('should not render remove button when onRemoveTask not provided', () => {
      const tasks = [{ id: 'task-1', title: 'Task One' }];

      render(<LinkedItemsDisplay linkedTasks={tasks} />);

      expect(screen.queryByTestId('remove-task-task-1')).not.toBeInTheDocument();
    });

    it('should call onRemoveTask when remove button clicked', async () => {
      const user = userEvent.setup();
      const tasks = [{ id: 'task-1', title: 'Task One' }];
      const onRemoveTask = vi.fn();

      render(
        <LinkedItemsDisplay
          linkedTasks={tasks}
          onRemoveTask={onRemoveTask}
        />
      );

      await user.click(screen.getByTestId('remove-task-task-1'));

      expect(onRemoveTask).toHaveBeenCalledWith('task-1');
      expect(onRemoveTask).toHaveBeenCalledTimes(1);
    });

    it('should have proper aria-label on remove button', () => {
      const tasks = [{ id: 'task-1', title: 'Task One' }];
      const onRemoveTask = vi.fn();

      render(
        <LinkedItemsDisplay
          linkedTasks={tasks}
          onRemoveTask={onRemoveTask}
        />
      );

      const button = screen.getByTestId('remove-task-task-1');
      expect(button).toHaveAttribute('aria-label', 'Remove link to Task One');
    });

    it('should truncate long task titles', () => {
      const tasks = [
        { id: 'task-1', title: 'This is a very long task title that should be truncated' },
      ];

      render(<LinkedItemsDisplay linkedTasks={tasks} />);

      const title = screen.getByText('This is a very long task title that should be truncated');
      expect(title).toHaveClass('truncate', 'max-w-[200px]');
    });
  });

  describe('Linked Events Display', () => {
    it('should render linked events with titles', () => {
      const events = [
        { id: 'event-1', title: 'Event One' },
        { id: 'event-2', title: 'Event Two' },
      ];

      render(<LinkedItemsDisplay linkedEvents={events} />);

      expect(screen.getByText('Linked Events:')).toBeInTheDocument();
      expect(screen.getByText('Event One')).toBeInTheDocument();
      expect(screen.getByText('Event Two')).toBeInTheDocument();
    });

    it('should render event chips with purple styling', () => {
      const events = [{ id: 'event-1', title: 'Event One' }];

      render(<LinkedItemsDisplay linkedEvents={events} />);

      const chip = screen.getByTestId('event-chip-event-1');
      expect(chip).toHaveClass('bg-purple-100', 'text-purple-800');
    });

    it('should render remove button for each event when onRemoveEvent provided', () => {
      const events = [
        { id: 'event-1', title: 'Event One' },
        { id: 'event-2', title: 'Event Two' },
      ];
      const onRemoveEvent = vi.fn();

      render(
        <LinkedItemsDisplay
          linkedEvents={events}
          onRemoveEvent={onRemoveEvent}
        />
      );

      expect(screen.getByTestId('remove-event-event-1')).toBeInTheDocument();
      expect(screen.getByTestId('remove-event-event-2')).toBeInTheDocument();
    });

    it('should not render remove button when onRemoveEvent not provided', () => {
      const events = [{ id: 'event-1', title: 'Event One' }];

      render(<LinkedItemsDisplay linkedEvents={events} />);

      expect(screen.queryByTestId('remove-event-event-1')).not.toBeInTheDocument();
    });

    it('should call onRemoveEvent when remove button clicked', async () => {
      const user = userEvent.setup();
      const events = [{ id: 'event-1', title: 'Event One' }];
      const onRemoveEvent = vi.fn();

      render(
        <LinkedItemsDisplay
          linkedEvents={events}
          onRemoveEvent={onRemoveEvent}
        />
      );

      await user.click(screen.getByTestId('remove-event-event-1'));

      expect(onRemoveEvent).toHaveBeenCalledWith('event-1');
      expect(onRemoveEvent).toHaveBeenCalledTimes(1);
    });

    it('should have proper aria-label on remove button', () => {
      const events = [{ id: 'event-1', title: 'Event One' }];
      const onRemoveEvent = vi.fn();

      render(
        <LinkedItemsDisplay
          linkedEvents={events}
          onRemoveEvent={onRemoveEvent}
        />
      );

      const button = screen.getByTestId('remove-event-event-1');
      expect(button).toHaveAttribute('aria-label', 'Remove link to Event One');
    });

    it('should truncate long event titles', () => {
      const events = [
        { id: 'event-1', title: 'This is a very long event title that should be truncated' },
      ];

      render(<LinkedItemsDisplay linkedEvents={events} />);

      const title = screen.getByText('This is a very long event title that should be truncated');
      expect(title).toHaveClass('truncate', 'max-w-[200px]');
    });
  });

  describe('Mixed Display', () => {
    it('should render both tasks and events when provided', () => {
      const tasks = [{ id: 'task-1', title: 'Task One' }];
      const events = [{ id: 'event-1', title: 'Event One' }];

      render(
        <LinkedItemsDisplay
          linkedTasks={tasks}
          linkedEvents={events}
        />
      );

      expect(screen.getByText('Linked Tasks:')).toBeInTheDocument();
      expect(screen.getByText('Linked Events:')).toBeInTheDocument();
      expect(screen.getByText('Task One')).toBeInTheDocument();
      expect(screen.getByText('Event One')).toBeInTheDocument();
    });

    it('should only show tasks section when only tasks provided', () => {
      const tasks = [{ id: 'task-1', title: 'Task One' }];

      render(<LinkedItemsDisplay linkedTasks={tasks} linkedEvents={[]} />);

      expect(screen.getByText('Linked Tasks:')).toBeInTheDocument();
      expect(screen.queryByText('Linked Events:')).not.toBeInTheDocument();
    });

    it('should only show events section when only events provided', () => {
      const events = [{ id: 'event-1', title: 'Event One' }];

      render(<LinkedItemsDisplay linkedTasks={[]} linkedEvents={events} />);

      expect(screen.queryByText('Linked Tasks:')).not.toBeInTheDocument();
      expect(screen.getByText('Linked Events:')).toBeInTheDocument();
    });

    it('should apply custom className when items present', () => {
      const tasks = [{ id: 'task-1', title: 'Task One' }];

      render(
        <LinkedItemsDisplay
          linkedTasks={tasks}
          className="my-custom-class"
        />
      );

      expect(screen.getByTestId('linked-items-display')).toHaveClass('my-custom-class');
    });

    it('should use custom testId when provided', () => {
      const tasks = [{ id: 'task-1', title: 'Task One' }];

      render(
        <LinkedItemsDisplay
          linkedTasks={tasks}
          testId="custom-test-id"
        />
      );

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });
});
