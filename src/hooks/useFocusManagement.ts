/**
 * Focus Management Hook
 *
 * Provides utilities for managing keyboard focus in components.
 * Improves accessibility by ensuring proper focus management.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// =============================================================================
// useFocusTrap Hook
// =============================================================================

/**
 * Hook to trap focus within a container element (useful for modals)
 *
 * @param isActive - Whether the focus trap is active
 * @returns Ref to attach to the container element
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const containerRef = useFocusTrap(isOpen);
 *
 *   return isOpen ? (
 *     <div ref={containerRef} role="dialog">
 *       <button onClick={onClose}>Close</button>
 *       <input />
 *     </div>
 *   ) : null;
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement>(isActive: boolean) {
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on mount
    if (firstElement) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        firstElement.focus();
      });
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusableElements.length === 0) return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      // Restore previous focus when trap is deactivated
      if (previousFocusRef.current && document.body.contains(previousFocusRef.current)) {
        requestAnimationFrame(() => {
          previousFocusRef.current?.focus();
        });
      }
    };
  }, [isActive]);

  return containerRef;
}

// =============================================================================
// useFocusReturn Hook
// =============================================================================

/**
 * Hook to return focus to a previously focused element
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   useFocusReturn(isOpen);
 *
 *   return isOpen ? <div role="dialog">...</div> : null;
 * }
 * ```
 */
export function useFocusReturn(isActive: boolean) {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isActive) {
      // Store current focus when activated
      previousActiveElement.current = document.activeElement as HTMLElement;
    } else if (previousActiveElement.current) {
      // Check if element still exists in DOM before focusing
      if (document.body.contains(previousActiveElement.current)) {
        try {
          previousActiveElement.current.focus();
        } catch (e) {
          console.warn('Failed to restore focus:', e);
        }
      }
      previousActiveElement.current = null;
    }
  }, [isActive]);
}

// =============================================================================
// useAutoFocus Hook
// =============================================================================

/**
 * Hook to automatically focus an element when component mounts
 *
 * @param shouldFocus - Whether to auto-focus (default: true)
 * @returns Ref to attach to the element to focus
 *
 * @example
 * ```tsx
 * function SearchInput() {
 *   const inputRef = useAutoFocus<HTMLInputElement>();
 *
 *   return <input ref={inputRef} type="text" />;
 * }
 * ```
 */
export function useAutoFocus<T extends HTMLElement>(shouldFocus = true) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      elementRef.current.focus();
    }
  }, [shouldFocus]);

  return elementRef;
}

// =============================================================================
// useKeyboardNavigation Hook
// =============================================================================

interface UseKeyboardNavigationOptions {
  /** Whether keyboard navigation is enabled */
  enabled?: boolean;
  /** Whether to loop to start/end when reaching boundaries */
  loop?: boolean;
  /** Callback when Enter key is pressed */
  onEnter?: (index: number) => void;
  /** Callback when Escape key is pressed */
  onEscape?: () => void;
}

/**
 * Hook to manage keyboard navigation in a list
 *
 * @param itemCount - Number of items in the list
 * @param options - Configuration options
 * @returns Current focused index and keyboard event handler
 *
 * @example
 * ```tsx
 * function List({ items }) {
 *   const { focusedIndex, handleKeyDown } = useKeyboardNavigation(items.length, {
 *     onEnter: (index) => selectItem(items[index]),
 *     loop: true,
 *   });
 *
 *   return (
 *     <ul onKeyDown={handleKeyDown}>
 *       {items.map((item, index) => (
 *         <li key={item.id} tabIndex={index === focusedIndex ? 0 : -1}>
 *           {item.name}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useKeyboardNavigation(
  itemCount: number,
  options: UseKeyboardNavigationOptions = {}
) {
  const { enabled = true, loop = false, onEnter, onEscape } = options;
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled || itemCount === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((current) => {
            const newIndex = current + 1;
            if (newIndex >= itemCount) {
              return loop ? 0 : itemCount - 1;
            }
            return newIndex;
          });
          break;

        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((current) => {
            const newIndex = current - 1;
            if (newIndex < 0) {
              return loop ? itemCount - 1 : 0;
            }
            return newIndex;
          });
          break;

        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;

        case 'End':
          e.preventDefault();
          setFocusedIndex(itemCount - 1);
          break;

        case 'Enter':
          e.preventDefault();
          onEnter?.(focusedIndex);
          break;

        case 'Escape':
          e.preventDefault();
          onEscape?.();
          break;

        default:
          break;
      }
    },
    [enabled, itemCount, loop, onEnter, onEscape, focusedIndex]
  );

  return {
    focusedIndex,
    handleKeyDown,
  };
}

// =============================================================================
// useFocusManagement Hook
// =============================================================================

/**
 * Hook to manage focus within a container (focus trap with external ref)
 *
 * @param containerRef - Ref to the container element
 * @param isActive - Whether focus management is active
 */
export function useFocusManagement<T extends HTMLElement>(
  containerRef: React.RefObject<T | null>,
  isActive: boolean
) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on mount
    if (firstElement) {
      requestAnimationFrame(() => {
        firstElement.focus();
      });
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusableElements.length === 0) return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      if (previousFocusRef.current && document.body.contains(previousFocusRef.current)) {
        requestAnimationFrame(() => {
          previousFocusRef.current?.focus();
        });
      }
    };
  }, [isActive, containerRef]);
}
