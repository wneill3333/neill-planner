/**
 * EventForm Component Tests
 *
 * Tests the EventForm component's rendering, validation, and submission behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
  startTime: new Date('2024-01-15T10:00:00'),
  endTime: new Date('2024-01-15T11:00:00'),
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
      expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();

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
      expect(screen.getByDisplayValue('10:00')).toBeInTheDocument();
      expect(screen.getByDisplayValue('11:00')).toBeInTheDocument();
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

      const defaultStartTime = new Date('2024-02-15T14:30:00');

      render(
        <EventForm
          categories={mockCategories}
          defaultStartTime={defaultStartTime}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Verify start time input has the correct value from defaultStartTime
      const startTimeInput = screen.getByTestId('event-start-time');
      expect(startTimeInput).toHaveValue('14:30');
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

    it('validates start time is required', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Clear start time
      const startTimeInput = screen.getByTestId('event-start-time');
      await user.clear(startTimeInput);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/start time is required/i)).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('validates end time is required', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();

      render(
        <EventForm
          categories={mockCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Clear end time
      const endTimeInput = screen.getByTestId('event-end-time');
      await user.clear(endTimeInput);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/end time is required/i)).toBeInTheDocument();
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

      // Set start time to 10:00
      const startTimeInput = screen.getByTestId('event-start-time');
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '10:00');

      // Set end time to 09:00 (before start time)
      const endTimeInput = screen.getByTestId('event-end-time');
      await user.clear(endTimeInput);
      await user.type(endTimeInput, '09:00');

      // Enter title
      const titleInput = screen.getByTestId('event-title');
      await user.type(titleInput, 'Test Event');

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

      // Enter valid times
      const startTimeInput = screen.getByTestId('event-start-time');
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '10:00');

      const endTimeInput = screen.getByTestId('event-end-time');
      await user.clear(endTimeInput);
      await user.type(endTimeInput, '11:00');

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

      // Set start time and end time to the same value
      const startTimeInput = screen.getByTestId('event-start-time');
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '10:00');

      const endTimeInput = screen.getByTestId('event-end-time');
      await user.clear(endTimeInput);
      await user.type(endTimeInput, '10:00');

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

      const startTimeInput = screen.getByTestId('event-start-time');
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '10:00');

      const endTimeInput = screen.getByTestId('event-end-time');
      await user.clear(endTimeInput);
      await user.type(endTimeInput, '11:00');

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

      const startTimeInput = screen.getByTestId('event-start-time');
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '14:00');

      const endTimeInput = screen.getByTestId('event-end-time');
      await user.clear(endTimeInput);
      await user.type(endTimeInput, '15:00');

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

      const startTimeInput = screen.getByTestId('event-start-time');
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '09:00');

      const endTimeInput = screen.getByTestId('event-end-time');
      await user.clear(endTimeInput);
      await user.type(endTimeInput, '10:00');

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

      const startTimeInput = screen.getByTestId('event-start-time');
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '13:00');

      const endTimeInput = screen.getByTestId('event-end-time');
      await user.clear(endTimeInput);
      await user.type(endTimeInput, '14:00');

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
      expect(screen.getByTestId('event-start-time')).toBeDisabled();
      expect(screen.getByTestId('event-end-time')).toBeDisabled();
      expect(screen.getByTestId('event-location')).toBeDisabled();
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
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
});
