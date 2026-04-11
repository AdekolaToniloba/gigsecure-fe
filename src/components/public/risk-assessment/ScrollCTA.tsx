'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ScrollCTA() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (isDismissed) return;
      // Show when scrolled down more than 400px
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Initial check in case user loads halfway down the page
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  return (
    <AnimatePresence>
      {isVisible && !isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 w-[calc(100%-2rem)] sm:w-[380px] bg-[#004E4C] rounded-2xl shadow-2xl p-6 border border-[#FFE419]/20 flex flex-col gap-4 overflow-hidden"
          role="dialog"
          aria-labelledby="scroll-cta-title"
          aria-modal="false" // non-modal semantic standard for floating elements
        >
          {/* Subtle background decoration */}
          <div className="absolute top-[-20px] left-[-20px] w-[100px] h-[100px] bg-[#FFE419]/10 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />
          
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE419] rounded-full p-1 z-10 bg-[#004E4C]"
            aria-label="Close dialog"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <h3 id="scroll-cta-title" className="font-heading text-xl font-bold text-white pr-6 relative z-10 leading-tight">
            Ready to find out where you stand?
          </h3>
          
          <p className="font-body text-[15px] text-white/80 leading-relaxed relative z-10">
            A reality risk check built specifically for gig workers like you. Get clarity on your financial stability in minutes.
          </p>

          <button
            onClick={() => {
              setIsDismissed(true); // Close the dialog upon clicking
              router.push('/waitlist');
            }}
            className="mt-2 w-full relative z-10 flex items-center justify-center rounded-[5px] bg-[#FFE419] px-6 py-3.5 font-body text-[15px] font-bold text-[#004E4C] transition-all hover:bg-[#FFE419]/90 hover:scale-[1.02] shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Take the Assessment
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
