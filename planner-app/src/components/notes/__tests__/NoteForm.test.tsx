/**
 * NoteForm Component Tests
 *
 * Tests the NoteForm component's rendering, validation, and submission behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteForm } from '../NoteForm';
import type { Note, Category, Task, Event, CreateNoteInput } from '../../../types';

// =============================================================================
// Mock Dependencies
// =============================================================================

// Mock RichTextEditor
vi.mock('../../common/RichTextEditor', () => ({
  RichTextEditor: ({ content, onChange, placeholder, testId }: any) => (
    <div data-testid={testId || 'rich-text-editor'}>
      <textarea
        data-testid="rich-text-editor-textarea"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  ),
}));

// Mock LinkSelector
vi.mock('../LinkSelector', () => ({
  LinkSelector: ({ isOpen, onConfirm, onClose, selectedTaskIds, selectedEventIds, testId }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid={testId || 'link-selector'}>
        <button
          onClick={() => onConfirm(['task-1'], ['event-1'])}
          data-testid="confirm-link-selection"
        >
          Confirm Selection
        </button>
        <button onClick={onClose} data-testid="cancel-link-selection">
          Cancel
        </button>
      </div>
    );
  },
}));

// Use real LinkedItemsDisplay to test actual removal behavior
// (no mock needed - we'll render the actual component)

// =============================================================================
// Test Data
// =============================================================================

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    userId: 'user-1',
    name: 'Work',
    color: '#3b82f6',
    icon: null,
    isDefault: false,
    sortOrder: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'cat-2',
    userId: 'user-1',
    name: 'Personal',
    color: '#10b981',
    icon: null,
    isDefault: false,
    sortOrder: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

const mockTasks: Task[] = [
  {
    id: 'task-1',
    userId: 'user-1',
    title: 'Test Task 1',
    description: '',
    categoryId: null,
    priority: { letter: 'A', number: 1 },
    status: 'in_progress',
    scheduledDate: new Date('2024-01-15'),
    recurrence: null,
    linkedNoteIds: [],
    linkedEventId: null,
    isRecurringInstance: false,
    recurringParentId: null,
    instanceDate: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  },
];

const mockEvents: Event[] = [
  {
    id: 'event-1',
    userId: 'user-1',
    title: 'Test Event 1',
    description: '',
    categoryId: null,
    startTime: new Date('2024-01-15T10:00:00'),
    endTime: new Date('2024-01-15T11:00:00'),
    location: '',
    isConfidential: false,
    alternateTitle: null,
    recurrence: null,
    linkedTaskIds: [],
    linkedNoteIds: [],
    googleCalendarId: null,
    isRecurringInstance: false,
    recurringParentId: null,
    instanceDate: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  },
];

const mockNote: Note = {
  id: 'note-1',
  userId: 'user-1',
  title: 'Test Note',
  content: '<p>Test content</p>',
  date: new Date('2024-01-15'),
  categoryId: 'cat-1',
  linkedTaskIds: ['task-1'],
  linkedEventIds: ['event-1'],
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-10'),
  deletedAt: null,
};

// =============================================================================
// Tests
// =============================================================================

describe('NoteForm', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('renders title input', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      expect(screen.getByTestId('note-title-input')).toBeInTheDocument();
    });

    it('renders content editor (RichTextEditor)', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      expect(screen.getByTestId('note-content-editor')).toBeInTheDocument();
    });

    it('renders category select', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      expect(screen.getByTestId('note-category-select')).toBeInTheDocument();
    });

    it('renders date picker', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      expect(screen.getByTestId('note-date-picker')).toBeInTheDocument();
    });

    it('renders link button', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      expect(screen.getByTestId('open-link-selector-button')).toBeInTheDocument();
    });

    it('renders linked items display', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      expect(screen.getByTestId('note-form-linked-items')).toBeInTheDocument();
    });

    it('create mode: shows empty form with default date', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();
      const defaultDate = new Date('2024-02-01');

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          defaultDate={defaultDate}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      const titleInput = screen.getByTestId('note-title-input') as HTMLInputElement;
      expect(titleInput.value).toBe('');

      expect(screen.getByRole('button', { name: /create note/i })).toBeInTheDocument();
    });

    it('edit mode: pre-populates form with note data', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          note={mockNote}
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      const titleInput = screen.getByTestId('note-title-input') as HTMLInputElement;
      expect(titleInput.value).toBe('Test Note');

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('shows linked items if note has links', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          note={mockNote}
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      expect(screen.getByTestId('task-chip-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('event-chip-event-1')).toBeInTheDocument();
    });

    it('loading state disables form inputs and buttons', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isSubmitting={true}
        />
      );

      // Title input should be disabled
      expect(screen.getByTestId('note-title-input')).toBeDisabled();
      // Date picker should be disabled
      expect(screen.getByTestId('note-date-picker')).toBeDisabled();
      // Buttons should be disabled
      expect(screen.getByTestId('submit-button')).toBeDisabled();
      expect(screen.getByTestId('cancel-button')).toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // Validation Tests
  // ---------------------------------------------------------------------------

  describe('Validation', () => {
    it('title is required - shows error if empty', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('form validation prevents submit with invalid data', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Leave title empty
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('clears validation error when user starts typing', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Submit to trigger validation error
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      // Start typing in title field
      const titleInput = screen.getByTestId('note-title-input');
      await user.type(titleInput, 'N');

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Submission Tests
  // ---------------------------------------------------------------------------

  describe('Submission', () => {
    it('submit with valid data calls onSubmit with form data', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Fill in form
      const titleInput = screen.getByTestId('note-title-input');
      await user.type(titleInput, 'New Note');

      const contentTextarea = screen.getByTestId('rich-text-editor-textarea');
      await user.type(contentTextarea, 'Note content');

      // Submit form
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const submittedData: CreateNoteInput = onSubmit.mock.calls[0][0];
      expect(submittedData.title).toBe('New Note');
      expect(submittedData.content).toBe('Note content');
      expect(submittedData.categoryId).toBeNull();
      expect(submittedData.linkedTaskIds).toEqual([]);
      expect(submittedData.linkedEventIds).toEqual([]);
    });

    it('cancel button calls onCancel', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits note with category', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Fill in title
      const titleInput = screen.getByTestId('note-title-input');
      await user.type(titleInput, 'Categorized Note');

      // Select category (this depends on CategorySelect implementation)
      // For now, we'll just submit and verify the default behavior

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });

    it('submits trimmed title', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      const titleInput = screen.getByTestId('note-title-input');
      await user.type(titleInput, '  Trimmed Title  ');

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      const submittedData: CreateNoteInput = onSubmit.mock.calls[0][0];
      expect(submittedData.title).toBe('Trimmed Title');
    });
  });

  // ---------------------------------------------------------------------------
  // Link Functionality Tests
  // ---------------------------------------------------------------------------

  describe('Link Functionality', () => {
    it('link button opens link selector', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Link selector should not be visible initially
      expect(screen.queryByTestId('note-form-link-selector')).not.toBeInTheDocument();

      // Click link button
      const linkButton = screen.getByTestId('open-link-selector-button');
      await user.click(linkButton);

      // Link selector should now be visible
      expect(screen.getByTestId('note-form-link-selector')).toBeInTheDocument();
    });

    it('adds linked items via link selector', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Open link selector
      const linkButton = screen.getByTestId('open-link-selector-button');
      await user.click(linkButton);

      // Confirm selection (mocked to add task-1 and event-1)
      const confirmButton = screen.getByTestId('confirm-link-selection');
      await user.click(confirmButton);

      // Fill in title
      const titleInput = screen.getByTestId('note-title-input');
      await user.type(titleInput, 'Linked Note');

      // Submit form
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      const submittedData: CreateNoteInput = onSubmit.mock.calls[0][0];
      expect(submittedData.linkedTaskIds).toContain('task-1');
      expect(submittedData.linkedEventIds).toContain('event-1');
    });

    it('removes linked task', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          note={mockNote}
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Verify task is initially linked
      expect(screen.getByTestId('task-chip-task-1')).toBeInTheDocument();

      // Remove task
      const removeButton = screen.getByTestId('remove-task-task-1');
      await user.click(removeButton);

      // Wait for UI update
      await waitFor(() => {
        expect(screen.queryByTestId('task-chip-task-1')).not.toBeInTheDocument();
      });

      // Submit and verify
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      const submittedData: CreateNoteInput = onSubmit.mock.calls[0][0];
      expect(submittedData.linkedTaskIds).not.toContain('task-1');
    });

    it('removes linked event', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <NoteForm
          note={mockNote}
          categories={mockCategories}
          tasks={mockTasks}
          events={mockEvents}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Verify event is initially linked
      expect(screen.getByTestId('event-chip-event-1')).toBeInTheDocument();

      // Remove event
      const removeButton = screen.getByTestId('remove-event-event-1');
      await user.click(removeButton);

      // Wait for UI update
      await waitFor(() => {
        expect(screen.queryByTestId('event-chip-event-1')).not.toBeInTheDocument();
      });

      // Submit and verify
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      const submittedData: CreateNoteInput = onSubmit.mock.calls[0][0];
      expect(submittedData.linkedEventIds).not.toContain('event-1');
    });
  });
});
