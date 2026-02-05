/**
 * SettingsPage Component
 *
 * Main settings page for user preferences.
 * Includes theme, font size, defaults, timezone, and notification preferences.
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAuth } from '../auth/useAuth';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectSettings,
  selectSettingsLoading,
  selectSettingsSaving,
  selectSettingsError,
  fetchSettings,
  saveSettings,
} from './index';
import type { UpdateUserSettingsInput, NotificationSettings } from '../../types';
import {
  THEME_OPTIONS,
  FONT_SIZE_OPTIONS,
  WEEK_START_OPTIONS,
  DEFAULT_USER_SETTINGS,
} from '../../types';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { AppLayout } from '../../components/layout/AppLayout';
import type { AppView } from '../../components/layout/Header';
import { GoogleCalendarSettings } from '../../components/googleCalendar/GoogleCalendarSettings';

// =============================================================================
// Types
// =============================================================================

interface FormData {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  defaultPriorityLetter: 'A' | 'B' | 'C' | 'D';
  defaultReminderMinutes: number;
  timezone: string;
  weekStartsOn: 0 | 1;
  notifications: NotificationSettings;
  googleCalendarSyncEnabled: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const PRIORITY_OPTIONS = [
  { value: 'A', label: 'A - Vital (Must do today)' },
  { value: 'B', label: 'B - Important (Should do today)' },
  { value: 'C', label: 'C - Optional (Nice to do)' },
  { value: 'D', label: 'D - Delegate' },
];

const REMINDER_OPTIONS = [
  { value: '5', label: '5 minutes before' },
  { value: '10', label: '10 minutes before' },
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '120', label: '2 hours before' },
  { value: '1440', label: '1 day before' },
];

// Get available timezones
const getTimezoneOptions = (): { value: string; label: string }[] => {
  try {
    const timezones = Intl.supportedValuesOf('timeZone');
    return timezones.map((tz) => ({ value: tz, label: tz }));
  } catch {
    // Fallback if browser doesn't support Intl.supportedValuesOf
    return [
      { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
      { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
      { value: 'America/Denver', label: 'America/Denver (MST/MDT)' },
      { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
      { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
      { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
      { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
      { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT/AEST)' },
    ];
  }
};

// =============================================================================
// Component Props
// =============================================================================

export interface SettingsPageProps {
  /** Current active view */
  currentView?: AppView;
  /** Callback when navigation item is clicked */
  onNavigate?: (view: AppView) => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * SettingsPage - User settings and preferences
 *
 * Allows users to configure theme, font size, defaults, and notification preferences.
 */
export function SettingsPage({ currentView = 'settings', onNavigate }: SettingsPageProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const settings = useAppSelector(selectSettings);
  const loading = useAppSelector(selectSettingsLoading);
  const saving = useAppSelector(selectSettingsSaving);
  const error = useAppSelector(selectSettingsError);

  const [formData, setFormData] = useState<FormData>({
    theme: DEFAULT_USER_SETTINGS.theme,
    fontSize: DEFAULT_USER_SETTINGS.fontSize,
    defaultPriorityLetter: DEFAULT_USER_SETTINGS.defaultPriorityLetter,
    defaultReminderMinutes: DEFAULT_USER_SETTINGS.defaultReminderMinutes,
    timezone: DEFAULT_USER_SETTINGS.timezone,
    weekStartsOn: DEFAULT_USER_SETTINGS.weekStartsOn,
    notifications: DEFAULT_USER_SETTINGS.notifications,
    googleCalendarSyncEnabled: DEFAULT_USER_SETTINGS.googleCalendarSyncEnabled,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [timezoneOptions] = useState(getTimezoneOptions());

  // Load settings on mount
  useEffect(() => {
    if (user) {
      dispatch(fetchSettings(user.id));
    }
  }, [dispatch, user]);

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        theme: settings.theme,
        fontSize: settings.fontSize,
        defaultPriorityLetter: settings.defaultPriorityLetter,
        defaultReminderMinutes: settings.defaultReminderMinutes,
        timezone: settings.timezone,
        weekStartsOn: settings.weekStartsOn,
        notifications: settings.notifications,
        googleCalendarSyncEnabled: settings.googleCalendarSyncEnabled,
      });
    }
  }, [settings]);

  // Handle field changes
  const handleChange = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setSaveSuccess(false);
    },
    []
  );

  // Handle notification preference changes
  const handleNotificationChange = useCallback(
    (key: keyof NotificationSettings, value: boolean) => {
      setFormData((prev) => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: value,
        },
      }));
      setSaveSuccess(false);
    },
    []
  );

  // Handle form submit
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!user) return;

      const updates: UpdateUserSettingsInput = {
        theme: formData.theme,
        fontSize: formData.fontSize,
        defaultPriorityLetter: formData.defaultPriorityLetter,
        defaultReminderMinutes: formData.defaultReminderMinutes,
        timezone: formData.timezone,
        weekStartsOn: formData.weekStartsOn,
        notifications: formData.notifications,
        googleCalendarSyncEnabled: formData.googleCalendarSyncEnabled,
      };

      const result = await dispatch(saveSettings({ userId: user.id, updates }));

      if (saveSettings.fulfilled.match(result)) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    },
    [dispatch, user, formData]
  );

  if (loading) {
    return (
      <AppLayout currentView={currentView} onNavigate={onNavigate}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentView={currentView} onNavigate={onNavigate}>
      <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your preferences and notifications</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Appearance Section */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Appearance</h2>

          <div className="space-y-4">
            <Select
              label="Theme"
              value={formData.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              options={THEME_OPTIONS}
              helperText="Choose your preferred color scheme"
            />

            <Select
              label="Font Size"
              value={formData.fontSize}
              onChange={(e) => handleChange('fontSize', e.target.value)}
              options={FONT_SIZE_OPTIONS}
              helperText="Adjust text size for better readability"
            />
          </div>
        </section>

        {/* Defaults Section */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Defaults</h2>

          <div className="space-y-4">
            <Select
              label="Default Priority"
              value={formData.defaultPriorityLetter}
              onChange={(e) => handleChange('defaultPriorityLetter', e.target.value)}
              options={PRIORITY_OPTIONS}
              helperText="Default priority for new tasks"
            />

            <Select
              label="Default Reminder Time"
              value={String(formData.defaultReminderMinutes)}
              onChange={(e) => handleChange('defaultReminderMinutes', Number(e.target.value))}
              options={REMINDER_OPTIONS}
              helperText="Default reminder time for new events and tasks"
            />
          </div>
        </section>

        {/* Date & Time Section */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Date & Time</h2>

          <div className="space-y-4">
            <Select
              label="Timezone"
              value={formData.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              options={timezoneOptions}
              helperText="Your local timezone for accurate reminders"
            />

            <Select
              label="Week Starts On"
              value={String(formData.weekStartsOn)}
              onChange={(e) => handleChange('weekStartsOn', Number(e.target.value) as 0 | 1)}
              options={WEEK_START_OPTIONS}
              helperText="First day of the week in calendar views"
            />
          </div>
        </section>

        {/* Notifications Section */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Notifications</h2>

          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.notifications.push}
                onChange={(e) => handleNotificationChange('push', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Push Notifications</div>
                <div className="text-sm text-gray-500">
                  Receive browser push notifications for reminders
                </div>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.notifications.email}
                onChange={(e) => handleNotificationChange('email', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Email Notifications</div>
                <div className="text-sm text-gray-500">
                  Receive email notifications for reminders
                </div>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.notifications.inApp}
                onChange={(e) => handleNotificationChange('inApp', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">In-App Notifications</div>
                <div className="text-sm text-gray-500">
                  Show notification banners within the app
                </div>
              </div>
            </label>
          </div>
        </section>

        {/* Integrations Section */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Integrations</h2>

          <div className="space-y-6">
            {/* Google Calendar Full Settings */}
            <GoogleCalendarSettings />

            {/* Auto-sync toggle */}
            <div className="border-t border-gray-200 pt-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.googleCalendarSyncEnabled}
                  onChange={(e) => handleChange('googleCalendarSyncEnabled', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Auto-sync Events
                  </div>
                  <div className="text-sm text-gray-500">
                    Automatically sync events with Google Calendar in the background
                  </div>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {saveSuccess && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-800">Settings saved successfully!</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
    </AppLayout>
  );
}
