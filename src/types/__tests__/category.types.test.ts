import { describe, it, expect } from 'vitest';
import {
  CATEGORY_COLORS,
  CATEGORY_COLOR_NAMES,
  UNCATEGORIZED_CATEGORY,
  DEFAULT_CATEGORY_VALUES,
} from '../category.types';
import type {
  CategoryColor,
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../category.types';

describe('Category Types', () => {
  // ===========================================================================
  // Color Constants Tests
  // ===========================================================================
  describe('CATEGORY_COLORS', () => {
    it('should have exactly 8 colors', () => {
      expect(CATEGORY_COLORS).toHaveLength(8);
    });

    it('should have valid hex color codes', () => {
      const hexColorRegex = /^#[0-9A-F]{6}$/i;
      CATEGORY_COLORS.forEach(color => {
        expect(color).toMatch(hexColorRegex);
      });
    });

    it('should have unique colors', () => {
      const uniqueColors = new Set(CATEGORY_COLORS);
      expect(uniqueColors.size).toBe(CATEGORY_COLORS.length);
    });

    it('should contain expected colors', () => {
      expect(CATEGORY_COLORS).toContain('#EF4444'); // Red
      expect(CATEGORY_COLORS).toContain('#F97316'); // Orange
      expect(CATEGORY_COLORS).toContain('#EAB308'); // Yellow
      expect(CATEGORY_COLORS).toContain('#22C55E'); // Green
      expect(CATEGORY_COLORS).toContain('#06B6D4'); // Cyan
      expect(CATEGORY_COLORS).toContain('#3B82F6'); // Blue
      expect(CATEGORY_COLORS).toContain('#8B5CF6'); // Purple
      expect(CATEGORY_COLORS).toContain('#EC4899'); // Pink
    });
  });

  describe('CATEGORY_COLOR_NAMES', () => {
    it('should have a name for each color', () => {
      CATEGORY_COLORS.forEach(color => {
        expect(CATEGORY_COLOR_NAMES[color as CategoryColor]).toBeDefined();
      });
    });

    it('should have correct color names', () => {
      expect(CATEGORY_COLOR_NAMES['#EF4444']).toBe('Red');
      expect(CATEGORY_COLOR_NAMES['#F97316']).toBe('Orange');
      expect(CATEGORY_COLOR_NAMES['#EAB308']).toBe('Yellow');
      expect(CATEGORY_COLOR_NAMES['#22C55E']).toBe('Green');
      expect(CATEGORY_COLOR_NAMES['#06B6D4']).toBe('Cyan');
      expect(CATEGORY_COLOR_NAMES['#3B82F6']).toBe('Blue');
      expect(CATEGORY_COLOR_NAMES['#8B5CF6']).toBe('Purple');
      expect(CATEGORY_COLOR_NAMES['#EC4899']).toBe('Pink');
    });
  });

  // ===========================================================================
  // Category Interface Tests
  // ===========================================================================
  describe('Category', () => {
    const createValidCategory = (): Category => ({
      id: 'category-123',
      userId: 'user-456',
      name: 'Work',
      color: '#3B82F6',
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should create a valid category with all fields', () => {
      const category = createValidCategory();
      expect(category.id).toBe('category-123');
      expect(category.userId).toBe('user-456');
      expect(category.name).toBe('Work');
      expect(category.color).toBe('#3B82F6');
      expect(category.sortOrder).toBe(1);
    });

    it('should support any hex color', () => {
      const category: Category = {
        ...createValidCategory(),
        color: '#FF5733', // Custom color
      };
      expect(category.color).toBe('#FF5733');
    });

    it('should support different sort orders', () => {
      const categories: Category[] = [
        { ...createValidCategory(), sortOrder: 0 },
        { ...createValidCategory(), sortOrder: 5 },
        { ...createValidCategory(), sortOrder: 100 },
      ];
      expect(categories[0].sortOrder).toBe(0);
      expect(categories[1].sortOrder).toBe(5);
      expect(categories[2].sortOrder).toBe(100);
    });

    it('should have timestamp fields', () => {
      const category = createValidCategory();
      expect(category.createdAt).toBeInstanceOf(Date);
      expect(category.updatedAt).toBeInstanceOf(Date);
    });
  });

  // ===========================================================================
  // Input Types Tests
  // ===========================================================================
  describe('CreateCategoryInput', () => {
    it('should require name and color', () => {
      const input: CreateCategoryInput = {
        name: 'Personal',
        color: '#EC4899',
      };
      expect(input.name).toBe('Personal');
      expect(input.color).toBe('#EC4899');
    });

    it('should allow optional sortOrder', () => {
      const input: CreateCategoryInput = {
        name: 'Personal',
        color: '#EC4899',
        sortOrder: 5,
      };
      expect(input.sortOrder).toBe(5);
    });
  });

  describe('UpdateCategoryInput', () => {
    it('should require only id', () => {
      const input: UpdateCategoryInput = {
        id: 'category-123',
      };
      expect(input.id).toBe('category-123');
    });

    it('should allow partial updates', () => {
      const input: UpdateCategoryInput = {
        id: 'category-123',
        name: 'Updated Name',
      };
      expect(input.name).toBe('Updated Name');
      expect(input.color).toBeUndefined();
    });

    it('should allow updating color', () => {
      const input: UpdateCategoryInput = {
        id: 'category-123',
        color: '#22C55E',
      };
      expect(input.color).toBe('#22C55E');
    });

    it('should allow updating sortOrder', () => {
      const input: UpdateCategoryInput = {
        id: 'category-123',
        sortOrder: 10,
      };
      expect(input.sortOrder).toBe(10);
    });
  });

  // ===========================================================================
  // Utility Types Tests
  // ===========================================================================
  describe('UNCATEGORIZED_CATEGORY', () => {
    it('should have correct default values', () => {
      expect(UNCATEGORIZED_CATEGORY.name).toBe('Uncategorized');
      expect(UNCATEGORIZED_CATEGORY.color).toBe('#9CA3AF'); // Gray
      expect(UNCATEGORIZED_CATEGORY.sortOrder).toBe(0);
    });
  });

  describe('DEFAULT_CATEGORY_VALUES', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_CATEGORY_VALUES.color).toBe('#EF4444'); // First color (Red)
      expect(DEFAULT_CATEGORY_VALUES.sortOrder).toBe(0);
    });
  });

  // ===========================================================================
  // Type Safety Tests
  // ===========================================================================
  describe('CategoryColor Type', () => {
    it('should accept valid category colors', () => {
      const validColors: CategoryColor[] = [
        '#EF4444',
        '#F97316',
        '#EAB308',
        '#22C55E',
        '#06B6D4',
        '#3B82F6',
        '#8B5CF6',
        '#EC4899',
      ];
      expect(validColors).toHaveLength(8);
    });
  });
});
