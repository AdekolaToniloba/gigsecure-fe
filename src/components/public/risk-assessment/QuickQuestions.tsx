'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { assetUrl, ASSETS } from '@/lib/assets';

const STEPS = [
  "Answer a few simple questions about your work, income, risks, and safety net",
  "See where you're exposed and what matters most to protect",
  "Get your personalized risk dashboard instantly"
];

export default function QuickQuestions() {
  return (
    <section className="bg-[#FFF6D0] w-full py-24 md:py-32 flex justify-center items-center overflow-hidden">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-[1500px]"> 
        
        {/* The image container */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative w-full overflow-hidden shadow-lg mx-auto"
          style={{ maxWidth: '1430px', height: '470px', borderRadius: '14px' }}
        >
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src={assetUrl(ASSETS.riskAssessment.rectangle98)}
              alt="Woman smiling while holding smartphone"
              fill
              className="object-cover object-right sm:object-center"
              sizes="1430px"
              priority
            />
          </div>

          {/* Gradient Overlay for text readability (dark gradient from left) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#2B3131] via-[#2B3131]/90 to-transparent z-10 w-full sm:w-[70%]" />
          <div className="absolute inset-0 bg-black/20 z-10 sm:hidden" />

          {/* Content */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-12 lg:px-[69px]">
            
            <motion.h2 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="font-heading font-bold text-white mb-8 sm:mb-12"
              style={{ fontSize: '36px', lineHeight: '40px', maxWidth: '541px', letterSpacing: '0%' }}
            >
              Answer a few simple questions about your work, income, risks, and safety net
            </motion.h2>

            <div className="flex flex-col gap-[12px] sm:gap-[16px]">
              {STEPS.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 + (index * 0.1) }}
                  whileHover={{ scale: 1.01, backgroundColor: "#ffffff" }}
                  className="bg-[#F5F7F7] flex items-center px-4 sm:px-6 overflow-hidden cursor-pointer"
                  style={{ 
                    maxWidth: '770px', 
                    width: '100%', 
                    height: '53px', 
                    borderRadius: '5px', 
                    border: '0.62px solid #00676E' 
                  }}
                >
                  <span 
                    className="font-body text-[#111827] truncate w-full" 
                    style={{ fontSize: '20px', lineHeight: '30px', letterSpacing: '0%' }}
                  >
                    {step}
                  </span>
                </motion.div>
              ))}
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
