import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CreateNoteInput, UpdateNoteInput } from '../../../types';

// Mock Firestore
const mockAddDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000 }),
  },
}));

vi.mock('../config', () => ({
  db: { name: 'mock-db' },
}));

describe('Notes Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('notes-collection');
    mockDoc.mockReturnValue('note-doc-ref');
    mockQuery.mockReturnValue('query-ref');
    mockWhere.mockReturnValue('where-clause');
    mockOrderBy.mockReturnValue('order-clause');
  });

  describe('createNote', () => {
    it('should create a note with auto-generated fields', async () => {
      const { createNote } = await import('../notes.service');

      mockAddDoc.mockResolvedValue({ id: 'new-note-id' });

      const date = new Date('2026-01-25');

      const input: CreateNoteInput = {
        title: 'Test Note',
        content: 'Test content',
        date,
      };

      const result = await createNote(input, 'user-123');

      expect(mockAddDoc).toHaveBeenCalled();
      expect(result.id).toBe('new-note-id');
      expect(result.userId).toBe('user-123');
      expect(result.title).toBe('Test Note');
      expect(result.content).toBe('Test content');
      expect(result.date).toEqual(date);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.deletedAt).toBeNull();
    });

    it('should set default values for optional fields', async () => {
      const { createNote } = await import('../notes.service');

      mockAddDoc.mockResolvedValue({ id: 'new-note-id' });

      const input: CreateNoteInput = {
        title: 'Minimal Note',
        date: new Date('2026-01-25'),
      };

      const result = await createNote(input, 'user-123');

      expect(result.content).toBe('');
      expect(result.categoryId).toBeNull();
      expect(result.linkedTaskIds).toEqual([]);
      expect(result.linkedEventIds).toEqual([]);
    });

    it('should throw validation error for missing title', async () => {
      const { createNote } = await import('../notes.service');

      const input = {
        title: '',
        date: new Date('2026-01-25'),
      } as CreateNoteInput;

      await expect(createNote(input, 'user-123')).rejects.toThrow('Title is required');
    });

    it('should throw validation error for invalid userId', async () => {
      const { createNote } = await import('../notes.service');

      const input: CreateNoteInput = {
        title: 'Test Note',
        date: new Date('2026-01-25'),
      };

      await expect(createNote(input, '')).rejects.toThrow();
    });
  });

  describe('getNote', () => {
    it('should return note when found', async () => {
      const { getNote } = await import('../notes.service');

      const mockNote = {
        userId: 'user-123',
        title: 'Found Note',
        content: 'Note content',
        date: { toDate: () => new Date('2026-01-25') },
        categoryId: null,
        linkedTaskIds: [],
        linkedEventIds: [],
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        deletedAt: null,
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockNote,
        id: 'note-123',
      });

      const result = await getNote('note-123', 'user-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('note-123');
      expect(result?.title).toBe('Found Note');
      expect(result?.userId).toBe('user-123');
    });

    it('should return null when note not found', async () => {
      const { getNote } = await import('../notes.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getNote('nonexistent', 'user-123');

      expect(result).toBeNull();
    });

    it('should throw error when user unauthorized', async () => {
      const { getNote } = await import('../notes.service');

      const mockNote = {
        userId: 'user-456',
        title: 'Private Note',
        content: '',
        date: { toDate: () => new Date() },
        categoryId: null,
        linkedTaskIds: [],
        linkedEventIds: [],
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        deletedAt: null,
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockNote,
        id: 'note-123',
      });

      await expect(getNote('note-123', 'user-123')).rejects.toThrow('Unauthorized');
    });
  });

  describe('getNotesByDate', () => {
    it('should return notes for a specific date', async () => {
      const { getNotesByDate } = await import('../notes.service');

      const mockNotes = [
        {
          userId: 'user-123',
          title: 'Note 1',
          content: 'Content 1',
          date: { toDate: () => new Date('2026-01-25') },
          categoryId: null,
          linkedTaskIds: [],
          linkedEventIds: [],
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          deletedAt: null,
        },
        {
          userId: 'user-123',
          title: 'Note 2',
          content: 'Content 2',
          date: { toDate: () => new Date('2026-01-25') },
          categoryId: null,
          linkedTaskIds: [],
          linkedEventIds: [],
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          deletedAt: null,
        },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockNotes.map((note, index) => ({
          data: () => note,
          id: `note-${index}`,
        })),
      });

      const result = await getNotesByDate('user-123', new Date('2026-01-25'));

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Note 1');
      expect(result[1].title).toBe('Note 2');
    });

    it('should return empty array when no notes found', async () => {
      const { getNotesByDate } = await import('../notes.service');

      mockGetDocs.mockResolvedValue({ docs: [] });

      const result = await getNotesByDate('user-123', new Date('2026-01-25'));

      expect(result).toEqual([]);
    });
  });

  describe('updateNote', () => {
    it('should update note successfully', async () => {
      const { updateNote } = await import('../notes.service');

      const existingNote = {
        userId: 'user-123',
        title: 'Original Title',
        content: 'Original content',
        date: { toDate: () => new Date('2026-01-25') },
        categoryId: null,
        linkedTaskIds: [],
        linkedEventIds: [],
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        deletedAt: null,
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => existingNote,
        id: 'note-123',
      });

      mockUpdateDoc.mockResolvedValue(undefined);

      const input: UpdateNoteInput = {
        id: 'note-123',
        title: 'Updated Title',
        content: 'Updated content',
      };

      const result = await updateNote(input, 'user-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(result.id).toBe('note-123');
      expect(result.title).toBe('Updated Title');
      expect(result.content).toBe('Updated content');
    });

    it('should throw error when note not found', async () => {
      const { updateNote } = await import('../notes.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const input: UpdateNoteInput = {
        id: 'nonexistent',
        title: 'Updated Title',
      };

      await expect(updateNote(input, 'user-123')).rejects.toThrow('Note not found');
    });

    it('should throw error when user unauthorized', async () => {
      const { updateNote } = await import('../notes.service');

      const existingNote = {
        userId: 'user-456',
        title: 'Original Title',
        content: 'Original content',
        date: { toDate: () => new Date() },
        categoryId: null,
        linkedTaskIds: [],
        linkedEventIds: [],
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        deletedAt: null,
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => existingNote,
        id: 'note-123',
      });

      const input: UpdateNoteInput = {
        id: 'note-123',
        title: 'Updated Title',
      };

      await expect(updateNote(input, 'user-123')).rejects.toThrow('Unauthorized');
    });
  });

  describe('softDeleteNote', () => {
    it('should soft delete note successfully', async () => {
      const { softDeleteNote } = await import('../notes.service');

      const existingNote = {
        userId: 'user-123',
        title: 'Note to Delete',
        content: 'Content',
        date: { toDate: () => new Date() },
        categoryId: null,
        linkedTaskIds: [],
        linkedEventIds: [],
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        deletedAt: null,
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => existingNote,
        id: 'note-123',
      });

      mockUpdateDoc.mockResolvedValue(undefined);

      await softDeleteNote('note-123', 'user-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls[0][1];
      expect(updateCall.deletedAt).toBeDefined();
    });

    it('should throw error when note not found', async () => {
      const { softDeleteNote } = await import('../notes.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(softDeleteNote('nonexistent', 'user-123')).rejects.toThrow('Note not found');
    });
  });

  describe('hardDeleteNote', () => {
    it('should permanently delete note', async () => {
      const { hardDeleteNote } = await import('../notes.service');

      const existingNote = {
        userId: 'user-123',
        title: 'Note to Delete',
        content: 'Content',
        date: { toDate: () => new Date() },
        categoryId: null,
        linkedTaskIds: [],
        linkedEventIds: [],
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        deletedAt: null,
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => existingNote,
        id: 'note-123',
      });

      mockDeleteDoc.mockResolvedValue(undefined);

      await hardDeleteNote('note-123', 'user-123');

      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });

  describe('restoreNote', () => {
    it('should restore soft-deleted note', async () => {
      const { restoreNote } = await import('../notes.service');

      const deletedNote = {
        userId: 'user-123',
        title: 'Deleted Note',
        content: 'Content',
        date: { toDate: () => new Date('2026-01-25') },
        categoryId: null,
        linkedTaskIds: [],
        linkedEventIds: [],
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        deletedAt: { toDate: () => new Date() },
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => deletedNote,
        id: 'note-123',
      });

      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await restoreNote('note-123', 'user-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(result.deletedAt).toBeNull();
    });
  });
});
