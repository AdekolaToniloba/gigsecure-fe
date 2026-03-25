'use client';

import { motion, Variants } from 'framer-motion';

const FEATURES = [
  {
    id: 1,
    title: 'Easy Onboarding',
    description:
      'Complete a short assessment and receive coverage recommendations within minutes.',
  },
  {
    id: 2,
    title: 'Standardized Data',
    description:
      'Coverage plans are tailored based on how you earn, not just how much you earn.',
  },
  {
    id: 3,
    title: 'Flexible Products',
    description:
      'Monthly and adjustable options designed for variable income streams.',
  },
  {
    id: 4,
    title: 'Simplified Claims',
    description:
      'Submit claims digitally with a streamlined review process.',
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 30 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', bounce: 0.4 } }
};

export default function Features() {
  return (
    <section className="bg-white py-24 w-full">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        
        {/* Header Block */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4 max-w-3xl mb-16"
        >
          <h2 className="font-heading text-4xl lg:text-5xl font-bold tracking-tight text-[#334155] leading-tight">
            Designed for the Gig Economy. <br className="hidden md:block" />
            Simplified for Independent Work.
          </h2>
          <p className="font-body text-xl text-slate-500 leading-relaxed">
            GigSecure provides flexible insurance solutions built around how gig
            workers earn, operate, and manage risk.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {FEATURES.map((feature, index) => {
            const isOdd = index % 2 === 0;
            const cardBg = isOdd ? 'bg-[#FFF9E5]' : 'bg-[#1B696C1F]';
            const badgeBg = isOdd ? 'bg-[#FFE419]' : 'bg-[#004E4C]';
            const badgeTextColor = isOdd ? 'text-[#004E4C]' : 'text-white';
            
            return (
              <motion.div
                variants={cardVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                key={feature.id}
                className={`flex flex-col rounded-3xl p-8 pt-12 text-center items-center shadow-sm cursor-pointer transition-shadow hover:shadow-xl ${cardBg}`}
              >
                {/* Number Badge */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full mb-8 font-heading text-xl font-bold ${badgeBg} ${badgeTextColor}`}
                  aria-hidden="true"
                >
                  {feature.id}
                </div>

                {/* Text Content */}
                <h3 className="font-heading text-[#334155] text-[22px] font-bold mb-4">
                  {feature.title}
                </h3>
                <p className="font-body text-[#334155]/80 text-base leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
