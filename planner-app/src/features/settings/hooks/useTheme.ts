/**
 * useTheme Hook
 *
 * Hook to manage and apply theme settings.
 * Applies theme class to document root and handles system preference.
 */

import { useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { selectTheme } from '../index';
import type { ThemeOption } from '../../../types';

/**
 * Get the effective theme based on user preference and system settings
 */
function getEffectiveTheme(theme: ThemeOption): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

/**
 * useTheme - Apply theme settings to the document
 *
 * Manages theme application including:
 * - Applying theme class to document root
 * - Handling system theme preference
 * - Listening for system theme changes
 *
 * @example
 * ```tsx
 * function App() {
 *   useTheme();
 *   return <div>My App</div>;
 * }
 * ```
 */
export function useTheme(): void {
  const theme = useAppSelector(selectTheme);

  useEffect(() => {
    const effectiveTheme = getEffectiveTheme(theme);

    // Apply theme class to document root
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#1f2937' : '#ffffff');
    }
  }, [theme]);

  // Listen for system theme changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);

      // Update meta theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#1f2937' : '#ffffff');
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Fallback for older browsers
    // @ts-expect-error - addListener is deprecated but needed for Safari < 14
    mediaQuery.addListener(handleChange);
    // @ts-expect-error - removeListener is deprecated
    return () => mediaQuery.removeListener(handleChange);
  }, [theme]);
}
