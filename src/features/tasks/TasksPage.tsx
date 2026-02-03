/**
 * TasksPage Component
 *
 * Main page for viewing and managing tasks.
 * Wraps the DailyView component in the AppLayout.
 */

import { AppLayout } from '../../components/layout/AppLayout';
import { DailyView } from './DailyView';

// =============================================================================
// Types
// =============================================================================

export interface TasksPageProps {
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * TasksPage - Main tasks view page
 *
 * Features:
 * - AppLayout wrapper with header and user menu
 * - DailyView with tabs for Tasks/Calendar/Notes
 * - Date navigation
 * - Task management
 *
 * @example
 * ```tsx
 * <TasksPage />
 * ```
 */
export function TasksPage({ testId }: TasksPageProps) {
  return (
    <AppLayout className="max-w-4xl px-4 py-6 mx-auto sm:py-8">
      <DailyView testId={testId || 'tasks-page'} />
    </AppLayout>
  );
}

export default TasksPage;
