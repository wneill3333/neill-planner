/**
 * Neill Planner - Main Application Component
 *
 * A Franklin-Covey methodology based productivity application
 * for task prioritization and daily planning.
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth, LoginPage } from './features/auth';
import { TasksPage } from './features/tasks';
import { CategoryManagementPage } from './features/categories/CategoryManagementPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { AdminPage } from './features/admin';
import { Spinner } from './components/common';
import type { AppView } from './components/layout/Header';
import type { SnoozeOption } from './types';
import { NotificationContainer } from './components/notifications';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { dismissReminderAsync, snoozeReminderAsync } from './features/reminders/reminderThunks';
import { selectUndismissedNotifications } from './features/reminders/reminderSlice';
import { fetchSettings } from './features/settings';
import { useTheme, useFontSize } from './features/settings/hooks';

function App() {
  const { user, loading } = useAuth();
  const dispatch = useAppDispatch();
  const [currentView, setCurrentView] = useState<AppView>('tasks');

  // Get active notifications from Redux
  const activeNotifications = useAppSelector(selectUndismissedNotifications);

  // Apply theme and font size settings
  useTheme();
  useFontSize();

  // Load user settings when authenticated
  useEffect(() => {
    if (user) {
      dispatch(fetchSettings(user.id));
    }
  }, [dispatch, user]);

  const handleNavigate = useCallback((view: AppView) => {
    setCurrentView(view);
  }, []);

  const handleDismissNotification = useCallback((notificationId: string) => {
    if (!user) return;
    dispatch(dismissReminderAsync({ reminderId: notificationId, userId: user.id }));
  }, [dispatch, user]);

  const handleSnoozeNotification = useCallback((notificationId: string, minutes: SnoozeOption) => {
    if (!user) return;
    dispatch(snoozeReminderAsync({ reminderId: notificationId, snoozeMinutes: minutes, userId: user.id }));
  }, [dispatch, user]);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Render the current view with notification components
  let mainContent;
  switch (currentView) {
    case 'categories':
      mainContent = (
        <CategoryManagementPage
          currentView={currentView}
          onNavigate={handleNavigate}
        />
      );
      break;
    case 'settings':
      mainContent = (
        <SettingsPage
          currentView={currentView}
          onNavigate={handleNavigate}
        />
      );
      break;
    case 'admin':
      // Guard: only render for admin users, fall through to tasks otherwise
      if (user.role === 'admin') {
        mainContent = (
          <AdminPage
            currentView={currentView}
            onNavigate={handleNavigate}
          />
        );
        break;
      }
      // Falls through to default (tasks) if not admin
    // eslint-disable-next-line no-fallthrough
    case 'tasks':
    default:
      mainContent = (
        <TasksPage
          currentView={currentView}
          onNavigate={handleNavigate}
        />
      );
  }

  return (
    <>
      {mainContent}
      <NotificationContainer
        notifications={activeNotifications}
        onDismiss={handleDismissNotification}
        onSnooze={handleSnoozeNotification}
      />
    </>
  );
}

export default App;
