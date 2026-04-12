'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ComingSoonPage() {
  return (
    <main className="min-h-screen bg-[#004E4C] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FFE419]/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#DFE1BF]/10 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center max-w-2xl text-center">
        
        {/* Animated SVG Graphic (Shield) */}
        <div className="mb-10 w-32 h-32 text-[#FFE419]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
            aria-hidden="true"
          >
            <motion.path
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 1 }}
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"
            />
            <motion.path
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 1.5 }}
              d="M12 8v4"
            />
            <motion.path
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1, ease: "backOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
              d="M12 16h.01"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Text Area */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
        >
          Something amazing is <span className="text-[#FFE419]">coming soon.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="font-body text-lg sm:text-xl text-white/80 leading-relaxed mb-10 max-w-lg"
        >
          We are currently building this out! GigSecure is continuously working to redefine your risk assessment experience to bring flexible, income-based insurance to gig workers everywhere.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link href="/">
            <button className="flex h-12 w-full sm:w-auto items-center justify-center rounded-[5px] bg-[#FFE419] px-8 font-body text-base font-bold text-[#004E4C] transition-all hover:bg-[#FFE419]/90 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              Return Home
            </button>
          </Link>
          <Link href="/waitlist">
            <button className="flex h-12 w-full sm:w-auto items-center justify-center rounded-[5px] bg-white/10 border border-white/20 backdrop-blur-sm px-8 font-body text-base font-medium text-white transition-all hover:bg-white/20 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE419]">
              Join Waitlist
            </button>
          </Link>
        </motion.div>

      </div>
    </main>
  );
}
