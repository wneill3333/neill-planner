/**
 * User Type Definitions for Neill Planner
 *
 * Supports multi-user with role-based permissions.
 * Includes user settings and preferences.
 */

// =============================================================================
// Role Types
// =============================================================================

/**
 * User roles for access control
 * - admin: Full access to all users' data, can manage users
 * - standard: Access only to own data
 */
export type UserRole = 'admin' | 'standard';

/**
 * Role display labels
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  standard: 'Standard User',
} as const;

// =============================================================================
// User Interface
// =============================================================================

/**
 * Complete User entity
 */
export interface User {
  /** Unique identifier (from Firebase Auth) */
  id: string;
  /** User email address */
  email: string;
  /** Display name */
  displayName: string;
  /** User role for permissions */
  role: UserRole;
  /** Whether Google Calendar is connected */
  googleCalendarConnected: boolean;
  /** Account creation timestamp */
  createdAt: Date;
  /** Last login timestamp */
  lastLoginAt: Date;
}

// =============================================================================
// Settings Types
// =============================================================================

/**
 * Theme options
 */
export type ThemeOption = 'light' | 'dark' | 'system';

/**
 * Font size options
 */
export type FontSizeOption = 'small' | 'medium' | 'large';

/**
 * Week start day (0 = Sunday, 1 = Monday)
 */
export type WeekStartDay = 0 | 1;

/**
 * Platform type
 */
export type PlatformType = 'desktop' | 'android' | 'web';

/**
 * Notification preferences
 */
export interface NotificationSettings {
  /** Push notifications enabled */
  push: boolean;
  /** Email notifications enabled */
  email: boolean;
  /** In-app notifications enabled */
  inApp: boolean;
}

/**
 * Complete User Settings entity
 */
export interface UserSettings {
  /** User ID this settings belongs to */
  userId: string;
  /** UI theme preference */
  theme: ThemeOption;
  /** Font size preference */
  fontSize: FontSizeOption;
  /** Default priority letter for new tasks */
  defaultPriorityLetter: 'A' | 'B' | 'C' | 'D';
  /** Default reminder time (minutes before) */
  defaultReminderMinutes: number;
  /** User's timezone (IANA timezone string) */
  timezone: string;
  /** Day week starts on */
  weekStartsOn: WeekStartDay;
  /** Notification preferences */
  notifications: NotificationSettings;
  /** Whether Google Calendar sync is enabled */
  googleCalendarSyncEnabled: boolean;
  /** Current platform */
  platform: PlatformType;
}

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for updating user profile
 */
export interface UpdateUserInput {
  displayName?: string;
  role?: UserRole;
}

/**
 * Input for updating user settings
 */
export interface UpdateUserSettingsInput {
  theme?: ThemeOption;
  fontSize?: FontSizeOption;
  defaultPriorityLetter?: 'A' | 'B' | 'C' | 'D';
  defaultReminderMinutes?: number;
  timezone?: string;
  weekStartsOn?: WeekStartDay;
  notifications?: Partial<NotificationSettings>;
  googleCalendarSyncEnabled?: boolean;
}

// =============================================================================
// Utility Types & Constants
// =============================================================================

/**
 * Default user settings
 */
export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'userId'> = {
  theme: 'system',
  fontSize: 'medium',
  defaultPriorityLetter: 'B',
  defaultReminderMinutes: 15,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
  weekStartsOn: 0, // Sunday
  notifications: {
    push: true,
    email: false,
    inApp: true,
  },
  googleCalendarSyncEnabled: false,
  platform: 'web',
} as const;

/**
 * Default notification settings
 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  push: true,
  email: false,
  inApp: true,
} as const;

/**
 * Available theme options for UI
 */
export const THEME_OPTIONS: { value: ThemeOption; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

/**
 * Available font size options for UI
 */
export const FONT_SIZE_OPTIONS: { value: FontSizeOption; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
] as const;

/**
 * Week start options for UI
 */
export const WEEK_START_OPTIONS: { value: WeekStartDay; label: string }[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
] as const;
