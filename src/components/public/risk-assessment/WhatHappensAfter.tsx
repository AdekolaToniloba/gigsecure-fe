'use client';

import { motion } from 'framer-motion';

const LIST_ITEMS = [
  "Income protection",
  "Gadget & equipment cover",
  "Health protection",
  "Emergency cash backup"
];

export default function WhatHappensAfter() {
  return (
    <section className="bg-white w-full py-24 md:py-32 overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col xl:flex-row gap-16 lg:gap-20 items-center justify-between">
          
          {/* Left Column: Text & Grid */}
          <div className="flex flex-col gap-10 w-full max-w-[644px]">
            <motion.div
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6 }}
            >
              <h2 
                className="font-heading font-bold text-gray-900 mb-6"
                style={{ fontSize: '36px', lineHeight: '100%', maxWidth: '346px' }}
              >
                What Happens After
              </h2>
              <p 
                className="font-body font-normal text-gray-800"
                style={{ fontSize: '20px', lineHeight: '30px', maxWidth: '644px' }}
              >
                You’ll see a preview of your personalized protection plan.<br/>
                Clarity on what areas of protection matter most for your kind of gig work.
              </p>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6, delay: 0.2 }}
               className="grid grid-cols-1 sm:grid-cols-2 gap-[24px] mt-4"
            >
              {LIST_ITEMS.map((text, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ y: -2 }}
                  className="flex items-center gap-[16px] bg-white"
                  style={{ 
                    width: '100%', 
                    maxWidth: '315px', 
                    height: '85px', 
                    borderRadius: '9px', 
                    border: '1px solid #00676E',
                    padding: '0 20px'
                  }}
                >
                  <div className="flex items-center justify-center bg-[#00676E] text-white rounded-full flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                    <span className="font-body font-bold text-[18px]">{i + 1}</span>
                  </div>
                  <span className="font-body font-normal text-gray-900" style={{ fontSize: '18px', lineHeight: '30px' }}>
                    {text}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Chart */}
          <div className="relative flex justify-center w-full lg:max-w-[661px] xl:justify-end xl:mt-0 mt-8">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               className="relative bg-[#E4EDED] flex items-center justify-center w-full shadow-sm"
               style={{ height: '470px', borderRadius: '14px', maxWidth: '661px' }}
            >
               {/* The Donut Chart */}
               <motion.div 
                 initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                 whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 1, type: 'spring', delay: 0.2 }}
                 className="relative w-[230px] sm:w-[260px] aspect-square rounded-full shadow-md flex items-center justify-center"
                 style={{
                   background: 'conic-gradient(#034C51 0% 25%, #00676E 25% 60%, #FFE419 60% 75%, #EB9B20 75% 100%)'
                 }}
               >
                 {/* Inner Mask (Hole) */}
                 <div className="w-[130px] sm:w-[150px] aspect-square bg-[#E4EDED] rounded-full shadow-inner" />
               </motion.div>

               {/* Top Left Floating Icon */}
               <motion.div 
                 initial={{ opacity: 0, x: -30, y: -30 }}
                 whileInView={{ opacity: 1, x: 0, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.6, delay: 0.6 }}
                 className="absolute bg-[#FFD525] flex items-center justify-center shadow-lg"
                 style={{ width: '85px', height: '75px', borderRadius: '11px', border: '1px solid #EBD001', top: '23%', left: '8%' }} 
               >
                 <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#004E4C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                   <polyline points="3 3 3 21 21 21" />
                   <polyline points="6 14 11 18 16 11 20 14" />
                 </svg>
               </motion.div>

               {/* Bottom Right Floating Icon */}
               <motion.div 
                 initial={{ opacity: 0, x: 30, y: 30 }}
                 whileInView={{ opacity: 1, x: 0, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.6, delay: 0.8 }}
                 className="absolute bg-[#00676E] shadow-lg flex items-center justify-center"
                 style={{ width: '85px', height: '75px', borderRadius: '11px', bottom: '15%', right: '12%' }}
               >
                 <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <rect x="2" y="6" width="20" height="12" rx="2" />
                   <circle cx="12" cy="12" r="3" />
                   <circle cx="6" cy="10" r="0.5" fill="white"/>
                   <circle cx="6" cy="14" r="0.5" fill="white"/>
                   <circle cx="18" cy="10" r="0.5" fill="white"/>
                   <circle cx="18" cy="14" r="0.5" fill="white"/>
                 </svg>
               </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
