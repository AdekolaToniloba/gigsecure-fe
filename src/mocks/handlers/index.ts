import { authHandlers } from './auth';
import { dashboardHandlers } from './dashboard';
import { domainHandlers } from './domain';
import { kycHandlers } from './kyc';
import { marketplaceHandlers } from './marketplace';
import { policiesHandlers } from './policies';
import { riskHandlers } from './risk';
import { settingsHandlers } from './settings';

export const handlers = [
  ...authHandlers,
  ...kycHandlers,
  ...marketplaceHandlers,
  ...policiesHandlers,
  ...settingsHandlers,
  ...dashboardHandlers,
  ...riskHandlers,
  ...domainHandlers,
];
