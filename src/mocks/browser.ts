import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/auth';
import { domainHandlers } from './handlers/domain';
import { kycHandlers } from './handlers/kyc';

export const worker = setupWorker(...authHandlers, ...kycHandlers, ...domainHandlers);
