import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import { ErrorBoundary } from './components/common';
import { AuthProvider } from './features/auth';
import { cleanupDuplicateExceptions, hardDeleteTask } from './features/tasks/taskThunks';
import { auth } from './services/firebase/config';
import './index.css';
import App from './App.tsx';

// Expose debug utilities in development mode
if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__DEBUG__ = {
    store,
    cleanupDuplicateExceptions: () => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error('Not logged in - cannot run cleanup');
        return;
      }
      console.log('Running duplicate exception cleanup for user:', userId);
      return store.dispatch(cleanupDuplicateExceptions({ userId }));
    },
    listRecurringTasks: () => {
      const state = store.getState();
      const tasks = Object.values(state.tasks.recurringParentTasks) as Array<{
        id: string;
        title: string;
        priority: { letter: string; number: number };
        scheduledDate: Date | string;
        recurrence?: { type: string; exceptions: Array<Date | string> };
      }>;

      // Group by title to find duplicates
      const byTitle: Record<string, typeof tasks> = {};
      tasks.forEach((task) => {
        if (!byTitle[task.title]) {
          byTitle[task.title] = [];
        }
        byTitle[task.title].push(task);
      });

      console.log('%c=== RECURRING TASKS ===', 'color: blue; font-weight: bold; font-size: 14px');

      // Show duplicates first
      const duplicates = Object.entries(byTitle).filter(([, list]) => list.length > 1);
      if (duplicates.length > 0) {
        console.log('%c⚠️ DUPLICATES FOUND:', 'color: red; font-weight: bold');
        duplicates.forEach(([title, list]) => {
          console.log(`%c  "${title}" has ${list.length} copies:`, 'color: orange; font-weight: bold');
          list.forEach((task) => {
            const startDate = task.scheduledDate instanceof Date
              ? task.scheduledDate.toISOString().split('T')[0]
              : String(task.scheduledDate).split('T')[0];
            const excCount = task.recurrence?.exceptions?.length || 0;
            console.log(`    ID: ${task.id}`);
            console.log(`      Priority: ${task.priority.letter}${task.priority.number}, Started: ${startDate}, Exceptions: ${excCount}`);
          });
        });
      }

      // Show all tasks
      console.log('%c\nAll recurring tasks:', 'color: blue; font-weight: bold');
      tasks.sort((a, b) => a.title.localeCompare(b.title)).forEach((task) => {
        const startDate = task.scheduledDate instanceof Date
          ? task.scheduledDate.toISOString().split('T')[0]
          : String(task.scheduledDate).split('T')[0];
        console.log(`  ${task.priority.letter}${task.priority.number} - "${task.title}" (ID: ${task.id}, Start: ${startDate})`);
      });

      return { total: tasks.length, duplicates: duplicates.length };
    },
    deleteTask: (taskId: string) => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error('Not logged in - cannot delete task');
        return;
      }
      if (!taskId) {
        console.error('Please provide a task ID: window.__DEBUG__.deleteTask("task-id-here")');
        return;
      }
      console.log(`Deleting task ${taskId}...`);
      return store.dispatch(hardDeleteTask({ taskId, userId })).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          console.log('%c✓ Task deleted successfully', 'color: green; font-weight: bold');
          console.log('Refresh the page to see the changes');
        } else {
          console.error('Failed to delete task:', result.payload);
        }
        return result;
      });
    },
  };
  console.log('[Dev] Debug utilities available at window.__DEBUG__');
  console.log('[Dev] - listRecurringTasks() : List all recurring tasks and find duplicates');
  console.log('[Dev] - deleteTask("id") : Permanently delete a task by ID');
  console.log('[Dev] - cleanupDuplicateExceptions() : Remove duplicate exception dates');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
