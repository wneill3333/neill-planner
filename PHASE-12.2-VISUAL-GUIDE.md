# Phase 12.2 - Filter System Visual Guide

**Component Hierarchy and Data Flow**

---

## Component Tree

```
TaskListContainer (Redux Container)
├── FilterControlsContainer (Redux Container)
│   └── FilterControls (Presentation Component)
│       ├── Toggle Button (with badge)
│       ├── Clear All Button
│       └── Filter Panel (expandable)
│           ├── Status Filter Section
│           │   ├── ☐ In Progress
│           │   ├── ☐ Complete
│           │   ├── ☐ Forward
│           │   ├── ☐ Delegate
│           │   └── ☐ Delete
│           ├── Category Filter Section
│           │   ├── ☐ Category 1 (with color dot)
│           │   ├── ☐ Category 2 (with color dot)
│           │   └── ☐ Category N (with color dot)
│           └── Priority Filter Section
│               ├── ☐ A - Vital
│               ├── ☐ B - Important
│               ├── ☐ C - Optional
│               └── ☐ D - Delegate
├── Filter Count Message ("Showing X of Y tasks")
└── DraggableTaskList (Filtered Tasks)
```

---

## Redux State Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Redux Store                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  filters: {                                                 │
│    statusFilter: ['in_progress', 'complete'] | null         │
│    categoryFilter: ['cat-1', 'cat-2'] | null                │
│    priorityFilter: ['A', 'B'] | null                        │
│  }                                                          │
│                                                             │
│  tasks: {                                                   │
│    tasks: { task-1: {...}, task-2: {...}, ... }            │
│    taskIdsByDate: { '2024-01-15': ['task-1', ...] }        │
│    ...                                                      │
│  }                                                          │
│                                                             │
│  categories: {                                              │
│    categories: { cat-1: {...}, cat-2: {...}, ... }         │
│    categoryIds: ['cat-1', 'cat-2', ...]                    │
│    ...                                                      │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
          ▲                                  │
          │ dispatch actions                 │ useAppSelector
          │                                  ▼
┌─────────────────────────────────────────────────────────────┐
│              FilterControlsContainer                        │
├─────────────────────────────────────────────────────────────┤
│  - Reads: selectStatusFilter                                │
│           selectCategoryFilter                              │
│           selectPriorityFilter                              │
│           selectActiveFilterCount                           │
│           selectAllCategories                               │
│                                                             │
│  - Dispatches: setStatusFilter()                            │
│                setCategoryFilter()                          │
│                setPriorityFilter()                          │
│                clearAllFilters()                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ props
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   FilterControls                            │
├─────────────────────────────────────────────────────────────┤
│  Renders UI based on props                                  │
│  Calls callbacks on user interaction                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Selector Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  selectFilteredTasks                        │
│                   (Memoized Selector)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Input Selectors:                                           │
│  1. selectTasksWithRecurringInstances(state, date)          │
│     └─> Returns: Task[] (all tasks for date)               │
│                                                             │
│  2. state.filters?.statusFilter                             │
│     └─> Returns: TaskStatus[] | null                        │
│                                                             │
│  3. state.filters?.categoryFilter                           │
│     └─> Returns: string[] | null                            │
│                                                             │
│  4. state.filters?.priorityFilter                           │
│     └─> Returns: PriorityLetter[] | null                    │
│                                                             │
│  Output Selector Logic:                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. Check if any filters are active                   │  │
│  │    - If none: return all tasks                       │  │
│  │                                                       │  │
│  │ 2. Filter tasks by status (if active)                │  │
│  │    - Keep task if task.status in statusFilter        │  │
│  │                                                       │  │
│  │ 3. Filter tasks by category (if active)              │  │
│  │    - Keep task if task.categoryId in categoryFilter  │  │
│  │    - Special handling for null (uncategorized)       │  │
│  │                                                       │  │
│  │ 4. Filter tasks by priority (if active)              │  │
│  │    - Keep task if task.priority.letter in filter     │  │
│  │                                                       │  │
│  │ 5. Return filtered tasks                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Returns: Task[] (filtered)                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## User Interaction Flow

### 1. Opening Filters

```
User clicks "Filters" button
         │
         ▼
FilterControls state: isExpanded = true
         │
         ▼
Panel slides open (CSS transition)
         │
         ▼
User sees filter checkboxes
```

### 2. Applying a Status Filter

```
User clicks "In Progress" checkbox
         │
         ▼
FilterControls.handleStatusToggle('in_progress')
         │
         ▼
onStatusFilterChange(['in_progress'])
         │
         ▼
FilterControlsContainer dispatches setStatusFilter(['in_progress'])
         │
         ▼
Redux updates filters.statusFilter = ['in_progress']
         │
         ▼
selectFilteredTasks re-runs (memoized)
         │
         ▼
TaskListContainer receives filtered tasks
         │
         ▼
UI updates:
- Badge shows "1"
- Message shows "Showing X of Y tasks"
- Task list shows only in_progress tasks
```

### 3. Adding Multiple Filters

```
User clicks "Complete" checkbox (status already has "In Progress")
         │
         ▼
handleStatusToggle('complete')
         │
         ▼
onStatusFilterChange(['in_progress', 'complete'])
         │
         ▼
dispatch(setStatusFilter(['in_progress', 'complete']))
         │
         ▼
statusFilter = ['in_progress', 'complete']
         │
         ▼
User clicks "Work" category checkbox
         │
         ▼
handleCategoryToggle('cat-work')
         │
         ▼
onCategoryFilterChange(['cat-work'])
         │
         ▼
dispatch(setCategoryFilter(['cat-work']))
         │
         ▼
categoryFilter = ['cat-work']
         │
         ▼
selectFilteredTasks re-runs with AND logic:
- (status = in_progress OR complete) AND
- (category = cat-work)
         │
         ▼
Badge shows "2"
Task list shows only tasks matching BOTH filters
```

### 4. Clearing Filters

```
User clicks "Clear All" button
         │
         ▼
onClearAllFilters()
         │
         ▼
dispatch(clearAllFilters())
         │
         ▼
Redux updates:
- statusFilter = null
- categoryFilter = null
- priorityFilter = null
         │
         ▼
selectFilteredTasks re-runs
         │
         ▼
Returns all tasks (no filters active)
         │
         ▼
UI updates:
- Badge disappears
- "Clear All" button disappears
- Message disappears
- Task list shows all tasks
```

---

## Filter Logic Examples

### Example 1: Single Status Filter

**Input:**
- statusFilter: ['in_progress']
- categoryFilter: null
- priorityFilter: null

**Tasks:**
```
task-1: { status: 'in_progress', category: 'work', priority: 'A' }
task-2: { status: 'complete', category: 'work', priority: 'A' }
task-3: { status: 'in_progress', category: 'personal', priority: 'B' }
```

**Output:**
```
task-1: { status: 'in_progress', category: 'work', priority: 'A' }
task-3: { status: 'in_progress', category: 'personal', priority: 'B' }
```

**Reason:** Only tasks with status = 'in_progress'

---

### Example 2: Multiple Filters (AND Logic)

**Input:**
- statusFilter: ['in_progress', 'complete']
- categoryFilter: ['work']
- priorityFilter: ['A']

**Tasks:**
```
task-1: { status: 'in_progress', category: 'work', priority: 'A' }     ✓
task-2: { status: 'complete', category: 'work', priority: 'A' }        ✓
task-3: { status: 'in_progress', category: 'work', priority: 'B' }     ✗ (priority)
task-4: { status: 'in_progress', category: 'personal', priority: 'A' } ✗ (category)
task-5: { status: 'forward', category: 'work', priority: 'A' }         ✗ (status)
```

**Output:**
```
task-1: { status: 'in_progress', category: 'work', priority: 'A' }
task-2: { status: 'complete', category: 'work', priority: 'A' }
```

**Reason:**
- task-1: ✓ in_progress (✓) AND work (✓) AND A (✓)
- task-2: ✓ complete (✓) AND work (✓) AND A (✓)
- task-3: ✗ in_progress (✓) AND work (✓) AND B (✗)
- task-4: ✗ in_progress (✓) AND personal (✗) AND A (✓)
- task-5: ✗ forward (✗) AND work (✓) AND A (✓)

---

### Example 3: Uncategorized Tasks

**Input:**
- statusFilter: null
- categoryFilter: ['null', 'work']
- priorityFilter: null

**Tasks:**
```
task-1: { status: 'in_progress', category: 'work', priority: 'A' }     ✓
task-2: { status: 'complete', category: null, priority: 'B' }          ✓
task-3: { status: 'in_progress', category: 'personal', priority: 'C' } ✗
```

**Output:**
```
task-1: { status: 'in_progress', category: 'work', priority: 'A' }
task-2: { status: 'complete', category: null, priority: 'B' }
```

**Reason:**
- 'null' in categoryFilter includes tasks with categoryId = null
- 'work' in categoryFilter includes tasks with categoryId = 'work'

---

## CSS Class Structure

### FilterControls Component

```css
/* Container */
.bg-white.border.border-gray-200.rounded-lg.shadow-sm.mb-4

/* Header */
.flex.items-center.justify-between.px-4.py-3.border-b.border-gray-200

/* Toggle Button */
.flex.items-center.gap-2.text-sm.font-medium.text-gray-700.hover:text-gray-900

/* Badge */
.inline-flex.items-center.justify-center.px-2.py-0.5.text-xs.font-bold.text-white.bg-amber-500.rounded-full

/* Clear All Button */
.text-xs.text-amber-600.hover:text-amber-700.font-medium

/* Panel */
.px-4.py-3.grid.grid-cols-1.md:grid-cols-3.gap-4

/* Section Labels */
.block.text-xs.font-semibold.text-gray-700.uppercase.tracking-wide

/* Checkbox Labels */
.flex.items-center.gap-2.text-sm.text-gray-700.hover:bg-gray-50.px-2.py-1.rounded.cursor-pointer

/* Checkboxes */
.w-4.h-4.text-amber-600.border-gray-300.rounded.focus:ring-amber-500

/* Color Dots */
.w-3.h-3.rounded-full.flex-shrink-0
```

---

## Accessibility Features

### ARIA Attributes

```html
<!-- Toggle Button -->
<button
  aria-expanded="true/false"
  aria-controls="panel-id"
>
  Filters
</button>

<!-- Badge -->
<span aria-label="2 active filters">
  2
</span>

<!-- Checkbox Labels -->
<label for="status-in_progress">
  <input
    type="checkbox"
    id="status-in_progress"
    checked={isChecked}
  />
  In Progress
</label>

<!-- Filter Message -->
<div role="status" aria-live="polite">
  Showing 3 of 10 tasks
</div>
```

### Keyboard Navigation

```
Tab       → Move focus between filter checkboxes
Space     → Toggle focused checkbox
Enter     → Toggle focused checkbox (when on toggle button, expands panel)
Escape    → (Future) Close filter panel
```

---

## Performance Optimizations

### 1. Memoization with createSelector

```typescript
// Only re-computes when inputs change
export const selectFilteredTasks = createSelector(
  [tasks, statusFilter, categoryFilter, priorityFilter],
  (tasks, status, category, priority) => {
    // Filter logic
  }
);
```

**Benefits:**
- Prevents unnecessary re-renders
- Caches results
- Only runs when dependencies change

### 2. Component Memoization

```typescript
// FilterControls is memoized
export const FilterControls = memo(FilterControlsComponent);
```

**Benefits:**
- Skips re-render if props haven't changed
- Reduces reconciliation work

### 3. Efficient Filter Operations

```typescript
// Early return if no filters
if (!hasStatusFilter && !hasCategoryFilter && !hasPriorityFilter) {
  return tasks;
}

// Short-circuit evaluation
if (hasStatusFilter && !statusFilter.includes(task.status)) {
  return false; // Skip remaining checks
}
```

---

## Testing Strategy

### 1. Unit Tests (Reducers & Selectors)

```
filterSlice.test.ts
├── Test each reducer action
├── Test selectors with various inputs
└── Test edge cases (null, empty arrays)
```

### 2. Component Tests (UI)

```
FilterControls.test.tsx
├── Rendering tests (collapsed/expanded states)
├── Interaction tests (checkbox clicks)
├── Prop updates (checked states)
└── Accessibility tests (ARIA attributes)
```

### 3. Integration Tests (Redux)

```
FilterControlsContainer.test.tsx
├── Redux state reflection
├── Action dispatching
└── Store updates
```

### 4. Selector Tests (Filter Logic)

```
selectFilteredTasks.test.ts
├── Single filter scenarios
├── Multiple filter scenarios (AND logic)
├── Edge cases (empty, null, uncategorized)
└── Memoization behavior
```

---

## Common Use Cases

### Use Case 1: Focus on High Priority In-Progress Tasks

**User Action:**
1. Expand filters
2. Check "In Progress" (status)
3. Check "A - Vital" (priority)

**Result:**
- Shows only A-priority tasks that are in_progress
- Badge shows "2"
- Message: "Showing 5 of 20 tasks"

---

### Use Case 2: Review Completed Work Tasks

**User Action:**
1. Expand filters
2. Check "Complete" (status)
3. Check "Work" (category)

**Result:**
- Shows only completed work tasks
- Badge shows "2"
- Message: "Showing 8 of 20 tasks"

---

### Use Case 3: Triage Forward/Delegate Tasks

**User Action:**
1. Expand filters
2. Check "Forward" and "Delegate" (status)

**Result:**
- Shows tasks that need to be rescheduled or delegated
- Badge shows "1"
- Message: "Showing 3 of 20 tasks"

---

## Troubleshooting

### Issue: Filters not working

**Check:**
1. Is Redux store updated? (Redux DevTools)
2. Is selectFilteredTasks receiving correct inputs?
3. Is TaskListContainer using filtered tasks?

### Issue: Badge not showing

**Check:**
1. Is activeFilterCount > 0?
2. Are filters actually set (not null or empty array)?

### Issue: "Showing X of Y" message missing

**Check:**
1. Is isFiltersActive true?
2. Is totalTaskCount > 0?

---

## Conclusion

This visual guide provides a comprehensive overview of the filter system's architecture, data flow, and user interactions. The implementation follows React and Redux best practices with a focus on performance, accessibility, and user experience.
