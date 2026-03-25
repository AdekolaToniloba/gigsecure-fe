'use client';

import { motion } from 'framer-motion';

export default function BottomStatement() {
  return (
    <section className="bg-white w-full py-24 md:py-32">
      <div className="mx-auto w-full max-w-4xl px-6 lg:px-8 text-center flex flex-col items-center justify-center">
        <motion.h3 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="font-body text-2xl md:text-3xl lg:text-4xl text-gray-900 leading-relaxed md:leading-normal font-medium"
        >
          We believe protection should reflect real life - not a template built for another world. That belief became GigSecure.
        </motion.h3>
      </div>
    </section>
  );
}
