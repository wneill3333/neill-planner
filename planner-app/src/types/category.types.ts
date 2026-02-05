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
 * 16 visually distinct colors for differentiation
 */
export const CATEGORY_COLORS = [
  '#DC2626', // Red
  '#EA580C', // Orange
  '#CA8A04', // Gold
  '#16A34A', // Green
  '#0D9488', // Teal
  '#0891B2', // Cyan
  '#2563EB', // Blue
  '#4F46E5', // Indigo
  '#7C3AED', // Violet
  '#C026D3', // Magenta
  '#DB2777', // Pink
  '#F43F5E', // Rose
  '#854D0E', // Brown
  '#65A30D', // Lime
  '#78716C', // Stone
  '#475569', // Slate
] as const;

/**
 * Type for valid category colors
 */
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

/**
 * Color names for display purposes
 */
export const CATEGORY_COLOR_NAMES: Record<CategoryColor, string> = {
  '#DC2626': 'Red',
  '#EA580C': 'Orange',
  '#CA8A04': 'Gold',
  '#16A34A': 'Green',
  '#0D9488': 'Teal',
  '#0891B2': 'Cyan',
  '#2563EB': 'Blue',
  '#4F46E5': 'Indigo',
  '#7C3AED': 'Violet',
  '#C026D3': 'Magenta',
  '#DB2777': 'Pink',
  '#F43F5E': 'Rose',
  '#854D0E': 'Brown',
  '#65A30D': 'Lime',
  '#78716C': 'Stone',
  '#475569': 'Slate',
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
 * ID for the virtual "None" category
 */
export const NONE_CATEGORY_ID = 'none';

/**
 * Default category for uncategorized items
 */
export const NONE_CATEGORY: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  name: 'None',
  color: '#9CA3AF', // Gray
  sortOrder: -1,
} as const;

/**
 * Default values for new categories
 */
export const DEFAULT_CATEGORY_VALUES: Partial<Category> = {
  color: CATEGORY_COLORS[0], // Default to first color
  sortOrder: 0,
} as const;
