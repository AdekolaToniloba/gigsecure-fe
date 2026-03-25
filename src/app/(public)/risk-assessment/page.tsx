import { Metadata } from 'next';
import RiskHero from '@/components/public/risk-assessment/RiskHero';
import Fragile from '@/components/public/risk-assessment/Fragile';
import DashboardPreview from '@/components/public/risk-assessment/DashboardPreview';
import NotGeneric from '@/components/public/risk-assessment/NotGeneric';
import WhatHappensAfter from '@/components/public/risk-assessment/WhatHappensAfter';
import QuickQuestions from '@/components/public/risk-assessment/QuickQuestions';
import BuiltForPeople from '@/components/public/risk-assessment/BuiltForPeople';

export const metadata: Metadata = {
  title: 'Risk Assessment - GigSecure',
  description: '67% of Nigerian gig workers have less than 2 months of money to fall back on. Where do you stand?',
};

export default function RiskAssessmentPage() {
  return (
    <main className="flex flex-col w-full bg-[#FFFFFF] min-h-screen">
      <RiskHero />
      <Fragile />
      <DashboardPreview />
      <NotGeneric />
      <WhatHappensAfter />
      <QuickQuestions />
      <BuiltForPeople />
    </main>
  );
}
