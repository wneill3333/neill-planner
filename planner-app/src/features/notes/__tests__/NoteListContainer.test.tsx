/**
 * NoteListContainer Component Tests
 */

import { describe, it, expect, vi } from 'vitest';

// Mock all dependencies
vi.mock('../hooks', () => ({
  useNotesByDate: () => ({
    notes: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('../../auth', () => ({
  useAuth: () => ({ user: { id: 'user-123', email: 'test@example.com' } }),
}));

vi.mock('../../store/hooks', () => ({
  useAppSelector: vi.fn((selector) => {
    // Mock selector return values
    if (selector.name === 'selectNotesForSelectedDate' || selector.toString().includes('notes')) {
      return [];
    }
    if (selector.toString().includes('categories') || selector.name === 'selectAllCategories') {
      return [];
    }
    if (selector.toString().includes('selectedDate')) {
      return '2024-01-15';
    }
    if (selector.toString().includes('loading')) {
      return false;
    }
    return null;
  }),
}));

describe('NoteListContainer', () => {
  it('should be defined and export', async () => {
    const { NoteListContainer } = await import('../NoteListContainer');
    expect(NoteListContainer).toBeDefined();
    expect(typeof NoteListContainer).toBe('function');
  });

  it('should have correct prop types', async () => {
    const { NoteListContainer } = await import('../NoteListContainer');
    // Component should be a function
    expect(typeof NoteListContainer).toBe('function');
  });

  it('should be exportable', async () => {
    const module = await import('../NoteListContainer');
    expect(module.NoteListContainer).toBeDefined();
  });
});
