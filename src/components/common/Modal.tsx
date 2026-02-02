/**
 * Modal Component
 *
 * A reusable modal dialog with portal rendering, accessibility features,
 * and body scroll locking. Supports multiple size variants and custom styling.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusManagement } from '../../hooks/useFocusManagement';

// =============================================================================
// Types
// =============================================================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;
  /** Modal title for accessibility */
  title: string;
  /** Size variant of the modal */
  size?: ModalSize;
  /** Whether to show the close button (default: true) */
  showCloseButton?: boolean;
  /** Whether clicking the backdrop closes the modal (default: true) */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes the modal (default: true) */
  closeOnEscape?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Constants
// =============================================================================

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Lock body scroll when modal is open
 */
function useLockBodyScroll(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Get scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Apply styles
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Cleanup
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isLocked]);
}

// =============================================================================
// Component
// =============================================================================

/**
 * Modal - Accessible modal dialog component
 *
 * Features:
 * - Portal rendering to document.body
 * - Focus trap (keyboard navigation contained within modal)
 * - Body scroll locking when open
 * - Backdrop click to close
 * - Escape key to close
 * - ARIA attributes for accessibility
 * - Size variants
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   size="md"
 * >
 *   <p>Are you sure you want to continue?</p>
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  testId,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useLockBodyScroll(isOpen);

  // Focus management (trap focus within modal)
  useFocusManagement(modalRef, isOpen);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  // Render modal into portal
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
      data-testid={testId || 'modal'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className={`
          relative w-full ${SIZE_CLASSES[size]}
          bg-white rounded-lg shadow-xl
          mx-4 my-8
          max-h-[calc(100vh-4rem)] overflow-y-auto
          transform transition-all
        `}
      >
        {/* Header with Close Button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2
            id="modal-title"
            className="text-xl font-semibold text-gray-900"
          >
            {title}
          </h2>

          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="
                p-2 rounded-lg text-gray-400
                transition-colors
                hover:bg-gray-100 hover:text-gray-600
                focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
              "
              aria-label="Close modal"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
