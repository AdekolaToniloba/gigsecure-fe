'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const BENEFITS = [
  "Early access to insurance comparisons",
  "Exclusive launch benefits",
  "Priority when new features drop"
];

export default function BuiltForPeople() {
  return (
    <section className="bg-white w-full py-24 md:py-32 overflow-hidden flex justify-center items-center">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-[1240px]">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center justify-between">
          
          {/* Left Column */}
          <div className="flex flex-col w-full max-w-[560px]">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="font-heading font-bold text-[#00676E] mb-6"
              style={{ fontSize: '40px', lineHeight: '50px', letterSpacing: '0%' }}
            >
              GigSecure is built for people like you.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-body text-gray-900 mb-10"
              style={{ fontSize: '18px', lineHeight: '28px', letterSpacing: '0%' }}
            >
              Everyone who completes the assessment gets:
            </motion.p>

            <div className="flex flex-col gap-4 mb-12">
              {BENEFITS.map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + (i * 0.1) }}
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="flex items-center justify-between bg-white cursor-pointer px-[20px]"
                  style={{ 
                    width: '100%', 
                    maxWidth: '420px', 
                    height: '72px', 
                    borderRadius: '9px',
                    border: '1px solid #00676E'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="flex items-center justify-center bg-[#00676E] text-white rounded-full flex-shrink-0"
                      style={{ width: '30px', height: '30px' }} 
                    >
                      <span className="font-body font-normal text-[14px]">{i + 1}</span>
                    </div>
                    <span 
                      className="font-body text-gray-900"
                      style={{ fontSize: '16px', lineHeight: '28px' }}
                    >
                      {text}
                    </span>
                  </div>
                  
                  {/* Decorative Cross Icon */}
                  <div 
                    className="relative flex-shrink-0" 
                    style={{ width: '23.25px', height: '23.49px', transform: 'rotate(-8.36deg)' }}
                  >
                    <Image src="/assets/images/Group_57.webp" alt="cross icon" fill className="object-contain " />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Email Input & Button Row */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center gap-[7px] w-full"
            >
              <input 
                type="email" 
                placeholder="Your email address"
                className="w-full sm:w-[371px] h-[66px] px-6 font-body text-[16px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00676E] transition-all"
                style={{
                  backgroundColor: '#EEEEF5CC',
                  border: '1px solid #004E4C96',
                  borderRadius: '10px'
                }}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-[221px] h-[66px] flex items-center justify-center font-body font-normal transition-colors hover:bg-[#EBD001] cursor-pointer"
                style={{
                  backgroundColor: '#FFE419',
                  border: '1px solid #004E4C',
                  borderRadius: '10px',
                  color: '#004E4C',
                  fontSize: '14px',
                  lineHeight: '28px'
                }}
              >
                You are early
              </motion.button>
            </motion.div>
          </div>

          {/* Right Column: Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative w-full shadow-md flex-shrink-0"
            style={{ maxWidth: '661px', height: '470px', borderRadius: '14px', overflow: 'hidden' }}
          >
            <Image
              src="/assets/images/risk-assessment/Rectangle_125.webp"
              alt="Man smiling in a red beanie using a laptop"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 661px"
              priority
            />
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
