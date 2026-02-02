import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock PointerEvent for dnd-kit (only if not already defined)
if (typeof window.PointerEvent === 'undefined') {
  class MockPointerEvent extends MouseEvent {
    pointerId: number;
    width: number;
    height: number;
    pressure: number;
    tangentialPressure: number;
    tiltX: number;
    tiltY: number;
    twist: number;
    pointerType: string;
    isPrimary: boolean;

    constructor(type: string, props: PointerEventInit = {}) {
      super(type, props);
      this.pointerId = props.pointerId ?? 0;
      this.width = props.width ?? 1;
      this.height = props.height ?? 1;
      this.pressure = props.pressure ?? 0;
      this.tangentialPressure = props.tangentialPressure ?? 0;
      this.tiltX = props.tiltX ?? 0;
      this.tiltY = props.tiltY ?? 0;
      this.twist = props.twist ?? 0;
      this.pointerType = props.pointerType ?? 'mouse';
      this.isPrimary = props.isPrimary ?? true;
    }
  }
  window.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
}

// Mock Element methods for dnd-kit (only if not already defined)
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = vi.fn();
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = vi.fn();
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
}

// Mock window.matchMedia for components that use media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock ResizeObserver
window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
