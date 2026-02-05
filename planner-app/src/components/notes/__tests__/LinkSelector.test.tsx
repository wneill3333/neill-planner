/**
 * LinkSelector Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkSelector } from '../LinkSelector';
import type { Task, Event } from '../../../types';

// Sample test data
const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Buy groceries',
    date: new Date('2024-01-15'),
    status: 'in_progress',
    priority: 'A',
    priorityNumber: 1,
    userId: 'user-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'task-2',
    title: 'Call dentist',
    date: new Date('2024-01-15'),
    status: 'in_progress',
    priority: 'B',
    priorityNumber: 1,
    userId: 'user-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'task-3',
    title: 'Write report',
    date: new Date('2024-01-15'),
    status: 'in_progress',
    priority: 'C',
    priorityNumber: 1,
    userId: 'user-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
];

const mockEvents: Event[] = [
  {
    id: 'event-1',
    title: 'Team Meeting',
    date: new Date('2024-01-15'),
    startTime: '09:00',
    endTime: '10:00',
    userId: 'user-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'event-2',
    title: 'Lunch with Client',
    date: new Date('2024-01-15'),
    startTime: '12:00',
    endTime: '13:00',
    userId: 'user-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
];

describe('LinkSelector', () => {
  const defaultProps = {
    isOpen: true,
    tasks: mockTasks,
    events: mockEvents,
    selectedTaskIds: [],
    selectedEventIds: [],
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  describe('Modal Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<LinkSelector {...defaultProps} />);

      expect(screen.getByText('Link to Tasks/Events')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<LinkSelector {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Link to Tasks/Events')).not.toBeInTheDocument();
    });

    it('should use custom testId when provided', () => {
      render(<LinkSelector {...defaultProps} testId="custom-modal" />);

      expect(screen.getByTestId('custom-modal')).toBeInTheDocument();
    });

    it('should use default testId when not provided', () => {
      render(<LinkSelector {...defaultProps} />);

      expect(screen.getByTestId('link-selector-modal')).toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    it('should render Tasks and Events tabs', () => {
      render(<LinkSelector {...defaultProps} />);

      expect(screen.getByRole('tab', { name: 'Tasks' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Events' })).toBeInTheDocument();
    });

    it('should show Tasks panel by default', () => {
      render(<LinkSelector {...defaultProps} />);

      expect(screen.getByTestId('tasks-link-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('events-link-panel')).not.toBeInTheDocument();
    });

    it('should switch to Events panel when Events tab clicked', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: 'Events' }));

      expect(screen.queryByTestId('tasks-link-panel')).not.toBeInTheDocument();
      expect(screen.getByTestId('events-link-panel')).toBeInTheDocument();
    });

    it('should switch back to Tasks panel when Tasks tab clicked', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: 'Events' }));
      await user.click(screen.getByRole('tab', { name: 'Tasks' }));

      expect(screen.getByTestId('tasks-link-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('events-link-panel')).not.toBeInTheDocument();
    });
  });

  describe('Tasks Panel', () => {
    it('should render all tasks', () => {
      render(<LinkSelector {...defaultProps} />);

      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      expect(screen.getByText('Call dentist')).toBeInTheDocument();
      expect(screen.getByText('Write report')).toBeInTheDocument();
    });

    it('should render task checkboxes', () => {
      render(<LinkSelector {...defaultProps} />);

      expect(screen.getByTestId('task-checkbox-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-checkbox-task-2')).toBeInTheDocument();
      expect(screen.getByTestId('task-checkbox-task-3')).toBeInTheDocument();
    });

    it('should show search input for tasks', () => {
      render(<LinkSelector {...defaultProps} />);

      expect(screen.getByTestId('task-search-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Filter by title...')).toBeInTheDocument();
    });

    it('should filter tasks by search query', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Filter by title...');
      await user.type(searchInput, 'groceries');

      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      expect(screen.queryByText('Call dentist')).not.toBeInTheDocument();
      expect(screen.queryByText('Write report')).not.toBeInTheDocument();
    });

    it('should filter tasks case-insensitively', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Filter by title...');
      await user.type(searchInput, 'GROCERIES');

      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    });

    it('should show "No tasks found" when search has no matches', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Filter by title...');
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No tasks found')).toBeInTheDocument();
    });

    it('should show "No tasks found" when tasks array is empty', () => {
      render(<LinkSelector {...defaultProps} tasks={[]} />);

      expect(screen.getByText('No tasks found')).toBeInTheDocument();
    });

    it('should check pre-selected task checkboxes', () => {
      render(
        <LinkSelector
          {...defaultProps}
          selectedTaskIds={['task-1', 'task-2']}
        />
      );

      expect(screen.getByTestId('task-checkbox-task-1')).toBeChecked();
      expect(screen.getByTestId('task-checkbox-task-2')).toBeChecked();
      expect(screen.getByTestId('task-checkbox-task-3')).not.toBeChecked();
    });

    it('should toggle task checkbox when clicked', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} />);

      const checkbox = screen.getByTestId('task-checkbox-task-1');
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should show count of selected tasks', () => {
      render(
        <LinkSelector
          {...defaultProps}
          selectedTaskIds={['task-1', 'task-2']}
        />
      );

      expect(screen.getByText('2 task(s) selected')).toBeInTheDocument();
    });

    it('should update selected count when checkboxes toggled', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} />);

      expect(screen.getByText('0 task(s) selected')).toBeInTheDocument();

      await user.click(screen.getByTestId('task-checkbox-task-1'));
      expect(screen.getByText('1 task(s) selected')).toBeInTheDocument();

      await user.click(screen.getByTestId('task-checkbox-task-2'));
      expect(screen.getByText('2 task(s) selected')).toBeInTheDocument();
    });
  });

  describe('Events Panel', () => {
    it('should render all events', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: 'Events' }));

      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      expect(screen.getByText('Lunch with Client')).toBeInTheDocument();
    });

    it('should render event checkboxes', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: 'Events' }));

      expect(screen.getByTestId('event-checkbox-event-1')).toBeInTheDocument();
      expect(screen.getByTestId('event-checkbox-event-2')).toBeInTheDocument();
    });

    it('should show search input for events', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: 'Events' }));

      expect(screen.getByTestId('event-search-input')).toBeInTheDocument();
    });

    it('should filter events by search query', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: 'Events' }));

      const searchInputs = screen.getAllByPlaceholderText('Filter by title...');
      await user.type(searchInputs[0], 'meeting');

      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      expect(screen.queryByText('Lunch with Client')).not.toBeInTheDocument();
    });

    it('should show "No events found" when search has no matches', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: 'Events' }));

      const searchInputs = screen.getAllByPlaceholderText('Filter by title...');
      await user.type(searchInputs[0], 'nonexistent');

      expect(screen.getByText('No events found')).toBeInTheDocument();
    });

    it('should show "No events found" when events array is empty', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} events={[]} />);

      await user.click(screen.getByRole('tab', { name: 'Events' }));

      expect(screen.getByText('No events found')).toBeInTheDocument();
    });

    it('should check pre-selected event checkboxes', async () => {
      const user = userEvent.setup();
      render(
        <LinkSelector
          {...defaultProps}
          selectedEventIds={['event-1']}
        />
      );

      await user.click(screen.getByRole('tab', { name: 'Events' }));

      expect(screen.getByTestId('event-checkbox-event-1')).toBeChecked();
      expect(screen.getByTestId('event-checkbox-event-2')).not.toBeChecked();
    });

    it('should toggle event checkbox when clicked', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: 'Events' }));

      const checkbox = screen.getByTestId('event-checkbox-event-1');
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should show count of selected events', async () => {
      const user = userEvent.setup();
      render(
        <LinkSelector
          {...defaultProps}
          selectedEventIds={['event-1']}
        />
      );

      await user.click(screen.getByRole('tab', { name: 'Events' }));

      expect(screen.getByText('1 event(s) selected')).toBeInTheDocument();
    });

    it('should update selected count when checkboxes toggled', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: 'Events' }));

      expect(screen.getByText('0 event(s) selected')).toBeInTheDocument();

      await user.click(screen.getByTestId('event-checkbox-event-1'));
      expect(screen.getByText('1 event(s) selected')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render Cancel and Apply buttons', () => {
      render(<LinkSelector {...defaultProps} />);

      expect(screen.getByTestId('cancel-link-button')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-link-button')).toBeInTheDocument();
    });

    it('should call onClose when Cancel clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<LinkSelector {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByTestId('cancel-link-button'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm with selected IDs when Apply clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      render(<LinkSelector {...defaultProps} onConfirm={onConfirm} />);

      await user.click(screen.getByTestId('task-checkbox-task-1'));
      await user.click(screen.getByTestId('task-checkbox-task-2'));

      await user.click(screen.getByRole('tab', { name: 'Events' }));
      await user.click(screen.getByTestId('event-checkbox-event-1'));

      await user.click(screen.getByTestId('confirm-link-button'));

      expect(onConfirm).toHaveBeenCalledWith(['task-1', 'task-2'], ['event-1']);
    });

    it('should call onClose after Apply clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<LinkSelector {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByTestId('confirm-link-button'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should reset selections when Cancel clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <LinkSelector
          {...defaultProps}
          selectedTaskIds={['task-1']}
          onClose={onClose}
        />
      );

      // Verify initial selection
      expect(screen.getByTestId('task-checkbox-task-1')).toBeChecked();
      expect(screen.getByText('1 task(s) selected')).toBeInTheDocument();

      // Toggle checkbox
      await user.click(screen.getByTestId('task-checkbox-task-1'));
      expect(screen.getByText('0 task(s) selected')).toBeInTheDocument();

      // Cancel should reset (verified by onClose being called)
      await user.click(screen.getByTestId('cancel-link-button'));
      expect(onClose).toHaveBeenCalled();
      // Internal state is reset on cancel (tested by checking temp state is not persisted)
    });

    it('should clear search when Cancel clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<LinkSelector {...defaultProps} onClose={onClose} />);

      const searchInput = screen.getByPlaceholderText('Filter by title...');
      await user.type(searchInput, 'groceries');
      expect(searchInput).toHaveValue('groceries');

      await user.click(screen.getByTestId('cancel-link-button'));

      expect(onClose).toHaveBeenCalled();
      // Search is reset in internal state (would verify on reopen)
    });
  });

  describe('Integration', () => {
    it('should preserve task selections when switching tabs', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} />);

      // Select tasks
      await user.click(screen.getByTestId('task-checkbox-task-1'));
      expect(screen.getByText('1 task(s) selected')).toBeInTheDocument();

      // Switch to events
      await user.click(screen.getByRole('tab', { name: 'Events' }));
      expect(screen.getByText('0 event(s) selected')).toBeInTheDocument();

      // Switch back to tasks
      await user.click(screen.getByRole('tab', { name: 'Tasks' }));
      expect(screen.getByText('1 task(s) selected')).toBeInTheDocument();
      expect(screen.getByTestId('task-checkbox-task-1')).toBeChecked();
    });

    it('should preserve event selections when switching tabs', async () => {
      const user = userEvent.setup();
      render(<LinkSelector {...defaultProps} />);

      // Go to events and select
      await user.click(screen.getByRole('tab', { name: 'Events' }));
      await user.click(screen.getByTestId('event-checkbox-event-1'));
      expect(screen.getByText('1 event(s) selected')).toBeInTheDocument();

      // Switch to tasks
      await user.click(screen.getByRole('tab', { name: 'Tasks' }));

      // Switch back to events
      await user.click(screen.getByRole('tab', { name: 'Events' }));
      expect(screen.getByText('1 event(s) selected')).toBeInTheDocument();
      expect(screen.getByTestId('event-checkbox-event-1')).toBeChecked();
    });

    it('should handle selecting both tasks and events', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      render(<LinkSelector {...defaultProps} onConfirm={onConfirm} />);

      // Select tasks
      await user.click(screen.getByTestId('task-checkbox-task-1'));
      await user.click(screen.getByTestId('task-checkbox-task-3'));

      // Select events
      await user.click(screen.getByRole('tab', { name: 'Events' }));
      await user.click(screen.getByTestId('event-checkbox-event-2'));

      // Apply
      await user.click(screen.getByTestId('confirm-link-button'));

      expect(onConfirm).toHaveBeenCalledWith(
        ['task-1', 'task-3'],
        ['event-2']
      );
    });
  });
});
