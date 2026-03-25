'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

type FAQItem = {
  id: number;
  question: string;
  answer: string;
};

export default function FAQList({ faqs }: { faqs: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4" role="list">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;

        return (
          <motion.div
            key={faq.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
            whileHover={{ scale: 1.01 }}
            className={`flex flex-col rounded-3xl overflow-hidden transition-all duration-300 border ${
              isOpen ? 'bg-white border-[#004E4C]/10 shadow-lg' : 'bg-[#F2F4F7]/60 border-transparent hover:bg-white hover:border-gray-200 hover:shadow-md'
            }`}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex items-center justify-between w-full px-6 py-5 md:px-8 md:py-6 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-[#004E4C]/20 cursor-pointer group"
              aria-expanded={isOpen}
              aria-controls={`faq-page-answer-${faq.id}`}
              id={`faq-page-question-${faq.id}`}
            >
              <span className="font-heading text-base md:text-lg font-bold text-gray-900 pr-8 group-hover:text-[#004E4C] transition-colors duration-300">
                {faq.id}. {faq.question}
              </span>
              <span className={`flex-shrink-0 ml-4 p-1.5 md:p-2 rounded-full transition-all duration-300 shadow-sm ${isOpen ? 'bg-[#004E4C] text-white' : 'bg-[#004E4C] text-white group-hover:bg-[#3A7570] group-hover:scale-110'}`}>
                {isOpen ? (
                  <Minus className="h-5 w-5 stroke-[2.5]" />
                ) : (
                  <Plus className="h-5 w-5 stroke-[2.5]" />
                )}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`faq-page-answer-${faq.id}`}
                  role="region"
                  aria-labelledby={`faq-page-question-${faq.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden bg-white"
                >
                  <div className="px-6 pb-6 pt-0 md:px-8 md:pb-8 font-body text-sm md:text-base text-gray-600 leading-relaxed pr-12 md:pr-16">
                    <p>{faq.answer}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
