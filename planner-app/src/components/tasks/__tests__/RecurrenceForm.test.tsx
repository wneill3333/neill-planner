/**
 * RecurrenceForm Component Tests
 *
 * Tests for the recurrence pattern form component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecurrenceForm, type RecurrenceFormProps } from '../RecurrenceForm';
import type { RecurrencePattern } from '../../../types';

// =============================================================================
// Test Helpers
// =============================================================================

const defaultProps: RecurrenceFormProps = {
  value: null,
  onChange: vi.fn(),
};

function renderRecurrenceForm(props: Partial<RecurrenceFormProps> = {}) {
  const mergedProps = { ...defaultProps, ...props };
  return render(<RecurrenceForm {...mergedProps} />);
}

function createMockPattern(overrides: Partial<RecurrencePattern> = {}): RecurrencePattern {
  return {
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
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('RecurrenceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Basic Rendering
  // ---------------------------------------------------------------------------

  describe('Basic Rendering', () => {
    it('renders with default values when value is null', () => {
      renderRecurrenceForm();

      expect(screen.getByText('Recurrence Pattern')).toBeInTheDocument();
      expect(screen.getByLabelText(/repeat/i)).toHaveValue('daily');
      expect(screen.getByLabelText(/every/i)).toHaveValue(1);
      expect(screen.getByLabelText(/ends/i)).toHaveValue('never');
    });

    it('renders with testId', () => {
      renderRecurrenceForm({ testId: 'my-recurrence' });

      expect(screen.getByTestId('my-recurrence')).toBeInTheDocument();
    });

    it('displays all recurrence type options', async () => {
      const user = userEvent.setup();
      renderRecurrenceForm();

      const typeSelect = screen.getByLabelText(/repeat/i);
      await user.click(typeSelect);

      expect(screen.getByRole('option', { name: 'Daily' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Weekly' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Monthly' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Yearly' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Custom' })).toBeInTheDocument();
    });

    it('displays all end type options', async () => {
      const user = userEvent.setup();
      renderRecurrenceForm();

      const endSelect = screen.getByLabelText(/ends/i);
      await user.click(endSelect);

      expect(screen.getByRole('option', { name: 'Never' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Until date' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'After occurrences' })).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Initializing from Value
  // ---------------------------------------------------------------------------

  describe('Initializing from Value', () => {
    it('initializes from weekly pattern', () => {
      const pattern = createMockPattern({
        type: 'weekly',
        interval: 2,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      });

      renderRecurrenceForm({ value: pattern });

      expect(screen.getByLabelText(/repeat/i)).toHaveValue('weekly');
      expect(screen.getByLabelText(/every/i)).toHaveValue(2);

      // Check days are selected
      expect(screen.getByRole('button', { name: 'Monday', pressed: true })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Wednesday', pressed: true })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Friday', pressed: true })).toBeInTheDocument();
    });

    it('initializes from monthly pattern', () => {
      const pattern = createMockPattern({
        type: 'monthly',
        interval: 1,
        dayOfMonth: 15,
      });

      renderRecurrenceForm({ value: pattern });

      expect(screen.getByLabelText(/repeat/i)).toHaveValue('monthly');
      expect(screen.getByLabelText(/on day/i)).toHaveValue('15');
    });

    it('initializes from yearly pattern', () => {
      const pattern = createMockPattern({
        type: 'yearly',
        interval: 1,
        monthOfYear: 6,
        dayOfMonth: 21,
      });

      renderRecurrenceForm({ value: pattern });

      expect(screen.getByLabelText(/repeat/i)).toHaveValue('yearly');
      expect(screen.getByLabelText(/in month/i)).toHaveValue('6');
      // There are two "On day" selects for yearly, check that one has the correct value
      const daySelects = screen.getAllByLabelText(/on day/i);
      expect(daySelects.some((el) => (el as HTMLSelectElement).value === '21')).toBe(true);
    });

    it('initializes with end date', () => {
      const endDate = new Date('2026-12-31');
      const pattern = createMockPattern({
        endCondition: {
          type: 'date',
          endDate,
          maxOccurrences: null,
        },
      });

      renderRecurrenceForm({ value: pattern });

      expect(screen.getByLabelText(/ends/i)).toHaveValue('date');
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    });

    it('initializes with max occurrences', () => {
      const pattern = createMockPattern({
        endCondition: {
          type: 'occurrences',
          endDate: null,
          maxOccurrences: 10,
        },
      });

      renderRecurrenceForm({ value: pattern });

      expect(screen.getByLabelText(/ends/i)).toHaveValue('occurrences');
      expect(screen.getByLabelText(/after/i)).toHaveValue(10);
    });
  });

  // ---------------------------------------------------------------------------
  // Recurrence Type Changes
  // ---------------------------------------------------------------------------

  describe('Recurrence Type Changes', () => {
    it('shows interval with correct label for daily', () => {
      renderRecurrenceForm();

      expect(screen.getByText('day(s)')).toBeInTheDocument();
    });

    it('shows days of week for weekly type', async () => {
      const user = userEvent.setup();
      renderRecurrenceForm();

      await user.selectOptions(screen.getByLabelText(/repeat/i), 'weekly');

      expect(screen.getByText('On days')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sunday' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Monday' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Saturday' })).toBeInTheDocument();
      expect(screen.getByText('week(s)')).toBeInTheDocument();
    });

    it('shows day of month for monthly type', async () => {
      const user = userEvent.setup();
      renderRecurrenceForm();

      await user.selectOptions(screen.getByLabelText(/repeat/i), 'monthly');

      expect(screen.getByLabelText(/on day/i)).toBeInTheDocument();
      expect(screen.getByText('month(s)')).toBeInTheDocument();
    });

    it('shows month and day for yearly type', async () => {
      const user = userEvent.setup();
      renderRecurrenceForm();

      await user.selectOptions(screen.getByLabelText(/repeat/i), 'yearly');

      expect(screen.getByLabelText(/in month/i)).toBeInTheDocument();
      expect(screen.getByText('year(s)')).toBeInTheDocument();
    });

    it('hides type-specific fields when type changes', async () => {
      const user = userEvent.setup();
      renderRecurrenceForm();

      // Switch to weekly
      await user.selectOptions(screen.getByLabelText(/repeat/i), 'weekly');
      expect(screen.getByText('On days')).toBeInTheDocument();

      // Switch to daily
      await user.selectOptions(screen.getByLabelText(/repeat/i), 'daily');
      expect(screen.queryByText('On days')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Interval Input
  // ---------------------------------------------------------------------------

  describe('Interval Input', () => {
    it('updates interval value', async () => {
      const onChange = vi.fn();
      renderRecurrenceForm({ onChange });

      const intervalInput = screen.getByLabelText(/every/i) as HTMLInputElement;

      // Use fireEvent to set value directly since userEvent.clear has issues with number inputs
      fireEvent.change(intervalInput, { target: { value: '5' } });

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall.interval).toBe(5);
    });

    it('does not accept invalid interval values', () => {
      const onChange = vi.fn();
      renderRecurrenceForm({ onChange });

      const intervalInput = screen.getByLabelText(/every/i);
      fireEvent.change(intervalInput, { target: { value: '0' } });

      // Should not call onChange with invalid value (0 is less than 1)
      // The component doesn't update state for invalid values
      expect(intervalInput).toHaveValue(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Days of Week Selection
  // ---------------------------------------------------------------------------

  describe('Days of Week Selection', () => {
    it('toggles day selection on click', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderRecurrenceForm({ onChange });

      await user.selectOptions(screen.getByLabelText(/repeat/i), 'weekly');

      const mondayBtn = screen.getByRole('button', { name: 'Monday' });
      expect(mondayBtn).toHaveAttribute('aria-pressed', 'false');

      await user.click(mondayBtn);

      expect(mondayBtn).toHaveAttribute('aria-pressed', 'true');
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall.daysOfWeek).toContain(1);
    });

    it('toggles day off on second click', async () => {
      const onChange = vi.fn();
      const pattern = createMockPattern({
        type: 'weekly',
        daysOfWeek: [1], // Monday selected
      });
      const user = userEvent.setup();
      renderRecurrenceForm({ value: pattern, onChange });

      const mondayBtn = screen.getByRole('button', { name: 'Monday' });
      expect(mondayBtn).toHaveAttribute('aria-pressed', 'true');

      await user.click(mondayBtn);

      expect(mondayBtn).toHaveAttribute('aria-pressed', 'false');
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall.daysOfWeek).not.toContain(1);
    });

    it('shows warning when no days selected after interaction', async () => {
      const user = userEvent.setup();
      renderRecurrenceForm();

      await user.selectOptions(screen.getByLabelText(/repeat/i), 'weekly');

      // Warning should NOT show immediately (before user interaction)
      expect(screen.queryByText('Select at least one day')).not.toBeInTheDocument();

      // Select a day then unselect it to trigger touched state
      const mondayBtn = screen.getByRole('button', { name: 'Monday' });
      await user.click(mondayBtn); // Select
      await user.click(mondayBtn); // Unselect

      // Now warning should show because field is touched and no days selected
      expect(screen.getByText('Select at least one day')).toBeInTheDocument();
    });

    it('hides warning when at least one day selected', async () => {
      const pattern = createMockPattern({
        type: 'weekly',
        daysOfWeek: [1],
      });
      renderRecurrenceForm({ value: pattern });

      expect(screen.queryByText('Select at least one day')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Day of Month Selection
  // ---------------------------------------------------------------------------

  describe('Day of Month Selection', () => {
    it('provides all days 1-31', async () => {
      const user = userEvent.setup();
      renderRecurrenceForm();

      await user.selectOptions(screen.getByLabelText(/repeat/i), 'monthly');

      const daySelect = screen.getByLabelText(/on day/i);
      await user.click(daySelect);

      // Check a few key days
      expect(screen.getByRole('option', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '15' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '31' })).toBeInTheDocument();
    });

    it('updates day of month value', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderRecurrenceForm({ onChange });

      await user.selectOptions(screen.getByLabelText(/repeat/i), 'monthly');
      await user.selectOptions(screen.getByLabelText(/on day/i), '15');

      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall.dayOfMonth).toBe(15);
    });
  });

  // ---------------------------------------------------------------------------
  // Month of Year Selection
  // ---------------------------------------------------------------------------

  describe('Month of Year Selection', () => {
    it('provides all 12 months', async () => {
      const user = userEvent.setup();
      renderRecurrenceForm();

      await user.selectOptions(screen.getByLabelText(/repeat/i), 'yearly');

      const monthSelect = screen.getByLabelText(/in month/i);
      await user.click(monthSelect);

      expect(screen.getByRole('option', { name: 'January' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'June' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'December' })).toBeInTheDocument();
    });

    it('updates month of year value', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderRecurrenceForm({ onChange });

      await user.selectOptions(screen.getByLabelText(/repeat/i), 'yearly');
      await user.selectOptions(screen.getByLabelText(/in month/i), '6');

      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall.monthOfYear).toBe(6);
    });
  });

  // ---------------------------------------------------------------------------
  // End Condition
  // ---------------------------------------------------------------------------

  describe('End Condition', () => {
    it('shows end date picker when "Until date" selected', async () => {
      const user = userEvent.setup();
      renderRecurrenceForm();

      await user.selectOptions(screen.getByLabelText(/ends/i), 'date');

      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    });

    it('shows occurrences input when "After occurrences" selected', async () => {
      const user = userEvent.setup();
      renderRecurrenceForm();

      await user.selectOptions(screen.getByLabelText(/ends/i), 'occurrences');

      expect(screen.getByLabelText(/after/i)).toBeInTheDocument();
      expect(screen.getByText('occurrence(s)')).toBeInTheDocument();
    });

    it('hides additional fields when "Never" selected', async () => {
      const user = userEvent.setup();
      renderRecurrenceForm();

      // First show end date
      await user.selectOptions(screen.getByLabelText(/ends/i), 'date');
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();

      // Switch back to never
      await user.selectOptions(screen.getByLabelText(/ends/i), 'never');
      expect(screen.queryByLabelText(/end date/i)).not.toBeInTheDocument();
    });

    it('updates max occurrences value', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderRecurrenceForm({ onChange });

      await user.selectOptions(screen.getByLabelText(/ends/i), 'occurrences');
      const occInput = screen.getByLabelText(/after/i);
      await user.clear(occInput);
      await user.type(occInput, '25');

      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall.endCondition.maxOccurrences).toBe(25);
    });
  });

  // ---------------------------------------------------------------------------
  // Disabled State
  // ---------------------------------------------------------------------------

  describe('Disabled State', () => {
    it('disables all inputs when disabled prop is true', () => {
      renderRecurrenceForm({ disabled: true });

      expect(screen.getByLabelText(/repeat/i)).toBeDisabled();
      expect(screen.getByLabelText(/every/i)).toBeDisabled();
      expect(screen.getByLabelText(/ends/i)).toBeDisabled();
    });

    it('disables day of week buttons when disabled', async () => {
      const pattern = createMockPattern({
        type: 'weekly',
        daysOfWeek: [],
      });
      renderRecurrenceForm({ value: pattern, disabled: true });

      const mondayBtn = screen.getByRole('button', { name: 'Monday' });
      expect(mondayBtn).toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // onChange Callback
  // ---------------------------------------------------------------------------

  describe('onChange Callback', () => {
    it('calls onChange immediately when type changes', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderRecurrenceForm({ onChange });

      await user.selectOptions(screen.getByLabelText(/repeat/i), 'weekly');

      expect(onChange).toHaveBeenCalled();
      const pattern = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(pattern.type).toBe('weekly');
    });

    it('provides complete pattern object on change', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderRecurrenceForm({ onChange });

      await user.selectOptions(screen.getByLabelText(/repeat/i), 'weekly');
      await user.click(screen.getByRole('button', { name: 'Monday' }));

      const pattern = onChange.mock.calls[onChange.mock.calls.length - 1][0];

      expect(pattern).toMatchObject({
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: {
          type: 'never',
          endDate: null,
          maxOccurrences: null,
        },
        exceptions: [],
      });
    });

    it('clears type-specific fields when type changes', async () => {
      const onChange = vi.fn();
      const pattern = createMockPattern({
        type: 'weekly',
        daysOfWeek: [1, 2, 3],
      });
      const user = userEvent.setup();
      renderRecurrenceForm({ value: pattern, onChange });

      await user.selectOptions(screen.getByLabelText(/repeat/i), 'daily');

      const newPattern = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(newPattern.daysOfWeek).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('has accessible labels for all form fields', () => {
      renderRecurrenceForm();

      expect(screen.getByLabelText(/repeat/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/every/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ends/i)).toBeInTheDocument();
    });

    it('day buttons have proper aria-pressed state', async () => {
      const pattern = createMockPattern({
        type: 'weekly',
        daysOfWeek: [1, 3],
      });
      renderRecurrenceForm({ value: pattern });

      expect(screen.getByRole('button', { name: 'Monday', pressed: true })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Tuesday', pressed: false })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Wednesday', pressed: true })).toBeInTheDocument();
    });

    it('days of week group has proper role', async () => {
      const user = userEvent.setup();
      renderRecurrenceForm();

      await user.selectOptions(screen.getByLabelText(/repeat/i), 'weekly');

      expect(screen.getByRole('group')).toBeInTheDocument();
    });
  });
});
