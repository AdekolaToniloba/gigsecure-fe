import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import HowItWorks from '@/components/home/HowItWorks';
import BuiltAround from '@/components/home/BuiltAround';
import FAQ from '@/components/home/FAQ';
import KnowYourRisk from '@/components/home/KnowYourRisk';
import CTA from '@/components/home/CTA';
import ScrollCTA from '@/components/public/risk-assessment/ScrollCTA';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col w-full bg-white">
      <Hero />
      <Features />
      <HowItWorks />
      <BuiltAround />
      <FAQ />
      <KnowYourRisk />
      <CTA />
      <ScrollCTA />
    </main>
  );
}
