/**
 * Header Component Tests
 *
 * Comprehensive tests for the Header component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';

// Mock the UserMenu component
vi.mock('../UserMenu', () => ({
  UserMenu: () => <div data-testid="mock-user-menu">UserMenu</div>,
}));

// Mock the useAuth hook
vi.mock('../../../features/auth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    loading: false,
    error: null,
    signOut: vi.fn(),
  }),
}));

// =============================================================================
// Test Setup
// =============================================================================

describe('Header', () => {
  // =============================================================================
  // Rendering Tests
  // =============================================================================

  describe('Rendering', () => {
    it('should render header component', () => {
      render(<Header />);

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      render(<Header testId="custom-header" />);

      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    });

    it('should render app title', () => {
      render(<Header />);

      expect(screen.getByText('Neill Planner')).toBeInTheDocument();
    });

    it('should render app subtitle', () => {
      render(<Header />);

      expect(screen.getByText('Franklin-Covey Productivity System')).toBeInTheDocument();
    });

    it('should render hamburger menu button', () => {
      render(<Header />);

      expect(screen.getByTestId('hamburger-menu-button')).toBeInTheDocument();
    });

    it('should render user menu', () => {
      render(<Header />);

      expect(screen.getByTestId('mock-user-menu')).toBeInTheDocument();
    });

    it('should have banner role', () => {
      render(<Header />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Styling Tests
  // =============================================================================

  describe('Styling', () => {
    it('should have amber gradient background', () => {
      render(<Header />);

      const header = screen.getByTestId('header');
      expect(header).toHaveClass('bg-gradient-to-r', 'from-amber-700', 'to-amber-600');
    });

    it('should have shadow', () => {
      render(<Header />);

      const header = screen.getByTestId('header');
      expect(header).toHaveClass('shadow-lg');
    });

    it('should apply custom className', () => {
      render(<Header className="custom-header-class" />);

      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header-class');
    });

    it('should have responsive padding', () => {
      render(<Header />);

      const container = screen.getByTestId('header').querySelector('.mx-auto');
      expect(container).toHaveClass('py-4', 'sm:py-6');
    });
  });

  // =============================================================================
  // Hamburger Menu Tests
  // =============================================================================

  describe('Hamburger Menu', () => {
    it('should toggle menu when clicked', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');

      // Initially menu should be closed
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');

      // Click to open
      fireEvent.click(button);
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'true');

      // Click to close
      fireEvent.click(button);
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have correct aria-label when menu is closed', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');
      expect(button).toHaveAttribute('aria-label', 'Open menu');
    });

    it('should have correct aria-label when menu is open', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');
      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-label', 'Close menu');
    });

    it('should have aria-controls attribute', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');
      expect(button).toHaveAttribute('aria-controls', 'mobile-menu');
    });

    it('should be hidden on desktop', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');
      expect(button).toHaveClass('md:hidden');
    });

    it('should show hamburger icon when closed', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');
      const svg = button.querySelector('svg');

      expect(svg).toBeInTheDocument();
      // Hamburger has 3 path elements (3 horizontal lines)
      const path = svg?.querySelector('path[d*="M4 6h16M4 12h16M4 18h16"]');
      expect(path).toBeInTheDocument();
    });

    it('should show X icon when open', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');
      fireEvent.click(button);

      const svg = button.querySelector('svg');
      // X icon has crossing paths
      const path = svg?.querySelector('path[d*="M6 18L18 6M6 6l12 12"]');
      expect(path).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Mobile Menu Tests
  // =============================================================================

  describe('Mobile Menu', () => {
    it('should not render mobile menu initially', () => {
      render(<Header />);

      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });

    it('should render mobile menu when hamburger is clicked', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');
      fireEvent.click(button);

      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    });

    it('should have correct id for aria-controls', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');
      fireEvent.click(button);

      const menu = screen.getByTestId('mobile-menu');
      expect(menu).toHaveAttribute('id', 'mobile-menu');
    });

    it('should be hidden on desktop', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');
      fireEvent.click(button);

      const menu = screen.getByTestId('mobile-menu');
      expect(menu).toHaveClass('md:hidden');
    });

    it('should show placeholder text', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');
      fireEvent.click(button);

      expect(screen.getByText('Mobile navigation coming soon...')).toBeInTheDocument();
    });

    it('should have navigation role', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');
      fireEvent.click(button);

      const nav = screen.getByRole('navigation', { name: 'Mobile navigation' });
      expect(nav).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('Accessibility', () => {
    it('should have banner role', () => {
      render(<Header />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should have accessible hamburger button', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('aria-expanded');
      expect(button).toHaveAttribute('aria-controls');
    });

    it('should have focus styles on hamburger button', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
    });

    it('should have aria-hidden on SVG icons', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');
      const svg = button.querySelector('svg');

      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should be keyboard accessible', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');
      expect(button.tagName).toBe('BUTTON');
    });
  });

  // =============================================================================
  // Layout Tests
  // =============================================================================

  describe('Layout', () => {
    it('should have left side with hamburger and title', () => {
      render(<Header />);

      const hamburger = screen.getByTestId('hamburger-menu-button');
      const title = screen.getByText('Neill Planner');

      // Both should be in the document
      expect(hamburger).toBeInTheDocument();
      expect(title).toBeInTheDocument();
    });

    it('should have right side with user menu', () => {
      render(<Header />);

      const userMenu = screen.getByTestId('mock-user-menu');
      expect(userMenu).toBeInTheDocument();
    });

    it('should use flexbox for layout', () => {
      const { container } = render(<Header />);

      const flexContainer = container.querySelector('.flex.items-center.justify-between');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should have max-width container', () => {
      const { container } = render(<Header />);

      const maxWidthContainer = container.querySelector('.max-w-4xl');
      expect(maxWidthContainer).toBeInTheDocument();
    });

    it('should center container with auto margins', () => {
      const { container } = render(<Header />);

      const centeredContainer = container.querySelector('.mx-auto');
      expect(centeredContainer).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Title Tests
  // =============================================================================

  describe('Title', () => {
    it('should render title as h1', () => {
      render(<Header />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent('Neill Planner');
    });

    it('should have white text on title', () => {
      render(<Header />);

      const title = screen.getByText('Neill Planner');
      expect(title).toHaveClass('text-white');
    });

    it('should have bold font on title', () => {
      render(<Header />);

      const title = screen.getByText('Neill Planner');
      expect(title).toHaveClass('font-bold');
    });

    it('should have responsive text size on title', () => {
      render(<Header />);

      const title = screen.getByText('Neill Planner');
      expect(title).toHaveClass('text-2xl', 'sm:text-3xl');
    });

    it('should have amber text on subtitle', () => {
      render(<Header />);

      const subtitle = screen.getByText('Franklin-Covey Productivity System');
      expect(subtitle).toHaveClass('text-amber-100');
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe('Edge Cases', () => {
    it('should handle rapid toggle clicks', () => {
      render(<Header />);

      const button = screen.getByTestId('hamburger-menu-button');

      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Should end up closed (even number of clicks)
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should handle undefined className gracefully', () => {
      render(<Header className={undefined} />);

      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
    });

    it('should handle empty string className', () => {
      render(<Header className="" />);

      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
    });
  });
});
