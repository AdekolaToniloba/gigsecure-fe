import type { Metadata } from 'next';
import { DashboardRiskAssessmentController } from '@/components/risk-assessment/dashboard/dashboard-risk-assessment-controller';

export const metadata: Metadata = {
  title: 'Risk Assessment',
  description: 'Manage your GigSecure risk assessment from your protected dashboard.',
};

export default function DashboardRiskAssessmentPage() {
  return <DashboardRiskAssessmentController />;
}
