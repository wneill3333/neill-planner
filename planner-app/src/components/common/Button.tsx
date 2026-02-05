/**
 * Button Component
 *
 * A reusable button component with variant support.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: ButtonVariant;
  /** Button children */
  children: ReactNode;
}

// =============================================================================
// Constants
// =============================================================================

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 disabled:bg-amber-300',
  secondary:
    'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 disabled:bg-gray-100',
  danger:
    'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 disabled:bg-red-300',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400 disabled:text-gray-400',
};

// =============================================================================
// Component
// =============================================================================

/**
 * Button - Reusable button component
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
export function Button({
  variant = 'primary',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        px-4 py-2 rounded-lg font-medium
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:cursor-not-allowed
        ${VARIANT_CLASSES[variant]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
