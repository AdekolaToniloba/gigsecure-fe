import { authHandlers } from './auth';
import { dashboardHandlers } from './dashboard';
import { domainHandlers } from './domain';
import { kycHandlers } from './kyc';
import { marketplaceHandlers } from './marketplace';

export const handlers = [
  ...authHandlers,
  ...kycHandlers,
  ...marketplaceHandlers,
  ...dashboardHandlers,
  ...domainHandlers,
];
