import { Metadata } from 'next';
import FAQList from './FAQList';
import CTA from '@/components/home/CTA';

export const metadata: Metadata = {
  title: 'FAQ - GigSecure',
  description: 'Everything You need To Know About GigSecure',
};

const FULL_FAQ_DATA = [
  {
    id: 1,
    question: 'Is GigSecure a real insurance company?',
    answer: 'GigSecure is a registered intermediary platform in Nigeria. We partner with licensed insurance companies to offer coverage that fits the dynamic nature of gig work.',
  },
  {
    id: 2,
    question: 'Does GigSecure sell insurance directly?',
    answer: 'No, GigSecure connects freelancers and gig workers to insurance options that fit irregular income and modern work patterns.',
  },
  {
    id: 3,
    question: 'Why should I trust GigSecure?',
    answer: 'GigSecure was built for gig workers who struggle to find suitable insurance. The risk assessment is free, there is no pressure to buy coverage, and your data is not sold.',
  },
  {
    id: 4,
    question: 'Is the GigSecure risk assessment actually accurate?',
    answer: "Yes, the assessment uses the details you provide about your income, hours, and work environment to evaluate risk accurately. It's meant to give you a clear picture of what you might face.",
  },
  {
    id: 5,
    question: 'Is this just a way to collect my data?',
    answer: 'No. Your details are kept private, and we use this data solely to generate your risk assessment and propose practical solutions for gig workers.',
  },
  {
    id: 6,
    question: 'What happens after I complete the risk assessment?',
    answer: 'You receive your unique score and a breakdown of your risk exposure and the coverage options we recommend based on what you actually earn.',
  },
  {
    id: 7,
    question: 'Will insurance actually pay if something happens?',
    answer: 'GigSecure works with licensed insurance providers with decent track records. Coverage terms and payouts are clearly established before you commit.',
  },
  {
    id: 8,
    question: 'I earn irregular income. How can I afford insurance?',
    answer: 'GigSecure focuses on flexible insurance options designed for freelancers with fluctuating income. The goal is to match coverage with your work and earning patterns.',
  },
  {
    id: 9,
    question: "What if I don't think I need insurance yet?",
    answer: "The assessment will help you evaluate your level of vulnerability. If you're running low risk, you may choose to delay coverage until you feel it's necessary.",
  },
  {
    id: 10,
    question: 'Who exactly is GigSecure for?',
    answer: 'GigSecure is for anyone in Nigeria whose income depends on their ability to work. This includes freelancers, remote workers, independent professionals, and gig workers.',
  },
  {
    id: 11,
    question: 'Is GigSecure only for tech freelancers?',
    answer: 'No. GigSecure supports the wider Nigerian gig economy, including people who work non-office jobs offline.',
  },
  {
    id: 12,
    question: 'Why are you even providing this service for us?',
    answer: 'Insurance adoption in Nigeria is low because many traditional products were not designed for freelancers and informal workers. GigSecure aims to bridge this gap by creating insurance solutions for the gig economy.',
  },
];

export default function FAQPage() {
  return (
    <main className="flex flex-col w-full bg-[#FFFFFF] min-h-screen">
      {/* Header Section */}
      <section className="bg-[#004E4C] pt-24 pb-16 w-full relative overflow-hidden">
        <div className="mx-auto w-full max-w-[1300px] px-6 sm:px-12 relative z-10 flex flex-col">
          <p className="font-heading text-2xl sm:text-[36px] font-bold text-[#FFE419] max-w-[550px] leading-[1.1]">
            Everything You need To Know<br />About GigSecure
          </p>
          <div className="flex w-full justify-end mt-12 sm:mt-12">
            <h1 className="font-heading text-5xl sm:text-[56px] font-bold text-[#FFE419] leading-none m-0 pr-4 sm:pr-8">
              FAQ'S
            </h1>
          </div>
        </div>
      </section>

      {/* FAQ List Section */}
      <section className="py-16 md:py-24 w-full bg-[#FAFAFA]">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <FAQList faqs={FULL_FAQ_DATA} />
        </div>
      </section>

      {/* CTA Section */}
      <div className=" bg-[#FAFAFA]">
        <CTA />
      </div>
    </main>
  );
}
