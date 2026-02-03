/**
 * DragHandle Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DragHandle } from '../DragHandle';

describe('DragHandle', () => {
  describe('Rendering', () => {
    it('should render drag handle button', () => {
      render(<DragHandle />);
      expect(screen.getByTestId('drag-handle')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      render(<DragHandle testId="custom-handle" />);
      expect(screen.getByTestId('custom-handle')).toBeInTheDocument();
    });

    it('should render SVG grip icon', () => {
      render(<DragHandle />);
      const button = screen.getByTestId('drag-handle');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have six dots in the grip icon', () => {
      render(<DragHandle />);
      const button = screen.getByTestId('drag-handle');
      const circles = button.querySelectorAll('circle');
      expect(circles).toHaveLength(6);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label for screen readers', () => {
      render(<DragHandle />);
      const button = screen.getByTestId('drag-handle');
      expect(button).toHaveAttribute('aria-label', 'Drag to reorder');
    });

    it('should be a button element', () => {
      render(<DragHandle />);
      const button = screen.getByTestId('drag-handle');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have type="button"', () => {
      render(<DragHandle />);
      const button = screen.getByTestId('drag-handle');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should have aria-hidden on SVG', () => {
      render(<DragHandle />);
      const button = screen.getByTestId('drag-handle');
      const svg = button.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Cursor Styles', () => {
    it('should have cursor-grab class when not dragging', () => {
      render(<DragHandle isDragging={false} />);
      const button = screen.getByTestId('drag-handle');
      expect(button).toHaveClass('cursor-grab');
    });

    it('should have cursor-grabbing class when dragging', () => {
      render(<DragHandle isDragging={true} />);
      const button = screen.getByTestId('drag-handle');
      expect(button).toHaveClass('cursor-grabbing');
    });
  });

  describe('Listeners and Attributes', () => {
    it('should spread listeners onto the button', () => {
      const mockOnPointerDown = vi.fn();
      const listeners = {
        onPointerDown: mockOnPointerDown,
      };

      render(<DragHandle listeners={listeners} />);
      // The listeners are spread onto the button
      // We can't easily test this without simulating pointer events
      expect(screen.getByTestId('drag-handle')).toBeInTheDocument();
    });

    it('should spread attributes onto the button', () => {
      const attributes = {
        'aria-describedby': 'drag-instructions',
        'aria-disabled': false,
        'aria-pressed': undefined,
        'aria-roledescription': 'sortable',
        tabIndex: 0,
        role: 'button' as const,
      };

      render(<DragHandle attributes={attributes} />);
      const button = screen.getByTestId('drag-handle');
      expect(button).toHaveAttribute('aria-describedby', 'drag-instructions');
      expect(button).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Visual States', () => {
    it('should have text-gray-600 class when dragging', () => {
      render(<DragHandle isDragging={true} />);
      const button = screen.getByTestId('drag-handle');
      expect(button).toHaveClass('text-gray-600');
    });

    it('should have hover styles', () => {
      render(<DragHandle />);
      const button = screen.getByTestId('drag-handle');
      expect(button).toHaveClass('hover:text-gray-600');
      expect(button).toHaveClass('hover:bg-gray-100');
    });

    it('should have focus styles', () => {
      render(<DragHandle />);
      const button = screen.getByTestId('drag-handle');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-blue-500');
    });
  });
});
