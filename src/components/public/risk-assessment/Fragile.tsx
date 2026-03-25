'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const CARDS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 20H21V22H3V20ZM4 16L10 9L14 13L20 5V16H4Z" fill="#111827"/>
      </svg>
    ),
    text: "How stable your income really is",
    bg: "bg-[#E4EDED]",
    border: "border-transparent",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 16H20V6A2 2 0 0018 4H6A2 2 0 004 6V16Z" fill="none" stroke="#111827" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M2 18H22V20H2V18Z" fill="#111827"/>
      </svg>
    ),
    text: "How dependent your work is on your equipment.",
    bg: "bg-[#FFF9AA]",
    border: "border-[2.5px] border-[#0092FF]",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="3" width="4" height="4" fill="#111827"/>
        <rect x="4" y="15" width="4" height="4" fill="#111827"/>
        <rect x="16" y="15" width="4" height="4" fill="#111827"/>
        <path d="M12 7V11H6V15" fill="none" stroke="#111827" strokeWidth="2"/>
        <path d="M12 11H18V15" fill="none" stroke="#111827" strokeWidth="2"/>
      </svg>
    ),
    text: "How concentrated your client risk might be",
    bg: "bg-[#FFF9AA]",
    border: "border-transparent",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4C6.477 4 2 8.477 2 14H22C22 8.477 17.523 4 12 4Z" fill="#111827"/>
        <path d="M12 14V20A2 2 0 0016 20" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    text: "How strong (or thin) your safety net actually is",
    bg: "bg-[#E4EDED]",
    border: "border-transparent",
  }
];

export default function Fragile() {
  return (
    <section className="bg-[#F5F7F7] w-full py-24 md:py-32 overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-start">
          
          {/* Left Side: Text & Cards Grid */}
          <div className="flex flex-col">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="mb-10"
            >
              <h2 className="font-heading text-4xl md:text-[44px] lg:text-[48px] font-bold text-gray-900 leading-[1.2] tracking-tight mb-4 max-w-md">
                Gig Work looks flexible, But it's fragile.
              </h2>
              <p className="font-body text-base text-gray-800 font-medium">
                This quick assessment helps you see:
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              {CARDS.map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className={`${card.bg} ${card.border !== 'border-transparent' ? card.border : 'border border-transparent'} rounded-[16px] p-6 lg:p-8 shadow-sm transition-transform duration-300 flex flex-col justify-center gap-6 min-h-[220px] cursor-pointer`}
                >
                  <div className="flex items-center">
                    {card.icon}
                  </div>
                  <p className="font-body text-[15px] text-gray-900 font-medium leading-normal pr-4">
                    {card.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Side: Portrait Image */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full h-full relative min-h-[500px] lg:min-h-full rounded-[24px] overflow-hidden shadow-lg mt-4 lg:mt-0 lg:ml-8"
          >
            {/* Fallback yellow background if image doesn't fill */}
            <div className="absolute inset-0 bg-[#FFE419] z-0" />
            <Image
              src="/assets/images/risk-assessment/Rectangle_129.webp"
              alt="Woman smiling widely in front of yellow background"
              fill
              className="object-cover object-top z-10"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
