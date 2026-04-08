'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChartPieIcon, ChartBarSquareIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

export default function RiskHero() {
  const router = useRouter();
  return (
    <section className="bg-[#004E4C] pt-32 pb-24 md:pt-40 md:pb-32 w-full relative overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_543px] gap-12 lg:gap-8 items-center justify-items-center lg:justify-items-end">
          
          {/* Left Column: Text and CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex flex-col w-full"
          >
            <h1 className="font-heading text-[36px] font-bold text-[#FFE419] leading-none mb-6 max-w-[602px]">
              67% of Nigerian gig workers have less than 2 months of money to fall back on. Where do you stand?
            </h1>
            <p className="font-body text-[18px] md:text-[20px] text-white leading-relaxed mb-10">
              A reality risk check built specifically for gig workers like you.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-16">
              <button 
                onClick={() => router.push('/waitlist')}
                className="flex items-center justify-center rounded-[5px] bg-[#FFE419] px-6 py-3 font-body text-[16px] font-bold text-[#004E4C] transition-colors hover:bg-[#FFE419]/90 shadow-sm focus:outline-none cursor-pointer"
              >
                Take the Assessment
              </button>
            </div>

            {/* Avatars and Trust Text */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[
                  '/assets/images/ff066588c527ccd21434dec0d44a32b6f4062ba6.webp',
                  '/assets/images/413aa6d39706739b55c3d3547197c15e8942316d.webp',
                  '/assets/images/77b7b280d62e8e9a4f26c135f20e276995476f53.webp'
                ].map((src, i) => (
                  <div key={i} className="w-[45px] h-[45px] rounded-full border-[3px] border-[#FFE419] overflow-hidden relative shadow-sm">
                    <Image src={src} alt={`User avatar ${i+1}`} fill className="object-cover" sizes="45px" />
                  </div>
                ))}
              </div>
              <p className="font-body text-[14px] font-light text-white leading-[24px] max-w-[360px]">
                Already used by thousands of gigworkers across Nigeria to understand what's actually at risk in their gigwork careers.
              </p>
            </div>
          </motion.div>

          {/* Right Column: Image and Floating Pills */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="relative w-full max-w-[543px] flex justify-center items-center mt-12 lg:mt-0"
            style={{ height: '520px' }} // Slightly larger than image to accommodate vertical overflow of bg bar
          >
            {/* Decorative Vertical Background Bar */}
            <div className="absolute top-0 bottom-0 w-[144px] bg-[#DFE1BF] rounded-[18px] z-0" />

            {/* Decorative cross marks top right */}
            <div className="absolute -top-2 -right-12 z-20 w-12 h-12">
               <Image
                 src="/assets/images/Group_57.webp"
                 alt="Decorative Cross"
                 fill
                 className="object-contain"
               />
            </div>

            {/* The Main Image */}
            <div className="absolute z-10 overflow-hidden shadow-xl"
                 style={{ width: '100%', maxWidth: '543px', height: '473px', borderRadius: '17.5px' }}
            >
              <Image
                src="/assets/images/risk-assessment/Rectangle_119.webp"
                alt="Man smiling while looking at laptop and holding a card"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 543px"
                priority
              />
            </div>

            {/* Floating Pill Top Right */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute top-12 -right-8 md:-right-12 bg-[#FFF6D0] rounded-[24px] p-5 shadow-lg z-30 flex flex-col items-center gap-1 w-[120px] aspect-square justify-center overflow-hidden"
            >
              {/* Subtle yellow decorative circle in the background like the figma mock */}
              <div className="absolute top-[-10px] left-[-10px] w-[50px] h-[50px] bg-[#FFE419]/30 rounded-full" />
              <ChartPieIcon className="w-8 h-8 text-[#004E4C] z-10" />
              <span className="font-body text-[14px] font-medium text-[#004E4C] z-10 w-max">Risk Score</span>
            </motion.div>

            {/* Floating Pill Bottom Left */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="absolute bottom-8 -left-6 md:-left-10 bg-[#FFF9AA] rounded-[24px] py-4 px-6 md:p-6 shadow-lg z-30 flex flex-col items-center gap-1"
            >
              <ChartBarSquareIcon className="w-8 h-8 text-[#004E4C]" />
              <span className="font-body text-[14px] md:text-[15px] font-medium text-[#004E4C] text-center leading-tight">Risk<br/>Assessment</span>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
