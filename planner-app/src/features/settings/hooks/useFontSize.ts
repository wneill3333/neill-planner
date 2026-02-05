/**
 * useFontSize Hook
 *
 * Hook to manage and apply font size settings.
 * Applies font size class to document root.
 */

import { useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { selectFontSize } from '../index';
import type { FontSizeOption } from '../../../types';

/**
 * Font size CSS class mapping
 */
const FONT_SIZE_CLASSES: Record<FontSizeOption, string> = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
};

/**
 * Font size CSS variable values (for more granular control if needed)
 */
const FONT_SIZE_VALUES: Record<FontSizeOption, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
};

/**
 * useFontSize - Apply font size settings to the document
 *
 * Manages font size application by:
 * - Applying font size class to document root
 * - Setting CSS custom property for font size
 *
 * @example
 * ```tsx
 * function App() {
 *   useFontSize();
 *   return <div>My App</div>;
 * }
 * ```
 */
export function useFontSize(): void {
  const fontSize = useAppSelector(selectFontSize);

  useEffect(() => {
    const root = document.documentElement;

    // Remove all font size classes
    Object.values(FONT_SIZE_CLASSES).forEach((className) => {
      root.classList.remove(className);
    });

    // Add current font size class
    const fontClass = FONT_SIZE_CLASSES[fontSize];
    if (fontClass) {
      root.classList.add(fontClass);
    }

    // Set CSS custom property for more granular control
    root.style.setProperty('--font-size-base', FONT_SIZE_VALUES[fontSize]);
  }, [fontSize]);
}
