/**
 * Reminder Utility Functions
 *
 * Shared utility functions for reminder components.
 */

import type { ReminderType } from '../types/reminder.types';

/**
 * Get icon emoji for reminder type
 */
export function getReminderTypeIcon(type: ReminderType): string {
  const icons: Record<ReminderType, string> = {
    push: '🔔',
    email: '📧',
    inApp: '💬',
  };
  return icons[type];
}

/**
 * Format minutes before as human-readable string
 */
export function formatMinutesBefore(minutes: number): string {
  if (minutes === 0) {
    return 'At time of event';
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} before`;
  }

  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} before`;
    }
    return `${hours}h ${remainingMinutes}m before`;
  }

  const days = Math.floor(minutes / 1440);
  const remainingHours = Math.floor((minutes % 1440) / 60);
  if (remainingHours === 0) {
    return `${days} day${days !== 1 ? 's' : ''} before`;
  }
  return `${days}d ${remainingHours}h before`;
}
