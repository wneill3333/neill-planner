# Notification Components

## Overview

This directory contains components for displaying notification banners and managing notification permissions in the Neill Planner app.

## Components

### NotificationPermissionBanner

Banner shown when notifications are not enabled. Includes "Enable Notifications" button and dismiss option. Shows at top of app.

**Props:**
- `onEnable: () => Promise<boolean>` - Callback when user enables notifications
- `onDismiss?: () => void` - Callback when user dismisses the banner
- `show?: boolean` - Whether to show the banner initially
- `testId?: string` - Test ID for testing

**Example Usage in App.tsx:**

```tsx
import { NotificationPermissionBanner } from './components/notifications';

function App() {
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);

  useEffect(() => {
    // Check if notifications are supported and not granted
    if ('Notification' in window && Notification.permission === 'default') {
      setShowPermissionBanner(true);
    }
  }, []);

  const handleEnableNotifications = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setShowPermissionBanner(false);
      // Register FCM token, etc.
      return true;
    }
    return false;
  };

  return (
    <>
      {showPermissionBanner && (
        <NotificationPermissionBanner
          onEnable={handleEnableNotifications}
          onDismiss={() => setShowPermissionBanner(false)}
        />
      )}
      {/* Rest of app */}
    </>
  );
}
```

### NotificationBanner

Toast-style notification at top of screen. Shows reminder title and time, with snooze and dismiss options. Auto-dismisses after 10 seconds with slide-down animation.

**Props:**
- `notification: ReminderNotification` - Notification to display
- `onDismiss: (notificationId: string) => void` - Callback when notification is dismissed
- `onSnooze: (notificationId: string, minutes: number) => void` - Callback when notification is snoozed
- `autoDismissSeconds?: number` - Auto-dismiss duration in seconds (default: 10)
- `testId?: string` - Test ID for testing

**Example Usage:**

```tsx
import { NotificationBanner } from './components/notifications';

const notification: ReminderNotification = {
  reminderId: 'reminder-123',
  title: 'Team Meeting',
  body: 'Meeting starts in 15 minutes',
  itemType: 'event',
  itemId: 'event-456',
  scheduledTime: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
  triggeredAt: new Date(),
  canSnooze: true,
  isDismissed: false,
  priority: 'high',
};

<NotificationBanner
  notification={notification}
  onDismiss={(id) => dismissNotification(id)}
  onSnooze={(id, minutes) => snoozeNotification(id, minutes)}
  autoDismissSeconds={10}
/>
```

### NotificationContainer

Container that renders active notifications. Stacks multiple notifications vertically.

**Props:**
- `notifications: ReminderNotification[]` - Array of active notifications to display
- `onDismiss: (notificationId: string) => void` - Callback when a notification is dismissed
- `onSnooze: (notificationId: string, minutes: number) => void` - Callback when a notification is snoozed
- `maxVisible?: number` - Maximum number of notifications to show at once (default: 3)
- `testId?: string` - Test ID for testing

**Example Usage in App.tsx:**

```tsx
import { NotificationContainer } from './components/notifications';
import { useAppSelector } from './store/hooks';

function App() {
  // Get active notifications from Redux store
  const activeNotifications = useAppSelector(
    (state) => state.notifications.activeNotifications
  );

  const handleDismissNotification = (notificationId: string) => {
    // Dispatch action to dismiss notification
    dispatch(dismissNotification(notificationId));
  };

  const handleSnoozeNotification = (notificationId: string, minutes: number) => {
    // Dispatch action to snooze notification
    dispatch(snoozeNotification({ notificationId, minutes }));
  };

  return (
    <>
      <NotificationContainer
        notifications={activeNotifications}
        onDismiss={handleDismissNotification}
        onSnooze={handleSnoozeNotification}
        maxVisible={3}
      />
      {/* Rest of app */}
    </>
  );
}
```

## Integration Guide

### 1. App-Level Integration

Add NotificationContainer to your main App component:

```tsx
// App.tsx
import { NotificationContainer, NotificationPermissionBanner } from './components/notifications';

export function App() {
  return (
    <>
      {/* Permission banner (shown when notifications not enabled) */}
      <NotificationPermissionBanner
        onEnable={handleEnableNotifications}
        show={notificationPermission === 'default'}
      />

      {/* Active notifications */}
      <NotificationContainer
        notifications={activeNotifications}
        onDismiss={handleDismiss}
        onSnooze={handleSnooze}
      />

      {/* Main app content */}
      <main>{/* ... */}</main>
    </>
  );
}
```

### 2. Redux State Management

Create a notifications slice to manage active notifications:

```tsx
// features/notifications/notificationsSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { ReminderNotification } from '../../types/reminder.types';

interface NotificationsState {
  activeNotifications: ReminderNotification[];
  permissionStatus: 'granted' | 'denied' | 'default' | 'unsupported';
}

const initialState: NotificationsState = {
  activeNotifications: [],
  permissionStatus: 'default',
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.activeNotifications.push(action.payload);
    },
    dismissNotification: (state, action) => {
      state.activeNotifications = state.activeNotifications.filter(
        (n) => n.reminderId !== action.payload
      );
    },
    setPermissionStatus: (state, action) => {
      state.permissionStatus = action.payload;
    },
  },
});

export const { addNotification, dismissNotification, setPermissionStatus } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;
```

### 3. Notification Permission Handling

```tsx
// utils/notifications.ts
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function checkNotificationPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}
```

### 4. Firebase Cloud Messaging (FCM) Integration

For push notifications, integrate Firebase Cloud Messaging:

```tsx
// services/firebase/messaging.service.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export async function registerFCMToken(userId: string): Promise<string | null> {
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_KEY',
    });

    // Save token to Firestore
    await saveDeviceToken(userId, token);

    return token;
  } catch (error) {
    console.error('Failed to register FCM token:', error);
    return null;
  }
}

export function listenForMessages(onNotification: (payload: any) => void) {
  const messaging = getMessaging();

  return onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    onNotification(payload);
  });
}
```

## Testing

All components include test IDs for easy testing:

```tsx
// Example test
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationBanner } from './NotificationBanner';

test('dismisses notification when close button is clicked', () => {
  const onDismiss = jest.fn();

  render(
    <NotificationBanner
      notification={mockNotification}
      onDismiss={onDismiss}
      onSnooze={jest.fn()}
    />
  );

  fireEvent.click(screen.getByTestId('dismiss-notification-button'));

  expect(onDismiss).toHaveBeenCalledWith(mockNotification.reminderId);
});
```

## Accessibility

All components follow accessibility best practices:

- ARIA roles and labels
- Keyboard navigation support
- Focus management
- Screen reader announcements
- Color contrast compliance
