'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import JoinWaitlistButton from '@/components/ui/JoinWaitlistButton';

export default function CTA() {
  return (
    // Dynamic overlay wrapper section containing from-white to dark green background
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-white from-50% to-[#004E4C] to-50% pt-8 pb-32">
      <div className="mx-auto w-full max-w-[85rem] px-6 lg:px-8 relative z-10">
        
        {/* The Card Container */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative w-full rounded-[2rem] sm:rounded-[40px] bg-[#FFF8D6] shadow-xl overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8 min-h-[400px]">
            
            {/* Left Box: CTA Text and Avatars */}
            <div className="flex flex-col justify-center px-8 sm:px-12 py-12 lg:py-16 gap-8">
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#334155] leading-tight max-w-lg">
                Measure your gig stability. Cover your risk.
              </h2>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 mt-2">
                {/* Overlapping Avatar Stack */}
                <div className="flex -space-x-4">
                  <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden relative shadow-sm">
                    <Image 
                      src="/assets/images/ff066588c527ccd21434dec0d44a32b6f4062ba6.webp"
                      alt="User avatar 1"
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden relative shadow-sm">
                    <Image 
                      src="/assets/images/413aa6d39706739b55c3d3547197c15e8942316d.webp"
                      alt="User avatar 2"
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden relative shadow-sm bg-[#52B788]">
                    <Image 
                      src="/assets/images/77b7b280d62e8e9a4f26c135f20e276995476f53.webp"
                      alt="User avatar 3"
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                </div>

                {/* Waitlist Button */}
                <JoinWaitlistButton />
              </div>
            </div>

            {/* Right Box: Target Image with Custom Graphic Layout */}
            <div className="relative w-full h-[300px] lg:h-auto flex items-end justify-end pb-0 pr-0">
              
              {/* Decorative Squiggly line overlapping image at an angle */}
              <svg 
                className="absolute left-[5%] sm:left-[10%] lg:-left-[5%] top-[50%] sm:top-[55%] w-40 sm:w-64 lg:w-64 h-24 z-20 -rotate-[15deg] drop-shadow-md" 
                viewBox="0 0 100 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <motion.path 
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                  d="M0,20 C10,20 15,4 25,4 C35,4 40,20 50,20 C60,20 65,4 75,4 C85,4 90,20 100,20" 
                  stroke="#004E4C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" 
                />
              </svg>

              {/* The Subject Image locked dynamically to bottom right bounds internally */}
              <div className="relative w-[85%] h-[85%] sm:w-[320px] sm:h-[320px] lg:w-[400px] lg:h-[400px] rounded-[2rem] overflow-hidden mt-auto mr-12 lg:mr-16 mb-8 shadow-md z-10">
                <Image
                  src="/assets/images/413aa6d39706739b55c3d3547197c15e8942316d.webp"
                  alt="Delivery rider active in the CTA layout"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
