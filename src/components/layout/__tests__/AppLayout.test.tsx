/**
 * AppLayout Component Tests
 *
 * Comprehensive tests for the AppLayout component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppLayout } from '../AppLayout';

// Mock the Header component
vi.mock('../Header', () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
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

describe('AppLayout', () => {
  // =============================================================================
  // Rendering Tests
  // =============================================================================

  describe('Rendering', () => {
    it('should render app layout component', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );

      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      render(
        <AppLayout testId="custom-layout">
          <div>Content</div>
        </AppLayout>
      );

      expect(screen.getByTestId('custom-layout')).toBeInTheDocument();
    });

    it('should render header component', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );

      expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    });

    it('should render children in main content area', () => {
      render(
        <AppLayout>
          <div data-testid="child-content">Test Content</div>
        </AppLayout>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render skip to main content link', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should have main content area with id', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
    });
  });

  // =============================================================================
  // Styling Tests
  // =============================================================================

  describe('Styling', () => {
    it('should have amber gradient background', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );

      const layout = screen.getByTestId('app-layout');
      expect(layout).toHaveClass('bg-gradient-to-b', 'from-amber-50', 'to-orange-100');
    });

    it('should have min-height screen', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );

      const layout = screen.getByTestId('app-layout');
      expect(layout).toHaveClass('min-h-screen');
    });

    it('should apply custom className to main content', () => {
      render(
        <AppLayout className="custom-main-class">
          <div>Content</div>
        </AppLayout>
      );

      const main = screen.getByRole('main');
      expect(main).toHaveClass('custom-main-class');
    });

    it('should have sr-only class on skip link by default', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveClass('sr-only');
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('Accessibility', () => {
    it('should have main role on content area', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should have skip link for keyboard navigation', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should connect skip link to main content via id', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );

      const skipLink = screen.getByText('Skip to main content');
      const mainContent = screen.getByRole('main');

      expect(skipLink.getAttribute('href')).toBe('#main-content');
      expect(mainContent.getAttribute('id')).toBe('main-content');
    });

    it('should have focus styles on skip link', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveClass('focus:not-sr-only');
      expect(skipLink).toHaveClass('focus:outline-none');
      expect(skipLink).toHaveClass('focus:ring-2');
    });
  });

  // =============================================================================
  // Children Tests
  // =============================================================================

  describe('Children Rendering', () => {
    it('should render single child component', () => {
      render(
        <AppLayout>
          <div data-testid="single-child">Single Child</div>
        </AppLayout>
      );

      expect(screen.getByTestId('single-child')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <AppLayout>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </AppLayout>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('should render complex nested children', () => {
      render(
        <AppLayout>
          <div data-testid="parent">
            <div data-testid="nested-1">
              <span data-testid="deeply-nested">Deeply Nested</span>
            </div>
            <div data-testid="nested-2">Nested 2</div>
          </div>
        </AppLayout>
      );

      expect(screen.getByTestId('parent')).toBeInTheDocument();
      expect(screen.getByTestId('nested-1')).toBeInTheDocument();
      expect(screen.getByTestId('nested-2')).toBeInTheDocument();
      expect(screen.getByTestId('deeply-nested')).toBeInTheDocument();
    });

    it('should render text content directly', () => {
      render(<AppLayout>Plain text content</AppLayout>);

      expect(screen.getByText('Plain text content')).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      render(<AppLayout>{null}</AppLayout>);

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toBeEmptyDOMElement();
    });
  });

  // =============================================================================
  // Integration Tests
  // =============================================================================

  describe('Integration', () => {
    it('should render header and children together', () => {
      render(
        <AppLayout>
          <div data-testid="app-content">App Content</div>
        </AppLayout>
      );

      expect(screen.getByTestId('mock-header')).toBeInTheDocument();
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
    });

    it('should maintain proper document structure', () => {
      const { container } = render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );

      // Check structure: div > [skip link, header, main]
      const layout = container.querySelector('[data-testid="app-layout"]');
      expect(layout).toBeTruthy();

      const skipLink = layout?.querySelector('a[href="#main-content"]');
      expect(skipLink).toBeTruthy();

      const main = layout?.querySelector('main#main-content');
      expect(main).toBeTruthy();
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe('Edge Cases', () => {
    it('should handle very long content', () => {
      const longContent = 'x'.repeat(10000);
      render(
        <AppLayout>
          <div data-testid="long-content">{longContent}</div>
        </AppLayout>
      );

      const content = screen.getByTestId('long-content');
      expect(content).toBeInTheDocument();
      expect(content.textContent).toHaveLength(10000);
    });

    it('should handle special characters in children', () => {
      render(
        <AppLayout>
          <div>Special: &lt;&gt;&amp;&quot;&#39;</div>
        </AppLayout>
      );

      expect(screen.getByText(/Special:/)).toBeInTheDocument();
    });

    it('should handle undefined className gracefully', () => {
      render(
        <AppLayout className={undefined}>
          <div>Content</div>
        </AppLayout>
      );

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should handle empty string className', () => {
      render(
        <AppLayout className="">
          <div>Content</div>
        </AppLayout>
      );

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });
  });
});
