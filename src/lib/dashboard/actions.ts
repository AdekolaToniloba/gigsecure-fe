export type DashboardActionStatus = 'complete' | 'incomplete' | 'available' | 'information';

export type DashboardActionItem = {
  id: string;
  title: string;
  description: string;
  status: DashboardActionStatus;
  href?: '/assessment' | '/marketplace' | '/kyc';
};

type GettingStartedInput = {
  riskAssessed: boolean;
  kycVerified: boolean;
  emailVerified: boolean;
};

export function getGettingStartedActions({
  riskAssessed,
  kycVerified,
  emailVerified,
}: GettingStartedInput): DashboardActionItem[] {
  return [
    {
      id: 'risk-assessment',
      title: 'Complete your risk assessment',
      description: riskAssessed
        ? 'Your latest risk assessment is complete.'
        : 'Generate your financial risk score and protection insights.',
      status: riskAssessed ? 'complete' : 'incomplete',
      href: riskAssessed ? undefined : '/assessment',
    },
    {
      id: 'kyc-verification',
      title: 'Verify your identity',
      description: kycVerified
        ? 'Your KYC verification is complete.'
        : 'Complete NIN verification to unlock protected account actions.',
      status: kycVerified ? 'complete' : 'incomplete',
      href: kycVerified ? undefined : '/kyc',
    },
    {
      id: 'email-verification',
      title: 'Verify your email address',
      description: emailVerified
        ? 'Your email address is verified.'
        : 'Use the secure verification link sent to your email address.',
      status: emailVerified ? 'complete' : 'incomplete',
    },
    {
      id: 'marketplace',
      title: 'Explore protection plans',
      description: 'Browse available protection products in the marketplace.',
      status: 'available',
      href: '/marketplace',
    },
  ];
}

type RecommendedActionsInput = {
  recommendations: readonly string[];
  kycVerified: boolean;
};

export function getRecommendedActions({
  recommendations,
  kycVerified,
}: RecommendedActionsInput): DashboardActionItem[] {
  const actions: DashboardActionItem[] = [];

  if (!kycVerified) {
    actions.push({
      id: 'kyc-verification',
      title: 'Complete KYC verification',
      description: 'Verify your identity to unlock protected account actions.',
      status: 'incomplete',
      href: '/kyc',
    });
  }

  for (let index = 0; index < recommendations.length; index += 1) {
    const recommendation = recommendations[index].trim();
    if (!recommendation) continue;

    actions.push({
      id: `recommendation-${index}`,
      title: recommendation,
      description: 'Personalized guidance from your latest risk assessment.',
      status: 'information',
    });
  }

  actions.push({
    id: 'marketplace',
    title: 'Explore protection plans',
    description: 'Compare available protection products in the marketplace.',
    status: 'available',
    href: '/marketplace',
  });

  return actions;
}
