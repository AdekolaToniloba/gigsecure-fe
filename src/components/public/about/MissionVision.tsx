'use client';

import { motion } from 'framer-motion';

export default function MissionVision() {
  return (
    <section className="bg-[#FFF6D0] w-full py-24 md:py-32 relative overflow-hidden">
      {/* Top Left Accent */}
      <div className="absolute top-0 left-0 w-16 h-16 md:w-24 md:h-24 bg-[#004E4C] rounded-br-[2rem] md:rounded-br-[3rem] z-0" />
      {/* Bottom Right Accent */}
      <div className="absolute bottom-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-[#004E4C] rounded-tl-[2rem] md:rounded-tl-[3rem] z-0" />
      
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <h2 className="font-heading text-3xl md:text-4xl lg:text-[40px] font-bold text-gray-900 tracking-tight">
              Our Mission
            </h2>
            <p className="font-body text-base md:text-lg text-gray-800 leading-relaxed font-medium">
              To independently protect, sustain, and empower Africa's growing gig workforce.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-6"
          >
            <h2 className="font-heading text-3xl md:text-4xl lg:text-[40px] font-bold text-gray-900 tracking-tight">
              Our Vision
            </h2>
            <p className="font-body text-base md:text-lg text-gray-800 leading-relaxed font-medium">
              We envision a locally accessible, secure framework across Africa where gig workers are protected by systems designed proportionally for them.
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
