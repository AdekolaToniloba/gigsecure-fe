import type { ReactNode } from 'react';
import type { ParsedApiError } from '@/types/api';
import type { AssessmentResponse } from '@/types/api';
import type { AssessmentMode } from '@/lib/risk/assessment-route-context';
import type { WizardPersonalDetailsDefaults } from '@/lib/risk/profile-to-wizard-defaults';

export type RiskAssessmentWizardShell = {
  rootClassName?: string;
  contentClassName?: string;
  loadingClassName?: string;
  resumeBannerClassName?: string;
};

export type RiskAssessmentWizardProps = {
  mode: AssessmentMode;
  initialDefaults?: Partial<WizardPersonalDetailsDefaults>;
  onCancel: () => void;
  onSuccess: (assessment: AssessmentResponse) => void;
  onAuthenticationFailure: (error: ParsedApiError) => void;
  renderSuccess?: (assessment: AssessmentResponse) => ReactNode;
  shell?: RiskAssessmentWizardShell;
};
