'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white px-6 text-center">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
        className="flex h-32 w-32 items-center justify-center rounded-full bg-[#004E4C]/5 mb-4 shadow-inner"
      >
        <span
          className="font-heading text-5xl font-bold text-[#004E4C]"
          aria-hidden="true"
        >
          404
        </span>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-4"
      >
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-[#334155] tracking-tight">
          Page not found
        </h1>
        <p className="max-w-md text-lg text-[#64748B] mx-auto leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist, or it may have been moved to a new route.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex h-12 items-center justify-center rounded-[4px] bg-[#FFE419] px-8 font-body text-base font-bold tracking-tight text-[#00676E] shadow-sm transition-colors hover:bg-[#FFE419]/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-accent/50 cursor-pointer"
          >
            Return Home
          </motion.button>
        </Link>
      </motion.div>
    </main>
  );
}
