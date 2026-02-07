/**
 * FilterControls Component
 *
 * Provides UI for filtering tasks by status, category, and priority.
 * Features collapsible panel with checkboxes and multi-select controls.
 */

import { useState, useId, memo } from 'react';
import type { TaskStatus, PriorityLetter, Category } from '../../types';
import { TaskStatusLabels, TaskStatusSymbols, PRIORITY_LETTERS } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface FilterControlsProps {
  /** Currently selected status filters */
  statusFilter: TaskStatus[] | null;
  /** Currently selected category filters (category IDs) */
  categoryFilter: string[] | null;
  /** Currently selected priority filters */
  priorityFilter: PriorityLetter[] | null;
  /** Available categories for filter dropdown */
  categories: Category[];
  /** Number of active filters */
  activeFilterCount: number;
  /** Callback when status filter changes */
  onStatusFilterChange: (statuses: TaskStatus[] | null) => void;
  /** Callback when category filter changes */
  onCategoryFilterChange: (categoryIds: string[] | null) => void;
  /** Callback when priority filter changes */
  onPriorityFilterChange: (priorities: PriorityLetter[] | null) => void;
  /** Callback when clear all filters is clicked */
  onClearAllFilters: () => void;
  /** Test ID for testing */
  testId?: string;
}

// All available statuses for filtering
const ALL_STATUSES: TaskStatus[] = ['in_progress', 'complete', 'forward', 'delegate', 'cancelled'];

// =============================================================================
// Component
// =============================================================================

/**
 * FilterControls - Filter panel for tasks
 *
 * Features:
 * - Status filter with checkboxes and symbols
 * - Category filter with color dots
 * - Priority filter (A, B, C, D)
 * - Active filter count badge
 * - Clear all filters button
 * - Collapsible panel
 * - Full keyboard accessibility
 */
function FilterControlsComponent({
  statusFilter,
  categoryFilter,
  priorityFilter,
  categories,
  activeFilterCount,
  onStatusFilterChange,
  onCategoryFilterChange,
  onPriorityFilterChange,
  onClearAllFilters,
  testId = 'filter-controls',
}: FilterControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelId = useId();

  // Handle status checkbox toggle
  const handleStatusToggle = (status: TaskStatus) => {
    const currentStatuses = statusFilter || [];
    const isSelected = currentStatuses.includes(status);

    if (isSelected) {
      // Remove status
      const newStatuses = currentStatuses.filter((s) => s !== status);
      onStatusFilterChange(newStatuses.length > 0 ? newStatuses : null);
    } else {
      // Add status
      onStatusFilterChange([...currentStatuses, status]);
    }
  };

  // Handle category checkbox toggle
  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = categoryFilter || [];
    const isSelected = currentCategories.includes(categoryId);

    if (isSelected) {
      // Remove category
      const newCategories = currentCategories.filter((c) => c !== categoryId);
      onCategoryFilterChange(newCategories.length > 0 ? newCategories : null);
    } else {
      // Add category
      onCategoryFilterChange([...currentCategories, categoryId]);
    }
  };

  // Handle priority checkbox toggle
  const handlePriorityToggle = (priority: PriorityLetter) => {
    const currentPriorities = priorityFilter || [];
    const isSelected = currentPriorities.includes(priority);

    if (isSelected) {
      // Remove priority
      const newPriorities = currentPriorities.filter((p) => p !== priority);
      onPriorityFilterChange(newPriorities.length > 0 ? newPriorities : null);
    } else {
      // Add priority
      onPriorityFilterChange([...currentPriorities, priority]);
    }
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4"
      data-testid={testId}
    >
      {/* Header with toggle button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded"
          data-testid={`${testId}-toggle`}
        >
          {/* Expand/Collapse Icon */}
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span>Filters</span>

          {/* Active Filter Count Badge */}
          {activeFilterCount > 0 && (
            <span
              className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-amber-500 rounded-full"
              aria-label={`${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'}`}
              data-testid={`${testId}-count-badge`}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Clear All Button */}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClearAllFilters}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded px-2 py-1"
            data-testid={`${testId}-clear-all`}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {isExpanded && (
        <div
          id={panelId}
          className="px-4 py-3 grid grid-cols-1 md:grid-cols-3 gap-4"
          data-testid={`${testId}-panel`}
        >
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Status
            </label>
            <div className="space-y-1.5">
              {ALL_STATUSES.map((status) => {
                const isChecked = (statusFilter || []).includes(status);
                const checkboxId = `status-${status}`;

                return (
                  <label
                    key={status}
                    htmlFor={checkboxId}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id={checkboxId}
                      checked={isChecked}
                      onChange={() => handleStatusToggle(status)}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      data-testid={`${testId}-status-${status}`}
                    />
                    <span className="text-base" aria-hidden="true">
                      {TaskStatusSymbols[status]}
                    </span>
                    <span className="flex-1">{TaskStatusLabels[status]}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Category
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 italic px-2 py-1">
                  No categories available
                </p>
              ) : (
                categories.map((category) => {
                  const isChecked = (categoryFilter || []).includes(category.id);
                  const checkboxId = `category-${category.id}`;

                  return (
                    <label
                      key={category.id}
                      htmlFor={checkboxId}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        id={checkboxId}
                        checked={isChecked}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        data-testid={`${testId}-category-${category.id}`}
                      />
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{category.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Priority
            </label>
            <div className="space-y-1.5">
              {PRIORITY_LETTERS.map((priority) => {
                const isChecked = (priorityFilter || []).includes(priority);
                const checkboxId = `priority-${priority}`;
                const priorityLabels = {
                  A: 'A - Vital',
                  B: 'B - Important',
                  C: 'C - Optional',
                  D: 'D - Delegate',
                };

                return (
                  <label
                    key={priority}
                    htmlFor={checkboxId}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id={checkboxId}
                      checked={isChecked}
                      onChange={() => handlePriorityToggle(priority)}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      data-testid={`${testId}-priority-${priority}`}
                    />
                    <span className="flex-1">{priorityLabels[priority]}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const FilterControls = memo(FilterControlsComponent);

export default FilterControls;
