import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';
import { domainHandlers } from './handlers/domain';
import { kycHandlers } from './handlers/kyc';

export const server = setupServer(...authHandlers, ...kycHandlers, ...domainHandlers);
