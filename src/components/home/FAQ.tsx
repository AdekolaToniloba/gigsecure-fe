'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const FAQ_DATA = [
  {
    id: 1,
    question: 'Is GigSecure a real insurance company?',
    answer: 'GigSecure is a registered intermediary platform in Nigeria. We partner with licensed insurance companies to offer coverage that fits the dynamic nature of gig work.',
  },
  {
    id: 2,
    question: 'Does GigSecure sell insurance directly?',
    answer: 'No, GigSecure connects freelancers and gig workers to insurance options that fit irregular income and modern work patterns.',
  },
  {
    id: 3,
    question: 'Why should I trust GigSecure?',
    answer: 'GigSecure was built for gig workers who struggle to find suitable insurance. The risk assessment is free, there is no pressure to buy coverage, and your data is not sold.',
  },
];

export default function FAQ() {
  // Track the index of the open question. -1 means all closed.
  const [openIndex, setOpenIndex] = useState<number>(2); // Default open the last one as shown in screenshot

  return (
    <section className="bg-[#004E4C] py-24 w-full overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        
        {/* Animated Heading */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-16 md:mb-20 flex justify-center"
        >
          <h2 className="font-heading text-4xl lg:text-4xl font-bold tracking-tight text-[#FFE419] text-center max-w-2xl leading-tight">
            Everything You Need to Know Before <br className="hidden md:block" /> You Get Covered
          </h2>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-start">
          
          {/* Left Column: Visual Image Layout */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex justify-center lg:justify-start pt-4 relative w-full"
          >
            <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl z-10 mx-auto lg:mx-0">
              {/* Top Left Yellow Geometric Decorative Accent */}
              <div 
                className="absolute -top-8 -left-6 sm:-left-10 w-24 sm:w-32 h-32 sm:h-40 bg-[#FFE419] -rotate-[15deg] z-[-1]" 
                aria-hidden="true" 
              />
              
              {/* Bottom Left Yellow Geometric Decorative Accent */}
              <div 
                className="absolute -bottom-6 left-12 w-24 sm:w-32 h-16 sm:h-24 bg-[#FFE419] rotate-[10deg] z-[-1]" 
                aria-hidden="true" 
              />
              
              <div className="relative w-full h-full overflow-hidden rounded-3xl shadow-xl z-10">
                <Image
                  src="/assets/images/7aaf320626defa49daffc84b4be9093d38323454.webp"
                  alt="Delivery rider handing a package to a customer"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive Accordion FAQ */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="flex flex-col gap-4 w-full"
            role="list"
          >
            {FAQ_DATA.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <motion.div 
                  key={faq.id} 
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col rounded-3xl overflow-hidden transition-colors duration-300 ${isOpen ? 'bg-[#3A7570]' : 'bg-[#3A7570]/80 hover:bg-[#3A7570]'}`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="flex items-center justify-between w-full px-8 py-6 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FFE419]/50 cursor-pointer"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                    id={`faq-question-${faq.id}`}
                  >
                    <span className="font-heading text-lg font-bold text-white">
                      {faq.question}
                    </span>
                    <span className="flex-shrink-0 ml-4 text-white p-1 rounded-full bg-transparent hover:bg-white/10 transition-colors">
                      {isOpen ? (
                        <Minus className="h-6 w-6 stroke-[3]" />
                      ) : (
                        <Plus className="h-6 w-6 stroke-[3]" />
                      )}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${faq.id}`}
                        role="region"
                        aria-labelledby={`faq-question-${faq.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-8 pb-8 pt-0 font-body text-base md:text-lg text-white/90 leading-relaxed pr-12">
                          <p>{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* View All Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
              whileHover={{ scale: 1.01 }}
            >
              <Link
                href="/faq"
                className="flex items-center justify-between w-full px-8 py-6 rounded-3xl overflow-hidden bg-[#3A7570]/80 hover:bg-[#3A7570] transition-colors duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FFE419]/50"
              >
                <span className="font-heading text-lg font-bold text-[#FFE419]">
                  View all
                </span>
                <span className="flex-shrink-0 ml-4 text-white p-1 rounded-full bg-transparent hover:bg-white/10 transition-colors">
                  <Plus className="h-6 w-6 stroke-[3]" />
                </span>
              </Link>
            </motion.div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
