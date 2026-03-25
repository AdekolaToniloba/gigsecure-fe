'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

const FOOTER_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Terms and Conditions', href: '/termsandconditions' },
];

export default function Footer() {
  return (
    <footer className="w-full bg-[#004E4C] text-white relative overflow-hidden">
      
      {/* Decorative Cross Icon (Bleeding off right edge) */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        animate={{ y: [0, -10, 0] }}
        viewport={{ once: true }}
        transition={{ 
          opacity: { duration: 1.5, ease: "easeOut" },
          y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
        }}
        className="absolute z-0 pointer-events-none"
        style={{ 
          width: '87.38px', 
          height: '88.3px', 
          top: '40%', 
          right: '-10px', 
        }}
      >
        <div style={{ width: '100%', height: '100%', transform: 'rotate(48.36deg)' }}>
          <Image src="/assets/images/Group_57.webp" alt="" fill className="object-cover opacity-50" />
        </div>
      </motion.div>

      {/* Top Section */}
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-[66px] pt-[80px] pb-[60px] relative z-10 flex flex-col h-full min-h-[400px]">
        
        {/* Logo */}
        <div className="mb-auto pb-[100px]">
          <Link href="/" className="inline-block cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#FFE419] rounded-sm">
            <motion.div whileHover={{ scale: 1.05 }} className="relative" style={{ width: '195px', height: '35px' }}>
              <Image 
                src="/logo.png" 
                alt="GigSecure Logo" 
                fill 
                className="object-contain object-left"
                priority
              />
            </motion.div>
          </Link>
        </div>

        {/* Text */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full mb-8 lg:mb-2"
          style={{ maxWidth: '609px' }}
        >
          <p 
            className="font-body text-white font-normal"
            style={{ fontSize: '24px', lineHeight: '28px', letterSpacing: '0%' }}
          >
            GigSecure evaluates your income patterns and work exposure to recommend coverage that fits how you actually earn.
          </p>
        </motion.div>

        {/* Navigation */}
        <motion.nav 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          aria-label="Footer Navigation"
          className="w-full flex lg:justify-end mt-4 lg:absolute lg:right-[1px] lg:bottom-[60px] lg:w-auto z-20"
        >
          <ul className="flex flex-wrap items-center gap-x-[32px] gap-y-4">
            {FOOTER_LINKS.map((link, index) => (
              <motion.li 
                key={`${link.label}-${index}`}
                whileHover={{ y: -2 }}
              >
                <Link 
                  href={link.href}
                  className="font-body text-white hover:text-[#FFE419] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE419] rounded-sm cursor-pointer"
                  style={{ fontSize: '16px', fontWeight: 500, lineHeight: '100%', letterSpacing: '0%' }}
                >
                  {link.label}
                </Link>
              </motion.li>
            ))}
          </ul>
        </motion.nav>

      </div>

      {/* Bottom Section: Copyright Bar */}
      <div className="w-full bg-[#1A1A1A]">
        <div className="mx-auto w-full max-w-7xl px-6 py-[24px] flex justify-center items-center">
          <p className="font-body text-white" style={{ fontSize: '20px', fontWeight: 700, lineHeight: '100%', letterSpacing: '0%' }}>
            @2026 All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
