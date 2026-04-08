'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { assetUrl, ASSETS } from '@/lib/assets';

export default function BuiltAround() {
  return (
    <section className="bg-white py-24 w-full overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        
        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          
          {/* Left Column: Text Content & Animation */}
          <div className="flex flex-col gap-8 max-w-xl">
            {/* Animated Header */}
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="font-heading text-4xl lg:text-[42px] font-bold tracking-tight text-[#334155] leading-tight"
            >
              Insurance Built Around <br className="hidden md:block" />
              How Gig Workers Actually <br className="hidden md:block" />
              Earn
            </motion.h2>

            {/* Animated Paragraph */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="font-body text-lg lg:text-xl text-[#64748B] leading-relaxed max-w-lg"
            >
              GigSecure evaluates income patterns, client concentration, and work exposure to recommend coverage aligned with irregular earnings. No generic plans. No unnecessary coverage. Just protection that fits your work model.
            </motion.p>

            {/* Animated CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
              className="pt-2"
            >
              <Link href="/plans">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-12 items-center justify-center rounded-[5px] bg-[#FFE419] px-8 font-body text-base font-bold tracking-tight text-[#00676E] shadow-sm transition-colors hover:bg-[#FFE419]/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/50"
                  aria-label="View Insurance Plans"
                >
                  View Plans
                </motion.button>
              </Link>
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
            {/* The Offset Green Background Block */}
            <div className="absolute top-0 left-0 w-full h-[92%] bg-[#00676E] rounded-[2rem] z-0" aria-hidden="true" />
            
            {/* The Image Overlay Wrapper (Slight downward offset, central) */}
            <div className="relative w-[92%] h-[92%] mx-auto mt-6 sm:mt-8 z-10 rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src={assetUrl(ASSETS.a6240d543a2fedd60dfd5beb2da99377a37a0c93)}
                alt="Freelancer with earmuffs working on a laptop in a workshop"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />

              {/* Centered Overlay Play Button */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.button 
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 shadow-xl pointer-events-auto hover:bg-white/30 transition-colors"
                  aria-label="Play video"
                >
                  <Play className="h-8 w-8 sm:h-10 sm:w-10 text-white ml-1 sm:ml-2 drop-shadow-md" fill="white" />
                </motion.button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
