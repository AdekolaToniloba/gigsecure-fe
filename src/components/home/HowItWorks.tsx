'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { assetUrl, ASSETS } from '@/lib/assets';

const STEPS = [
  {
    id: 1,
    title: 'Sign up',
    description:
      'Create your account in minutes and tell us about your work, income pattern, and role.',
    isActive: true,
  },
  {
    id: 2,
    title: 'Take the Risk Assessment',
    description:
      'Answer a short, structured assessment covering income stability, client concentration, and operational exposure.',
    isActive: false,
  },
  {
    id: 3,
    title: 'Get Your Risk Score',
    description:
      'Receive a clear risk profile with coverage recommendations tailored to how you earn.',
    isActive: false,
  },
];

const staggerList: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.3 }
  }
};

const stepItemVariant: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  hover: { x: 8 }
};

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState<number>(1);

  return (
    <section className="bg-slate-50 py-24 w-full overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        
        {/* Title */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 md:mb-20"
        >
          <h2 className="font-heading text-4xl lg:text-5xl font-bold tracking-tight text-[#334155]">
            How Gig Secure Works
          </h2>
        </motion.div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          
          {/* Left Column: Image & Decorations */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-full max-w-md mx-auto lg:max-w-full lg:mx-0 flex justify-center lg:justify-start"
          >
            <div className="relative w-full sm:w-[450px] aspect-[4/5] sm:aspect-square z-10">
              
              {/* Decorative Block 1: Floating */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute -right-12 sm:-right-16 top-12 sm:top-24 w-40 sm:w-64 h-16 sm:h-24 bg-[#00676E] -rotate-[30deg] z-[-1]"
                aria-hidden="true"
              />
              {/* Decorative Block 2: Floating */}
              <motion.div 
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -left-8 sm:-left-12 bottom-8 sm:bottom-16 w-32 sm:w-48 h-16 sm:h-24 bg-[#00676E] -rotate-[30deg] z-[-1]"
                aria-hidden="true"
              />
              
              <Image
                src={assetUrl(ASSETS.e24691b767ceaed733586e12832b4d03537422cc)}
                alt="Delivery rider looking at package and phone"
                fill
                className="object-cover rounded-3xl cursor-pointer transition-transform hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </motion.div>

          {/* Right Column: Timeline Stepper */}
          <motion.div 
            variants={staggerList}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="flex flex-col w-full max-w-xl mx-auto lg:mx-0"
          >
            {STEPS.map((step) => {
              const isActive = step.id === activeStep;
              return (
                <motion.div 
                  variants={stepItemVariant}
                  whileHover="hover"
                  onMouseEnter={() => setActiveStep(step.id)}
                  key={step.id} 
                  className="relative flex pl-8 md:pl-12 py-6 cursor-pointer"
                >
                  {/* Vertical Line Container */}
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-slate-200 overflow-hidden">
                    {/* Active Overlay Line animating downwards */}
                    <motion.div 
                      initial={false}
                      animate={{ height: isActive ? '100%' : 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="absolute top-0 left-0 w-full bg-[#004E4C]" 
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="font-heading text-[#1A1A1A] text-xl font-bold">
                      {step.title}
                    </h3>
                    <p className="font-body text-[#334155] text-lg leading-relaxed max-w-md">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
