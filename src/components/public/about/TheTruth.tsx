'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const IMAGES = [
  { src: '/assets/images/about/Rectangle_146.webp', alt: 'Gig worker smiling' },
  { src: '/assets/images/about/Rectangle_133.webp', alt: 'Independent professional' },
  { src: '/assets/images/about/Rectangle_129.webp', alt: 'Freelancer working' },
];

export default function TheTruth() {
  return (
    <section className="bg-white w-full py-20 overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-4"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900">
              The Truth Behind GigSecure
            </h2>
            <p className="font-body text-base md:text-lg text-gray-700 leading-relaxed font-medium mt-2">
              The gig economy in Africa is vibrant, dynamic, and full of limitless potential. However, the reality for those who power it is very different. Traditional insurance structures, built decades ago, are stubbornly inflexible and are designed for a 9-to-5 reality.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col pt-2 lg:pt-14"
          >
            <p className="font-body text-base md:text-lg text-gray-700 leading-relaxed">
              Our risk assessment platform provides an already proven form of forecasting targeted proportionally towards the individual limit.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="w-full flex gap-[10px]">
        {IMAGES.map((img, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            className="relative h-[250px] sm:h-[350px] md:h-[450px] flex-1 overflow-hidden"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="(max-width: 768px) 33vw, 33vw"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
