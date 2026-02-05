import { describe, it, expect } from 'vitest';
import {
  CATEGORY_COLORS,
  CATEGORY_COLOR_NAMES,
  NONE_CATEGORY_ID,
  NONE_CATEGORY,
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
    it('should have exactly 16 colors', () => {
      expect(CATEGORY_COLORS).toHaveLength(16);
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
      expect(CATEGORY_COLORS).toContain('#DC2626'); // Red
      expect(CATEGORY_COLORS).toContain('#EA580C'); // Orange
      expect(CATEGORY_COLORS).toContain('#CA8A04'); // Gold
      expect(CATEGORY_COLORS).toContain('#16A34A'); // Green
      expect(CATEGORY_COLORS).toContain('#0D9488'); // Teal
      expect(CATEGORY_COLORS).toContain('#0891B2'); // Cyan
      expect(CATEGORY_COLORS).toContain('#2563EB'); // Blue
      expect(CATEGORY_COLORS).toContain('#4F46E5'); // Indigo
      expect(CATEGORY_COLORS).toContain('#7C3AED'); // Violet
      expect(CATEGORY_COLORS).toContain('#C026D3'); // Magenta
      expect(CATEGORY_COLORS).toContain('#DB2777'); // Pink
      expect(CATEGORY_COLORS).toContain('#F43F5E'); // Rose
      expect(CATEGORY_COLORS).toContain('#854D0E'); // Brown
      expect(CATEGORY_COLORS).toContain('#65A30D'); // Lime
      expect(CATEGORY_COLORS).toContain('#78716C'); // Stone
      expect(CATEGORY_COLORS).toContain('#475569'); // Slate
    });
  });

  describe('CATEGORY_COLOR_NAMES', () => {
    it('should have a name for each color', () => {
      CATEGORY_COLORS.forEach(color => {
        expect(CATEGORY_COLOR_NAMES[color as CategoryColor]).toBeDefined();
      });
    });

    it('should have correct color names', () => {
      expect(CATEGORY_COLOR_NAMES['#DC2626']).toBe('Red');
      expect(CATEGORY_COLOR_NAMES['#EA580C']).toBe('Orange');
      expect(CATEGORY_COLOR_NAMES['#CA8A04']).toBe('Gold');
      expect(CATEGORY_COLOR_NAMES['#16A34A']).toBe('Green');
      expect(CATEGORY_COLOR_NAMES['#0D9488']).toBe('Teal');
      expect(CATEGORY_COLOR_NAMES['#0891B2']).toBe('Cyan');
      expect(CATEGORY_COLOR_NAMES['#2563EB']).toBe('Blue');
      expect(CATEGORY_COLOR_NAMES['#4F46E5']).toBe('Indigo');
      expect(CATEGORY_COLOR_NAMES['#7C3AED']).toBe('Violet');
      expect(CATEGORY_COLOR_NAMES['#C026D3']).toBe('Magenta');
      expect(CATEGORY_COLOR_NAMES['#DB2777']).toBe('Pink');
      expect(CATEGORY_COLOR_NAMES['#F43F5E']).toBe('Rose');
      expect(CATEGORY_COLOR_NAMES['#854D0E']).toBe('Brown');
      expect(CATEGORY_COLOR_NAMES['#65A30D']).toBe('Lime');
      expect(CATEGORY_COLOR_NAMES['#78716C']).toBe('Stone');
      expect(CATEGORY_COLOR_NAMES['#475569']).toBe('Slate');
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
  describe('NONE_CATEGORY_ID', () => {
    it('should be "none"', () => {
      expect(NONE_CATEGORY_ID).toBe('none');
    });
  });

  describe('NONE_CATEGORY', () => {
    it('should have correct default values', () => {
      expect(NONE_CATEGORY.name).toBe('None');
      expect(NONE_CATEGORY.color).toBe('#9CA3AF'); // Gray
      expect(NONE_CATEGORY.sortOrder).toBe(-1); // Sorted first
    });
  });

  describe('DEFAULT_CATEGORY_VALUES', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_CATEGORY_VALUES.color).toBe('#DC2626'); // First color (Red)
      expect(DEFAULT_CATEGORY_VALUES.sortOrder).toBe(0);
    });
  });

  // ===========================================================================
  // Type Safety Tests
  // ===========================================================================
  describe('CategoryColor Type', () => {
    it('should accept valid category colors', () => {
      const validColors: CategoryColor[] = [
        '#DC2626',
        '#EA580C',
        '#CA8A04',
        '#16A34A',
        '#0D9488',
        '#0891B2',
        '#2563EB',
        '#4F46E5',
        '#7C3AED',
        '#C026D3',
        '#DB2777',
        '#F43F5E',
        '#854D0E',
        '#65A30D',
        '#78716C',
        '#475569',
      ];
      expect(validColors).toHaveLength(16);
    });
  });
});
