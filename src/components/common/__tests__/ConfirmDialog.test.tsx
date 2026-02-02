/**
 * ConfirmDialog Component Tests
 *
 * Comprehensive tests for the ConfirmDialog component including:
 * - Rendering in open/closed states
 * - Title and message display
 * - Button text customization
 * - Variant styling (danger, primary, warning)
 * - Interaction tests (confirm, cancel, backdrop, Escape key)
 * - Processing state
 * - Accessibility features
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '../ConfirmDialog';

// =============================================================================
// Mock Setup
// =============================================================================

// Mock the useFocusManagement hook (used by Modal)
vi.mock('../../../hooks/useFocusManagement', () => ({
  useFocusManagement: vi.fn(() => ({ current: null })),
}));

// =============================================================================
// Test Helpers
// =============================================================================

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  title: 'Test Dialog',
  message: 'This is a test message.',
};

function renderConfirmDialog(props = {}) {
  return render(<ConfirmDialog {...defaultProps} {...props} />);
}

function getDialogElement() {
  return screen.queryByTestId('confirm-dialog');
}

function getConfirmButton() {
  return screen.queryByRole('button', { name: /confirm/i }) ||
         screen.queryByText('Confirm')?.closest('button');
}

function getCancelButton() {
  return screen.queryByRole('button', { name: /cancel/i }) ||
         screen.queryByText('Cancel')?.closest('button');
}

// =============================================================================
// Rendering Tests
// =============================================================================

describe('ConfirmDialog - Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('should render when isOpen is true', () => {
    renderConfirmDialog({ isOpen: true });

    expect(getDialogElement()).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    renderConfirmDialog({ isOpen: false });

    expect(getDialogElement()).not.toBeInTheDocument();
  });

  it('should render title', () => {
    renderConfirmDialog({ title: 'Delete Confirmation' });

    expect(screen.getByText('Delete Confirmation')).toBeInTheDocument();
  });

  it('should render message', () => {
    renderConfirmDialog({ message: 'Are you sure you want to proceed?' });

    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('should render confirm button with custom text', () => {
    renderConfirmDialog({ confirmText: 'Delete' });

    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should render cancel button with custom text', () => {
    renderConfirmDialog({ cancelText: 'Dismiss' });

    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });

  it('should use default button text when not provided', () => {
    renderConfirmDialog();

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});

// =============================================================================
// Variant Tests
// =============================================================================

describe('ConfirmDialog - Variants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should apply danger variant styles to confirm button', () => {
    renderConfirmDialog({ variant: 'danger', confirmText: 'Delete' });

    const confirmButton = screen.getByText('Delete').closest('button');
    expect(confirmButton).toHaveClass('bg-red-600');
  });

  it('should apply primary variant styles to confirm button', () => {
    renderConfirmDialog({ variant: 'primary', confirmText: 'Confirm' });

    const confirmButton = screen.getByText('Confirm').closest('button');
    expect(confirmButton).toHaveClass('bg-amber-500');
  });

  it('should apply warning variant styles to confirm button', () => {
    renderConfirmDialog({ variant: 'warning', confirmText: 'Proceed' });

    const confirmButton = screen.getByText('Proceed').closest('button');
    expect(confirmButton).toHaveClass('bg-orange-500');
  });

  it('should default to primary variant when not specified', () => {
    renderConfirmDialog();

    const confirmButton = screen.getByText('Confirm').closest('button');
    expect(confirmButton).toHaveClass('bg-amber-500');
  });
});

// =============================================================================
// Interaction Tests
// =============================================================================

describe('ConfirmDialog - Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();

    renderConfirmDialog({ onConfirm: handleConfirm });

    await user.click(screen.getByText('Confirm'));

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    renderConfirmDialog({ onClose: handleClose });

    await user.click(screen.getByText('Cancel'));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    const handleClose = vi.fn();

    renderConfirmDialog({ onClose: handleClose });

    const dialog = getDialogElement();
    const backdrop = dialog?.parentElement?.querySelector('[class*="bg-black"]');

    if (backdrop) {
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should call onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();

    renderConfirmDialog({ onClose: handleClose });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm when Enter key is pressed', () => {
    const handleConfirm = vi.fn();

    renderConfirmDialog({ onConfirm: handleConfirm });

    fireEvent.keyDown(document, { key: 'Enter' });

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('should not call onConfirm when Enter is pressed with modifiers', () => {
    const handleConfirm = vi.fn();

    renderConfirmDialog({ onConfirm: handleConfirm });

    fireEvent.keyDown(document, { key: 'Enter', shiftKey: true });
    fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });
    fireEvent.keyDown(document, { key: 'Enter', metaKey: true });

    expect(handleConfirm).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Processing State Tests
// =============================================================================

describe('ConfirmDialog - Processing State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state when isProcessing is true', () => {
    renderConfirmDialog({ isProcessing: true });

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should disable buttons when isProcessing is true', () => {
    renderConfirmDialog({ isProcessing: true });

    const confirmButton = screen.getByText('Processing...').closest('button');
    const cancelButton = screen.getByText('Cancel').closest('button');

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should not call onConfirm when Enter is pressed during processing', () => {
    const handleConfirm = vi.fn();

    renderConfirmDialog({ onConfirm: handleConfirm, isProcessing: true });

    fireEvent.keyDown(document, { key: 'Enter' });

    expect(handleConfirm).not.toHaveBeenCalled();
  });

  it('should not close on backdrop click when isProcessing is true', () => {
    const handleClose = vi.fn();

    renderConfirmDialog({ onClose: handleClose, isProcessing: true });

    const dialog = getDialogElement();
    const backdrop = dialog?.parentElement?.querySelector('[class*="bg-black"]');

    if (backdrop) {
      fireEvent.click(backdrop);
      expect(handleClose).not.toHaveBeenCalled();
    }
  });

  it('should not close on Escape key when isProcessing is true', () => {
    const handleClose = vi.fn();

    renderConfirmDialog({ onClose: handleClose, isProcessing: true });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('should show confirm text when not processing', () => {
    renderConfirmDialog({ confirmText: 'Delete', isProcessing: false });

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
  });
});

// =============================================================================
// Accessibility Tests
// =============================================================================

describe('ConfirmDialog - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have proper ARIA attributes', () => {
    renderConfirmDialog();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('should have aria-label on confirm button', () => {
    renderConfirmDialog({ confirmText: 'Delete' });

    const confirmButton = screen.getByText('Delete').closest('button');
    expect(confirmButton).toHaveAttribute('aria-label', 'Delete');
  });

  it('should have aria-label on cancel button', () => {
    renderConfirmDialog({ cancelText: 'Dismiss' });

    const cancelButton = screen.getByText('Dismiss').closest('button');
    expect(cancelButton).toHaveAttribute('aria-label', 'Dismiss');
  });

  it('should have accessible spinner during processing', () => {
    renderConfirmDialog({ isProcessing: true });

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Processing');
  });

  it('should support custom testId', () => {
    renderConfirmDialog({ testId: 'delete-confirm-dialog' });

    expect(screen.getByTestId('delete-confirm-dialog')).toBeInTheDocument();
  });

  it('should use default testId when not provided', () => {
    renderConfirmDialog();

    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
  });

  it('should have title with correct id for aria-labelledby', () => {
    renderConfirmDialog({ title: 'Delete Task' });

    const title = screen.getByText('Delete Task');
    expect(title).toHaveAttribute('id', 'modal-title');
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('ConfirmDialog - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle opening and closing correctly', async () => {
    const { rerender } = renderConfirmDialog({ isOpen: false });

    expect(getDialogElement()).not.toBeInTheDocument();

    rerender(
      <ConfirmDialog
        {...defaultProps}
        isOpen={true}
      />
    );

    expect(getDialogElement()).toBeInTheDocument();

    rerender(
      <ConfirmDialog
        {...defaultProps}
        isOpen={false}
      />
    );

    expect(getDialogElement()).not.toBeInTheDocument();
  });

  it('should handle long messages', () => {
    const longMessage = 'This is a very long message that should be displayed correctly. '.repeat(10).trim();

    renderConfirmDialog({ message: longMessage });

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('should handle special characters in title and message', () => {
    renderConfirmDialog({
      title: 'Delete "Important" Task?',
      message: "Are you sure? This can't be undone!",
    });

    expect(screen.getByText('Delete "Important" Task?')).toBeInTheDocument();
    expect(screen.getByText("Are you sure? This can't be undone!")).toBeInTheDocument();
  });

  it('should cleanup keyboard event listener on unmount', () => {
    const handleConfirm = vi.fn();

    const { unmount } = renderConfirmDialog({ onConfirm: handleConfirm });

    unmount();

    fireEvent.keyDown(document, { key: 'Enter' });

    expect(handleConfirm).not.toHaveBeenCalled();
  });

  it('should cleanup keyboard event listener when dialog closes', () => {
    const handleConfirm = vi.fn();

    const { rerender } = renderConfirmDialog({
      onConfirm: handleConfirm,
      isOpen: true
    });

    rerender(
      <ConfirmDialog
        {...defaultProps}
        onConfirm={handleConfirm}
        isOpen={false}
      />
    );

    fireEvent.keyDown(document, { key: 'Enter' });

    expect(handleConfirm).not.toHaveBeenCalled();
  });
});
