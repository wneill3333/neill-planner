/**
 * NoteList Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NoteList } from '../NoteList';
import type { Note, Category } from '../../../types';

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
    createdAt: new Date(),
    updatedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('NoteList', () => {
  describe('Rendering', () => {
    it('should render list of notes', () => {
      const notes = [
        createMockNote({ id: '1', title: 'Note 1' }),
        createMockNote({ id: '2', title: 'Note 2' }),
      ];
      render(<NoteList notes={notes} categories={[]} />);

      expect(screen.getByText('Note 1')).toBeInTheDocument();
      expect(screen.getByText('Note 2')).toBeInTheDocument();
    });

    it('should show empty state when no notes', () => {
      render(<NoteList notes={[]} categories={[]} />);

      expect(screen.getByText('No notes for this date')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating a new note.')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<NoteList notes={[]} categories={[]} loading={true} />);

      expect(screen.getByText('Loading notes...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should apply category colors to notes', () => {
      const category = createMockCategory({ id: 'cat-1', color: '#FF0000' });
      const note = createMockNote({ categoryId: 'cat-1' });
      const { container } = render(<NoteList notes={[note]} categories={[category]} />);

      const noteElement = container.querySelector('[data-testid="note-item-note-1"]') as HTMLElement;
      expect(noteElement.style.borderLeftColor).toBe('rgb(255, 0, 0)');
    });

    it('should use role="list" for accessibility', () => {
      const notes = [createMockNote()];
      render(<NoteList notes={notes} categories={[]} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call onNoteClick when note is clicked', () => {
      const handleClick = vi.fn();
      const note = createMockNote();
      render(<NoteList notes={[note]} categories={[]} onNoteClick={handleClick} />);

      screen.getByRole('button').click();
      expect(handleClick).toHaveBeenCalledWith(note);
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <NoteList notes={[]} categories={[]} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should use custom testId', () => {
      render(<NoteList notes={[]} categories={[]} testId="custom-test-id" />);

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });
});
