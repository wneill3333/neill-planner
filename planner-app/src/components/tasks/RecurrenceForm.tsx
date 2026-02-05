/**
 * RecurrenceForm Component
 *
 * Form for defining task recurrence patterns.
 * Supports daily, weekly, monthly, yearly, and custom recurrence types.
 */

import { useState, useCallback, useId, useMemo, useRef, useEffect } from 'react';
import type {
  RecurrencePattern,
  RecurrenceType,
  RecurrenceEndType,
  RecurrenceEndCondition,
} from '../../types';
import { Input } from '../common/Input';
import { Select, type SelectOption } from '../common/Select';
import { DatePicker } from '../common/DatePicker';

// =============================================================================
// Types
// =============================================================================

export interface RecurrenceFormProps {
  /** Current recurrence pattern value */
  value: RecurrencePattern | null;
  /** Callback when pattern changes */
  onChange: (pattern: RecurrencePattern | null) => void;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testId?: string;
}

interface FormState {
  type: RecurrenceType;
  interval: number;
  daysOfWeek: number[];
  dayOfMonth: number | null;
  monthOfYear: number | null;
  endType: RecurrenceEndType;
  endDate: Date | null;
  maxOccurrences: number | null;
}

// =============================================================================
// Constants
// =============================================================================

const RECURRENCE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
];

const END_TYPE_OPTIONS: SelectOption[] = [
  { value: 'never', label: 'Never' },
  { value: 'date', label: 'Until date' },
  { value: 'occurrences', label: 'After occurrences' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
];

const MONTHS_OF_YEAR: SelectOption[] = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the interval label based on recurrence type
 */
function getIntervalLabel(type: RecurrenceType): string {
  switch (type) {
    case 'daily':
      return 'day(s)';
    case 'weekly':
      return 'week(s)';
    case 'monthly':
      return 'month(s)';
    case 'yearly':
      return 'year(s)';
    case 'custom':
      return 'day(s)';
    default:
      return 'day(s)';
  }
}

/**
 * Create default form state
 */
function createDefaultState(): FormState {
  return {
    type: 'daily',
    interval: 1,
    daysOfWeek: [],
    dayOfMonth: null,
    monthOfYear: null,
    endType: 'never',
    endDate: null,
    maxOccurrences: null,
  };
}

/**
 * Convert RecurrencePattern to FormState
 */
function patternToFormState(pattern: RecurrencePattern | null): FormState {
  if (!pattern) {
    return createDefaultState();
  }

  return {
    type: pattern.type,
    interval: pattern.interval,
    daysOfWeek: pattern.daysOfWeek,
    dayOfMonth: pattern.dayOfMonth,
    monthOfYear: pattern.monthOfYear,
    endType: pattern.endCondition.type,
    endDate: pattern.endCondition.endDate,
    maxOccurrences: pattern.endCondition.maxOccurrences,
  };
}

/**
 * Convert FormState to RecurrencePattern
 */
function formStateToPattern(state: FormState): RecurrencePattern {
  const endCondition: RecurrenceEndCondition = {
    type: state.endType,
    endDate: state.endType === 'date' ? state.endDate : null,
    maxOccurrences: state.endType === 'occurrences' ? state.maxOccurrences : null,
  };

  return {
    type: state.type,
    interval: state.interval,
    daysOfWeek: state.type === 'weekly' ? state.daysOfWeek : [],
    dayOfMonth: state.type === 'monthly' ? state.dayOfMonth : null,
    monthOfYear: state.type === 'yearly' ? state.monthOfYear : null,
    endCondition,
    exceptions: [],
  };
}

// =============================================================================
// Component
// =============================================================================

/**
 * RecurrenceForm - Form for defining task recurrence patterns
 *
 * Provides UI for setting up recurring tasks with various patterns.
 * Supports daily, weekly, monthly, yearly, and custom recurrence types.
 *
 * @example
 * ```tsx
 * <RecurrenceForm
 *   value={task.recurrence}
 *   onChange={(pattern) => setRecurrence(pattern)}
 * />
 * ```
 */
export function RecurrenceForm({
  value,
  onChange,
  disabled = false,
  testId,
}: RecurrenceFormProps) {
  const baseId = useId();
  const effectiveTestId = testId || 'recurrence-form';

  // Form state
  const [formState, setFormState] = useState<FormState>(() => patternToFormState(value));

  // Track which fields have been interacted with for validation display
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Track previous value to detect prop changes
  const prevValueRef = useRef<RecurrencePattern | null>(value);

  // Sync formState when value prop changes (controlled component pattern)
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      setFormState(patternToFormState(value));
      setTouchedFields({});
    }
  }, [value]);

  // Memoized interval label
  const intervalLabel = useMemo(() => getIntervalLabel(formState.type), [formState.type]);

  // Generate day of month options (1-31)
  const dayOfMonthOptions = useMemo<SelectOption[]>(() => {
    const options: SelectOption[] = [{ value: '', label: 'Select day' }];
    for (let i = 1; i <= 31; i++) {
      options.push({ value: String(i), label: String(i) });
    }
    return options;
  }, []);

  // Update form state and notify parent
  const updateState = useCallback(
    (updates: Partial<FormState>) => {
      setFormState((prev) => {
        const newState = { ...prev, ...updates };
        // Notify parent of change
        onChange(formStateToPattern(newState));
        return newState;
      });
    },
    [onChange]
  );

  // Handle recurrence type change
  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value as RecurrenceType;
      // Use functional update to avoid stale closure
      setFormState((prev) => {
        const newState: FormState = {
          ...prev,
          type: newType,
          // Reset type-specific fields when switching types
          daysOfWeek: newType === 'weekly' ? prev.daysOfWeek : [],
          dayOfMonth: newType === 'monthly' || newType === 'yearly' ? prev.dayOfMonth : null,
          monthOfYear: newType === 'yearly' ? prev.monthOfYear : null,
        };
        onChange(formStateToPattern(newState));
        return newState;
      });
    },
    [onChange]
  );

  // Handle interval change
  const handleIntervalChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 1) {
        updateState({ interval: val });
      }
    },
    [updateState]
  );

  // Handle day of week toggle
  const handleDayOfWeekToggle = useCallback(
    (day: number) => {
      // Mark field as touched for validation
      setTouchedFields((prev) => ({ ...prev, daysOfWeek: true }));
      // Use functional update to avoid stale closure
      setFormState((prev) => {
        // Add day if not present, remove if present, then sort by day number (Sun=0 to Sat=6)
        const newDays = prev.daysOfWeek.includes(day)
          ? prev.daysOfWeek.filter((d) => d !== day)
          : [...prev.daysOfWeek, day].sort((a, b) => a - b);
        const newState = { ...prev, daysOfWeek: newDays };
        onChange(formStateToPattern(newState));
        return newState;
      });
    },
    [onChange]
  );

  // Handle day of month change
  const handleDayOfMonthChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value ? parseInt(e.target.value, 10) : null;
      updateState({ dayOfMonth: val });
    },
    [updateState]
  );

  // Handle month of year change
  const handleMonthOfYearChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value ? parseInt(e.target.value, 10) : null;
      updateState({ monthOfYear: val });
    },
    [updateState]
  );

  // Handle end type change
  const handleEndTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newEndType = e.target.value as RecurrenceEndType;
      // Use functional update to avoid stale closure
      setFormState((prev) => {
        const newState: FormState = {
          ...prev,
          endType: newEndType,
          // Reset end condition values when switching types
          endDate: newEndType === 'date' ? prev.endDate : null,
          maxOccurrences: newEndType === 'occurrences' ? prev.maxOccurrences : null,
        };
        onChange(formStateToPattern(newState));
        return newState;
      });
    },
    [onChange]
  );

  // Handle end date change
  const handleEndDateChange = useCallback(
    (date: Date | null) => {
      updateState({ endDate: date });
    },
    [updateState]
  );

  // Handle max occurrences change
  const handleMaxOccurrencesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 1) {
        updateState({ maxOccurrences: val });
      }
    },
    [updateState]
  );

  return (
    <div
      className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
      data-testid={effectiveTestId}
    >
      <h3 className="text-sm font-medium text-gray-700">Recurrence Pattern</h3>

      {/* Recurrence Type */}
      <Select
        label="Repeat"
        options={RECURRENCE_TYPE_OPTIONS}
        value={formState.type}
        onChange={handleTypeChange}
        disabled={disabled}
        fullWidth
        testId={`${effectiveTestId}-type`}
      />

      {/* Interval */}
      <div className="flex items-end gap-2">
        <div className="w-24">
          <Input
            label="Every"
            type="number"
            value={String(formState.interval)}
            onChange={handleIntervalChange}
            min={1}
            max={365}
            disabled={disabled}
            testId={`${effectiveTestId}-interval`}
          />
        </div>
        <span className="pb-2 text-sm text-gray-600">{intervalLabel}</span>
      </div>

      {/* Days of Week (for weekly) */}
      {formState.type === 'weekly' && (
        <div>
          <label
            id={`${baseId}-days-label`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            On days
          </label>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-labelledby={`${baseId}-days-label`}
          >
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = formState.daysOfWeek.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleDayOfWeekToggle(day.value)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  aria-label={day.fullLabel}
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-full border transition-colors
                    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-amber-500'
                    }
                  `}
                  data-testid={`${effectiveTestId}-day-${day.value}`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          {touchedFields.daysOfWeek && formState.daysOfWeek.length === 0 && (
            <p className="mt-1 text-sm text-amber-600">
              Select at least one day
            </p>
          )}
        </div>
      )}

      {/* Day of Month (for monthly) */}
      {formState.type === 'monthly' && (
        <Select
          label="On day"
          options={dayOfMonthOptions}
          value={formState.dayOfMonth?.toString() || ''}
          onChange={handleDayOfMonthChange}
          disabled={disabled}
          fullWidth
          testId={`${effectiveTestId}-day-of-month`}
        />
      )}

      {/* Month of Year (for yearly) */}
      {formState.type === 'yearly' && (
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="In month"
            options={[{ value: '', label: 'Select month' }, ...MONTHS_OF_YEAR]}
            value={formState.monthOfYear?.toString() || ''}
            onChange={handleMonthOfYearChange}
            disabled={disabled}
            fullWidth
            testId={`${effectiveTestId}-month`}
          />
          <Select
            label="On day"
            options={dayOfMonthOptions}
            value={formState.dayOfMonth?.toString() || ''}
            onChange={handleDayOfMonthChange}
            disabled={disabled}
            fullWidth
            testId={`${effectiveTestId}-yearly-day`}
          />
        </div>
      )}

      {/* End Condition */}
      <div className="pt-4 border-t border-gray-200">
        <Select
          label="Ends"
          options={END_TYPE_OPTIONS}
          value={formState.endType}
          onChange={handleEndTypeChange}
          disabled={disabled}
          fullWidth
          testId={`${effectiveTestId}-end-type`}
        />

        {/* End Date */}
        {formState.endType === 'date' && (
          <div className="mt-4">
            <DatePicker
              label="End date"
              value={formState.endDate}
              onChange={handleEndDateChange}
              minDate={new Date()}
              disabled={disabled}
              fullWidth
              testId={`${effectiveTestId}-end-date`}
            />
          </div>
        )}

        {/* Max Occurrences */}
        {formState.endType === 'occurrences' && (
          <div className="mt-4 flex items-end gap-2">
            <div className="w-24">
              <Input
                label="After"
                type="number"
                value={formState.maxOccurrences?.toString() || ''}
                onChange={handleMaxOccurrencesChange}
                min={1}
                max={999}
                placeholder="10"
                disabled={disabled}
                testId={`${effectiveTestId}-occurrences`}
              />
            </div>
            <span className="pb-2 text-sm text-gray-600">occurrence(s)</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecurrenceForm;
