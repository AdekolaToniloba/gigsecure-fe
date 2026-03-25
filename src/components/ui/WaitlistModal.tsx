'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Check, Lock, X } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useWaitlistSignup } from '@/hooks/auth/useAuth';
import { waitlistSignupRequestSchema, type WaitlistSignupRequest } from '@/lib/validators/auth';

const BENEFITS = [
  "Be first to compare and activate coverage plans",
  "Exclusive launch pricing locked in before public release",
  "Your risk profile saved and ready when we launch"
];

export default function WaitlistModal() {
  const { activeModal, closeModal } = useUIStore();
  const isOpen = activeModal === 'waitlist';
  const { mutateAsync: signup, isPending } = useWaitlistSignup();
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WaitlistSignupRequest>({
    resolver: zodResolver(waitlistSignupRequestSchema),
  });

  // Reset state when modal is toggled
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setFormError('');
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: WaitlistSignupRequest) => {
    try {
      setFormError('');
      await signup(data);
      setIsSuccess(true);
      setTimeout(() => {
        closeModal();
      }, 3000);
    } catch (error: any) {
      setFormError(error?.message || 'Something went wrong. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 w-full h-full">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="absolute inset-0 bg-[#000000]/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-[550px] overflow-hidden rounded-[24px] bg-white shadow-2xl z-10"
        >
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

          {/* Top Section - Dark Green */}
          <div className="bg-[#004E4C] px-8 py-10 flex flex-col items-center text-center relative overflow-hidden">
            {/* Inner background graphics (optional subtle glow) */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="flex h-12 w-16 items-center justify-center rounded-[8px] bg-white/10 mb-6 relative">
              <Mail className="text-[#FFE419] h-6 w-6" />
            </div>

            <h2 className="text-[#FFE419] font-heading text-[28px] sm:text-[32px] font-bold leading-tight mb-4">
              Join the early access list
            </h2>

            <p className="text-white/90 font-body text-[16px] max-w-[400px] leading-relaxed">
              You're among the first freelancers shaping GigSecure.
              Drop your email and we'll reach out the moment coverage goes live.
            </p>
          </div>

          {/* Bottom Section - White */}
          <div className="px-8 py-8">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="h-16 w-16 bg-[#52B788]/20 rounded-full flex items-center justify-center mb-6">
                  <Check className="h-8 w-8 text-[#52B788]" />
                </div>
                <h3 className="text-[20px] font-bold text-[#004E4C] mb-2 font-heading">You are on the list!</h3>
                <p className="text-gray-600 text-center font-body">Thank you for joining. We will be in touch soon.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4 mb-8">
                  {BENEFITS.map((text, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#004E4C] flex-shrink-0 mt-0.5">
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </div>
                      <span className="font-body text-[#334155] text-[15px] leading-tight pt-[2px]">
                        {text}
                      </span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-[#334155] mb-1.5 font-body">
                      Your Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      className="w-full h-[52px] rounded-lg border border-gray-200 bg-[#F8FAFC] px-4 font-body text-[15px] text-gray-900 focus:border-[#004E4C] focus:outline-none focus:ring-1 focus:ring-[#004E4C] transition-colors"
                      placeholder="e.g. hello@example.com"
                    />
                    {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-bold text-[#334155] mb-1.5 font-body">
                        First Name
                      </label>
                      <input
                        id="first_name"
                        type="text"
                        {...register('first_name')}
                        className="w-full h-[52px] rounded-lg border border-gray-200 bg-[#F8FAFC] px-4 font-body text-[15px] text-gray-900 focus:border-[#004E4C] focus:outline-none focus:ring-1 focus:ring-[#004E4C] transition-colors"
                        placeholder="John"
                      />
                      {errors.first_name && <p className="mt-1.5 text-sm text-red-500">{errors.first_name.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="last_name" className="block text-sm font-bold text-[#334155] mb-1.5 font-body">
                        Last Name
                      </label>
                      <input
                        id="last_name"
                        type="text"
                        {...register('last_name')}
                        className="w-full h-[52px] rounded-lg border border-gray-200 bg-[#F8FAFC] px-4 font-body text-[15px] text-gray-900 focus:border-[#004E4C] focus:outline-none focus:ring-1 focus:ring-[#004E4C] transition-colors"
                        placeholder="Doe"
                      />
                      {errors.last_name && <p className="mt-1.5 text-sm text-red-500">{errors.last_name.message}</p>}
                    </div>
                  </div>
                  
                  {formError && (
                    <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-md text-sm">
                      {formError}
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isPending}
                    type="submit"
                    className="w-full h-[56px] rounded-lg bg-[#FFE419] font-body text-[16px] font-bold text-[#004E4C] shadow-sm transition-colors hover:bg-[#EBD001] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004E4C] disabled:opacity-70 disabled:cursor-not-allowed mt-2 cursor-pointer"
                  >
                    {isPending ? 'Securing Spot...' : 'Secure my Spot'}
                  </motion.button>
                </form>

                <div className="mt-6 flex items-start gap-3 px-2">
                  <Lock className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                  <p className="text-[13px] text-gray-500 leading-tight font-body">
                    We'll only contact you about GigSecure. No spam, no third-party sharing. 
                    Unsubscribe anytime.
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
