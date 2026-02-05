/**
 * FloatingActionButton Component Tests
 *
 * Comprehensive tests for the FloatingActionButton component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { FloatingActionButton } from '../FloatingActionButton';

// =============================================================================
// Rendering Tests
// =============================================================================

describe('FloatingActionButton', () => {
  describe('Rendering', () => {
    it('should render with default plus icon', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      expect(screen.getByTestId('floating-action-button')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      render(
        <FloatingActionButton ariaLabel="Add" onClick={() => {}} testId="custom-fab" />
      );
      expect(screen.getByTestId('custom-fab')).toBeInTheDocument();
    });

    it('should render as a button element', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab.tagName).toBe('BUTTON');
    });

    it('should have type="button" to prevent form submission', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).toHaveAttribute('type', 'button');
    });
  });

  // =============================================================================
  // Icon Variants Tests
  // =============================================================================

  describe('Icon Variants', () => {
    it('should render plus icon by default', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      const svg = fab.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render plus icon when icon="plus"', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} icon="plus" />);
      const fab = screen.getByTestId('floating-action-button');
      const svg = fab.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render edit icon when icon="edit"', () => {
      render(<FloatingActionButton ariaLabel="Edit" onClick={() => {}} icon="edit" />);
      const fab = screen.getByTestId('floating-action-button');
      const svg = fab.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render save icon when icon="save"', () => {
      render(<FloatingActionButton ariaLabel="Save" onClick={() => {}} icon="save" />);
      const fab = screen.getByTestId('floating-action-button');
      const svg = fab.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render custom icon when provided', () => {
      const CustomIcon = () => <span data-testid="custom-icon">Custom</span>;
      render(
        <FloatingActionButton
          ariaLabel="Custom"
          onClick={() => {}}
          customIcon={<CustomIcon />}
        />
      );
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should prefer custom icon over icon prop', () => {
      const CustomIcon = () => <span data-testid="custom-icon">Custom</span>;
      render(
        <FloatingActionButton
          ariaLabel="Custom"
          onClick={() => {}}
          icon="edit"
          customIcon={<CustomIcon />}
        />
      );
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Interaction Tests
  // =============================================================================

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<FloatingActionButton ariaLabel="Add" onClick={handleClick} />);
      fireEvent.click(screen.getByTestId('floating-action-button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick multiple times on multiple clicks', () => {
      const handleClick = vi.fn();
      render(<FloatingActionButton ariaLabel="Add" onClick={handleClick} />);
      const fab = screen.getByTestId('floating-action-button');
      fireEvent.click(fab);
      fireEvent.click(fab);
      fireEvent.click(fab);
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<FloatingActionButton ariaLabel="Add" onClick={handleClick} disabled />);
      fireEvent.click(screen.getByTestId('floating-action-button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // =============================================================================
  // Disabled State Tests
  // =============================================================================

  describe('Disabled State', () => {
    it('should have disabled attribute when disabled', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} disabled />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).toBeDisabled();
    });

    it('should not have disabled attribute when not disabled', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).not.toBeDisabled();
    });

    it('should not have disabled attribute when disabled is false', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} disabled={false} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).not.toBeDisabled();
    });

    it('should have disabled styling when disabled', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} disabled />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).toHaveClass('disabled:opacity-50');
      expect(fab).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('Accessibility', () => {
    it('should have correct aria-label', () => {
      render(<FloatingActionButton ariaLabel="Create task" onClick={() => {}} />);
      expect(screen.getByLabelText('Create task')).toBeInTheDocument();
    });

    it('should be findable by aria-label', () => {
      render(<FloatingActionButton ariaLabel="Add new item" onClick={() => {}} />);
      const fab = screen.getByRole('button', { name: 'Add new item' });
      expect(fab).toBeInTheDocument();
    });

    it('should have aria-hidden on SVG icon', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      const svg = fab.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should be keyboard accessible (button element)', () => {
      const handleClick = vi.fn();
      render(<FloatingActionButton ariaLabel="Add" onClick={handleClick} />);
      const fab = screen.getByTestId('floating-action-button');

      // Focus and press Enter
      fab.focus();
      fireEvent.keyDown(fab, { key: 'Enter' });
      fireEvent.keyUp(fab, { key: 'Enter' });
      // Note: fireEvent.keyDown/keyUp don't trigger click on buttons
      // The actual keyboard accessibility is handled by the browser
      expect(fab).toHaveFocus();
    });
  });

  // =============================================================================
  // Styling Tests
  // =============================================================================

  describe('Styling', () => {
    it('should have fixed positioning', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).toHaveClass('fixed');
      expect(fab).toHaveClass('bottom-6');
      expect(fab).toHaveClass('right-6');
    });

    it('should have amber background color', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).toHaveClass('bg-amber-500');
    });

    it('should have rounded-full for circular shape', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).toHaveClass('rounded-full');
    });

    it('should have shadow styling', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).toHaveClass('shadow-lg');
    });

    it('should have focus ring styles', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).toHaveClass('focus:outline-none');
      expect(fab).toHaveClass('focus:ring-4');
      expect(fab).toHaveClass('focus:ring-amber-300');
    });

    it('should have hover styles', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).toHaveClass('hover:bg-amber-600');
      expect(fab).toHaveClass('hover:shadow-xl');
      expect(fab).toHaveClass('hover:scale-110');
    });

    it('should have responsive sizing', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).toHaveClass('w-14');
      expect(fab).toHaveClass('h-14');
      expect(fab).toHaveClass('sm:w-16');
      expect(fab).toHaveClass('sm:h-16');
    });

    it('should have z-index for proper layering', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).toHaveClass('z-40');
    });

    it('should have transition styles', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).toHaveClass('transition-all');
      expect(fab).toHaveClass('duration-200');
    });

    it('should have active scale transform', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).toHaveClass('active:scale-95');
    });

    it('should have white text color', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).toHaveClass('text-white');
    });

    it('should have flex centering for icon', () => {
      render(<FloatingActionButton ariaLabel="Add" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).toHaveClass('flex');
      expect(fab).toHaveClass('items-center');
      expect(fab).toHaveClass('justify-center');
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe('Edge Cases', () => {
    it('should handle empty ariaLabel gracefully', () => {
      render(<FloatingActionButton ariaLabel="" onClick={() => {}} />);
      const fab = screen.getByTestId('floating-action-button');
      expect(fab).toHaveAttribute('aria-label', '');
    });

    it('should handle special characters in ariaLabel', () => {
      render(
        <FloatingActionButton ariaLabel="Add new task (Ctrl+N)" onClick={() => {}} />
      );
      expect(screen.getByLabelText('Add new task (Ctrl+N)')).toBeInTheDocument();
    });

    it('should handle unicode in ariaLabel', () => {
      render(<FloatingActionButton ariaLabel="新しいタスクを追加" onClick={() => {}} />);
      expect(screen.getByLabelText('新しいタスクを追加')).toBeInTheDocument();
    });

    it('should handle rapid clicks', () => {
      const handleClick = vi.fn();
      render(<FloatingActionButton ariaLabel="Add" onClick={handleClick} />);
      const fab = screen.getByTestId('floating-action-button');

      for (let i = 0; i < 10; i++) {
        fireEvent.click(fab);
      }

      expect(handleClick).toHaveBeenCalledTimes(10);
    });
  });
});
