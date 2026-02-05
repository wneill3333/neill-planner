/**
 * Task Components Index
 *
 * Central export point for all task-related components.
 */

export { StatusSymbol, type StatusSymbolProps } from './StatusSymbol';
export { TaskItem, type TaskItemProps } from './TaskItem';
export { TaskPriorityGroup, type TaskPriorityGroupProps } from './TaskPriorityGroup';
export { TaskList, type TaskListProps } from './TaskList';

// Drag and drop components (legacy grouped list)
export { SortableTaskItem, type SortableTaskItemProps } from './SortableTaskItem';
export { SortablePriorityGroup, type SortablePriorityGroupProps } from './SortablePriorityGroup';
export { DraggableTaskList, type DraggableTaskListProps } from './DraggableTaskList';

// Forms
export { TaskForm, type TaskFormProps } from './TaskForm';
export { RecurrenceForm, type RecurrenceFormProps } from './RecurrenceForm';
export { AddTaskFormSimple, type AddTaskFormSimpleProps } from './AddTaskFormSimple';
export { RecurrenceFormSimple, type RecurrenceFormSimpleProps } from './RecurrenceFormSimple';

// Dialogs
export { RecurringDeleteDialog, type RecurringDeleteDialogProps } from './RecurringDeleteDialog';
export { RecurringTasksManager, type RecurringTasksManagerProps } from './RecurringTasksManager';

// Filters
export { FilterControls, type FilterControlsProps } from './FilterControls';
export { FilterControlsContainer, type FilterControlsContainerProps } from './FilterControlsContainer';

// Redesigned components (flat list)
export { StatusDropdown, type StatusDropdownProps } from './StatusDropdown';
export { ForwardDateModal, type ForwardDateModalProps } from './ForwardDateModal';
export { TaskItemRedesign, type TaskItemRedesignProps } from './TaskItemRedesign';
export { FlatTaskList, type FlatTaskListProps } from './FlatTaskList';
export { SortableFlatTaskItem, type SortableFlatTaskItemProps } from './SortableFlatTaskItem';
export { DraggableFlatTaskList, type DraggableFlatTaskListProps } from './DraggableFlatTaskList';
export { StatusLegend, type StatusLegendProps } from './StatusLegend';
