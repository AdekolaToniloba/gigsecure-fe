import type { Metadata } from 'next';
import PublicAssessmentController from './_components/public-assessment-controller';

export const metadata: Metadata = {
  title: 'Risk Assessment - GigSecure',
  description: 'Complete your personalized risk assessment and get a tailored insurance protection plan.',
};

export default function AssessmentPage() {
  return <PublicAssessmentController />;
}
