'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import JoinWaitlistButton from '../ui/JoinWaitlistButton';

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.4, duration: 0.8 } }
};

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden flex flex-col pt-12 bg-white">
      {/* Background Split Layout */}
      <div className="absolute top-0 left-0 w-full h-[65%] bg-[#004E4C] z-0" aria-hidden="true" />

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8 flex flex-col pb-20"
      >
        
        {/* ─── Top Level: Heading & Buttons ───────────────────── */}
        <div className="flex flex-col gap-8 pt-10 pb-16">
          
          {/* Heading */}
          <motion.h1 
            variants={fadeUpVariant}
            className="font-heading text-4xl lg:text-5xl tracking-tight font-bold text-[#FFE419] leading-tight max-w-2xl"
          >
            Insurance built for Gig Workers
          </motion.h1>

          {/* Description & Buttons Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-16">
            
            <motion.p 
              variants={fadeUpVariant}
              className="font-body text-xl text-white/90 leading-relaxed max-w-xl"
            >
              GigSecure provides flexible, income-based insurance for
              freelancers, drivers, riders, and independent professionals.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <div className="w-full sm:w-auto">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex w-full  px-6 font-body   cursor-pointer"
                >
                  <JoinWaitlistButton />
                </motion.div>
              </div>
              <Link href="/waitlist" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.2)' }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-[50px] w-full items-center justify-center rounded-[5px] border border-white/40 bg-white/10 px-6 font-body text-base font-medium tracking-tight text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 backdrop-blur-sm cursor-pointer"
                >
                  Get Covered in Minutes
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* ─── Bottom Level: Overlapping Cards ────────────────── */}
        <motion.div 
          variants={fadeUpVariant}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full mt-4"
        >
          
          {/* Card 1: Drivers and Dispatch Riders */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="bg-white rounded-t-3xl overflow-hidden shadow-xl flex flex-col group cursor-pointer"
          >
            {/* Card Content Top */}
            <div className="p-8 pb-6 flex flex-col flex-1 h-[220px] relative">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-heading text-2xl font-bold text-[#004E4C] max-w-[85%]">
                  Coverage for Drivers and Dispatch Riders
                </h2>
                {/* Arrow Icon Box */}
                <div className="w-10 h-10 shrink-0 bg-[#004E4C] rounded overflow-hidden flex items-center justify-center transition-transform group-hover:scale-110">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <ArrowUpRight className="w-5 h-5 text-[#FFE419]" />
                  </motion.div>
                </div>
              </div>
              <p className="font-body text-[#004E4C]/80 text-base max-w-sm">
                Protect your income, vehicle, and health against accidents,
                downtime, and work-related risks.
              </p>
            </div>
            {/* Card Image Bottom with subtle auto-floating animation */}
            <div className="relative h-[280px] w-full overflow-hidden">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="w-full h-full relative"
              >
                <Image
                  src="/assets/images/a409bd93db42a474a79d789c5121daaf7783679d.webp"
                  alt="Delivery rider handing a package to a customer"
                  fill
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Card 2: Freelancers and Independent Professionals */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="bg-[#FFE419] rounded-t-3xl overflow-hidden shadow-xl flex flex-col group cursor-pointer"
          >
             {/* Card Content Top */}
             <div className="p-8 pb-6 flex flex-col flex-1 h-[220px] relative">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-heading text-2xl font-bold text-[#004E4C] max-w-[85%]">
                  Coverage for Freelancers and Independent Professionals
                </h2>
                {/* Arrow Icon Box */}
                <div className="w-10 h-10 shrink-0 bg-white rounded overflow-hidden flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <ArrowUpRight className="w-5 h-5 text-[#004E4C]" />
                  </motion.div>
                </div>
              </div>
              <p className="font-body text-[#004E4C]/90 text-base max-w-sm">
                Protect your income against illness, project interruption, and equipment loss.
              </p>
            </div>
            {/* Card Image Bottom */}
            <div className="relative h-[280px] w-full overflow-hidden">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
                className="w-full h-full relative"
              >
                <Image
                  src="/assets/images/77b7b280d62e8e9a4f26c135f20e276995476f53.webp"
                  alt="Freelancer working happily on a laptop"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </motion.div>
            </div>
          </motion.div>

        </motion.div>

      </motion.div>
    </section>
  );
}
