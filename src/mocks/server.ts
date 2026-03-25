import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';
import { domainHandlers } from './handlers/domain';

export const server = setupServer(...authHandlers, ...domainHandlers);
