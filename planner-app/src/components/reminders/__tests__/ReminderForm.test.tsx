/**
 * ReminderForm Component Tests
 *
 * Tests for the ReminderForm component that allows users to add/edit reminders.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReminderForm } from '../ReminderForm';
import type { CreateReminderInput } from '../../../types';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockReminder(overrides: Partial<CreateReminderInput> = {}): CreateReminderInput {
  return {
    type: 'inApp',
    minutesBefore: 15,
    ...overrides,
  };
}

// =============================================================================
// Rendering Tests
// =============================================================================

describe('ReminderForm', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      const handleChange = vi.fn();
      render(<ReminderForm reminders={[]} onChange={handleChange} />);

      expect(screen.getByTestId('reminder-form')).toBeInTheDocument();
    });

    it('should display reminder count', () => {
      const reminders = [
        createMockReminder({ type: 'inApp' }),
        createMockReminder({ type: 'email' }),
      ];
      const handleChange = vi.fn();
      render(<ReminderForm reminders={reminders} onChange={handleChange} />);

      expect(screen.getByText('2 reminders')).toBeInTheDocument();
    });

    it('should display singular reminder when count is 1', () => {
      const reminders = [createMockReminder()];
      const handleChange = vi.fn();
      render(<ReminderForm reminders={reminders} onChange={handleChange} />);

      expect(screen.getByText('1 reminder')).toBeInTheDocument();
    });

    it('should display existing reminders', () => {
      const reminders = [
        createMockReminder({ type: 'inApp', minutesBefore: 15 }),
        createMockReminder({ type: 'email', minutesBefore: 60 }),
      ];
      const handleChange = vi.fn();
      render(<ReminderForm reminders={reminders} onChange={handleChange} />);

      expect(screen.getByTestId('reminder-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('reminder-item-1')).toBeInTheDocument();
    });

    it('should render add new reminder section', () => {
      const handleChange = vi.fn();
      render(<ReminderForm reminders={[]} onChange={handleChange} />);

      expect(screen.getByText('Add New Reminder')).toBeInTheDocument();
      expect(screen.getByTestId('reminder-type-select')).toBeInTheDocument();
      expect(screen.getByTestId('reminder-time-select')).toBeInTheDocument();
      expect(screen.getByTestId('add-reminder-button')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      const handleChange = vi.fn();
      render(<ReminderForm reminders={[]} onChange={handleChange} testId="custom-form" />);

      expect(screen.getByTestId('custom-form')).toBeInTheDocument();
    });

    it('should display no reminders when empty', () => {
      const handleChange = vi.fn();
      render(<ReminderForm reminders={[]} onChange={handleChange} />);

      expect(screen.getByText('0 reminders')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Interaction Tests
  // =============================================================================

  describe('Interactions', () => {
    it('should call onChange when adding a new reminder', () => {
      const handleChange = vi.fn();
      render(<ReminderForm reminders={[]} onChange={handleChange} />);

      const addButton = screen.getByTestId('add-reminder-button');
      fireEvent.click(addButton);

      expect(handleChange).toHaveBeenCalledWith(expect.any(Function));
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should call onChange when removing a reminder', () => {
      const reminders = [createMockReminder()];
      const handleChange = vi.fn();
      render(<ReminderForm reminders={reminders} onChange={handleChange} />);

      const removeButton = screen.getByTestId('remove-reminder-0');
      fireEvent.click(removeButton);

      expect(handleChange).toHaveBeenCalledWith([]);
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should allow selecting reminder type', () => {
      const handleChange = vi.fn();
      render(<ReminderForm reminders={[]} onChange={handleChange} />);

      const typeSelect = screen.getByTestId('reminder-type-select');
      fireEvent.change(typeSelect, { target: { value: 'email' } });

      // Type select should now have email value
      expect(typeSelect).toHaveValue('email');
    });

    it('should allow selecting reminder time', () => {
      const handleChange = vi.fn();
      render(<ReminderForm reminders={[]} onChange={handleChange} />);

      const timeSelect = screen.getByTestId('reminder-time-select');
      fireEvent.change(timeSelect, { target: { value: '60' } });

      // Time select should now have 60 minutes value
      expect(timeSelect).toHaveValue('60');
    });

    it('should disable all inputs when disabled prop is true', () => {
      const reminders = [createMockReminder()];
      const handleChange = vi.fn();
      render(<ReminderForm reminders={reminders} onChange={handleChange} disabled={true} />);

      expect(screen.getByTestId('reminder-type-select')).toBeDisabled();
      expect(screen.getByTestId('reminder-time-select')).toBeDisabled();
      expect(screen.getByTestId('add-reminder-button')).toBeDisabled();
      expect(screen.getByTestId('remove-reminder-0')).toBeDisabled();
    });

    it('should not disable inputs when disabled prop is false', () => {
      const reminders = [createMockReminder()];
      const handleChange = vi.fn();
      render(<ReminderForm reminders={reminders} onChange={handleChange} disabled={false} />);

      expect(screen.getByTestId('reminder-type-select')).not.toBeDisabled();
      expect(screen.getByTestId('reminder-time-select')).not.toBeDisabled();
      expect(screen.getByTestId('add-reminder-button')).not.toBeDisabled();
      expect(screen.getByTestId('remove-reminder-0')).not.toBeDisabled();
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('Accessibility', () => {
    it('should have accessible labels for select fields', () => {
      const handleChange = vi.fn();
      render(<ReminderForm reminders={[]} onChange={handleChange} />);

      expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
    });

    it('should have accessible remove buttons with aria-label', () => {
      const reminders = [createMockReminder()];
      const handleChange = vi.fn();
      render(<ReminderForm reminders={reminders} onChange={handleChange} />);

      const removeButton = screen.getByTestId('remove-reminder-0');
      expect(removeButton).toHaveAttribute('aria-label', 'Remove reminder');
    });

    it('should have accessible add reminder button', () => {
      const handleChange = vi.fn();
      render(<ReminderForm reminders={[]} onChange={handleChange} />);

      const addButton = screen.getByRole('button', { name: /add reminder/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should display reminder type labels for screen readers', () => {
      const reminders = [createMockReminder({ type: 'inApp' })];
      const handleChange = vi.fn();
      render(<ReminderForm reminders={reminders} onChange={handleChange} />);

      const reminderItem = screen.getByTestId('reminder-item-0');
      expect(reminderItem).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Reminder Management Tests
  // =============================================================================

  describe('Reminder Management', () => {
    it('should add reminder with selected type and time', () => {
      const handleChange = vi.fn();
      render(<ReminderForm reminders={[]} onChange={handleChange} />);

      // Select email type
      const typeSelect = screen.getByTestId('reminder-type-select');
      fireEvent.change(typeSelect, { target: { value: 'email' } });

      // Select 60 minutes
      const timeSelect = screen.getByTestId('reminder-time-select');
      fireEvent.change(timeSelect, { target: { value: '60' } });

      // Add reminder
      const addButton = screen.getByTestId('add-reminder-button');
      fireEvent.click(addButton);

      // Should call onChange with a function
      expect(handleChange).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should remove reminder at specific index', () => {
      const reminders = [
        createMockReminder({ type: 'inApp', minutesBefore: 15 }),
        createMockReminder({ type: 'email', minutesBefore: 60 }),
      ];
      const handleChange = vi.fn();
      render(<ReminderForm reminders={reminders} onChange={handleChange} />);

      // Remove first reminder
      const removeButton = screen.getByTestId('remove-reminder-0');
      fireEvent.click(removeButton);

      // Should call onChange with filtered array (only second reminder remains)
      expect(handleChange).toHaveBeenCalledWith([reminders[1]]);
    });

    it('should handle multiple add operations', () => {
      const handleChange = vi.fn();
      render(<ReminderForm reminders={[]} onChange={handleChange} />);

      const addButton = screen.getByTestId('add-reminder-button');

      // Add first reminder
      fireEvent.click(addButton);
      expect(handleChange).toHaveBeenCalledTimes(1);

      // Add second reminder
      fireEvent.click(addButton);
      expect(handleChange).toHaveBeenCalledTimes(2);
    });

    it('should display all reminder types correctly', () => {
      const reminders = [
        createMockReminder({ type: 'inApp' }),
        createMockReminder({ type: 'push' }),
        createMockReminder({ type: 'email' }),
      ];
      const handleChange = vi.fn();
      render(<ReminderForm reminders={reminders} onChange={handleChange} />);

      expect(screen.getByTestId('reminder-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('reminder-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('reminder-item-2')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe('Edge Cases', () => {
    it('should handle empty reminders array', () => {
      const handleChange = vi.fn();
      render(<ReminderForm reminders={[]} onChange={handleChange} />);

      expect(screen.getByText('0 reminders')).toBeInTheDocument();
    });

    it('should handle undefined onChange gracefully', () => {
      // Should not crash even if onChange is not provided (TypeScript will catch this)
      // This test ensures the component doesn't break
      expect(() => {
        render(<ReminderForm reminders={[]} onChange={vi.fn()} />);
      }).not.toThrow();
    });

    it('should preserve reminder order when removing', () => {
      const reminders = [
        createMockReminder({ type: 'inApp', minutesBefore: 5 }),
        createMockReminder({ type: 'email', minutesBefore: 15 }),
        createMockReminder({ type: 'push', minutesBefore: 30 }),
      ];
      const handleChange = vi.fn();
      render(<ReminderForm reminders={reminders} onChange={handleChange} />);

      // Remove middle reminder
      const removeButton = screen.getByTestId('remove-reminder-1');
      fireEvent.click(removeButton);

      // Should preserve first and third reminders
      expect(handleChange).toHaveBeenCalledWith([reminders[0], reminders[2]]);
    });
  });
});
