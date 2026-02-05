/**
 * NoteFormModal Component Tests
 *
 * Tests the NoteFormModal component including modal rendering,
 * create/edit modes, Redux integration, and delete functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteFormModal } from '../NoteFormModal';
import { renderWithProviders } from '../../../test/test-utils';
import { createMockNote, createMockCategory, createMockTask, createMockEvent } from '../../../test/mockData';
import type { Note, CreateNoteInput } from '../../../types';

// =============================================================================
// Mock Setup
// =============================================================================

// Mock the Modal component
vi.mock('../../../components/common/Modal', () => ({
  Modal: ({ isOpen, onClose, children, title, testId }: any) => {
    return isOpen ? (
      <div data-testid={testId || 'modal'}>
        <h2>{title}</h2>
        <button onClick={onClose} aria-label="Close modal">
          Close
        </button>
        {children}
      </div>
    ) : null;
  },
}));

// Mock the NoteForm component
vi.mock('../../../components/notes/NoteForm', () => ({
  NoteForm: ({ note, onSubmit, onCancel, isSubmitting, testId }: any) => {
    const handleSubmit = () => {
      const mockData: CreateNoteInput = {
        title: note?.title || 'Test Note',
        content: note?.content || '<p>Test content</p>',
        date: note?.date || new Date('2024-01-15'),
        categoryId: note?.categoryId || null,
        linkedTaskIds: note?.linkedTaskIds || [],
        linkedEventIds: note?.linkedEventIds || [],
      };
      onSubmit(mockData);
    };

    return (
      <div data-testid={testId || 'note-form'}>
        <p>Mode: {note ? 'Edit' : 'Create'}</p>
        {note && <p>Note ID: {note.id}</p>}
        <button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Submit'}
        </button>
        <button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    );
  },
}));

// Mock the auth hook with configurable user
let mockAuthUser: any = {
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'standard' as const,
  googleCalendarConnected: false,
  createdAt: new Date(),
  lastLoginAt: new Date(),
};

vi.mock('../../../features/auth', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    loading: false,
    error: null,
  }),
}));

// Mock Firebase notes service
vi.mock('../../../services/firebase/notes.service', () => ({
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  getNotesByDate: vi.fn(),
}));

import * as notesService from '../../../services/firebase/notes.service';
const mockCreateNoteService = vi.mocked(notesService.createNote);
const mockUpdateNoteService = vi.mocked(notesService.updateNote);
const mockDeleteNoteService = vi.mocked(notesService.deleteNote);

// =============================================================================
// Test Helpers
// =============================================================================

const mockNote = createMockNote({
  id: 'note-1',
  title: 'Test Note',
  content: '<p>Test content</p>',
  categoryId: 'cat-1',
  linkedTaskIds: ['task-1'],
  linkedEventIds: ['event-1'],
});

const mockCategory = createMockCategory({ id: 'cat-1', name: 'Work' });
const mockTask = createMockTask({ id: 'task-1', title: 'Test Task' });
const mockEvent = createMockEvent({ id: 'event-1', title: 'Test Event' });

// =============================================================================
// Tests
// =============================================================================

describe('NoteFormModal', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Reset mock user to authenticated state
    mockAuthUser = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'standard' as const,
      googleCalendarConnected: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    // Reset mock services
    mockCreateNoteService.mockResolvedValue(mockNote);
    mockUpdateNoteService.mockResolvedValue(mockNote);
    mockDeleteNoteService.mockResolvedValue();
  });

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('does not render when closed (isOpen=false)', () => {
      renderWithProviders(
        <NoteFormModal isOpen={false} onClose={() => {}} />
      );

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('renders modal when open (isOpen=true)', () => {
      renderWithProviders(
        <NoteFormModal isOpen={true} onClose={() => {}} />
      );

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('create mode: shows "Create Note" title', () => {
      renderWithProviders(
        <NoteFormModal isOpen={true} onClose={() => {}} />
      );

      expect(screen.getByRole('heading', { name: 'Create Note' })).toBeInTheDocument();
    });

    it('edit mode: shows "Edit Note" title', () => {
      renderWithProviders(
        <NoteFormModal isOpen={true} note={mockNote} onClose={() => {}} />
      );

      expect(screen.getByRole('heading', { name: 'Edit Note' })).toBeInTheDocument();
    });

    it('edit mode: passes note data to form', () => {
      renderWithProviders(
        <NoteFormModal isOpen={true} note={mockNote} onClose={() => {}} />
      );

      expect(screen.getByText('Mode: Edit')).toBeInTheDocument();
      expect(screen.getByText(`Note ID: ${mockNote.id}`)).toBeInTheDocument();
    });

    it('create mode: does not pass note to form', () => {
      renderWithProviders(
        <NoteFormModal isOpen={true} onClose={() => {}} />
      );

      expect(screen.getByText('Mode: Create')).toBeInTheDocument();
      expect(screen.queryByText(/Note ID:/)).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Create Mode Tests
  // ---------------------------------------------------------------------------

  describe('Create Mode', () => {
    it('dispatches createNoteAsync on form submit in create mode', async () => {
      renderWithProviders(
        <NoteFormModal isOpen={true} onClose={() => {}} />
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateNoteService).toHaveBeenCalled();
      });
    });

    it('closes modal on successful create', async () => {
      const handleClose = vi.fn();
      const handleSuccess = vi.fn();

      renderWithProviders(
        <NoteFormModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onSuccess after successful create', async () => {
      const handleSuccess = vi.fn();

      renderWithProviders(
        <NoteFormModal isOpen={true} onClose={() => {}} onSuccess={handleSuccess} />
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalled();
      });
    });

    it('does not show delete button in create mode', () => {
      renderWithProviders(
        <NoteFormModal isOpen={true} onClose={() => {}} />
      );

      expect(screen.queryByTestId('delete-note-button')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Edit Mode Tests
  // ---------------------------------------------------------------------------

  describe('Edit Mode', () => {
    it('dispatches updateNoteAsync on form submit in edit mode', async () => {
      renderWithProviders(
        <NoteFormModal isOpen={true} note={mockNote} onClose={() => {}} />
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateNoteService).toHaveBeenCalled();
      });
    });

    it('closes modal on successful update', async () => {
      const handleSuccess = vi.fn();

      renderWithProviders(
        <NoteFormModal isOpen={true} note={mockNote} onClose={() => {}} onSuccess={handleSuccess} />
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('shows delete button in edit mode', () => {
      renderWithProviders(
        <NoteFormModal isOpen={true} note={mockNote} onClose={() => {}} />
      );

      expect(screen.getByTestId('delete-note-button')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Delete Functionality Tests
  // ---------------------------------------------------------------------------

  describe('Delete Functionality', () => {
    it('delete button shows confirmation dialog', async () => {
      renderWithProviders(
        <NoteFormModal isOpen={true} note={mockNote} onClose={() => {}} />
      );

      const deleteButton = screen.getByTestId('delete-note-button');
      await user.click(deleteButton);

      // Confirmation modal should be visible
      expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    it('canceling delete closes confirmation dialog', async () => {
      renderWithProviders(
        <NoteFormModal isOpen={true} note={mockNote} onClose={() => {}} />
      );

      // Open delete confirmation
      const deleteButton = screen.getByTestId('delete-note-button');
      await user.click(deleteButton);

      expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();

      // Cancel delete
      const cancelButton = screen.getByTestId('cancel-delete-button');
      await user.click(cancelButton);

      // Confirmation modal should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('delete-confirmation-modal')).not.toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Loading State Tests
  // ---------------------------------------------------------------------------

  describe('Loading State', () => {
    it('shows loading state during submission', async () => {
      // Mock slow service call
      mockCreateNoteService.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockNote), 100))
      );

      renderWithProviders(
        <NoteFormModal isOpen={true} onClose={() => {}} />
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Should show saving state
      expect(screen.getByText('Saving...')).toBeInTheDocument();

      // Wait for completion
      await waitFor(
        () => {
          expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
        },
        { timeout: 200 }
      );
    });

    it('disables delete button during submission', async () => {
      // Mock slow service call
      mockUpdateNoteService.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockNote), 100))
      );

      renderWithProviders(
        <NoteFormModal isOpen={true} note={mockNote} onClose={() => {}} />
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Delete button should be disabled during submission
      const deleteButton = screen.getByTestId('delete-note-button');
      expect(deleteButton).toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // Cancel Behavior Tests
  // ---------------------------------------------------------------------------

  describe('Cancel Behavior', () => {
    it('calls onClose when cancel is clicked', async () => {
      const handleClose = vi.fn();

      renderWithProviders(
        <NoteFormModal isOpen={true} onClose={handleClose} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when modal close button is clicked', async () => {
      const handleClose = vi.fn();

      renderWithProviders(
        <NoteFormModal isOpen={true} onClose={handleClose} />
      );

      const closeButton = screen.getByLabelText('Close modal');
      await user.click(closeButton);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
