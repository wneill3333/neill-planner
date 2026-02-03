/**
 * Icon Components Tests
 *
 * Comprehensive tests for icon components.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckIcon, CalendarIcon, NoteIcon } from '../index';

// =============================================================================
// CheckIcon Tests
// =============================================================================

describe('CheckIcon', () => {
  describe('Rendering', () => {
    it('should render check icon', () => {
      const { container } = render(<CheckIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have correct viewBox', () => {
      const { container } = render(<CheckIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should have default className', () => {
      const { container } = render(<CheckIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-5', 'h-5');
    });

    it('should apply custom className', () => {
      const { container } = render(<CheckIcon className="w-6 h-6 text-blue-500" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-6', 'h-6', 'text-blue-500');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-hidden when no ariaLabel provided', () => {
      const { container } = render(<CheckIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have aria-label when provided', () => {
      const { container } = render(<CheckIcon ariaLabel="Task icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-label', 'Task icon');
    });

    it('should not have aria-hidden when ariaLabel provided', () => {
      const { container } = render(<CheckIcon ariaLabel="Task icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'false');
    });
  });

  describe('SVG Structure', () => {
    it('should have no fill and stroke currentColor', () => {
      const { container } = render(<CheckIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
    });

    it('should contain path element', () => {
      const { container } = render(<CheckIcon />);
      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
    });

    it('should have strokeWidth of 2', () => {
      const { container } = render(<CheckIcon />);
      const path = container.querySelector('path');
      expect(path).toHaveAttribute('stroke-width', '2');
    });
  });
});

// =============================================================================
// CalendarIcon Tests
// =============================================================================

describe('CalendarIcon', () => {
  describe('Rendering', () => {
    it('should render calendar icon', () => {
      const { container } = render(<CalendarIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have correct viewBox', () => {
      const { container } = render(<CalendarIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should have default className', () => {
      const { container } = render(<CalendarIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-5', 'h-5');
    });

    it('should apply custom className', () => {
      const { container } = render(<CalendarIcon className="w-8 h-8 text-red-500" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-8', 'h-8', 'text-red-500');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-hidden when no ariaLabel provided', () => {
      const { container } = render(<CalendarIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have aria-label when provided', () => {
      const { container } = render(<CalendarIcon ariaLabel="Calendar icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-label', 'Calendar icon');
    });

    it('should not have aria-hidden when ariaLabel provided', () => {
      const { container } = render(<CalendarIcon ariaLabel="Calendar icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'false');
    });
  });

  describe('SVG Structure', () => {
    it('should have no fill and stroke currentColor', () => {
      const { container } = render(<CalendarIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
    });

    it('should contain path element', () => {
      const { container } = render(<CalendarIcon />);
      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
    });

    it('should have strokeWidth of 2', () => {
      const { container } = render(<CalendarIcon />);
      const path = container.querySelector('path');
      expect(path).toHaveAttribute('stroke-width', '2');
    });
  });
});

// =============================================================================
// NoteIcon Tests
// =============================================================================

describe('NoteIcon', () => {
  describe('Rendering', () => {
    it('should render note icon', () => {
      const { container } = render(<NoteIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have correct viewBox', () => {
      const { container } = render(<NoteIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should have default className', () => {
      const { container } = render(<NoteIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-5', 'h-5');
    });

    it('should apply custom className', () => {
      const { container } = render(<NoteIcon className="w-4 h-4 text-green-500" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-4', 'h-4', 'text-green-500');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-hidden when no ariaLabel provided', () => {
      const { container } = render(<NoteIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have aria-label when provided', () => {
      const { container } = render(<NoteIcon ariaLabel="Note icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-label', 'Note icon');
    });

    it('should not have aria-hidden when ariaLabel provided', () => {
      const { container } = render(<NoteIcon ariaLabel="Note icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'false');
    });
  });

  describe('SVG Structure', () => {
    it('should have no fill and stroke currentColor', () => {
      const { container } = render(<NoteIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
    });

    it('should contain path element', () => {
      const { container } = render(<NoteIcon />);
      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
    });

    it('should have strokeWidth of 2', () => {
      const { container } = render(<NoteIcon />);
      const path = container.querySelector('path');
      expect(path).toHaveAttribute('stroke-width', '2');
    });
  });
});

// =============================================================================
// Icon Consistency Tests
// =============================================================================

describe('Icon Consistency', () => {
  it('all icons should have same default size', () => {
    const { container: checkContainer } = render(<CheckIcon />);
    const { container: calendarContainer } = render(<CalendarIcon />);
    const { container: noteContainer } = render(<NoteIcon />);

    const checkSvg = checkContainer.querySelector('svg');
    const calendarSvg = calendarContainer.querySelector('svg');
    const noteSvg = noteContainer.querySelector('svg');

    expect(checkSvg).toHaveClass('w-5', 'h-5');
    expect(calendarSvg).toHaveClass('w-5', 'h-5');
    expect(noteSvg).toHaveClass('w-5', 'h-5');
  });

  it('all icons should have same viewBox', () => {
    const { container: checkContainer } = render(<CheckIcon />);
    const { container: calendarContainer } = render(<CalendarIcon />);
    const { container: noteContainer } = render(<NoteIcon />);

    const checkSvg = checkContainer.querySelector('svg');
    const calendarSvg = calendarContainer.querySelector('svg');
    const noteSvg = noteContainer.querySelector('svg');

    expect(checkSvg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(calendarSvg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(noteSvg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('all icons should support custom className', () => {
    const customClass = 'w-10 h-10 text-purple-500';
    const { container: checkContainer } = render(<CheckIcon className={customClass} />);
    const { container: calendarContainer } = render(<CalendarIcon className={customClass} />);
    const { container: noteContainer } = render(<NoteIcon className={customClass} />);

    const checkSvg = checkContainer.querySelector('svg');
    const calendarSvg = calendarContainer.querySelector('svg');
    const noteSvg = noteContainer.querySelector('svg');

    expect(checkSvg).toHaveClass('w-10', 'h-10', 'text-purple-500');
    expect(calendarSvg).toHaveClass('w-10', 'h-10', 'text-purple-500');
    expect(noteSvg).toHaveClass('w-10', 'h-10', 'text-purple-500');
  });
});
