import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/auth';
import { domainHandlers } from './handlers/domain';

export const worker = setupWorker(...authHandlers, ...domainHandlers);
