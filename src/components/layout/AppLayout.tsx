/**
 * AppLayout Component
 *
 * Main layout wrapper for the application.
 * Provides consistent header and content structure across all pages.
 */

import type { ReactNode } from 'react';
import { Header } from './Header';

// =============================================================================
// Types
// =============================================================================

export interface AppLayoutProps {
  /** Content to render in the main area */
  children: ReactNode;
  /** Optional className for the main content wrapper */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * AppLayout - Main application layout wrapper
 *
 * Features:
 * - Header at the top with app branding and user menu
 * - Main content area for page content
 * - Responsive design with mobile support
 * - Amber/warm color theme
 *
 * @example
 * ```tsx
 * <AppLayout>
 *   <DailyView />
 * </AppLayout>
 * ```
 */
export function AppLayout({ children, className, testId }: AppLayoutProps) {
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100"
      data-testid={testId || 'app-layout'}
    >
      {/* Skip to main content link for keyboard accessibility */}
      <a
        href="#main-content"
        className="
          sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
          bg-amber-500 text-white px-4 py-2 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2
          z-50
        "
      >
        Skip to main content
      </a>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main
        id="main-content"
        className={className}
      >
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
