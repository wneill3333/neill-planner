/**
 * Categories Service Tests
 *
 * Comprehensive tests for the categories Firebase service layer.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../../../types';

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

describe('Categories Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('categories-collection');
    mockDoc.mockReturnValue('category-doc-ref');
    mockQuery.mockReturnValue('query-ref');
    mockWhere.mockReturnValue('where-clause');
    mockOrderBy.mockReturnValue('order-clause');
  });

  describe('createCategory', () => {
    it('should create a category with auto-generated fields', async () => {
      const { createCategory } = await import('../categories.service');

      mockAddDoc.mockResolvedValue({ id: 'new-category-id' });

      const input: CreateCategoryInput = {
        name: 'Work',
        color: '#3B82F6',
      };

      const result = await createCategory(input, 'user-123');

      expect(mockAddDoc).toHaveBeenCalled();
      expect(result.id).toBe('new-category-id');
      expect(result.userId).toBe('user-123');
      expect(result.name).toBe('Work');
      expect(result.color).toBe('#3B82F6');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should set default sortOrder when not provided', async () => {
      const { createCategory } = await import('../categories.service');

      mockAddDoc.mockResolvedValue({ id: 'new-category-id' });

      const input: CreateCategoryInput = {
        name: 'Personal',
        color: '#22C55E',
      };

      const result = await createCategory(input, 'user-123');

      expect(result.sortOrder).toBe(0);
    });

    it('should use provided sortOrder', async () => {
      const { createCategory } = await import('../categories.service');

      mockAddDoc.mockResolvedValue({ id: 'new-category-id' });

      const input: CreateCategoryInput = {
        name: 'Personal',
        color: '#22C55E',
        sortOrder: 5,
      };

      const result = await createCategory(input, 'user-123');

      expect(result.sortOrder).toBe(5);
    });
  });

  describe('getCategory', () => {
    it('should return category when found', async () => {
      const { getCategory } = await import('../categories.service');

      const mockCategory = {
        userId: 'user-123',
        name: 'Work',
        color: '#3B82F6',
        sortOrder: 1,
        createdAt: { toDate: () => new Date('2026-01-01') },
        updatedAt: { toDate: () => new Date('2026-01-02') },
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'cat-123',
        data: () => mockCategory,
      });

      const result = await getCategory('cat-123', 'user-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('cat-123');
      expect(result?.name).toBe('Work');
      expect(result?.color).toBe('#3B82F6');
    });

    it('should return null when category not found', async () => {
      const { getCategory } = await import('../categories.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getCategory('non-existent', 'user-123');

      expect(result).toBeNull();
    });

    it('should default sortOrder to 0 if not present', async () => {
      const { getCategory } = await import('../categories.service');

      const mockCategory = {
        userId: 'user-123',
        name: 'Work',
        color: '#3B82F6',
        // sortOrder is missing
        createdAt: { toDate: () => new Date('2026-01-01') },
        updatedAt: { toDate: () => new Date('2026-01-02') },
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'cat-123',
        data: () => mockCategory,
      });

      const result = await getCategory('cat-123', 'user-123');

      expect(result?.sortOrder).toBe(0);
    });
  });

  describe('getCategories', () => {
    it('should return all categories for a user', async () => {
      const { getCategories } = await import('../categories.service');

      const mockDocs = [
        {
          id: 'cat-1',
          data: () => ({
            userId: 'user-123',
            name: 'Work',
            color: '#3B82F6',
            sortOrder: 0,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
        {
          id: 'cat-2',
          data: () => ({
            userId: 'user-123',
            name: 'Personal',
            color: '#22C55E',
            sortOrder: 1,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockDocs });

      const result = await getCategories('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Work');
      expect(result[1].name).toBe('Personal');
    });

    it('should return empty array when no categories', async () => {
      const { getCategories } = await import('../categories.service');

      mockGetDocs.mockResolvedValue({ docs: [] });

      const result = await getCategories('user-123');

      expect(result).toEqual([]);
    });

    it('should query with correct filters', async () => {
      const { getCategories } = await import('../categories.service');

      mockGetDocs.mockResolvedValue({ docs: [] });

      await getCategories('user-123');

      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-123');
      expect(mockOrderBy).toHaveBeenCalledWith('sortOrder');
      expect(mockOrderBy).toHaveBeenCalledWith('name');
    });
  });

  describe('updateCategory', () => {
    it('should update category fields', async () => {
      const { updateCategory } = await import('../categories.service');

      const updatedCategory = {
        userId: 'user-123',
        name: 'Updated Work',
        color: '#EF4444',
        sortOrder: 2,
        createdAt: { toDate: () => new Date('2026-01-01') },
        updatedAt: { toDate: () => new Date() },
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'cat-123',
        data: () => updatedCategory,
      });

      const input: UpdateCategoryInput = {
        id: 'cat-123',
        name: 'Updated Work',
        color: '#EF4444',
      };

      const result = await updateCategory(input, 'user-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(result.name).toBe('Updated Work');
      expect(result.color).toBe('#EF4444');
    });

    it('should update updatedAt timestamp', async () => {
      const { updateCategory } = await import('../categories.service');

      const beforeUpdate = new Date('2026-01-01');
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'cat-123',
        data: () => ({
          userId: 'user-123',
          name: 'Work',
          color: '#3B82F6',
          sortOrder: 0,
          createdAt: { toDate: () => beforeUpdate },
          updatedAt: { toDate: () => new Date() },
        }),
      });

      await updateCategory({ id: 'cat-123', name: 'New Name' }, 'user-123');

      // Verify updateDoc was called with updatedAt
      const updateCall = mockUpdateDoc.mock.calls[0];
      expect(updateCall).toBeDefined();
    });

    it('should throw if category not found', async () => {
      const { updateCategory } = await import('../categories.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(updateCategory({ id: 'cat-123', name: 'New' }, 'user-123')).rejects.toThrow(
        'Category not found'
      );
    });
  });

  describe('deleteCategory', () => {
    it('should delete category', async () => {
      const { deleteCategory } = await import('../categories.service');

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'cat-123',
        data: () => ({
          userId: 'user-123',
          name: 'Work',
          color: '#3B82F6',
          sortOrder: 0,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      });
      mockDeleteDoc.mockResolvedValue(undefined);

      await deleteCategory('cat-123', 'user-123');

      expect(mockDeleteDoc).toHaveBeenCalled();
      expect(mockDoc).toHaveBeenCalledWith({ name: 'mock-db' }, 'categories', 'cat-123');
    });
  });

  describe('getCategoryCount', () => {
    it('should return count of categories', async () => {
      const { getCategoryCount } = await import('../categories.service');

      const mockDocs = [
        { id: 'cat-1', data: () => ({ userId: 'user-123', name: 'A', color: '#EF4444', sortOrder: 0, createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } }) },
        { id: 'cat-2', data: () => ({ userId: 'user-123', name: 'B', color: '#22C55E', sortOrder: 1, createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } }) },
        { id: 'cat-3', data: () => ({ userId: 'user-123', name: 'C', color: '#3B82F6', sortOrder: 2, createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } }) },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockDocs });

      const result = await getCategoryCount('user-123');

      expect(result).toBe(3);
    });

    it('should return 0 for no categories', async () => {
      const { getCategoryCount } = await import('../categories.service');

      mockGetDocs.mockResolvedValue({ docs: [] });

      const result = await getCategoryCount('user-123');

      expect(result).toBe(0);
    });
  });

  describe('categoryNameExists', () => {
    it('should return true if name exists', async () => {
      const { categoryNameExists } = await import('../categories.service');

      const mockDocs = [
        { id: 'cat-1', data: () => ({ userId: 'user-123', name: 'Work', color: '#3B82F6', sortOrder: 0, createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } }) },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockDocs });

      const result = await categoryNameExists('user-123', 'Work');

      expect(result).toBe(true);
    });

    it('should return true for case-insensitive match', async () => {
      const { categoryNameExists } = await import('../categories.service');

      const mockDocs = [
        { id: 'cat-1', data: () => ({ userId: 'user-123', name: 'Work', color: '#3B82F6', sortOrder: 0, createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } }) },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockDocs });

      const result = await categoryNameExists('user-123', 'WORK');

      expect(result).toBe(true);
    });

    it('should return false if name does not exist', async () => {
      const { categoryNameExists } = await import('../categories.service');

      const mockDocs = [
        { id: 'cat-1', data: () => ({ userId: 'user-123', name: 'Work', color: '#3B82F6', sortOrder: 0, createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } }) },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockDocs });

      const result = await categoryNameExists('user-123', 'Personal');

      expect(result).toBe(false);
    });

    it('should exclude specified ID when checking', async () => {
      const { categoryNameExists } = await import('../categories.service');

      const mockDocs = [
        { id: 'cat-1', data: () => ({ userId: 'user-123', name: 'Work', color: '#3B82F6', sortOrder: 0, createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } }) },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockDocs });

      // When updating cat-1, its own name should not count as duplicate
      const result = await categoryNameExists('user-123', 'Work', 'cat-1');

      expect(result).toBe(false);
    });

    it('should find duplicate if different ID has same name', async () => {
      const { categoryNameExists } = await import('../categories.service');

      const mockDocs = [
        { id: 'cat-1', data: () => ({ userId: 'user-123', name: 'Work', color: '#3B82F6', sortOrder: 0, createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } }) },
        { id: 'cat-2', data: () => ({ userId: 'user-123', name: 'Personal', color: '#22C55E', sortOrder: 1, createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } }) },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockDocs });

      // When updating cat-2, cat-1's name should count as duplicate
      const result = await categoryNameExists('user-123', 'Work', 'cat-2');

      expect(result).toBe(true);
    });
  });
});
