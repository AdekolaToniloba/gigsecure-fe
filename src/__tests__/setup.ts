import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { setupMSW } from '@/mocks/index';

class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = () => [];
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// Start MSW for all tests
setupMSW();

