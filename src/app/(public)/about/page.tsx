import { Metadata } from 'next';
import AboutHero from '@/components/public/about/AboutHero';
import TheTruth from '@/components/public/about/TheTruth';
import MissionVision from '@/components/public/about/MissionVision';
import WhatWeDo from '@/components/public/about/WhatWeDo';
import OurStory from '@/components/public/about/OurStory';
import BottomStatement from '@/components/public/about/BottomStatement';

export const metadata: Metadata = {
  title: 'About Us - GigSecure',
  description: 'GigSecure was created to serve a simple but overlooked reality: Nigeria\'s gig workers are building the economy without systems designed to protect them.',
};

export default function AboutPage() {
  return (
    <main className="flex flex-col w-full bg-[#FFFFFF] min-h-screen">
      <AboutHero />
      <TheTruth />
      <MissionVision />
      <WhatWeDo />
      <OurStory />
      <BottomStatement />
    </main>
  );
}
