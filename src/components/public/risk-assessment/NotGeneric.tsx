'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { assetUrl, ASSETS } from '@/lib/assets';

export default function NotGeneric() {
  return (
    <section className="bg-[#FFF6D0] w-full py-24 md:py-32 overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 lg:gap-16 items-start">
          
          {/* Left Column */}
          <div className="flex flex-col gap-12 lg:pt-8 w-full max-w-[463px]">
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.6 }}
               className="flex flex-col gap-4"
            >
              <p className="font-body text-[20px] font-normal text-gray-800 leading-[30px]">
                Why This Is Different
              </p>
              <h2 className="font-heading text-[36px] font-bold text-gray-900 leading-[100%] max-w-[463px]">
                This isn't generic financial advice.
              </h2>
              <p className="font-body text-[20px] text-gray-800 font-normal leading-[30px] mt-2">
                It's built for people who:
              </p>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8, delay: 0.2 }}
               className="relative"
            >
              {/* Actual Image container */}
              <div 
                className="relative overflow-hidden shadow-sm"
                style={{ width: '100%', maxWidth: '322px', height: '309px', borderRadius: '14px' }}
              >
                <Image
                  src={assetUrl(ASSETS.riskAssessment.rectangle100)}
                  alt="Smiling woman standing in brick room"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 322px"
                />
              </div>

              {/* Decorative Cross Overlay */}
              <div 
                className="absolute z-0 hidden lg:block"
                style={{
                  width: '60.77px',
                  height: '61.42px',
                  top: '110px',
                  left: '305px', 
                  transform: 'rotate(-15.36deg)'
                }}
              >
                  <Image src={assetUrl(ASSETS.group57)} alt="cross" fill className="object-contain" />
              </div>

              {/* Left Image Pill */}
              <motion.div 
                 initial={{ opacity: 0, scale: 0.8 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.5, delay: 0.6, type: "spring" }}
                 className="absolute z-20 bg-[#EEF1FC]/95 backdrop-blur-sm shadow-sm flex items-center justify-center"
                 style={{ 
                   width: '365px', 
                   height: '50px', 
                   borderRadius: '31px',
                   borderWidth: '0.62px',
                   borderColor: '#00676E',
                   bottom: '10px',
                   left: '-20px'
                 }}
              >
                <span className="font-body text-[14px] font-medium text-gray-800 text-center block w-full">Invoice in naira, dollars, or both</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Column: Dynamic Image Grid */}
          <div className="relative w-full lg:w-[680px] flex flex-col sm:flex-row gap-[17px] justify-center lg:justify-end mt-16 lg:mt-0 pb-12">
            
            {/* Left side of the grid */}
            <div className="flex flex-col gap-[32px] w-full max-w-[322px]">
              {/* Top Left Image */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="relative shadow-none"
                style={{ width: '100%', maxWidth: '322px', height: '290px' }}
              >
                 <Image src={assetUrl(ASSETS.riskAssessment.rectangle92)} alt="Woman at laptop" fill className="object-cover shadow-sm" sizes="(max-width: 768px) 100vw, 322px" />
                 <div 
                   className="absolute bg-[#EEF1FC]/95 backdrop-blur-sm shadow-md flex items-center justify-center z-10"
                   style={{ width: '235px', height: '67px', borderRadius: '31px', borderWidth: '0.62px', borderColor: '#00676E', bottom: '-25.5px', left: '43.5px' }}
                 >
                   <span className="font-body text-[13px] font-medium text-gray-800 text-center px-4 leading-tight">Juggle multiple clients and unpredictable income</span>
                 </div>
              </motion.div>

              {/* Bottom Left Image */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="relative shadow-none"
                style={{ width: '100%', maxWidth: '322px', height: '325px' }}
              >
                 <Image src={assetUrl(ASSETS.riskAssessment.rectangle103)} alt="Person working" fill className="object-cover object-top shadow-sm" sizes="(max-width: 768px) 100vw, 322px" />
                 <div 
                   className="absolute bg-[#EEF1FC]/95 backdrop-blur-sm shadow-md flex items-center justify-center z-10 p-2"
                   style={{ width: '200px', height: '61px', borderRadius: '31px', borderWidth: '0.62px', borderColor: '#00676E', bottom: '20px', left: '20px' }}
                 >
                   <span className="font-body text-[13px] font-medium text-gray-800 text-center leading-tight px-2">Depend on laptops, power, and internet</span>
                 </div>
              </motion.div>
            </div>

            {/* Right side of the grid */}
            <div className="flex flex-col gap-[18px] w-full max-w-[322px]">
              {/* Top Right Image */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="relative shadow-none"
                style={{ width: '100%', maxWidth: '322px', height: '249px' }}
              >
                 <Image src={assetUrl(ASSETS.riskAssessment.rectangle102)} alt="Girl working outdoors" fill className="object-cover shadow-sm" sizes="(max-width: 768px) 100vw, 322px" />
                 <div 
                   className="absolute bg-[#EEF1FC]/95 backdrop-blur-sm shadow-md flex items-center justify-center z-10"
                   style={{ width: '149.97px', height: '48px', borderRadius: '31px', borderWidth: '0.62px', borderColor: '#00676E', bottom: '-10px', left: '86px' }}
                 >
                   <span className="font-body text-[13px] font-medium text-gray-800 text-center">Work flexibly</span>
                 </div>
              </motion.div>

              {/* Bottom Right Image */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="relative shadow-none"
                style={{ width: '100%', maxWidth: '322px', height: '380px' }}
              >
                 <Image src={assetUrl(ASSETS.riskAssessment.rectangle101)} alt="Guy focusing with headset" fill className="object-cover rounded-[14px] shadow-sm" sizes="(max-width: 768px) 100vw, 322px" />
                 <div 
                   className="absolute bg-[#EEF1FC]/95 backdrop-blur-sm shadow-md flex items-center justify-center z-10"
                   style={{ width: '267px', height: '48px', borderRadius: '31px', borderWidth: '0.62px', borderColor: '#00676E', bottom: '45px', left: '27.5px' }}
                 >
                   <span className="font-body text-[13px] font-medium text-gray-800 text-center">In other words, your actual life.</span>
                 </div>
              </motion.div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
