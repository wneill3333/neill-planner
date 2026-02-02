/**
 * Announcement Hook
 *
 * Provides utilities for announcing dynamic content changes to screen readers.
 * Uses ARIA live regions for accessibility.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// =============================================================================
// useAnnouncement Hook
// =============================================================================

export interface UseAnnouncementOptions {
  /** Delay in milliseconds before clearing the announcement (default: 3000ms) */
  clearDelay?: number;
  /** Politeness setting for ARIA live region (default: 'polite') */
  politeness?: 'polite' | 'assertive';
}

export interface UseAnnouncementResult {
  /** Current announcement text */
  announcement: string;
  /** Function to make an announcement */
  announce: (message: string) => void;
  /** Function to clear the current announcement */
  clearAnnouncement: () => void;
  /** Politeness level for the live region */
  politeness: 'polite' | 'assertive';
}

/**
 * Hook to manage screen reader announcements
 *
 * @param options - Configuration options
 * @returns Object with announcement state and control functions
 *
 * @example
 * ```tsx
 * function TaskManager() {
 *   const { announcement, announce, politeness } = useAnnouncement();
 *
 *   const handleSave = async () => {
 *     announce('Saving task...');
 *     await saveTask();
 *     announce('Task saved successfully');
 *   };
 *
 *   return (
 *     <>
 *       <div role="status" aria-live={politeness} className="sr-only">
 *         {announcement}
 *       </div>
 *       <button onClick={handleSave}>Save</button>
 *     </>
 *   );
 * }
 * ```
 */
export function useAnnouncement(options: UseAnnouncementOptions = {}): UseAnnouncementResult {
  const { clearDelay = 3000, politeness = 'polite' } = options;

  const [announcement, setAnnouncement] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clearDelayRef = useRef(clearDelay);

  // Update clearDelayRef when clearDelay changes
  useEffect(() => {
    clearDelayRef.current = clearDelay;
  }, [clearDelay]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clearAnnouncement = useCallback(() => {
    setAnnouncement('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const announce = useCallback((message: string) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set the new announcement
    setAnnouncement(message);

    // Schedule automatic clearing using ref to avoid stale closure
    if (clearDelayRef.current > 0) {
      timeoutRef.current = setTimeout(() => {
        setAnnouncement('');
        timeoutRef.current = null;
      }, clearDelayRef.current);
    }
  }, []);

  return {
    announcement,
    announce,
    clearAnnouncement,
    politeness,
  };
}

// =============================================================================
// useAnnouncementRegion Component Hook
// =============================================================================

/**
 * Hook that returns props for an ARIA live region
 *
 * @param announcement - Current announcement text
 * @param politeness - Politeness level
 * @returns Props to spread on the live region element
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { announcement, announce, politeness } = useAnnouncement();
 *   const liveRegionProps = useAnnouncementRegion(announcement, politeness);
 *
 *   return (
 *     <>
 *       <div {...liveRegionProps} />
 *       <button onClick={() => announce('Action completed')}>Do Something</button>
 *     </>
 *   );
 * }
 * ```
 */
export function useAnnouncementRegion(
  announcement: string,
  politeness: 'polite' | 'assertive' = 'polite'
) {
  return {
    role: 'status' as const,
    'aria-live': politeness,
    'aria-atomic': true,
    className: 'sr-only',
    children: announcement,
  };
}
