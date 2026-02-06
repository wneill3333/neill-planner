/**
 * EventForm Component Tests
 *
 * Tests the EventForm component's rendering, validation, and submission behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventForm } from '../EventForm';
import type { Event, Category, CreateEventInput, RecurrencePattern } from '../../../types';

// =============================================================================
// Test Data
// =============================================================================

const mockCategories: Category[] = [
  {
    id: 'cat1',
    userId: 'user1',
    name: 'Work',
    color: '#3b82f6',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  },
  {
    id: 'cat2',
    userId: 'user1',
    name: 'Personal',
    color: '#10b981',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  },
];

const mockRecurrencePattern: RecurrencePattern = {
  type: 'daily',
  interval: 1,
  daysOfWeek: [],
  dayOfMonth: null,
  monthOfYear: null,
  endCondition: {
    type: 'never',
    endDate: null,
    maxOccurrences: null,
  },
  exceptions: [],
};

const mockEvent: Event = {
  id: 'event1',
  userId: 'user1',
  title: 'Team Meeting',
  description: 'Weekly team sync',
  categoryId: 'cat1',
  startTime: new Date(2024, 0, 15, 10, 0, 0), // Jan 15, 2024 10:00
  endTime: new Date(2024, 0, 15, 11, 0, 0),   // Jan 15, 2024 11:00
  location: 'Conference Room A',
  isConfidential: false,
  alternateTitle: null,
  recurrence: null,
  linkedNoteIds: [],
  linkedTaskIds: [],
  googleCalendarId: null,
  isRecurringInstance: false,
  recurringParentId: null,
  instanceDate: null,
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-10'),
  deletedAt: null,
};

// =============================================================================
// Helpers
// =============================================================================

/**
 * Set a TimePickerDropdown to a specific time by selecting hour, minute, and AM/PM
 */
async function setTime(
  user: ReturnType<typeof userEvent.setup>,
  testIdPrefix: string,
  hour12: number,
  minute: number,
  period: 'AM' | 'PM'
) {
  const hourSelect = screen.getByTestId(`${testIdPrefix}-hour`);
  const minuteSelect = screen.getByTestId(`${testIdPrefix}-minute`);

  await user.selectOptions(hourSelect, String(hour12));
  await user.selectOptions(minuteSelect, String(minute));

  const periodButton = screen.getByTestId(`${testIdPrefix}-${period.toLowerCase()}`);
  await user.click(periodButton);
}

// =============================================================================
// Tests
// =============================================================================

describe('EventForm', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('renders all required form fields in create mode', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Form header
      expect(screen.getByText('Create New Event')).toBeInTheDocument();

      // Required fields
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByTestId('event-date')).toBeInTheDocument();
      expect(screen.getByTestId('event-start-time')).toBeInTheDocument();
      expect(screen.getByTestId('event-end-time')).toBeInTheDocument();

      // Optional fields
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();

      // Toggles
      expect(screen.getByLabelText(/confidential/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/repeat/i)).toBeInTheDocument();

      // Buttons
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument();
    });

    it('renders edit mode correctly', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          event={mockEvent}
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('Edit Event')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update event/i })).toBeInTheDocument();
    });

    it('populates form fields with existing event data', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          event={mockEvent}
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      expect(screen.getByDisplayValue('Team Meeting')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Weekly team sync')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Conference Room A')).toBeInTheDocument();

      // Check time dropdowns show correct values (10:00 AM start, 11:00 AM end)
      const startTimeContainer = screen.getByTestId('event-start-time');
      const startHour = within(startTimeContainer).getByLabelText('Hour');
      const startMinute = within(startTimeContainer).getByLabelText('Minute');
      expect(startHour).toHaveValue('10');
      expect(startMinute).toHaveValue('0');

      const endTimeContainer = screen.getByTestId('event-end-time');
      const endHour = within(endTimeContainer).getByLabelText('Hour');
      const endMinute = within(endTimeContainer).getByLabelText('Minute');
      expect(endHour).toHaveValue('11');
      expect(endMinute).toHaveValue('0');
    });

    it('shows alternate title field when confidential is checked', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Alternate title should not be visible initially
      expect(screen.queryByLabelText(/alternate title/i)).not.toBeInTheDocument();

      // Toggle confidential
      const confidentialToggle = screen.getByTestId('event-confidential-toggle');
      await user.click(confidentialToggle);

      // Alternate title should now be visible
      expect(screen.getByLabelText(/alternate title/i)).toBeInTheDocument();
    });

    it('shows recurrence form when repeat is checked', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Recurrence form should not be visible initially
      expect(screen.queryByTestId('event-recurrence-form')).not.toBeInTheDocument();

      // Toggle repeat
      const repeatToggle = screen.getByTestId('event-repeat-toggle');
      await user.click(repeatToggle);

      // Recurrence form should now be visible
      expect(screen.getByTestId('event-recurrence-form')).toBeInTheDocument();
    });

    it('displays created date label in edit mode', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          event={mockEvent}
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Should show "Created" label in edit mode
      expect(screen.getByText(/^Created$/)).toBeInTheDocument();
    });

    // TC-EF-005: Form Reset When Event Prop Changes
    it('updates form data when event prop changes', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      const { rerender } = render(
        <EventForm
          event={mockEvent}
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Verify initial data displayed
      expect(screen.getByDisplayValue('Team Meeting')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Weekly team sync')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Conference Room A')).toBeInTheDocument();

      // Create a different event
      const differentEvent: Event = {
        ...mockEvent,
        id: 'event2',
        title: 'Different Meeting',
        description: 'Different description',
        location: 'Room B',
      };

      // Rerender with different event
      rerender(
        <EventForm
          event={differentEvent}
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Verify form updates to new event data
      expect(screen.getByDisplayValue('Different Meeting')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Different description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Room B')).toBeInTheDocument();

      // Verify old values are gone
      expect(screen.queryByDisplayValue('Team Meeting')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('Weekly team sync')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('Conference Room A')).not.toBeInTheDocument();
    });

    // TC-EF-006: Clearing Alternate Title When Confidential Unchecked
    it('clears alternate title when confidential is toggled off', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Toggle confidential ON
      const confidentialToggle = screen.getByTestId('event-confidential-toggle');
      await user.click(confidentialToggle);

      // Enter alternate title
      const alternateTitleInput = screen.getByTestId('event-alternate-title');
      await user.type(alternateTitleInput, 'Public Title');
      expect(screen.getByDisplayValue('Public Title')).toBeInTheDocument();

      // Toggle confidential OFF
      await user.click(confidentialToggle);

      // Alternate title field should be hidden
      expect(screen.queryByTestId('event-alternate-title')).not.toBeInTheDocument();

      // Toggle confidential ON again
      await user.click(confidentialToggle);

      // Verify alternate title is now empty
      const newAlternateTitleInput = screen.getByTestId('event-alternate-title');
      expect(newAlternateTitleInput).toHaveValue('');
    });

    // TC-EF-009: Default Time Values
    it('uses default start time when provided', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      const defaultStartTime = new Date(2024, 1, 15, 14, 30, 0); // Feb 15, 2024 14:30

      render(
        <EventForm
          categories={mockCategories}
          defaultStartTime={defaultStartTime}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Verify start time dropdowns have the correct values (2:30 PM)
      const startTimeContainer = screen.getByTestId('event-start-time');
      const startHour = within(startTimeContainer).getByLabelText('Hour');
      const startMinute = within(startTimeContainer).getByLabelText('Minute');
      expect(startHour).toHaveValue('2');
      expect(startMinute).toHaveValue('30');

      // Verify PM is selected
      const pmButton = screen.getByTestId('event-start-time-pm');
      expect(pmButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  // ---------------------------------------------------------------------------
  // Validation Tests
  // ---------------------------------------------------------------------------

  describe('Validation', () => {
    it('validates title is required', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Submit form without entering title
      const submitButton = screen.getByRole('button', { name: /create event/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('validates end time is after start time', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Enter title
      const titleInput = screen.getByTestId('event-title');
      await user.type(titleInput, 'Test Event');

      // Set start time to 10:00 AM
      await setTime(user, 'event-start-time', 10, 0, 'AM');

      // Set end time to 9:00 AM (before start time)
      await setTime(user, 'event-end-time', 9, 0, 'AM');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/end time must be after start time/i)).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('validates alternate title is required when confidential is checked', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Enter title
      const titleInput = screen.getByTestId('event-title');
      await user.type(titleInput, 'Secret Meeting');

      // Toggle confidential
      const confidentialToggle = screen.getByTestId('event-confidential-toggle');
      await user.click(confidentialToggle);

      // Don't enter alternate title
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/alternate title is required for confidential events/i)).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('clears validation error when user starts typing', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Submit form to trigger validation error
      const submitButton = screen.getByRole('button', { name: /create event/i });
      await user.click(submitButton);

      // Verify error is shown
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      // Start typing in title field
      const titleInput = screen.getByTestId('event-title');
      await user.type(titleInput, 'T');

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
      });
    });

    // TC-EF-001: Title Max Length Validation
    it('enforces title max length of 500 characters via HTML attribute', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Verify maxLength attribute is set on title input
      const titleInput = screen.getByTestId('event-title');
      expect(titleInput).toHaveAttribute('maxLength', '500');
    });

    // TC-EF-002: Description Max Length Validation
    it('enforces description max length of 5000 characters via HTML attribute', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Verify maxLength attribute is set on description textarea
      const descriptionInput = screen.getByTestId('event-description');
      expect(descriptionInput).toHaveAttribute('maxLength', '5000');
    });

    // TC-EF-003: Location Max Length Validation
    it('enforces location max length of 500 characters via HTML attribute', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Verify maxLength attribute is set on location input
      const locationInput = screen.getByTestId('event-location');
      expect(locationInput).toHaveAttribute('maxLength', '500');
    });

    // TC-EF-004: Alternate Title Max Length Validation
    it('enforces alternate title max length of 500 characters via HTML attribute', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Toggle confidential to show alternate title field
      const confidentialToggle = screen.getByTestId('event-confidential-toggle');
      await user.click(confidentialToggle);

      // Verify maxLength attribute is set on alternate title input
      const alternateTitleInput = screen.getByTestId('event-alternate-title');
      expect(alternateTitleInput).toHaveAttribute('maxLength', '500');
    });

    // TC-EF-007: Whitespace-only Title Validation (Edge Case)
    it('shows validation error when title contains only whitespace', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Enter whitespace-only title
      const titleInput = screen.getByTestId('event-title');
      await user.clear(titleInput);
      await user.click(titleInput);
      await user.paste('    ');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    // TC-EF-008: Time Validation with Same Start/End Time
    it('shows validation error when start time equals end time', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Enter valid title
      const titleInput = screen.getByTestId('event-title');
      await user.type(titleInput, 'Test Event');

      // Set start time and end time to the same value (10:00 AM)
      await setTime(user, 'event-start-time', 10, 0, 'AM');
      await setTime(user, 'event-end-time', 10, 0, 'AM');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/end time must be after start time/i)).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Submission Tests
  // ---------------------------------------------------------------------------

  describe('Submission', () => {
    it('submits form with valid data', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Fill in form
      const titleInput = screen.getByTestId('event-title');
      await user.clear(titleInput);
      await user.type(titleInput, 'New Event');

      const descriptionInput = screen.getByTestId('event-description');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Event description');

      // Set times using dropdowns
      await setTime(user, 'event-start-time', 10, 0, 'AM');
      await setTime(user, 'event-end-time', 11, 0, 'AM');

      const locationInput = screen.getByTestId('event-location');
      await user.clear(locationInput);
      await user.type(locationInput, 'Conference Room');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const submittedData: CreateEventInput = onSubmit.mock.calls[0][0];
      expect(submittedData.title).toBe('New Event');
      expect(submittedData.description).toBe('Event description');
      expect(submittedData.location).toBe('Conference Room');
      expect(submittedData.isConfidential).toBe(false);
      expect(submittedData.alternateTitle).toBeNull();
      expect(submittedData.recurrence).toBeNull();
    });

    it('submits confidential event with alternate title', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Fill in form
      const titleInput = screen.getByTestId('event-title');
      await user.clear(titleInput);
      await user.type(titleInput, 'Secret Meeting');

      // Set times
      await setTime(user, 'event-start-time', 2, 0, 'PM');
      await setTime(user, 'event-end-time', 3, 0, 'PM');

      // Toggle confidential
      await user.click(screen.getByTestId('event-confidential-toggle'));

      // Enter alternate title
      const alternateTitleInput = screen.getByTestId('event-alternate-title');
      await user.clear(alternateTitleInput);
      await user.type(alternateTitleInput, 'Generic Meeting');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const submittedData: CreateEventInput = onSubmit.mock.calls[0][0];
      expect(submittedData.title).toBe('Secret Meeting');
      expect(submittedData.isConfidential).toBe(true);
      expect(submittedData.alternateTitle).toBe('Generic Meeting');
    });

    it('submits event with recurrence pattern', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Fill in form
      await user.type(screen.getByTestId('event-title'), 'Recurring Event');

      // Set times
      await setTime(user, 'event-start-time', 9, 0, 'AM');
      await setTime(user, 'event-end-time', 10, 0, 'AM');

      // Toggle repeat
      await user.click(screen.getByTestId('event-repeat-toggle'));

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const submittedData: CreateEventInput = onSubmit.mock.calls[0][0];
      expect(submittedData.recurrence).not.toBeNull();
      expect(submittedData.recurrence?.type).toBe('daily');
    });

    it('submits event with category', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Fill in form
      await user.type(screen.getByTestId('event-title'), 'Categorized Event');

      // Set times
      await setTime(user, 'event-start-time', 1, 0, 'PM');
      await setTime(user, 'event-end-time', 2, 0, 'PM');

      // Select category
      const categoryTrigger = screen.getByTestId('event-category-trigger');
      await user.click(categoryTrigger);

      const workOption = screen.getByTestId('category-option-cat1');
      await user.click(workOption);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const submittedData: CreateEventInput = onSubmit.mock.calls[0][0];
      expect(submittedData.categoryId).toBe('cat1');
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('disables form inputs when isSubmitting is true', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isSubmitting={true}
        />
      );

      expect(screen.getByTestId('event-title')).toBeDisabled();
      expect(screen.getByTestId('event-description')).toBeDisabled();
      expect(screen.getByTestId('event-location')).toBeDisabled();
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

      // Time dropdowns should be disabled
      const startHour = screen.getByTestId('event-start-time-hour');
      const startMinute = screen.getByTestId('event-start-time-minute');
      const endHour = screen.getByTestId('event-end-time-hour');
      const endMinute = screen.getByTestId('event-end-time-minute');
      expect(startHour).toBeDisabled();
      expect(startMinute).toBeDisabled();
      expect(endHour).toBeDisabled();
      expect(endMinute).toBeDisabled();
    });

    // TC-EF-010: Disabled State for Toggles
    it('disables toggles when isSubmitting is true', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isSubmitting={true}
        />
      );

      // Verify confidential toggle is disabled
      const confidentialToggle = screen.getByTestId('event-confidential-toggle');
      expect(confidentialToggle).toBeDisabled();

      // Verify repeat toggle is disabled
      const repeatToggle = screen.getByTestId('event-repeat-toggle');
      expect(repeatToggle).toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // Integration Tests
  // ---------------------------------------------------------------------------

  describe('Category Dropdown', () => {
    it('allows selecting a category', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Click category dropdown
      const categoryTrigger = screen.getByTestId('event-category-trigger');
      await user.click(categoryTrigger);

      // Verify dropdown is open
      expect(screen.getByTestId('event-category-dropdown')).toBeInTheDocument();

      // Select Work category
      const workOption = screen.getByTestId('category-option-cat1');
      await user.click(workOption);

      // Verify selection
      expect(screen.getByText('Work')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Date Field Tests
  // ---------------------------------------------------------------------------

  describe('Date Field', () => {
    it('shows a date picker in the form', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      expect(screen.getByTestId('event-date')).toBeInTheDocument();
    });

    it('pre-fills date from defaultStartTime', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      const defaultStartTime = new Date(2024, 2, 20, 9, 0, 0); // March 20, 2024

      render(
        <EventForm
          categories={mockCategories}
          defaultStartTime={defaultStartTime}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // The date input should show 2024-03-20
      const dateInput = screen.getByTestId('event-date');
      expect(dateInput).toHaveValue('2024-03-20');
    });

    it('pre-fills date from existing event in edit mode', () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          event={mockEvent}
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // mockEvent.startTime is Jan 15, 2024
      const dateInput = screen.getByTestId('event-date');
      expect(dateInput).toHaveValue('2024-01-15');
    });
  });
});
