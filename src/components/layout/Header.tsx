/**
 * Header Component
 *
 * Application header with branding and user menu.
 * Includes hamburger menu for mobile navigation (placeholder for future).
 */

import { useState } from 'react';
import { UserMenu } from './UserMenu';

// =============================================================================
// Types
// =============================================================================

export interface HeaderProps {
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Header - Application header component
 *
 * Features:
 * - App logo and title
 * - Hamburger menu button (mobile navigation - placeholder)
 * - User menu on the right
 * - Responsive design
 * - Amber theme styling
 *
 * @example
 * ```tsx
 * <Header />
 * ```
 */
export function Header({ className, testId }: HeaderProps = {}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      className={`shadow-lg bg-gradient-to-r from-amber-700 to-amber-600 ${className || ''}`}
      role="banner"
      data-testid={testId || 'header'}
    >
      <div className="max-w-4xl px-4 py-4 mx-auto sm:py-6">
        <div className="flex items-center justify-between">
          {/* Left side: Hamburger + Title */}
          <div className="flex items-center gap-3">
            {/* Hamburger menu button - placeholder for future mobile navigation */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="
                p-2 text-white rounded-md
                hover:bg-amber-600
                focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-amber-700
                transition-colors duration-150
                md:hidden
              "
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              data-testid="hamburger-menu-button"
            >
              {/* Hamburger icon */}
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {isMobileMenuOpen ? (
                  // X icon when menu is open
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  // Hamburger icon when menu is closed
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* App Title and Subtitle */}
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Neill Planner
              </h1>
              <p className="mt-1 text-sm text-amber-100 sm:text-base">
                Franklin-Covey Productivity System
              </p>
            </div>
          </div>

          {/* Right side: User Menu */}
          <div className="flex items-center">
            <UserMenu />
          </div>
        </div>

        {/* Mobile menu placeholder - will be implemented in future navigation feature */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu"
            className="pt-4 mt-4 border-t border-amber-500 md:hidden"
            data-testid="mobile-menu"
          >
            <nav aria-label="Mobile navigation">
              <p className="text-sm text-amber-100">
                Mobile navigation coming soon...
              </p>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
