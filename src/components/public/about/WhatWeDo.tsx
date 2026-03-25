'use client';

import { motion } from 'framer-motion';

export default function WhatWeDo() {
  return (
    <section className="bg-white w-full py-24 md:py-32">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-start">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <h2 className="font-heading text-3xl md:text-4xl lg:text-[40px] font-bold text-gray-900 tracking-tight">
              What We Do
            </h2>
            <p className="font-body text-base md:text-lg text-gray-700 leading-relaxed">
              GigSecure is a protection platform built specifically for gig workers. Through automated profiling, we continuously identify, assess the right protection products, and make dynamically curated suggestions based on exposure.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col pt-2 lg:pt-16"
          >
            <p className="font-body text-base md:text-lg text-gray-700 leading-relaxed">
              Our platform works via unit profiling, tailored recommendations, and access to curated financial and protection solutions designed around the realities of gig work: distributed platforms, fluctuating base pay, and variable hours.
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
