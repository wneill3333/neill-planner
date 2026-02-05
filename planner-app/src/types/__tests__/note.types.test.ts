import { describe, it, expect } from 'vitest';
import { DEFAULT_NOTE_VALUES } from '../note.types';
import type { Note, CreateNoteInput, UpdateNoteInput, NotesByDate } from '../note.types';

describe('Note Types', () => {
  // ===========================================================================
  // Note Interface Tests
  // ===========================================================================
  describe('Note', () => {
    const createValidNote = (): Note => ({
      id: 'note-123',
      userId: 'user-456',
      title: 'Meeting Notes',
      content: '<p>Discussion points from the meeting...</p>',
      date: new Date('2026-01-25'),
      categoryId: 'category-789',
      linkedTaskIds: ['task-1', 'task-2'],
      linkedEventIds: ['event-1'],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    it('should create a valid note with all required fields', () => {
      const note = createValidNote();
      expect(note.id).toBe('note-123');
      expect(note.userId).toBe('user-456');
      expect(note.title).toBe('Meeting Notes');
      expect(note.content).toContain('Discussion points');
      expect(note.date).toBeInstanceOf(Date);
    });

    it('should support rich text content (HTML)', () => {
      const note: Note = {
        ...createValidNote(),
        content:
          '<h1>Title</h1><p>Paragraph with <strong>bold</strong> text.</p><ul><li>Item 1</li></ul>',
      };
      expect(note.content).toContain('<h1>');
      expect(note.content).toContain('<strong>');
      expect(note.content).toContain('<ul>');
    });

    it('should support Markdown content', () => {
      const note: Note = {
        ...createValidNote(),
        content: '# Title\n\nParagraph with **bold** text.\n\n- Item 1\n- Item 2',
      };
      expect(note.content).toContain('# Title');
      expect(note.content).toContain('**bold**');
    });

    it('should allow null categoryId', () => {
      const note: Note = {
        ...createValidNote(),
        categoryId: null,
      };
      expect(note.categoryId).toBeNull();
    });

    it('should support linked tasks', () => {
      const note = createValidNote();
      expect(note.linkedTaskIds).toHaveLength(2);
      expect(note.linkedTaskIds).toContain('task-1');
    });

    it('should support linked events', () => {
      const note = createValidNote();
      expect(note.linkedEventIds).toHaveLength(1);
      expect(note.linkedEventIds).toContain('event-1');
    });

    it('should allow empty linked arrays', () => {
      const note: Note = {
        ...createValidNote(),
        linkedTaskIds: [],
        linkedEventIds: [],
      };
      expect(note.linkedTaskIds).toEqual([]);
      expect(note.linkedEventIds).toEqual([]);
    });

    it('should support soft delete', () => {
      const deletedAt = new Date();
      const note: Note = {
        ...createValidNote(),
        deletedAt,
      };
      expect(note.deletedAt).toEqual(deletedAt);
    });

    it('should have timestamp fields', () => {
      const note = createValidNote();
      expect(note.createdAt).toBeInstanceOf(Date);
      expect(note.updatedAt).toBeInstanceOf(Date);
    });
  });

  // ===========================================================================
  // Input Types Tests
  // ===========================================================================
  describe('CreateNoteInput', () => {
    it('should require title and date', () => {
      const input: CreateNoteInput = {
        title: 'New Note',
        date: new Date('2026-01-25'),
      };
      expect(input.title).toBe('New Note');
      expect(input.date).toBeInstanceOf(Date);
    });

    it('should allow optional content', () => {
      const input: CreateNoteInput = {
        title: 'New Note',
        date: new Date('2026-01-25'),
        content: 'Initial content',
      };
      expect(input.content).toBe('Initial content');
    });

    it('should allow optional categoryId', () => {
      const input: CreateNoteInput = {
        title: 'New Note',
        date: new Date('2026-01-25'),
        categoryId: 'cat-123',
      };
      expect(input.categoryId).toBe('cat-123');
    });

    it('should allow optional linked IDs', () => {
      const input: CreateNoteInput = {
        title: 'New Note',
        date: new Date('2026-01-25'),
        linkedTaskIds: ['task-1'],
        linkedEventIds: ['event-1'],
      };
      expect(input.linkedTaskIds).toEqual(['task-1']);
      expect(input.linkedEventIds).toEqual(['event-1']);
    });
  });

  describe('UpdateNoteInput', () => {
    it('should require only id', () => {
      const input: UpdateNoteInput = {
        id: 'note-123',
      };
      expect(input.id).toBe('note-123');
    });

    it('should allow partial updates', () => {
      const input: UpdateNoteInput = {
        id: 'note-123',
        title: 'Updated Title',
      };
      expect(input.title).toBe('Updated Title');
      expect(input.content).toBeUndefined();
    });

    it('should allow updating content', () => {
      const input: UpdateNoteInput = {
        id: 'note-123',
        content: 'Updated content with more details',
      };
      expect(input.content).toBe('Updated content with more details');
    });

    it('should allow updating date', () => {
      const input: UpdateNoteInput = {
        id: 'note-123',
        date: new Date('2026-01-26'),
      };
      expect(input.date).toBeInstanceOf(Date);
    });

    it('should allow updating linked IDs', () => {
      const input: UpdateNoteInput = {
        id: 'note-123',
        linkedTaskIds: ['task-1', 'task-2', 'task-3'],
        linkedEventIds: [],
      };
      expect(input.linkedTaskIds).toHaveLength(3);
      expect(input.linkedEventIds).toHaveLength(0);
    });

    it('should allow setting categoryId to null', () => {
      const input: UpdateNoteInput = {
        id: 'note-123',
        categoryId: null,
      };
      expect(input.categoryId).toBeNull();
    });
  });

  // ===========================================================================
  // Utility Types Tests
  // ===========================================================================
  describe('NotesByDate', () => {
    it('should organize notes by ISO date string', () => {
      const notesByDate: NotesByDate = {
        '2026-01-25': [],
        '2026-01-26': [],
        '2026-01-27': [],
      };
      expect(Object.keys(notesByDate)).toHaveLength(3);
    });
  });

  describe('DEFAULT_NOTE_VALUES', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_NOTE_VALUES.content).toBe('');
      expect(DEFAULT_NOTE_VALUES.categoryId).toBeNull();
      expect(DEFAULT_NOTE_VALUES.linkedTaskIds).toEqual([]);
      expect(DEFAULT_NOTE_VALUES.linkedEventIds).toEqual([]);
      expect(DEFAULT_NOTE_VALUES.deletedAt).toBeNull();
    });
  });
});
