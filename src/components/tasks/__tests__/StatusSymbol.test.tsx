/**
 * StatusSymbol Component Tests
 *
 * Comprehensive tests for the StatusSymbol component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusSymbol } from '../StatusSymbol';
import type { TaskStatus } from '../../../types';

// =============================================================================
// Rendering Tests
// =============================================================================

describe('StatusSymbol', () => {
  describe('Rendering', () => {
    it('should render in_progress status symbol', () => {
      render(<StatusSymbol status="in_progress" />);
      expect(screen.getByTestId('status-symbol')).toHaveTextContent('●');
    });

    it('should render forward status symbol', () => {
      render(<StatusSymbol status="forward" />);
      expect(screen.getByTestId('status-symbol')).toHaveTextContent('➜');
    });

    it('should render complete status symbol', () => {
      render(<StatusSymbol status="complete" />);
      expect(screen.getByTestId('status-symbol')).toHaveTextContent('✔');
    });

    it('should render delete status symbol', () => {
      render(<StatusSymbol status="delete" />);
      expect(screen.getByTestId('status-symbol')).toHaveTextContent('✘');
    });

    it('should render delegate status symbol', () => {
      render(<StatusSymbol status="delegate" />);
      expect(screen.getByTestId('status-symbol')).toHaveTextContent('◯');
    });

    it('should render all status symbols correctly', () => {
      const statuses: { status: TaskStatus; symbol: string }[] = [
        { status: 'in_progress', symbol: '●' },
        { status: 'forward', symbol: '➜' },
        { status: 'complete', symbol: '✔' },
        { status: 'delete', symbol: '✘' },
        { status: 'delegate', symbol: '◯' },
      ];

      for (const { status, symbol } of statuses) {
        const { unmount } = render(<StatusSymbol status={status} />);
        expect(screen.getByTestId('status-symbol')).toHaveTextContent(symbol);
        unmount();
      }
    });

    it('should apply correct color for each status', () => {
      const statusColors: { status: TaskStatus; color: string }[] = [
        { status: 'in_progress', color: 'rgb(59, 130, 246)' }, // #3B82F6
        { status: 'forward', color: 'rgb(139, 92, 246)' }, // #8B5CF6
        { status: 'complete', color: 'rgb(34, 197, 94)' }, // #22C55E
        { status: 'delete', color: 'rgb(239, 68, 68)' }, // #EF4444
        { status: 'delegate', color: 'rgb(249, 115, 22)' }, // #F97316
      ];

      for (const { status, color } of statusColors) {
        const { unmount } = render(<StatusSymbol status={status} />);
        expect(screen.getByTestId('status-symbol')).toHaveStyle({ color });
        unmount();
      }
    });

    it('should show spinner when updating', () => {
      render(<StatusSymbol status="in_progress" isUpdating={true} />);

      expect(screen.getByTestId('status-spinner')).toBeInTheDocument();
      expect(screen.queryByText('●')).not.toBeInTheDocument();
    });

    it('should hide symbol when showing spinner', () => {
      render(<StatusSymbol status="complete" isUpdating={true} />);

      expect(screen.getByTestId('status-spinner')).toBeInTheDocument();
      expect(screen.queryByText('✔')).not.toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      render(<StatusSymbol status="in_progress" testId="custom-status" />);
      expect(screen.getByTestId('custom-status')).toBeInTheDocument();
    });

    it('should set data-status attribute', () => {
      render(<StatusSymbol status="forward" />);
      expect(screen.getByTestId('status-symbol')).toHaveAttribute('data-status', 'forward');
    });
  });

  // =============================================================================
  // Size Variant Tests
  // =============================================================================

  describe('Size Variants', () => {
    it('should render with default md size', () => {
      render(<StatusSymbol status="in_progress" />);
      const button = screen.getByTestId('status-symbol');
      expect(button).toHaveClass('w-6', 'h-6', 'text-lg');
    });

    it('should render with sm size', () => {
      render(<StatusSymbol status="in_progress" size="sm" />);
      const button = screen.getByTestId('status-symbol');
      expect(button).toHaveClass('w-5', 'h-5', 'text-sm');
    });

    it('should render with lg size', () => {
      render(<StatusSymbol status="in_progress" size="lg" />);
      const button = screen.getByTestId('status-symbol');
      expect(button).toHaveClass('w-8', 'h-8', 'text-2xl');
    });

    it('should render correct spinner size for sm', () => {
      render(<StatusSymbol status="in_progress" size="sm" isUpdating={true} />);
      const spinner = screen.getByTestId('status-spinner');
      expect(spinner).toHaveClass('w-3', 'h-3');
    });

    it('should render correct spinner size for md', () => {
      render(<StatusSymbol status="in_progress" size="md" isUpdating={true} />);
      const spinner = screen.getByTestId('status-spinner');
      expect(spinner).toHaveClass('w-4', 'h-4');
    });

    it('should render correct spinner size for lg', () => {
      render(<StatusSymbol status="in_progress" size="lg" isUpdating={true} />);
      const spinner = screen.getByTestId('status-spinner');
      expect(spinner).toHaveClass('w-5', 'h-5');
    });
  });

  // =============================================================================
  // Interaction Tests
  // =============================================================================

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<StatusSymbol status="in_progress" onClick={handleClick} />);

      fireEvent.click(screen.getByTestId('status-symbol'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<StatusSymbol status="in_progress" onClick={handleClick} disabled={true} />);

      fireEvent.click(screen.getByTestId('status-symbol'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when updating', () => {
      const handleClick = vi.fn();
      render(<StatusSymbol status="in_progress" onClick={handleClick} isUpdating={true} />);

      fireEvent.click(screen.getByTestId('status-symbol'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should stop propagation on click', () => {
      const handleClick = vi.fn();
      const handleParentClick = vi.fn();

      render(
        <div onClick={handleParentClick}>
          <StatusSymbol status="in_progress" onClick={handleClick} />
        </div>
      );

      fireEvent.click(screen.getByTestId('status-symbol'));

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleParentClick).not.toHaveBeenCalled();
    });

    it('should not error when onClick is not provided', () => {
      render(<StatusSymbol status="in_progress" />);

      expect(() => {
        fireEvent.click(screen.getByTestId('status-symbol'));
      }).not.toThrow();
    });
  });

  // =============================================================================
  // Keyboard Navigation Tests
  // =============================================================================

  describe('Keyboard Navigation', () => {
    it('should call onClick on ArrowRight', () => {
      const handleClick = vi.fn();
      render(<StatusSymbol status="in_progress" onClick={handleClick} />);

      fireEvent.keyDown(screen.getByTestId('status-symbol'), { key: 'ArrowRight' });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick on ArrowDown', () => {
      const handleClick = vi.fn();
      render(<StatusSymbol status="in_progress" onClick={handleClick} />);

      fireEvent.keyDown(screen.getByTestId('status-symbol'), { key: 'ArrowDown' });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onCycleBackward on ArrowLeft', () => {
      const handleCycleBackward = vi.fn();
      render(<StatusSymbol status="in_progress" onCycleBackward={handleCycleBackward} />);

      fireEvent.keyDown(screen.getByTestId('status-symbol'), { key: 'ArrowLeft' });

      expect(handleCycleBackward).toHaveBeenCalledTimes(1);
    });

    it('should call onCycleBackward on ArrowUp', () => {
      const handleCycleBackward = vi.fn();
      render(<StatusSymbol status="in_progress" onCycleBackward={handleCycleBackward} />);

      fireEvent.keyDown(screen.getByTestId('status-symbol'), { key: 'ArrowUp' });

      expect(handleCycleBackward).toHaveBeenCalledTimes(1);
    });

    it('should stop propagation on arrow key press', () => {
      const handleClick = vi.fn();
      const handleParentKeyDown = vi.fn();

      render(
        <div onKeyDown={handleParentKeyDown}>
          <StatusSymbol status="in_progress" onClick={handleClick} />
        </div>
      );

      fireEvent.keyDown(screen.getByTestId('status-symbol'), { key: 'ArrowRight' });

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleParentKeyDown).not.toHaveBeenCalled();
    });

    it('should not call onClick on arrow keys when disabled', () => {
      const handleClick = vi.fn();
      render(<StatusSymbol status="in_progress" onClick={handleClick} disabled={true} />);

      fireEvent.keyDown(screen.getByTestId('status-symbol'), { key: 'ArrowRight' });

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick on arrow keys when updating', () => {
      const handleClick = vi.fn();
      render(<StatusSymbol status="in_progress" onClick={handleClick} isUpdating={true} />);

      fireEvent.keyDown(screen.getByTestId('status-symbol'), { key: 'ArrowRight' });

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call callbacks on other keys', () => {
      const handleClick = vi.fn();
      const handleCycleBackward = vi.fn();
      render(
        <StatusSymbol
          status="in_progress"
          onClick={handleClick}
          onCycleBackward={handleCycleBackward}
        />
      );

      fireEvent.keyDown(screen.getByTestId('status-symbol'), { key: 'Tab' });

      expect(handleClick).not.toHaveBeenCalled();
      expect(handleCycleBackward).not.toHaveBeenCalled();
    });
  });

  // =============================================================================
  // Tooltip Tests
  // =============================================================================

  describe('Tooltip', () => {
    it('should have tooltip with status info', () => {
      render(<StatusSymbol status="in_progress" />);

      const button = screen.getByTestId('status-symbol');
      expect(button).toHaveAttribute('title');
      expect(button.getAttribute('title')).toContain('In Progress');
      expect(button.getAttribute('title')).toContain('Click to change to Complete');
    });

    it('should show correct next status in tooltip', () => {
      const statusTransitions: { status: TaskStatus; nextLabel: string }[] = [
        { status: 'in_progress', nextLabel: 'Complete' },
        { status: 'complete', nextLabel: 'Forwarded' },
        { status: 'forward', nextLabel: 'Delegated' },
        { status: 'delegate', nextLabel: 'Deleted' },
        { status: 'delete', nextLabel: 'In Progress' },
      ];

      for (const { status, nextLabel } of statusTransitions) {
        const { unmount } = render(<StatusSymbol status={status} />);
        const button = screen.getByTestId('status-symbol');
        expect(button.getAttribute('title')).toContain(`Click to change to ${nextLabel}`);
        unmount();
      }
    });

    it('should include status description in tooltip', () => {
      render(<StatusSymbol status="complete" />);

      const button = screen.getByTestId('status-symbol');
      expect(button.getAttribute('title')).toContain('Task has been completed');
    });

    it('should not have tooltip when showTooltip is false', () => {
      render(<StatusSymbol status="in_progress" showTooltip={false} />);

      const button = screen.getByTestId('status-symbol');
      expect(button).not.toHaveAttribute('title');
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('Accessibility', () => {
    it('should have accessible aria-label', () => {
      render(<StatusSymbol status="in_progress" />);

      const button = screen.getByTestId('status-symbol');
      expect(button).toHaveAttribute('aria-label', 'Status: In Progress. Click to change.');
    });

    it('should have updating aria-label when updating', () => {
      render(<StatusSymbol status="in_progress" isUpdating={true} />);

      const button = screen.getByTestId('status-symbol');
      expect(button).toHaveAttribute('aria-label', 'Status: In Progress. Updating...');
    });

    it('should have aria-busy when updating', () => {
      render(<StatusSymbol status="in_progress" isUpdating={true} />);

      const button = screen.getByTestId('status-symbol');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should have aria-busy false when not updating', () => {
      render(<StatusSymbol status="in_progress" isUpdating={false} />);

      const button = screen.getByTestId('status-symbol');
      expect(button).toHaveAttribute('aria-busy', 'false');
    });

    it('should have aria-disabled when disabled', () => {
      render(<StatusSymbol status="in_progress" disabled={true} />);

      const button = screen.getByTestId('status-symbol');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have aria-disabled when updating', () => {
      render(<StatusSymbol status="in_progress" isUpdating={true} />);

      const button = screen.getByTestId('status-symbol');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should be a button element', () => {
      render(<StatusSymbol status="in_progress" />);

      const button = screen.getByTestId('status-symbol');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have type="button"', () => {
      render(<StatusSymbol status="in_progress" />);

      const button = screen.getByTestId('status-symbol');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should be disabled when updating', () => {
      render(<StatusSymbol status="in_progress" isUpdating={true} />);

      const button = screen.getByTestId('status-symbol');
      expect(button).toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<StatusSymbol status="in_progress" disabled={true} />);

      const button = screen.getByTestId('status-symbol');
      expect(button).toBeDisabled();
    });

    it('should have aria-hidden on symbol span', () => {
      render(<StatusSymbol status="in_progress" />);

      const button = screen.getByTestId('status-symbol');
      const symbolSpan = button.querySelector('span[aria-hidden="true"]');
      expect(symbolSpan).toBeInTheDocument();
    });

    it('should have aria-hidden on spinner', () => {
      render(<StatusSymbol status="in_progress" isUpdating={true} />);

      const spinner = screen.getByTestId('status-spinner');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  // =============================================================================
  // Disabled State Tests
  // =============================================================================

  describe('Disabled State', () => {
    it('should have reduced opacity when disabled', () => {
      render(<StatusSymbol status="in_progress" disabled={true} />);

      const button = screen.getByTestId('status-symbol');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should have cursor-not-allowed when disabled', () => {
      render(<StatusSymbol status="in_progress" disabled={true} />);

      const button = screen.getByTestId('status-symbol');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });

    it('should not have color style when disabled', () => {
      render(<StatusSymbol status="in_progress" disabled={true} />);

      const button = screen.getByTestId('status-symbol');
      // When disabled, inline color style is removed
      expect(button.style.color).toBe('');
    });

    it('should not have color style when updating', () => {
      render(<StatusSymbol status="in_progress" isUpdating={true} />);

      const button = screen.getByTestId('status-symbol');
      expect(button.style.color).toBe('');
    });
  });
});
