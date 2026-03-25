/// <reference types="vitest/globals" />
import { server } from './server';

/** Call this in vitest.setup.ts */
export function setupMSW() {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}

export { server };
