/**
 * Note Hooks Tests
 *
 * Tests for custom note hooks.
 */

import { describe, it, expect } from 'vitest';
import { selectNotesByDate, selectNoteById } from '../noteSlice';

describe('Note Hooks', () => {
  // Mock note data removed - not used in current tests

  // Test that hooks are correctly defined and exported
  describe('useNotesByDate', () => {
    it('should be defined', async () => {
      const { useNotesByDate } = await import('../hooks');
      expect(useNotesByDate).toBeDefined();
      expect(typeof useNotesByDate).toBe('function');
    });
  });

  describe('useNote', () => {
    it('should be defined', async () => {
      const { useNote } = await import('../hooks');
      expect(useNote).toBeDefined();
      expect(typeof useNote).toBe('function');
    });
  });

  // Test selectors that the hooks use
  describe('selectNotesByDate', () => {
    it('should be defined', () => {
      expect(selectNotesByDate).toBeDefined();
      expect(typeof selectNotesByDate).toBe('function');
    });
  });

  describe('selectNoteById', () => {
    it('should be defined', () => {
      expect(selectNoteById).toBeDefined();
      expect(typeof selectNoteById).toBe('function');
    });
  });
});
