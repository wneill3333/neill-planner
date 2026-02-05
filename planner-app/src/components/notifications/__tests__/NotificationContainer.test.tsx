/**
 * NotificationContainer Component Tests
 *
 * Tests for the NotificationContainer component that displays all active notifications.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationContainer } from '../NotificationContainer';
import type { ReminderNotification } from '../../../types';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockNotification(overrides: Partial<ReminderNotification> = {}): ReminderNotification {
  return {
    reminderId: 'reminder-1',
    title: 'Test Reminder',
    body: 'This is a test notification',
    itemType: 'task' as const,
    itemId: 'task-1',
    scheduledTime: new Date('2024-01-15T14:00:00Z'),
    triggeredAt: new Date('2024-01-15T13:45:00Z'),
    canSnooze: true,
    isDismissed: false,
    priority: 'medium' as const,
    ...overrides,
  };
}

// =============================================================================
// Rendering Tests
// =============================================================================

describe('NotificationContainer', () => {
  describe('Rendering', () => {
    it('should render without crashing with empty notifications', () => {
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();
      const result = render(
        <NotificationContainer
          notifications={[]}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
        />
      );

      // Component returns null when there are no notifications
      expect(result.container.firstChild).toBeNull();
    });

    it('should display a single notification', () => {
      const notification = createMockNotification({ title: 'Single Notification' });
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();

      render(
        <NotificationContainer
          notifications={[notification]}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
        />
      );

      expect(screen.getByText('Single Notification')).toBeInTheDocument();
    });

    it('should display multiple notifications', () => {
      const notifications = [
        createMockNotification({ reminderId: 'r1', title: 'First Notification' }),
        createMockNotification({ reminderId: 'r2', title: 'Second Notification' }),
        createMockNotification({ reminderId: 'r3', title: 'Third Notification' }),
      ];
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();

      render(
        <NotificationContainer
          notifications={notifications}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
        />
      );

      expect(screen.getByText('First Notification')).toBeInTheDocument();
      expect(screen.getByText('Second Notification')).toBeInTheDocument();
      expect(screen.getByText('Third Notification')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      const notification = createMockNotification();
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();

      render(
        <NotificationContainer
          notifications={[notification]}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
          testId="custom-container"
        />
      );

      expect(screen.getByTestId('custom-container')).toBeInTheDocument();
    });

    it('should render with default testId', () => {
      const notification = createMockNotification();
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();

      render(
        <NotificationContainer
          notifications={[notification]}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
        />
      );

      expect(screen.getByTestId('notification-container')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('Accessibility', () => {
    it('should have accessible structure', () => {
      const notification = createMockNotification();
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();

      render(
        <NotificationContainer
          notifications={[notification]}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
        />
      );

      const container = screen.getByTestId('notification-container');
      expect(container).toBeInTheDocument();
    });

    it('should render alerts for each notification', () => {
      const notifications = [
        createMockNotification({ reminderId: 'r1', title: 'First' }),
        createMockNotification({ reminderId: 'r2', title: 'Second' }),
      ];
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();

      render(
        <NotificationContainer
          notifications={notifications}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
        />
      );

      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(2);
    });
  });

  // =============================================================================
  // Position and Layout Tests
  // =============================================================================

  describe('Position and Layout', () => {
    it('should be positioned in a fixed location', () => {
      const notification = createMockNotification();
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();

      render(
        <NotificationContainer
          notifications={[notification]}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
        />
      );

      const container = screen.getByTestId('notification-container');
      // Check that container has fixed positioning class
      expect(container.className).toMatch(/fixed/);
    });

    it('should stack notifications vertically', () => {
      const notifications = [
        createMockNotification({ reminderId: 'r1', title: 'First' }),
        createMockNotification({ reminderId: 'r2', title: 'Second' }),
      ];
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();

      render(
        <NotificationContainer
          notifications={notifications}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
        />
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Empty State Tests
  // =============================================================================

  describe('Empty State', () => {
    it('should handle empty notifications array gracefully', () => {
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();

      const result = render(
        <NotificationContainer
          notifications={[]}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
        />
      );

      // Component returns null for empty notifications
      expect(result.container.firstChild).toBeNull();
    });

    it('should show overflow message for many notifications', () => {
      const notifications = Array.from({ length: 5 }, (_, i) =>
        createMockNotification({
          reminderId: `r${i}`,
          title: `Notification ${i}`,
        })
      );
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();

      render(
        <NotificationContainer
          notifications={notifications}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
          maxVisible={3}
        />
      );

      // Should show overflow message for 2 hidden notifications
      expect(screen.getByText(/\+2 more notification/)).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Props Integration Tests
  // =============================================================================

  describe('Props Integration', () => {
    it('should pass onDismiss to child components', () => {
      const notification = createMockNotification({ title: 'Test' });
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();

      render(
        <NotificationContainer
          notifications={[notification]}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
        />
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByTestId('dismiss-notification-button')).toBeInTheDocument();
    });

    it('should limit visible notifications based on maxVisible prop', () => {
      const notifications = Array.from({ length: 5 }, (_, i) =>
        createMockNotification({
          reminderId: `r${i}`,
          title: `Notification ${i}`,
        })
      );
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();

      render(
        <NotificationContainer
          notifications={notifications}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
          maxVisible={2}
        />
      );

      // Should render exactly 2 notifications
      expect(screen.getByText('Notification 0')).toBeInTheDocument();
      expect(screen.getByText('Notification 1')).toBeInTheDocument();
      expect(screen.queryByText('Notification 2')).not.toBeInTheDocument();
    });
  });
});
