/**
 * Spinner Component
 *
 * A simple loading spinner with size variants.
 */

// =============================================================================
// Types
// =============================================================================

export interface SpinnerProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Constants
// =============================================================================

const SPINNER_SIZES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-3',
} as const;

// =============================================================================
// Component
// =============================================================================

/**
 * Spinner - Loading indicator
 *
 * @example
 * ```tsx
 * <Spinner size="lg" />
 * ```
 */
export function Spinner({ size = 'md', className = '', testId = 'spinner' }: SpinnerProps) {
  return (
    <span
      className={`inline-block rounded-full border-amber-500 border-t-transparent animate-spin ${SPINNER_SIZES[size]} ${className}`}
      role="status"
      aria-label="Loading"
      data-testid={testId}
    >
      <span className="sr-only">Loading...</span>
    </span>
  );
}

export default Spinner;
