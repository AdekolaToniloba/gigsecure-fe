'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function KnowYourRisk() {
  return (
    <section className="bg-white py-24 w-full overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        
        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          
          {/* Left Column: Text Content */}
          <div className="flex flex-col gap-8 max-w-xl mx-auto lg:mx-0">
            {/* Animated Header */}
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="font-heading text-4xl lg:text-5xl font-bold tracking-tight text-[#334155] leading-tight"
            >
              Know Your Risk. Choose Your <br className="hidden md:block" /> Protection.
            </motion.h2>

            {/* Animated Paragraph */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="font-body text-lg text-[#64748B] leading-relaxed max-w-lg"
            >
              GigSecure helps you assess your income stability and select the right coverage without paperwork or long approvals.
            </motion.p>

            {/* Animated CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
              className="pt-2"
            >
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-12 w-full sm:w-auto items-center justify-center rounded-[4px] bg-[#FFE419] px-10 font-body text-base font-bold tracking-tight text-[#00676E] shadow-sm transition-colors hover:bg-[#FFE419]/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-accent/50 cursor-pointer"
              >
                Contact Us
              </motion.button>
            </motion.div>
          </div>

          {/* Right Column: Visual Layout */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative w-full aspect-[4/3] mt-12 lg:mt-0"
          >
            {/* The Offset Yellow Background Block (Wider, Top Aligned) */}
            <div className="absolute top-0 left-0 w-full h-[92%] bg-[#FFF8D6] rounded-[2rem] z-0" aria-hidden="true" />
            
            {/* The Image Overlay Wrapper (Slight downward offset, central) */}
            <div className="relative w-[92%] h-[92%] mx-auto mt-6 sm:mt-8 z-10 rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/assets/images/ff066588c527ccd21434dec0d44a32b6f4062ba6.webp"
                alt="Smiling professional in the Know Your Risk section"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
