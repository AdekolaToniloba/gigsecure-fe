'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChartPieIcon } from '@heroicons/react/24/solid';
import { assetUrl, ASSETS } from '@/lib/assets';

const PILLS = [
  "Income Stability",
  "Safety Net Strength",
  "Equipment Dependency",
  "Health Stability",
  "Lifestyle Concentration"
];

export default function DashboardPreview() {
  return (
    <section className="bg-white w-full py-24 md:py-32 overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_458px] gap-16 lg:gap-20 items-start justify-items-center lg:justify-items-end">
          
          {/* Left Column: Image with floating pills */}
          <div className="relative w-full flex justify-center lg:justify-start mt-10 lg:mt-0" style={{ maxWidth: '681px' }}>
            
            {/* Background decorative vertical yellow bar */}
            <div 
              className="absolute bg-[#FFF9AA] z-0 hidden lg:block"
              style={{
                top: '-40px',
                left: '55%',
                width: '144px',
                height: '539px',
                borderRadius: '18px',
                transform: 'rotate(4.69deg)',
                transformOrigin: 'center'
              }}
            />

            {/* The Main Image Wrapper (No overflow-hidden so widget escapes) */}
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.7, ease: "easeOut" }}
               className="relative z-10 w-full"
            >
              {/* Actual Image container with overflow hidden */}
              <div 
                className="relative w-full bg-gray-100 overflow-hidden shadow-xl"
                style={{ height: '449px', borderRadius: '21px' }}
              >
                <Image
                  src={assetUrl(ASSETS.riskAssessment.rectangle117)}
                  alt="Smiling professional showing successful personalized risk dashboard integration"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 681px"
                />
              </div>

              {/* Top Left Dark Green Widget */}
              <motion.div 
                initial={{ opacity: 0, x: -20, y: -20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute bg-[#004E4C] flex flex-col items-center justify-center shadow-lg z-20"
                style={{ 
                  top: '30px', 
                  left: '-30px', 
                  width: '140px', 
                  height: '111px', 
                  borderRadius: '18px',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <ChartPieIcon className="w-8 h-8 text-white mb-2" />
                <span className="font-body text-[13px] font-medium text-white tracking-wide">Risk Score</span>
              </motion.div>

              {/* Bottom Floating Pills Overlay */}
              <div className="absolute bottom-6 left-0 right-0 z-20 flex flex-col items-center justify-center gap-[10px] w-full px-2" style={{ pointerEvents: 'none' }}>
                {/* Top Row - 3 pills */}
                <div className="flex flex-wrap sm:flex-nowrap gap-[10px] justify-center">
                  {[PILLS[0], PILLS[1], PILLS[2]].map((pill, index) => (
                    <motion.div
                      key={pill}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.2 + (index * 0.1) }}
                      className="bg-[#F5F7F7]/95 backdrop-blur-md shadow-sm border border-white/60 flex items-center justify-center px-1"
                      style={{ width: '193px', height: '53px', borderRadius: '3.08px' }}
                    >
                      <span className="font-body font-normal text-[#111827] text-center" style={{ fontSize: '15.49px', lineHeight: '23.23px' }}>
                        {pill}
                      </span>
                    </motion.div>
                  ))}
                </div>
                {/* Bottom Row - 2 pills */}
                <div className="flex flex-wrap sm:flex-nowrap gap-[10px] justify-center">
                  {[PILLS[3], PILLS[4]].map((pill, index) => (
                    <motion.div
                      key={pill}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
                      className="bg-[#F5F7F7]/95 backdrop-blur-md shadow-sm border border-white/60 flex items-center justify-center px-1"
                      style={{ width: '193px', height: '53px', borderRadius: '3.08px' }}
                    >
                      <span className="font-body font-normal text-[#111827] text-center" style={{ fontSize: '15.49px', lineHeight: '23.23px' }}>
                        {pill}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Text and Color Block */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col w-full h-full lg:mt-[100px]"
          >
            <p className="font-body text-[18px] md:text-[20px] font-normal text-gray-900 mb-4">
              What You'll Get
            </p>
            <h2 
              className="font-heading font-bold text-[#00676E] mb-8"
              style={{ fontSize: '36px', lineHeight: '100%', maxWidth: '458px' }}
            >
              Your Personalized Risk Dashboard
            </h2>

            <motion.div 
              initial={{ opacity: 0, scaleY: 0 }}
              whileInView={{ opacity: 1, scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="w-full h-[250px] sm:h-[300px] lg:h-[320px] bg-[#FFE419] rounded-[24px] shadow-sm origin-bottom"
              style={{ maxWidth: '458px' }}
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
