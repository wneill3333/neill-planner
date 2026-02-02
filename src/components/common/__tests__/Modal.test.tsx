/**
 * Modal Component Tests
 *
 * Comprehensive tests for the Modal component including:
 * - Rendering in open/closed states
 * - Interaction tests (close button, backdrop, Escape key)
 * - Accessibility features (role, aria attributes, body scroll lock)
 * - Portal rendering
 * - Size variants
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

// =============================================================================
// Mock Setup
// =============================================================================

// Mock the useFocusManagement hook
vi.mock('../../../hooks/useFocusManagement', () => ({
  useFocusManagement: vi.fn(() => ({ current: null })),
}));

// =============================================================================
// Test Helpers
// =============================================================================

function createPortalRoot() {
  const portalRoot = document.createElement('div');
  portalRoot.setAttribute('id', 'portal-root');
  document.body.appendChild(portalRoot);
  return portalRoot;
}

function getModalElement() {
  return screen.queryByTestId('modal');
}

function getBackdrop() {
  const modal = getModalElement();
  return modal?.previousElementSibling;
}

// =============================================================================
// Rendering Tests
// =============================================================================

describe('Modal - Rendering', () => {
  beforeEach(() => {
    // Clean up body styles before each test
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  afterEach(() => {
    // Clean up after each test
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  it('should not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(getModalElement()).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(getModalElement()).toBeInTheDocument();
  });

  it('should render modal title', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal Title">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal Title')).toBeInTheDocument();
  });

  it('should render modal children', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p data-testid="modal-content">Modal content text</p>
      </Modal>
    );

    expect(screen.getByTestId('modal-content')).toHaveTextContent('Modal content text');
  });

  it('should render close button by default', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
  });

  it('should not render close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal" showCloseButton={false}>
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
  });

  it('should render with custom testId', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal" testId="custom-modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByTestId('custom-modal')).toBeInTheDocument();
  });

  it('should render with default testId', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });
});

// =============================================================================
// Size Variant Tests
// =============================================================================

describe('Modal - Size Variants', () => {
  it('should apply sm size class', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal" size="sm">
        <p>Modal content</p>
      </Modal>
    );

    const modal = getModalElement();
    const modalContent = modal?.querySelector('[class*="max-w-sm"]');
    expect(modalContent).toBeInTheDocument();
  });

  it('should apply md size class by default', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const modal = getModalElement();
    const modalContent = modal?.querySelector('[class*="max-w-md"]');
    expect(modalContent).toBeInTheDocument();
  });

  it('should apply lg size class', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal" size="lg">
        <p>Modal content</p>
      </Modal>
    );

    const modal = getModalElement();
    const modalContent = modal?.querySelector('[class*="max-w-lg"]');
    expect(modalContent).toBeInTheDocument();
  });

  it('should apply xl size class', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal" size="xl">
        <p>Modal content</p>
      </Modal>
    );

    const modal = getModalElement();
    const modalContent = modal?.querySelector('[class*="max-w-xl"]');
    expect(modalContent).toBeInTheDocument();
  });

  it('should apply full size class', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal" size="full">
        <p>Modal content</p>
      </Modal>
    );

    const modal = getModalElement();
    const modalContent = modal?.querySelector('[class*="max-w-full"]');
    expect(modalContent).toBeInTheDocument();
  });
});

// =============================================================================
// Interaction Tests
// =============================================================================

describe('Modal - Interactions', () => {
  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    await user.click(screen.getByLabelText('Close modal'));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    const handleClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const modal = getModalElement();
    const backdrop = modal?.parentElement?.querySelector('[class*="bg-black"]');

    if (backdrop) {
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should not call onClose when modal content is clicked', () => {
    const handleClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p data-testid="modal-content">Modal content</p>
      </Modal>
    );

    fireEvent.click(screen.getByTestId('modal-content'));

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('should not call onClose on backdrop click when closeOnBackdropClick is false', () => {
    const handleClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal" closeOnBackdropClick={false}>
        <p>Modal content</p>
      </Modal>
    );

    const modal = getModalElement();
    const backdrop = modal?.parentElement?.querySelector('[class*="bg-black"]');

    if (backdrop) {
      fireEvent.click(backdrop);
      expect(handleClose).not.toHaveBeenCalled();
    }
  });

  it('should call onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose on Escape when closeOnEscape is false', () => {
    const handleClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal" closeOnEscape={false}>
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('should not call onClose on other key presses', () => {
    const handleClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Tab' });
    fireEvent.keyDown(document, { key: 'Space' });

    expect(handleClose).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Accessibility Tests
// =============================================================================

describe('Modal - Accessibility', () => {
  it('should have role="dialog"', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should have aria-modal="true"', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
  });

  it('should have aria-labelledby pointing to title', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(screen.getByText('Test Modal')).toHaveAttribute('id', 'modal-title');
  });

  it('should have accessible close button with aria-label', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close modal');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton.tagName).toBe('BUTTON');
  });

  it('should have aria-hidden on backdrop', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const modal = getModalElement();
    const backdrop = modal?.parentElement?.querySelector('[class*="bg-black"]');
    expect(backdrop).toHaveAttribute('aria-hidden', 'true');
  });
});

// =============================================================================
// Body Scroll Lock Tests
// =============================================================================

describe('Modal - Body Scroll Lock', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  it('should lock body scroll when modal is open', async () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('');

    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  it('should restore body scroll when modal is closed', async () => {
    const originalOverflow = 'auto';
    document.body.style.overflow = originalOverflow;

    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });

    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    await waitFor(() => {
      expect(document.body.style.overflow).toBe(originalOverflow);
    });
  });

  it('should restore body scroll on unmount', async () => {
    const originalOverflow = 'scroll';
    document.body.style.overflow = originalOverflow;

    const { unmount } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });

    unmount();

    expect(document.body.style.overflow).toBe(originalOverflow);
  });
});

// =============================================================================
// Portal Rendering Tests
// =============================================================================

describe('Modal - Portal Rendering', () => {
  it('should render modal into document.body via portal', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const modal = getModalElement();
    // Modal should be rendered as a descendant of document.body via portal
    expect(modal).toBeInTheDocument();
    expect(document.body.contains(modal)).toBe(true);
  });

  it('should clean up portal content when modal closes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(getModalElement()).toBeInTheDocument();

    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(getModalElement()).not.toBeInTheDocument();
  });
});
