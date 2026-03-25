'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/solid';

const BENEFITS = [
  "Calculated to fit unique gig patterns",
  "Centers on worker benefits",
  "Flexible, not rigidly tied to pay"
];

export default function BuiltForPeople() {
  return (
    <section className="bg-white w-full py-24 md:py-32 overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Column Text and Form */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <h2 className="font-heading text-4xl md:text-5xl lg:text-[56px] font-bold text-[#00676E] tracking-tight leading-tight">
              GigSecure is built for people<br className="hidden lg:block"/> like you.
            </h2>
            <p className="font-body text-base md:text-lg text-gray-700 font-medium">
              Compare risk compliance from assessment apps.
            </p>

            <div className="flex flex-col gap-4 my-6">
              {BENEFITS.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center justify-between border border-gray-200 rounded-md p-4 shadow-sm"
                >
                  <span className="font-body text-sm md:text-base font-semibold text-gray-800">{benefit}</span>
                  <SparklesIcon className="w-5 h-5 text-[#FFE419] flex-shrink-0 ml-4" />
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-0 mt-4 max-w-lg w-full">
              <input 
                type="email" 
                placeholder="Email Address"
                className="flex-1 w-full bg-[#F5F7F7] border border-gray-200 text-gray-800 font-body px-6 py-4 rounded-t-md sm:rounded-l-md sm:rounded-tr-none focus:outline-none focus:ring-2 focus:ring-[#00676E]"
                aria-label="Email Address"
              />
              <button 
                type="button"
                className="bg-[#FFE419] text-[#004E4C] font-bold font-body px-8 py-4 rounded-b-md sm:rounded-r-md sm:rounded-bl-none transition-colors hover:bg-[#FFE419]/90 focus:outline-none"
              >
                Get Started
              </button>
            </div>
            
          </motion.div>

          {/* Right Column Image */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative w-full h-[350px] sm:h-[450px] md:h-[500px] lg:h-[550px] rounded-[32px] overflow-hidden shadow-xl"
          >
            <Image
              src="/assets/images/risk-assessment/Rectangle_102.webp"
              alt="Man smiling in a red beanie using a laptop"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
