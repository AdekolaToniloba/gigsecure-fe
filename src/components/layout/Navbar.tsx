'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { assetUrl, ASSETS } from '@/lib/assets';

const NAV_LINKS = [
  { name: 'About', href: '/about' },
  { name: 'Blog', href: '/blog' },
  { name: 'Marketplace', href: '/marketplace' },
  { name: 'Risk Assessment', href: '/risk-assessment' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full ${
        isScrolled ? 'bg-[#004E4C]/95 backdrop-blur-md shadow-md' : 'bg-[#004E4C]'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* ─── Logo ────────────────────────────────────────────────────────── */}
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm cursor-pointer"
          aria-label={`${APP_NAME} home`}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image
              src={assetUrl(ASSETS.logo)}
              alt={APP_NAME}
              width={160}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
          </motion.div>
        </Link>

        {/* ─── Desktop Links & CTA ─────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-10">
          <ul className="flex items-center gap-10" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className="group relative font-body text-[18px] font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm inline-block py-1 cursor-pointer"
                >
                  {link.name}
                  {/* Subtle hover underline animation */}
                  <motion.span
                    className="absolute -bottom-1 left-0 h-[2px] w-0 bg-accent transition-all duration-300 group-hover:w-full"
                    aria-hidden="true"
                  />
                  {/* Active state indicator (optional based on pathname) */}
                  {pathname === link.href && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      className="absolute -bottom-1 left-0 h-[2px] w-full bg-accent"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex"
          >
            <Link
              href="/waitlist"
              className="flex w-[201px] h-[53px] items-center justify-center rounded-[5px] bg-[#FFE419] px-[11px] py-[17px] text-center font-body text-[18px] font-semibold tracking-tight text-[#00676E] shadow-sm transition-colors hover:bg-[#FFE419]/90 outline-none focus-visible:ring-4 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#004E4C] cursor-pointer"
              aria-label="Take the Assessment"
            >
              Take the Assessment
            </Link>
          </motion.div> */}
        </div>

        {/* ─── Mobile Menu Toggle ──────────────────────────────────────────── */}
        <div className="flex md:hidden">
          <button
            type="button"
            className="text-white outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md p-2 -mr-2 cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMobileMenuOpen ? "Close main menu" : "Open main menu"}
          >
            <span className="sr-only">
              {isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            </span>
            <AnimatePresence mode="wait" initial={false}>
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-7 w-7" aria-hidden="true" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-7 w-7" aria-hidden="true" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* ─── Mobile Menu Dropdown ────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-[#004E4C] shadow-xl"
          >
            <div className="space-y-1 px-6 pb-8 pt-4">
              <ul className="flex flex-col gap-4" role="list">
                {NAV_LINKS.map((link) => (
                  <motion.li
                    key={link.name}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Link
                      href={link.href}
                      className={`block font-body text-xl font-medium py-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer ${
                        pathname === link.href ? 'text-accent' : 'text-white'
                      }`}
                    >
                      {link.name}
                    </Link>
                  </motion.li>
                ))}
                
                {/* <motion.li
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="pt-6"
                >
                  <Link
                    href="/waitlist"
                    className="flex h-[53px] w-full items-center justify-center rounded-[5px] bg-[#FFE419] text-center font-body text-[18px] font-semibold tracking-tight text-[#00676E] shadow-sm active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#004E4C] cursor-pointer"
                    aria-label="Take the Assessment"
                  >
                    Take the Assessment
                  </Link>
                </motion.li> */}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
