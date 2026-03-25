'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useUIStore } from '@/store/ui-store';

interface JoinWaitlistButtonProps extends Omit<HTMLMotionProps<'button'>, 'onClick'> {
  children?: React.ReactNode;
}

export default function JoinWaitlistButton({
  children = 'Join For Early Access',
  className = '',
  ...props
}: JoinWaitlistButtonProps) {
  const { openModal } = useUIStore();

  return (
    <motion.button
      onClick={() => openModal('waitlist')}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      // Use the injected className if provided, otherwise fallback to the default styling
      className={className || "flex h-12 items-center justify-center rounded-[4px] bg-[#FFE419] px-8 font-body text-base font-bold tracking-tight text-[#00676E] shadow-sm transition-colors hover:bg-[#FFE419]/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-accent/50 cursor-pointer"}
      aria-label="Join For Early Access"
      {...props}
    >
      {children}
    </motion.button>
  );
}
