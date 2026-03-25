'use client';

import { motion } from 'framer-motion';

export default function AboutHero() {
  return (
    <section className="bg-[#004E4C] pt-32 pb-24 md:pt-40 md:pb-32 w-full relative overflow-hidden flex flex-col items-center justify-center text-center">
      {/* Decorative Accents */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-[#005a58] opacity-50 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-12 left-12 w-24 h-24 bg-[#005a58] opacity-50" />
      
      <div className="mx-auto w-full max-w-5xl px-6 lg:px-8 relative z-10 flex flex-col items-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="font-body text-[32px] font-semibold text-[#FFE419] leading-none text-center max-w-[908px]"
        >
          GigSecure was created to serve a simple but overlooked reality: Nigeria's gig workers are building the economy without systems designed to protect them.
        </motion.h1>
      </div>

      <div className="absolute bottom-0 right-0 w-48 h-48 border-[20px] border-[#005a58] opacity-50 translate-x-1/4 translate-y-1/4 rounded-sm" />
    </section>
  );
}
