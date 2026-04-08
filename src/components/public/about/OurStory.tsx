'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { assetUrl, ASSETS } from '@/lib/assets';

const PILLS = [
  "What happens if income slows?",
  "What happens if one difficult month changes everything?",
  "What happens if I get sick?"
];

export default function OurStory() {
  return (
    <section className="bg-[#F5F7F7] w-full py-24 md:py-32">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-24 gap-y-16 items-start">
          
          {/* Top Left: Text block */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6 pt-4 lg:pt-16"
          >
            <h2 className="font-heading text-3xl md:text-4xl lg:text-[40px] font-bold text-gray-900 tracking-tight">
              Our Story
            </h2>
            <p className="font-body text-base md:text-[18px] text-gray-800 leading-relaxed font-medium max-w-[450px]">
              GigSecure was born from observing the courage and pressure behind gig work. The freedom is real, but so is the unpredictability.
            </p>
          </motion.div>

          {/* Top Right: Top Image */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full relative h-[300px] sm:h-[400px] md:h-[350px] lg:h-[450px] rounded-[32px] overflow-hidden shadow-sm"
          >
            <Image
              src={assetUrl(ASSETS.about.rectangle149)}
              alt="Gig worker in orange shirt focusing on laptop"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </motion.div>

          {/* Bottom Left: Bottom Image with Text */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col gap-6 w-full"
          >
            <div className="w-full relative h-[300px] sm:h-[400px] md:h-[350px] lg:h-[400px] rounded-[32px] overflow-hidden shadow-sm">
              <Image
                src={assetUrl(ASSETS.about.img21489206031)}
                alt="Independent worker sitting outside laughing"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <p className="font-body text-base md:text-[18px] text-gray-800 leading-relaxed font-medium">
              Behind every independent worker<br className="hidden sm:block"/> is a quiet concern:
            </p>
          </motion.div>

          {/* Bottom Right: Pill tags stacked vertically */}
          <div className="flex flex-col gap-6 justify-center lg:pl-4 pt-0 lg:pt-16">
            {PILLS.map((pill, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.3 + (index * 0.15) }}
                whileHover={{ scale: 1.02 }}
                className="bg-[#E4EDED] rounded-full py-4 px-6 sm:px-8 w-max max-w-full"
              >
                <span className="font-body text-gray-800 font-medium text-[15px] sm:text-[16px] block truncate">
                  {pill}
                </span>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
