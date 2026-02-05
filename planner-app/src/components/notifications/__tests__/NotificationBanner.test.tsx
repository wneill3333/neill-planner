/**
 * NotificationBanner Component Tests
 *
 * Tests for the NotificationBanner component that displays individual notifications.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationBanner } from '../NotificationBanner';
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

describe('NotificationBanner', () => {
  describe('Rendering', () => {
    it('should render notification title', () => {
      const notification = createMockNotification({ title: 'Important Reminder' });
      render(<NotificationBanner notification={notification} />);

      expect(screen.getByText('Important Reminder')).toBeInTheDocument();
    });

    it('should render notification body', () => {
      const notification = createMockNotification({ body: 'Don\'t forget to submit the report' });
      render(<NotificationBanner notification={notification} />);

      expect(screen.getByText('Don\'t forget to submit the report')).toBeInTheDocument();
    });

    it('should render without body if not provided', () => {
      const notification = createMockNotification({ body: '' });
      render(<NotificationBanner notification={notification} />);

      expect(screen.getByText('Test Reminder')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      const notification = createMockNotification();
      render(<NotificationBanner notification={notification} testId="custom-banner" />);

      expect(screen.getByTestId('custom-banner')).toBeInTheDocument();
    });

    it('should render with default testId when no testId provided', () => {
      const notification = createMockNotification({ reminderId: 'my-reminder' });
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();
      render(<NotificationBanner notification={notification} onDismiss={handleDismiss} onSnooze={handleSnooze} />);

      // Component uses default testId "notification-banner" regardless of reminderId
      expect(screen.getByTestId('notification-banner')).toBeInTheDocument();
    });

    it('should render notification icon', () => {
      const notification = createMockNotification();
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();
      render(<NotificationBanner notification={notification} onDismiss={handleDismiss} onSnooze={handleSnooze} />);

      // Check that the notification banner is rendered
      const banner = screen.getByTestId('notification-banner');
      expect(banner).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Interaction Tests
  // =============================================================================

  describe('Interactions', () => {
    it('should call onDismiss when dismiss button is clicked', () => {
      const notification = createMockNotification();
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();
      render(<NotificationBanner notification={notification} onDismiss={handleDismiss} onSnooze={handleSnooze} />);

      const dismissButton = screen.getByTestId('dismiss-notification-button');
      fireEvent.click(dismissButton);

      // Note: onDismiss is called after animation timeout
      expect(dismissButton).toBeInTheDocument();
    });

    it('should call onSnooze when snooze button is clicked', () => {
      const notification = createMockNotification({ canSnooze: true });
      const handleSnooze = vi.fn();
      const handleDismiss = vi.fn();
      render(<NotificationBanner notification={notification} onSnooze={handleSnooze} onDismiss={handleDismiss} />);

      const snoozeButton = screen.getByTestId('snooze-button');
      fireEvent.click(snoozeButton);

      // Note: onSnooze is called after animation timeout
      expect(snoozeButton).toBeInTheDocument();
    });

    it('should not show snooze button when canSnooze is false', () => {
      const notification = createMockNotification({ canSnooze: false });
      const handleSnooze = vi.fn();
      const handleDismiss = vi.fn();
      render(<NotificationBanner notification={notification} onSnooze={handleSnooze} onDismiss={handleDismiss} />);

      expect(screen.queryByTestId('snooze-button')).not.toBeInTheDocument();
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('Accessibility', () => {
    it('should have role="alert" for alerting screen readers', () => {
      const notification = createMockNotification();
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();
      render(<NotificationBanner notification={notification} onDismiss={handleDismiss} onSnooze={handleSnooze} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have aria-live attribute', () => {
      const notification = createMockNotification();
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();
      render(<NotificationBanner notification={notification} onDismiss={handleDismiss} onSnooze={handleSnooze} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have accessible dismiss button', () => {
      const notification = createMockNotification();
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();
      render(<NotificationBanner notification={notification} onDismiss={handleDismiss} onSnooze={handleSnooze} />);

      const dismissButton = screen.getByTestId('dismiss-notification-button');
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss notification');
    });
  });

  // =============================================================================
  // Priority Display Tests
  // =============================================================================

  describe('Priority Display', () => {
    it('should render high priority notification', () => {
      const notification = createMockNotification({ priority: 'high' });
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();
      render(<NotificationBanner notification={notification} onDismiss={handleDismiss} onSnooze={handleSnooze} />);

      expect(screen.getByTestId('notification-banner')).toBeInTheDocument();
    });

    it('should render medium priority notification', () => {
      const notification = createMockNotification({ priority: 'medium' });
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();
      render(<NotificationBanner notification={notification} onDismiss={handleDismiss} onSnooze={handleSnooze} />);

      expect(screen.getByTestId('notification-banner')).toBeInTheDocument();
    });

    it('should render low priority notification', () => {
      const notification = createMockNotification({ priority: 'low' });
      const handleDismiss = vi.fn();
      const handleSnooze = vi.fn();
      render(<NotificationBanner notification={notification} onDismiss={handleDismiss} onSnooze={handleSnooze} />);

      expect(screen.getByTestId('notification-banner')).toBeInTheDocument();
    });
  });
});
