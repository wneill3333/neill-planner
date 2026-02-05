/**
 * RecurrenceFormSimple Component
 *
 * Enhanced recurrence form supporting Daily/Weekly/Monthly/Yearly/AfterCompletion.
 * Includes interval selection, nth weekday, and specific dates of month.
 */

import { useState, useCallback, useId, useRef, useEffect } from 'react';
import type {
  RecurrencePattern,
  RecurrenceType,
  RecurrenceEndType,
  RecurrenceEndCondition,
  NthWeekday,
} from '../../types';
import { DatePicker } from '../common/DatePicker';

// =============================================================================
// Types
// =============================================================================

export interface RecurrenceFormSimpleProps {
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
  // Monthly options
  monthlyMode: 'dayOfMonth' | 'nthWeekday' | 'specificDates';
  dayOfMonth: number | null;
  nthWeekday: NthWeekday | null;
  specificDatesOfMonth: number[];
  // AfterCompletion
  daysAfterCompletion: number;
  // End condition
  endType: RecurrenceEndType;
  endDate: Date | null;
  maxOccurrences: number | null;
}

// =============================================================================
// Constants
// =============================================================================

const RECURRENCE_TYPES: { value: RecurrenceType; label: string; description?: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'afterCompletion', label: 'After Completion', description: 'Repeats X days after you complete it' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Su', fullLabel: 'Sunday' },
  { value: 1, label: 'M', fullLabel: 'Monday' },
  { value: 2, label: 'Tu', fullLabel: 'Tuesday' },
  { value: 3, label: 'W', fullLabel: 'Wednesday' },
  { value: 4, label: 'Th', fullLabel: 'Thursday' },
  { value: 5, label: 'F', fullLabel: 'Friday' },
  { value: 6, label: 'Sa', fullLabel: 'Saturday' },
];

const NTH_OPTIONS = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
  { value: 4, label: '4th' },
  { value: -1, label: 'Last' },
];

const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

// =============================================================================
// Helper Functions
// =============================================================================

function createDefaultState(): FormState {
  return {
    type: 'daily',
    interval: 1,
    daysOfWeek: [],
    monthlyMode: 'dayOfMonth',
    dayOfMonth: null,
    nthWeekday: null,
    specificDatesOfMonth: [],
    daysAfterCompletion: 7,
    endType: 'occurrences',
    endDate: null,
    maxOccurrences: 10,
  };
}

function patternToFormState(pattern: RecurrencePattern | null): FormState {
  if (!pattern) {
    return createDefaultState();
  }

  // Determine monthly mode
  let monthlyMode: FormState['monthlyMode'] = 'dayOfMonth';
  if (pattern.nthWeekday) {
    monthlyMode = 'nthWeekday';
  } else if (pattern.specificDatesOfMonth && pattern.specificDatesOfMonth.length > 0) {
    monthlyMode = 'specificDates';
  }

  return {
    type: pattern.type,
    interval: pattern.interval || 1,
    daysOfWeek: pattern.daysOfWeek || [],
    monthlyMode,
    dayOfMonth: pattern.dayOfMonth,
    nthWeekday: pattern.nthWeekday || null,
    specificDatesOfMonth: pattern.specificDatesOfMonth || [],
    daysAfterCompletion: pattern.daysAfterCompletion || 7,
    endType: pattern.endCondition.type,
    endDate: pattern.endCondition.endDate,
    maxOccurrences: pattern.endCondition.maxOccurrences,
  };
}

function formStateToPattern(state: FormState): RecurrencePattern {
  const endCondition: RecurrenceEndCondition = {
    type: state.endType,
    endDate: state.endType === 'date' ? state.endDate : null,
    maxOccurrences: state.endType === 'occurrences' ? state.maxOccurrences : null,
  };

  // Build the pattern based on type
  const basePattern: RecurrencePattern = {
    type: state.type,
    interval: state.interval,
    daysOfWeek: state.type === 'weekly' ? state.daysOfWeek : [],
    dayOfMonth: null,
    monthOfYear: null,
    endCondition,
    exceptions: [],
  };

  // Add type-specific fields
  if (state.type === 'monthly') {
    if (state.monthlyMode === 'nthWeekday' && state.nthWeekday) {
      basePattern.nthWeekday = state.nthWeekday;
    } else if (state.monthlyMode === 'specificDates' && state.specificDatesOfMonth.length > 0) {
      basePattern.specificDatesOfMonth = state.specificDatesOfMonth;
    } else if (state.dayOfMonth) {
      basePattern.dayOfMonth = state.dayOfMonth;
    }
  }

  if (state.type === 'afterCompletion') {
    basePattern.daysAfterCompletion = state.daysAfterCompletion;
  }

  return basePattern;
}

function getIntervalLabel(type: RecurrenceType, interval: number): string {
  const plural = interval > 1;
  switch (type) {
    case 'daily':
      return plural ? 'days' : 'day';
    case 'weekly':
      return plural ? 'weeks' : 'week';
    case 'monthly':
      return plural ? 'months' : 'month';
    case 'yearly':
      return plural ? 'years' : 'year';
    default:
      return '';
  }
}

// =============================================================================
// Component
// =============================================================================

/**
 * RecurrenceFormSimple - Enhanced recurrence form
 *
 * Features:
 * - Radio buttons for Daily/Weekly/Monthly/Yearly/AfterCompletion
 * - Interval selector (every N days/weeks/months/years)
 * - Day-of-week buttons for weekly recurrence
 * - Monthly options: day of month, nth weekday, specific dates
 * - AfterCompletion: days after completion
 * - End condition (occurrences or date)
 */
export function RecurrenceFormSimple({
  value,
  onChange,
  disabled = false,
  testId,
}: RecurrenceFormSimpleProps) {
  const baseId = useId();
  const effectiveTestId = testId || 'recurrence-form-simple';

  // Form state
  const [formState, setFormState] = useState<FormState>(() => patternToFormState(value));

  // Track previous value to detect prop changes
  const prevValueRef = useRef<RecurrencePattern | null>(value);

  // Sync formState when value prop changes (controlled component pattern)
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      setFormState(patternToFormState(value));
    }
  }, [value]);

  // Update form state and notify parent
  const updateState = useCallback(
    (updates: Partial<FormState>) => {
      setFormState((prev) => {
        const newState = { ...prev, ...updates };
        onChange(formStateToPattern(newState));
        return newState;
      });
    },
    [onChange]
  );

  // Handle recurrence type change
  const handleTypeChange = useCallback(
    (newType: RecurrenceType) => {
      setFormState((prev) => {
        const newState: FormState = {
          ...prev,
          type: newType,
          interval: 1, // Reset interval on type change
          daysOfWeek: newType === 'weekly' ? prev.daysOfWeek : [],
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
      if (!isNaN(val) && val >= 1 && val <= 365) {
        updateState({ interval: val });
      }
    },
    [updateState]
  );

  // Handle day of week toggle
  const handleDayOfWeekToggle = useCallback(
    (day: number) => {
      setFormState((prev) => {
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

  // Handle monthly mode change
  const handleMonthlyModeChange = useCallback(
    (mode: FormState['monthlyMode']) => {
      updateState({ monthlyMode: mode });
    },
    [updateState]
  );

  // Handle nth weekday change
  const handleNthWeekdayChange = useCallback(
    (n: number, weekday: number) => {
      updateState({ nthWeekday: { n, weekday } });
    },
    [updateState]
  );

  // Handle specific dates toggle
  const handleSpecificDateToggle = useCallback(
    (date: number) => {
      setFormState((prev) => {
        const newDates = prev.specificDatesOfMonth.includes(date)
          ? prev.specificDatesOfMonth.filter((d) => d !== date)
          : [...prev.specificDatesOfMonth, date].sort((a, b) => a - b);
        const newState = { ...prev, specificDatesOfMonth: newDates };
        onChange(formStateToPattern(newState));
        return newState;
      });
    },
    [onChange]
  );

  // Handle days after completion change
  const handleDaysAfterCompletionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 1 && val <= 365) {
        updateState({ daysAfterCompletion: val });
      }
    },
    [updateState]
  );

  // Handle end type change
  const handleEndTypeChange = useCallback(
    (newEndType: RecurrenceEndType) => {
      setFormState((prev) => {
        const newState: FormState = {
          ...prev,
          endType: newEndType,
          endDate: newEndType === 'date' ? prev.endDate : null,
          maxOccurrences: newEndType === 'occurrences' ? (prev.maxOccurrences ?? 10) : null,
        };
        onChange(formStateToPattern(newState));
        return newState;
      });
    },
    [onChange]
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

  // Handle end date change
  const handleEndDateChange = useCallback(
    (date: Date | null) => {
      updateState({ endDate: date });
    },
    [updateState]
  );

  const showIntervalSelector = formState.type !== 'afterCompletion';
  const showEndCondition = formState.type !== 'afterCompletion';

  return (
    <div
      className="space-y-4 pl-6 border-l-2 border-amber-300"
      data-testid={effectiveTestId}
    >
      {/* Recurrence Type Radio Buttons */}
      <div
        className="flex flex-wrap gap-3"
        role="radiogroup"
        aria-label="Recurrence frequency"
      >
        {RECURRENCE_TYPES.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 cursor-pointer"
            title={option.description}
          >
            <input
              type="radio"
              name={`${baseId}-recurrence-type`}
              value={option.value}
              checked={formState.type === option.value}
              onChange={() => handleTypeChange(option.value)}
              disabled={disabled}
              className="
                w-4 h-4 text-amber-500 border-gray-300
                focus:ring-amber-500 focus:ring-2
                disabled:opacity-50
              "
              data-testid={`${effectiveTestId}-type-${option.value}`}
            />
            <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
              {option.label}
            </span>
          </label>
        ))}
      </div>

      {/* Interval Selector (not for afterCompletion) */}
      {showIntervalSelector && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Every</span>
          <input
            type="number"
            value={formState.interval}
            onChange={handleIntervalChange}
            disabled={disabled}
            min={1}
            max={365}
            className="
              w-16 px-2 py-1 text-sm border border-gray-300 rounded
              focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
              disabled:opacity-50 disabled:bg-gray-100
            "
            data-testid={`${effectiveTestId}-interval-input`}
          />
          <span className="text-sm text-gray-700">
            {getIntervalLabel(formState.type, formState.interval)}
          </span>
        </div>
      )}

      {/* Days of Week (for weekly) */}
      {formState.type === 'weekly' && (
        <div>
          <span className="text-sm text-gray-600 mb-2 block">On these days:</span>
          <div
            className="flex flex-wrap gap-1"
            role="group"
            aria-label="Days of week"
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
                    w-9 h-9 text-xs font-medium rounded border transition-colors
                    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-amber-400'
                    }
                  `}
                  data-testid={`${effectiveTestId}-day-${day.value}`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Options */}
      {formState.type === 'monthly' && (
        <div className="space-y-3">
          <span className="text-sm text-gray-600 block">Repeat on:</span>

          {/* Day of Month option */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`${baseId}-monthly-mode`}
              value="dayOfMonth"
              checked={formState.monthlyMode === 'dayOfMonth'}
              onChange={() => handleMonthlyModeChange('dayOfMonth')}
              disabled={disabled}
              className="w-4 h-4 text-amber-500 border-gray-300 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">Same day each month</span>
          </label>

          {/* Nth Weekday option */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`${baseId}-monthly-mode`}
              value="nthWeekday"
              checked={formState.monthlyMode === 'nthWeekday'}
              onChange={() => handleMonthlyModeChange('nthWeekday')}
              disabled={disabled}
              className="w-4 h-4 text-amber-500 border-gray-300 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">Specific weekday</span>
          </label>

          {formState.monthlyMode === 'nthWeekday' && (
            <div className="flex items-center gap-2 pl-6">
              <select
                value={formState.nthWeekday?.n ?? 1}
                onChange={(e) =>
                  handleNthWeekdayChange(
                    parseInt(e.target.value, 10),
                    formState.nthWeekday?.weekday ?? 1
                  )
                }
                disabled={disabled}
                className="
                  px-2 py-1 text-sm border border-gray-300 rounded
                  focus:outline-none focus:ring-2 focus:ring-amber-500
                  disabled:opacity-50
                "
                data-testid={`${effectiveTestId}-nth-select`}
              >
                {NTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={formState.nthWeekday?.weekday ?? 1}
                onChange={(e) =>
                  handleNthWeekdayChange(
                    formState.nthWeekday?.n ?? 1,
                    parseInt(e.target.value, 10)
                  )
                }
                disabled={disabled}
                className="
                  px-2 py-1 text-sm border border-gray-300 rounded
                  focus:outline-none focus:ring-2 focus:ring-amber-500
                  disabled:opacity-50
                "
                data-testid={`${effectiveTestId}-weekday-select`}
              >
                {WEEKDAY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Specific Dates option */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`${baseId}-monthly-mode`}
              value="specificDates"
              checked={formState.monthlyMode === 'specificDates'}
              onChange={() => handleMonthlyModeChange('specificDates')}
              disabled={disabled}
              className="w-4 h-4 text-amber-500 border-gray-300 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">Specific dates of month</span>
          </label>

          {formState.monthlyMode === 'specificDates' && (
            <div className="pl-6">
              <p className="text-xs text-gray-500 mb-2">Select dates (e.g., 1st and 15th):</p>
              <div className="flex flex-wrap gap-1 max-w-xs">
                {[1, 5, 10, 15, 20, 25, 28, 31].map((date) => {
                  const isSelected = formState.specificDatesOfMonth.includes(date);
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => handleSpecificDateToggle(date)}
                      disabled={disabled}
                      aria-pressed={isSelected}
                      className={`
                        w-9 h-9 text-xs font-medium rounded border transition-colors
                        focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1
                        disabled:opacity-50
                        ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-amber-400'
                        }
                      `}
                      data-testid={`${effectiveTestId}-date-${date}`}
                    >
                      {date}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* After Completion Options */}
      {formState.type === 'afterCompletion' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Next occurrence will be scheduled after you complete the current task.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Repeat</span>
            <input
              type="number"
              value={formState.daysAfterCompletion}
              onChange={handleDaysAfterCompletionChange}
              disabled={disabled}
              min={1}
              max={365}
              className="
                w-16 px-2 py-1 text-sm border border-gray-300 rounded
                focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                disabled:opacity-50 disabled:bg-gray-100
              "
              data-testid={`${effectiveTestId}-days-after-input`}
            />
            <span className="text-sm text-gray-700">days after completion</span>
          </div>
        </div>
      )}

      {/* End Condition (not for afterCompletion - those are open-ended) */}
      {showEndCondition && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Ends:</span>

          {/* After X occurrences */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`${baseId}-end-type`}
              value="occurrences"
              checked={formState.endType === 'occurrences'}
              onChange={() => handleEndTypeChange('occurrences')}
              disabled={disabled}
              className="
                w-4 h-4 text-amber-500 border-gray-300
                focus:ring-amber-500 focus:ring-2
                disabled:opacity-50
              "
              data-testid={`${effectiveTestId}-end-occurrences`}
            />
            <span className="text-sm text-gray-700">After</span>
            <input
              type="number"
              value={formState.maxOccurrences ?? ''}
              onChange={handleMaxOccurrencesChange}
              disabled={disabled || formState.endType !== 'occurrences'}
              min={1}
              max={999}
              className="
                w-16 px-2 py-1 text-sm border border-gray-300 rounded
                focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                disabled:opacity-50 disabled:bg-gray-100
              "
              data-testid={`${effectiveTestId}-occurrences-input`}
            />
            <span className="text-sm text-gray-700">occurrences</span>
          </label>

          {/* Until date */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`${baseId}-end-type`}
              value="date"
              checked={formState.endType === 'date'}
              onChange={() => handleEndTypeChange('date')}
              disabled={disabled}
              className="
                w-4 h-4 text-amber-500 border-gray-300
                focus:ring-amber-500 focus:ring-2
                disabled:opacity-50
              "
              data-testid={`${effectiveTestId}-end-date`}
            />
            <span className="text-sm text-gray-700">Until date</span>
          </label>

          {formState.endType === 'date' && (
            <div className="pl-6">
              <DatePicker
                value={formState.endDate}
                onChange={handleEndDateChange}
                minDate={new Date()}
                disabled={disabled}
                testId={`${effectiveTestId}-end-date-picker`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RecurrenceFormSimple;
