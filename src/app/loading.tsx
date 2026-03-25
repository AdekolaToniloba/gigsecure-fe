'use client';

import { motion } from 'framer-motion';

export default function GlobalLoading() {
  return (
    <main
      aria-label="Loading GigSecure"
      className="flex min-h-screen items-center justify-center bg-white"
    >
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.98, 1.02, 0.98] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="flex items-center gap-1"
      >
        <span className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-[#004E4C] flex items-center">
          GigSecure<span className="text-[#FFE419] ml-1.5 text-5xl sm:text-6xl leading-[0]">.</span>
        </span>
      </motion.div>
    </main>
  );
}
