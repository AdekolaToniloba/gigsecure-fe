import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { setupMSW } from '@/mocks/index';
import { useWizardStore } from '@/store/wizard-store';
import { useAuthStore } from '@/store/auth-store';
import { mockRouter } from './test-utils';

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = () => [];
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:8000');

// ResizeObserver mock (needed by Framer Motion AnimatePresence)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Reset all stores and storage before each test to prevent state leaking
beforeEach(() => {
  useWizardStore.getState().reset();
  useAuthStore.getState().clearAuth();
  sessionStorage.clear();
  localStorage.clear();
});

// Start MSW for all tests
setupMSW();

