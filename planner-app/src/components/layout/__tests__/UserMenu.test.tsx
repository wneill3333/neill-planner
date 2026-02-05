/**
 * UserMenu Component Tests
 *
 * Comprehensive tests for the UserMenu component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserMenu } from '../UserMenu';

// =============================================================================
// Test Setup
// =============================================================================

const mockSignOut = vi.fn();

// Mock the useAuth hook
vi.mock('../../../features/auth', () => ({
  useAuth: vi.fn(),
}));

describe('UserMenu', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Default mock implementation
    const { useAuth } = await import('../../../features/auth');
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user',
        settings: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      loading: false,
      error: null,
      signOut: mockSignOut,
      signInWithGoogle: vi.fn(),
      clearError: vi.fn(),
    });
  });

  // =============================================================================
  // Rendering Tests
  // =============================================================================

  describe('Rendering', () => {
    it('should render user menu component', () => {
      render(<UserMenu />);

      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      render(<UserMenu testId="custom-user-menu" />);

      expect(screen.getByTestId('custom-user-menu')).toBeInTheDocument();
    });

    it('should render user menu button', () => {
      render(<UserMenu />);

      expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
    });

    it('should not render dropdown initially', () => {
      render(<UserMenu />);

      expect(screen.queryByTestId('user-menu-dropdown')).not.toBeInTheDocument();
    });

    it('should render dropdown when button is clicked', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
    });

    it('should not render when user is null', async () => {
      const { useAuth } = await import('../../../features/auth');
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: null,
        signOut: mockSignOut,
        signInWithGoogle: vi.fn(),
        clearError: vi.fn(),
      });

      const { container } = render(<UserMenu />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  // =============================================================================
  // User Initials Tests
  // =============================================================================

  describe('User Initials', () => {
    it('should show initials from display name', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      expect(button).toHaveTextContent('TU'); // Test User
    });

    it('should show first and last initials for multi-word names', async () => {
      const { useAuth } = await import('../../../features/auth');
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'user-1',
          email: 'john@example.com',
          displayName: 'John Doe Smith',
          role: 'user',
          settings: {} as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        loading: false,
        error: null,
        signOut: mockSignOut,
        signInWithGoogle: vi.fn(),
        clearError: vi.fn(),
      });

      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      expect(button).toHaveTextContent('JS'); // John Smith (first and last)
    });

    it('should show first two letters for single word names', async () => {
      const { useAuth } = await import('../../../features/auth');
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'user-1',
          email: 'madonna@example.com',
          displayName: 'Madonna',
          role: 'user',
          settings: {} as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        loading: false,
        error: null,
        signOut: mockSignOut,
        signInWithGoogle: vi.fn(),
        clearError: vi.fn(),
      });

      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      expect(button).toHaveTextContent('MA');
    });

    it('should use email initials when display name is null', async () => {
      const { useAuth } = await import('../../../features/auth');
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          displayName: null,
          role: 'user',
          settings: {} as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        loading: false,
        error: null,
        signOut: mockSignOut,
        signInWithGoogle: vi.fn(),
        clearError: vi.fn(),
      });

      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      expect(button).toHaveTextContent('TE');
    });

    it('should use "U" when both display name and email are null', async () => {
      const { useAuth } = await import('../../../features/auth');
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'user-1',
          email: null,
          displayName: null,
          role: 'user',
          settings: {} as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        loading: false,
        error: null,
        signOut: mockSignOut,
        signInWithGoogle: vi.fn(),
        clearError: vi.fn(),
      });

      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      expect(button).toHaveTextContent('U');
    });

    it('should display initials in uppercase', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      const text = button.textContent || '';
      expect(text).toBe(text.toUpperCase());
    });
  });

  // =============================================================================
  // Dropdown Toggle Tests
  // =============================================================================

  describe('Dropdown Toggle', () => {
    it('should open dropdown when button is clicked', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
    });

    it('should close dropdown when button is clicked again', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');

      fireEvent.click(button);
      expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();

      fireEvent.click(button);
      expect(screen.queryByTestId('user-menu-dropdown')).not.toBeInTheDocument();
    });

    it('should update aria-expanded when toggled', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');

      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  // =============================================================================
  // Dropdown Content Tests
  // =============================================================================

  describe('Dropdown Content', () => {
    it('should display user display name in dropdown', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should display user email in dropdown', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should display user initials in dropdown avatar', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      const dropdown = screen.getByTestId('user-menu-dropdown');
      expect(dropdown).toHaveTextContent('TU');
    });

    it('should display settings button', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      expect(screen.getByTestId('settings-button')).toBeInTheDocument();
    });

    it('should display sign out button', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });

    it('should disable settings button (coming soon)', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      const settingsButton = screen.getByTestId('settings-button');
      expect(settingsButton).toBeDisabled();
    });
  });

  // =============================================================================
  // Sign Out Tests
  // =============================================================================

  describe('Sign Out', () => {
    it('should call signOut when sign out button is clicked', async () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      const signOutButton = screen.getByTestId('sign-out-button');
      fireEvent.click(signOutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });

    it('should close dropdown after successful sign out', async () => {
      mockSignOut.mockResolvedValue(undefined);

      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      const signOutButton = screen.getByTestId('sign-out-button');
      fireEvent.click(signOutButton);

      await waitFor(() => {
        expect(screen.queryByTestId('user-menu-dropdown')).not.toBeInTheDocument();
      });
    });

    it('should handle sign out error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSignOut.mockRejectedValue(new Error('Sign out failed'));

      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      const signOutButton = screen.getByTestId('sign-out-button');
      fireEvent.click(signOutButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  // =============================================================================
  // Click Outside Tests
  // =============================================================================

  describe('Click Outside', () => {
    it('should close dropdown when clicking outside', async () => {
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <UserMenu />
        </div>
      );

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();

      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);

      await waitFor(() => {
        expect(screen.queryByTestId('user-menu-dropdown')).not.toBeInTheDocument();
      });
    });

    it('should not close dropdown when clicking inside dropdown', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      const dropdown = screen.getByTestId('user-menu-dropdown');
      fireEvent.mouseDown(dropdown);

      expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
    });

    it('should not close dropdown when clicking on button', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      fireEvent.mouseDown(button);

      expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Keyboard Tests
  // =============================================================================

  describe('Keyboard Navigation', () => {
    it('should close dropdown on Escape key', async () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByTestId('user-menu-dropdown')).not.toBeInTheDocument();
      });
    });

    it('should focus button after closing with Escape', async () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(button).toHaveFocus();
      });
    });

    it('should not close on other keys', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      fireEvent.keyDown(document, { key: 'Enter' });
      expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Space' });
      expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Tab' });
      expect(screen.getByTestId('user-menu-dropdown')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('Accessibility', () => {
    it('should have aria-label on button', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      expect(button).toHaveAttribute('aria-label', 'User menu');
    });

    it('should have aria-expanded attribute', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      expect(button).toHaveAttribute('aria-expanded');
    });

    it('should have aria-haspopup attribute', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
    });

    it('should have menu role on dropdown', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      const dropdown = screen.getByTestId('user-menu-dropdown');
      expect(dropdown).toHaveAttribute('role', 'menu');
    });

    it('should have aria-label on dropdown', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      const dropdown = screen.getByTestId('user-menu-dropdown');
      expect(dropdown).toHaveAttribute('aria-label', 'User menu options');
    });

    it('should have menuitem role on menu items', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      const settingsButton = screen.getByTestId('settings-button');
      const signOutButton = screen.getByTestId('sign-out-button');

      expect(settingsButton).toHaveAttribute('role', 'menuitem');
      expect(signOutButton).toHaveAttribute('role', 'menuitem');
    });

    it('should have aria-hidden on SVG icons', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      const dropdown = screen.getByTestId('user-menu-dropdown');
      const svgs = dropdown.querySelectorAll('svg');

      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should have separator role on divider', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      const separator = screen.getByRole('separator');
      expect(separator).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Styling Tests
  // =============================================================================

  describe('Styling', () => {
    it('should apply custom className', () => {
      render(<UserMenu className="custom-menu-class" />);

      const menu = screen.getByTestId('user-menu');
      expect(menu).toHaveClass('custom-menu-class');
    });

    it('should have amber styling on avatar button', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      expect(button).toHaveClass('bg-amber-500');
    });

    it('should have red styling on sign out button', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      const signOutButton = screen.getByTestId('sign-out-button');
      expect(signOutButton).toHaveClass('text-red-700');
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe('Edge Cases', () => {
    it('should handle very long display names', async () => {
      const { useAuth } = await import('../../../features/auth');
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          displayName: 'This Is A Very Long Display Name That Should Be Truncated',
          role: 'user',
          settings: {} as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        loading: false,
        error: null,
        signOut: mockSignOut,
        signInWithGoogle: vi.fn(),
        clearError: vi.fn(),
      });

      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');
      fireEvent.click(button);

      // Should still show initials correctly (first and last word)
      expect(button).toHaveTextContent('TT'); // This ... Truncated
    });

    it('should handle rapid toggle clicks', () => {
      render(<UserMenu />);

      const button = screen.getByTestId('user-menu-button');

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(screen.queryByTestId('user-menu-dropdown')).not.toBeInTheDocument();
    });
  });
});
