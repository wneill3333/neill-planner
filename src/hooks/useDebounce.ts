/**
 * Debounce Hook
 *
 * Delays updating a value until after a specified delay has passed
 * since the last time the value changed. Useful for optimizing
 * expensive operations like API calls or search filtering.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// =============================================================================
// useDebounce Hook
// =============================================================================

/**
 * Hook to debounce a value
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearchTerm = useDebounce(searchTerm, 300);
 *
 *   useEffect(() => {
 *     if (debouncedSearchTerm) {
 *       // Perform search with debounced value
 *       performSearch(debouncedSearchTerm);
 *     }
 *   }, [debouncedSearchTerm]);
 *
 *   return <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />;
 * }
 * ```
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timeout to update debounced value
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timeout on value change or unmount
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay]);

  return debouncedValue;
}

// =============================================================================
// useDebouncedCallback Hook
// =============================================================================

/**
 * Hook to debounce a callback function
 *
 * @param callback - The callback function to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns Debounced callback function
 *
 * @example
 * ```tsx
 * function AutoSaveForm() {
 *   const debouncedSave = useDebouncedCallback((formData) => {
 *     saveToServer(formData);
 *   }, 1000);
 *
 *   return (
 *     <form onChange={(e) => {
 *       const formData = new FormData(e.currentTarget);
 *       debouncedSave(Object.fromEntries(formData));
 *     }}>
 *       <input name="title" />
 *     </form>
 *   );
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay = 500
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

// =============================================================================
// useThrottle Hook
// =============================================================================

/**
 * Hook to throttle a value (limits updates to once per delay period)
 *
 * @param value - The value to throttle
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns The throttled value
 *
 * @example
 * ```tsx
 * function ScrollTracker() {
 *   const [scrollY, setScrollY] = useState(0);
 *   const throttledScrollY = useThrottle(scrollY, 100);
 *
 *   useEffect(() => {
 *     const handleScroll = () => setScrollY(window.scrollY);
 *     window.addEventListener('scroll', handleScroll);
 *     return () => window.removeEventListener('scroll', handleScroll);
 *   }, []);
 *
 *   return <div>Scroll position: {throttledScrollY}</div>;
 * }
 * ```
 */
export function useThrottle<T>(value: T, delay = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecutedRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutedRef.current;

    // Schedule update - either immediate or delayed
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (timeSinceLastExecution >= delay) {
      // Enough time has passed, schedule immediate update
      timeoutRef.current = setTimeout(() => {
        lastExecutedRef.current = Date.now();
        setThrottledValue(value);
      }, 0);
    } else {
      // Schedule update for later
      timeoutRef.current = setTimeout(() => {
        lastExecutedRef.current = Date.now();
        setThrottledValue(value);
      }, delay - timeSinceLastExecution);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return throttledValue;
}
