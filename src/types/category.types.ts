/**
 * Category Type Definitions for Neill Planner
 *
 * Categories provide color-coded organization for tasks, events, and notes.
 */

// =============================================================================
// Color Constants
// =============================================================================

/**
 * Predefined category color palette
 * 8 distinct colors for visual differentiation
 */
export const CATEGORY_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
] as const;

/**
 * Type for valid category colors
 */
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

/**
 * Color names for display purposes
 */
export const CATEGORY_COLOR_NAMES: Record<CategoryColor, string> = {
  '#EF4444': 'Red',
  '#F97316': 'Orange',
  '#EAB308': 'Yellow',
  '#22C55E': 'Green',
  '#06B6D4': 'Cyan',
  '#3B82F6': 'Blue',
  '#8B5CF6': 'Purple',
  '#EC4899': 'Pink',
} as const;

// =============================================================================
// Category Interface
// =============================================================================

/**
 * Complete Category entity
 */
export interface Category {
  /** Unique identifier (auto-generated UUID) */
  id: string;
  /** Owner user ID */
  userId: string;
  /** Category name (required, max 50 chars) */
  name: string;
  /** Hex color code */
  color: string;
  /** Sort order for display */
  sortOrder: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for creating a new category
 */
export interface CreateCategoryInput {
  name: string;
  color: string;
  sortOrder?: number;
}

/**
 * Input for updating an existing category
 */
export interface UpdateCategoryInput {
  id: string;
  name?: string;
  color?: string;
  sortOrder?: number;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Default category for uncategorized items
 */
export const UNCATEGORIZED_CATEGORY: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  name: 'Uncategorized',
  color: '#9CA3AF', // Gray
  sortOrder: 0,
} as const;

/**
 * Default values for new categories
 */
export const DEFAULT_CATEGORY_VALUES: Partial<Category> = {
  color: CATEGORY_COLORS[0], // Default to first color (Red)
  sortOrder: 0,
} as const;
