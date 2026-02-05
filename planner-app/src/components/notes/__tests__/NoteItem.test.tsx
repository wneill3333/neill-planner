/**
 * NoteItem Component Tests
 *
 * Comprehensive tests for the NoteItem component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoteItem } from '../NoteItem';
import type { Note } from '../../../types';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    userId: 'user-1',
    title: 'Test Note',
    content: 'Test content',
    date: new Date('2024-01-15'),
    categoryId: null,
    linkedTaskIds: [],
    linkedEventIds: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ...overrides,
  };
}

// =============================================================================
// Rendering Tests
// =============================================================================

describe('NoteItem', () => {
  describe('Rendering', () => {
    it('should render note title', () => {
      const note = createMockNote({ title: 'My Important Note' });
      render(<NoteItem note={note} />);

      expect(screen.getByText('My Important Note')).toBeInTheDocument();
    });

    it('should render content preview', () => {
      const note = createMockNote({ content: 'This is the note content' });
      render(<NoteItem note={note} />);

      expect(screen.getByText('This is the note content')).toBeInTheDocument();
    });

    it('should strip HTML from content preview', () => {
      const note = createMockNote({ content: '<p>HTML <strong>content</strong></p>' });
      render(<NoteItem note={note} />);

      expect(screen.getByText('HTML content')).toBeInTheDocument();
      expect(screen.queryByText('<p>')).not.toBeInTheDocument();
    });

    it('should truncate long content to 100 chars', () => {
      const longContent = 'A'.repeat(150);
      const note = createMockNote({ content: longContent });
      render(<NoteItem note={note} />);

      const preview = screen.getByText(/A+\.\.\./);
      expect(preview.textContent?.length).toBeLessThanOrEqual(104); // 100 + '...'
    });

    it('should show "No content" when content is empty', () => {
      const note = createMockNote({ content: '' });
      render(<NoteItem note={note} />);

      expect(screen.getByText('No content')).toBeInTheDocument();
    });

    it('should show link indicator when note has linked tasks', () => {
      const note = createMockNote({ linkedTaskIds: ['task-1'] });
      render(<NoteItem note={note} />);

      expect(screen.getByText('📎')).toBeInTheDocument();
    });

    it('should show link indicator when note has linked events', () => {
      const note = createMockNote({ linkedEventIds: ['event-1'] });
      render(<NoteItem note={note} />);

      expect(screen.getByText('📎')).toBeInTheDocument();
    });

    it('should not show link indicator when no links', () => {
      const note = createMockNote({ linkedTaskIds: [], linkedEventIds: [] });
      render(<NoteItem note={note} />);

      expect(screen.queryByText('📎')).not.toBeInTheDocument();
    });

    it('should apply category color to left border', () => {
      const note = createMockNote();
      const { container } = render(<NoteItem note={note} categoryColor="#FF0000" />);

      const noteElement = container.firstChild as HTMLElement;
      expect(noteElement.style.borderLeftColor).toBe('rgb(255, 0, 0)');
    });

    it('should use default gray border when no category color', () => {
      const note = createMockNote();
      const { container } = render(<NoteItem note={note} />);

      const noteElement = container.firstChild as HTMLElement;
      expect(noteElement.style.borderLeftColor).toBe('rgb(209, 213, 219)');
    });
  });

  // =============================================================================
  // Interaction Tests
  // =============================================================================

  describe('Interaction', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      const note = createMockNote();
      render(<NoteItem note={note} onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledWith(note);
    });

    it('should call onClick when Enter key is pressed', () => {
      const handleClick = vi.fn();
      const note = createMockNote();
      render(<NoteItem note={note} onClick={handleClick} />);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledWith(note);
    });

    it('should call onClick when Space key is pressed', () => {
      const handleClick = vi.fn();
      const note = createMockNote();
      render(<NoteItem note={note} onClick={handleClick} />);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: ' ' });
      expect(handleClick).toHaveBeenCalledWith(note);
    });

    it('should not call onClick when other keys are pressed', () => {
      const handleClick = vi.fn();
      const note = createMockNote();
      render(<NoteItem note={note} onClick={handleClick} />);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'a' });
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not throw when onClick is not provided', () => {
      const note = createMockNote();
      expect(() => {
        render(<NoteItem note={note} />);
        fireEvent.click(screen.getByRole('button'));
      }).not.toThrow();
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('Accessibility', () => {
    it('should have role="button"', () => {
      const note = createMockNote();
      render(<NoteItem note={note} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should be keyboard focusable', () => {
      const note = createMockNote();
      render(<NoteItem note={note} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    it('should have aria-label with note title', () => {
      const note = createMockNote({ title: 'Important Note' });
      render(<NoteItem note={note} />);

      expect(screen.getByLabelText('Note: Important Note')).toBeInTheDocument();
    });

    it('should have descriptive aria-label for link indicator', () => {
      const note = createMockNote({ linkedTaskIds: ['task-1'], linkedEventIds: ['event-1'] });
      render(<NoteItem note={note} />);

      expect(screen.getByLabelText('Has 2 linked items')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Styling Tests
  // =============================================================================

  describe('Styling', () => {
    it('should apply custom className', () => {
      const note = createMockNote();
      const { container } = render(<NoteItem note={note} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should use custom testId', () => {
      const note = createMockNote();
      render(<NoteItem note={note} testId="custom-test-id" />);

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });

    it('should use default testId based on note id', () => {
      const note = createMockNote({ id: 'note-123' });
      render(<NoteItem note={note} />);

      expect(screen.getByTestId('note-item-note-123')).toBeInTheDocument();
    });
  });
});
